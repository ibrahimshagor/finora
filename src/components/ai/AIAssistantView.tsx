import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Lightbulb, 
  RefreshCw,
  User,
  MessageSquare
} from 'lucide-react';
import { useFinance } from '../../context/FinancialContext';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export const AIAssistantView: React.FC = () => {
  const { accounts, transactions, loans, budgets, savingsGoals, netWorth, totalMonthlyIncome, totalMonthlyExpense, currencySymbol } = useFinance();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `স্বাগতম! আমি FINORA-এর পার্সোনাল AI Financial Advisor। আপনার আয়-ব্যয়, ঋণ, মাসিক বাজেট বা ভবিষ্যৎ সঞ্চয়ের পরিকল্পনা নিয়ে যেকোনো প্রশ্ন করতে পারেন। আমি আপনাকে বাংলায় বা ইংরেজিতে পরামর্শ দিতে প্রস্তুত।`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState<string[]>([]);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Generate initial insights based on context
  useEffect(() => {
    generateLocalInsights();
  }, [accounts, transactions, loans, budgets]);

  const generateLocalInsights = () => {
    const list: string[] = [];
    
    // Net worth / savings rate check
    if (totalMonthlyIncome > 0) {
      const savingsRate = Math.round(((totalMonthlyIncome - totalMonthlyExpense) / totalMonthlyIncome) * 100);
      if (savingsRate >= 25) {
        list.push(`দারুণ অগ্রগতি! চলতি মাসে আপনার সঞ্চয়ের হার প্রায় ${savingsRate}%, যা আর্থিক স্থিতিশীলতার জন্য চমৎকার।`);
      } else if (savingsRate < 10 && savingsRate >= 0) {
        list.push(`সতর্কতা: আপনার চলতি মাসের সঞ্চয়ের হার ${savingsRate}%। অপ্রয়োজনীয় ডাইনিং বা অনলাইন শপিং কমিয়ে এটি ২০%-এ উন্নীত করার চেষ্টা করুন।`);
      } else if (savingsRate < 0) {
        list.push(`জরুরি অ্যালার্ট: চলতি মাসে আপনার ব্যয় (৳${Number(totalMonthlyExpense || 0).toLocaleString()}) আপনার আয়ের (৳${Number(totalMonthlyIncome || 0).toLocaleString()}) চেয়ে বেশি! অবিলম্বে বাজেট চেক করুন।`);
      }
    }

    // Active loan check
    const activeLoans = loans.filter((l) => l.type === 'borrowed' && l.status === 'active');
    if (activeLoans.length > 0) {
      const totalDue = activeLoans.reduce((s, l) => s + (l.remainingAmount || 0), 0);
      list.push(`আপনার মোট দেনা/ঋণ বাকি রয়েছে ৳${Number(totalDue || 0).toLocaleString()}। উচ্চ সুদের ঋণ থাকলে তা আগে পরিশোধ করতে 'Avalanche' পদ্ধতি ব্যবহার করুন।`);
    }

    // Credit card check
    const creditCards = accounts.filter((a) => a.type === 'credit_card' && (a.balance || 0) < 0);
    if (creditCards.length > 0) {
      const totalCCDebt = creditCards.reduce((s, a) => s + Math.abs(a.balance || 0), 0);
      list.push(`ক্রেডিট কার্ডে ৳${Number(totalCCDebt || 0).toLocaleString()} বকেয়া রয়েছে। বিলম্ব মাশুল বা অতিরিক্ত সুদ এড়াতে ডিউ ডেটের আগেই সম্পূর্ণ স্টেটমেন্ট পরিশোধ করুন।`);
    }

    // Emergency fund check
    const emergencyGoal = savingsGoals.find((g) => g.title.toLowerCase().includes('emergency') || g.title.toLowerCase().includes('ইমার্জেন্সি'));
    if (!emergencyGoal) {
      list.push(`পরামর্শ: অন্তত ৩ থেকে ৬ মাসের জীবনযাত্রার খরচের সমপরিমাণ একটি 'Emergency Fund' সঞ্চয় লক্ষ্য তৈরি করুন।`);
    }

    setInsights(list);
  };

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || inputValue;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = {
      id: String(Date.now()),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInputValue('');
    setIsLoading(true);

    try {
      // Create comprehensive financial snapshot for AI
      const financialSnapshot = {
        currency: currencySymbol,
        netWorth,
        monthlyIncome: totalMonthlyIncome,
        monthlyExpense: totalMonthlyExpense,
        accounts: accounts.map((a) => ({ name: a.name, type: a.type, balance: a.balance })),
        recentTransactions: transactions.slice(0, 15).map((t) => ({
          date: t.date,
          type: t.type,
          amount: t.amount,
          desc: t.description || t.subcategory || t.categoryId,
        })),
        loans: loans.map((l) => ({
          type: l.type,
          person: l.personName,
          total: l.totalAmount,
          remaining: l.remainingAmount,
        })),
        budgets: budgets.map((b) => ({ category: b.categoryName, target: b.targetAmount })),
      };

      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSend,
          financialData: financialSnapshot,
        }),
      });

      if (!response.ok) {
        throw new Error('AI Server responded with error');
      }

      const data = await response.json();

      const aiMsg: Message = {
        id: String(Date.now() + 1),
        sender: 'assistant',
        text: data.reply || 'দুঃখিত, কোনো উত্তর পাওয়া যায়নি। অনুগ্রহ করে পুনরায় চেষ্টা করুন।',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      // Graceful offline intelligent fallback
      const fallbackReplies: { [key: string]: string } = {
        'default': `আপনার বর্তমান আর্থিক অবস্থা অনুযায়ী:
• চলতি মাসে আয়: ${currencySymbol}${Number(totalMonthlyIncome || 0).toLocaleString()}
• চলতি মাসে ব্যয়: ${currencySymbol}${Number(totalMonthlyExpense || 0).toLocaleString()}
• নিট অবস্থান: ${(totalMonthlyIncome || 0) - (totalMonthlyExpense || 0) >= 0 ? 'উদ্বৃত্ত (Surplus)' : 'ঘাটতি (Deficit)'}

পরামর্শ: আপনার ৫০/৩০/২০ বাজেটিং নিয়ম অনুসরণ করা উচিত — ৫০% প্রয়োজনীয় খরচে, ৩০% ব্যক্তিগত ইচ্ছেতে এবং ২০% সরাসরি সঞ্চয় বা বিনিয়োগে।`,
      };

      const aiMsg: Message = {
        id: String(Date.now() + 1),
        sender: 'assistant',
        text: fallbackReplies.default,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    'আমার বর্তমান আর্থিক স্বাস্থ্যের সামগ্রিক বিশ্লেষণ দিন',
    'চলতি মাসে খরচ কমানোর ৩টি বাস্তবসম্মত কৌশল কী হতে পারে?',
    'আমার ঋণগুলো দ্রুত পরিশোধ করার সেরা প্ল্যান তৈরি করে দিন',
    'ইমার্জেন্সি ফান্ড কীভাবে ধাপে ধাপে গুছাবো?',
  ];

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-xs">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              FINORA AI স্মার্ট ফাইন্যান্সিয়াল অ্যাসিস্ট্যান্ট
              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
                Gemini Powered
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              আপনার ব্যক্তিগত আর্থিক তথ্য বিশ্লেষণ করে বাস্তবসম্মত পরামর্শ ও গাইডলাইন প্রদানকারী।
            </p>
          </div>
        </div>
      </div>

      {/* Smart Insight Cards */}
      {insights.length > 0 && (
        <div className="bg-emerald-50/60 dark:bg-emerald-950/20 rounded-2xl p-4 border border-emerald-200/60 dark:border-emerald-800/60 space-y-2">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>লাইভ স্মার্ট ফাইন্যান্সিয়াল রিকমেন্ডেশনস</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {insights.map((ins, idx) => (
              <div
                key={idx}
                className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-100 dark:border-emerald-900/60 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2.5 shadow-2xs"
              >
                <Lightbulb className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>{ins}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Chat Interface */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col h-[520px] overflow-hidden">
        
        {/* Messages Scroll Area */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                msg.sender === 'user'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-emerald-600 text-white'
              }`}>
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className={`max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed whitespace-pre-wrap ${
                msg.sender === 'user'
                  ? 'bg-slate-900 text-white dark:bg-emerald-600 dark:text-white rounded-tr-none'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200/60 dark:border-slate-700/60'
              }`}>
                <p>{msg.text}</p>
                <span className={`text-[10px] block mt-1.5 opacity-60 ${
                  msg.sender === 'user' ? 'text-right text-slate-300' : 'text-slate-400'
                }`}>
                  {msg.timestamp}
                </span>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white flex-shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-4 text-xs text-slate-500 dark:text-slate-400 rounded-tl-none flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                <span>FINORA AI আপনার আর্থিক হিসাব বিশ্লেষণ করছে...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center gap-2 overflow-x-auto scrollbar-none">
          {quickPrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(prompt)}
              className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-500 rounded-xl text-[11px] font-medium whitespace-nowrap transition-colors flex-shrink-0 shadow-2xs"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Chat Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="আপনার আর্থিক প্রশ্ন বা জিজ্ঞাসা লিখুন..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="p-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl transition-colors shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>

    </div>
  );
};
