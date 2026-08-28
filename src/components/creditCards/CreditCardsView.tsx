import React, { useState } from 'react';
import { 
  CreditCard, 
  Plus, 
  ArrowUpRight, 
  CheckCircle2, 
  Calendar, 
  AlertCircle, 
  ShieldCheck,
  X,
  Printer,
  FileSpreadsheet
} from 'lucide-react';
import { useFinance } from '../../context/FinancialContext';
import { PrivacyAmount } from '../common/PrivacyAmount';
import { Account } from '../../types';
import { generateCreditCardsReport } from '../../lib/reportGenerator';

export const CreditCardsView: React.FC = () => {
  const { accounts, payCreditCardBill, currencySymbol } = useFinance();

  const creditCardAccounts = accounts.filter((a) => a.type === 'credit_card');
  const [selectedCardForPayment, setSelectedCardForPayment] = useState<Account | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [payingAccountId, setPayingAccountId] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');

  const bankAccounts = accounts.filter((a) => a.type === 'bank' || a.type === 'cash' || a.type === 'wallet');

  const handlePrintReport = () => {
    const rep = generateCreditCardsReport(creditCardAccounts, currencySymbol);
    rep.print();
  };

  const handleDownloadCSV = () => {
    const rep = generateCreditCardsReport(creditCardAccounts, currencySymbol);
    rep.downloadCSV();
  };

  const handleOpenPayment = (card: Account) => {
    setSelectedCardForPayment(card);
    setPaymentAmount(String(Math.abs(card.balance)));
    setPayingAccountId(bankAccounts[0] ? bankAccounts[0].id : '');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setNotes('');
  };

  const handleExecutePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCardForPayment) return;
    const num = parseFloat(paymentAmount);
    if (isNaN(num) || num <= 0) return;

    await payCreditCardBill({
      creditCardAccountId: selectedCardForPayment.id,
      fromAccountId: payingAccountId,
      amount: num,
      date: paymentDate,
      notes,
    });

    setSelectedCardForPayment(null);
  };

  const totalOutstanding = creditCardAccounts.reduce((sum, a) => sum + (a.balance < 0 ? Math.abs(a.balance) : 0), 0);
  const totalLimit = creditCardAccounts.reduce((sum, a) => sum + (a.creditLimit || 0), 0);
  const totalAvailable = totalLimit - totalOutstanding;
  const overallUtilization = totalLimit > 0 ? Math.round((totalOutstanding / totalLimit) * 100) : 0;

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            ক্রেডিট কার্ড ব্যবস্থাপনা (Credit Cards Management)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            ক্রেডিট কার্ডের ব্যবহার সীমা, বিলিং সাইকেল, বকেয়া দেনা এবং এক ক্লিকে বিল পরিশোধ।
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrintReport}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold rounded-xl hover:bg-slate-800 transition-colors shadow-xs"
            title="ক্রেডিট কার্ড রিপোর্ট প্রিন্ট"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>রিপোর্ট প্রিন্ট</span>
          </button>

          <button
            onClick={handleDownloadCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors"
            title="CSV এক্সপোর্ট"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-xs text-slate-400 font-medium">মোট বকেয়া দেনা (Total Due)</span>
          <p className="text-xl font-bold text-rose-600 dark:text-rose-400 font-mono mt-1">
            <PrivacyAmount amount={totalOutstanding} />
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-xs text-slate-400 font-medium">মোট ক্রেডিট লিমিট</span>
          <p className="text-xl font-bold text-slate-900 dark:text-white font-mono mt-1">
            <PrivacyAmount amount={totalLimit} />
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-xs text-slate-400 font-medium">অবশিষ্ট ব্যবহারের সীমা</span>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-1">
            <PrivacyAmount amount={totalAvailable} />
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-xs text-slate-400 font-medium">সামগ্রিক ব্যবহার হার (Utilization)</span>
          <p className={`text-xl font-bold font-mono mt-1 ${overallUtilization > 50 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {overallUtilization}%
          </p>
        </div>
      </div>

      {/* Credit Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {creditCardAccounts.length === 0 ? (
          <div className="col-span-2 p-12 text-center text-slate-400 text-xs bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            কোনো ক্রেডিট কার্ড অ্যাকাউন্ট পাওয়া যায়নি। অ্যাকাউন্টস ট্যাব থেকে ক্রেডিট কার্ড যোগ করুন।
          </div>
        ) : (
          creditCardAccounts.map((card) => {
            const limit = card.creditLimit || 0;
            const due = card.balance < 0 ? Math.abs(card.balance) : 0;
            const available = limit - due;
            const utilization = limit > 0 ? Math.round((due / limit) * 100) : 0;

            return (
              <div
                key={card.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between relative overflow-hidden"
              >
                <div 
                  className="absolute top-0 left-0 right-0 h-1.5"
                  style={{ backgroundColor: card.color || '#8b5cf6' }}
                />

                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs"
                        style={{ backgroundColor: card.color || '#8b5cf6' }}
                      >
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          {card.name}
                        </h3>
                        <p className="text-xs text-slate-400">
                          {card.institutionName || 'Credit Card'}
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-mono text-slate-400 font-semibold">
                      {card.accountNumber || '**** ****'}
                    </span>
                  </div>

                  {/* Limit & Due Gauge */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">বর্তমান বকেয়া দেনা:</span>
                      <span className="font-bold font-mono text-rose-600 dark:text-rose-400">
                        <PrivacyAmount amount={due} />
                      </span>
                    </div>

                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">মোট ক্রেডিট সীমা:</span>
                      <span className="font-semibold font-mono text-slate-800 dark:text-slate-200">
                        <PrivacyAmount amount={limit} />
                      </span>
                    </div>

                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">অবশিষ্ট সীমা:</span>
                      <span className="font-semibold font-mono text-emerald-600 dark:text-emerald-400">
                        <PrivacyAmount amount={available} />
                      </span>
                    </div>

                    {/* Progress */}
                    <div className="pt-1">
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                        <span>ব্যবহার: {utilization}%</span>
                        <span>{utilization > 70 ? 'সতর্কতা: উচ্চ ব্যবহার' : 'নিরাপদ সীমা'}</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            utilization > 70 ? 'bg-rose-500' : utilization > 40 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, utilization)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Billing Dates */}
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>বিল তৈরির দিন: <strong>প্রতি মাসের {card.billingDate || 1} তারিখ</strong></span>
                    </div>
                    <div>
                      <span>পরিশোধের শেষ দিন: <strong className="text-rose-600">{card.dueDate || 15} তারিখ</strong></span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      const rep = generateCreditCardsReport([card], currencySymbol);
                      rep.print();
                    }}
                    className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="এই কার্ডের স্টেটমেন্ট প্রিন্ট"
                  >
                    <Printer className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleOpenPayment(card)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>কার্ড বিল পরিশোধ করুন (Pay Bill)</span>
                  </button>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Pay Credit Card Bill Modal */}
      {selectedCardForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-purple-50 dark:bg-purple-950/40">
              <div>
                <h3 className="text-sm font-bold text-purple-900 dark:text-purple-200">
                  ক্রেডিট কার্ড বিল পরিশোধ
                </h3>
                <p className="text-xs text-purple-700 dark:text-purple-300">
                  {selectedCardForPayment.name} (বকেয়া: {currencySymbol}{Math.abs(selectedCardForPayment.balance ?? 0).toLocaleString()})
                </p>
              </div>
              <button
                onClick={() => setSelectedCardForPayment(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecutePayment} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  পরিশোধের পরিমাণ ({currencySymbol}) *
                </label>
                <input
                  type="number"
                  required
                  step="any"
                  value={paymentAmount !== undefined && paymentAmount !== null ? paymentAmount : ''}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 font-mono font-bold text-base bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  কোন ব্যাংক/নগদ অ্যাকাউন্ট থেকে পরিশোধ করবেন? *
                </label>
                <select
                  required
                  value={payingAccountId || ''}
                  onChange={(e) => setPayingAccountId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                >
                  {bankAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} (ব্যালেন্স: {currencySymbol}{(a.balance ?? 0).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  তারিখ *
                </label>
                <input
                  type="date"
                  required
                  value={paymentDate || ''}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  নোট বা রেফারেন্স
                </label>
                <input
                  type="text"
                  placeholder="যেমন: Full statement bill payment"
                  value={notes || ''}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedCardForPayment(null)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-colors shadow-sm"
                >
                  বিল পরিশোধ সম্পন্ন করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
