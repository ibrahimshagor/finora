import React, { useState } from 'react';
import { 
  Plus, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  CreditCard, 
  Receipt, 
  RefreshCw,
  Bell,
  X,
  Printer,
  FileSpreadsheet
} from 'lucide-react';
import { useFinance } from '../../context/FinancialContext';
import { PrivacyAmount } from '../common/PrivacyAmount';
import { Bill } from '../../types';
import { generateBillsReport } from '../../lib/reportGenerator';

export const BillsView: React.FC = () => {
  const { bills, accounts, categories, addBill, markBillAsPaid, deleteBill, currencySymbol } = useFinance();

  const [showAddModal, setShowAddModal] = useState(false);
  const [payBillModalItem, setPayBillModalItem] = useState<Bill | null>(null);

  // Form State
  const [billForm, setBillForm] = useState({
    title: '',
    amount: '',
    dueDate: new Date().toISOString().split('T')[0],
    frequency: 'monthly' as 'monthly' | 'yearly' | 'weekly' | 'one_time',
    category: 'Utilities',
    isAutoPay: false,
    notes: '',
  });

  // Pay Bill Form State
  const [payingAccountId, setPayingAccountId] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);

  const handleOpenAdd = () => {
    setBillForm({
      title: '',
      amount: '',
      dueDate: new Date().toISOString().split('T')[0],
      frequency: 'monthly',
      category: 'Utilities',
      isAutoPay: false,
      notes: '',
    });
    setShowAddModal(true);
  };

  const handleSubmitAddBill = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(billForm.amount);
    if (!billForm.title.trim() || isNaN(num) || num <= 0) return;

    await addBill({
      title: billForm.title,
      amount: num,
      dueDate: billForm.dueDate,
      frequency: billForm.frequency,
      category: billForm.category,
      isAutoPay: billForm.isAutoPay,
      status: 'unpaid',
      notes: billForm.notes,
    });

    setShowAddModal(false);
  };

  const handleExecutePayBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payBillModalItem || !payingAccountId) return;

    await markBillAsPaid(payBillModalItem.id, payingAccountId);
    setPayBillModalItem(null);
  };

  const today = new Date().toISOString().split('T')[0];

  const totalUpcomingBills = bills
    .filter((b) => b.status === 'unpaid')
    .reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            বিল ও নিয়মিত সাবস্ক্রিপশন (Recurring Bills & Reminders)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            বাড়ি ভাড়া, বিদ্যুৎ, গ্যাস, ওয়াইফাই এবং সাবস্ক্রিপশনের বকেয়া হিসাব ও অ্যালার্ট।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              const rep = generateBillsReport(bills, currencySymbol);
              rep.print();
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold rounded-xl hover:bg-slate-800 transition-colors shadow-xs"
            title="সকল ইউটিলিটি ও সাবস্ক্রিপশন বিল রিপোর্ট প্রিন্ট"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>বিল রিপোর্ট প্রিন্ট</span>
          </button>

          <button
            onClick={() => {
              const rep = generateBillsReport(bills, currencySymbol);
              rep.downloadCSV();
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors"
            title="CSV এক্সপোর্ট"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন বিল যোগ করুন</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-xs text-slate-400 font-medium">আসন্ন মোট বকেয়া বিল (Pending Bills)</span>
          <p className="text-xl font-bold text-rose-600 dark:text-rose-400 font-mono mt-1">
            <PrivacyAmount amount={totalUpcomingBills} />
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-xs text-slate-400 font-medium">অপরিশোধিত বিল সংখ্যা</span>
          <p className="text-xl font-bold text-slate-900 dark:text-white font-mono mt-1">
            {bills.filter((b) => b.status === 'unpaid').length} টি
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-xs text-slate-400 font-medium">পরিশোধিত বিল সংখ্যা</span>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-1">
            {bills.filter((b) => b.status === 'paid').length} টি
          </p>
        </div>
      </div>

      {/* Bills Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {bills.length === 0 ? (
          <div className="col-span-3 p-12 text-center text-slate-400 text-xs bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            কোনো বিল যোগ করা হয়নি। বাড়ি ভাড়া, ডেসকো বিদ্যুৎ বিল, বা ওয়াইফাই বিল তালিকাভুক্ত করুন।
          </div>
        ) : (
          bills.map((bill) => {
            const isOverdue = bill.status === 'unpaid' && bill.dueDate < today;
            const isDueToday = bill.status === 'unpaid' && bill.dueDate === today;

            return (
              <div
                key={bill.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {bill.title}
                      </h3>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">
                        {bill.category} • {bill.frequency}
                      </span>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      bill.status === 'paid'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : isOverdue
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        : isDueToday
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                    }`}>
                      {bill.status === 'paid'
                        ? 'পরিশোধিত'
                        : isOverdue
                        ? 'মেয়াদোত্তীর্ণ (Overdue)'
                        : isDueToday
                        ? 'আজ শেষ দিন'
                        : 'বাকি আছে'}
                    </span>
                  </div>

                  <div className="my-3 py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
                    <span className="text-xs text-slate-400">বিলের পরিমাণ:</span>
                    <span className="text-base font-bold font-mono text-slate-900 dark:text-white">
                      <PrivacyAmount amount={bill.amount} />
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>শেষ সময়: <strong>{bill.dueDate}</strong></span>
                  </p>

                  {bill.notes && (
                    <p className="text-xs text-slate-400 mt-2 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg italic">
                      "{bill.notes}"
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      const rep = generateBillsReport([bill], currencySymbol);
                      rep.print();
                    }}
                    className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="এই বিলের রসিদ / মেমো প্রিন্ট"
                  >
                    <Printer className="w-4 h-4" />
                  </button>

                  <button
                    onClick={async () => {
                      if (window.confirm('এই বিলটি মুছে ফেলতে চান?')) {
                        await deleteBill(bill.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {bill.status === 'unpaid' && (
                    <button
                      onClick={() => {
                        setPayBillModalItem(bill);
                        setPayingAccountId(accounts[0]?.id || '');
                        setPayDate(new Date().toISOString().split('T')[0]);
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>বিল পরিশোধ করুন</span>
                    </button>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Add Bill Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                নতুন বিল / সাবস্ক্রিপশন যোগ করুন
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitAddBill} className="p-6 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  বিলের নাম (Bill Name) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: বাড়ি ভাড়া, DESCO বিদ্যুৎ বিল, Netflix"
                  value={billForm.title || ''}
                  onChange={(e) => setBillForm({ ...billForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    টাকার পরিমাণ ({currencySymbol}) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="2500"
                    value={billForm.amount !== undefined && billForm.amount !== null ? billForm.amount : ''}
                    onChange={(e) => setBillForm({ ...billForm, amount: e.target.value })}
                    className="w-full px-3 py-2 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    পরিশোধের শেষ তারিখ *
                  </label>
                  <input
                    type="date"
                    required
                    value={billForm.dueDate || ''}
                    onChange={(e) => setBillForm({ ...billForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    পুনরাবৃত্তির সময়কাল (Frequency)
                  </label>
                  <select
                    value={billForm.frequency || 'monthly'}
                    onChange={(e) => setBillForm({ ...billForm, frequency: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                  >
                    <option value="monthly">মাসিক (Monthly)</option>
                    <option value="yearly">বাৎসরিক (Yearly)</option>
                    <option value="weekly">সাপ্তাহিক (Weekly)</option>
                    <option value="one_time">একবার (One-time)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ক্যাটাগরি
                  </label>
                  <input
                    type="text"
                    value={billForm.category || ''}
                    onChange={(e) => setBillForm({ ...billForm, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

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
                  বিল সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Bill Action Modal */}
      {payBillModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-emerald-50 dark:bg-emerald-950/40">
              <div>
                <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                  বিল পরিশোধ নিশ্চিতকরণ
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  {payBillModalItem.title} ({currencySymbol}{(payBillModalItem.amount ?? 0).toLocaleString()})
                </p>
              </div>
              <button
                onClick={() => setPayBillModalItem(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecutePayBill} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  কোন অ্যাকাউন্ট থেকে বিল পরিশোধ করা হবে? *
                </label>
                <select
                  required
                  value={payingAccountId || ''}
                  onChange={(e) => setPayingAccountId(e.target.value)}
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
                  তারিখ
                </label>
                <input
                  type="date"
                  required
                  value={payDate || ''}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setPayBillModalItem(null)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors shadow-sm"
                >
                  পরিশোধ রেকর্ড করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
