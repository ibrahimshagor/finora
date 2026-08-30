import React from 'react';
import { 
  LayoutDashboard, 
  Landmark, 
  ReceiptText, 
  Handshake, 
  CreditCard, 
  Target, 
  CalendarClock, 
  TrendingUp, 
  BarChart3, 
  Scale,
  Sparkles,
  Bot,
  Settings,
  Calculator as CalcIcon,
  Info,
  ChevronLeft,
  ChevronRight,
  X,
  Wallet,
  Menu,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { TabType } from './Navigation';
import { useFinance } from '../../context/FinancialContext';
import { APP_INFO } from '../../lib/constants';

interface SidebarNavigationProps {
  activeTab: TabType;
  isAiActive?: boolean;
  isSettingsActive?: boolean;
  onSelectTab: (tab: TabType) => void;
  onOpenAIAssistant: () => void;
  onOpenSettings: () => void;
  onOpenCalculator: () => void;
  onOpenAbout: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isCollapsedDesktop: boolean;
  onToggleCollapseDesktop: () => void;
}

export const SidebarNavigation: React.FC<SidebarNavigationProps> = ({
  activeTab,
  isAiActive = false,
  isSettingsActive = false,
  onSelectTab,
  onOpenAIAssistant,
  onOpenSettings,
  onOpenCalculator,
  onOpenAbout,
  isOpenMobile,
  onCloseMobile,
  isCollapsedDesktop,
  onToggleCollapseDesktop,
}) => {
  const { loans, bills, budgets, language } = useFinance();

  const activeLoansCount = loans.filter((l) => l.status === 'active').length;
  const pendingBillsCount = bills.filter((b) => b.status === 'pending' || b.status === 'overdue').length;

  const navSections = [
    {
      title: language === 'bn' ? 'প্রধান মেনু (Overview)' : 'Overview',
      items: [
        { id: 'dashboard', label: language === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard', labelEn: 'Dashboard', icon: LayoutDashboard },
        { id: 'accounts', label: language === 'bn' ? 'অ্যাকাউন্টস ও ওয়ালেট' : 'Accounts & Wallets', labelEn: 'Accounts', icon: Landmark },
        { id: 'transactions', label: language === 'bn' ? 'লেনদেনের লেজার' : 'Transactions Ledger', labelEn: 'Transactions', icon: ReceiptText },
      ],
    },
    {
      title: language === 'bn' ? 'দায় ও দেনা (Liabilities)' : 'Liabilities & Dues',
      items: [
        { 
          id: 'loans', 
          label: language === 'bn' ? 'ধার ও ঋণ' : 'Loans & Debts', 
          labelEn: 'Loans & Debts', 
          icon: Handshake, 
          badge: activeLoansCount > 0 ? activeLoansCount : undefined,
          badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
        },
        { id: 'credit_cards', label: language === 'bn' ? 'ক্রেডিট কার্ড' : 'Credit Cards', labelEn: 'Credit Cards', icon: CreditCard },
        { 
          id: 'bills', 
          label: language === 'bn' ? 'বিল ও সাবস্ক্রিপশন' : 'Bills & Subscriptions', 
          labelEn: 'Bills & Dues', 
          icon: CalendarClock, 
          badge: pendingBillsCount > 0 ? pendingBillsCount : undefined,
          badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
        },
      ],
    },
    {
      title: language === 'bn' ? 'পরিকল্পনা ও বিশ্লেষণ (Growth)' : 'Growth & Planning',
      items: [
        { id: 'budgets_goals', label: language === 'bn' ? 'বাজেট ও সঞ্চয় লক্ষ্য' : 'Budgets & Goals', labelEn: 'Budgets & Goals', icon: Target },
        { id: 'investments', label: language === 'bn' ? 'বিনিয়োগ পোর্টফোলিও' : 'Investments', labelEn: 'Investments', icon: TrendingUp },
        { id: 'reports', label: language === 'bn' ? 'রিপোর্ট ও বিবরণী' : 'Reports & Analytics', labelEn: 'Analytics & Reports', icon: BarChart3 },
        { id: 'reconciliation', label: language === 'bn' ? 'হিসাব সমন্বয় ও অডিট' : 'Reconciliation', labelEn: 'Reconciliation', icon: Scale },
      ],
    },
  ];

  const handleItemClick = (id: string) => {
    onSelectTab(id as TabType);
    onCloseMobile();
  };

  const handleAiClick = () => {
    onOpenAIAssistant();
    onCloseMobile();
  };

  const handleSettingsClick = () => {
    onOpenSettings();
    onCloseMobile();
  };

  const handleCalcClick = () => {
    onOpenCalculator();
    onCloseMobile();
  };

  const handleAboutClick = () => {
    onOpenAbout();
    onCloseMobile();
  };

  const renderNavContent = (isMobile: boolean = false) => {
    const showLabels = isMobile || !isCollapsedDesktop;

    return (
      <div className="flex flex-col h-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-800 select-none">
        
        {/* Sidebar Header: When Collapsed, shows only Hamburger Menu icon; When Expanded, shows Logo + Name + Collapse/Close button */}
        {!showLabels ? (
          <div className="flex items-center justify-center w-full h-16 border-b border-slate-200 dark:border-slate-800">
            <button
              id="sidebar-collapsed-hamburger-btn"
              onClick={onToggleCollapseDesktop}
              className="p-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-xl transition-all active:scale-95 flex items-center justify-center"
              title={language === 'bn' ? 'সাইড মেনু খুলুন (Expand Sidebar)' : 'Expand Sidebar'}
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center h-16 px-4 border-b border-slate-200 dark:border-slate-800 justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 flex-shrink-0">
                <Wallet className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-slate-900 via-emerald-800 to-teal-700 dark:from-white dark:via-emerald-300 dark:to-teal-300 bg-clip-text text-transparent truncate">
                    {APP_INFO.name}
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    v2.5
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">
                  {language === 'bn' ? APP_INFO.tagline : 'Personal Financial Management'}
                </p>
              </div>
            </div>

            {/* Close button on mobile, Collapse toggle on desktop */}
            {isMobile ? (
              <button
                onClick={onCloseMobile}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title={language === 'bn' ? 'বন্ধ করুন' : 'Close'}
              >
                <X className="w-5 h-5" />
              </button>
            ) : (
              <button
                id="sidebar-expanded-collapse-btn"
                onClick={onToggleCollapseDesktop}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title={language === 'bn' ? 'মেনু সংকুচিত করুন (Collapse)' : 'Collapse Sidebar'}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Scrollable Navigation List */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-6 scrollbar-thin">
          
          {/* Main Sections */}
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {showLabels && (
                <div className="px-3 pb-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {section.title}
                </div>
              )}
              
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = !isAiActive && !isSettingsActive && activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      id={`sidebar-nav-${item.id}`}
                      onClick={() => handleItemClick(item.id)}
                      title={`${item.label} (${item.labelEn})`}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all relative group ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/70'
                      } ${!showLabels ? 'justify-center px-2' : ''}`}
                    >
                      <Icon className={`w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110 ${
                        isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'
                      }`} />

                      {showLabels && (
                        <div className="flex items-center justify-between flex-1 min-w-0 text-left">
                          <span className="truncate">{item.label}</span>
                          {language === 'bn' && (
                            <span className={`text-[10px] opacity-70 font-normal truncate ml-1 ${isActive ? 'text-emerald-100' : 'text-slate-400'}`}>
                              {item.labelEn}
                            </span>
                          )}
                        </div>
                      )}

                      {item.badge && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          showLabels ? item.badgeColor : 'absolute top-1.5 right-1.5 w-2 h-2 p-0 rounded-full bg-rose-500'
                        }`}>
                          {showLabels ? item.badge : ''}
                        </span>
                      )}

                      {/* Floating tooltip on collapsed mode */}
                      {!showLabels && (
                        <div className="fixed left-20 bg-slate-900 dark:bg-slate-800 text-white text-xs px-2.5 py-1.5 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
                          {item.label}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Smart Tools Section */}
          <div className="space-y-1 pt-2 border-t border-slate-200 dark:border-slate-800">
            {showLabels && (
              <div className="px-3 pb-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {language === 'bn' ? 'স্মার্ট টুলস ও সেটিংস' : 'Smart Tools & Settings'}
              </div>
            )}

            {/* AI Assistant */}
            <button
              id="sidebar-nav-ai-assistant"
              onClick={handleAiClick}
              title="FINORA AI Assistant"
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all relative group ${
                isAiActive
                  ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/20'
                  : 'text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40'
              } ${!showLabels ? 'justify-center px-2' : ''}`}
            >
              <Bot className={`w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110 ${
                isAiActive ? 'text-white' : 'text-purple-600 dark:text-purple-400'
              }`} />
              {showLabels && (
                <div className="flex items-center justify-between flex-1 min-w-0 text-left">
                  <span className="truncate font-bold">{language === 'bn' ? 'FINORA AI অ্যাসিস্ট্যান্ট' : 'FINORA AI Assistant'}</span>
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200 ml-1">
                    Gemini
                  </span>
                </div>
              )}
            </button>

            {/* Calculator */}
            <button
              id="sidebar-nav-calculator"
              onClick={handleCalcClick}
              title="In-App Calculator"
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-all ${
                !showLabels ? 'justify-center px-2' : ''
              }`}
            >
              <CalcIcon className="w-4 h-4 flex-shrink-0" />
              {showLabels && <span>{language === 'bn' ? 'ক্যালকুলেটর (Calculator)' : 'Calculator'}</span>}
            </button>

            {/* Settings */}
            <button
              id="sidebar-nav-settings"
              onClick={handleSettingsClick}
              title="Settings & Backup"
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isSettingsActive
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/70'
              } ${!showLabels ? 'justify-center px-2' : ''}`}
            >
              <Settings className="w-4 h-4 flex-shrink-0" />
              {showLabels && <span>{language === 'bn' ? 'সেটিংস ও ব্যাকআপ (Settings)' : 'Settings & Backup'}</span>}
            </button>

            {/* About */}
            <button
              id="sidebar-nav-about"
              onClick={handleAboutClick}
              title="About FINORA"
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-all ${
                !showLabels ? 'justify-center px-2' : ''
              }`}
            >
              <Info className="w-4 h-4 flex-shrink-0" />
              {showLabels && <span>{language === 'bn' ? 'FINORA পরিচিতি (About)' : 'About FINORA'}</span>}
            </button>

          </div>

        </div>

      </div>
    );
  };

  return (
    <>
      {/* Desktop Persistent / Collapsible Sidebar - Fixed on Left */}
      <aside 
        className={`hidden lg:block fixed top-0 bottom-0 left-0 h-screen z-30 transition-all duration-300 ease-in-out flex-shrink-0 shadow-sm ${
          isCollapsedDesktop ? 'w-20' : 'w-64 xl:w-72'
        }`}
      >
        {renderNavContent(false)}
      </aside>

      {/* Mobile / Tablet Slide-over Drawer */}
      {isOpenMobile && (
        <div 
          className="fixed inset-0 z-50 lg:hidden flex"
          aria-modal="true"
        >
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={onCloseMobile}
          />

          {/* Drawer Content */}
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {renderNavContent(true)}
          </div>
        </div>
      )}
    </>
  );
};
