import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Download, 
  Printer, 
  Filter, 
  PieChart as PieIcon,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart as RePieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { useFinance } from '../../context/FinancialContext';
import { PrivacyAmount } from '../common/PrivacyAmount';
import { generateAnalyticsReport } from '../../lib/reportGenerator';

const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

type PeriodType = 'monthly' | 'half_yearly' | 'yearly' | 'custom';

export const AnalyticsView: React.FC = () => {
  const { transactions, accounts, categories, currencySymbol } = useFinance();

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [periodType, setPeriodType] = useState<PeriodType>('monthly');
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedHalf, setSelectedHalf] = useState<'h1' | 'h2'>('h1'); // h1: Jan-Jun, h2: Jul-Dec
  const [startDate, setStartDate] = useState<string>(`${currentYear}-01-01`);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const monthNamesBn = [
    'জানুয়ারি (Jan)', 'ফেব্রুয়ারি (Feb)', 'মার্চ (Mar)', 'এপ্রিল (Apr)',
    'মে (May)', 'জুন (Jun)', 'জুলাই (Jul)', 'আগস্ট (Aug)',
    'সেপ্টেম্বর (Sep)', 'অক্টোবর (Oct)', 'নভেম্বর (Nov)', 'ডিসেম্বর (Dec)'
  ];

  // Calculate actual date boundaries and title based on selected period
  const { periodLabel, activeStartDate, activeEndDate } = useMemo(() => {
    if (periodType === 'monthly') {
      const mStr = String(selectedMonth).padStart(2, '0');
      const start = `${selectedYear}-${mStr}-01`;
      const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
      const end = `${selectedYear}-${mStr}-${String(lastDay).padStart(2, '0')}`;
      return {
        periodLabel: `${monthNamesBn[selectedMonth - 1]} ${selectedYear}`,
        activeStartDate: start,
        activeEndDate: end
      };
    }

    if (periodType === 'half_yearly') {
      if (selectedHalf === 'h1') {
        return {
          periodLabel: `প্রথম ৬ মাস (জানুয়ারি - জুন ${selectedYear})`,
          activeStartDate: `${selectedYear}-01-01`,
          activeEndDate: `${selectedYear}-06-30`
        };
      } else {
        return {
          periodLabel: `দ্বিতীয় ৬ মাস (জুলাই - ডিসেম্বর ${selectedYear})`,
          activeStartDate: `${selectedYear}-07-01`,
          activeEndDate: `${selectedYear}-12-31`
        };
      }
    }

    if (periodType === 'yearly') {
      return {
        periodLabel: `বাৎসরিক রিপোর্ট (${selectedYear})`,
        activeStartDate: `${selectedYear}-01-01`,
        activeEndDate: `${selectedYear}-12-31`
      };
    }

    // Custom
    return {
      periodLabel: `কাস্টম সময়কাল (${startDate} হতে ${endDate})`,
      activeStartDate: startDate,
      activeEndDate: endDate
    };
  }, [periodType, selectedYear, selectedMonth, selectedHalf, startDate, endDate]);

  // Filtered transactions for the active period
  const periodTransactions = useMemo(() => {
    return transactions.filter(
      (t) => t.date >= activeStartDate && t.date <= activeEndDate
    );
  }, [transactions, activeStartDate, activeEndDate]);

  // Monthly trend data for the year/half-year
  const trendData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map((m, idx) => {
      const monthPrefix = `${selectedYear}-${String(idx + 1).padStart(2, '0')}`;
      
      const income = transactions
        .filter((t) => t.type === 'income' && t.date.startsWith(monthPrefix))
        .reduce((sum, t) => sum + t.amount, 0);

      const expense = transactions
        .filter((t) => t.type === 'expense' && t.date.startsWith(monthPrefix))
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        month: m,
        income,
        expense,
        savings: income - expense,
      };
    });
  }, [transactions, selectedYear]);

  // Category breakdown for expenses in active period
  const categoryExpenseData = useMemo(() => {
    const map: { [catId: string]: number } = {};
    periodTransactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const catName = categories.find((c) => c.id === t.categoryId)?.nameBn || t.categoryId || 'অন্যান্য';
        map[catName] = (map[catName] || 0) + t.amount;
      });

    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [periodTransactions, categories]);

  const totalPeriodIncome = periodTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalPeriodExpense = periodTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const totalPeriodSavings = totalPeriodIncome - totalPeriodExpense;
  const savingsRate = totalPeriodIncome > 0 ? Math.round((totalPeriodSavings / totalPeriodIncome) * 100) : 0;

  const report = useMemo(() => {
    return generateAnalyticsReport(
      periodLabel,
      transactions,
      categories,
      accounts,
      currencySymbol,
      activeStartDate,
      activeEndDate
    );
  }, [periodLabel, transactions, categories, accounts, currencySymbol, activeStartDate, activeEndDate]);

  const handlePrint = () => {
    report.print();
  };

  const handleDownloadCSV = () => {
    report.downloadCSV();
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header & Main Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              <span>রিপোর্ট ও আর্থিক বিশ্লেষণ (Reports & Analytics)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              মাসিক, ছয় মাসিক, বাৎসরিক বা যেকোনো নির্দিষ্ট তারিখ সীমার আয়-ব্যয় এবং ক্যাশফ্লো রিপোর্ট তৈরি ও ডাউনলোড করুন।
            </p>
          </div>

          {/* Action Download/Print Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold rounded-xl transition-all shadow-xs active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>প্রিন্ট / PDF রিপোর্ট তৈরি করুন</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadCSV}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>এক্সেল (CSV) ডাউনলোড</span>
            </button>
          </div>
        </div>

        {/* Period Selector Tabs */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
          
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setPeriodType('monthly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                periodType === 'monthly'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              মাসিক (Monthly)
            </button>
            <button
              type="button"
              onClick={() => setPeriodType('half_yearly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                periodType === 'half_yearly'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              ছয় মাসিক (6 Months)
            </button>
            <button
              type="button"
              onClick={() => setPeriodType('yearly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                periodType === 'yearly'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              বাৎসরিক (Yearly)
            </button>
            <button
              type="button"
              onClick={() => setPeriodType('custom')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                periodType === 'custom'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              নির্দিষ্ট তারিখ (Custom Range)
            </button>
          </div>

          {/* Dynamic Filter Controls depending on periodType */}
          <div className="flex flex-wrap items-center gap-2">
            
            {periodType === 'monthly' && (
              <>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl focus:outline-none"
                >
                  {monthNamesBn.map((name, idx) => (
                    <option key={idx + 1} value={idx + 1}>{name}</option>
                  ))}
                </select>

                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl focus:outline-none font-mono"
                >
                  <option value={2027}>2027</option>
                  <option value={2026}>2026</option>
                  <option value={2025}>2025</option>
                  <option value={2024}>2024</option>
                </select>
              </>
            )}

            {periodType === 'half_yearly' && (
              <>
                <select
                  value={selectedHalf}
                  onChange={(e) => setSelectedHalf(e.target.value as 'h1' | 'h2')}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl focus:outline-none"
                >
                  <option value="h1">প্রথম ৬ মাস (জানুয়ারি - জুন)</option>
                  <option value="h2">দ্বিতীয় ৬ মাস (জুলাই - ডিসেম্বর)</option>
                </select>

                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl focus:outline-none font-mono"
                >
                  <option value={2027}>2027</option>
                  <option value={2026}>2026</option>
                  <option value={2025}>2025</option>
                  <option value={2024}>2024</option>
                </select>
              </>
            )}

            {periodType === 'yearly' && (
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl focus:outline-none font-mono"
              >
                <option value={2027}>2027</option>
                <option value={2026}>2026</option>
                <option value={2025}>2025</option>
                <option value={2024}>2024</option>
              </select>
            )}

            {periodType === 'custom' && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-slate-400">হতে:</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs rounded-xl focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-slate-400">পর্যন্ত:</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs rounded-xl focus:outline-none"
                  />
                </div>
              </div>
            )}

          </div>

        </div>
      </div>

      {/* Period Active Badge */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
        <span>নির্বাচিত সময়কাল: <strong className="text-slate-800 dark:text-slate-200">{periodLabel}</strong></span>
        <span>মোট লেনদেন সংখ্যা: <strong className="text-slate-800 dark:text-slate-200">{periodTransactions.length} টি</strong></span>
      </div>

      {/* Period Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-xs text-slate-400 font-medium block">সময়কালের মোট আয়</span>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-1">
            <PrivacyAmount amount={totalPeriodIncome} />
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-xs text-slate-400 font-medium block">সময়কালের মোট ব্যয়</span>
          <p className="text-xl font-bold text-rose-600 dark:text-rose-400 font-mono mt-1">
            <PrivacyAmount amount={totalPeriodExpense} />
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-xs text-slate-400 font-medium block">নিট উদ্বৃত্ত / সঞ্চয়</span>
          <p className={`text-xl font-bold font-mono mt-1 ${totalPeriodSavings >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            <PrivacyAmount amount={totalPeriodSavings} />
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-xs text-slate-400 font-medium block">সঞ্চয়ের হার (Savings Rate)</span>
          <p className={`text-xl font-bold font-mono mt-1 ${savingsRate >= 20 ? 'text-emerald-600' : 'text-amber-600'}`}>
            {savingsRate}%
          </p>
        </div>
      </div>

      {/* Monthly Inflow vs Outflow Bar Chart */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">
          মাসিক আয় ও ব্যয়ের তুলনামূলক চিত্র ({selectedYear})
        </h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(val: any) => [`${currencySymbol}${Number(val || 0).toLocaleString()}`, '']} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Bar dataKey="income" name="আয় (Income)" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="ব্যয় (Expense)" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Breakdown Donut & Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">
              শীর্ষ ব্যয়ের খাতসমূহ ({periodLabel})
            </h3>

            {categoryExpenseData.length === 0 ? (
              <div className="h-60 flex items-center justify-center text-xs text-slate-400">
                এই সময়কালে কোনো ব্যয়ের তথ্য নেই
              </div>
            ) : (
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={categoryExpenseData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {categoryExpenseData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => [`${currencySymbol}${Number(value || 0).toLocaleString()}`, 'মোট ব্যয়']} />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1 text-xs">
            {categoryExpenseData.slice(0, 5).map((d, i) => (
              <div key={i} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-slate-600 dark:text-slate-400 truncate max-w-[120px]">{d.name}</span>
                </div>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                  <PrivacyAmount amount={d.value} />
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Transactions List for this Period */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              নির্বাচিত সময়কালের লেনদেনসমূহ ({periodTransactions.length} টি)
            </h3>
            <button
              onClick={handlePrint}
              className="text-[11px] font-semibold text-emerald-600 hover:underline inline-flex items-center gap-1"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>প্রিন্ট ভিউ</span>
            </button>
          </div>

          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800 sticky top-0">
                <tr>
                  <th className="px-3 py-2">তারিখ</th>
                  <th className="px-3 py-2">অ্যাকাউন্ট</th>
                  <th className="px-3 py-2">বিবরণ / খাত</th>
                  <th className="px-3 py-2 text-right">পরিমাণ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {periodTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-slate-400">
                      এই সময়কালে কোনো লেনদেন নেই
                    </td>
                  </tr>
                ) : (
                  periodTransactions.slice(0, 50).map((t) => {
                    const acc = accounts.find((a) => a.id === t.accountId);
                    const cat = categories.find((c) => c.id === t.categoryId);
                    return (
                      <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="px-3 py-2 text-slate-500 font-mono text-[11px] whitespace-nowrap">{t.date}</td>
                        <td className="px-3 py-2 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">{acc?.name || '-'}</td>
                        <td className="px-3 py-2">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{t.description || t.payerPayee || 'লেনদেন'}</div>
                          <div className="text-[10px] text-slate-400">{cat?.nameBn || t.categoryId || ''}</div>
                        </td>
                        <td className={`px-3 py-2 text-right font-mono font-bold whitespace-nowrap ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {t.type === 'income' ? '+' : '-'}{currencySymbol}{t.amount.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
};
