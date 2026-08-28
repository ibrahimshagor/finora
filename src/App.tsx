import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { FinancialProvider, useFinance } from './context/FinancialContext';
import { Header } from './components/common/Header';
import { SidebarNavigation } from './components/common/SidebarNavigation';
import { TabType } from './components/common/Navigation';
import { Footer } from './components/common/Footer';
import { DashboardView } from './components/dashboard/DashboardView';
import { AccountsView } from './components/accounts/AccountsView';
import { TransactionsView } from './components/transactions/TransactionsView';
import { LoansView } from './components/loans/LoansView';
import { CreditCardsView } from './components/creditCards/CreditCardsView';
import { BudgetsGoalsView } from './components/budgets/BudgetsGoalsView';
import { BillsView } from './components/bills/BillsView';
import { InvestmentsView } from './components/investments/InvestmentsView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { AIAssistantView } from './components/ai/AIAssistantView';
import { ReconciliationView } from './components/reconciliation/ReconciliationView';
import { SettingsView } from './components/settings/SettingsView';
import { TransactionModal } from './components/transactions/TransactionModal';
import { AccountDetailModal } from './components/accounts/AccountDetailModal';
import { InAppCalculator } from './components/common/InAppCalculator';
import { AboutModal } from './components/common/AboutModal';
import { AuthModal } from './components/auth/AuthModal';
import { Account, Transaction } from './types';

