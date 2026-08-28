import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Trash2, 
  Edit3, 
  ArrowDownLeft, 
  ArrowUpRight, 
  ArrowLeftRight, 
  FileText, 
  Calendar,
  Image as ImageIcon,
  X
} from 'lucide-react';
import { useFinance } from '../../context/FinancialContext';
import { PrivacyAmount } from '../common/PrivacyAmount';
import { Transaction, TransactionType } from '../../types';

interface TransactionsViewProps {
  onOpenNewTransaction: (type?: TransactionType, defaultAccId?: string) => void;
  onEditTransaction: (tx: Transaction) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  onOpenNewTransaction,
  onEditTransaction,
}) => {
  const { 
    transactions, 
    accounts, 
    categories, 
    deleteTransaction, 
    currencySymbol,
    language 
  } = useFinance();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'this_month' | 'custom'>('this_month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [previewReceiptUrl, setPreviewReceiptUrl] = useState<string | null>(null);

  const currentMonth = new Date().toISOString().substring(0, 7);
  const todayStr = new Date().toISOString().substring(0, 10);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Type Filter
      if (selectedType !== 'all' && t.type !== selectedType) return false;

      // Account Filter
      if (selectedAccount !== 'all') {
        const matchAcc = t.accountId === selectedAccount || t.targetAccountId === selectedAccount;
        if (!matchAcc) return false;
      }

      // Category Filter
      if (selectedCategory !== 'all' && t.categoryId !== selectedCategory) return false;

      // Date Range Filter
      if (dateFilter === 'today' && t.date !== todayStr) return false;
      if (dateFilter === 'this_month' && !t.date.startsWith(currentMonth)) return false;
      if (dateFilter === 'custom') {
        if (customStartDate && t.date < customStartDate) return false;
        if (customEndDate && t.date > customEndDate) return false;
      }

      // Search
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const desc = t.description?.toLowerCase() || '';
        const payee = t.payerPayee?.toLowerCase() || '';
        const notes = t.notes?.toLowerCase() || '';
        const sub = t.subcategory?.toLowerCase() || '';
        if (!desc.includes(term) && !payee.includes(term) && !notes.includes(term) && !sub.includes(term)) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, selectedType, selectedAccount, selectedCategory, dateFilter, customStartDate, customEndDate, searchTerm, todayStr, currentMonth]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Date', 'Type', 'Amount', 'Currency', 'Account', 'TargetAccount', 'Category', 'Subcategory', 'Payee/Payer', 'Description', 'Notes'];
    const rows = filteredTransactions.map((t) => {
      const acc = accounts.find((a) => a.id === t.accountId)?.name || t.accountId;
      const targetAcc = t.targetAccountId ? (accounts.find((a) => a.id === t.targetAccountId)?.name || t.targetAccountId) : '';
      const catObj = categories.find((c) => c.id === t.categoryId);
      const cat = catObj ? (language === 'bn' ? (catObj.nameBn || catObj.name) : (catObj.name || catObj.nameBn)) : (t.categoryId || '');
      return [
        t.date,
        t.type,
        t.amount,
        currencySymbol,
        `"${acc.replace(/"/g, '""')}"`,
        `"${targetAcc.replace(/"/g, '""')}"`,
        `"${cat.replace(/"/g, '""')}"`,
        `"${(t.subcategory || '').replace(/"/g, '""')}"`,
        `"${(t.payerPayee || '').replace(/"/g, '""')}"`,
        `"${(t.description || '').replace(/"/g, '""')}"`,
        `"${(t.notes || '').replace(/"/g, '""')}"`,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `FINORA_Transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Compute filtered totals
  const filteredIncome = filteredTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const filteredExpense = filteredTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {language === 'bn' ? 'লেনদেনের খতিয়ান' : 'Transactions Ledger'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {language === 'bn' ? 'আয়, ব্যয়, অ্যাকাউন্ট ট্রান্সফার এবং ঋণের সমন্বিত রেকর্ড।' : 'Complete records of income, expense, transfers, and loans.'}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'CSV এক্সপোর্ট' : 'Export CSV'}</span>
          </button>

          <button
            onClick={() => onOpenNewTransaction('expense')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'bn' ? 'নতুন লেনদেন' : 'New Transaction'}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
        
        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={language === 'bn' ? 'লেনদেন অনুসন্ধান করুন (বিবরণ, প্রদানকারী/প্রাপক, নোট)...' : 'Search transactions (description, payee, notes)...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 focus:outline-none font-medium"
            >
              <option value="this_month">{language === 'bn' ? 'চলতি মাস (This Month)' : 'This Month'}</option>
              <option value="today">{language === 'bn' ? 'আজ (Today)' : 'Today'}</option>
              <option value="all">{language === 'bn' ? 'সব সময় (All Time)' : 'All Time'}</option>
              <option value="custom">{language === 'bn' ? 'কাস্টম রেঞ্জ (Custom Date)' : 'Custom Date Range'}</option>
            </select>
          </div>
        </div>

        {/* Custom Date Pickers */}
        {dateFilter === 'custom' && (
          <div className="flex items-center gap-3 pt-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">{language === 'bn' ? 'হতে:' : 'From:'}</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">{language === 'bn' ? 'পর্যন্ত:' : 'To:'}</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>
        )}

        {/* Dropdown Filters (Type, Account, Category) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 focus:outline-none"
          >
            <option value="all">{language === 'bn' ? 'সকল ধরন (All Types)' : 'All Types'}</option>
            <option value="income">{language === 'bn' ? 'টাকা জমা / আয় (Income)' : 'Income'}</option>
            <option value="expense">{language === 'bn' ? 'খরচ / ব্যয় (Expense)' : 'Expense'}</option>
            <option value="transfer">{language === 'bn' ? 'অ্যাকাউন্ট স্থানান্তর (Transfer)' : 'Transfer'}</option>
            <option value="loan_taken">{language === 'bn' ? 'ঋণ গ্রহণ (Loan Borrowed)' : 'Loan Borrowed'}</option>
            <option value="loan_given">{language === 'bn' ? 'ঋণ প্রদান (Loan Lent)' : 'Loan Lent'}</option>
            <option value="loan_repayment">{language === 'bn' ? 'ঋণ পরিশোধ (Loan Repay)' : 'Loan Repay'}</option>
            <option value="credit_card_payment">{language === 'bn' ? 'ক্রেডিট কার্ড বিল পরিশোধ' : 'Credit Card Payment'}</option>
          </select>

          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 focus:outline-none"
          >
            <option value="all">{language === 'bn' ? 'সকল অ্যাকাউন্ট (All Accounts)' : 'All Accounts'}</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 focus:outline-none"
          >
            <option value="all">{language === 'bn' ? 'সকল খাত (All Categories)' : 'All Categories'}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {language === 'bn' ? (c.nameBn || c.name) : (c.name || c.nameBn)}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Summary Mini-bar */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
          <span>{language === 'bn' ? 'মোট লেনদেন সংখ্যা:' : 'Total Transactions:'} <strong>{filteredTransactions.length}</strong></span>
          <div className="flex items-center gap-4">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              {language === 'bn' ? 'মোট আয়:' : 'Total Income:'} <PrivacyAmount amount={filteredIncome} />
            </span>
            <span className="text-rose-600 dark:text-rose-400 font-semibold">
              {language === 'bn' ? 'মোট খরচ:' : 'Total Expense:'} <PrivacyAmount amount={filteredExpense} />
            </span>
          </div>
        </div>

      </div>

      {/* Transactions Table / List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            {language === 'bn' ? 'কোনো ফিল্টারের সাথে লেনদেন মিলেনি।' : 'No transactions match the selected filters.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">{language === 'bn' ? 'তারিখ ও বিবরণ' : 'Date & Description'}</th>
                  <th className="px-4 py-3">{language === 'bn' ? 'অ্যাকাউন্ট' : 'Account'}</th>
                  <th className="px-4 py-3">{language === 'bn' ? 'খাত (Category)' : 'Category'}</th>
                  <th className="px-4 py-3">{language === 'bn' ? 'প্রাপক / প্রদানকারী' : 'Payee / Payer'}</th>
                  <th className="px-4 py-3 text-right">{language === 'bn' ? 'পরিমাণ (Amount)' : 'Amount'}</th>
                  <th className="px-4 py-3 text-center">{language === 'bn' ? 'রশিদ' : 'Receipt'}</th>
                  <th className="px-4 py-3 text-right">{language === 'bn' ? 'অ্যাকশন' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredTransactions.map((tx) => {
                  const acc = accounts.find((a) => a.id === tx.accountId);
                  const targetAcc = tx.targetAccountId ? accounts.find((a) => a.id === tx.targetAccountId) : null;
                  const cat = categories.find((c) => c.id === tx.categoryId);

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      
                      {/* Date & Description */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold flex-shrink-0 ${
                            tx.type === 'income'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                              : tx.type === 'expense'
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400'
                          }`}>
                            {tx.type === 'income' ? (
                              <ArrowDownLeft className="w-3.5 h-3.5" />
                            ) : tx.type === 'expense' ? (
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowLeftRight className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 dark:text-slate-200">
                              {tx.description || (cat ? (language === 'bn' ? (cat.nameBn || cat.name) : (cat.name || cat.nameBn)) : tx.type)}
                            </p>
                            <p className="text-[10px] text-slate-400">{tx.date}</p>
                          </div>
                        </div>
                      </td>

                      {/* Account */}
                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {acc ? acc.name : 'Unknown'}
                        </span>
                        {targetAcc && (
                          <span className="text-[10px] text-slate-400 block">
                            → {targetAcc.name}
                          </span>
                        )}
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                          {cat ? (language === 'bn' ? (cat.nameBn || cat.name) : (cat.name || cat.nameBn)) : tx.type}
                        </span>
                        {tx.subcategory && (
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {tx.subcategory}
                          </span>
                        )}
                      </td>

                      {/* Payee / Payer */}
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {tx.payerPayee || '—'}
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-3 text-right font-mono font-bold">
                        <span className={
                          tx.type === 'income'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : tx.type === 'expense'
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-blue-600 dark:text-blue-400'
                        }>
                          <PrivacyAmount 
                            amount={tx.amount} 
                            prefix={tx.type === 'income' ? `+${currencySymbol}` : tx.type === 'expense' ? `-${currencySymbol}` : currencySymbol}
                          />
                        </span>
                      </td>

                      {/* Receipt */}
                      <td className="px-4 py-3 text-center">
                        {tx.receiptUrl ? (
                          <button
                            onClick={() => setPreviewReceiptUrl(tx.receiptUrl || null)}
                            className="p-1 text-emerald-600 hover:text-emerald-700 rounded-md"
                            title={language === 'bn' ? 'রশিদ দেখুন' : 'View Receipt'}
                          >
                            <ImageIcon className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onEditTransaction(tx)}
                            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                            title={language === 'bn' ? 'সম্পাদনা' : 'Edit'}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={async () => {
                              const confirmMsg = language === 'bn' 
                                ? 'আপনি কি নিশ্চিত যে এই লেনদেনটি মুছতে চান? সংশ্লিষ্ট অ্যাকাউন্টের ব্যালেন্স পুনর্বহাল করা হবে।'
                                : 'Are you sure you want to delete this transaction? The corresponding account balance will be reverted.';
                              if (window.confirm(confirmMsg)) {
                                await deleteTransaction(tx.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                            title={language === 'bn' ? 'মুছে ফেলুন' : 'Delete'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Receipt Image Lightbox Preview Modal */}
      {previewReceiptUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
          <div className="relative max-w-xl max-h-[85vh] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl p-2 border border-slate-800">
            <button
              onClick={() => setPreviewReceiptUrl(null)}
              className="absolute top-4 right-4 p-2 bg-slate-800/80 text-white rounded-full hover:bg-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={previewReceiptUrl} alt="Receipt Voucher" className="max-h-[75vh] w-auto mx-auto rounded-xl object-contain" />
          </div>
        </div>
      )}

    </div>
  );
};
