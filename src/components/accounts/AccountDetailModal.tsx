import React, { useState } from 'react';
import { 
  X, 
  Landmark, 
  Wallet, 
  CreditCard, 
  PiggyBank, 
  ArrowDownLeft, 
  ArrowUpRight, 
  ArrowLeftRight, 
  Download, 
  Printer,
  Edit3, 
  EyeOff, 
  Trash2,
  Calendar,
  Search,
  Filter,
  FileText
} from 'lucide-react';
import { useFinance } from '../../context/FinancialContext';
import { PrivacyAmount } from '../common/PrivacyAmount';
import { DeleteConfirmModal } from '../common/DeleteConfirmModal';
import { Account, Transaction } from '../../types';
import { generateAccountReport } from '../../lib/reportGenerator';

interface AccountDetailModalProps {
  account: Account | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenNewTransaction: (type?: 'income' | 'expense' | 'transfer', defaultAccId?: string) => void;
  onEditAccount: (account: Account) => void;
}

export const AccountDetailModal: React.FC<AccountDetailModalProps> = ({
  account,
  isOpen,
  onClose,
  onOpenNewTransaction,
  onEditAccount,
}) => {
  const { 
    getAccountStatement, 
    transactions, 
    categories, 
    accounts, 
    deleteAccount, 
    toggleHideAccount,
    currencySymbol,
    language
  } = useFinance();

  const [activeTab, setActiveTab] = useState<'statement' | 'ledger'>('statement');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !account) return null;

  const statement = getAccountStatement(account.id, dateRange.start || undefined, dateRange.end || undefined);

  // Filter transactions for the ledger tab
  const accountTransactions = transactions.filter((t) => {
    const isRelated = t.accountId === account.id || t.targetAccountId === account.id;
    if (!isRelated) return false;

    if (filterType !== 'all' && t.type !== filterType) return false;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchDesc = t.description?.toLowerCase().includes(term);
      const matchPayee = t.payerPayee?.toLowerCase().includes(term);
      const matchNotes = t.notes?.toLowerCase().includes(term);
      return matchDesc || matchPayee || matchNotes;
    }
    return true;
  });

  const handlePrintStatement = () => {
    const rep = generateAccountReport(account, transactions, currencySymbol, dateRange.start || undefined, dateRange.end || undefined);
    rep.print();
  };

  const handleExportCSV = () => {
    const rep = generateAccountReport(account, transactions, currencySymbol, dateRange.start || undefined, dateRange.end || undefined);
    rep.downloadCSV();
  };

  return (
    <div
      id="account-detail-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
    >
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
        
        {/* Header & Balance Banner */}
        <div 
          className="p-6 text-white relative overflow-hidden"
          style={{ backgroundColor: account.color || '#0f172a' }}
        >
          <div className="flex items-center justify-between relative z-10 mb-4">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white/20 uppercase tracking-wider backdrop-blur-xs">
                {account.type.replace('_', ' ')}
              </span>
              {account.institutionName && (
                <span className="text-xs text-white/80 font-medium">
                  {account.institutionName}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1 text-white/80 hover:text-white rounded-lg hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="relative z-10">
            <h2 className="text-2xl font-bold">{account.name}</h2>
            {account.accountNumber && (
              <p className="text-xs text-white/70 font-mono mt-0.5">
                হিসাব নং: {account.accountNumber}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-baseline gap-2">
              <span className="text-xs text-white/80 font-medium">বর্তমান ব্যালেন্স:</span>
              <div className="text-3xl font-bold font-mono">
                <PrivacyAmount amount={account.balance} />
              </div>
            </div>

            {account.type === 'credit_card' && account.creditLimit && (
              <div className="mt-2 text-xs text-white/90 flex items-center gap-4">
                <span>ক্রেডিট সীমা: <PrivacyAmount amount={account.creditLimit} /></span>
                <span>অবশিষ্ট সীমা: <PrivacyAmount amount={account.creditLimit + account.balance} /></span>
              </div>
            )}
          </div>

            {/* Quick Actions inside header */}
          <div className="mt-5 flex flex-wrap items-center gap-2 relative z-10">
            <button
              onClick={() => {
                onClose();
                onOpenNewTransaction('income', account.id);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-semibold transition-colors backdrop-blur-xs"
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'টাকা জমা (Inflow)' : 'Deposit (Inflow)'}</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenNewTransaction('expense', account.id);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-semibold transition-colors backdrop-blur-xs"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'খরচ (Outflow)' : 'Expense (Outflow)'}</span>
            </button>

            <button
              id="account-detail-direct-transfer-btn"
              onClick={() => {
                onClose();
                onOpenNewTransaction('transfer', account.id);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'সরাসরি ট্রান্সফার' : 'Direct Transfer'}</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onEditAccount(account);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-semibold transition-colors backdrop-blur-xs ml-auto"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'সম্পাদনা' : 'Edit'}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('statement')}
              className={`py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
                activeTab === 'statement'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              হিসাবের বিবরণী (Statement)
            </button>
            <button
              onClick={() => setActiveTab('ledger')}
              className={`py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
                activeTab === 'ledger'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              লেনদেনের খাতা (Transactions Ledger)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintStatement}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>প্রিন্ট রিপোর্ট</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV ডাউনলোড</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[55vh] overflow-y-auto">
          {activeTab === 'statement' && statement && (
            <div className="space-y-5">
              
              {/* Statement Summary Card */}
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200 dark:border-slate-700/80">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400">শুরুর ব্যালেন্স:</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200 font-mono mt-0.5">
                      <PrivacyAmount amount={statement.openingBalance} />
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">মোট জমা (+ In):</span>
                    <p className="font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                      +<PrivacyAmount amount={statement.totalIncome + statement.totalTransferIn + statement.totalLoanReceipts} />
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">মোট খরচ (- Out):</span>
                    <p className="font-bold text-rose-600 dark:text-rose-400 font-mono mt-0.5">
                      -<PrivacyAmount amount={statement.totalExpense + statement.totalTransferOut + statement.totalLoanPayments} />
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">বর্তমান ব্যালেন্স:</span>
                    <p className="font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                      <PrivacyAmount amount={statement.closingBalance} />
                    </p>
                  </div>
                </div>
              </div>

              {/* Inflow vs Outflow Detailed Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl border border-emerald-200/70 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-950/20">
                  <h4 className="font-bold text-emerald-800 dark:text-emerald-300 mb-2">
                    জমা ও প্রবেশ (Inflows Breakdown)
                  </h4>
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-300">আয় (Income):</span>
                      <span className="font-mono font-semibold"><PrivacyAmount amount={statement.totalIncome} /></span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-300">অন্য অ্যাকাউন্ট থেকে স্থানান্তর:</span>
                      <span className="font-mono font-semibold"><PrivacyAmount amount={statement.totalTransferIn} /></span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-300">ঋণ গ্রহণ / ঋণ আদায় প্রাপ্তি:</span>
                      <span className="font-mono font-semibold"><PrivacyAmount amount={statement.totalLoanReceipts} /></span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-rose-200/70 dark:border-rose-900/50 bg-rose-50/30 dark:bg-rose-950/20">
                  <h4 className="font-bold text-rose-800 dark:text-rose-300 mb-2">
                    খরচ ও নিষ্কাশন (Outflows Breakdown)
                  </h4>
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-300">খরচ (Expenses):</span>
                      <span className="font-mono font-semibold"><PrivacyAmount amount={statement.totalExpense} /></span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-300">অন্য অ্যাকাউন্টে স্থানান্তর:</span>
                      <span className="font-mono font-semibold"><PrivacyAmount amount={statement.totalTransferOut} /></span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-300">ঋণ প্রদান / ঋণ পরিশোধ:</span>
                      <span className="font-mono font-semibold"><PrivacyAmount amount={statement.totalLoanPayments} /></span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {activeTab === 'ledger' && (
            <div className="space-y-4">
              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <div className="relative flex-1 w-full">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="লেনদেন খুঁজুন (বিবরণ, প্রাপক)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 focus:outline-none"
                >
                  <option value="all">সকল ধরন (All Types)</option>
                  <option value="income">শুধুমাত্র আয় (Income)</option>
                  <option value="expense">শুধুমাত্র খরচ (Expense)</option>
                  <option value="transfer">স্থানান্তর (Transfer)</option>
                </select>
              </div>

              {/* Transactions List */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {accountTransactions.length === 0 ? (
                  <p className="py-8 text-center text-xs text-slate-400">
                    এই অ্যাকাউন্টে কোনো সংশ্লিষ্ট লেনদেন পাওয়া যায়নি।
                  </p>
                ) : (
                  accountTransactions.map((t) => {
                    const isSender = t.accountId === account.id;
                    const cat = categories.find((c) => c.id === t.categoryId);

                    return (
                      <div key={t.id} className="py-2.5 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">
                            {t.description || (cat ? (cat.nameBn || cat.name) : t.type)}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {t.date} • {t.payerPayee ? `প্রাপক/প্রদানকারী: ${t.payerPayee}` : t.type}
                          </p>
                        </div>
                        <div className="text-right font-mono font-bold">
                          <span
                            className={
                              t.type === 'income' || (!isSender && t.type === 'transfer')
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }
                          >
                            <PrivacyAmount 
                              amount={t.amount} 
                              showSign={true}
                              prefix={
                                t.type === 'income' || (!isSender && t.type === 'transfer')
                                  ? `+${currencySymbol}`
                                  : `-${currencySymbol}`
                              }
                            />
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <button
            id="account-detail-delete-btn"
            onClick={() => setShowDeleteConfirm(true)}
            className="text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 font-semibold transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'অ্যাকাউন্ট মুছুন' : 'Delete Account'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold rounded-xl transition-colors"
          >
            {language === 'bn' ? 'বন্ধ করুন (Close)' : 'Close'}
          </button>
        </div>

      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteConfirm}
        itemName={account.name}
        title={language === 'bn' ? `"${account.name}" অ্যাকাউন্ট মুছুন` : `Delete "${account.name}" Account`}
        message={language === 'bn'
          ? `আপনি কি নিশ্চিত যে "${account.name}" অ্যাকাউন্টটি স্থায়ীভাবে মুছে ফেলতে চান? এটি মুছে ফেললে এর সংরক্ষিত ডাটা অপসারিত হবে।`
          : `Are you sure you want to permanently delete "${account.name}"? This action cannot be undone.`}
        onConfirm={async () => {
          try {
            setIsDeleting(true);
            await deleteAccount(account.id);
            setShowDeleteConfirm(false);
            onClose();
          } catch (err) {
            console.error('Delete error:', err);
          } finally {
            setIsDeleting(false);
          }
        }}
        onCancel={() => setShowDeleteConfirm(false)}
        isLoading={isDeleting}
      />
    </div>
  );
};
