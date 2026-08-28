import React, { useState } from 'react';
import { 
  Menu,
  Eye, 
  EyeOff, 
  Moon, 
  Sun, 
  Bell, 
  Sparkles, 
  Plus, 
  Wallet, 
  ShieldCheck, 
  CloudCheck, 
  CloudOff, 
  User as UserIcon, 
  LogOut, 
  Settings, 
  Info,
  Calculator as CalcIcon,
  Globe
} from 'lucide-react';
import { useFinance } from '../../context/FinancialContext';
import { useAuth } from '../../context/AuthContext';
import { APP_INFO, CURRENCIES } from '../../lib/constants';

interface HeaderProps {
  onToggleMenu?: () => void;
  activeTabTitle?: string;
  onOpenNewTransaction: () => void;
  onOpenAIAssistant: () => void;
  onOpenCalculator: () => void;
  onOpenSettings: () => void;
  onOpenAbout: () => void;
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMenu,
  activeTabTitle,
  onOpenNewTransaction,
  onOpenAIAssistant,
  onOpenCalculator,
  onOpenSettings,
  onOpenAbout,
  onOpenAuth,
}) => {
  const { 
    currency, 
    setCurrency, 
    language,
    setLanguage,
    privacyMode, 
    setPrivacyMode, 
    theme, 
    setTheme, 
    notifications, 
    markNotificationAsRead,
    clearAllNotifications,
    syncStatus 
  } = useFinance();
  const { user, isGuest, logout } = useAuth();
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <header className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors shadow-2xs">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left: Clean Hamburger Toggle & Active View Title */}
          <div className="flex items-center gap-2 sm:gap-3">
            {onToggleMenu && (
              <button
                id="header-hamburger-menu-btn"
                onClick={onToggleMenu}
                className="lg:hidden p-2.5 -ml-1 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all active:scale-95 focus:outline-none flex items-center justify-center"
                title={language === 'bn' ? 'মেনু খুলুন' : 'Open Menu'}
              >
                <Menu className="w-5 h-5 text-slate-800 dark:text-slate-100" />
              </button>
            )}

            {/* Brand Logo & Name */}
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-bold tracking-tight bg-gradient-to-r from-slate-900 via-emerald-800 to-teal-700 dark:from-white dark:via-emerald-300 dark:to-teal-300 bg-clip-text text-transparent">
                {APP_INFO.name}
              </span>
              {activeTabTitle && (
                <>
                  <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-md border border-emerald-200/50 dark:border-emerald-800/50 hidden sm:inline truncate max-w-[200px]">
                    {activeTabTitle}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Center / Right Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* Quick Add Transaction Button */}
            <button
              id="header-new-transaction-btn"
              onClick={onOpenNewTransaction}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs sm:text-sm font-semibold rounded-xl transition-all shadow-sm shadow-emerald-600/20"
              title={language === 'bn' ? 'নতুন লেনদেন যোগ করুন' : 'Add New Transaction'}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">{language === 'bn' ? 'নতুন লেনদেন' : 'New Transaction'}</span>
            </button>

            {/* Language Switcher (BN <-> EN) */}
            <button
              id="header-language-toggle-btn"
              onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors border border-slate-200 dark:border-slate-700"
              title={language === 'bn' ? 'Switch to English' : 'বাংলায় পরিবর্তন করুন'}
            >
              <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{language === 'bn' ? 'ENG' : 'বাংলা'}</span>
            </button>

            {/* AI Assistant Button */}
            <button
              id="header-ai-assistant-btn"
              onClick={onOpenAIAssistant}
              className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:hover:bg-purple-900/60 dark:text-purple-300 text-xs font-medium rounded-xl border border-purple-200/70 dark:border-purple-800/70 transition-colors"
              title="FINORA AI Financial Assistant"
            >
              <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400 animate-pulse" />
              <span className="hidden md:inline">AI Advisor</span>
            </button>

            {/* Calculator Button */}
            <button
              id="header-calculator-btn"
              onClick={onOpenCalculator}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              title={language === 'bn' ? 'ক্যালকুলেটর (Calculator)' : 'Calculator'}
            >
              <CalcIcon className="w-4 h-4" />
            </button>

            {/* Privacy Mode Toggle */}
            <button
              id="header-privacy-toggle-btn"
              onClick={() => setPrivacyMode(!privacyMode)}
              className={`p-2 rounded-xl transition-colors ${
                privacyMode 
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' 
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title={privacyMode ? (language === 'bn' ? 'প্রাইভেসি মোড চালু' : 'Privacy Mode Active') : (language === 'bn' ? 'প্রাইভেসি মোড বন্ধ' : 'Privacy Mode Off')}
            >
              {privacyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>

            {/* Currency Selector */}
            <div className="relative hidden lg:block">
              <select
                id="header-currency-select"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="appearance-none bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold py-1.5 pl-2.5 pr-6 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.symbol} {c.code}
                  </option>
                ))}
              </select>
            </div>

            {/* Dark / Light Theme Toggle */}
            <button
              id="header-theme-toggle-btn"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              title={theme === 'dark' ? (language === 'bn' ? 'লাইট থিমে পরিবর্তন করুন' : 'Switch to Light Theme') : (language === 'bn' ? 'ডার্ক থিমে পরিবর্তন করুন' : 'Switch to Dark Theme')}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                id="header-notifications-btn"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                title="বিজ্ঞপ্তি (Notifications)"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
                )}
              </button>

              {showNotifications && (
                <div 
                  id="header-notifications-menu"
                  className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100"
                >
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {language === 'bn' ? `বিজ্ঞপ্তি ও সতর্কতা (${notifications.length})` : `Notifications (${notifications.length})`}
                    </span>
                    {notifications.length > 0 && (
                      <button
                        onClick={clearAllNotifications}
                        className="text-[11px] text-slate-500 hover:text-rose-600 dark:hover:text-rose-400"
                      >
                        {language === 'bn' ? 'সব মুছুন' : 'Clear All'}
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">
                        {language === 'bn' ? 'কোনো নতুন নোটিফিকেশন নেই।' : 'No new notifications.'}
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => markNotificationAsRead(n.id)}
                          className={`p-3 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${
                            !n.isRead ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {n.title}
                            </span>
                            <span className="text-[10px] text-slate-400">{n.date}</span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                            {n.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile / Menu */}
            <div className="relative">
              <button
                id="header-user-menu-btn"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 font-semibold text-xs overflow-hidden">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-4 h-4" />
                  )}
                </div>
              </button>

              {showUserMenu && (
                <div 
                  id="header-user-dropdown"
                  className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50 p-2"
                >
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {user?.displayName || 'Md. Ibrahim Hossain'}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {user?.email || 'ibrahimshagor.official@gmail.com'}
                    </p>
                    <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                      <ShieldCheck className="w-3 h-3" />
                      <span>{isGuest ? (language === 'bn' ? 'গেস্ট ডেমো মোড' : 'Guest Demo Mode') : (language === 'bn' ? 'ক্লাউড সিঙ্ক চালু' : 'Cloud Synchronized')}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onOpenSettings();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span>{language === 'bn' ? 'সেটিংস ও ব্যাকআপ (Settings)' : 'Settings & Backup'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onOpenAbout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  >
                    <Info className="w-4 h-4 text-slate-400" />
                    <span>{language === 'bn' ? 'FINORA পরিচিতি ও ডেভেলপার' : 'About FINORA & Dev'}</span>
                  </button>

                  {user ? (
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors mt-1"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{language === 'bn' ? 'লগআউট (Logout)' : 'Logout'}</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenAuth();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-xl transition-colors mt-1"
                    >
                      <UserIcon className="w-4 h-4" />
                      <span>{language === 'bn' ? 'লগইন / সাইন আপ' : 'Sign In / Register'}</span>
                    </button>
                  )}
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};

