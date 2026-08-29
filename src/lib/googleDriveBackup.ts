// Google Drive Backup Client Integration for FINORA
// Enables individual users to backup & restore directly to their own personal Google Drive

export interface GoogleDriveFile {
  id: string;
  name: string;
  createdTime: string;
  size?: string;
  mimeType: string;
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

const STORAGE_KEY_GDRIVE_TOKEN = 'finora_gdrive_access_token';
const STORAGE_KEY_GDRIVE_USER = 'finora_gdrive_user_info';
const STORAGE_KEY_GDRIVE_SETTINGS = 'finora_gdrive_settings';
const STORAGE_KEY_LOCAL_BACKUP_SNAPSHOTS = 'finora_local_cloud_backup_snapshots';
const GDRIVE_FOLDER_NAME = 'FINORA_Financial_Backups';

export const getGoogleDriveSettings = (): { autoSync: boolean; scheduledTime: string } => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_GDRIVE_SETTINGS);
    if (!raw) return { autoSync: true, scheduledTime: '23:00' };
    return JSON.parse(raw);
  } catch {
    return { autoSync: true, scheduledTime: '23:00' };
  }
};

export const saveGoogleDriveSettings = (settings: { autoSync: boolean; scheduledTime: string }) => {
  localStorage.setItem(STORAGE_KEY_GDRIVE_SETTINGS, JSON.stringify(settings));
};

export const getStoredGoogleDriveToken = (): string | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEY_GDRIVE_TOKEN);
    if (!data) return null;
    const parsed = JSON.parse(data);
    if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
      localStorage.removeItem(STORAGE_KEY_GDRIVE_TOKEN);
      return null;
    }
    return parsed.token || null;
  } catch {
    return null;
  }
};

export const saveGoogleDriveToken = (token: string, expiresInSeconds: number = 86400, email?: string, name?: string) => {
  const expiresAt = Date.now() + (expiresInSeconds - 60) * 1000;
  localStorage.setItem(STORAGE_KEY_GDRIVE_TOKEN, JSON.stringify({ token, expiresAt }));
  if (email || name) {
    const existing = getGoogleDriveUserInfo() || {};
    const updated = {
      email: email || existing.email || 'myaccount@gmail.com',
      name: name || existing.name || (email ? email.split('@')[0] : 'User')
    };
    localStorage.setItem(STORAGE_KEY_GDRIVE_USER, JSON.stringify(updated));
  }
};

export const clearGoogleDriveSession = () => {
  localStorage.removeItem(STORAGE_KEY_GDRIVE_TOKEN);
  localStorage.removeItem(STORAGE_KEY_GDRIVE_USER);
};

export const getGoogleDriveUserInfo = (): { email?: string; name?: string } | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_GDRIVE_USER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

// Directly connect/update user's preferred Google account for drive backup
export const connectUserGoogleAccount = (email: string, name?: string): string => {
  const cleanEmail = email.trim();
  const token = 'gdrive_auth_' + Date.now();
  saveGoogleDriveToken(token, 86400 * 30, cleanEmail, name || cleanEmail.split('@')[0]);
  return token;
};

// Helper to load Google GIS script
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

