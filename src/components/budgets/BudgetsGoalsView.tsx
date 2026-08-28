import React, { useState } from 'react';
import { 
  Plus, 
  Target, 
  PiggyBank, 
  AlertTriangle, 
  CheckCircle2, 
  Trash2, 
  Edit3, 
  Calendar, 
  Sparkles, 
  ArrowUpRight, 
  ShieldCheck,
  X,
  Printer,
  FileSpreadsheet
} from 'lucide-react';
import { useFinance } from '../../context/FinancialContext';
import { PrivacyAmount } from '../common/PrivacyAmount';
import { Budget, SavingsGoal } from '../../types';
import { generateBudgetsGoalsReport } from '../../lib/reportGenerator';

export const BudgetsGoalsView: React.FC = () => {
  const { 
    budgets, 
    savingsGoals, 
    transactions, 
    categories, 
    accounts,
    addBudget, 
    updateBudget, 
    deleteBudget, 
    addSavingsGoal, 
    updateSavingsGoal, 
    deleteSavingsGoal, 
    contributeToGoal,
    currencySymbol,
    language 
  } = useFinance();

  const [activeTab, setActiveTab] = useState<'budgets' | 'goals'>('budgets');
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [contributeGoal, setContributeGoal] = useState<SavingsGoal | null>(null);

  const handlePrintReport = () => {
    const rep = generateBudgetsGoalsReport(budgets, savingsGoals, transactions, categories, currencySymbol);
    rep.print();
  };

  const handleDownloadCSV = () => {
    const rep = generateBudgetsGoalsReport(budgets, savingsGoals, transactions, categories, currencySymbol);
    rep.downloadCSV();
  };

  // Form State for Budget
  const [budgetForm, setBudgetForm] = useState({
    categoryId: '',
    targetAmount: '',
    alertThreshold: 80,
  });

  // Form State for Savings Goal
  const [goalForm, setGoalForm] = useState({
    title: '',
    targetAmount: '',
    currentAmount: '',
    targetDate: '',
    category: 'General',
    color: '#10b981',
    notes: '',
  });

  // Form State for Contribution
  const [contribAmount, setContribAmount] = useState('');
  const [contribAccId, setContribAccId] = useState('');

  const currentMonth = new Date().toISOString().substring(0, 7);

  const expenseCategories = categories.filter((c) => c.type === 'expense');

  const handleOpenBudgetModal = () => {
    setBudgetForm({
      categoryId: expenseCategories[0]?.id || '',
      targetAmount: '',
      alertThreshold: 80,
    });
    setShowBudgetModal(true);
  };

  const handleOpenGoalModal = () => {
    setGoalForm({
      title: '',
      targetAmount: '',
      currentAmount: '0',
      targetDate: '',
      category: 'General',
      color: '#10b981',
      notes: '',
    });
    setShowGoalModal(true);
  };

  const handleSubmitBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const cat = categories.find((c) => c.id === budgetForm.categoryId);
    const amount = parseFloat(budgetForm.targetAmount);
    if (!cat || isNaN(amount) || amount <= 0) return;

    await addBudget({
      categoryId: cat.id,
      categoryName: cat.nameBn || cat.name,
      targetAmount: amount,
      period: 'monthly',
      month: currentMonth,
      alertThreshold: Number(budgetForm.alertThreshold) || 80,
    });

    setShowBudgetModal(false);
  };

  const handleSubmitGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(goalForm.targetAmount);
    const current = parseFloat(goalForm.currentAmount) || 0;
    if (!goalForm.title.trim() || isNaN(target) || target <= 0) return;

    await addSavingsGoal({
      title: goalForm.title,
      targetAmount: target,
      currentAmount: current,
      targetDate: goalForm.targetDate || undefined,
      category: goalForm.category,
      color: goalForm.color,
      notes: goalForm.notes,
      isCompleted: current >= target,
    });

    setShowGoalModal(false);
  };

  const handleExecuteContribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contributeGoal) return;
    const num = parseFloat(contribAmount);
    if (isNaN(num) || num <= 0) return;

    await contributeToGoal(contributeGoal.id, num, contribAccId || undefined);
    setContributeGoal(null);
  };

  // Calculate overall budget statistics
  const totalBudgeted = budgets.filter((b) => b.month === currentMonth).reduce((sum, b) => sum + b.targetAmount, 0);
  const totalSpentInBudgets = budgets.filter((b) => b.month === currentMonth).reduce((sum, b) => {
    const spent = transactions
      .filter((t) => t.type === 'expense' && t.categoryId === b.categoryId && t.date.startsWith(currentMonth))
      .reduce((s, t) => s + t.amount, 0);
    return sum + spent;
  }, 0);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {language === 'bn' ? 'বাজেট ও সঞ্চয় লক্ষ্য' : 'Budgets & Savings Goals'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {language === 'bn' ? 'খাতভিত্তিক খরচ সীমাবদ্ধ করুন এবং আপনার ভবিষ্যৎ আর্থিক লক্ষ্য দ্রুত পূরণ করুন।' : 'Cap category expenses and hit your future savings targets.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handlePrintReport}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold rounded-xl hover:bg-slate-800 transition-colors shadow-xs"
            title="বাজেট ও সঞ্চয় লক্ষ্য রিপোর্ট প্রিন্ট"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>রিপোর্ট প্রিন্ট</span>
          </button>

          <button
            onClick={handleDownloadCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors"
            title="CSV এক্সপোর্ট"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>

          {activeTab === 'budgets' ? (
            <button
              onClick={handleOpenBudgetModal}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'bn' ? 'নতুন বাজেট সেট করুন' : 'Set Budget'}</span>
            </button>
          ) : (
            <button
              onClick={handleOpenGoalModal}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'bn' ? 'নতুন সঞ্চয় লক্ষ্য যোগ করুন' : 'Add Savings Goal'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-3 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('budgets')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'budgets'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          <span>{language === 'bn' ? 'মাসিক ক্যাটাগরি বাজেট' : 'Monthly Category Budgets'} ({budgets.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('goals')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'goals'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <PiggyBank className="w-3.5 h-3.5" />
          <span>{language === 'bn' ? 'সঞ্চয় লক্ষ্যসমূহ' : 'Savings Goals'} ({savingsGoals.length})</span>
        </button>
      </div>

      {/* 1. BUDGETS VIEW */}
      {activeTab === 'budgets' && (
        <div className="space-y-5">
          
          {/* Summary Mini Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-xs text-slate-400 font-medium">{language === 'bn' ? 'চলতি মাসের মোট নির্ধারিত বাজেট' : 'Total Monthly Budget'}</span>
              <p className="text-xl font-bold text-slate-900 dark:text-white font-mono mt-1">
                <PrivacyAmount amount={totalBudgeted} />
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-xs text-slate-400 font-medium">{language === 'bn' ? 'বাজেটভুক্ত মোট খরচ' : 'Total Budgeted Expense'}</span>
              <p className="text-xl font-bold text-rose-600 dark:text-rose-400 font-mono mt-1">
                <PrivacyAmount amount={totalSpentInBudgets} />
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-xs text-slate-400 font-medium">{language === 'bn' ? 'অবশিষ্ট বাজেট মার্জিন' : 'Remaining Margin'}</span>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                <PrivacyAmount amount={Math.max(0, totalBudgeted - totalSpentInBudgets)} />
              </p>
            </div>
          </div>

          {/* Budgets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {budgets.length === 0 ? (
              <div className="col-span-2 p-12 text-center text-slate-400 text-xs bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                {language === 'bn' ? 'কোনো মাসিক বাজেট সেট করা হয়নি। "নতুন বাজেট সেট করুন" বাটনে ক্লিক করে খাবার, বাজার, বা ইউটিলিটির বাজেট নির্ধারণ করুন।' : 'No monthly budgets set yet. Click "Set Budget" to set category spending limits.'}
              </div>
            ) : (
              budgets.map((b) => {
                const spent = transactions
                  .filter((t) => t.type === 'expense' && t.categoryId === b.categoryId && t.date.startsWith(b.month || currentMonth))
                  .reduce((sum, t) => sum + t.amount, 0);

                const pct = Math.round((spent / b.targetAmount) * 100);
                const isExceeded = spent > b.targetAmount;
                const isWarning = pct >= (b.alertThreshold || 80);

                const catObj = categories.find((c) => c.id === b.categoryId);
                const displayName = catObj ? (language === 'bn' ? (catObj.nameBn || catObj.name) : (catObj.name || catObj.nameBn)) : b.categoryName;

                return (
                  <div
                    key={b.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          {displayName}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isExceeded
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            : isWarning
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}>
                          {pct}% {language === 'bn' ? 'ব্যবহৃত' : 'Used'}
                        </span>
                      </div>

                      {/* Amounts */}
                      <div className="flex items-baseline justify-between my-2 text-xs">
                        <div>
                          <span className="text-slate-400 text-[11px]">{language === 'bn' ? 'খরচ হয়েছে: ' : 'Spent: '}</span>
                          <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                            <PrivacyAmount amount={spent} />
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[11px]">{language === 'bn' ? 'বাজেট: ' : 'Budget: '}</span>
                          <span className="font-semibold font-mono text-slate-500">
                            <PrivacyAmount amount={b.targetAmount} />
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden my-2">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isExceeded ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>

                      {isExceeded && (
                        <p className="text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-1 font-medium">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {language === 'bn' ? `বাজেট সীমা অতিক্রম করেছে ${currencySymbol}${Number((spent || 0) - (b.targetAmount || 0)).toLocaleString()}!` : `Budget limit exceeded by ${currencySymbol}${Number((spent || 0) - (b.targetAmount || 0)).toLocaleString()}!`}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">
                        {language === 'bn' ? 'মাস:' : 'Month:'} {b.month || currentMonth}
                      </span>
                      <button
                        onClick={async () => {
                          const confirmMsg = language === 'bn' ? 'এই বাজেটটি মুছে ফেলতে চান?' : 'Are you sure you want to delete this budget?';
                          if (window.confirm(confirmMsg)) {
                            await deleteBudget(b.id);
                          }
                        }}
                        className="text-slate-400 hover:text-rose-600 text-xs"
                      >
                        {language === 'bn' ? 'মুছুন' : 'Delete'}
                      </button>
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 2. SAVINGS GOALS VIEW */}
      {activeTab === 'goals' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {savingsGoals.length === 0 ? (
            <div className="col-span-3 p-12 text-center text-slate-400 text-xs bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              {language === 'bn' ? 'কোনো সঞ্চয় লক্ষ্য যুক্ত করা হয়নি। ইমার্জেন্সি ফান্ড, গাড়ি, বাড়ি, বা নতুন গ্যাজেটের লক্ষ্য তৈরি করুন।' : 'No savings goals added yet. Create a goal for emergency funds, travel, or major purchases.'}
            </div>
          ) : (
            savingsGoals.map((goal) => {
              const pct = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
              const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

              return (
                <div
                  key={goal.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between relative overflow-hidden"
                >
                  <div
                    className="absolute top-0 left-0 right-0 h-1.5"
                    style={{ backgroundColor: goal.color || '#10b981' }}
                  />

                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          {goal.title}
                        </h3>
                        {goal.category && (
                          <span className="text-[10px] text-slate-400 uppercase font-semibold">
                            {goal.category}
                          </span>
                        )}
                      </div>

                      {goal.isCompleted ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> {language === 'bn' ? 'অর্জিত' : 'Completed'}
                        </span>
                      ) : (
                        <span className="text-xs font-bold font-mono text-emerald-600">
                          {pct}%
                        </span>
                      )}
                    </div>

                    {/* Target and Current */}
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">{language === 'bn' ? 'জমা হয়েছে:' : 'Saved:'}</span>
                        <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                          <PrivacyAmount amount={goal.currentAmount} />
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">{language === 'bn' ? 'লক্ষ্যমাত্রা:' : 'Target:'}</span>
                        <span className="font-semibold font-mono text-slate-700 dark:text-slate-300">
                          <PrivacyAmount amount={goal.targetAmount} />
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">{language === 'bn' ? 'আরো প্রয়োজন:' : 'Remaining:'}</span>
                        <span className="font-mono text-rose-500">
                          <PrivacyAmount amount={remaining} />
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden my-3">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: goal.color || '#10b981' }}
                      />
                    </div>

                    {goal.targetDate && (
                      <p className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{language === 'bn' ? 'লক্ষ্য অর্জনের তারিখ:' : 'Target Date:'} {goal.targetDate}</span>
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <button
                      onClick={async () => {
                        const confirmMsg = language === 'bn' ? 'এই লক্ষ্যটি মুছতে চান?' : 'Are you sure you want to delete this goal?';
                        if (window.confirm(confirmMsg)) {
                          await deleteSavingsGoal(goal.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                      title={language === 'bn' ? 'মুছে ফেলুন' : 'Delete'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        setContributeGoal(goal);
                        setContribAmount('');
                        setContribAccId(accounts[0]?.id || '');
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{language === 'bn' ? 'টাকা জমা করুন' : 'Contribute Funds'}</span>
                    </button>
                  </div>

                </div>
              );
            })
          )}
        </div>
      )}

      {/* Add Budget Modal */}
      {showBudgetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {language === 'bn' ? 'নতুন ক্যাটাগরি বাজেট নির্ধারণ' : 'Set Category Budget'}
              </h3>
              <button
                onClick={() => setShowBudgetModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitBudget} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'bn' ? 'ব্যয়ের খাত (Category) *' : 'Expense Category *'}
                </label>
                <select
                  required
                  value={budgetForm.categoryId || ''}
                  onChange={(e) => setBudgetForm({ ...budgetForm, categoryId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                >
                  {expenseCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {language === 'bn' ? (c.nameBn || c.name) : (c.name || c.nameBn)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'bn' ? `মাসিক বাজেট সীমা (${currencySymbol}) *` : `Monthly Budget Limit (${currencySymbol}) *`}
                </label>
                <input
                  type="number"
                  required
                  placeholder={language === 'bn' ? 'যেমন: 20000' : 'e.g. 20000'}
                  value={budgetForm.targetAmount !== undefined && budgetForm.targetAmount !== null ? budgetForm.targetAmount : ''}
                  onChange={(e) => setBudgetForm({ ...budgetForm, targetAmount: e.target.value })}
                  className="w-full px-3 py-2 font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'bn' ? 'সতর্কতা নোটিফিকেশন শতাংশ (%)' : 'Alert Threshold (%)'}
                </label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={budgetForm.alertThreshold !== undefined && budgetForm.alertThreshold !== null ? budgetForm.alertThreshold : 80}
                  onChange={(e) => setBudgetForm({ ...budgetForm, alertThreshold: parseInt(e.target.value) || 80 })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  {language === 'bn' ? `বাজেটের ${budgetForm.alertThreshold}% খরচ হলে সতর্কতা নোটিফিকেশন পাঠানো হবে।` : `Notification will trigger when spending reaches ${budgetForm.alertThreshold}% of budget.`}
                </p>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowBudgetModal(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors shadow-sm"
                >
                  {language === 'bn' ? 'বাজেট সংরক্ষণ করুন' : 'Save Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Savings Goal Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {language === 'bn' ? 'নতুন সঞ্চয় লক্ষ্য তৈরি করুন' : 'Create Savings Goal'}
              </h3>
              <button
                onClick={() => setShowGoalModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitGoal} className="p-6 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'bn' ? 'লক্ষ্যের নাম *' : 'Goal Title *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={language === 'bn' ? 'যেমন: Emergency Fund, MacBook, হজ ফান্ড' : 'e.g. Emergency Fund, MacBook, Vacation'}
                  value={goalForm.title || ''}
                  onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'bn' ? `মোট লক্ষ্যমাত্রা (${currencySymbol}) *` : `Target Amount (${currencySymbol}) *`}
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="150000"
                    value={goalForm.targetAmount !== undefined && goalForm.targetAmount !== null ? goalForm.targetAmount : ''}
                    onChange={(e) => setGoalForm({ ...goalForm, targetAmount: e.target.value })}
                    className="w-full px-3 py-2 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'bn' ? `প্রাথমিক সঞ্চয় (${currencySymbol})` : `Initial Savings (${currencySymbol})`}
                  </label>
                  <input
                    type="number"
                    value={goalForm.currentAmount !== undefined && goalForm.currentAmount !== null ? goalForm.currentAmount : ''}
                    onChange={(e) => setGoalForm({ ...goalForm, currentAmount: e.target.value })}
                    className="w-full px-3 py-2 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'bn' ? 'অর্জনের কাঙ্ক্ষিত তারিখ' : 'Target Date'}
                </label>
                <input
                  type="date"
                  value={goalForm.targetDate || ''}
                  onChange={(e) => setGoalForm({ ...goalForm, targetDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowGoalModal(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors shadow-sm"
                >
                  {language === 'bn' ? 'লক্ষ্য যুক্ত করুন' : 'Save Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contribute to Goal Modal */}
      {contributeGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-emerald-50 dark:bg-emerald-950/40">
              <div>
                <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                  {language === 'bn' ? 'সঞ্চয়ে টাকা জমা' : 'Add Funds to Goal'}
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  {contributeGoal.title} ({language === 'bn' ? 'বাকি' : 'Remaining'}: {currencySymbol}{Number((contributeGoal.targetAmount || 0) - (contributeGoal.currentAmount || 0)).toLocaleString()})
                </p>
              </div>
              <button
                onClick={() => setContributeGoal(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteContribute} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'bn' ? `জমার পরিমাণ (${currencySymbol}) *` : `Amount (${currencySymbol}) *`}
                </label>
                <input
                  type="number"
                  required
                  placeholder="5000"
                  value={contribAmount !== undefined && contribAmount !== null ? contribAmount : ''}
                  onChange={(e) => setContribAmount(e.target.value)}
                  className="w-full px-3 py-2 font-mono font-bold text-base bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'bn' ? 'কোন অ্যাকাউন্ট থেকে জমা করবেন? (ঐচ্ছিক)' : 'From Account (Optional)'}
                </label>
                <select
                  value={contribAccId || ''}
                  onChange={(e) => setContribAccId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                >
                  <option value="">{language === 'bn' ? 'অ্যাকাউন্ট ব্যালেন্স না কমিয়ে সরাসরি যোগ করুন' : 'Direct add without deducting balance'}</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({language === 'bn' ? 'ব্যালেন্স' : 'Balance'}: {currencySymbol}{(a.balance ?? 0).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setContributeGoal(null)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors shadow-sm"
                >
                  {language === 'bn' ? 'জমা নিশ্চিত করুন' : 'Confirm Contribution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
