import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, Check, Copy, ArrowRight, ShieldCheck, Mail, User } from 'lucide-react';

export const GoogleQuickPickerModal: React.FC = () => {
  const { showGoogleQuickPicker, setShowGoogleQuickPicker, loginWithDirectGoogleAccount } = useAuth();
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [copiedDomain, setCopiedDomain] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!showGoogleQuickPicker) return null;

  const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';

  const handleCopy = () => {
    if (currentHost) {
      navigator.clipboard.writeText(currentHost);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 3000);
    }
  };

  const handleConfirm = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim()) return;
    setIsSubmitting(true);
    try {
      await loginWithDirectGoogleAccount(email.trim(), displayName.trim());
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 text-slate-100 relative">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-md shrink-0">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Google অ্যাকাউন্ট নির্বাচন</h3>
              <p className="text-[11px] text-slate-400">আপনার Google ইমেইল দিয়ে প্রবেশ করুন</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowGoogleQuickPicker(false)}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Change Account Form */}
        <form onSubmit={handleConfirm} className="space-y-3.5">
          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">
              আপনার Google ইমেইল ঠিকানা:
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.name@gmail.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">
              আপনার পুরো নাম (ঐচ্ছিক):
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="আপনার নাম (যেমন: Tanvir Ahmed)"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>সম্পূর্ণ স্বতন্ত্র অ্যাকাউন্ট ও ক্লাউড ডাটাবেস সংরক্ষিত হবে</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !email.trim()}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Google অ্যাকাউন্টে প্রবেশ করুন</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Info for Authorized Domains */}
        <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1.5 text-[11px] text-slate-400">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate font-mono text-[10px] text-slate-300">{currentHost}</span>
            <button
              type="button"
              onClick={handleCopy}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] flex items-center gap-1 font-medium shrink-0 cursor-pointer"
            >
              {copiedDomain ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedDomain ? 'কপি হয়েছে' : 'ডোমেইন কপি'}</span>
            </button>
          </div>
          <p className="text-[10px] text-slate-500 leading-normal">
            Firebase Console &gt; Authentication &gt; Settings &gt; Authorized Domains-এ ডোমেইনটি যোগ করলে গুগল পপ-আপ সরাসরি কাজ করবে।
          </p>
        </div>

      </div>
    </div>
  );
};
