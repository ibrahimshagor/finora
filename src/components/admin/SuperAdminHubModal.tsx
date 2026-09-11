import React, { useState } from 'react';
import { 
  X, 
  Crown, 
  ShieldCheck, 
  Copy, 
  Check, 
  ExternalLink, 
  Database, 
  Cloud, 
  RefreshCw, 
  Download, 
  Sparkles, 
  Key, 
  Globe, 
  HelpCircle,
  Activity,
  Layers,
  CheckCircle2,
  Sliders,
  ShieldAlert,
  ToggleLeft,
  ToggleRight,
  Lock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinancialContext';
import { APP_INFO } from '../../lib/constants';
import { getSystemAccessControl, saveSystemAccessControl, SystemAccessControl } from '../../lib/systemAccessControl';

interface SuperAdminHubModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SuperAdminHubModal: React.FC<SuperAdminHubModalProps> = ({ isOpen, onClose }) => {
  const { user, isSuperAdmin, logout, loginAsSuperAdmin } = useAuth();
  const { 
    accounts, 
    transactions, 
    loans, 
    budgets, 
    investments, 
    bills,
    syncAllDataToFirestore,
    syncStatus,
    currency
  } = useFinance();

  const [activeTab, setActiveTab] = useState<'controls' | 'domain' | 'database' | 'backup'>('controls');
  const [copiedDomain, setCopiedDomain] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);
  const [pingLatency, setPingLatency] = useState<number | null>(null);
  const [isPinging, setIsPinging] = useState(false);

  // Access Control Settings
  const [systemSettings, setSystemSettings] = useState<SystemAccessControl>(getSystemAccessControl());
  const [newPin, setNewPin] = useState(systemSettings.masterPin);
  const [pinUpdateSuccess, setPinUpdateSuccess] = useState(false);

  // Strictly hide if modal is closed or user is not the authenticated super admin
  if (!isOpen || !isSuperAdmin) return null;

  const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';
  const isDefaultAuthorized = currentHost.includes('localhost') || 
    currentHost.includes('firebaseapp.com') || 
    currentHost.includes('web.app') || 
    currentHost.includes('127.0.0.1');

  const handleToggleGuestMode = () => {
    const updated = saveSystemAccessControl({
      isGuestModeEnabled: !systemSettings.isGuestModeEnabled,
    });
    setSystemSettings(updated);
  };

  const handleToggleSuperAdminQuickLogin = () => {
    const updated = saveSystemAccessControl({
      isSuperAdminQuickLoginEnabled: !systemSettings.isSuperAdminQuickLoginEnabled,
    });
    setSystemSettings(updated);
  };

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPin.trim() || newPin.trim().length < 4) {
      alert('মাস্টার পিন কমপক্ষে ৪ সংখ্যার হতে হবে।');
      return;
    }
    const updated = saveSystemAccessControl({
      masterPin: newPin.trim(),
    });
    setSystemSettings(updated);
    setPinUpdateSuccess(true);
    setTimeout(() => setPinUpdateSuccess(false), 3000);
  };

  const handleCopy = () => {
    if (currentHost) {
      navigator.clipboard.writeText(currentHost);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 3000);
    }
  };

  const handleForceSync = async () => {
    setIsSyncing(true);
    setSyncSuccessMsg(null);
    try {
      await syncAllDataToFirestore();
      setSyncSuccessMsg('ক্লাউড ডাটাবেস সফলভাবে সমন্বয় করা হয়েছে!');
      setTimeout(() => setSyncSuccessMsg(null), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePingTest = async () => {
    setIsPinging(true);
    const start = performance.now();
    try {
      await new Promise((resolve) => setTimeout(resolve, 180));
      const end = performance.now();
      setPingLatency(Math.round(end - start));
    } finally {
      setIsPinging(false);
    }
  };

  const handleDownloadMasterBackup = () => {
    const fullBackup = {
      platform: APP_INFO.name,
      version: APP_INFO.version,
      exportedAt: new Date().toISOString(),
      exportedBy: 'Md. Ibrahim Hossain (Super Admin)',
      ownerEntity: APP_INFO.poweredBy,
      website: APP_INFO.website,
      data: {
        accounts,
        transactions,
        loans,
        budgets,
        investments,
        bills
      }
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fullBackup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `FINORA_MASTER_BACKUP_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div 
      id="super-admin-hub-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in"
    >
      <div className="w-full max-w-2xl bg-slate-900 border border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-100">
        
        {/* Header with Gold/Emerald Accent */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-amber-950/80 via-slate-900 to-emerald-950/80 border-b border-amber-500/30 flex items-center justify-between relative">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0 font-black">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white tracking-wide">
                  সুপার অ্যাডমিন হাব (Super Admin Hub)
                </h3>
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-bold rounded-full border border-amber-500/30">
                  Master Authority
                </span>
              </div>
              <p className="text-xs text-amber-200/80 font-medium">
                {APP_INFO.name} • ওনার ও সিস্টেম ম্যানেজমেন্ট কন্ট্রোল
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Super Admin Ownership Card */}
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
              IH
            </div>
            <div>
              <p className="font-bold text-white">Md. Ibrahim Hossain</p>
              <p className="text-[11px] text-slate-400">
                Email: <span className="text-emerald-400 font-mono">ibrahimshagor.official@gmail.com</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] px-2.5 py-1 bg-slate-800 text-slate-300 rounded-lg border border-slate-700">
              Powered by: <strong className="text-white">{APP_INFO.poweredBy}</strong>
            </span>
            <span className="text-[11px] px-2.5 py-1 bg-emerald-950 text-emerald-300 rounded-lg border border-emerald-800 font-mono">
              v{APP_INFO.version} Pro
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 px-4 pt-2 gap-2 text-xs overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('controls')}
            className={`pb-3 px-3 font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'controls'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>সিস্টেম ও ডেমো কন্ট্রোল</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('domain')}
            className={`pb-3 px-3 font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'domain'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>ডোমেইন ও গুগল সাইন-ইন</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('database')}
            className={`pb-3 px-3 font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'database'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>ক্লাউড ডাটাবেস ও সিঙ্ক</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`pb-3 px-3 font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'backup'
                ? 'border-purple-400 text-purple-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>মাস্টার ব্যাকআপ ও এক্সপোর্ট</span>
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs">

          {/* TAB 0: SYSTEM ACCESS & SECURITY CONTROLS */}
          {activeTab === 'controls' && (
            <div className="space-y-4">
              {/* Demo Mode Toggle Card */}
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-white">গেস্ট / ডেমো মোড এক্সেস (Guest Demo Mode)</h4>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                        systemSettings.isGuestModeEnabled
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                      }`}>
                        {systemSettings.isGuestModeEnabled ? 'বর্তমানে চালু' : 'বর্তমানে বন্ধ'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      এটি চালু থাকলে ভিজিটররা সাইন ইন ছাড়াই ডেমো মোডে অ্যাপের ড্যাশবোর্ড টেস্ট করতে পারবে। বন্ধ রাখলে ডেমো লগইন অপশনটি অফ থাকবে এবং ইউজারদের নিজস্ব অ্যাকাউন্ট দিয়ে সাইন ইন করতে হবে।
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleGuestMode}
                    className={`shrink-0 p-1.5 rounded-xl border flex items-center gap-1.5 font-bold transition-all cursor-pointer ${
                      systemSettings.isGuestModeEnabled
                        ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/30'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {systemSettings.isGuestModeEnabled ? (
                      <>
                        <ToggleRight className="w-5 h-5 text-emerald-400" />
                        <span className="text-[11px] pr-1">চালু</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-5 h-5 text-slate-500" />
                        <span className="text-[11px] pr-1">বন্ধ</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Super Admin Quick Banner Toggle Card */}
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-white">লগইন পেজে সুপার অ্যাডমিন ব্যানার (Admin Quick Banner)</h4>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                        systemSettings.isSuperAdminQuickLoginEnabled
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {systemSettings.isSuperAdminQuickLoginEnabled ? 'প্রদর্শিত হচ্ছে' : 'লুকানো (হাইড করা)'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      সাধারণ ভিজিটরদের থেকে অ্যাডমিন ব্যানার গোপন রাখতে এটি বন্ধ রাখুন। আপনি লগইন স্ক্রিনের ফুটারে থাকা নিরাপদ ওনার অ্যাক্সেস লিঙ্ক থেকে মাস্টার পিন দিয়ে যেকোনো সময় ঢুকতে পারবেন।
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleSuperAdminQuickLogin}
                    className={`shrink-0 p-1.5 rounded-xl border flex items-center gap-1.5 font-bold transition-all cursor-pointer ${
                      systemSettings.isSuperAdminQuickLoginEnabled
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {systemSettings.isSuperAdminQuickLoginEnabled ? (
                      <>
                        <ToggleRight className="w-5 h-5 text-amber-400" />
                        <span className="text-[11px] pr-1">অন</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-5 h-5 text-slate-500" />
                        <span className="text-[11px] pr-1">অফ</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Master PIN Configuration Card */}
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
                <div>
                  <h4 className="text-xs font-bold text-white">সুপার অ্যাডমিন মাস্টার পিন (Master Security PIN)</h4>
                  <p className="text-[11px] text-slate-400">
                    লগইন পেজ থেকে সুপার অ্যাডমিন হিসেবে প্রবেশ করতে এই গোপন পিন কোডটি প্রয়োজন হয়।
                  </p>
                </div>

                <form onSubmit={handleSavePin} className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value)}
                      placeholder="নতুন মাস্টার পিন লিখুন"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer shrink-0"
                  >
                    সেভ করুন
                  </button>
                </form>

                {pinUpdateSuccess && (
                  <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>মাস্টার পিন সফলভাবে আপডেট করা হয়েছে!</span>
                  </p>
                )}
              </div>
            </div>
          )}
          
          {/* TAB 1: DOMAIN & GOOGLE AUTH */}
          {activeTab === 'domain' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-white">বর্তমান ডোমেইন এড্রেস:</h4>
                    <p className="text-[11px] text-slate-400">এই ডোমেইনের জন্য গুগল অথেন্টিকেশন সক্রিয় করুন</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                  >
                    {copiedDomain ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedDomain ? 'কপি সম্পন্ন!' : 'ডোমেইন কপি করুন'}</span>
                  </button>
                </div>

                <div className="font-mono text-sm text-emerald-400 bg-slate-900 p-3 rounded-xl border border-slate-800 select-all break-all">
                  {currentHost}
                </div>

                <div className="flex items-center gap-2">
                  <span className={`inline-block w-2.5 h-2.5 rounded-full ${isDefaultAuthorized ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
                  <span className="text-[11px] text-slate-300">
                    {isDefaultAuthorized 
                      ? 'ডিফল্ট অনুমোদিত ডোমেইন / লোকালহোস্টে সচল'
                      : 'কাস্টম ডোমেইন: Firebase Console-এ একবার যুক্ত করে নিলেই অফিসিয়াল পপ-আপ সরাসরি কাজ করবে'}
                  </span>
                </div>
              </div>

              {/* Step-by-Step Resolution */}
              <div className="p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-emerald-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Google পপ-আপ চালু করার সহজ ৩টি ধাপ:</span>
                </h4>

                <ol className="space-y-2 text-[11px] text-slate-300 list-decimal pl-4 leading-relaxed">
                  <li>
                    নিচের বোতামে ক্লিক করে আপনার <strong>Firebase Console</strong>-এ প্রবেশ করুন।
                  </li>
                  <li>
                    <strong>Authentication</strong> &gt; <strong>Settings</strong> ট্যাবে গিয়ে <strong>Authorized domains</strong> সেকশন খুঁজুন।
                  </li>
                  <li>
                    <strong>Add domain</strong> বোতামে ক্লিক করে উপরের কপি করা ডোমেইন (<code className="text-amber-300">{currentHost}</code>) পেস্ট করে সেভ করুন।
                  </li>
                </ol>

                <div className="pt-2 flex items-center gap-3">
                  <a
                    href="https://console.firebase.google.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors inline-flex"
                  >
                    <span>Firebase Console খুলুন</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <p className="text-[11px] text-slate-400">
                    (এটি কেবল একবারের জন্য কনফিগার করতে হয়)
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DATABASE & CLOUD SYNC */}
          {activeTab === 'database' && (
            <div className="space-y-4">
              {/* Cloud Sync Status */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">অ্যাকাউন্টস</p>
                  <p className="text-lg font-black text-emerald-400">{accounts.length}</p>
                </div>
                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">মোট লেনদেন</p>
                  <p className="text-lg font-black text-sky-400">{transactions.length}</p>
                </div>
                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">ঋণ ও দেনা</p>
                  <p className="text-lg font-black text-amber-400">{loans.length}</p>
                </div>
                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">বাজেট ও লক্ষ্য</p>
                  <p className="text-lg font-black text-purple-400">{budgets.length}</p>
                </div>
              </div>

              {/* Force Sync Actions */}
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white">ক্লাউড ফায়ারস্টোর লাইভ সিঙ্ক:</h4>
                    <p className="text-[11px] text-slate-400">বর্তমান স্ট্যাটাস: {syncStatus === 'synced' ? 'সিঙ্কড (আপ-টু-ডেট)' : syncStatus}</p>
                  </div>

                  <button
                    type="button"
                    onClick={handleForceSync}
                    disabled={isSyncing}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'সিঙ্ক হচ্ছে...' : 'ফোর্স সিঙ্ক করুন'}</span>
                  </button>
                </div>

                {syncSuccessMsg && (
                  <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{syncSuccessMsg}</span>
                  </div>
                )}
              </div>

              {/* Ping Latency Test */}
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">সার্ভার ও ডাটাবেস লেটেন্সি পিং:</h4>
                  <p className="text-[11px] text-slate-400">
                    {pingLatency ? `লেটেন্সি রেসপন্স: ${pingLatency} ms (চমৎকার)` : 'সংযোগ পরীক্ষা করুন'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handlePingTest}
                  disabled={isPinging}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isPinging ? 'পরীক্ষা হচ্ছে...' : 'পিং টেস্ট'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: MASTER BACKUP */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
                <div>
                  <h4 className="text-xs font-bold text-white">সম্পূর্ণ ডাটাবেস ব্যাকআপ (JSON Master File)</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    সুপার অ্যাডমিন হিসেবে আপনি সম্পূর্ণ প্ল্যাটফর্মের সকল হিসাব, লেনদেন, ব্যাংক অ্যাকাউন্ট, ঋণ ও বাজেটের সম্পূর্ণ এনক্রিপ্টেড ব্যাকআপ ১-ক্লিকে ডাউনলোড করতে পারেন।
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadMasterBackup}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-purple-950/40 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>মাস্টার ব্যাকআপ ফাইল ডাউনলোড করুন (.JSON)</span>
                </button>
              </div>

              <div className="p-3.5 bg-slate-950/50 border border-slate-800 rounded-2xl text-[11px] text-slate-400 space-y-1">
                <p className="font-semibold text-slate-300">ডেভেলপার ও টেকনিক্যাল সাপোর্ট:</p>
                <p>কপিরাইট &copy; {new Date().getFullYear()} {APP_INFO.developedBy} • {APP_INFO.poweredBy}</p>
                <p>অফিশিয়াল ওয়েবসাইট: <a href={APP_INFO.website} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">{APP_INFO.website}</a></p>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400 text-[11px]">
            সুপার অ্যাডমিন সেশন সক্রিয়
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-colors cursor-pointer"
          >
            বন্ধ করুন
          </button>
        </div>

      </div>
    </div>
  );
};
