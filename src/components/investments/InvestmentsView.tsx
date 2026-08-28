import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Trash2, 
  Edit3, 
  PieChart as PieIcon, 
  DollarSign, 
  Calendar,
  Building,
  Coins,
  X,
  Printer,
  FileSpreadsheet
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useFinance } from '../../context/FinancialContext';
import { PrivacyAmount } from '../common/PrivacyAmount';
import { Investment } from '../../types';
import { generateInvestmentsReport } from '../../lib/reportGenerator';

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#64748b'];

export const InvestmentsView: React.FC = () => {
  const { 
    investments, 
    accounts, 
    addInvestment, 
    updateInvestment, 
    deleteInvestment, 
    currencySymbol 
  } = useFinance();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingInvest, setEditingInvest] = useState<Investment | null>(null);

  const handlePrintReport = () => {
    const rep = generateInvestmentsReport(investments, currencySymbol);
    rep.print();
  };

  const handleDownloadCSV = () => {
    const rep = generateInvestmentsReport(investments, currencySymbol);
    rep.downloadCSV();
  };

  // Form State
  const [form, setForm] = useState({
    name: '',
    type: 'stocks' as 'stocks' | 'mutual_fund' | 'real_estate' | 'crypto' | 'gold' | 'fdr_dps' | 'other',
    buyPrice: '',
    currentValue: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const handleOpenAdd = () => {
    setEditingInvest(null);
    setForm({
      name: '',
      type: 'stocks',
      buyPrice: '',
      currentValue: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (inv: Investment) => {
    setEditingInvest(inv);
    setForm({
      name: inv.name,
      type: inv.type,
      buyPrice: String(inv.buyPrice),
      currentValue: String(inv.currentValue),
      purchaseDate: inv.purchaseDate,
      notes: inv.notes || '',
    });
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const buy = parseFloat(form.buyPrice);
    const curr = parseFloat(form.currentValue);
    if (!form.name.trim() || isNaN(buy) || isNaN(curr)) return;

    if (editingInvest) {
      await updateInvestment(editingInvest.id, {
        name: form.name,
        type: form.type,
        buyPrice: buy,
        currentValue: curr,
        purchaseDate: form.purchaseDate,
        notes: form.notes,
      });
    } else {
      await addInvestment({
        name: form.name,
        type: form.type,
        buyPrice: buy,
        currentValue: curr,
        purchaseDate: form.purchaseDate,
        notes: form.notes,
      });
    }

    setShowAddModal(false);
  };

  const totalInvested = investments.reduce((sum, i) => sum + i.buyPrice, 0);
  const totalCurrentValue = investments.reduce((sum, i) => sum + i.currentValue, 0);
  const totalGainLoss = totalCurrentValue - totalInvested;
  const overallReturnPct = totalInvested > 0 ? ((totalGainLoss / totalInvested) * 100).toFixed(1) : '0';

  // Chart Data
  const pieData = investments.map((inv) => ({
    name: inv.name,
    value: inv.currentValue,
  }));

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            বিনিয়োগ পোর্টফোলিও (Investment Portfolio)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            শেয়ার বাজার, সঞ্চয়পত্র, স্বর্ণ, জমি ও অন্যান্য দীর্ঘমেয়াদি অ্যাসেট ট্র্যাকিং।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handlePrintReport}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold rounded-xl hover:bg-slate-800 transition-colors shadow-xs"
            title="বিনিয়োগ পোর্টফোলিও রিপোর্ট প্রিন্ট"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>পোর্টফোলিও প্রিন্ট</span>
          </button>

          <button
            onClick={handleDownloadCSV}
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
            <span>নতুন বিনিয়োগ যোগ করুন</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-xs text-slate-400 font-medium">মোট বিনিয়োগকৃত মূলধন</span>
          <p className="text-xl font-bold text-slate-900 dark:text-white font-mono mt-1">
            <PrivacyAmount amount={totalInvested} />
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-xs text-slate-400 font-medium">বর্তমান বাজারমূল্য (Current Value)</span>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-1">
            <PrivacyAmount amount={totalCurrentValue} />
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-xs text-slate-400 font-medium">সর্বমোট লাভ/ক্ষতি (Total Return)</span>
          <p className={`text-xl font-bold font-mono mt-1 ${totalGainLoss >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            <PrivacyAmount amount={totalGainLoss} prefix={totalGainLoss >= 0 ? `+${currencySymbol}` : `-${currencySymbol}`} />
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-xs text-slate-400 font-medium">রিটার্ন শতাংশ (ROI %)</span>
          <p className={`text-xl font-bold font-mono mt-1 ${totalGainLoss >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {totalGainLoss >= 0 ? `+${overallReturnPct}%` : `${overallReturnPct}%`}
          </p>
        </div>
      </div>

      {/* Grid: Assets + Pie chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Investments list */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            বিনিয়োগকৃত সম্পদের তালিকা ({investments.length})
          </h3>

          {investments.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              কোনো বিনিয়োগ রেকর্ড পাওয়া যায়নি।
            </div>
          ) : (
            investments.map((inv) => {
              const gain = inv.currentValue - inv.buyPrice;
              const gainPct = inv.buyPrice > 0 ? ((gain / inv.buyPrice) * 100).toFixed(1) : '0';

              return (
                <div
                  key={inv.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 font-bold">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {inv.name}
                      </h4>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">
                        {inv.type} • কেনা: {inv.purchaseDate}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">বর্তমান মূল্য</span>
                      <span className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                        <PrivacyAmount amount={inv.currentValue} />
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">লাভ/ক্ষতি</span>
                      <span className={`text-xs font-bold font-mono ${gain >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {gain >= 0 ? `+${gainPct}%` : `${gainPct}%`}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          const rep = generateInvestmentsReport([inv], currencySymbol);
                          rep.print();
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="এই বিনিয়োগের স্লিপ প্রিন্ট"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(inv)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100"
                        title="সম্পাদনা"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={async () => {
                          if (window.confirm('এই বিনিয়োগ রেকর্ডটি মুছতে চান?')) {
                            await deleteInvestment(inv.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100"
                        title="মুছুন"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>

        {/* Right: Allocation Pie Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">
            পোর্টফোলিও বিন্যাস (Asset Allocation)
          </h3>

          {pieData.length === 0 ? (
            <div className="h-60 flex items-center justify-center text-xs text-slate-400">
              কোনো বিনিয়োগ ডেটা নেই
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => [`${currencySymbol}${Number(value || 0).toLocaleString()}`, 'মূল্য']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
            {pieData.map((d, i) => (
              <div key={i} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-slate-600 dark:text-slate-400">{d.name}</span>
                </div>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                  <PrivacyAmount amount={d.value} />
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingInvest ? 'বিনিয়োগ আপডেট করুন' : 'নতুন বিনিয়োগ যোগ করুন'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  বিনিয়োগের নাম (Asset Name) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: GP Share (100 qty), স্বর্ণের বার (১ ভরি), সঞ্চয়পত্র"
                  value={form.name || ''}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ক্যাটাগরি
                  </label>
                  <select
                    value={form.type || 'stocks'}
                    onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                  >
                    <option value="stocks">শেয়ার মার্কেট (Stocks)</option>
                    <option value="mutual_fund">মিউচুয়াল ফান্ড (Mutual Fund)</option>
                    <option value="fdr_dps">সঞ্চয়পত্র / এফডিআর (FDR / DPS)</option>
                    <option value="gold">স্বর্ণ / রৌপ্য (Gold / Silver)</option>
                    <option value="real_estate">জমি / ফ্ল্যাট (Real Estate)</option>
                    <option value="crypto">ক্রিপ্টোকারেন্সি (Crypto)</option>
                    <option value="other">অন্যান্য (Other Asset)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    কেনার তারিখ
                  </label>
                  <input
                    type="date"
                    required
                    value={form.purchaseDate || ''}
                    onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ক্রয়মূল্য / মূলধন ({currencySymbol}) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="100000"
                    value={form.buyPrice !== undefined && form.buyPrice !== null ? form.buyPrice : ''}
                    onChange={(e) => setForm({ ...form, buyPrice: e.target.value })}
                    className="w-full px-3 py-2 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    বর্তমান বাজারমূল্য ({currencySymbol}) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="115000"
                    value={form.currentValue !== undefined && form.currentValue !== null ? form.currentValue : ''}
                    onChange={(e) => setForm({ ...form, currentValue: e.target.value })}
                    className="w-full px-3 py-2 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  নোট বা বিবরণ
                </label>
                <textarea
                  rows={2}
                  placeholder="ব্রোকার হাউজ, রিটার্ন রেট ইত্যাদি..."
                  value={form.notes || ''}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                />
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
                  {editingInvest ? 'আপডেট সম্পন্ন করুন' : 'বিনিয়োগ যুক্ত করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
