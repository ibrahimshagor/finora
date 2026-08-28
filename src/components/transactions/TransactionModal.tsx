import React, { useState, useEffect } from 'react';
import { 
  X, 
  ArrowDownLeft, 
  ArrowUpRight, 
  ArrowLeftRight, 
  Calculator, 
  Calendar, 
  Tag, 
  CreditCard, 
  User, 
  FileText, 
  Paperclip,
  Check,
  Building
} from 'lucide-react';
import { useFinance } from '../../context/FinancialContext';
import { TransactionType, Transaction } from '../../types';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: TransactionType;
  defaultAccountId?: string;
  editingTransaction?: Transaction | null;
  onOpenCalculator: (onApply: (val: number) => void) => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  initialType = 'expense',
  defaultAccountId,
  editingTransaction,
  onOpenCalculator,
}) => {
  const { 
    accounts, 
    categories, 
    addTransaction, 
    updateTransaction, 
    transferFunds, 
    currencySymbol,
    language
  } = useFinance();

  const [type, setType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState<number | string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [accountId, setAccountId] = useState<string>('');
  const [targetAccountId, setTargetAccountId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [subcategory, setSubcategory] = useState<string>('');
  const [payerPayee, setPayerPayee] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [receiptUrl, setReceiptUrl] = useState<string>('');
  const [receiptFileName, setReceiptFileName] = useState<string>('');

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type || 'expense');
      setAmount(editingTransaction.amount !== undefined && editingTransaction.amount !== null ? editingTransaction.amount : '');
      setDate(editingTransaction.date || new Date().toISOString().split('T')[0]);
      setAccountId(editingTransaction.accountId || '');
      setTargetAccountId(editingTransaction.targetAccountId || '');
      setCategoryId(editingTransaction.categoryId || '');
      setSubcategory(editingTransaction.subcategory || '');
      setPayerPayee(editingTransaction.payerPayee || '');
      setDescription(editingTransaction.description || '');
      setNotes(editingTransaction.notes || '');
      setReceiptUrl(editingTransaction.receiptUrl || '');
    } else {
      setType(initialType);
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      
      const availableAccs = accounts.filter((a) => !a.isHidden);
      const defaultAcc = defaultAccountId 
        ? accounts.find((a) => a.id === defaultAccountId) 
        : availableAccs[0];

      setAccountId(defaultAcc ? defaultAcc.id : '');
      setTargetAccountId(availableAccs[1] ? availableAccs[1].id : '');

      const initialCats = categories.filter((c) => c.type === (initialType === 'income' ? 'income' : 'expense'));
      if (initialCats.length > 0) {
        setCategoryId(initialCats[0].id);
        setSubcategory(initialCats[0].subcategories[0] || '');
      } else {
        setCategoryId('');
        setSubcategory('');
      }
      setPayerPayee('');
      setDescription('');
      setNotes('');
      setReceiptUrl('');
      setReceiptFileName('');
    }
  }, [editingTransaction, initialType, defaultAccountId, accounts, categories, isOpen]);

  // Update categories when type changes
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    if (newType === 'income' || newType === 'expense') {
      const matchCats = categories.filter((c) => c.type === newType);
      if (matchCats.length > 0) {
        setCategoryId(matchCats[0].id);
        setSubcategory(matchCats[0].subcategories[0] || '');
      }
    }
  };

  const handleCategorySelect = (catId: string) => {
    setCategoryId(catId);
    const cat = categories.find((c) => c.id === catId);
    if (cat && cat.subcategories && cat.subcategories.length > 0) {
      setSubcategory(cat.subcategories[0]);
    } else {
      setSubcategory('');
    }
  };

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenCalc = () => {
    onOpenCalculator((calculatedVal: number) => {
      setAmount(calculatedVal);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert(language === 'bn' ? 'সঠিক টাকার পরিমাণ প্রদান করুন।' : 'Please enter a valid positive amount.');
      return;
    }

    if (!accountId) {
      alert(language === 'bn' ? 'অনুগ্রহ করে একটি অ্যাকাউন্ট নির্বাচন করুন।' : 'Please select an account.');
      return;
    }

    if (type === 'transfer') {
      if (!targetAccountId || accountId === targetAccountId) {
        alert(language === 'bn' ? 'স্থানান্তরের জন্য ভিন্ন একটি গন্তব্য অ্যাকাউন্ট নির্বাচন করুন।' : 'Please select a different destination account.');
        return;
      }

      await transferFunds({
        fromAccountId: accountId,
        toAccountId: targetAccountId,
        amount: numAmount,
        date,
        description: description || (language === 'bn' ? 'অ্যাকাউন্ট স্থানান্তর' : 'Account Transfer'),
        notes,
      });
    } else if (editingTransaction) {
      await updateTransaction(editingTransaction.id, {
        type,
        amount: numAmount,
        date,
        accountId,
        targetAccountId: type === 'transfer' ? targetAccountId : undefined,
        categoryId: type !== 'transfer' ? categoryId : undefined,
        subcategory: type !== 'transfer' ? subcategory : undefined,
        payerPayee,
        description,
        notes,
        receiptUrl,
      });
    } else {
      await addTransaction({
        type,
        amount: numAmount,
        date,
        accountId,
        targetAccountId: type === 'transfer' ? targetAccountId : undefined,
        categoryId: type !== 'transfer' ? categoryId : undefined,
        subcategory: type !== 'transfer' ? subcategory : undefined,
        payerPayee,
        description,
        notes,
        receiptUrl,
      });
    }

    onClose();
  };

  if (!isOpen) return null;

  const relevantCategories = categories.filter((c) => 
    type === 'income' ? c.type === 'income' : c.type === 'expense'
  );

  const selectedCategoryObj = categories.find((c) => c.id === categoryId);

  return (
    <div
      id="transaction-modal-container"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
    >
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6 animate-in fade-in zoom-in duration-150">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {editingTransaction 
              ? (language === 'bn' ? 'লেনদেন সম্পাদনা করুন' : 'Edit Transaction') 
              : (language === 'bn' ? 'নতুন আর্থিক লেনদেন লিপিবদ্ধ করুন' : 'Add New Transaction')}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          {/* Transaction Type Segmented Switcher */}
          {!editingTransaction && (
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => handleTypeChange('expense')}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-lg font-semibold transition-all ${
                  type === 'expense'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>{language === 'bn' ? 'খরচ (Expense)' : 'Expense'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('income')}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-lg font-semibold transition-all ${
                  type === 'income'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ArrowDownLeft className="w-3.5 h-3.5" />
                <span>{language === 'bn' ? 'আয় (Income)' : 'Income'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('transfer')}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-lg font-semibold transition-all ${
                  type === 'transfer'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>{language === 'bn' ? 'স্থানান্তর (Transfer)' : 'Transfer'}</span>
              </button>
            </div>
          )}

          {/* Amount Field with Calculator Trigger */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {language === 'bn' ? `টাকার পরিমাণ (${currencySymbol}) *` : `Amount (${currencySymbol}) *`}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-sm font-bold text-slate-400 font-mono">
                {currencySymbol}
              </span>
              <input
                type="number"
                step="any"
                required
                placeholder="0.00"
                value={amount !== undefined && amount !== null ? amount : ''}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-12 py-2.5 text-base font-bold font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={handleOpenCalc}
                className="absolute right-2 top-2 p-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-emerald-100 hover:text-emerald-700 dark:hover:bg-emerald-950/60 dark:hover:text-emerald-300 text-slate-600 dark:text-slate-300 rounded-lg transition-colors"
                title={language === 'bn' ? 'ক্যালকুলেটর খুলুন' : 'Open Calculator'}
              >
                <Calculator className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Account Selection */}
          {type === 'transfer' ? (
            <div className="grid grid-cols-2 gap-3 p-3 bg-blue-50/40 dark:bg-blue-950/20 rounded-xl border border-blue-200/60 dark:border-blue-800/60">
              <div>
                <label className="block font-semibold text-blue-900 dark:text-blue-300 mb-1">
                  {language === 'bn' ? 'উৎস অ্যাকাউন্ট (From) *' : 'From Account *'}
                </label>
                <select
                  required
                  value={accountId || ''}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full px-2.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({currencySymbol}{(a.balance ?? 0).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-blue-900 dark:text-blue-300 mb-1">
                  {language === 'bn' ? 'গন্তব্য অ্যাকাউন্ট (To) *' : 'To Account *'}
                </label>
                <select
                  required
                  value={targetAccountId || ''}
                  onChange={(e) => setTargetAccountId(e.target.value)}
                  className="w-full px-2.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                >
                  {accounts
                    .filter((a) => a.id !== accountId)
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({currencySymbol}{(a.balance ?? 0).toLocaleString()})
                      </option>
                    ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'bn' ? 'অ্যাকাউন্ট (Account) *' : 'Account *'}
                </label>
                <select
                  required
                  value={accountId || ''}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({currencySymbol}{(a.balance ?? 0).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'bn' ? 'তারিখ (Date) *' : 'Date *'}
                </label>
                <input
                  type="date"
                  required
                  value={date || ''}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          {/* Category & Subcategory Selection for Income / Expense */}
          {type !== 'transfer' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'bn' ? 'খাত / ক্যাটাগরি (Category) *' : 'Category *'}
                </label>
                <select
                  required
                  value={categoryId || ''}
                  onChange={(e) => handleCategorySelect(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {relevantCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {language === 'bn' ? (c.nameBn || c.name) : (c.name || c.nameBn)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'bn' ? 'উপ-খাত (Subcategory)' : 'Subcategory'}
                </label>
                {selectedCategoryObj && selectedCategoryObj.subcategories && selectedCategoryObj.subcategories.length > 0 ? (
                  <select
                    value={subcategory || ''}
                    onChange={(e) => setSubcategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {selectedCategoryObj.subcategories.map((sub, i) => (
                      <option key={i} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder={language === 'bn' ? 'সাব-ক্যাটাগরি' : 'Subcategory'}
                    value={subcategory || ''}
                    onChange={(e) => setSubcategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                  />
                )}
              </div>
            </div>
          )}

          {/* Description & Payee */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'bn' ? 'বিবরণ (Short Description)' : 'Short Description'}
              </label>
              <input
                type="text"
                placeholder={language === 'bn' ? 'যেমন: Weekly bazaar at Shwapno' : 'e.g., Weekly groceries'}
                value={description || ''}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {type === 'income' 
                  ? (language === 'bn' ? 'প্রদানকারী (Payer)' : 'Payer') 
                  : (language === 'bn' ? 'প্রাপক / প্রতিষ্ঠান (Payee / Shop)' : 'Payee / Shop')}
              </label>
              <input
                type="text"
                placeholder={language === 'bn' ? 'যেমন: Shwapno, Employer, Friend' : 'e.g., Shwapno, Employer, Friend'}
                value={payerPayee || ''}
                onChange={(e) => setPayerPayee(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Receipt / Invoice Upload */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {language === 'bn' ? 'রশিদ / ইনভয়েস ভাউচার (Receipt / Invoice Attachment)' : 'Receipt / Invoice Attachment'}
            </label>
            <div className="flex items-center gap-3">
              <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer hover:border-emerald-500 transition-colors bg-slate-50 dark:bg-slate-800/40">
                <Paperclip className="w-4 h-4 text-slate-400" />
                <span className="text-slate-600 dark:text-slate-400 text-xs truncate">
                  {receiptFileName || (language === 'bn' ? 'রশিদের ছবি সিলেক্ট করুন (Upload Receipt Image)' : 'Select receipt image')}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleReceiptUpload}
                  className="hidden"
                />
              </label>

              {receiptUrl && (
                <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 flex-shrink-0">
                  <img src={receiptUrl} alt="Receipt Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {language === 'bn' ? 'অতিরিক্ত নোট (Optional Notes)' : 'Optional Notes'}
            </label>
            <textarea
              rows={2}
              placeholder={language === 'bn' ? 'যেকোনো প্রয়োজনীয় মন্তব্য বা ট্যাগ...' : 'Add any notes...'}
              value={notes || ''}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Submit Actions */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-semibold transition-colors"
            >
              {language === 'bn' ? 'বাতিল' : 'Cancel'}
            </button>
            <button
              id="submit-transaction-btn"
              type="submit"
              className={`px-5 py-2 text-white font-semibold rounded-xl transition-colors shadow-sm ${
                type === 'income'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : type === 'expense'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {editingTransaction 
                ? (language === 'bn' ? 'পরিবর্তন সংরক্ষণ করুন' : 'Save Changes') 
                : (language === 'bn' ? 'লেনদেন নিশ্চিত করুন' : 'Confirm Transaction')}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
