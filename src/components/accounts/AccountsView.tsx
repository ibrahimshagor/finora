import React, { useState } from 'react';
import { 
  Plus, 
  Landmark, 
  Wallet, 
  CreditCard, 
  PiggyBank, 
  Eye, 
  EyeOff, 
  ArrowLeftRight, 
  ArrowDownLeft, 
  ArrowUpRight, 
  FileText, 
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  LayoutGrid,
  List,
  Edit3,
  X,
  Printer,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import { useFinance } from '../../context/FinancialContext';
import { PrivacyAmount } from '../common/PrivacyAmount';
import { Account, AccountType } from '../../types';
import { generateAccountReport, generateAllAccountsReport } from '../../lib/reportGenerator';

interface AccountsViewProps {
  onOpenAccountDetail: (account: Account) => void;
  onOpenNewTransaction: (type?: 'income' | 'expense' | 'transfer', defaultAccId?: string) => void;
  onOpenTransferModal?: (fromAccId?: string) => void;
}

const ACCOUNT_TYPE_CONFIG: { [key in AccountType]: { label: string; labelBn: string; icon: any; defaultColor: string } } = {
  cash: { label: 'Cash', labelBn: 'নগদ টাকা', icon: Wallet, defaultColor: '#10b981' },
  bank: { label: 'Bank Account', labelBn: 'ব্যাংক অ্যাকাউন্ট', icon: Landmark, defaultColor: '#3b82f6' },
  savings: { label: 'Savings Deposit', labelBn: 'সঞ্চয় হিসাব', icon: PiggyBank, defaultColor: '#059669' },
  wallet: { label: 'Mobile Wallet (bKash/Nagad)', labelBn: 'মোবাইল ওয়ালেট', icon: Wallet, defaultColor: '#e11d48' },
  credit_card: { label: 'Credit Card', labelBn: 'ক্রেডিট কার্ড', icon: CreditCard, defaultColor: '#8b5cf6' },
  loan: { label: 'Loan Account', labelBn: 'ঋণ হিসাব', icon: Landmark, defaultColor: '#f59e0b' },
  investment: { label: 'Investment Portfolio', labelBn: 'বিনিয়োগ পোর্টফোলিও', icon: TrendingUp, defaultColor: '#06b6d4' },
  other: { label: 'Other Asset', labelBn: 'অন্যান্য', icon: Landmark, defaultColor: '#64748b' },
};

export const AccountsView: React.FC<AccountsViewProps> = ({
  onOpenAccountDetail,
  onOpenNewTransaction,
  onOpenTransferModal,
}) => {
  const { accounts, transactions, addAccount, updateAccount, toggleHideAccount, currencySymbol, language } = useFinance();

  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const handlePrintAllAccounts = () => {
    const rep = generateAllAccountsReport(accounts, transactions, currencySymbol);
    rep.print();
  };

  const handleCSVAllAccounts = () => {
    const rep = generateAllAccountsReport(accounts, transactions, currencySymbol);
    rep.downloadCSV();
  };

  // Form State for new/edit account
  const [formData, setFormData] = useState<{
    name: string;
    type: AccountType;
    institutionName: string;
    accountNumber: string;
    balance: number;
    creditLimit: number;
    billingDate: number;
    dueDate: number;
    color: string;
    notes: string;
  }>({
    name: '',
    type: 'bank',
    institutionName: '',
    accountNumber: '',
    balance: 0,
    creditLimit: 0,
    billingDate: 1,
    dueDate: 15,
    color: '#3b82f6',
    notes: '',
  });

  const handleOpenCreate = () => {
    setEditingAccount(null);
    setFormData({
      name: '',
      type: 'bank',
      institutionName: '',
      accountNumber: '',
      balance: 0,
      creditLimit: 0,
      billingDate: 1,
      dueDate: 15,
      color: '#3b82f6',
      notes: '',
    });
    setShowCreateModal(true);
  };

  const handleOpenEdit = (acc: Account) => {
    setEditingAccount(acc);
    setFormData({
      name: acc.name,
      type: acc.type,
      institutionName: acc.institutionName || '',
      accountNumber: acc.accountNumber || '',
      balance: acc.balance,
      creditLimit: acc.creditLimit || 0,
      billingDate: acc.billingDate || 1,
      dueDate: acc.dueDate || 15,
      color: acc.color || '#3b82f6',
      notes: acc.notes || '',
    });
    setShowCreateModal(true);
  };

  const handleSubmitAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingAccount) {
      await updateAccount(editingAccount.id, {
        name: formData.name,
        type: formData.type,
        institutionName: formData.institutionName,
        accountNumber: formData.accountNumber,
        balance: Number(formData.balance),
        creditLimit: formData.type === 'credit_card' ? Number(formData.creditLimit) : undefined,
        billingDate: formData.type === 'credit_card' ? Number(formData.billingDate) : undefined,
        dueDate: formData.type === 'credit_card' ? Number(formData.dueDate) : undefined,
        color: formData.color,
        notes: formData.notes,
      });
    } else {
      await addAccount({
        name: formData.name,
        type: formData.type,
        institutionName: formData.institutionName,
        accountNumber: formData.accountNumber,
        balance: Number(formData.balance),
        initialBalance: Number(formData.balance),
        creditLimit: formData.type === 'credit_card' ? Number(formData.creditLimit) : undefined,
        billingDate: formData.type === 'credit_card' ? Number(formData.billingDate) : undefined,
        dueDate: formData.type === 'credit_card' ? Number(formData.dueDate) : undefined,
        color: formData.color,
        notes: formData.notes,
      });
    }

    setShowCreateModal(false);
  };

  const filteredAccounts = accounts.filter((a) => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'hidden') return a.isHidden;
    return a.type === selectedFilter && !a.isHidden;
  });

  const totalCashBank = accounts
    .filter((a) => !a.isHidden && a.type !== 'credit_card')
    .reduce((sum, a) => sum + a.balance, 0);

  const totalCreditDebt = accounts
    .filter((a) => a.type === 'credit_card' && a.balance < 0)
    .reduce((sum, a) => sum + Math.abs(a.balance), 0);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Header & Metrics */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {language === 'bn' ? 'অ্যাকাউন্টস হাব' : 'Accounts Hub'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {language === 'bn' ? 'নগদ টাকা, ব্যাংক হিসাব, বিকাশ/নগদ, সঞ্চয়ী অ্যাকাউন্ট ও ক্রেডিট কার্ড এক নজরে পরিচালনা করুন।' : 'Manage cash, bank accounts, mobile wallets, savings deposits, and credit cards at a glance.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handlePrintAllAccounts}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold rounded-xl hover:bg-slate-800 transition-colors shadow-xs"
            title="সকল অ্যাকাউন্টের বিবরণী প্রিন্ট বা PDF ডাউনলোড"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'সকল অ্যাকাউন্টের রিপোর্ট' : 'All Accounts Report'}</span>
          </button>

          <button
            onClick={handleCSVAllAccounts}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors"
            title="CSV এক্সপোর্ট"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>

          <button
            onClick={() => {
              if (typeof onOpenTransferModal === 'function') {
                onOpenTransferModal();
              } else {
                onOpenNewTransaction('transfer');
              }
            }}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'ট্রান্সফার' : 'Transfer'}</span>
          </button>

          <button
            id="accounts-add-account-btn"
            onClick={handleOpenCreate}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'bn' ? 'নতুন অ্যাকাউন্ট' : 'Add Account'}</span>
          </button>
        </div>
      </div>

      {/* Account Balances Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-xs text-slate-400 font-medium">{language === 'bn' ? 'মোট উপলব্ধ নগদ ও ব্যাংক ব্যালেন্স' : 'Total Liquid & Bank Balance'}</span>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-1">
            <PrivacyAmount amount={totalCashBank} />
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-xs text-slate-400 font-medium">{language === 'bn' ? 'ক্রেডিট কার্ডের বকেয়া দেনা' : 'Total Credit Card Debt'}</span>
          <p className="text-xl font-bold text-rose-600 dark:text-rose-400 font-mono mt-1">
            <PrivacyAmount amount={totalCreditDebt} />
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-xs text-slate-400 font-medium">{language === 'bn' ? 'মোট সক্রিয় অ্যাকাউন্ট সংখ্যা' : 'Active Accounts Count'}</span>
          <p className="text-xl font-bold text-slate-900 dark:text-white font-mono mt-1">
            {accounts.filter((a) => !a.isHidden).length} {language === 'bn' ? 'টি' : ''}
          </p>
        </div>
      </div>

      {/* Filter Chips & View Mode Switch */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-1">
        <div className="flex items-center space-x-2 overflow-x-auto scrollbar-none w-full sm:w-auto">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedFilter === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            {language === 'bn' ? 'সব অ্যাকাউন্ট' : 'All Accounts'} ({accounts.length})
          </button>

          {Object.entries(ACCOUNT_TYPE_CONFIG).map(([typeKey, cfg]) => {
            const count = accounts.filter((a) => a.type === typeKey && !a.isHidden).length;
            if (count === 0 && selectedFilter !== typeKey) return null;
            return (
              <button
                key={typeKey}
                onClick={() => setSelectedFilter(typeKey)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedFilter === typeKey
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {language === 'bn' ? cfg.labelBn : cfg.label} ({count})
              </button>
            );
          })}

          <button
            onClick={() => setSelectedFilter('hidden')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedFilter === 'hidden'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            {language === 'bn' ? 'লুকানো' : 'Hidden'} ({accounts.filter((a) => a.isHidden).length})
          </button>
        </div>

        {/* View Mode Toggle Button Group */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-end sm:self-auto flex-shrink-0">
          <button
            id="accounts-view-mode-grid"
            onClick={() => setViewMode('grid')}
            title={language === 'bn' ? 'কার্ড ভিউ' : 'Card View'}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'grid'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{language === 'bn' ? 'কার্ড ভিউ' : 'Cards'}</span>
          </button>
          <button
            id="accounts-view-mode-list"
            onClick={() => setViewMode('list')}
            title={language === 'bn' ? 'লিস্ট ভিউ' : 'List View'}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'list'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{language === 'bn' ? 'লিস্ট ভিউ' : 'List'}</span>
          </button>
        </div>
      </div>

      {/* Accounts List / Cards Rendering */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAccounts.map((account) => {
            const cfg = ACCOUNT_TYPE_CONFIG[account.type] || ACCOUNT_TYPE_CONFIG.other;
            const Icon = cfg.icon;

            return (
              <div
                key={account.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-200 p-5 flex flex-col justify-between relative overflow-hidden shadow-2xs hover:shadow-md ${
                  account.isHidden 
                    ? 'opacity-60 border-dashed border-slate-300 dark:border-slate-700' 
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                {/* Colored top accent bar */}
                <div 
                  className="absolute top-0 left-0 right-0 h-1.5"
                  style={{ backgroundColor: account.color || cfg.defaultColor }}
                />

                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-xs"
                        style={{ backgroundColor: account.color || cfg.defaultColor }}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[170px]">
                          {account.name}
                        </h3>
                        <p className="text-xs text-slate-400">
                          {account.institutionName || (language === 'bn' ? cfg.labelBn : cfg.label)}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleHideAccount(account.id)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                      title={account.isHidden ? (language === 'bn' ? 'অ্যাকাউন্ট প্রদর্শন করুন' : 'Show Account') : (language === 'bn' ? 'অ্যাকাউন্ট লুকান' : 'Hide Account')}
                    >
                      {account.isHidden ? <EyeOff className="w-4 h-4 text-amber-500" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {account.accountNumber && (
                    <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mb-2">
                      {language === 'bn' ? 'হিসাব নং' : 'A/C'}: {account.accountNumber}
                    </p>
                  )}

                  {/* Balance display */}
                  <div className="mt-3 py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
                      {language === 'bn' ? 'বর্তমান ব্যালেন্স' : 'Current Balance'}
                    </span>
                    <div className={`text-xl font-bold font-mono mt-0.5 ${
                      account.type === 'credit_card' && account.balance < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
                    }`}>
                      <PrivacyAmount amount={account.balance} />
                    </div>
                  </div>

                  {account.type === 'credit_card' && account.creditLimit && (
                    <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex justify-between">
                      <span>{language === 'bn' ? 'সীমা' : 'Limit'}: <PrivacyAmount amount={account.creditLimit} /></span>
                      <span>{language === 'bn' ? 'বকেয়া' : 'Due'}: <PrivacyAmount amount={Math.abs(account.balance)} /></span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onOpenAccountDetail(account)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>{language === 'bn' ? 'স্টেটমেন্ট' : 'Statement'}</span>
                  </button>

                  <button
                    onClick={() => {
                      const rep = generateAccountReport(account, transactions, currencySymbol);
                      rep.print();
                    }}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-colors"
                    title={language === 'bn' ? 'রিপোর্ট প্রিন্ট বা PDF' : 'Print / PDF Report'}
                  >
                    <Printer className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onOpenNewTransaction('income', account.id)}
                    className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 dark:text-emerald-300 rounded-xl transition-colors"
                    title={language === 'bn' ? 'জমা করুন (Inflow)' : 'Deposit (Inflow)'}
                  >
                    <ArrowDownLeft className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onOpenNewTransaction('expense', account.id)}
                    className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 dark:text-rose-300 rounded-xl transition-colors"
                    title={language === 'bn' ? 'খরচ করুন (Outflow)' : 'Expense (Outflow)'}
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleOpenEdit(account)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                    title={language === 'bn' ? 'সম্পাদনা করুন' : 'Edit'}
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        /* List View for Accounts */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3.5 pl-4">{language === 'bn' ? 'অ্যাকাউন্ট ও প্রতিষ্ঠান' : 'Account & Institution'}</th>
                  <th className="p-3.5">{language === 'bn' ? 'ধরন' : 'Type'}</th>
                  <th className="p-3.5">{language === 'bn' ? 'হিসাব নম্বর' : 'Account Number'}</th>
                  <th className="p-3.5 text-right">{language === 'bn' ? 'বর্তমান ব্যালেন্স' : 'Current Balance'}</th>
                  <th className="p-3.5 text-center pr-4">{language === 'bn' ? 'অ্যাকশন' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      {language === 'bn' ? 'কোনো অ্যাকাউন্ট পাওয়া যায়নি।' : 'No accounts found.'}
                    </td>
                  </tr>
                ) : (
                  filteredAccounts.map((account) => {
                    const cfg = ACCOUNT_TYPE_CONFIG[account.type] || ACCOUNT_TYPE_CONFIG.other;
                    const Icon = cfg.icon;

                    return (
                      <tr 
                        key={account.id} 
                        className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                          account.isHidden ? 'opacity-60 bg-slate-50/40 dark:bg-slate-900/40' : ''
                        }`}
                      >
                        <td className="p-3.5 pl-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold shadow-2xs flex-shrink-0"
                              style={{ backgroundColor: account.color || cfg.defaultColor }}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 dark:text-white block truncate">
                                {account.name}
                              </span>
                              <span className="text-[11px] text-slate-400 truncate block">
                                {account.institutionName || (language === 'bn' ? cfg.labelBn : cfg.label)}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {language === 'bn' ? cfg.labelBn : cfg.label}
                          </span>
                        </td>

                        <td className="p-3.5 font-mono text-slate-600 dark:text-slate-400">
                          {account.accountNumber || '—'}
                        </td>

                        <td className="p-3.5 text-right font-mono font-bold">
                          <span className={`text-sm ${
                            account.type === 'credit_card' && account.balance < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
                          }`}>
                            <PrivacyAmount amount={account.balance} />
                          </span>
                        </td>

                        <td className="p-3.5 pr-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => onOpenAccountDetail(account)}
                              className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors"
                              title={language === 'bn' ? 'স্টেটমেন্ট দেখুন' : 'View Statement'}
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">{language === 'bn' ? 'স্টেটমেন্ট' : 'Statement'}</span>
                            </button>

                            <button
                              onClick={() => {
                                const rep = generateAccountReport(account, transactions, currencySymbol);
                                rep.print();
                              }}
                              className="p-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition-colors"
                              title={language === 'bn' ? 'রিপোর্ট প্রিন্ট বা PDF' : 'Print / PDF Report'}
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => onOpenNewTransaction('income', account.id)}
                              className="p-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 dark:text-emerald-300 rounded-lg transition-colors"
                              title={language === 'bn' ? 'টাকা জমা' : 'Deposit'}
                            >
                              <ArrowDownLeft className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => onOpenNewTransaction('expense', account.id)}
                              className="p-1 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 dark:text-rose-300 rounded-lg transition-colors"
                              title={language === 'bn' ? 'খরচ' : 'Expense'}
                            >
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleOpenEdit(account)}
                              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title={language === 'bn' ? 'সম্পাদনা' : 'Edit'}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => toggleHideAccount(account.id)}
                              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
                              title={account.isHidden ? (language === 'bn' ? 'প্রদর্শন করুন' : 'Show') : (language === 'bn' ? 'লুকান' : 'Hide')}
                            >
                              {account.isHidden ? <EyeOff className="w-3.5 h-3.5 text-amber-500" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Account Modal */}
      {showCreateModal && (
        <div
          id="account-form-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
        >
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingAccount 
                  ? (language === 'bn' ? 'অ্যাকাউন্ট সম্পাদনা করুন' : 'Edit Account')
                  : (language === 'bn' ? 'নতুন অ্যাকাউন্ট তৈরি করুন' : 'Create New Account')}
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitAccount} className="p-6 space-y-4 text-xs">
              
              {/* Account Type */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'bn' ? 'অ্যাকাউন্টের ধরন *' : 'Account Type *'}
                </label>
                <select
                  value={formData.type || 'bank'}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as AccountType })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="cash">{language === 'bn' ? 'নগদ টাকা (Cash in Hand)' : 'Cash in Hand'}</option>
                  <option value="bank">{language === 'bn' ? 'ব্যাংক হিসাব (Savings/Current Bank)' : 'Bank Account'}</option>
                  <option value="wallet">{language === 'bn' ? 'মোবাইল ওয়ালেট (bKash / Nagad / Rocket)' : 'Mobile Wallet (bKash/Nagad)'}</option>
                  <option value="savings">{language === 'bn' ? 'সঞ্চয়ী হিসাব (DPS / FDR Deposit)' : 'Savings / DPS / FDR'}</option>
                  <option value="credit_card">{language === 'bn' ? 'ক্রেডিট কার্ড (Credit Card)' : 'Credit Card'}</option>
                  <option value="investment">{language === 'bn' ? 'বিনিয়োগ (Investment Asset)' : 'Investment Portfolio'}</option>
                  <option value="loan">{language === 'bn' ? 'ঋণ হিসাব (Loan Account)' : 'Loan Account'}</option>
                  <option value="other">{language === 'bn' ? 'অন্যান্য (Other)' : 'Other Asset'}</option>
                </select>
              </div>

              {/* Name */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'bn' ? 'অ্যাকাউন্টের নাম *' : 'Account Name *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={language === 'bn' ? 'যেমন: City Bank Salary Account, বা Cash Wallet' : 'e.g. City Bank Salary Account, Cash Wallet'}
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Institution Name & Number */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'bn' ? 'প্রতিষ্ঠানের নাম' : 'Bank / Provider'}
                  </label>
                  <input
                    type="text"
                    placeholder={language === 'bn' ? 'যেমন: BRAC Bank' : 'e.g. BRAC Bank'}
                    value={formData.institutionName || ''}
                    onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'bn' ? 'অ্যাকাউন্ট নং / শেষ ৪ ডিজিট' : 'Account No / Last 4 Digits'}
                  </label>
                  <input
                    type="text"
                    placeholder={language === 'bn' ? 'যেমন: **** 4092' : 'e.g. **** 4092'}
                    value={formData.accountNumber || ''}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Initial / Current Balance */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'bn' ? `বর্তমান ব্যালেন্স (${currencySymbol}) *` : `Current Balance (${currencySymbol}) *`}
                </label>
                <input
                  type="number"
                  required
                  placeholder="0.00"
                  value={formData.balance !== undefined && formData.balance !== null ? formData.balance : ''}
                  onChange={(e) => setFormData({ ...formData, balance: e.target.value === '' ? '' : (parseFloat(e.target.value) || 0) })}
                  className="w-full px-3 py-2 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  {language === 'bn' 
                    ? 'ক্রেডিট কার্ডের ক্ষেত্রে বকেয়া দেনা থাকলে নেগেটিভ (যেমন: -5000) লিখুন।'
                    : 'For credit cards with outstanding dues, enter as negative (e.g. -5000).'}
                </p>
              </div>

              {/* Credit Card Specific Fields */}
              {formData.type === 'credit_card' && (
                <div className="p-3 bg-purple-50/50 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-800/60 space-y-3">
                  <div>
                    <label className="block font-semibold text-purple-900 dark:text-purple-300 mb-1">
                      {language === 'bn' ? 'মোট credit লিমিট' : 'Credit Limit'}
                    </label>
                    <input
                      type="number"
                      placeholder="150000"
                      value={formData.creditLimit !== undefined && formData.creditLimit !== null ? formData.creditLimit : ''}
                      onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value === '' ? '' : (parseFloat(e.target.value) || 0) })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-purple-900 dark:text-purple-300 mb-1">
                        {language === 'bn' ? 'বিল তৈরির তারিখ (Day)' : 'Billing Cycle Day'}
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={formData.billingDate !== undefined && formData.billingDate !== null ? formData.billingDate : 1}
                        onChange={(e) => setFormData({ ...formData, billingDate: parseInt(e.target.value) || 1 })}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-purple-900 dark:text-purple-300 mb-1">
                        {language === 'bn' ? 'পরিশোধের শেষ তারিখ (Day)' : 'Payment Due Day'}
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={formData.dueDate !== undefined && formData.dueDate !== null ? formData.dueDate : 15}
                        onChange={(e) => setFormData({ ...formData, dueDate: parseInt(e.target.value) || 15 })}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Color picker */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {language === 'bn' ? 'কার্ড কালার' : 'Card Color'}
                </label>
                <div className="flex items-center gap-2">
                  {['#10b981', '#3b82f6', '#8b5cf6', '#e11d48', '#f59e0b', '#06b6d4', '#0f172a'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: c })}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${
                        formData.color === c ? 'scale-115 border-slate-900 dark:border-white' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-semibold transition-colors"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors shadow-sm"
                >
                  {editingAccount 
                    ? (language === 'bn' ? 'পরিবর্তন সংরক্ষণ করুন' : 'Save Changes')
                    : (language === 'bn' ? 'অ্যাকাউন্ট তৈরি করুন' : 'Create Account')}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
