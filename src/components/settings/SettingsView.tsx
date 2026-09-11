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
  FileSpreadsheet,
  Smartphone,
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
    importFromCsvOrJsonFile,
    resetToDemoData,
    resetAllData,
    syncAllDataToFirestore
  } = useFinance();

  const { user, isGuestMode } = useAuth();
  
  // User Scope Key (prevents cross-account session leakage)
  const userKey = user?.uid || (user?.email ? 'u_' + btoa(user.email).replace(/[^a-zA-Z0-9]/g, '').slice(0, 15) : 'guest');

  // Status states
  const [importStatus, setImportStatus] = useState<string>('');
  const [testingDb, setTestingDb] = useState<boolean>(false);
  const [dbTestResult, setDbTestResult] = useState<string | null>(null);
  const [isPushingToFirestore, setIsPushingToFirestore] = useState(false);
  const [firestorePushResult, setFirestorePushResult] = useState<string | null>(null);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  // Auto Backup Config & Snapshot state
  const [autoBackupConfig, setAutoBackupConfig] = useState<AutoBackupConfig>(() => getAutoBackupConfig(userKey));
  const [snapshots, setSnapshots] = useState<BackupSnapshot[]>(() => getStoredSnapshots(userKey));
  const [isTakingSnapshot, setIsTakingSnapshot] = useState(false);
  const [snapshotMessage, setSnapshotMessage] = useState<string | null>(null);

  // Mobile & File-based Backup & Restore state
  const [isRestoringFile, setIsRestoringFile] = useState(false);
  const [fileRestoreStatus, setFileRestoreStatus] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [downloadSuccessMsg, setDownloadSuccessMsg] = useState<string | null>(null);

  // Refresh snapshot status whenever current user changes
  useEffect(() => {
    setSnapshots(getStoredSnapshots(userKey));
    setAutoBackupConfig(getAutoBackupConfig(userKey));
  }, [userKey]);

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

  // 1. Export CSV Backup (Opens in Excel, Google Sheets, Mobile file viewers)
  const handleExportCSV = () => {
    try {
      const header = ['তারিখ (Date)', 'ধরন (Type)', 'ক্যাটেগরি (Category)', 'পরিমাণ (Amount)', 'অ্যাকাউন্ট (Account)', 'বিবরণ (Description)'];
      const rows = transactions.map(tx => {
        const acc = accounts.find(a => a.id === tx.accountId)?.name || 'ক্যাশ';
        const typeBn = tx.type === 'income' ? 'আয়' : (tx.type === 'expense' ? 'খরচ' : 'স্থানান্তর');
        const desc = (tx.description || '').replace(/"/g, '""');
        return [
          tx.date,
          typeBn,
          `"${tx.category}"`,
          tx.amount,
          `"${acc}"`,
          `"${desc}"`
        ].join(',');
      });

      const csvContent = '\uFEFF' + [header.join(','), ...rows].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const fileName = `FINORA_Transactions_${new Date().toISOString().split('T')[0]}.csv`;
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloadSuccessMsg(`✅ "${fileName}" ফাইলটি আপনার মোবাইলে সফলভাবে ডাউনলোড হয়েছে!`);
      setTimeout(() => setDownloadSuccessMsg(null), 5000);
    } catch (err) {
      console.error('CSV Export error:', err);
    }
  };

  // 2. Export Excel Compatible Spreadsheet (.xls)
  const handleExportExcel = () => {
    try {
      const rowsHtml = transactions.map(tx => {
        const acc = accounts.find(a => a.id === tx.accountId)?.name || 'ক্যাশ';
        const typeBn = tx.type === 'income' ? 'আয়' : (tx.type === 'expense' ? 'খরচ' : 'স্থানান্তর');
        return `<tr>
          <td>${tx.date}</td>
          <td>${typeBn}</td>
          <td>${tx.category}</td>
          <td>${tx.amount}</td>
          <td>${acc}</td>
          <td>${tx.description || ''}</td>
        </tr>`;
      }).join('');

      const excelTemplate = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
      </head>
      <body>
        <table border="1">
          <thead>
            <tr style="background-color:#059669;color:#ffffff;font-weight:bold;">
              <th>তারিখ (Date)</th>
              <th>ধরন (Type)</th>
              <th>ক্যাটেগরি (Category)</th>
              <th>পরিমাণ (Amount)</th>
              <th>অ্যাকাউন্ট (Account)</th>
              <th>বিবরণ (Description)</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </body>
      </html>`;

      const blob = new Blob(['\uFEFF' + excelTemplate], { type: 'application/vnd.ms-excel;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const fileName = `FINORA_Excel_Backup_${new Date().toISOString().split('T')[0]}.xls`;
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloadSuccessMsg(`✅ "${fileName}" এক্সেল ফাইলটি আপনার মোবাইলে সফলভাবে ডাউনলোড হয়েছে!`);
      setTimeout(() => setDownloadSuccessMsg(null), 5000);
    } catch (err) {
      console.error('Excel Export error:', err);
    }
  };

  // 3. Export Full System Backup JSON
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
      const fileName = `FINORA_FullBackup_${new Date().toISOString().split('T')[0]}.json`;
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloadSuccessMsg(`✅ "${fileName}" সম্পূর্ণ ব্যাকআপ ফাইলটি আপনার মোবাইলে সেভ হয়েছে!`);
      setTimeout(() => setDownloadSuccessMsg(null), 5000);
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  // 4. Restore from Phone (CSV, Excel-CSV, or JSON)
  const handleMobileFileRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsRestoringFile(true);
    setFileRestoreStatus({ text: `"${file.name}" ফাইলটি প্রসেস ও রিস্টোর করা হচ্ছে...`, type: 'info' });

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const content = evt.target?.result as string;
        if (!content || !content.trim()) {
          setFileRestoreStatus({ text: '❌ নির্বাচিত ফাইলটি ফাঁকা বা পড়তে পারা যায়নি।', type: 'error' });
          setIsRestoringFile(false);
          return;
        }

        const res = await importFromCsvOrJsonFile(content, file.name);
        if (res.success) {
          setFileRestoreStatus({
            text: `✅ "${file.name}" ফাইল থেকে সফলভাবে রিস্টোর সম্পন্ন হয়েছে! ফায়ারবেস ক্লাউড ডাটাবেজেও তথ্য আপডেট হয়ে গেছে।`,
            type: 'success'
          });
        } else {
          setFileRestoreStatus({
            text: `❌ রিস্টোর ত্রুটি: ${res.error || 'সঠিক ব্যাকআপ ফাইল প্রদান করুন।'}`,
            type: 'error'
          });
        }
      } catch (err: any) {
        setFileRestoreStatus({
          text: `❌ ফাইল পড়তে ব্যর্থ: ${err.message || err}`,
          type: 'error'
        });
      } finally {
        setIsRestoringFile(false);
        e.target.value = '';
      }
    };
    reader.readAsText(file);
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

      const updated = saveSnapshot(snapshot, 10, userKey);
      setSnapshots(updated);

      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const updatedConfig = saveAutoBackupConfig({
        lastBackupDate: todayStr,
        lastBackupTimestamp: now.toISOString(),
      }, userKey);
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
      const updated = deleteStoredSnapshot(id, userKey);
      setSnapshots(updated);
    }
  };

  // Reset Account Data to Clean ZERO State
  const handleConfirmReset = async () => {
    setIsResetting(true);
    try {
      if (typeof resetAllData === 'function') {
        await resetAllData();
      } else if (typeof resetToDemoData === 'function') {
        await resetToDemoData();
      }
      setResetSuccessMessage('✅ আপনার অ্যাকাউন্টের সমস্ত তথ্য মুছে সফলভাবে ০ (শূন্য) করা হয়েছে!');
      setShowResetConfirmModal(false);
      setTimeout(() => setResetSuccessMessage(null), 6000);
    } catch (e: any) {
      alert(`রিসেট করতে সমস্যা হয়েছে: ${e.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      
      {/* Page Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <span>সেটিংস ও ডেটা ব্যাকআপ হাব (Settings & Data Hub)</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          মোবাইলে ম্যানুয়াল ব্যাকআপ ডাউনলোড (CSV, Excel, JSON), ফোন থেকে অটো-রিস্টোর ও ক্লাউড ডেটাবেস সিঙ্ক।
        </p>
      </div>

      {/* 1. Mobile & Offline File-based Backup & Restore Section */}
      <div className="bg-gradient-to-br from-white via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 rounded-2xl p-6 border border-emerald-500/30 dark:border-emerald-500/20 shadow-sm space-y-6 relative overflow-hidden">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  মোবাইল ফাইল ব্যাকআপ ও রিস্টোর (Mobile File Backup & Restore)
                </h3>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 rounded-md text-[10px] font-bold">
                  ক্লিন ও ঝামেলামুক্ত
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                কোনো গুগল ক্লায়েন্ট আইডি বা ড্রাইভ সংযোগের প্রয়োজন নেই। সরাসরি আপনার ফোনে CSV বা Excel ফাইল সেভ করে রাখুন।
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 shrink-0">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>অফলাইন ও নিরাপদ স্টোরেজ</span>
          </div>
        </div>

        {/* Action Grid: Part 1 - Download to Phone */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>১. ফোনে ব্যাকআপ ফাইল নামিয়ে রাখুন (Download to Phone):</span>
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            {/* CSV Backup */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>CSV ব্যাকআপ ডাউনলোড</span>
            </button>

            {/* Excel Backup */}
            <button
              type="button"
              onClick={handleExportExcel}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Excel ব্যাকআপ (.xls)</span>
            </button>

            {/* Full JSON Backup */}
            <button
              type="button"
              onClick={handleExportBackup}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer border border-slate-700"
            >
              <FileJson className="w-4 h-4 text-amber-400" />
              <span>ফুল ব্যাকআপ (JSON)</span>
            </button>

          </div>
        </div>

        {/* Action Grid: Part 2 - Restore from Phone */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Upload className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>২. ফোন থেকে ব্যাকআপ আপলোড ও অটো-রিস্টোর (Restore from Phone):</span>
          </span>
          
          <div className="p-4 rounded-xl border border-dashed border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                পূর্বে নামানো CSV, Excel অথবা JSON ফাইল নির্বাচন করুন
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                ফাইল সিলেক্ট করলেই ফোনে সেভ করা সমস্ত হিসাব স্বয়ংক্রিয়ভাবে রিস্টোর হবে এবং ফায়ারবেস ক্লাউড ডাটাবেজে আপডেট হয়ে যাবে।
              </p>
            </div>

            <div className="shrink-0 w-full sm:w-auto">
              <input
                type="file"
                id="mobile_restore_file_input"
                accept=".csv,.json,.txt,.xls,.xlsx"
                onChange={handleMobileFileRestore}
                disabled={isRestoringFile}
                className="hidden"
              />
              <label
                htmlFor="mobile_restore_file_input"
                className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer ${
                  isRestoringFile 
                    ? 'bg-slate-400 text-white cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                }`}
              >
                {isRestoringFile ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>রিস্টোর হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <FolderDown className="w-4 h-4" />
                    <span>ফোন থেকে ফাইল সিলেক্ট করুন</span>
                  </>
                )}
              </label>
            </div>
          </div>
        </div>

        {/* Download Success Notice */}
        {downloadSuccessMsg && (
          <div className="p-3 rounded-xl text-xs font-semibold flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{downloadSuccessMsg}</span>
          </div>
        )}

        {/* Restore Status Notice */}
        {fileRestoreStatus && (
          <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in ${
            fileRestoreStatus.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : fileRestoreStatus.type === 'info'
              ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
          }`}>
            {fileRestoreStatus.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : fileRestoreStatus.type === 'info' ? (
              <RefreshCw className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{fileRestoreStatus.text}</span>
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

        {/* Force Push to Firebase Console Action */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              ফায়ারবেস কনসোলে ডেটা সরাসরি আপলোড
            </span>
            <span className="text-[11px] text-slate-400">
              আপনার সমস্ত অ্যাকাউন্ট, লেনদেন, ঋণ, বাজেট ও সেভিংস গোল এক ক্লিকে ফায়ারবেস ক্লাউডে পুশ করুন।
            </span>
          </div>

          <button
            type="button"
            disabled={isPushingToFirestore}
            onClick={async () => {
              setIsPushingToFirestore(true);
              setFirestorePushResult(null);
              try {
                const res = await syncAllDataToFirestore();
                if (res.success) {
                  setFirestorePushResult(`✅ সফলভাবে ${res.count} টি রেকর্ড ফায়ারবেস ক্লাউড ডেটাবেসে পুশ ও সংরক্ষিত হয়েছে!`);
                } else {
                  setFirestorePushResult('⚠️ সিঙ্ক সম্পন্ন হতে সমস্যা হয়েছে। ইন্টারনেট বা অথেন্টিকেশন পরীক্ষা করুন।');
                }
              } catch (e: any) {
                setFirestorePushResult(`❌ সিঙ্ক ত্রুটি: ${e?.message || 'অজানা সমস্যা'}`);
              } finally {
                setIsPushingToFirestore(false);
              }
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <Cloud className={`w-4 h-4 ${isPushingToFirestore ? 'animate-bounce' : ''}`} />
            <span>{isPushingToFirestore ? 'ক্লাউডে সিঙ্ক হচ্ছে...' : 'ফায়ারবেস কনসোলে ডাটা সিঙ্ক করুন'}</span>
          </button>
        </div>

        {firestorePushResult && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-medium text-emerald-800 dark:text-emerald-300">
            {firestorePushResult}
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
                accept=".csv,.json,.txt,.xls,.xlsx"
                onChange={handleMobileFileRestore}
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

        {/* Reset Account Data to Zero */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 block flex items-center gap-1.5">
              <Trash2 className="w-3.5 h-3.5" />
              <span>অ্যাকাউন্ট ডাটা রিসেট (সব শূন্য করুন)</span>
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              সমস্ত ব্যালেন্স, লেনদেন, ঋণ, বাজেট ও বিলের তথ্য মুছে অ্যাকাউন্টটি সম্পূর্ণ শূন্য (০) এবং ফ্রেশ করতে এটি ব্যবহার করুন।
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowResetConfirmModal(true)}
            className="shrink-0 flex items-center justify-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>অ্যাকাউন্ট রিসেট করুন</span>
          </button>
        </div>

        {resetSuccessMessage && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-semibold text-rose-800 dark:text-rose-300">
            {resetSuccessMessage}
          </div>
        )}

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
              Version 2.5.0 • Mobile File Backup & Automated Daily Backup Ready
            </div>
          </div>

        </div>
      </div>

      {/* Account Zero Reset Confirmation Modal */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 rounded-2xl p-6 shadow-2xl space-y-5">
            
            <div className="flex items-center gap-3 border-b border-rose-100 dark:border-rose-900/50 pb-3">
              <div className="p-2.5 bg-rose-100 dark:bg-rose-950/80 rounded-xl text-rose-600 dark:text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  অ্যাকাউন্ট সম্পূর্ণ রিসেট সতর্কতা
                </h3>
                <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold">
                  সকল ডাটা মুছে ০ (শূন্য) হবে
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <p className="leading-relaxed">
                আপনি কি নিশ্চিত যে আপনার অ্যাকাউন্টের সমস্ত তথ্য (লেনদেন, অ্যাকাউন্ট ব্যালেন্স, ঋণ, বাজেট, সঞ্চয়ী লক্ষ্য, বিল ও বিনিয়োগ) স্থায়ীভাবে মুছে ফেলে সবকিছু <strong>০ (শূন্য)</strong> করতে চান?
              </p>
              
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-[11px] text-rose-800 dark:text-rose-300 font-medium">
                ⚠️ সতর্কবার্তা: এই প্রক্রিয়াটি সম্পন্ন হওয়ার পর পূর্বের কোনো ডাটা পুনরুদ্ধার করা যাবে না। যদি প্রয়োজন হয়, রিসেট করার পূর্বে "JSON ব্যাকআপ ফাইল নামান" বাটনে ক্লিক করে একটি ব্যাকআপ কপি সংরক্ষণ করে রাখুন।
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(false)}
                disabled={isResetting}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                বাতিল করুন
              </button>

              <button
                type="button"
                onClick={handleConfirmReset}
                disabled={isResetting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                {isResetting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>রিসেট হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>হ্যাঁ, সবকিছু ০ করুন</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
