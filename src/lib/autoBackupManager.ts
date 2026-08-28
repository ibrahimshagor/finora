// Auto Backup Manager for FINORA
// Handles daily scheduled backups, snapshot storage, and restore operations

export interface BackupSnapshot {
  id: string;
  timestamp: string; // ISO date string
  dateLabel: string; // YYYY-MM-DD
  timeLabel: string; // HH:mm:ss
  totalRecords: number;
  dataSizeKB: number;
  triggerType: 'auto_daily' | 'manual';
  data: {
    app: string;
    version: string;
    exportedAt: string;
    accounts: any[];
    transactions: any[];
    loans: any[];
    budgets: any[];
    savingsGoals: any[];
    bills: any[];
    investments: any[];
    categories?: any[];
  };
}

export interface AutoBackupConfig {
  enabled: boolean;
  scheduledTime: string; // e.g. "23:00" or "09:00"
  lastBackupDate: string; // YYYY-MM-DD
  lastBackupTimestamp: string;
  autoDownloadFile: boolean;
  maxStoredSnapshots: number;
}

const STORAGE_KEY_CONFIG = 'finora_auto_backup_config';
const STORAGE_KEY_SNAPSHOTS = 'finora_backup_snapshots';

export const DEFAULT_BACKUP_CONFIG: AutoBackupConfig = {
  enabled: true,
  scheduledTime: '23:00',
  lastBackupDate: '',
  lastBackupTimestamp: '',
  autoDownloadFile: false,
  maxStoredSnapshots: 10,
};

export const getAutoBackupConfig = (): AutoBackupConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (!raw) return DEFAULT_BACKUP_CONFIG;
    return { ...DEFAULT_BACKUP_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_BACKUP_CONFIG;
  }
};

export const saveAutoBackupConfig = (config: Partial<AutoBackupConfig>): AutoBackupConfig => {
  const current = getAutoBackupConfig();
  const updated = { ...current, ...config };
  localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(updated));
  return updated;
};

export const getStoredSnapshots = (): BackupSnapshot[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SNAPSHOTS);
    if (!raw) return [];
    const list: BackupSnapshot[] = JSON.parse(raw);
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch {
    return [];
  }
};

export const saveSnapshot = (snapshot: BackupSnapshot, maxKeep = 10): BackupSnapshot[] => {
  try {
    const existing = getStoredSnapshots().filter((s) => s.id !== snapshot.id);
    const updated = [snapshot, ...existing].slice(0, maxKeep);
    localStorage.setItem(STORAGE_KEY_SNAPSHOTS, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to save snapshot to localStorage', err);
    return getStoredSnapshots();
  }
};

export const deleteStoredSnapshot = (id: string): BackupSnapshot[] => {
  try {
    const existing = getStoredSnapshots().filter((s) => s.id !== id);
    localStorage.setItem(STORAGE_KEY_SNAPSHOTS, JSON.stringify(existing));
    return existing;
  } catch {
    return getStoredSnapshots();
  }
};

export const createBackupSnapshot = (
  appData: {
    accounts: any[];
    transactions: any[];
    loans: any[];
    budgets: any[];
    savingsGoals: any[];
    bills: any[];
    investments: any[];
    categories?: any[];
  },
  triggerType: 'auto_daily' | 'manual' = 'manual'
): BackupSnapshot => {
  const now = new Date();
  const dateLabel = now.toISOString().split('T')[0];
  const timeLabel = now.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const payload = {
    app: 'FINORA Financial Suite',
    version: '2.5.0',
    exportedAt: now.toISOString(),
    ...appData,
  };

  const jsonString = JSON.stringify(payload);
  const dataSizeKB = Math.round((new Blob([jsonString]).size / 1024) * 10) / 10;
  const totalRecords =
    (appData.accounts?.length || 0) +
    (appData.transactions?.length || 0) +
    (appData.loans?.length || 0) +
    (appData.budgets?.length || 0) +
    (appData.savingsGoals?.length || 0) +
    (appData.bills?.length || 0) +
    (appData.investments?.length || 0);

  const snapshot: BackupSnapshot = {
    id: `backup_${dateLabel}_${now.getTime()}`,
    timestamp: now.toISOString(),
    dateLabel,
    timeLabel,
    totalRecords,
    dataSizeKB,
    triggerType,
    data: payload,
  };

  return snapshot;
};

export const downloadSnapshotAsFile = (snapshot: BackupSnapshot) => {
  try {
    const jsonStr = JSON.stringify(snapshot.data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FINORA_DailyBackup_${snapshot.dateLabel}_${snapshot.id.slice(-6)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Failed to download backup snapshot file', err);
  }
};
