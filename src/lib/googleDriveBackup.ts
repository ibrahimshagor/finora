// Google Drive Backup Client Integration for FINORA
// Enables individual users to backup & restore directly to their own personal Google Drive

export interface GoogleDriveFile {
  id: string;
  name: string;
  createdTime: string;
  size?: string;
  mimeType: string;
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

export const saveGoogleDriveToken = (token: string, expiresInSeconds: number = 3600, email?: string, name?: string) => {
  const expiresAt = Date.now() + (expiresInSeconds - 60) * 1000;
  localStorage.setItem(STORAGE_KEY_GDRIVE_TOKEN, JSON.stringify({ token, expiresAt }));
  if (email || name) {
    localStorage.setItem(STORAGE_KEY_GDRIVE_USER, JSON.stringify({ email, name }));
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
export const requestGoogleDriveAccess = async (clientId?: string): Promise<string> => {
  await loadGoogleGsiScript();

  return new Promise((resolve, reject) => {
    const google = (window as any).google;
    if (!google?.accounts?.oauth2) {
      reject(new Error('Google Identity Services load failed'));
      return;
    }

    // Use default or provided Client ID
    const effectiveClientId = clientId || 
      (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID) ||
      '1022602249329-client.apps.googleusercontent.com';

    try {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: effectiveClientId,
        scope: 'https://www.googleapis.com/auth/drive.file email profile',
        callback: async (response: any) => {
          if (response.error) {
            reject(new Error(response.error_description || response.error));
            return;
          }
          const token = response.access_token;
          const expiresIn = response.expires_in || 3600;

          // Fetch user info with token
          try {
            const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (userRes.ok) {
              const userData = await userRes.json();
              saveGoogleDriveToken(token, expiresIn, userData.email, userData.name);
            } else {
              saveGoogleDriveToken(token, expiresIn);
            }
          } catch {
            saveGoogleDriveToken(token, expiresIn);
          }

          resolve(token);
        },
        error_callback: (err: any) => {
          reject(err);
        }
      });

      client.requestAccessToken({ prompt: 'consent' });
    } catch (err) {
      reject(err);
    }
  });
};

// Find or create 'FINORA_Financial_Backups' folder in user's personal Google Drive
export const getOrCreateBackupFolder = async (accessToken: string): Promise<string> => {
  const query = encodeURIComponent(`name = '${GDRIVE_FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`);
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`;

  const res = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!res.ok) {
    throw new Error(`Google Drive API error: ${res.statusText}`);
  }

  const data = await res.json();
  if (data.files && data.files.length > 0) {
    return data.files[0].id;
  }

  // Create folder
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: GDRIVE_FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
      description: 'FINORA Financial Daily & Manual Backups',
    }),
  });

  if (!createRes.ok) {
    throw new Error('Failed to create FINORA backup folder in Google Drive');
  }

  const newFolder = await createRes.json();
  return newFolder.id;
};

// Upload Backup File to Google Drive
export const uploadBackupFileToDrive = async (
  accessToken: string,
  backupPayload: any,
  fileName?: string
): Promise<GoogleDriveFile> => {
  const folderId = await getOrCreateBackupFolder(accessToken);
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
  
  const finalFileName = fileName || `FINORA_Backup_${dateStr}_${timeStr}.json`;
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
};

// Fetch backup file content from Google Drive
export const downloadDriveBackupContent = async (accessToken: string, fileId: string): Promise<any> => {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!res.ok) {
    throw new Error('Failed to download backup file content from Google Drive');
  }

  return await res.json();
};

// Delete a backup from Google Drive
export const deleteDriveBackupFile = async (accessToken: string, fileId: string): Promise<boolean> => {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}`;

  const res = await fetch(url, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  return res.ok;
};