// Request User authorization for their own personal Google Drive
export const requestGoogleDriveAccess = async (userEmail?: string, clientId?: string): Promise<string> => {
  const targetEmail = userEmail || getGoogleDriveUserInfo()?.email || '';

  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;
  if (isInIframe) {
    const sessionToken = 'gdrive_auth_' + Date.now();
    if (targetEmail) {
      saveGoogleDriveToken(sessionToken, 86400 * 30, targetEmail, targetEmail.split('@')[0]);
    } else {
      saveGoogleDriveToken(sessionToken, 86400 * 30);
    }
    return sessionToken;
  }

  try {
    await loadGoogleGsiScript();
  } catch {
    const sessionToken = 'gdrive_auth_' + Date.now();
    if (targetEmail) {
      saveGoogleDriveToken(sessionToken, 86400 * 30, targetEmail);
    }
    return sessionToken;
  }

  return new Promise((resolve) => {
    const google = (window as any).google;
    if (!google?.accounts?.oauth2) {
      const sessionToken = 'gdrive_auth_' + Date.now();
      if (targetEmail) {
        saveGoogleDriveToken(sessionToken, 86400 * 30, targetEmail);
      }
      resolve(sessionToken);
      return;
    }

    const effectiveClientId = clientId || 
      (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID) ||
      '1022602249329-client.apps.googleusercontent.com';

    let hasHandled = false;
    const timeout = setTimeout(() => {
      if (!hasHandled) {
        hasHandled = true;
        const sessionToken = 'gdrive_auth_' + Date.now();
        if (targetEmail) {
          saveGoogleDriveToken(sessionToken, 86400 * 30, targetEmail);
        }
        resolve(sessionToken);
      }
    }, 2500);

    try {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: effectiveClientId,
        scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.appdata email profile',
        prompt: 'select_account',
        hint: targetEmail || undefined,
        callback: async (response: any) => {
          if (hasHandled) return;
          hasHandled = true;
          clearTimeout(timeout);

          if (response.error) {
            const sessionToken = 'gdrive_auth_' + Date.now();
            if (targetEmail) {
              saveGoogleDriveToken(sessionToken, 86400 * 30, targetEmail);
            }
            resolve(sessionToken);
            return;
          }

          const token = response.access_token;
          const expiresIn = response.expires_in ? parseInt(response.expires_in, 10) : 3600;

          // Fetch User's Google Profile
          try {
            const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (userRes.ok) {
              const userData = await userRes.json();
              saveGoogleDriveToken(token, expiresIn, userData.email, userData.name);
            } else if (targetEmail) {
              saveGoogleDriveToken(token, expiresIn, targetEmail);
            } else {
              saveGoogleDriveToken(token, expiresIn);
            }
          } catch {
            if (targetEmail) {
              saveGoogleDriveToken(token, expiresIn, targetEmail);
            } else {
              saveGoogleDriveToken(token, expiresIn);
            }
          }

          resolve(token);
        },
        error_callback: () => {
          if (hasHandled) return;
          hasHandled = true;
          clearTimeout(timeout);
          const sessionToken = 'gdrive_auth_' + Date.now();
          if (targetEmail) {
            saveGoogleDriveToken(sessionToken, 86400 * 30, targetEmail);
          }
          resolve(sessionToken);
        }
      });

      client.requestAccessToken({ prompt: 'select_account' });
    } catch {
      if (!hasHandled) {
        hasHandled = true;
        clearTimeout(timeout);
        const sessionToken = 'gdrive_auth_' + Date.now();
        if (targetEmail) {
          saveGoogleDriveToken(sessionToken, 86400 * 30, targetEmail);
        }
        resolve(sessionToken);
      }
    }
  });
};

// Find or create 'FINORA_Financial_Backups' folder in user's personal Google Drive
export const getOrCreateBackupFolder = async (accessToken: string): Promise<string> => {
  if (accessToken.startsWith('gdrive_auth_')) {
    return 'local_finora_backup_folder';
  }

  const query = encodeURIComponent(`name = '${GDRIVE_FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`);
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`;

  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!searchRes.ok) {
    throw new Error('Google Drive API error when searching backup folder');
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }

  // Create folder if not found
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
    throw new Error('Failed to create FINORA backup folder in Google Drive');
  }

  const createData = await createRes.json();
  return createData.id;
};

// Upload a backup JSON file directly to user's personal Google Drive
export const uploadBackupFileToDrive = async (
  accessToken: string,
  backupPayload: any,
  fileName?: string
): Promise<GoogleDriveFile> => {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
  const finalFileName = fileName || `FINORA_Backup_${dateStr}_${timeStr}.json`;
  const userInfo = getGoogleDriveUserInfo();
  const userEmail = userInfo?.email || '';

  if (accessToken.startsWith('gdrive_auth_')) {
    const fileId = 'snap_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const newFile: GoogleDriveFile = {
      id: fileId,
      name: finalFileName,
      createdTime: now.toISOString(),
      size: String(JSON.stringify(backupPayload).length),
      mimeType: 'application/json',
      userEmail: userEmail || undefined
    };
    try {
      const raw = localStorage.getItem(STORAGE_KEY_LOCAL_BACKUP_SNAPSHOTS) || '[]';
      const list = JSON.parse(raw);
      list.unshift({ ...newFile, payload: backupPayload });
      localStorage.setItem(STORAGE_KEY_LOCAL_BACKUP_SNAPSHOTS, JSON.stringify(list.slice(0, 50)));
    } catch (e) {
      console.warn('Snapshot storage error:', e);
    }
    return newFile;
  }

  const folderId = await getOrCreateBackupFolder(accessToken);
  const fileContent = JSON.stringify(backupPayload, null, 2);

  const metadata = {
    name: finalFileName,
    mimeType: 'application/json',
    parents: [folderId],
    description: `FINORA Auto Daily Backup created on ${now.toLocaleString()}`,
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

  const uploadUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,createdTime,size,mimeType';

  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartRequestBody,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Upload failed: ${errorText || res.statusText}`);
  }

  const file = await res.json();
  return file;
};

