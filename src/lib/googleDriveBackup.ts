// Google Drive Real-time Cloud Backup Integration for FINORA
// Uses Google Identity Services (GSI) OAuth 2.0 Token Client & Google Drive v3 REST API

export interface GoogleDriveFile {
  id: string;
  name: string;
  createdTime: string;
  size?: string;
  mimeType: string;
  webViewLink?: string;
  userEmail?: string;
}

export interface GoogleDriveStatus {
  isConnected: boolean;
  userEmail?: string;
  userName?: string;
  lastSyncTime?: string;
  autoSyncEnabled: boolean;
  folderName: string;
}

export const GDRIVE_FOLDER_NAME = 'FINORA_Financial_Backups';

// Official Google Cloud OAuth Client ID provisioned for FINORA
export const DEFAULT_GOOGLE_CLIENT_ID = 
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID) ||
  '874801210488-hk4t3sflhaqktfcsgcnutcc1ghom1hp4.apps.googleusercontent.com';

const STORAGE_KEY_GDRIVE_TOKEN = 'finora_gdrive_access_token';
const STORAGE_KEY_GDRIVE_USER = 'finora_gdrive_user_info';
const STORAGE_KEY_GDRIVE_SETTINGS = 'finora_gdrive_settings';

const getScopedKey = (baseKey: string, userKey?: string): string => {
  if (!userKey || userKey === 'guest') return baseKey;
  return `${baseKey}_${userKey.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
};

export const getGoogleDriveSettings = (userKey?: string): { autoSync: boolean; scheduledTime: string } => {
  try {
    const raw = localStorage.getItem(getScopedKey(STORAGE_KEY_GDRIVE_SETTINGS, userKey));
    if (!raw) return { autoSync: true, scheduledTime: '23:00' };
    return JSON.parse(raw);
  } catch {
    return { autoSync: true, scheduledTime: '23:00' };
  }
};

export const saveGoogleDriveSettings = (settings: { autoSync: boolean; scheduledTime: string }, userKey?: string) => {
  localStorage.setItem(getScopedKey(STORAGE_KEY_GDRIVE_SETTINGS, userKey), JSON.stringify(settings));
};

export const getStoredGoogleDriveToken = (userKey?: string): string | null => {
  try {
    const key = getScopedKey(STORAGE_KEY_GDRIVE_TOKEN, userKey);
    const data = localStorage.getItem(key);
    if (!data) return null;
    const parsed = JSON.parse(data);
    if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
      localStorage.removeItem(key);
      return null;
    }
    return parsed.token || null;
  } catch {
    return null;
  }
};

export const saveGoogleDriveToken = (
  token: string,
  expiresInSeconds: number = 3600,
  email?: string,
  name?: string,
  userKey?: string
) => {
  const expiresAt = Date.now() + (expiresInSeconds - 60) * 1000;
  localStorage.setItem(
    getScopedKey(STORAGE_KEY_GDRIVE_TOKEN, userKey),
    JSON.stringify({ token, expiresAt })
  );
  if (email || name) {
    const updated = {
      email: email || '',
      name: name || (email ? email.split('@')[0] : 'User')
    };
    localStorage.setItem(
      getScopedKey(STORAGE_KEY_GDRIVE_USER, userKey),
      JSON.stringify(updated)
    );
  }
};

export const clearGoogleDriveSession = (userKey?: string) => {
  localStorage.removeItem(getScopedKey(STORAGE_KEY_GDRIVE_TOKEN, userKey));
  localStorage.removeItem(getScopedKey(STORAGE_KEY_GDRIVE_USER, userKey));
};

export const getGoogleDriveUserInfo = (userKey?: string): { email?: string; name?: string } | null => {
  try {
    const raw = localStorage.getItem(getScopedKey(STORAGE_KEY_GDRIVE_USER, userKey));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

// Wait for Google Identity Services (GSI) library to load
export const loadGoogleGsiScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && (window as any).google?.accounts?.oauth2) {
      resolve();
      return;
    }
    const existing = document.getElementById('google-gsi-client');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', (e) => reject(e));
      return;
    }
    const script = document.createElement('script');
    script.id = 'google-gsi-client';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (e) => reject(e);
    document.head.appendChild(script);
  });
};

/**
 * Initiates the Google OAuth 2.0 Account Picker and Drive Scope Consent flow.
 * Shows native Google Account Selector popup so the user can choose ANY of their
 * Google accounts (or sign into a different one) and grant permission for personal Drive storage.
 */
export const requestGoogleDriveAccess = async (
  userKey?: string,
  clientId?: string
): Promise<{ token: string; email: string; name: string }> => {
  await loadGoogleGsiScript();

  const google = (window as any).google;
  if (!google?.accounts?.oauth2) {
    throw new Error('Google Identity Services লোড করা সম্ভব হয়নি। অনুগ্রহ করে ইন্টারনেট সংযোগ চেক করুন বা পেজটি রিলোড দিন।');
  }

  const effectiveClientId = clientId || DEFAULT_GOOGLE_CLIENT_ID;

  return new Promise((resolve, reject) => {
    try {
      const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: effectiveClientId,
        scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.appdata email profile',
        prompt: 'select_account', // Forces Google Account Selector prompt
        callback: async (tokenResponse: any) => {
          if (tokenResponse.error) {
            reject(new Error(`গুগল ড্রাইভ অথেনটিকেশন ব্যর্থ: ${tokenResponse.error_description || tokenResponse.error}`));
            return;
          }

          const accessToken = tokenResponse.access_token;
          if (!accessToken) {
            reject(new Error('কোনো এক্সেস টোকেন পাওয়া যায়নি।'));
            return;
          }

          const expiresIn = tokenResponse.expires_in ? parseInt(tokenResponse.expires_in, 10) : 3600;

          // Fetch the chosen Google Account profile
          let userEmail = '';
          let userName = '';
          try {
            const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (userRes.ok) {
              const profile = await userRes.json();
              userEmail = profile.email || '';
              userName = profile.name || (userEmail ? userEmail.split('@')[0] : 'User');
            }
          } catch (profileErr) {
            console.warn('Could not fetch userinfo from Google:', profileErr);
          }

          saveGoogleDriveToken(accessToken, expiresIn, userEmail, userName, userKey);
          resolve({ token: accessToken, email: userEmail, name: userName });
        },
        error_callback: (err: any) => {
          reject(new Error(`Google Authentication ত্রুটি: ${err?.message || 'পপআপ বন্ধ করা হয়েছে বা পারমিশন দেওয়া হয়নি।'}`));
        },
      });

      // Request Google Token with account selector prompt
      tokenClient.requestAccessToken({ prompt: 'select_account' });
    } catch (err: any) {
      reject(new Error(`Google OAuth চালু করতে সমস্যা হয়েছে: ${err.message || err}`));
    }
  });
};

/**
 * Searches for 'FINORA_Financial_Backups' folder in the user's real Google Drive.
 * If not found, creates a dedicated folder in their personal Drive root.
 */
export const getOrCreateBackupFolder = async (accessToken: string): Promise<string> => {
  const query = encodeURIComponent(`name = '${GDRIVE_FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`);
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`;

  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!searchRes.ok) {
    if (searchRes.status === 401) {
      throw new Error('401: Google Drive এক্সেস টোকেনের মেয়াদ শেষ হয়েছে। অনুগ্রহ করে আবার ড্রাইভ কানেক্ট করুন।');
    }
    const errText = await searchRes.text();
    throw new Error(`Google Drive API অনুসন্ধান ত্রুটি: ${errText || searchRes.statusText}`);
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }

  // Create folder if it doesn't exist
  const createUrl = 'https://www.googleapis.com/drive/v3/files';
  const createRes = await fetch(createUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: GDRIVE_FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
      description: 'FINORA Financial App automatic backups folder',
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Google Drive এ "${GDRIVE_FOLDER_NAME}" ফোল্ডার তৈরি করতে ব্যর্থ হয়েছে: ${errText || createRes.statusText}`);
  }

  const createData = await createRes.json();
  return createData.id;
};

