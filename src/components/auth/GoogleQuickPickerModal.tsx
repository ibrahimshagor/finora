import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, Check, Copy, ArrowRight, ShieldCheck, Mail, User, Crown, ExternalLink, HelpCircle, Sparkles } from 'lucide-react';
import { APP_INFO } from '../../lib/constants';

export const GoogleQuickPickerModal: React.FC = () => {
  const { 
    showGoogleQuickPicker, 
    setShowGoogleQuickPicker, 
    loginWithDirectGoogleAccount,
    loginAsSuperAdmin 
  } = useAuth();
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [copiedDomain, setCopiedDomain] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeMode, setActiveMode] = useState<'options' | 'manual'>('options');

  if (!showGoogleQuickPicker) return null;

  const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';

  const handleCopy = () => {
    if (currentHost) {
      navigator.clipboard.writeText(currentHost);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 3000);
    }
  };

  const handleSuperAdminLogin = async () => {
    setIsSubmitting(true);
    try {
      await loginAsSuperAdmin();
      setShowGoogleQuickPicker(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirm = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim()) return;
    setIsSubmitting(true);
    try {
      await loginWithDirectGoogleAccount(email.trim(), displayName.trim());
      setShowGoogleQuickPicker(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      id="google-quick-picker-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in"
    >
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/90 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 text-slate-100 relative max-h-[90vh] overflow-y-auto">
        
        {/* Modal Header */}
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
              <h3 className="text-sm font-bold text-white">Google লগইন ও ডোমেইন সমাধান</h3>
              <p className="text-[11px] text-slate-400">আপনার ডোমেইনে গুগল সাইন-ইন অ্যাসিস্ট্যান্ট</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowGoogleQuickPicker(false)}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Why this appeared Notice */}
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-200/90 space-y-1.5">
          <div className="flex items-center gap-2 text-amber-300 font-semibold text-xs">
            <HelpCircle className="w-4 h-4 shrink-0" />
            <span>কেন Google পপআপ নিজে থেকে খুলল না?</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Google Firebase-এর নিরাপত্তা নিয়ম অনুযায়ী, আপনার নিজস্ব ডোমেইন থেকে গুগল পপআপ কাজ করতে ডোমেইনটি Firebase Console-এর <strong>Authorized Domains</strong> তালিকায় অনুমোদিত হতে হয়। নিচে আপনার সুবিধা অনুযায়ী যেকোনো উপায়ে প্রবেশ করুন:
          </p>
        </div>

        {/* Action 1: Instant Super Admin Access Card */}
        <div className="p-4 bg-gradient-to-r from-emerald-950/70 via-slate-800/80 to-slate-800/80 border border-emerald-500/40 rounded-2xl space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-emerald-300">প্ল্যাটফর্ম ওনার ও সুপার অ্যাডমিন</span>
              </div>
              <p className="text-xs font-semibold text-white">Md. Ibrahim Hossain ({APP_INFO.poweredBy})</p>
              <p className="text-[11px] text-slate-400 font-mono">ibrahimshagor.official@gmail.com</p>
            </div>
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded-full border border-emerald-500/30">
              Verified Owner
            </span>
          </div>

          <button
            type="button"
            onClick={handleSuperAdminLogin}
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-900/30 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>সরাসরি সুপার অ্যাডমিন হিসেবে প্রবেশ করুন</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Action 2: Domain Authorization Quick Guide */}
        <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200">আপনার বর্তমান ডোমেইন:</span>
            <button
              type="button"
              onClick={handleCopy}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] flex items-center gap-1 font-semibold transition-colors cursor-pointer"
            >
              {copiedDomain ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedDomain ? 'কপি হয়েছে!' : 'ডোমেইন কপি করুন'}</span>
            </button>
          </div>

          <div className="font-mono text-xs text-emerald-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 select-all truncate">
            {currentHost}
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            <strong>Google Popup স্থায়ীভাবে চালু করতে:</strong> Firebase Console-এ গিয়ে <em>Authentication &gt; Settings &gt; Authorized domains</em>-এ &apos;Add domain&apos; ক্লিক করে ডোমেইনটি সেভ করুন। এরপর আর কোনো সমস্যা ছাড়াই যেকোনো ব্যবহারকারী Google পপআপ দিয়ে লগইন করতে পারবে।
          </p>

          <a
            href="https://console.firebase.google.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold hover:underline"
          >
            <span>Firebase Console লিঙ্ক খুলুন</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Action 3: Other Google Email Entry */}
        {activeMode === 'options' ? (
          <button
            type="button"
            onClick={() => setActiveMode('manual')}
            className="w-full py-2.5 px-4 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Mail className="w-4 h-4 text-slate-400" />
            <span>অন্য কোনো Google ইমেইল ঠিকানা দিয়ে প্রবেশ করুন</span>
          </button>
        ) : (
          <form onSubmit={handleConfirm} className="space-y-3 p-3.5 bg-slate-800/40 border border-slate-700/60 rounded-2xl">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-slate-200">Google ইমেইল ইনপুট:</span>
              <button
                type="button"
                onClick={() => setActiveMode('options')}
                className="text-[11px] text-slate-400 hover:text-white underline"
              >
                বাতিল
              </button>
            </div>

            <div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@gmail.com"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="আপনার পুরো নাম (ইংরেজিতে)"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !email.trim()}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              প্রবেশ সম্পন্ন করুন
            </button>
          </form>
        )}

      </div>
    </div>
  );
};

