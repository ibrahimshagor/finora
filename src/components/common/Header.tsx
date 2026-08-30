import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu,
  Eye, 
  EyeOff, 
  Moon, 
  Sun, 
  Bell, 
  Sparkles, 
  Plus, 
  ShieldCheck, 
  User as UserIcon, 
  LogOut, 
  Settings, 
  Info,
  Calculator as CalcIcon,
  Globe,
  Coins,
  ChevronRight,
  ChevronDown,
  X,
  Cloud,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useFinance } from '../../context/FinancialContext';
import { useAuth } from '../../context/AuthContext';
import { APP_INFO, CURRENCIES } from '../../lib/constants';

interface HeaderProps {
  onToggleMenu?: () => void;
  activeTabTitle?: string;
  isCollapsedDesktop?: boolean;
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
  isCollapsedDesktop = false,
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
    syncStatus,
    syncAllDataToFirestore,
  } = useFinance();
  const { user, isGuest, logout } = useAuth();
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleManualSync = async () => {
    if (isGuest || !user) return;
    setIsManualSyncing(true);
    try {
      await syncAllDataToFirestore();
    } finally {
      setTimeout(() => setIsManualSyncing(false), 600);
    }
  };

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header 
      id="app-top-fixed-header"
      className={`fixed top-0 right-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800/90 transition-all duration-300 ease-in-out shadow-xs ${
        isCollapsedDesktop ? 'left-0 lg:left-20' : 'left-0 lg:left-64 xl:left-72'
      }`}
    >
      <div className="w-full px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          
          {/* Left: Mobile Hamburger Toggle + Brand Logo (Mobile) / Active Tab Breadcrumb (Desktop) */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {onToggleMenu && (
              <button
                id="header-hamburger-menu-btn"
                onClick={onToggleMenu}
                className="lg:hidden p-2 -ml-1 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all active:scale-95 flex items-center justify-center cursor-pointer"
                title={language === 'bn' ? 'মেনু খুলুন' : 'Open Menu'}
                aria-label="Open Menu"
              >
                <Menu className="w-5 h-5 text-slate-800 dark:text-slate-100" />
              </button>
            )}

            {/* Brand Logo & Name (Visible on both Mobile & Desktop) */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-black text-sm shadow-sm shadow-emerald-600/30 shrink-0">
                F
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm sm:text-base font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-emerald-800 to-teal-700 dark:from-white dark:via-emerald-300 dark:to-teal-300 bg-clip-text text-transparent truncate">
                    {APP_INFO.name}
                  </span>
                  <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50">
                    v2.5
                  </span>
                </div>
              </div>
            </div>

            {/* Desktop Active Tab Title & Breadcrumb */}
            <div className="hidden lg:flex items-center gap-2 min-w-0 pl-1 border-l border-slate-200 dark:border-slate-800">
              {activeTabTitle ? (
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-200/50 dark:border-emerald-800/50 truncate max-w-[200px] xl:max-w-[280px]">
                  {activeTabTitle}
                </span>
              ) : (
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  {language === 'bn' ? 'ড্যাশবোর্ড ওভারভিউ' : 'Dashboard Overview'}
                </span>
              )}
            </div>
          </div>

          {/* Right: Quick Action Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* Realtime Cloud Sync Status Indicator */}
            {!isGuest && user && (
              <button
                id="header-cloud-sync-btn"
                onClick={handleManualSync}
                disabled={isManualSyncing}
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-slate-100/80 hover:bg-slate-200/80 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 transition-colors cursor-pointer"
                title={language === 'bn' ? 'ক্লাউড সিঙ্ক স্ট্যাটাস (ক্লিক করে রিফ্রেশ করুন)' : 'Cloud Sync Status (Click to refresh)'}
              >
                {syncStatus === 'syncing' || isManualSyncing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 text-emerald-500 animate-spin" />
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">{language === 'bn' ? 'সিঙ্ক হচ্ছে...' : 'Syncing...'}</span>
                  </>
                ) : syncStatus === 'error' ? (
                  <>
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                    <span className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold">{language === 'bn' ? 'সিঙ্ক ত্রুটি' : 'Sync Error'}</span>
                  </>
                ) : (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold">{language === 'bn' ? 'ক্লাউড সিঙ্ক' : 'Cloud Synced'}</span>
                  </>
                )}
              </button>
            )}

            {/* Quick Add Transaction Button (Desktop & Compact on Mobile) */}
            <button
              id="header-new-transaction-btn"
              onClick={onOpenNewTransaction}
              className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs sm:text-sm font-semibold rounded-xl transition-all shadow-sm shadow-emerald-600/20 cursor-pointer"
              title={language === 'bn' ? 'নতুন লেনদেন যোগ করুন' : 'Add New Transaction'}
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden md:inline">{language === 'bn' ? 'নতুন লেনদেন' : 'New Transaction'}</span>
            </button>

            {/* Desktop Only: Language Switcher */}
            <button
              id="header-desktop-language-toggle-btn"
              onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')}
              className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
              title={language === 'bn' ? 'Switch to English' : 'বাংলায় পরিবর্তন করুন'}
            >
              <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{language === 'bn' ? 'ENG' : 'বাংলা'}</span>
            </button>

            {/* Desktop Only: AI Assistant Button */}
            <button
              id="header-desktop-ai-assistant-btn"
              onClick={onOpenAIAssistant}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:hover:bg-purple-900/60 dark:text-purple-300 text-xs font-medium rounded-xl border border-purple-200/70 dark:border-purple-800/70 transition-colors cursor-pointer"
              title="FINORA AI Financial Assistant"
            >
              <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400 animate-pulse" />
              <span>AI Advisor</span>
            </button>

            {/* Desktop Only: Calculator Button */}
            <button
              id="header-desktop-calculator-btn"
              onClick={onOpenCalculator}
              className="hidden lg:flex p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title={language === 'bn' ? 'ক্যালকুলেটর' : 'Calculator'}
            >
              <CalcIcon className="w-4 h-4" />
            </button>

            {/* Desktop Only: Privacy Mode Toggle */}
            <button
              id="header-desktop-privacy-toggle-btn"
              onClick={() => setPrivacyMode(!privacyMode)}
              className={`hidden lg:flex p-2 rounded-xl transition-colors cursor-pointer ${
                privacyMode 
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' 
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title={privacyMode ? (language === 'bn' ? 'প্রাইভেসি মোড চালু (ব্যালেন্স গোপন)' : 'Privacy Mode Active') : (language === 'bn' ? 'প্রাইভেসি মোড বন্ধ' : 'Privacy Mode Off')}
            >
              {privacyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>

            {/* Desktop Only: Currency Selector */}
            <div className="relative hidden xl:block">
              <select
                id="header-desktop-currency-select"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="appearance-none bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold py-1.5 pl-2.5 pr-7 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer transition-colors"
                title={language === 'bn' ? 'মুদ্রা পরিবর্তন' : 'Change Currency'}
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.symbol} {c.code}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Desktop Only: Dark / Light Theme Toggle */}
            <button
              id="header-desktop-theme-toggle-btn"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="hidden lg:flex p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title={theme === 'dark' ? (language === 'bn' ? 'লাইট থিমে পরিবর্তন করুন' : 'Switch to Light Theme') : (language === 'bn' ? 'ডার্ক থিমে পরিবর্তন করুন' : 'Switch to Dark Theme')}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {/* Notifications Dropdown (Desktop & Mobile) */}
            <div className="relative" ref={notifRef}>
              <button
                id="header-notifications-btn"
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowUserMenu(false);
                }}
                className="relative p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                title={language === 'bn' ? 'বিজ্ঞপ্তি' : 'Notifications'}
              >
                <Bell className="w-4.5 h-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse" />
                )}
              </button>

              {showNotifications && (
                <div 
                  id="header-notifications-menu"
                  className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100"
                >
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {language === 'bn' ? `বিজ্ঞপ্তি ও সতর্কতা (${notifications.length})` : `Notifications (${notifications.length})`}
                    </span>
                    {notifications.length > 0 && (
                      <button
                        onClick={clearAllNotifications}
                        className="text-[11px] text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 font-medium"
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

            {/* User Profile Avatar / Comprehensive Quick Submenu (Mobile & Desktop) */}
            <div className="relative" ref={userMenuRef}>
              <button
                id="header-user-menu-btn"
                onClick={() => {
                  setShowUserMenu(!showUserMenu);
                  setShowNotifications(false);
                }}
                className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title={user?.displayName || 'User Profile'}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center font-bold text-xs ring-2 ring-emerald-500/30 overflow-hidden shadow-xs">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span>{user?.displayName ? user.displayName.charAt(0).toUpperCase() : (isGuest ? 'G' : 'U')}</span>
                  )}
                </div>
              </button>

              {/* Enhanced User Dropdown / Submenu containing all tools for mobile & quick desktop access */}
              {showUserMenu && (
                <div 
                  id="header-user-dropdown"
                  className="absolute right-0 mt-2 w-72 sm:w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50 p-2.5 animate-in fade-in zoom-in-95 duration-100"
                >
                  {/* User Profile Header */}
                  <div className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl mb-2 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {user?.displayName || (isGuest ? 'Guest User' : 'FINORA User')}
                      </p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold">
                        {isGuest ? (language === 'bn' ? 'গেস্ট মোড' : 'Guest') : (language === 'bn' ? 'ক্লাউড সিঙ্ক' : 'Sync On')}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {user?.email || (isGuest ? 'guest@finora.app' : '')}
                    </p>
                  </div>

                  {/* Mobile Quick Tools Grid (Language, AI, Calc, Privacy, Theme, Currency) */}
                  <div className="mb-2 p-2 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl space-y-2 border border-slate-100 dark:border-slate-800/60">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                      {language === 'bn' ? 'কুইক টুলস ও সেটিংস' : 'Quick Tools'}
                    </div>

                    {/* Language Switcher Button */}
                    <div className="flex items-center justify-between px-2 py-1.5 bg-white dark:bg-slate-800/80 rounded-lg text-xs">
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                        <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>{language === 'bn' ? 'ভাষা (Language)' : 'Language'}</span>
                      </div>
                      <button
                        id="user-menu-language-toggle-btn"
                        onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')}
                        className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 rounded-md font-bold text-xs border border-emerald-200/60 dark:border-emerald-800/60 transition-colors"
                      >
                        {language === 'bn' ? 'English (ENG)' : 'বাংলা (BN)'}
                      </button>
                    </div>

                    {/* AI Advisor Launcher */}
                    <button
                      id="user-menu-ai-assistant-btn"
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenAIAssistant();
                      }}
                      className="w-full flex items-center justify-between px-2 py-1.5 bg-white dark:bg-slate-800/80 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-lg text-xs transition-colors"
                    >
                      <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-medium">
                        <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        <span>{language === 'bn' ? 'FINORA AI অ্যাসিস্ট্যান্ট' : 'FINORA AI Advisor'}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-purple-400" />
                    </button>

                    {/* In-App Calculator Launcher */}
                    <button
                      id="user-menu-calculator-btn"
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenCalculator();
                      }}
                      className="w-full flex items-center justify-between px-2 py-1.5 bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/60 rounded-lg text-xs transition-colors"
                    >
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                        <CalcIcon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                        <span>{language === 'bn' ? 'ক্যালকুলেটর (Calculator)' : 'In-App Calculator'}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>

                    {/* Privacy Mode (Hide Balances) Toggle */}
                    <div className="flex items-center justify-between px-2 py-1.5 bg-white dark:bg-slate-800/80 rounded-lg text-xs">
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                        {privacyMode ? <EyeOff className="w-3.5 h-3.5 text-amber-500" /> : <Eye className="w-3.5 h-3.5 text-slate-500" />}
                        <span>{language === 'bn' ? 'টাকার পরিমাণ গোপন' : 'Privacy Mode'}</span>
                      </div>
                      <button
                        id="user-menu-privacy-toggle-btn"
                        onClick={() => setPrivacyMode(!privacyMode)}
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                          privacyMode 
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300' 
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {privacyMode ? (language === 'bn' ? 'অন' : 'ON') : (language === 'bn' ? 'অফ' : 'OFF')}
                      </button>
                    </div>

                    {/* Dark/Light Theme Switcher */}
                    <div className="flex items-center justify-between px-2 py-1.5 bg-white dark:bg-slate-800/80 rounded-lg text-xs">
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                        {theme === 'dark' ? <Moon className="w-3.5 h-3.5 text-amber-400" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
                        <span>{language === 'bn' ? 'থিম মোড' : 'Theme Mode'}</span>
                      </div>
                      <button
                        id="user-menu-theme-toggle-btn"
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                      >
                        {theme === 'dark' ? (language === 'bn' ? 'ডার্ক' : 'Dark') : (language === 'bn' ? 'লাইট' : 'Light')}
                      </button>
                    </div>

                    {/* Currency Selector on Mobile */}
                    <div className="flex items-center justify-between px-2 py-1.5 bg-white dark:bg-slate-800/80 rounded-lg text-xs">
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                        <Coins className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>{language === 'bn' ? 'মুদ্রা (Currency)' : 'Currency'}</span>
                      </div>
                      <select
                        id="user-menu-currency-select"
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold px-2 py-0.5 rounded border-0 cursor-pointer"
                      >
                        {CURRENCIES.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.symbol} {c.code}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* System & Data Management Links */}
                  <div className="space-y-0.5">
                    <button
                      id="user-menu-settings-btn"
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenSettings();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    >
                      <Settings className="w-4 h-4 text-slate-400" />
                      <span>{language === 'bn' ? 'সেটিংস ও ক্লাউড ব্যাকআপ' : 'Settings & Cloud Backup'}</span>
                    </button>

                    <button
                      id="user-menu-about-btn"
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
                        id="user-menu-logout-btn"
                        onClick={() => {
                          setShowUserMenu(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors mt-1 font-medium"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>{language === 'bn' ? 'লগআউট (Logout)' : 'Logout'}</span>
                      </button>
                    ) : (
                      <button
                        id="user-menu-signin-btn"
                        onClick={() => {
                          setShowUserMenu(false);
                          onOpenAuth();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-xl transition-colors mt-1 font-medium"
                      >
                        <UserIcon className="w-4 h-4" />
                        <span>{language === 'bn' ? 'লগইন / অ্যাকাউন্ট খুলুন' : 'Sign In / Register'}</span>
                      </button>
                    )}
                  </div>

                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
