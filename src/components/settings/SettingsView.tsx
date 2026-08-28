import React, { useState } from 'react';
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
  UserCheck
} from 'lucide-react';
import { useFinance } from '../../context/FinancialContext';
import { useAuth } from '../../context/AuthContext';
import { CURRENCIES } from '../../lib/constants';
import { testFirebaseConnection } from '../../lib/firebase';

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
    syncStatus,
    exportFullDataJSON,
    exportDataJSON,
    importFullDataJSON,
    importDataJSON,
    resetToDemoData,
    resetAllData
  } = useFinance();

  const { user, isGuestMode } = useAuth();
  const [importStatus, setImportStatus] = useState<string>('');
  const [testingDb, setTestingDb] = useState<boolean>(false);
  const [dbTestResult, setDbTestResult] = useState<string | null>(null);

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
      }, null, 2);
      
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FINORA_Backup_${new Date().toISOString().split('T')[0]}.json`;
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

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          সেটিংস ও ডেটা ব্যবস্থাপনা (Settings & Data Hub)
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          অ্যাপ প্রেফারেন্স, মুদ্রা নির্বাচন, প্রাইভেসি মোড, ক্লাউড ফায়ারবেস স্থিতি এবং ব্যাকআপ।
        </p>
      </div>

      {/* Preferences Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-6">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Settings className="w-4 h-4 text-emerald-600" />
          <span>ব্যবহারকারীর পছন্দ (Preferences)</span>
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

        {/* Privacy Mode - Enhanced & Fully Responsive Toggle */}
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

      {/* Cloud & Firebase Database Verification Section */}
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
            <span className="text-[11px] text-slate-400 block">ব্যবহারকারীর ধরন</span>
            <div className="flex items-center gap-1.5 mt-1 font-semibold text-xs text-slate-800 dark:text-slate-200">
              <UserCheck className="w-4 h-4 text-emerald-500" />
              <span>{user?.email || (isGuestMode ? 'অফলাইন গেস্ট মোড' : 'সরাসরি ইউজার সেশন')}</span>
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

      {/* Data Backup & Restore Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-6">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-600" />
          <span>ডেটা ব্যাকআপ ও রিস্টোর (Backup & Offline Storage)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Export JSON Backup */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                সম্পূর্ণ ডেটা ব্যাকআপ ডাউনলোড
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

      {/* App & Developer Credits (Strict User Constraint Requirement) */}
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
                Developed by: <strong className="text-white">Md. Ibrahim Hossain</strong>
              </p>
              <p className="text-slate-400 mt-0.5">
                Powered by: <a href="https://www.tikmerk.com" target="_blank" rel="noopener noreferrer" className="text-emerald-400 font-bold hover:underline inline-flex items-center gap-1">TIKMERK IT <ExternalLink className="w-3 h-3" /></a>
              </p>
            </div>

            <div className="text-[11px] text-slate-400">
              Version 1.0.0 • Cloud Ready & Offline First
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};

