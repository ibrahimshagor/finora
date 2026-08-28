import React, { useState, useRef } from 'react';
import { 
  Scale, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ArrowRight, 
  ShieldCheck,
  Edit2,
  HelpCircle,
  FileSpreadsheet,
  Printer,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import { useFinance } from '../../context/FinancialContext';
import { PrivacyAmount } from '../common/PrivacyAmount';
import { Account } from '../../types';
import { generateAccountReport } from '../../lib/reportGenerator';

export const ReconciliationView: React.FC = () => {
  const { accounts, transactions, addTransaction, currencySymbol } = useFinance();

  const [selectedAccId, setSelectedAccId] = useState<string>(accounts[0]?.id || '');
  const [actualBalanceInput, setActualBalanceInput] = useState<string>('');
  const [reconcileSuccess, setReconcileSuccess] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState<boolean>(true);

  const auditSectionRef = useRef<HTMLDivElement>(null);

  const selectedAccount = accounts.find((a) => a.id === selectedAccId) || accounts[0];
  const recordedBalance = selectedAccount ? (selectedAccount.balance ?? 0) : 0;
  const actualBalance = actualBalanceInput !== '' ? parseFloat(actualBalanceInput) || 0 : recordedBalance;
  const discrepancy = actualBalance - recordedBalance;

  const handleSelectAccountForAudit = (accId: string) => {
    setSelectedAccId(accId);
    setActualBalanceInput('');
    setReconcileSuccess(null);
    // Smooth scroll to top audit form
    auditSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleReconcile = async () => {
    if (!selectedAccount || isNaN(discrepancy) || discrepancy === 0) return;

    if (discrepancy > 0) {
      await addTransaction({
        date: new Date().toISOString().split('T')[0],
        type: 'income',
        amount: discrepancy,
        accountId: selectedAccount.id,
        categoryId: 'cat_inc_other',
        description: `ব্যালেন্স রিকনসিলিয়েশন সমন্বয় (Reconciliation Adjustment +${discrepancy})`,
        isReconciled: true,
      });
    } else {
      await addTransaction({
        date: new Date().toISOString().split('T')[0],
        type: 'expense',
        amount: Math.abs(discrepancy),
        accountId: selectedAccount.id,
        categoryId: 'cat_exp_other',
        description: `ব্যালেন্স রিকনসিলিয়েশন সমন্বয় (Reconciliation Adjustment -${Math.abs(discrepancy)})`,
        isReconciled: true,
      });
    }

    setReconcileSuccess(`"${selectedAccount.name}" অ্যাকাউন্টের ব্যালেন্স সফলভাবে ${currencySymbol}${Number(actualBalance || 0).toLocaleString()} এ সমন্বয় ও হালনাগাদ করা হয়েছে।`);
    setActualBalanceInput('');
    setTimeout(() => setReconcileSuccess(null), 6000);
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Scale className="w-5 h-5 text-emerald-600" />
          <span>হিসাব সমন্বয় ও অডিট (Account Reconciliation)</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          বাস্তব ব্যাংক স্টেটমেন্ট বা ক্যাশের সাথে ফিনোরা অ্যাপের রেকর্ডের অমিল পরীক্ষা, অডিট ও স্বয়ংক্রিয় সমন্বয় করুন।
        </p>
      </div>

      {/* Educational Explanatory Box (User Guidance) */}
      <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/80 rounded-2xl p-5 shadow-2xs">
        <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowExplanation(!showExplanation)}>
          <div className="flex items-center gap-2.5">
            <Info className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
              রিকনসিলিয়েশন (Reconciliation) কী এবং এটি কীভাবে কাজ করে?
            </h3>
          </div>
          <button className="text-emerald-700 dark:text-emerald-300 p-1">
            {showExplanation ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {showExplanation && (
          <div className="mt-3 text-xs text-emerald-900 dark:text-emerald-200/90 leading-relaxed space-y-2 border-t border-emerald-200/60 dark:border-emerald-800/60 pt-3">
            <p>
              <strong>উদ্দেশ্য:</strong> বাস্তব জীবনে আপনার ব্যাংক একাউন্ট, বিকাশ, নগদ বা ক্যাশ ড্রয়ারে প্রকৃতপক্ষে যত টাকা আছে, তার সাথে অ্যাপের ব্যালেন্স মিলিয়ে নেওয়াকে <em>রিকনসিলিয়েশন</em> বলে।
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-[11px]">
              <div className="bg-white/80 dark:bg-slate-900/60 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900">
                <strong className="block text-emerald-700 dark:text-emerald-300 mb-0.5">১. অ্যাকাউন্ট নির্বাচন:</strong>
                নিচের তালিকা থেকে যেকোনো অ্যাকাউন্টের <em>'পরীক্ষা ও অডিট'</em> বাটনে চাপুন।
              </div>
              <div className="bg-white/80 dark:bg-slate-900/60 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900">
                <strong className="block text-emerald-700 dark:text-emerald-300 mb-0.5">২. বাস্তব ব্যালেন্স ইনপুট:</strong>
                ব্যাংকের স্টেটমেন্ট বা বিকাশ অ্যাপে যা ব্যালেন্স দেখতে পাচ্ছেন, সেটি লিখুন।
              </div>
              <div className="bg-white/80 dark:bg-slate-900/60 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900">
                <strong className="block text-emerald-700 dark:text-emerald-300 mb-0.5">৩. স্বয়ংক্রিয় ব্যালেন্স ফিক্স:</strong>
                পার্থক্য থাকলে <em>'স্বয়ংক্রিয় সমন্বয় করুন'</em> চাপলে ফিনোরা একটি অ্যাডজাস্টমেন্ট এন্ট্রি দিয়ে হিসাব সমান করে দেবে।
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Reconciliation Audit Workbench */}
      <div ref={auditSectionRef} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              অডিট করার অ্যাকাউন্ট নির্বাচন করুন:
            </label>
            <select
              value={selectedAccId}
              onChange={(e) => {
                setSelectedAccId(e.target.value);
                setActualBalanceInput('');
                setReconcileSuccess(null);
              }}
              className="w-full sm:w-80 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.type.toUpperCase()}) - ব্যালেন্স: {currencySymbol}{(acc.balance ?? 0).toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          {selectedAccount && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const rep = generateAccountReport(selectedAccount, transactions, currencySymbol);
                  rep.print();
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors"
                title="স্টেটমেন্ট প্রিন্ট"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>স্টেটমেন্ট রিপোর্ট</span>
              </button>
            </div>
          )}
        </div>

        {selectedAccount && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            
            {/* App Recorded Balance */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-[11px] text-slate-400 font-medium block">অ্যাপে রেকর্ডকৃত ব্যালেন্স</span>
              <p className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                <PrivacyAmount amount={recordedBalance} />
              </p>
            </div>

            {/* Actual Statement Input */}
            <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-800">
              <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-bold block">
                বাস্তব / ব্যাংক স্টেটমেন্ট ব্যালেন্স (টাইপ করুন)
              </span>
              <div className="mt-1 flex items-center gap-1">
                <span className="text-sm font-bold text-emerald-600">{currencySymbol}</span>
                <input
                  type="number"
                  placeholder={String(recordedBalance)}
                  value={actualBalanceInput}
                  onChange={(e) => setActualBalanceInput(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-lg px-2.5 py-1 text-base font-bold font-mono text-emerald-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Difference Calculation */}
            <div className={`p-4 rounded-xl border ${
              discrepancy === 0 
                ? 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700' 
                : discrepancy > 0 
                ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300' 
                : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-300'
            }`}>
              <span className="text-[11px] text-slate-400 font-medium block">পার্থক্য / অমিল (Discrepancy)</span>
              <p className={`text-xl font-bold font-mono mt-1 ${
                discrepancy === 0 ? 'text-slate-700 dark:text-slate-300' : discrepancy > 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                {discrepancy === 0 ? '০ (কোনো অমিল নেই)' : discrepancy > 0 ? `+${currencySymbol}${Number(discrepancy || 0).toLocaleString()}` : `${currencySymbol}${Number(discrepancy || 0).toLocaleString()}`}
              </p>
            </div>

          </div>
        )}

        {/* Action button */}
        {discrepancy !== 0 && (
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-amber-50/50 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-200 dark:border-amber-800">
            <div>
              <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                {discrepancy > 0 ? `অ্যাকাউন্টে ${currencySymbol}${discrepancy.toLocaleString()} টাকা কম দেখানো আছে।` : `অ্যাকাউন্টে ${currencySymbol}${Math.abs(discrepancy).toLocaleString()} টাকা বেশি দেখানো আছে।`}
              </p>
              <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                সমন্বয় বোতামে চাপলে স্বয়ংক্রিয় সমন্বয় এন্ট্রি হয়ে ব্যালেন্স ঠিক হয়ে যাবে।
              </p>
            </div>

            <button
              type="button"
              onClick={handleReconcile}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs active:scale-95 whitespace-nowrap"
            >
              স্বয়ংক্রিয় সমন্বয় করুন (Reconcile Now)
            </button>
          </div>
        )}

        {reconcileSuccess && (
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2 border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{reconcileSuccess}</span>
          </div>
        )}

      </div>

      {/* Account Verification Checklist */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>সকল অ্যাকাউন্টের স্থিতিপত্র অডিট ও অ্যাকশন</span>
          </h3>
          <span className="text-xs text-slate-400">মোট {accounts.length} টি অ্যাকাউন্ট</span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {accounts.map((acc) => {
            const isCurrentlySelected = selectedAccount?.id === acc.id;
            return (
              <div key={acc.id} className={`py-3.5 px-3 rounded-xl transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isCurrentlySelected ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/60' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-900 dark:text-slate-100">{acc.name}</p>
                    {isCurrentlySelected && (
                      <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold rounded-md">
                        বর্তমানে সক্রিয়
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 uppercase mt-0.5">
                    {acc.type} • {acc.institutionName || 'Self'} {acc.accountNumber ? `• (${acc.accountNumber})` : ''}
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block sm:hidden">রেকর্ড ব্যালেন্স:</span>
                    <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                      <PrivacyAmount amount={acc.balance} />
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectAccountForAudit(acc.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs ${
                        isCurrentlySelected
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      পরীক্ষা ও অডিট
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const rep = generateAccountReport(acc, transactions, currencySymbol);
                        rep.print();
                      }}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300 transition-colors"
                      title={`${acc.name} এর স্টেটমেন্ট রিপোর্ট প্রিন্ট`}
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
