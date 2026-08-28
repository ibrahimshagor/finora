import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  User as UserIcon, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  Cloud, 
  RefreshCw, 
  FileSpreadsheet, 
  PieChart, 
  AlertCircle,
  HelpCircle,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { APP_INFO } from '../../lib/constants';

export const AuthView: React.FC = () => {
  const { 
    loginWithGoogle, 
    loginWithEmail, 
    registerWithEmail, 
    loginAsGuest, 
    resetPassword, 
    error: authError,
    clearError
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Forgot password modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    clearError();

    if (!loginEmail || !loginPassword) {
      setErrorMessage('অনুগ্রহ করে ইমেইল এবং পাসওয়ার্ড প্রদান করুন।');
      return;
    }

    setIsSubmitting(true);
    try {
      await loginWithEmail(loginEmail.trim(), loginPassword);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setErrorMessage('ভুল ইমেইল বা পাসওয়ার্ড প্রদান করা হয়েছে। আবার চেষ্টা করুন।');
      } else if (err.code === 'auth/too-many-requests') {
        setErrorMessage('অতিরিক্ত ভুল চেষ্টার কারণে অ্যাকাউন্ট সাময়িক লক হয়েছে। কিছুক্ষণ পর চেষ্টা করুন।');
      } else {
        setErrorMessage(err.message || 'লগইন ব্যর্থ হয়েছে। অনুগ্রহ করে তথ্য যাচাই করুন।');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    clearError();

    if (!regName.trim()) {
      setErrorMessage('অনুগ্রহ করে আপনার পুরো নাম প্রদান করুন।');
      return;
    }
    if (!regEmail.trim()) {
      setErrorMessage('অনুগ্রহ করে একটি সঠিক ইমেইল ঠিকানা দিন।');
      return;
    }
    if (regPassword.length < 6) {
      setErrorMessage('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMessage('উভয় পাসওয়ার্ডের মিল পাওয়া যায়নি।');
      return;
    }

    setIsSubmitting(true);
    try {
      await registerWithEmail(regEmail.trim(), regPassword, regName.trim());
      setSuccessMessage('অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে! আপনাকে ড্যাশবোর্ডে নিয়ে যাওয়া হচ্ছে...');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setErrorMessage('এই ইমেইলটি দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট রয়েছে। লগইন করার চেষ্টা করুন।');
      } else if (err.code === 'auth/weak-password') {
        setErrorMessage('পাসওয়ার্ডটি খুব সহজ। একটু জটিল পাসওয়ার্ড নির্বাচন করুন।');
      } else {
        setErrorMessage(err.message || 'নিবন্ধন প্রক্রিয়া সম্পন্ন করা যায়নি।');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    clearError();
    setIsSubmitting(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Google সাইন ইন ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;
    setIsSubmitting(true);
    try {
      await resetPassword(resetEmail.trim());
      setResetSent(true);
    } catch (err: any) {
      setErrorMessage('পাসওয়ার্ড রিসেট লিংক পাঠাতে সমস্যা হয়েছে। ইমেইল ঠিকানা যাচাই করুন।');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-white relative overflow-hidden">
      
      {/* Subtle Background Glow Orbs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-40 w-96 h-96 bg-teal-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Simple Brand Nav */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-black flex items-center justify-center text-xl shadow-lg shadow-emerald-500/20">
            F
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
              FINORA <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-md">Pro</span>
            </span>
            <p className="text-[11px] text-slate-400 font-medium">ব্যক্তিগত ও বাণিজ্যিক আর্থিক ব্যবস্থাপনা স্যুট</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>256-bit ক্লাউড এনক্রিপশন</span>
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
            <RefreshCw className="w-3.5 h-3.5 text-teal-400" />
            <span>দৈনিক অটো ব্যাকআপ সক্রিয়</span>
          </span>
        </div>
      </header>

      {/* Main Authentication Container */}
      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 z-10 flex-1 flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center w-full">
          
          {/* Left Column: Value Proposition & Feature Highlights */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs font-semibold text-emerald-300">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>নিরাপদ ক্লাউড সিঙ্ক ও স্বয়ংক্রিয় ব্যাকআপ সিস্টেম</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              আপনার সমস্ত হিসাব ও ক্যাশফ্লো এক জায়গায় <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">সুরক্ষিত রাখুন।</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 font-normal leading-relaxed max-w-xl">
              ব্যাংক, বিকাশ, নগদ, ক্যাশ ওয়ালেট, ক্রেডিট কার্ড, ধার-দেনা, ইউটিলিটি বিল এবং বিনিয়োগের নির্ভুল হিসাব সংরক্ষণ করুন। প্রতিদিনের স্বয়ংক্রিয় ক্লাউড ব্যাকআপে তথ্য হারানোর কোনো ভয় নেই।
            </p>

            {/* Feature Pills Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              <div className="p-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl backdrop-blur-xs transition-colors">
                <div className="flex items-center gap-2.5 text-emerald-400 font-semibold text-xs mb-1">
                  <Cloud className="w-4 h-4" />
                  <span>দৈনিক অটো ব্যাকআপ ও ক্লাউড সিঙ্ক</span>
                </div>
                <p className="text-[12px] text-slate-400">
                  প্রতিদিন স্বয়ংক্রিয়ভাবে সম্পূর্ণ হিসাবের ব্যাকআপ স্ন্যাপশট সংরক্ষিত হয়।
                </p>
              </div>

              <div className="p-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl backdrop-blur-xs transition-colors">
                <div className="flex items-center gap-2.5 text-teal-400 font-semibold text-xs mb-1">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>রিপোর্ট প্রিন্ট ও CSV ডাউনলোড</span>
                </div>
                <p className="text-[12px] text-slate-400">
                  যেকোনো অ্যাকাউন্ট, ঋণ বা সামগ্রিক লেজার এক ক্লিকে প্রিন্ট বা এক্সপোর্ট করুন।
                </p>
              </div>

              <div className="p-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl backdrop-blur-xs transition-colors">
                <div className="flex items-center gap-2.5 text-cyan-400 font-semibold text-xs mb-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span>ঋণ ও দেনা-পাওনা ট্র্যাকার</span>
                </div>
                <p className="text-[12px] text-slate-400">
                  কার কাছে কত দেনা বা পাওনা আছে এবং কিস্তির সঠিক ট্র্যাক রাখুন।
                </p>
              </div>

              <div className="p-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl backdrop-blur-xs transition-colors">
                <div className="flex items-center gap-2.5 text-amber-400 font-semibold text-xs mb-1">
                  <PieChart className="w-4 h-4" />
                  <span>বাজেট ও খরচ সতর্কতা</span>
                </div>
                <p className="text-[12px] text-slate-400">
                  মাসিক বাজেট সীমার অতিরিক্ত খরচ রোধে তাৎক্ষণিক অ্যালার্ট প্রদান।
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Login / Register Card */}
          <div className="lg:col-span-5 w-full">
            <div className="bg-slate-900/90 backdrop-blur-md rounded-3xl border border-slate-700/80 shadow-2xl overflow-hidden p-6 sm:p-8">
              
              {/* Tab Switcher */}
              <div className="flex items-center p-1 bg-slate-800/80 rounded-2xl mb-6 border border-slate-700/60">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                    clearError();
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                    activeTab === 'login'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  লগইন করুন (Sign In)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('register');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                    clearError();
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                    activeTab === 'register'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  নতুন অ্যাকাউন্ট (Sign Up)
                </button>
              </div>

              {/* Error or Success Notification */}
              {(errorMessage || authError) && (
                <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <span>{errorMessage || authError}</span>
                </div>
              )}

              {successMessage && (
                <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-start gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Login Form */}
              {activeTab === 'login' && (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      ইমেইল ঠিকানা (Email)
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="yourname@gmail.com"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700 focus:border-emerald-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-300">
                        পাসওয়ার্ড (Password)
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setResetEmail(loginEmail);
                          setResetSent(false);
                          setShowForgotModal(true);
                        }}
                        className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium hover:underline"
                      >
                        পাসওয়ার্ড ভুলে গেছেন?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-800/60 border border-slate-700 focus:border-emerald-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                      >
                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 mt-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>যাচাই করা হচ্ছে...</span>
                      </>
                    ) : (
                      <>
                        <span>লগইন করুন (Enter App)</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Register Form */}
              {activeTab === 'register' && (
                <form onSubmit={handleRegister} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      আপনার পুরো নাম (Full Name)
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="যেমন: মোঃ ইব্রাহীম সাগর"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700 focus:border-emerald-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      ইমেইল ঠিকানা (Email)
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="yourname@gmail.com"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700 focus:border-emerald-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-800/60 border border-slate-700 focus:border-emerald-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                      >
                        {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      পাসওয়ার্ড নিশ্চিত করুন
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700 focus:border-emerald-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 mt-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>অ্যাকাউন্ট তৈরি হচ্ছে...</span>
                      </>
                    ) : (
                      <>
                        <span>অ্যাকাউন্ট নিবন্ধন সম্পন্ন করুন</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Divider */}
              <div className="relative flex items-center justify-center my-5">
                <div className="border-t border-slate-800 w-full" />
                <span className="bg-slate-900 px-3 text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                  অথবা এক ক্লিকে
                </span>
              </div>

              {/* Google Sign-in & Guest Options */}
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-600 rounded-xl text-xs font-bold text-slate-100 transition-colors shadow-xs"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
                  <span>Google দিয়ে চালিয়ে যান</span>
                </button>

                <button
                  type="button"
                  onClick={loginAsGuest}
                  className="w-full py-2 px-4 bg-transparent hover:bg-slate-800/60 text-slate-400 hover:text-slate-200 rounded-xl text-xs font-semibold transition-colors border border-dashed border-slate-700"
                >
                  ডেমো / গেস্ট মোডে সরাসরি ড্যাশবোর্ড দেখুন
                </button>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">পাসওয়ার্ড পুনরুদ্ধার</h3>
              <button
                onClick={() => setShowForgotModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {resetSent ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="text-xs font-semibold text-white">পাসওয়ার্ড রিসেট ইমেইল পাঠানো হয়েছে!</p>
                <p className="text-[11px] text-slate-400">
                  আপনার ইনবক্স চেক করে প্রদত্ত লিংকে ক্লিক করে নতুন পাসওয়ার্ড সেট করুন।
                </p>
                <button
                  onClick={() => setShowForgotModal(false)}
                  className="mt-2 w-full py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold"
                >
                  ঠিক আছে
                </button>
              </div>
            ) : (
              <form onSubmit={handlePasswordReset} className="space-y-3">
                <p className="text-xs text-slate-300">
                  আপনার নিবন্ধিত ইমেইল ঠিকানা প্রদান করুন। আমরা একটি পাসওয়ার্ড রিসেট লিংক পাঠিয়ে দিব।
                </p>
                <input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="yourname@gmail.com"
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  {isSubmitting ? 'পাঠানো হচ্ছে...' : 'রিসেট লিংক পাঠান'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Footer Branding */}
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center text-xs text-slate-400 z-10">
        <p>
          Developed by: <strong className="text-slate-200">{APP_INFO.developedBy}</strong> • Powered by: <strong className="text-emerald-400">{APP_INFO.poweredBy}</strong> • All rights reserved.
        </p>
      </footer>

    </div>
  );
};