/**
 * Uploads a financial backup JSON file directly into the user's Google Drive folder.
 */
export const uploadBackupFileToDrive = async (
  accessToken: string,
  backupPayload: any,
  fileName?: string,
  _userKey?: string
): Promise<GoogleDriveFile> => {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
  const finalFileName = fileName || `FINORA_Backup_${dateStr}_${timeStr}.json`;

  const folderId = await getOrCreateBackupFolder(accessToken);
  const fileContent = JSON.stringify(backupPayload, null, 2);

  const metadata = {
    name: finalFileName,
    mimeType: 'application/json',
    parents: [folderId],
    description: `FINORA Financial Backup created on ${now.toLocaleString()}`,
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    fileContent +
    closeDelimiter;

  const uploadUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,createdTime,size,mimeType,webViewLink';

  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartRequestBody,
  });

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('401: Google Drive সেশনের মেয়াদ শেষ হয়েছে। অনুগ্রহ করে ড্রাইভ পুনরায় কানেক্ট করুন।');
    }
    const errorText = await res.text();
    throw new Error(`Google Drive এ ফাইল আপলোড ব্যর্থ: ${errorText || res.statusText}`);
  }

  const file: GoogleDriveFile = await res.json();
  return file;
};

/**
 * Lists all backup JSON files currently stored in user's 'FINORA_Financial_Backups' Google Drive folder.
 */
export const listDriveBackups = async (accessToken: string, _userKey?: string): Promise<GoogleDriveFile[]> => {
  const folderId = await getOrCreateBackupFolder(accessToken);
  const query = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=createdTime desc&fields=files(id,name,createdTime,size,mimeType,webViewLink)`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('401: সেশনের মেয়াদ শেষ হয়েছে। অনুগ্রহ করে আবার ড্রাইভ কানেক্ট করুন।');
    }
    const errText = await res.text();
    throw new Error(`Google Drive ব্যাকআপ তালিকা আনতে সমস্যা হয়েছে: ${errText || res.statusText}`);
  }

  const data = await res.json();
  return data.files || [];
};

/**
 * Downloads a backup file JSON directly from Google Drive.
 */
export const downloadDriveBackupContent = async (accessToken: string, fileId: string, _userKey?: string): Promise<any> => {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('401: সেশনের মেয়াদ শেষ হয়েছে। অনুগ্রহ করে আবার ড্রাইভ কানেক্ট করুন।');
    }
    throw new Error('Google Drive থেকে ব্যাকআপ ফাইল নামানো সম্ভব হয়নি।');
  }

  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

/**
 * Permanently deletes a backup file from the user's Google Drive.
 */
export const deleteDriveBackupFile = async (accessToken: string, fileId: string, _userKey?: string): Promise<boolean> => {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('401: সেশনের মেয়াদ শেষ হয়েছে।');
    }
    return false;
  }
  return true;
};
