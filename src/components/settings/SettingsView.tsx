import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Globe, 
  DollarSign, 
  Eye, 
  EyeOff,
  Download, 
  Upload, 
  Trash2, 
  ShieldCheck, 
  Sparkles, 
  Check, 
  ExternalLink,
  Code,
  Heart,
  Database,
  Cloud,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  UserCheck,
  HardDrive,
  Clock,
  Calendar,
  FolderDown,
  History,
  FileJson,
  X
} from 'lucide-react';
import { useFinance } from '../../context/FinancialContext';
import { useAuth } from '../../context/AuthContext';
import { CURRENCIES, APP_INFO } from '../../lib/constants';
import { testFirebaseConnection } from '../../lib/firebase';
import { 
  getAutoBackupConfig, 
  saveAutoBackupConfig, 
  getStoredSnapshots, 
  createBackupSnapshot, 
  saveSnapshot, 
  deleteStoredSnapshot,
  downloadSnapshotAsFile,
  BackupSnapshot,
  AutoBackupConfig
} from '../../lib/autoBackupManager';
import { 
  requestGoogleDriveAccess, 
  getStoredGoogleDriveToken, 
  clearGoogleDriveSession, 
  getGoogleDriveUserInfo,
  getGoogleDriveSettings,
  saveGoogleDriveSettings,
  uploadBackupFileToDrive,
  listDriveBackups,
  downloadDriveBackupContent,
  deleteDriveBackupFile,
  connectUserGoogleAccount,
  GoogleDriveFile
} from '../../lib/googleDriveBackup';

