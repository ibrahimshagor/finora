import React, { useState } from 'react';
import { 
  Plus, 
  Handshake, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Trash2, 
  Phone, 
  Calendar, 
  X,
  Clock,
  Printer,
  FileSpreadsheet
} from 'lucide-react';
import { useFinance } from '../../context/FinancialContext';
import { PrivacyAmount } from '../common/PrivacyAmount';
import { Loan } from '../../types';
import { generateLoansReport } from '../../lib/reportGenerator';

export const LoansView: React.FC = () => {
  const { 
    loans, 
    accounts, 
    addLoan, 
    repayBorrowedLoan, 
    collectLentLoan, 
    deleteLoan, 
    currencySymbol 
  } = useFinance();

  const [activeTab, setActiveTab] = useState<'borrowed' | 'lent'>('borrowed');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'settled'>('active');
  const [showAddModal, setShowAddModal] = useState(false);
  const [repayModalLoan, setRepayModalLoan] = useState<Loan | null>(null);
  const [collectModalLoan, setCollectModalLoan] = useState<Loan | null>(null);

  // Form State for Adding Loan
  const [formData, setFormData] = useState({
    type: 'borrowed' as 'borrowed' | 'lent',
    personName: '',
    contactInfo: '',
    totalAmount: '',
    targetAccountId: '',
    startDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    interestRate: '',
    notes: '',
  });

  // Action Form State for Repayment / Collection
  const [actionAmount, setActionAmount] = useState<string>('');
  const [actionAccountId, setActionAccountId] = useState<string>('');
  const [actionDate, setActionDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [actionNotes, setActionNotes] = useState<string>('');

  const handleOpenAdd = (defaultType: 'borrowed' | 'lent') => {
    const availableAccs = accounts.filter((a) => !a.isHidden);
    setFormData({
      type: defaultType,
      personName: '',
      contactInfo: '',
      totalAmount: '',
      targetAccountId: availableAccs[0] ? availableAccs[0].id : '',
      startDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      interestRate: '',
      notes: '',
    });
    setShowAddModal(true);
  };

  const handleSubmitAddLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(formData.totalAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('সঠিক টাকার পরিমাণ প্রদান করুন।');
      return;
    }
    if (!formData.targetAccountId) {
      alert('অনুগ্রহ করে একটি অ্যাকাউন্ট নির্বাচন করুন।');
      return;
    }

    await addLoan({
      type: formData.type,
      personName: formData.personName,
      contactInfo: formData.contactInfo,
      totalAmount: numAmount,
      targetAccountId: formData.targetAccountId,
      startDate: formData.startDate,
      dueDate: formData.dueDate || undefined,
      interestRate: formData.interestRate ? parseFloat(formData.interestRate) : undefined,
      notes: formData.notes,
    });

    setShowAddModal(false);
  };

  const handleOpenRepay = (loan: Loan) => {
    setRepayModalLoan(loan);
    setActionAmount(String(loan.remainingAmount));
    const availableAccs = accounts.filter((a) => !a.isHidden);
    setActionAccountId(availableAccs[0] ? availableAccs[0].id : '');
    setActionDate(new Date().toISOString().split('T')[0]);
    setActionNotes('');
  };

  const handleOpenCollect = (loan: Loan) => {
    setCollectModalLoan(loan);
    setActionAmount(String(loan.remainingAmount));
    const availableAccs = accounts.filter((a) => !a.isHidden);
    setActionAccountId(availableAccs[0] ? availableAccs[0].id : '');
    setActionDate(new Date().toISOString().split('T')[0]);
    setActionNotes('');
  };

  const handleExecuteRepay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repayModalLoan) return;
    const numAmount = parseFloat(actionAmount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    await repayBorrowedLoan({
      loanId: repayModalLoan.id,
      amount: numAmount,
      fromAccountId: actionAccountId,
      date: actionDate,
      notes: actionNotes,
    });

    setRepayModalLoan(null);
  };

  const handleExecuteCollect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectModalLoan) return;
    const numAmount = parseFloat(actionAmount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    await collectLentLoan({
      loanId: collectModalLoan.id,
      amount: numAmount,
      toAccountId: actionAccountId,
      date: actionDate,
      notes: actionNotes,
    });

    setCollectModalLoan(null);
  };

  const filteredLoans = loans.filter((l) => {
    if (l.type !== activeTab) return false;
    if (statusFilter !== 'all' && l.status !== statusFilter) return false;
    return true;
  });

  const totalBorrowedOwed = loans
    .filter((l) => l.type === 'borrowed' && l.status === 'active')
    .reduce((sum, l) => sum + l.remainingAmount, 0);

  const totalLentReceivable = loans
    .filter((l) => l.type === 'lent' && l.status === 'active')
    .reduce((sum, l) => sum + l.remainingAmount, 0);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Title & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            ঋণ ও দেনা-পাওনা হাব (Loans & Debts)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            কার থেকে কত টাকা ধার নিয়েছেন বা কাকে কত টাকা ধার দিয়েছেন—তার নির্ভুল হিসাব।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              const rep = generateLoansReport(loans, currencySymbol);
              rep.print();
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold rounded-xl hover:bg-slate-800 transition-colors shadow-xs"
            title="সকল ঋণ ও দেনা-পাওনার রিপোর্ট প্রিন্ট"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>ঋণ রিপোর্ট প্রিন্ট</span>
          </button>

          <button
            onClick={() => {
              const rep = generateLoansReport(loans, currencySymbol);
              rep.downloadCSV();
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors"
            title="CSV এক্সপোর্ট"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>

          <button
            onClick={() => handleOpenAdd('borrowed')}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 dark:text-rose-300 text-xs font-semibold rounded-xl border border-rose-200 dark:border-rose-800 transition-colors"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>ঋণ নিয়েছি (Borrowed)</span>
          </button>

          <button
            onClick={() => handleOpenAdd('lent')}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
          >
            <Handshake className="w-4 h-4" />
            <span>ঋণ দিয়েছি (Lent)</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs text-rose-600 dark:text-rose-400 font-semibold uppercase tracking-wider">
              দেনা / ঋণ পরিশোধ বাকি (Total Payable Liability)
            </span>
            <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono mt-1">
              <PrivacyAmount amount={totalBorrowedOwed} />
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider">
              পাওনা / ঋণ আদায় বাকি (Total Receivable Asset)
            </span>
            <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono mt-1">
              <PrivacyAmount amount={totalLentReceivable} />
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600">
            <Handshake className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Primary Tab Switcher */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('borrowed')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'borrowed'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>ঋণ গ্রহণ (Borrowed / Liabilities)</span>
          </button>

          <button
            onClick={() => setActiveTab('lent')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'lent'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Handshake className="w-3.5 h-3.5" />
            <span>ঋণ প্রদান (Lent / Receivables)</span>
          </button>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 focus:outline-none"
        >
          <option value="active">সক্রিয় (Active)</option>
          <option value="settled">পরিশোধিত (Settled)</option>
          <option value="all">সব (All)</option>
        </select>
      </div>

      {/* Loans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredLoans.length === 0 ? (
          <div className="col-span-2 p-12 text-center text-slate-400 text-xs bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            কোনো ঋণ রেকর্ড পাওয়া যায়নি।
          </div>
        ) : (
          filteredLoans.map((loan) => {
            const pct = Math.min(100, Math.round((loan.paidAmount / loan.totalAmount) * 100));

            return (
              <div
                key={loan.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {loan.personName}
                      </h3>
                      {loan.contactInfo && (
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" />
                          {loan.contactInfo}
                        </p>
                      )}
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                      loan.status === 'settled'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}>
                      {loan.status === 'settled' ? 'পরিশোধিত (Settled)' : 'বাকি আছে (Active)'}
                    </span>
                  </div>

                  {/* Amounts */}
                  <div className="grid grid-cols-3 gap-2 my-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">মোট ঋণ</span>
                      <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                        <PrivacyAmount amount={loan.totalAmount} />
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">পরিশোধ/আদায়</span>
                      <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        <PrivacyAmount amount={loan.paidAmount} />
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">অবশিষ্ট বাকি</span>
                      <span className="font-bold font-mono text-rose-600 dark:text-rose-400">
                        <PrivacyAmount amount={loan.remainingAmount} />
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1 my-2">
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>পরিশোধের অগ্রগতি</span>
                      <span className="font-semibold">{pct}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          loan.type === 'borrowed' ? 'bg-rose-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {loan.dueDate && (
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-2">
                      <Calendar className="w-3 h-3" />
                      <span>পরিশোধের শেষ সময়: {loan.dueDate}</span>
                    </p>
                  )}

                  {loan.notes && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg italic">
                      "{loan.notes}"
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      const rep = generateLoansReport([loan], currencySymbol);
                      rep.print();
                    }}
                    className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="এই ঋণের স্লিপ / রিপোর্ট প্রিন্ট"
                  >
                    <Printer className="w-4 h-4" />
                  </button>

                  <button
                    onClick={async () => {
                      if (window.confirm('আপনি কি নিশ্চিত যে এই ঋণের রেকর্ডটি মুছতে চান?')) {
                        await deleteLoan(loan.id);
                      }
                    }}
                    className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="রেকর্ড মুছুন"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {loan.status === 'active' && loan.remainingAmount > 0 && (
                    loan.type === 'borrowed' ? (
                      <button
                        onClick={() => handleOpenRepay(loan)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        <span>কিস্তি / ঋণ পরিশোধ করুন</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenCollect(loan)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
                      >
                        <ArrowDownLeft className="w-3.5 h-3.5" />
                        <span>টাকা আদায় গ্রহণ করুন</span>
                      </button>
                    )
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Add Loan Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {formData.type === 'borrowed' ? 'নতুন ঋণ গ্রহণ (Borrowed Loan)' : 'নতুন ঋণ প্রদান (Lent Loan)'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitAddLoan} className="p-6 space-y-3.5 text-xs">
              
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'borrowed' })}
                  className={`py-1.5 rounded-lg font-semibold transition-all ${
                    formData.type === 'borrowed' ? 'bg-rose-600 text-white' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  ঋণ নিয়েছি (Borrowed)
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'lent' })}
                  className={`py-1.5 rounded-lg font-semibold transition-all ${
                    formData.type === 'lent' ? 'bg-emerald-600 text-white' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  ঋণ দিয়েছি (Lent)
                </button>
              </div>

              {/* Person Name */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ব্যক্তি / প্রতিষ্ঠানের নাম (Person / Lender / Borrower Name) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: Mr. Rafiqul Islam, Tanvir Ahmed"
                  value={formData.personName || ''}
                  onChange={(e) => setFormData({ ...formData, personName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Contact Info & Amount */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    মোবাইল নম্বর
                  </label>
                  <input
                    type="text"
                    placeholder="017xxxxxxxx"
                    value={formData.contactInfo || ''}
                    onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    টাকার পরিমাণ ({currencySymbol}) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="50000"
                    value={formData.totalAmount !== undefined && formData.totalAmount !== null ? formData.totalAmount : ''}
                    onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                    className="w-full px-3 py-2 font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              {/* Connected Account */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {formData.type === 'borrowed' 
                    ? 'ঋণের টাকা কোন অ্যাকাউন্টে জমা হবে? (Receiving Account)'
                    : 'ঋণের টাকা কোন অ্যাকাউন্ট থেকে পরিশোধ করা হয়েছে? (Source Account)'} *
                </label>
                <select
                  required
                  value={formData.targetAccountId || ''}
                  onChange={(e) => setFormData({ ...formData, targetAccountId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({currencySymbol}{(a.balance ?? 0).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    শুরুর তারিখ
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate || ''}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    পরিশোধের শেষ তারিখ (ঐচ্ছিক)
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate || ''}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  নোট বা বিবরণ
                </label>
                <textarea
                  rows={2}
                  placeholder="ঋণের উদ্দেশ্য বা শর্তাবলী..."
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors shadow-sm"
                >
                  ঋণ রেকর্ড যুক্ত করুন
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Repay Borrowed Loan Modal */}
      {repayModalLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-rose-50 dark:bg-rose-950/40">
              <div>
                <h3 className="text-sm font-bold text-rose-900 dark:text-rose-200">
                  ঋণ পরিশোধ (Repay Loan)
                </h3>
                <p className="text-xs text-rose-700 dark:text-rose-300">
                  প্রাপক: {repayModalLoan.personName} (বাকি: {currencySymbol}{(repayModalLoan.remainingAmount ?? 0).toLocaleString()})
                </p>
              </div>
              <button
                onClick={() => setRepayModalLoan(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteRepay} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  পরিশোধের পরিমাণ ({currencySymbol}) *
                </label>
                <input
                  type="number"
                  required
                  step="any"
                  max={repayModalLoan.remainingAmount}
                  value={actionAmount !== undefined && actionAmount !== null ? actionAmount : ''}
                  onChange={(e) => setActionAmount(e.target.value)}
                  className="w-full px-3 py-2 font-mono font-bold text-base bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  কোন অ্যাকাউন্ট থেকে পরিশোধ করবেন? *
                </label>
                <select
                  required
                  value={actionAccountId || ''}
                  onChange={(e) => setActionAccountId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                >
                  {accounts.map((a) => (
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
                  value={actionDate || ''}
                  onChange={(e) => setActionDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setRepayModalLoan(null)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl transition-colors shadow-sm"
                >
                  পরিশোধ নিশ্চিত করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Collect Lent Loan Modal */}
      {collectModalLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-emerald-50 dark:bg-emerald-950/40">
              <div>
                <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                  ঋণের টাকা আদায় (Collect Loan)
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  প্রদানকারী: {collectModalLoan.personName} (বাকি পাওনা: {currencySymbol}{(collectModalLoan.remainingAmount ?? 0).toLocaleString()})
                </p>
              </div>
              <button
                onClick={() => setCollectModalLoan(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteCollect} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  আদায়ের পরিমাণ ({currencySymbol}) *
                </label>
                <input
                  type="number"
                  required
                  step="any"
                  max={collectModalLoan.remainingAmount}
                  value={actionAmount !== undefined && actionAmount !== null ? actionAmount : ''}
                  onChange={(e) => setActionAmount(e.target.value)}
                  className="w-full px-3 py-2 font-mono font-bold text-base bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  টাকা কোন অ্যাকাউন্টে জমা হবে? *
                </label>
                <select
                  required
                  value={actionAccountId || ''}
                  onChange={(e) => setActionAccountId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} (বর্তমান ব্যালেন্স: {currencySymbol}{(a.balance ?? 0).toLocaleString()})
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
                  value={actionDate || ''}
                  onChange={(e) => setActionDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setCollectModalLoan(null)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors shadow-sm"
                >
                  আদায় সম্পন্ন করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
