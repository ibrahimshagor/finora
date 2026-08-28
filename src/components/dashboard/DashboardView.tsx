import React, { useState } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  ArrowLeftRight, 
  Wallet, 
  Landmark, 
  TrendingUp, 
  ShieldAlert, 
  CreditCard, 
  PiggyBank, 
  Target, 
  Plus, 
  Sparkles, 
  ChevronRight,
  Handshake,
  Receipt,
  Calendar
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { useFinance } from '../../context/FinancialContext';
import { PrivacyAmount } from '../common/PrivacyAmount';
import { Account, Transaction } from '../../types';

interface DashboardViewProps {
  onOpenNewTransaction: (type?: 'income' | 'expense' | 'transfer') => void;
  onOpenAccountDetail: (account: Account) => void;
  onNavigateTab: (tab: any) => void;
  onOpenAIAssistant: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenNewTransaction,
  onOpenAccountDetail,
  onNavigateTab,
  onOpenAIAssistant,
}) => {
  const { 
    accounts, 
    transactions, 
    categories, 
    summary, 
    budgets, 
    savingsGoals, 
    bills,
    currencySymbol,
    language
  } = useFinance();

  const currentMonth = new Date().toISOString().substring(0, 7);

  // Prepare monthly cashflow data for the last 6 months
  const chartData = React.useMemo(() => {
    const months: { [key: string]: { month: string; income: number; expense: number } } = {};
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mKey = d.toISOString().substring(0, 7);
      const mLabel = d.toLocaleString('en-US', { month: 'short' });
      months[mKey] = { month: mLabel, income: 0, expense: 0 };
    }

    transactions.forEach((t) => {
      const tMonth = t.date.substring(0, 7);
      if (months[tMonth]) {
        if (t.type === 'income') {
          months[tMonth].income += t.amount;
        } else if (t.type === 'expense') {
          months[tMonth].expense += t.amount;
        }
      }
    });

    return Object.values(months);
  }, [transactions]);

  // Spending Category Breakdown for Pie Chart
  const expensePieData = React.useMemo(() => {
    const catMap: { [catId: string]: number } = {};
    transactions
      .filter((t) => t.type === 'expense' && t.date.startsWith(currentMonth))
      .forEach((t) => {
        catMap[t.categoryId] = (catMap[t.categoryId] || 0) + t.amount;
      });

    const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4', '#6366f1', '#8b5cf6', '#ec4899'];
    
    return Object.keys(catMap).map((catId, index) => {
      const cat = categories.find((c) => c.id === catId);
      const catName = cat 
        ? (language === 'bn' ? (cat.nameBn || cat.name) : (cat.name || cat.nameBn))
        : (language === 'bn' ? 'অন্যান্য' : 'Other');
      return {
        name: catName,
        value: catMap[catId],
        color: COLORS[index % COLORS.length],
      };
    }).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [transactions, categories, currentMonth, language]);

  const recentTransactions = transactions.slice(0, 6);
  const activeAccounts = accounts.filter((a) => !a.isHidden);

  const savingsRate = summary.monthlyIncome > 0 
    ? Math.round((summary.monthlySavings / summary.monthlyIncome) * 100)
    : 0;

  return (
    <div className="space-y-6 pb-12">
      
      {/* 1. Top Summary Banner & Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Net Worth Card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 text-white rounded-2xl p-5 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Landmark className="w-24 h-24" />
          </div>
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>{language === 'bn' ? 'মোট সম্পদ (Net Worth)' : 'Net Worth'}</span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px]">
              Active Balance
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight">
            <PrivacyAmount amount={summary.netWorth} highlightNegative={false} />
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-300 pt-2 border-t border-slate-700/60">
            <span>{language === 'bn' ? 'মোট সম্পদ:' : 'Total Assets:'} <PrivacyAmount amount={summary.totalAssets} className="font-semibold text-emerald-400" /></span>
            <span>{language === 'bn' ? 'মোট দায়:' : 'Total Liabilities:'} <PrivacyAmount amount={summary.totalLiabilities} className="font-semibold text-rose-400" /></span>
          </div>
        </div>

        {/* Current Month Income */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>{language === 'bn' ? 'চলতি মাসের আয় (Income)' : 'Monthly Income'}</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
            <PrivacyAmount amount={summary.monthlyIncome} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1">
            <span>{language === 'bn' ? 'বেতন, ফ্রিল্যান্সিং ও অন্যান্য আয়' : 'Salary, business & other income'}</span>
          </p>
        </div>

        {/* Current Month Expense */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>{language === 'bn' ? 'চলতি মাসের খরচ (Expense)' : 'Monthly Expense'}</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
            <PrivacyAmount amount={summary.monthlyExpense} className="text-rose-600 dark:text-rose-400" />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1">
            <span>{language === 'bn' ? 'খাবার, বাজার, বিল ও যাতায়াত' : 'Food, bills, transport & daily expenses'}</span>
          </p>
        </div>

        {/* Monthly Net Savings */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>{language === 'bn' ? 'নিট সঞ্চয় (Net Savings)' : 'Net Savings'}</span>
            <div className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950/50 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
            <PrivacyAmount 
              amount={summary.monthlySavings} 
              className={summary.monthlySavings >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-rose-600 dark:text-rose-400'} 
            />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center justify-between">
            <span>{language === 'bn' ? 'সঞ্চয়ের হার (Savings Rate):' : 'Savings Rate:'}</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{savingsRate}%</span>
          </p>
        </div>

      </div>

      {/* 2. Secondary Metrics (Receivables vs Payables / Loans) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">
              {language === 'bn' ? 'পাওনা টাকা (Receivables)' : 'Receivables'}
            </p>
            <p className="text-lg font-bold text-emerald-900 dark:text-emerald-200 font-mono mt-0.5">
              <PrivacyAmount amount={summary.totalReceivables} />
            </p>
          </div>
          <Handshake className="w-7 h-7 text-emerald-600/40 dark:text-emerald-400/40" />
        </div>

        <div className="bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-rose-800 dark:text-rose-300 font-medium">
              {language === 'bn' ? 'দেনা / ঋণ (Liabilities)' : 'Liabilities & Debts'}
            </p>
            <p className="text-lg font-bold text-rose-900 dark:text-rose-200 font-mono mt-0.5">
              <PrivacyAmount amount={summary.totalLiabilities} />
            </p>
          </div>
          <ShieldAlert className="w-7 h-7 text-rose-600/40 dark:text-rose-400/40" />
        </div>

        <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-blue-800 dark:text-blue-300 font-medium">
              {language === 'bn' ? 'অ্যাকাউন্ট ব্যালেন্স (Cash & Banks)' : 'Cash & Bank Balance'}
            </p>
            <p className="text-lg font-bold text-blue-900 dark:text-blue-200 font-mono mt-0.5">
              <PrivacyAmount amount={summary.totalBalance} />
            </p>
          </div>
          <Wallet className="w-7 h-7 text-blue-600/40 dark:text-blue-400/40" />
        </div>

        <div 
          onClick={onOpenAIAssistant}
          className="bg-purple-50/50 hover:bg-purple-100/60 dark:bg-purple-950/20 dark:hover:bg-purple-900/30 border border-purple-200/60 dark:border-purple-900/40 rounded-xl p-4 flex items-center justify-between cursor-pointer transition-colors"
        >
          <div>
            <p className="text-xs text-purple-800 dark:text-purple-300 font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              FINORA AI Advisor
            </p>
            <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
              {language === 'bn' ? 'আর্থিক মতামত ও বাজেট বিশ্লেষণ দেখুন' : 'Get smart insights & forecasts'}
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-purple-500" />
        </div>

      </div>

      {/* 3. Quick Action Hub */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-2xs">
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
          {language === 'bn' ? 'দ্রুত কার্যধারা (Quick Actions)' : 'Quick Financial Actions'}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
          <button
            id="dash-quick-income"
            onClick={() => onOpenNewTransaction('income')}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 transition-colors"
          >
            <ArrowDownLeft className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mb-1" />
            <span className="text-xs font-semibold">{language === 'bn' ? 'টাকা জমা (Income)' : 'Add Income'}</span>
          </button>

          <button
            id="dash-quick-expense"
            onClick={() => onOpenNewTransaction('expense')}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-800 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60 transition-colors"
          >
            <ArrowUpRight className="w-5 h-5 text-rose-600 dark:text-rose-400 mb-1" />
            <span className="text-xs font-semibold">{language === 'bn' ? 'খরচ (Expense)' : 'Add Expense'}</span>
          </button>

          <button
            id="dash-quick-transfer"
            onClick={() => onOpenNewTransaction('transfer')}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-800 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60 transition-colors"
          >
            <ArrowLeftRight className="w-5 h-5 text-blue-600 dark:text-blue-400 mb-1" />
            <span className="text-xs font-semibold">{language === 'bn' ? 'স্থানান্তর (Transfer)' : 'Transfer'}</span>
          </button>

          <button
            id="dash-quick-loan"
            onClick={() => onNavigateTab('loans')}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60 transition-colors"
          >
            <Handshake className="w-5 h-5 text-amber-600 dark:text-amber-400 mb-1" />
            <span className="text-xs font-semibold">{language === 'bn' ? 'ঋণ ও ধার' : 'Loans & Debts'}</span>
          </button>

          <button
            id="dash-quick-cc"
            onClick={() => onNavigateTab('credit_cards')}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 text-purple-800 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60 transition-colors"
          >
            <CreditCard className="w-5 h-5 text-purple-600 dark:text-purple-400 mb-1" />
            <span className="text-xs font-semibold">{language === 'bn' ? 'কার্ড বিল' : 'Credit Cards'}</span>
          </button>

          <button
            id="dash-quick-bill"
            onClick={() => onNavigateTab('bills')}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 dark:hover:bg-teal-900/50 text-teal-800 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/60 transition-colors"
          >
            <Receipt className="w-5 h-5 text-teal-600 dark:text-teal-400 mb-1" />
            <span className="text-xs font-semibold">{language === 'bn' ? 'ইউটিলিটি বিল' : 'Utility Bills'}</span>
          </button>
        </div>
      </div>

      {/* 4. Charts Section (Cash Flow Trend & Expense Breakdown) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Cashflow Bar Chart (2 Cols on lg) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {language === 'bn' ? 'মাসিক আয় ও ব্যয়ের প্রবণতা (Cash Flow Trend)' : 'Monthly Cash Flow Trend'}
              </h3>
              <p className="text-xs text-slate-400">
                {language === 'bn' ? 'গত ৬ মাসের তুলনামূলক চিত্র' : 'Comparative performance over last 6 months'}
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                <span className="w-3 h-3 rounded-sm bg-emerald-500"></span> {language === 'bn' ? 'আয় (Income)' : 'Income'}
              </span>
              <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                <span className="w-3 h-3 rounded-sm bg-rose-500"></span> {language === 'bn' ? 'খরচ (Expense)' : 'Expense'}
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip 
                  formatter={(val: any) => [`${currencySymbol}${Number(val || 0).toLocaleString()}`, '']}
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    borderRadius: '12px', 
                    border: 'none', 
                    color: '#fff',
                    fontSize: '12px' 
                  }}
                />
                <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} />
                <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Category Pie Chart (1 Col on lg) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
              {language === 'bn' ? 'চলতি মাসের খাতভিত্তিক খরচ' : 'Monthly Spending Breakdown'}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              {language === 'bn' ? 'সবচেয়ে বেশি ব্যয়ের খাতসমূহ' : 'Top expenditure categories'}
            </p>
            
            {expensePieData.length > 0 ? (
              <div className="h-44 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expensePieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                    >
                      {expensePieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(val: any) => [`${currencySymbol}${Number(val || 0).toLocaleString()}`, language === 'bn' ? 'খরচ' : 'Expense']}
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-44 flex items-center justify-center text-xs text-slate-400">
                {language === 'bn' ? 'এই মাসে এখনও কোনো খরচ লিপিবদ্ধ করা হয়নি।' : 'No expenses recorded for this month yet.'}
              </div>
            )}
          </div>

          <div className="space-y-1.5 mt-2">
            {expensePieData.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600 dark:text-slate-300 truncate max-w-[120px]">{item.name}</span>
                </div>
                <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                  <PrivacyAmount amount={item.value} />
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 5. Accounts Overview & Recent Transactions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Accounts Overview (1 Col) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {language === 'bn' ? `আমার অ্যাকাউন্টস (${activeAccounts.length})` : `My Accounts (${activeAccounts.length})`}
              </h3>
              <button
                onClick={() => onNavigateTab('accounts')}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
              >
                {language === 'bn' ? 'সব দেখুন' : 'View All'} <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {activeAccounts.slice(0, 4).map((acc) => (
                <div
                  key={acc.id}
                  onClick={() => onOpenAccountDetail(acc)}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 cursor-pointer transition-colors border border-slate-200/50 dark:border-slate-700/50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                      style={{ backgroundColor: acc.color || '#10b981' }}
                    >
                      {acc.type === 'bank' ? <Landmark className="w-4 h-4" /> : <Wallet className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[140px]">
                        {acc.name}
                      </p>
                      <p className="text-[10px] text-slate-400">{acc.institutionName || acc.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-bold font-mono ${acc.type === 'credit_card' && acc.balance < 0 ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>
                      <PrivacyAmount amount={acc.balance} />
                    </p>
                    <span className="text-[10px] text-slate-400 uppercase">{acc.type}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('accounts')}
            className="w-full mt-4 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl hover:bg-emerald-100 transition-colors"
          >
            {language === 'bn' ? 'অ্যাকাউন্টস হাব ও স্টেটমেন্ট খুলুন' : 'Open Accounts Hub & Statements'}
          </button>
        </div>

        {/* Recent Transactions Feed (2 Cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {language === 'bn' ? 'সাম্প্রতিক লেনদেন (Recent Transactions)' : 'Recent Transactions'}
              </h3>
              <p className="text-xs text-slate-400">
                {language === 'bn' ? 'সর্বশেষ সম্পন্ন আর্থিক এন্ট্রি' : 'Latest financial ledger activity'}
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('transactions')}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
            >
              {language === 'bn' ? 'সম্পূর্ণ খাতা দেখুন' : 'View Full Ledger'} <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              {language === 'bn' ? 'কোনো লেনদেন রেকর্ড পাওয়া যায়নি।' : 'No transaction records found.'}
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentTransactions.map((t) => {
                const acc = accounts.find((a) => a.id === t.accountId);
                const targetAcc = t.targetAccountId ? accounts.find((a) => a.id === t.targetAccountId) : null;
                const cat = categories.find((c) => c.id === t.categoryId);
                const categoryTitle = cat 
                  ? (language === 'bn' ? (cat.nameBn || cat.name) : (cat.name || cat.nameBn))
                  : t.type;

                return (
                  <div key={t.id} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                        t.type === 'income' 
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400' 
                          : t.type === 'expense'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400'
                      }`}>
                        {t.type === 'income' ? (
                          <ArrowDownLeft className="w-4 h-4" />
                        ) : t.type === 'expense' ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : (
                          <ArrowLeftRight className="w-4 h-4" />
                        )}
                      </div>

                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          {t.description || categoryTitle}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          <span>{t.date}</span>
                          <span>•</span>
                          <span>{acc ? acc.name : 'Account'}</span>
                          {targetAcc && <span>→ {targetAcc.name}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="text-right font-mono font-bold">
                      <span className={
                        t.type === 'income'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : t.type === 'expense'
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-blue-600 dark:text-blue-400'
                      }>
                        <PrivacyAmount 
                          amount={t.amount} 
                          prefix={t.type === 'income' ? `+${currencySymbol}` : t.type === 'expense' ? `-${currencySymbol}` : currencySymbol}
                        />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
