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
  Scale 
} from 'lucide-react';

export type TabType = 
  | 'dashboard'
  | 'accounts'
  | 'transactions'
  | 'loans'
  | 'credit_cards'
  | 'budgets_goals'
  | 'bills'
  | 'investments'
  | 'reports'
  | 'reconciliation';

interface NavigationProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onSelectTab }) => {
  const navItems = [
    { id: 'dashboard', label: 'ড্যাশবোর্ড', labelEn: 'Dashboard', icon: LayoutDashboard },
    { id: 'accounts', label: 'অ্যাকাউন্টস', labelEn: 'Accounts', icon: Landmark },
    { id: 'transactions', label: 'লেনদেন', labelEn: 'Transactions', icon: ReceiptText },
    { id: 'loans', label: 'ঋণ ও পাওনা', labelEn: 'Loans', icon: Handshake },
    { id: 'credit_cards', label: 'ক্রেডিট কার্ড', labelEn: 'Credit Cards', icon: CreditCard },
    { id: 'budgets_goals', label: 'বাজেট ও লক্ষ্য', labelEn: 'Budgets & Goals', icon: Target },
    { id: 'bills', label: 'বিল ও কিস্তি', labelEn: 'Bills', icon: CalendarClock },
    { id: 'investments', label: 'বিনিয়োগ', labelEn: 'Investments', icon: TrendingUp },
    { id: 'reports', label: 'রিপোর্ট ও বিবরণী', labelEn: 'Reports', icon: BarChart3 },
    { id: 'reconciliation', label: 'রিকনসিলিয়েশন', labelEn: 'Reconcile', icon: Scale },
  ];

  return (
    <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors sticky top-16 z-20 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-1 overflow-x-auto scrollbar-none py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => onSelectTab(item.id as TabType)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                <span>{item.label}</span>
                <span className={`text-[10px] hidden xl:inline opacity-70 font-normal`}>
                  ({item.labelEn})
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
