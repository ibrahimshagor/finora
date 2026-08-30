import React from 'react';
import { 
  LayoutDashboard, 
  Landmark, 
  ReceiptText, 
  Plus, 
  Menu
} from 'lucide-react';
import { TabType } from './Navigation';
import { useFinance } from '../../context/FinancialContext';

interface MobileBottomNavProps {
  activeTab: TabType;
  isAiActive?: boolean;
  isSettingsActive?: boolean;
  onSelectTab: (tab: TabType) => void;
  onOpenNewTransaction: () => void;
  onOpenMenu: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  isAiActive = false,
  isSettingsActive = false,
  onSelectTab,
  onOpenNewTransaction,
  onOpenMenu,
}) => {
  const { language } = useFinance();

  const isHomeActive = activeTab === 'dashboard' && !isAiActive && !isSettingsActive;
  const isAccountsActive = activeTab === 'accounts' && !isAiActive && !isSettingsActive;
  const isTxActive = activeTab === 'transactions' && !isAiActive && !isSettingsActive;
  const isMoreActive = (
    !['dashboard', 'accounts', 'transactions'].includes(activeTab) || 
    isAiActive || 
    isSettingsActive
  );

  return (
    <div 
      id="mobile-bottom-navigation-bar"
      className="fixed bottom-0 left-0 right-0 z-30 lg:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800/80 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)] transition-colors pb-safe"
    >
      <div className="max-w-md mx-auto px-3 py-1.5 flex items-center justify-between relative">
        
        {/* Tab 1: Dashboard / Home */}
        <button
          id="mobile-nav-dashboard-btn"
          onClick={() => onSelectTab('dashboard')}
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all active:scale-95 ${
            isHomeActive 
              ? 'text-emerald-600 dark:text-emerald-400 font-bold' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <div className={`p-1 rounded-full transition-all ${isHomeActive ? 'bg-emerald-50 dark:bg-emerald-950/60' : ''}`}>
            <LayoutDashboard className={`w-5 h-5 ${isHomeActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">
            {language === 'bn' ? 'হোম' : 'Home'}
          </span>
        </button>

        {/* Tab 2: Accounts */}
        <button
          id="mobile-nav-accounts-btn"
          onClick={() => onSelectTab('accounts')}
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all active:scale-95 ${
            isAccountsActive 
              ? 'text-emerald-600 dark:text-emerald-400 font-bold' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <div className={`p-1 rounded-full transition-all ${isAccountsActive ? 'bg-emerald-50 dark:bg-emerald-950/60' : ''}`}>
            <Landmark className={`w-5 h-5 ${isAccountsActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">
            {language === 'bn' ? 'অ্যাকাউন্ট' : 'Accounts'}
          </span>
        </button>

        {/* Center Elevated Floating Action Button (FAB) */}
        <div className="flex-1 flex items-center justify-center -mt-5">
          <button
            id="mobile-nav-add-transaction-fab"
            onClick={onOpenNewTransaction}
            className="w-13 h-13 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 active:scale-90 text-white flex items-center justify-center shadow-lg shadow-emerald-600/40 border-3 border-white dark:border-slate-900 transition-all cursor-pointer group"
            title={language === 'bn' ? 'নতুন লেনদেন যোগ করুন' : 'Add New Transaction'}
          >
            <Plus className="w-6 h-6 stroke-[3] group-hover:rotate-90 transition-transform duration-200" />
          </button>
        </div>

        {/* Tab 3: Transactions */}
        <button
          id="mobile-nav-transactions-btn"
          onClick={() => onSelectTab('transactions')}
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all active:scale-95 ${
            isTxActive 
              ? 'text-emerald-600 dark:text-emerald-400 font-bold' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <div className={`p-1 rounded-full transition-all ${isTxActive ? 'bg-emerald-50 dark:bg-emerald-950/60' : ''}`}>
            <ReceiptText className={`w-5 h-5 ${isTxActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">
            {language === 'bn' ? 'লেনদেন' : 'Ledger'}
          </span>
        </button>

        {/* Tab 4: More / Full Menu */}
        <button
          id="mobile-nav-more-menu-btn"
          onClick={onOpenMenu}
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all active:scale-95 ${
            isMoreActive 
              ? 'text-emerald-600 dark:text-emerald-400 font-bold' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <div className={`p-1 rounded-full transition-all ${isMoreActive ? 'bg-emerald-50 dark:bg-emerald-950/60' : ''}`}>
            <Menu className={`w-5 h-5 ${isMoreActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">
            {language === 'bn' ? 'মেনু' : 'Menu'}
          </span>
        </button>

      </div>
    </div>
  );
};