const MainAppContent: React.FC = () => {
  const { language } = useFinance();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsedDesktop, setIsCollapsedDesktop] = useState<boolean>(() => {
    return localStorage.getItem('finora_sidebar_collapsed') === 'true';
  });

  // Modals state
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionModalInitialType, setTransactionModalInitialType] = useState<'income' | 'expense' | 'transfer'>('expense');
  const [transactionModalInitialAccountId, setTransactionModalInitialAccountId] = useState<string | undefined>(undefined);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>(undefined);

  const [selectedDetailAccount, setSelectedDetailAccount] = useState<Account | null>(null);
  const [isAccountDetailOpen, setIsAccountDetailOpen] = useState(false);

  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAiViewOpen, setIsAiViewOpen] = useState(false);
  const [isSettingsViewOpen, setIsSettingsViewOpen] = useState(false);

  const toggleDesktopCollapse = () => {
    setIsCollapsedDesktop((prev) => {
      const next = !prev;
      localStorage.setItem('finora_sidebar_collapsed', String(next));
      return next;
    });
  };

  const handleOpenNewTransaction = (type: 'income' | 'expense' | 'transfer' = 'expense', defaultAccId?: string) => {
    setEditingTransaction(undefined);
    setTransactionModalInitialType(type);
    setTransactionModalInitialAccountId(defaultAccId);
    setIsTransactionModalOpen(true);
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setTransactionModalInitialType(tx.type);
    setTransactionModalInitialAccountId(tx.accountId);
    setIsTransactionModalOpen(true);
  };

  const handleOpenAccountDetail = (acc: Account) => {
    setSelectedDetailAccount(acc);
    setIsAccountDetailOpen(true);
  };

  const getActiveTitle = () => {
    if (isAiViewOpen) return 'FINORA AI Assistant';
    if (isSettingsViewOpen) return language === 'bn' ? 'সেটিংস ও ডেটা হাব' : 'Settings & Backup';
    switch (activeTab) {
      case 'dashboard': return language === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard';
      case 'accounts': return language === 'bn' ? 'অ্যাকাউন্টস ও ওয়ালেট' : 'Accounts & Wallets';
      case 'transactions': return language === 'bn' ? 'লেনদেনের লেজার' : 'Transactions Ledger';
      case 'loans': return language === 'bn' ? 'ধার ও ঋণ' : 'Loans & Debts';
      case 'credit_cards': return language === 'bn' ? 'ক্রেডিট কার্ড' : 'Credit Cards';
      case 'budgets_goals': return language === 'bn' ? 'বাজেট ও লক্ষ্য' : 'Budgets & Goals';
      case 'bills': return language === 'bn' ? 'বিল ও সাবস্ক্রিপশন' : 'Bills & Subscriptions';
      case 'investments': return language === 'bn' ? 'বিনিয়োগ পোর্টফোলিও' : 'Investments';
      case 'reports': return language === 'bn' ? 'রিপোর্ট ও বিবরণী' : 'Reports & Analytics';
      case 'reconciliation': return language === 'bn' ? 'হিসাব সমন্বয় ও অডিট' : 'Reconciliation & Audit';
      default: return language === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard';
    }
  };

  const renderActiveView = () => {
    if (isAiViewOpen) {
      return <AIAssistantView />;
    }

    if (isSettingsViewOpen) {
      return <SettingsView />;
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView
            onOpenNewTransaction={(type) => handleOpenNewTransaction(type || 'expense')}
            onOpenAccountDetail={handleOpenAccountDetail}
            onNavigateTab={(tab) => {
              setIsAiViewOpen(false);
              setIsSettingsViewOpen(false);
              setActiveTab(tab);
            }}
            onOpenAIAssistant={() => {
              setIsAiViewOpen(true);
              setIsSettingsViewOpen(false);
            }}
          />
        );
      case 'accounts':
        return (
          <AccountsView
            onOpenNewTransaction={(type, accId) => handleOpenNewTransaction(type, accId)}
            onOpenAccountDetail={handleOpenAccountDetail}
            onOpenTransferModal={(fromAccId) => handleOpenNewTransaction('transfer', fromAccId)}
          />
        );
      case 'transactions':
        return (
          <TransactionsView
            onOpenNewTransaction={(type) => handleOpenNewTransaction(type)}
            onEditTransaction={handleEditTransaction}
          />
        );
      case 'loans':
        return <LoansView />;
      case 'credit_cards':
        return <CreditCardsView onOpenNewTransaction={handleOpenNewTransaction} />;
      case 'budgets_goals':
        return <BudgetsGoalsView />;
      case 'bills':
        return <BillsView />;
      case 'investments':
        return <InvestmentsView />;
      case 'reports':
        return <AnalyticsView />;
      case 'reconciliation':
        return <ReconciliationView />;
      default:
        return (
          <DashboardView
            onOpenNewTransaction={handleOpenNewTransaction}
            onOpenAccountDetail={handleOpenAccountDetail}
            onNavigateTab={setActiveTab}
            onOpenAIAssistant={() => setIsAiViewOpen(true)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex font-sans transition-colors">
      
      {/* Responsive Collapsible Sidebar + Mobile Drawer */}
      <SidebarNavigation
        activeTab={activeTab}
        isAiActive={isAiViewOpen}
        isSettingsActive={isSettingsViewOpen}
        onSelectTab={(tab) => {
          setIsAiViewOpen(false);
          setIsSettingsViewOpen(false);
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenAIAssistant={() => {
          setIsAiViewOpen(true);
          setIsSettingsViewOpen(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenSettings={() => {
          setIsSettingsViewOpen(true);
          setIsAiViewOpen(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenCalculator={() => setIsCalculatorOpen(true)}
        onOpenAbout={() => setIsAboutOpen(true)}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        isCollapsedDesktop={isCollapsedDesktop}
        onToggleCollapseDesktop={toggleDesktopCollapse}
      />

      {/* Main Workspace Column */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        
        {/* Top Header */}
        <Header
          onToggleMenu={() => setIsMobileMenuOpen(true)}
          activeTabTitle={getActiveTitle()}
          onOpenNewTransaction={() => handleOpenNewTransaction('expense')}
          onOpenAIAssistant={() => {
            setIsAiViewOpen(true);
            setIsSettingsViewOpen(false);
          }}
          onOpenCalculator={() => setIsCalculatorOpen(true)}
          onOpenSettings={() => {
            setIsSettingsViewOpen(true);
            setIsAiViewOpen(false);
          }}
          onOpenAbout={() => setIsAboutOpen(true)}
          onOpenAuth={() => setIsAuthOpen(true)}
        />

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Breadcrumb if in AI or Settings */}
          {(isAiViewOpen || isSettingsViewOpen) && (
            <div className="mb-4 flex items-center gap-2 text-xs">
              <button
                onClick={() => {
                  setIsAiViewOpen(false);
                  setIsSettingsViewOpen(false);
                }}
                className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
              >
                ← মূল ড্যাশবোর্ডে ফিরুন
              </button>
              <span className="text-slate-400">/</span>
              <span className="text-slate-600 dark:text-slate-300 font-medium">
                {isAiViewOpen ? 'FINORA AI Assistant' : 'Settings & Data Hub'}
              </span>
            </div>
          )}

          {renderActiveView()}
        </main>

        {/* Global Footer */}
        <Footer />

      </div>

      {/* Modals */}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        initialType={transactionModalInitialType}
        initialAccountId={transactionModalInitialAccountId}
        transactionToEdit={editingTransaction}
      />

      <AccountDetailModal
        account={selectedDetailAccount}
        isOpen={isAccountDetailOpen}
        onClose={() => {
          setIsAccountDetailOpen(false);
          setSelectedDetailAccount(null);
        }}
        onOpenNewTransaction={handleOpenNewTransaction}
        onEditAccount={() => {}}
      />

      <InAppCalculator
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
      />

      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <FinancialProvider>
        <MainAppContent />
      </FinancialProvider>
    </AuthProvider>
  );
}