export const SettingsView: React.FC = () => {
  const { 
    currencySymbol, 
    setCurrencySymbol, 
    privacyMode, 
    setPrivacyMode,
    togglePrivacyMode, 
    language,
    accounts, 
    transactions, 
    loans, 
    budgets, 
    savingsGoals, 
    bills, 
    investments,
    categories,
    syncStatus,
    exportFullDataJSON,
    exportDataJSON,
    importFullDataJSON,
    importDataJSON,
    resetToDemoData,
    resetAllData
  } = useFinance();

  const { user, isGuestMode } = useAuth();
  
  // Status states
  const [importStatus, setImportStatus] = useState<string>('');
  const [testingDb, setTestingDb] = useState<boolean>(false);
  const [dbTestResult, setDbTestResult] = useState<string | null>(null);

  // Auto Backup Config & Snapshot state
  const [autoBackupConfig, setAutoBackupConfig] = useState<AutoBackupConfig>(getAutoBackupConfig());
  const [snapshots, setSnapshots] = useState<BackupSnapshot[]>(getStoredSnapshots());
  const [isTakingSnapshot, setIsTakingSnapshot] = useState(false);
  const [snapshotMessage, setSnapshotMessage] = useState<string | null>(null);

  // Google Drive state
  const [gdriveToken, setGdriveToken] = useState<string | null>(getStoredGoogleDriveToken());
  const [gdriveUser, setGdriveUser] = useState<{ email?: string; name?: string } | null>(getGoogleDriveUserInfo());
  const [gdriveSettings, setGdriveSettings] = useState(getGoogleDriveSettings());
  const [isConnectingDrive, setIsConnectingDrive] = useState(false);
  const [isUploadingDrive, setIsUploadingDrive] = useState(false);
  const [driveStatusMsg, setDriveStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Account Picker / Connection Modal
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [customEmailInput, setCustomEmailInput] = useState(gdriveUser?.email || user?.email || '');

  // Drive File List Modal
  const [showDriveModal, setShowDriveModal] = useState(false);
  const [driveFiles, setDriveFiles] = useState<GoogleDriveFile[]>([]);
  const [isLoadingDriveFiles, setIsLoadingDriveFiles] = useState(false);
  const [restoringFileId, setRestoringFileId] = useState<string | null>(null);

  // Refresh Google Drive status on mount
  useEffect(() => {
    setGdriveToken(getStoredGoogleDriveToken());
    setGdriveUser(getGoogleDriveUserInfo());
    setSnapshots(getStoredSnapshots());
  }, []);

  const handleTestDatabase = async () => {
    setTestingDb(true);
    setDbTestResult(null);
    try {
      const isOk = await testFirebaseConnection();
      if (isOk) {
        setDbTestResult('online');
      } else {
        setDbTestResult('offline');
      }
    } catch {
      setDbTestResult('offline');
    } finally {
      setTestingDb(false);
    }
  };

  const handleExportBackup = () => {
    try {
      const exportFn = exportFullDataJSON || exportDataJSON;
      const jsonStr = typeof exportFn === 'function' ? exportFn() : JSON.stringify({
        app: 'FINORA',
        version: '2.5.0',
        exportedAt: new Date().toISOString(),
        accounts,
        transactions,
        loans,
        budgets,
        savingsGoals,
        bills,
        investments,
        categories,
      }, null, 2);
      
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FINORA_ManualBackup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const content = evt.target?.result as string;
        const importFn = importFullDataJSON || importDataJSON;
        const res = typeof importFn === 'function' ? await importFn(content) : false;
        if (res === true || (typeof res === 'object' && res?.success)) {
          setImportStatus(language === 'bn' ? '✅ ব্যাকআপ ফাইল সফলভাবে লোড ও রিস্টোর করা হয়েছে!' : '✅ Backup file loaded and data restored successfully!');
        } else {
          setImportStatus(language === 'bn' ? '❌ ত্রুটি: সঠিক FINORA ব্যাকআপ JSON ফাইল প্রদান করুন।' : '❌ Error: Please provide a valid FINORA backup JSON file.');
        }
      } catch (err) {
        setImportStatus(language === 'bn' ? '❌ ত্রুটি: ব্যাকআপ ফাইলটি প্রসেস করা সম্ভব হয়নি।' : '❌ Error: Failed to process backup file.');
      }
    };
    reader.readAsText(file);
  };

  // Google Drive Connect with account
  const handleConnectGoogleDrive = async (emailOverride?: string) => {
    setIsConnectingDrive(true);
    setDriveStatusMsg(null);
    try {
      const targetEmail = emailOverride || customEmailInput || user?.email || '';
      let token: string;
      if (emailOverride) {
        token = connectUserGoogleAccount(emailOverride);
      } else {
        token = await requestGoogleDriveAccess(targetEmail);
      }
      setGdriveToken(token);
      setGdriveUser(getGoogleDriveUserInfo());
      setShowAccountModal(false);
      setDriveStatusMsg({
        text: `আপনার Google Account (${getGoogleDriveUserInfo()?.email || targetEmail || 'আমার ড্রাইভ'}) সফলভাবে সংযুক্ত হয়েছে! এখন সরাসরি এই ড্রাইভে ব্যাকআপ জমা হবে।`,
        type: 'success',
      });
    } catch (err: any) {
      console.error(err);
      setDriveStatusMsg({
        text: err.message || 'Google Drive সংযোগ ব্যর্থ হয়েছে।',
        type: 'error',
      });
    } finally {
      setIsConnectingDrive(false);
    }
  };

  // Google Drive Disconnect
  const handleDisconnectGoogleDrive = () => {
    clearGoogleDriveSession();
    setGdriveToken(null);
    setGdriveUser(null);
    setDriveStatusMsg({
      text: 'Google Drive সংযোগ বিচ্ছিন্ন করা হয়েছে। আপনি যে কোনো সময় নতুন অ্যাকাউন্ট সংযুক্ত করতে পারেন।',
      type: 'success',
    });
  };

  // Upload Now to Google Drive
  const handleUploadToGoogleDriveNow = async () => {
    const token = gdriveToken || getStoredGoogleDriveToken();
    if (!token) {
      setShowAccountModal(true);
      return;
    }

    setIsUploadingDrive(true);
    setDriveStatusMsg(null);
    try {
      const snapshot = createBackupSnapshot({
        accounts,
        transactions,
        loans,
        budgets,
        savingsGoals,
        bills,
        investments,
        categories,
      }, 'manual');

      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
      const fileName = `FINORA_DriveBackup_${dateStr}_${timeStr}.json`;

      await uploadBackupFileToDrive(token, snapshot.data, fileName);

      // Also save locally as snapshot
      const updatedSnapshots = saveSnapshot(snapshot);
      setSnapshots(updatedSnapshots);

      const targetAccount = gdriveUser?.email || user?.email || 'আপনার নির্বাচিত Google একাউন্ট';
      setDriveStatusMsg({
        text: `✅ (${targetAccount}) Google Drive ফোল্ডারে "${fileName}" সফলভাবে আপলোড হয়েছে!`,
        type: 'success',
      });
    } catch (err: any) {
      console.error('Google Drive Upload error:', err);
      if (err.message && (err.message.includes('401') || err.message.includes('Invalid Credentials') || err.message.includes('Google Drive API error'))) {
        clearGoogleDriveSession();
        setGdriveToken(null);
        setDriveStatusMsg({
          text: 'Google Drive সেশন মেয়াদোত্তীর্ণ হয়েছে। অনুগ্রহ করে পুনরায় অ্যাকাউন্ট নির্বাচন করুন।',
          type: 'error',
        });
        setShowAccountModal(true);
      } else {
        setDriveStatusMsg({
          text: `Google Drive এ আপলোড ব্যর্থ হয়েছে: ${err.message}`,
          type: 'error',
        });
      }
    } finally {
      setIsUploadingDrive(false);
    }
  };

  // Open Drive Backups Modal & Fetch List
  const handleOpenDriveModal = async () => {
    const token = gdriveToken || getStoredGoogleDriveToken();
    if (!token) {
      setShowAccountModal(true);
      return;
    }

    setShowDriveModal(true);
    setIsLoadingDriveFiles(true);
    try {
      const files = await listDriveBackups(token);
      setDriveFiles(files);
    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.includes('401')) {
        clearGoogleDriveSession();
        setGdriveToken(null);
        alert('Google সেশনের মেয়াদ শেষ হয়েছে। অনুগ্রহ করে আবার সাইন ইন করুন।');
        setShowDriveModal(false);
      }
    } finally {
      setIsLoadingDriveFiles(false);
    }
  };

  // Restore file from Google Drive
  const handleRestoreFromDriveFile = async (file: GoogleDriveFile) => {
    const token = gdriveToken || getStoredGoogleDriveToken();
    if (!token) return;

    const confirmMsg = `আপনি কি Google Drive এর "${file.name}" ব্যাকআপ ফাইলটি থেকে ডেটা রিস্টোর করতে চান? আপনার বর্তমান হিসাব এই ব্যাকআপের তথ্য দ্বারা প্রতিস্থাপিত হবে।`;
    if (!window.confirm(confirmMsg)) return;

    setRestoringFileId(file.id);
    try {
      const fileData = await downloadDriveBackupContent(token, file.id);
      const importFn = importFullDataJSON || importDataJSON;
      const res = typeof importFn === 'function' ? await importFn(fileData) : false;
      if (res === true || (typeof res === 'object' && res?.success)) {
        alert('✅ Google Drive থেকে সফলভাবে ডেটা রিস্টোর সম্পন্ন হয়েছে!');
        setShowDriveModal(false);
        setDriveStatusMsg({
          text: `✅ Google Drive ব্যাকআপ (${file.name}) সফলভাবে রিস্টোর করা হয়েছে!`,
          type: 'success',
        });
      } else {
        alert('❌ ব্যাকআপ ফাইলটি সঠিক ফরম্যাটে ছিল না বা রিস্টোর করা যায়নি।');
      }
    } catch (err: any) {
      alert(`রিস্টোর ব্যর্থ হয়েছে: ${err.message}`);
    } finally {
      setRestoringFileId(null);
    }
  };

  // Delete file from Google Drive
  const handleDeleteDriveFile = async (fileId: string) => {
    const token = gdriveToken || getStoredGoogleDriveToken();
    if (!token) return;

    if (!window.confirm('আপনি কি Google Drive থেকে এই ব্যাকআপ ফাইলটি মুছে ফেলতে চান?')) return;

    try {
      await deleteDriveBackupFile(token, fileId);
      setDriveFiles((prev) => prev.filter((f) => f.id !== fileId));
      setDriveStatusMsg({
        text: '✅ ব্যাকআপ ফাইলটি সফলভাবে মুছে ফেলা হয়েছে।',
        type: 'success',
      });
    } catch (err: any) {
      alert(`মুছতে ব্যর্থ হয়েছে: ${err.message}`);
    }
  };

  // Take Snapshot locally now
  const handleTakeSnapshotNow = () => {
    setIsTakingSnapshot(true);
    setSnapshotMessage(null);
    try {
      const snapshot = createBackupSnapshot({
        accounts,
        transactions,
        loans,
        budgets,
        savingsGoals,
        bills,
        investments,
        categories,
      }, 'manual');

      const updated = saveSnapshot(snapshot);
      setSnapshots(updated);

      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const updatedConfig = saveAutoBackupConfig({
        lastBackupDate: todayStr,
        lastBackupTimestamp: now.toISOString(),
      });
      setAutoBackupConfig(updatedConfig);

      setSnapshotMessage('✅ নতুন ব্যাকআপ স্ন্যাপশট সফলভাবে সংরক্ষিত হয়েছে!');
    } catch (err: any) {
      setSnapshotMessage(`❌ স্ন্যাপশট নিতে সমস্যা হয়েছে: ${err.message}`);
    } finally {
      setIsTakingSnapshot(false);
    }
  };

  // Restore a local snapshot
  const handleRestoreSnapshot = async (snapshot: BackupSnapshot) => {
    const confirmMsg = `আপনি কি ${snapshot.dateLabel} (${snapshot.timeLabel}) এর ব্যাকআপ স্ন্যাপশটটি রিস্টোর করতে চান?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const importFn = importFullDataJSON || importDataJSON;
      const res = typeof importFn === 'function' ? await importFn(JSON.stringify(snapshot.data)) : false;
      if (res === true || (typeof res === 'object' && res?.success)) {
        alert('✅ স্ন্যাপশট থেকে ডেটা সফলভাবে রিস্টোর করা হয়েছে!');
      } else {
        alert('❌ রিস্টোর সম্পন্ন করা যায়নি।');
      }
    } catch (err: any) {
      alert(`রিস্টোর ব্যর্থ: ${err.message}`);
    }
  };

  // Delete a local snapshot
  const handleDeleteSnapshot = (id: string) => {
    if (window.confirm('আপনি কি এই ব্যাকআপ স্ন্যাপশটটি মুছে ফেলতে চান?')) {
      const updated = deleteStoredSnapshot(id);
      setSnapshots(updated);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      
      {/* Page Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <span>সেটিংস ও ডেটা হাব (Settings & Data Hub)</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          অ্যাপ প্রেফারেন্স, গুগল ড্রাইভ ক্লাউড ব্যাকআপ, দৈনিক অটো ব্যাকআপ শিডিউল ও ডেটাবেস সিঙ্ক।
        </p>
      </div>

      {/* 1. Google Drive Personal Account Cloud Backup Section */}
      <div className="bg-gradient-to-br from-white via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 rounded-2xl p-6 border border-emerald-500/30 dark:border-emerald-500/20 shadow-sm space-y-5 relative overflow-hidden">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center shrink-0">
              <HardDrive className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Google Drive ব্যক্তিগত ক্লাউড ব্যাকআপ (Personal Cloud Backup)
                </h3>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 rounded-md text-[10px] font-bold">
                  Online Drive
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                আপনার নিজস্ব ব্যক্তিগত জিমেইল গুগল ড্রাইভে প্রতিদিনের সম্পূর্ণ হিসাব সুরক্ষিত ফোল্ডারে ব্যাকআপ রাখুন।
              </p>
            </div>
          </div>

          {/* Connection Pill */}
          <div className="shrink-0 flex items-center gap-2">
            {gdriveToken ? (
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>ড্রাইভ: <strong>{gdriveUser?.email || user?.email || 'আমার গুগল একাউন্ট'}</strong></span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAccountModal(true)}
                  className="px-2.5 py-1.5 text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors border border-slate-300 dark:border-slate-700"
                >
                  পরিবর্তন করুন
                </button>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400">
                <Cloud className="w-4 h-4 text-slate-400" />
                <span>ড্রাইভ এখনো সংযুক্ত নয়</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          
          {/* Connect / Disconnect */}
          {!gdriveToken ? (
            <button
              type="button"
              onClick={() => setShowAccountModal(true)}
              disabled={isConnectingDrive}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isConnectingDrive ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>সংযোগ করা হচ্ছে...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  </svg>
                  <span>Google Drive অ্যাকাউন্ট নির্বাচন ও সংযোগ</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleDisconnectGoogleDrive}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors"
            >
              <span>সংযোগ বিচ্ছিন্ন করুন</span>
            </button>
          )}

          {/* Upload Backup Now to Drive */}
          <button
            type="button"
            onClick={handleUploadToGoogleDriveNow}
            disabled={isUploadingDrive}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
          >
            {isUploadingDrive ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>ড্রাইভে আপলোড হচ্ছে...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>এখনই Google Drive এ ব্যাকআপ তুলুন</span>
              </>
            )}
          </button>

          {/* Browse & Restore from Drive */}
          <button
            type="button"
            onClick={handleOpenDriveModal}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors border border-slate-700"
          >
            <FolderDown className="w-4 h-4 text-emerald-400" />
            <span>ড্রাইভ ব্যাকআপ তালিকা ও রিস্টোর</span>
          </button>

        </div>

        {/* Google Drive Auto Sync Toggle & Time */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="gdrive_autosync"
              checked={gdriveSettings.autoSync}
              onChange={(e) => {
                const updated = { ...gdriveSettings, autoSync: e.target.checked };
                setGdriveSettings(updated);
                saveGoogleDriveSettings(updated);
              }}
              className="w-4 h-4 text-emerald-600 rounded-sm focus:ring-emerald-500"
            />
            <label htmlFor="gdrive_autosync" className="font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
              প্রতিদিনের ব্যাকআপ স্বয়ংক্রিয়ভাবে Google Drive এ আপলোড করুন (Daily Auto Cloud Sync)
            </label>
          </div>

          <span className="text-[11px] text-slate-400">
            গুগল ড্রাইভ ফোল্ডার: <code className="text-emerald-600 dark:text-emerald-400 font-mono">FINORA_Financial_Backups</code>
          </span>
        </div>

        {/* Status Message */}
        {driveStatusMsg && (
          <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            driveStatusMsg.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
          }`}>
            {driveStatusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{driveStatusMsg.text}</span>
          </div>
        )}

      </div>

      {/* 2. Daily Automated Backup Scheduler & Snapshot History */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>দৈনিক স্বয়ংক্রিয় ব্যাকআপ ও স্ন্যাপশট শিডিউলার (Daily Automated Backup)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              প্রতিদিন একটি নির্দিষ্ট সময়ে স্বয়ংক্রিয়ভাবে পূর্ণাঙ্গ ব্যাকআপ তৈরি হয় ও স্ন্যাপশট হিস্ট্রিতে সংরক্ষিত থাকে।
            </p>
          </div>

          <button
            type="button"
            onClick={handleTakeSnapshotNow}
            disabled={isTakingSnapshot}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-semibold border border-emerald-200 dark:border-emerald-800 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isTakingSnapshot ? 'তৈরি হচ্ছে...' : 'এখনই নতুন স্ন্যাপশট নিন'}</span>
          </button>
        </div>

        {/* Scheduler Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          
          {/* Enable Toggle */}
          <div>
            <span className="text-[11px] text-slate-400 font-semibold block mb-1.5">
              স্বয়ংক্রিয় দৈনিক ব্যাকআপ
            </span>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="auto_backup_enabled"
                checked={autoBackupConfig.enabled}
                onChange={(e) => {
                  const updated = saveAutoBackupConfig({ enabled: e.target.checked });
                  setAutoBackupConfig(updated);
                }}
                className="w-4 h-4 text-emerald-600 rounded-sm focus:ring-emerald-500 cursor-pointer"
              />
              <label htmlFor="auto_backup_enabled" className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                {autoBackupConfig.enabled ? 'সক্রিয় (ON - প্রতিদিন চলবে)' : 'নিষ্ক্রিয় (OFF)'}
              </label>
            </div>
          </div>

          {/* Time Picker */}
          <div>
            <span className="text-[11px] text-slate-400 font-semibold block mb-1.5">
              ব্যাকআপের নির্ধারিত সময় (Scheduled Time)
            </span>
            <select
              value={autoBackupConfig.scheduledTime || '23:00'}
              onChange={(e) => {
                const updated = saveAutoBackupConfig({ scheduledTime: e.target.value });
                setAutoBackupConfig(updated);
              }}
              className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="06:00">সকাল ০৬:০০ টা (06:00 AM)</option>
              <option value="09:00">সকাল ০৯:০০ টা (09:00 AM)</option>
              <option value="12:00">দুপুর ১২:০০ টা (12:00 PM)</option>
              <option value="18:00">সন্ধ্যা ০৬:০০ টা (06:00 PM)</option>
              <option value="21:00">রাত ০৯:০০ টা (09:00 PM)</option>
              <option value="23:00">রাত ১১:০০ টা (11:00 PM - ডিফল্ট)</option>
              <option value="00:00">রাত ১২:০০ টা (12:00 AM)</option>
            </select>
          </div>

          {/* Last Backup Date Badge */}
          <div>
            <span className="text-[11px] text-slate-400 font-semibold block mb-1.5">
              সর্বশেষ ব্যাকআপের স্থিতি
            </span>
            <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>
                {autoBackupConfig.lastBackupDate 
                  ? `${autoBackupConfig.lastBackupDate} এ সম্পন্ন` 
                  : 'আজকের নির্ধারিত সময়ে স্বয়ংক্রিয় ব্যাকআপ নেওয়া হবে'}
              </span>
            </div>
          </div>

        </div>

        {snapshotMessage && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{snapshotMessage}</span>
          </div>
        )}

        {/* Local Snapshot History Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <History className="w-4 h-4 text-slate-400" />
              <span>সংরক্ষিত স্ন্যাপশট ও রোলব্যাক হিস্ট্রি (History & Instant Rollback)</span>
            </h4>
            <span className="text-[11px] text-slate-400 font-mono">
              মোট: {snapshots.length} টি স্ন্যাপশট
            </span>
          </div>

          {snapshots.length === 0 ? (
            <div className="p-6 text-center rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 text-xs text-slate-400">
              কোনো পূর্ববর্তী স্ন্যাপশট পাওয়া যায়নি। উপরের "এখনই নতুন স্ন্যাপশট নিন" বাটনে ক্লিক করে প্রথম ব্যাকআপ স্ন্যাপশট তৈরি করুন।
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-2.5">তারিখ ও সময়</th>
                    <th className="px-4 py-2.5">ধরন</th>
                    <th className="px-4 py-2.5">রেকর্ড সংখ্যা</th>
                    <th className="px-4 py-2.5">সাইজ</th>
                    <th className="px-4 py-2.5 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {snapshots.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-2.5 font-mono text-slate-800 dark:text-slate-200">
                        {s.dateLabel} <span className="text-[11px] text-slate-400">({s.timeLabel})</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          s.triggerType === 'auto_daily'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                        }`}>
                          {s.triggerType === 'auto_daily' ? 'দৈনিক অটো' : 'ম্যানুয়াল'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400 font-mono">
                        {s.totalRecords} টি রেকর্ড
                      </td>
                      <td className="px-4 py-2.5 text-slate-500 font-mono text-[11px]">
                        {s.dataSizeKB} KB
                      </td>
                      <td className="px-4 py-2.5 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => handleRestoreSnapshot(s)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                        >
                          রিস্টোর
                        </button>
                        <button
                          type="button"
                          onClick={() => downloadSnapshotAsFile(s)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-[11px] font-semibold"
                          title="JSON ডাউনলোড করুন"
                        >
                          <Download className="w-3.5 h-3.5 inline" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSnapshot(s.id)}
                          className="p-1 text-slate-400 hover:text-rose-500 rounded-lg"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-3.5 h-3.5 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* 3. General Preferences Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-6">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Settings className="w-4 h-4 text-emerald-600" />
          <span>ব্যবহারকারীর সাধারণ পছন্দ (App Preferences)</span>
        </h3>

        {/* Currency Selection */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
              ডিফল্ট মুদ্রা (Currency Symbol)
            </span>
            <span className="text-[11px] text-slate-400">
              অ্যাপ্লিকেশনের সকল লেনদেন এবং ব্যালেন্সে প্রদর্শিত মুদ্রা।
            </span>
          </div>

          <select
            value={currencySymbol}
            onChange={(e) => setCurrencySymbol(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold font-mono rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.symbol}>
                {c.symbol} - {c.name} ({c.code})
              </option>
            ))}
          </select>
        </div>

        {/* Privacy Mode */}
        <div className="flex items-center justify-between py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                প্রাইভেসি মাস্কিং মোড (Privacy Mode)
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                privacyMode 
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}>
                {privacyMode ? 'সক্রিয় (ON)' : 'নিষ্ক্রিয় (OFF)'}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              পাবলিক স্থানে বা স্ক্রিন শেয়ারের সময় টাকার পরিমাণ তারকাচিহ্ন (••••) দিয়ে ঢেকে রাখুন।
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              if (typeof togglePrivacyMode === 'function') {
                togglePrivacyMode();
              } else if (typeof setPrivacyMode === 'function') {
                setPrivacyMode(!privacyMode);
              }
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 ${
              privacyMode
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-500/30'
                : 'bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
            }`}
          >
            {privacyMode ? (
              <>
                <EyeOff className="w-4 h-4 text-white" />
                <span>প্রাইভেসি চালু (ON)</span>
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span>প্রাইভেসি বন্ধ (OFF)</span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* 4. Cloud & Firebase Live Database Status */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Cloud className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>ফায়ারবেস ক্লাউড ডেটাবেস সংযোগ (Firebase Firestore Database)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              আপনার সমস্ত হিসাব ও ডেটা ক্লাউড ফায়ারবেস ডেটাবেসে সার্বক্ষণিক সুরক্ষিত ও সিঙ্ক হচ্ছে।
            </p>
          </div>

          <button
            type="button"
            onClick={handleTestDatabase}
            disabled={testingDb}
            className="flex items-center gap-2 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-semibold border border-blue-200 dark:border-blue-800 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testingDb ? 'animate-spin' : ''}`} />
            <span>{testingDb ? 'যাচাই করা হচ্ছে...' : 'কানেকশন পরীক্ষা করুন'}</span>
          </button>
        </div>

        {/* Status Indicators Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] text-slate-400 block">ব্যবহারকারীর অ্যাকাউন্ট</span>
            <div className="flex items-center gap-1.5 mt-1 font-semibold text-xs text-slate-800 dark:text-slate-200 truncate">
              <UserCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="truncate">{user?.email || (isGuestMode ? 'ডেমো গেস্ট মোড' : 'সরাসরি ইউজার সেশন')}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] text-slate-400 block">ডেটাবেস সিঙ্ক স্ট্যাটাস</span>
            <div className="flex items-center gap-1.5 mt-1 font-semibold text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>{syncStatus === 'synced' ? 'ক্লাউড সিঙ্ক সক্রিয় (Live Synced)' : 'অফলাইন ও লোকাল স্টোরেজ ব্যাকড'}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] text-slate-400 block">মোট সংরক্ষিত রেকর্ড</span>
            <div className="mt-1 font-mono font-bold text-xs text-slate-800 dark:text-slate-200">
              {accounts.length} অ্যাকাউন্টে {transactions.length} টি লেনদেন
            </div>
          </div>
        </div>

        {dbTestResult && (
          <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            dbTestResult === 'online'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200'
              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200'
          }`}>
            {dbTestResult === 'online' ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>ফায়ারবেস ক্লাউড ডেটাবেস সার্ভার সম্পূর্ণ সচল এবং নতুন ডাটা রিয়েল-টাইমে সেভ হচ্ছে!</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>ফায়ারবেস অফলাইন মোডে সুরক্ষিতভাবে ব্রাউজার মেমোরিতে ডাটা রাখছে। ইন্টারনেট সংযোগ থাকলে ক্লাউডে স্বয়ংক্রিয় সিঙ্ক হবে।</span>
              </>
            )}
          </div>
        )}

      </div>

      {/* 5. Manual JSON Export & Import Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-6">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-600" />
          <span>ম্যানুয়াল ফাইল ব্যাকআপ ও রিস্টোর (Manual JSON File Backup)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Export JSON Backup */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                সম্পূর্ণ ডেটা JSON ফাইল হিসেবে ডাউনলোড
              </h4>
              <p className="text-[11px] text-slate-400 mt-1">
                আপনার সকল অ্যাকাউন্ট, লেনদেন, ঋণ, বাজেট ও বিলের সম্পূর্ণ অফলাইন JSON ফাইল সংরক্ষণ করুন।
              </p>
            </div>

            <button
              onClick={handleExportBackup}
              className="mt-4 flex items-center justify-center gap-2 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>JSON ব্যাকআপ ফাইল নামান</span>
            </button>
          </div>

          {/* Import JSON Restore */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                ব্যাকআপ ফাইল থেকে ডেটা রিস্টোর
              </h4>
              <p className="text-[11px] text-slate-400 mt-1">
                পূর্বে নামানো FINORA JSON ব্যাকআপ ফাইল নির্বাচন করে সমস্ত ডেটা পুনরুদ্ধার করুন।
              </p>
            </div>

            <label className="mt-4 flex items-center justify-center gap-2 px-3.5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold rounded-xl cursor-pointer hover:bg-slate-800 transition-colors shadow-xs">
              <Upload className="w-4 h-4" />
              <span>ব্যাকআপ ফাইল আপলোড করুন</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />
            </label>
          </div>

        </div>

        {importStatus && (
          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl">
            {importStatus}
          </p>
        )}

        {/* Reset Demo Data */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-rose-600 block">ডেমো ডেটা রিসেট</span>
            <span className="text-[11px] text-slate-400">প্রাথমিক টেস্ট অ্যাকাউন্টে ফিরে যেতে এটি ব্যবহার করুন।</span>
          </div>

          <button
            onClick={() => {
              const confirmMsg = language === 'bn' ? 'আপনি কি নিশ্চিত যে ডেমো ডেটায় রিসেট করতে চান?' : 'Are you sure you want to reset to demo data?';
              if (window.confirm(confirmMsg)) {
                if (typeof resetToDemoData === 'function') {
                  resetToDemoData();
                } else if (typeof resetAllData === 'function') {
                  resetAllData();
                }
              }
            }}
            className="px-3.5 py-2 border border-rose-200 dark:border-rose-800 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs font-semibold transition-colors"
          >
            {language === 'bn' ? 'রিসেট করুন' : 'Reset Data'}
          </button>
        </div>

      </div>

      {/* App & Developer Credits (Strict Constraint Requirement) */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 opacity-10 text-white">
          <Sparkles className="w-48 h-48" />
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white font-black text-xl flex items-center justify-center shadow-lg">
              F
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-wide text-white">
                FINORA
              </h3>
              <p className="text-xs text-emerald-400 font-medium">
                “Take Control of Your Money.”
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
            FINORA হলো একটি পূর্ণাঙ্গ এবং সুরক্ষিত পার্সোনাল ফাইন্যান্সিয়াল ম্যানেজমেন্ট প্ল্যাটফর্ম যা আপনার দৈনিক আয়, ব্যয়, অ্যাকাউন্ট স্থানান্তর, ঋণ, বাজেট, সঞ্চয় ও বিনিয়োগকে এক ছাতার নিচে নিয়ে আসে।
          </p>

          <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div>
              <p className="text-slate-400">
                Developed by: <strong className="text-white">{APP_INFO.developedBy}</strong>
              </p>
              <p className="text-slate-400 mt-0.5">
                Powered by: <a href="https://www.tikmerk.com" target="_blank" rel="noopener noreferrer" className="text-emerald-400 font-bold hover:underline inline-flex items-center gap-1">{APP_INFO.poweredBy} <ExternalLink className="w-3 h-3" /></a>
              </p>
            </div>

            <div className="text-[11px] text-slate-400">
              Version 2.5.0 • Google Drive Cloud & Automated Daily Backup Ready
            </div>
          </div>

        </div>
      </div>

      {/* Google Drive Account Selection Modal */}
      {showAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 dark:bg-blue-950/60 rounded-xl text-blue-600">
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Google Account নির্বাচন ও ব্যাকআপ সংযোগ
                  </h3>
                  <p className="text-[11px] text-slate-500">আপনার নিজস্ব Google Drive অ্যাকাউন্টে ব্যাকআপ সংরক্ষণ করুন</p>
                </div>
              </div>
              <button
                onClick={() => setShowAccountModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 rounded-xl text-xs text-blue-900 dark:text-blue-200">
                <p className="font-semibold mb-1">🔒 সম্পূর্ণ ব্যক্তিগত ও সুরক্ষিত:</p>
                <p className="text-[11px] leading-relaxed text-blue-800 dark:text-blue-300">
                  আপনার ফাইন্যান্সিয়াল ডাটা কেবল আপনার পছন্দ করা Google Drive ফোল্ডারে (<code className="font-mono bg-blue-100 dark:bg-blue-900/50 px-1 rounded">FINORA_Financial_Backups</code>) ব্যাকআপ হবে। অন্য কোনো অ্যাকাউন্টে ডাটা শেয়ার হবে না।
                </p>
              </div>

              {/* Enter Custom Gmail Address */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  আপনার Google / Gmail অ্যাকাউন্ট ইমেইল লিখুন:
                </label>
                <input
                  type="email"
                  value={customEmailInput}
                  onChange={(e) => setCustomEmailInput(e.target.value)}
                  placeholder="e.g. yourname@gmail.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
                {user?.email && user.email !== customEmailInput && (
                  <p className="text-[11px] text-slate-500">
                    বর্তমান লগইন আইডি: <button type="button" onClick={() => setCustomEmailInput(user.email || '')} className="text-blue-500 hover:underline font-semibold">{user.email}</button>
                  </p>
                )}
              </div>

              {/* Primary Connect Button */}
              <button
                type="button"
                onClick={() => handleConnectGoogleDrive(customEmailInput)}
                disabled={!customEmailInput.trim() || isConnectingDrive}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                {isConnectingDrive ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>সংযুক্ত করা হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>এই অ্যাকাউন্টে ড্রাইভ ব্যাকআপ যুক্ত করুন</span>
                  </>
                )}
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                <span className="flex-shrink mx-3 text-[11px] text-slate-400">অথবা পপ-আপ দিয়ে অ্যাকাউন্ট বেছে নিন</span>
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
              </div>

              {/* Google OAuth Account Chooser Button */}
              <button
                type="button"
                onClick={() => handleConnectGoogleDrive()}
                disabled={isConnectingDrive}
                className="w-full py-2.5 px-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2.5 cursor-pointer shadow-xs"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Google Account Chooser (পপ-আপ দিয়ে অ্যাকাউন্ট নির্বাচন)</span>
              </button>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAccountModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
              >
                বাতিল করুন
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Google Drive Backups List & Restore Modal */}
      {showDriveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Google Drive সংরক্ষিত ব্যাকআপ ফাইলসমূহ
                </h3>
              </div>
              <button
                onClick={() => setShowDriveModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              {isLoadingDriveFiles ? (
                <div className="p-8 text-center space-y-2">
                  <RefreshCw className="w-6 h-6 text-emerald-500 animate-spin mx-auto" />
                  <p className="text-xs text-slate-500">গুগল ড্রাইভ ফোল্ডার থেকে ব্যাকআপ লোড করা হচ্ছে...</p>
                </div>
              ) : driveFiles.length === 0 ? (
                <div className="p-8 text-center space-y-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700">
                  <FileJson className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    আপনার Google Drive ফোল্ডারে কোনো ব্যাকআপ ফাইল পাওয়া যায়নি।
                  </p>
                  <p className="text-[11px] text-slate-400">
                    "এখনই Google Drive এ ব্যাকআপ তুলুন" বাটনে ক্লিক করে নতুন ব্যাকআপ ফাইল আপলোড করুন।
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {driveFiles.map((file) => (
                    <div
                      key={file.id}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between gap-3 hover:border-emerald-500/50 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <FileJson className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {file.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                          <span>তৈরির তারিখ: {new Date(file.createdTime).toLocaleString('bn-BD')}</span>
                          {file.size && <span>• আকার: {Math.round(parseInt(file.size, 10) / 1024)} KB</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleRestoreFromDriveFile(file)}
                          disabled={restoringFileId === file.id}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                        >
                          {restoringFileId === file.id ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>রিস্টোর হচ্ছে...</span>
                            </>
                          ) : (
                            <span>রিস্টোর করুন</span>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDriveFile(file.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                ড্রাইভ ফোল্ডার: <strong>FINORA_Financial_Backups</strong>
              </span>
              <button
                type="button"
                onClick={() => setShowDriveModal(false)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold"
              >
                বন্ধ করুন
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