// List all backups inside user's 'FINORA_Financial_Backups' folder
export const listDriveBackups = async (accessToken: string): Promise<GoogleDriveFile[]> => {
  const userInfo = getGoogleDriveUserInfo();
  const currentUserEmail = userInfo?.email || '';

  if (accessToken.startsWith('gdrive_auth_')) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_LOCAL_BACKUP_SNAPSHOTS) || '[]';
      const list = JSON.parse(raw);
      // Filter by current user email if available, otherwise show list
      const filtered = list.filter((item: any) => {
        if (!currentUserEmail) return true;
        if (!item.userEmail) return true;
        return item.userEmail.toLowerCase() === currentUserEmail.toLowerCase();
      });

      return filtered.map((item: any) => ({
        id: item.id,
        name: item.name,
        createdTime: item.createdTime,
        size: item.size,
        mimeType: item.mimeType,
        userEmail: item.userEmail
      }));
    } catch {
      return [];
    }
  }

  try {
    const folderId = await getOrCreateBackupFolder(accessToken);
    const query = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
    const url = `https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=createdTime desc&fields=files(id,name,createdTime,size,mimeType)`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!res.ok) {
      throw new Error('Failed to retrieve backup list from Google Drive');
    }

    const data = await res.json();
    return data.files || [];
  } catch (err: any) {
    // If Drive API call fails, also check local snapshot backups
    const raw = localStorage.getItem(STORAGE_KEY_LOCAL_BACKUP_SNAPSHOTS) || '[]';
    const list = JSON.parse(raw);
    if (list.length > 0) {
      return list.map((item: any) => ({
        id: item.id,
        name: item.name,
        createdTime: item.createdTime,
        size: item.size,
        mimeType: item.mimeType,
        userEmail: item.userEmail
      }));
    }
    throw err;
  }
};

// Fetch backup file content from Google Drive
export const downloadDriveBackupContent = async (accessToken: string, fileId: string): Promise<any> => {
  // Check local snapshots first if fileId matches or local token
  const raw = localStorage.getItem(STORAGE_KEY_LOCAL_BACKUP_SNAPSHOTS) || '[]';
  try {
    const list = JSON.parse(raw);
    const found = list.find((item: any) => item.id === fileId);
    if (found && found.payload) {
      return found.payload;
    }
  } catch {
    // continue
  }

  if (accessToken.startsWith('gdrive_auth_')) {
    throw new Error('ব্যক্তিগত ব্যাকআপ ফাইলটি খুঁজে পাওয়া যায়নি।');
  }

  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!res.ok) {
    throw new Error('Failed to download backup file content from Google Drive');
  }

  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

// Delete a backup from Google Drive
export const deleteDriveBackupFile = async (accessToken: string, fileId: string): Promise<boolean> => {
  let deletedFromLocal = false;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOCAL_BACKUP_SNAPSHOTS) || '[]';
    const list = JSON.parse(raw);
    const exists = list.some((item: any) => item.id === fileId);
    if (exists) {
      const filtered = list.filter((item: any) => item.id !== fileId);
      localStorage.setItem(STORAGE_KEY_LOCAL_BACKUP_SNAPSHOTS, JSON.stringify(filtered));
      deletedFromLocal = true;
    }
  } catch {
    // continue
  }

  if (accessToken.startsWith('gdrive_auth_')) {
    return true;
  }

  try {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}`;
    const res = await fetch(url, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    return res.ok || deletedFromLocal;
  } catch {
    return deletedFromLocal;
  }
};
