import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy initialize Gemini API client
let genAI: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!genAI) {
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'FINORA', time: new Date().toISOString() });
});

// AI Financial Assistant Endpoint
app.post('/api/ai-assistant', async (req, res) => {
  try {
    const { question, financialContext, conversationHistory } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      // Return a smart rule-based fallback response if Gemini API key is not configured
      return res.json({
        answer: generateRuleBasedAnswer(question, financialContext),
        source: 'rule-based-engine'
      });
    }

    const systemPrompt = `You are FINORA AI Financial Assistant, a precise, helpful, and empathetic financial advisor for the personal finance web application FINORA (“Take Control of Your Money.” Developed by Md. Ibrahim Hossain, Powered by TIKMERK IT).

CRITICAL DIRECTIVES:
1. ONLY use the provided real financialContext (accounts, transactions, loans, budgets, savings goals, bills, net worth). NEVER invent or fabricate transactions, account balances, or fictional numbers.
2. If the user asks in Bengali (বাংলা), respond in clear, professional, and friendly Bengali. If the user asks in English, respond in English. You can seamlessly understand mixed Bengali and English (Banglish/Bangla).
3. Be precise with calculations and currency (default: ৳ / BDT).
4. When calculating totals, follow FINORA rules:
   - Account transfers are internal movements, NOT income or expense.
   - Borrowed loans increase receiving account and increase liabilities, NOT income.
   - Lent loans decrease source account and increase receivables, NOT expense.
   - Credit card payments decrease bank/cash balance and decrease credit card liability, NOT double expense.
5. Provide actionable insights, highlight overdue bills or budget threshold warnings if relevant, and encourage smart savings.
6. Keep the formatting clean with bullet points and bold amounts.`;

    const userContent = `Here is the user's real-time financial database context:
${JSON.stringify(financialContext, null, 2)}

User Question: "${question}"

Please provide an accurate, helpful answer based strictly on the above real financial data.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userContent}` }] }
      ]
    });

    const answer = response.text || 'কোনো তথ্য পাওয়া যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।';
    res.json({ answer, source: 'gemini-ai' });
  } catch (error: any) {
    console.error('Error in /api/ai-assistant:', error);
    // Fallback gracefully
    const fallbackAnswer = generateRuleBasedAnswer(req.body.question, req.body.financialContext);
    res.json({ answer: fallbackAnswer, source: 'fallback-engine' });
  }
});

// AI Financial Insights Generator
app.post('/api/ai-insights', async (req, res) => {
  try {
    const { financialContext } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        insights: generateRuleBasedInsights(financialContext),
        source: 'rule-based-engine'
      });
    }

    const prompt = `You are FINORA AI Financial Intelligence Engine. Analyze the following real user financial context and generate 4-5 concise, high-value financial insights (Bengali & English friendly, or primarily Bengali with English terms).
Financial context:
${JSON.stringify(financialContext, null, 2)}

Return a JSON array of objects with:
- "title": string (short catchy title in Bengali)
- "type": "info" | "warning" | "success" | "opportunity"
- "message": string (1-2 sentences of specific insight referencing actual numbers)
- "action": string (recommended action)`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { responseMimeType: 'application/json' }
    });

    let insights = [];
    try {
      insights = JSON.parse(response.text || '[]');
    } catch {
      insights = generateRuleBasedInsights(financialContext);
    }

    res.json({ insights, source: 'gemini-ai' });
  } catch (error) {
    console.error('Error in /api/ai-insights:', error);
    res.json({
      insights: generateRuleBasedInsights(req.body.financialContext),
      source: 'fallback-engine'
    });
  }
});

// Rule-based analyzer fallback if API key is not present or offline
function generateRuleBasedAnswer(question: string, context: any = {}): string {
  const q = (question || '').toLowerCase();
  const currency = context.currency || '৳';
  const totalBalance = context.totalBalance || 0;
  const netWorth = context.netWorth || 0;
  const monthlyExpense = context.monthlyExpense || 0;
  const monthlyIncome = context.monthlyIncome || 0;
  const totalLiabilities = context.totalLiabilities || 0;
  const totalReceivables = context.totalReceivables || 0;

  if (q.includes('খরচ') || q.includes('expense') || q.includes('cost')) {
    return `📊 **এই মাসের মোট খরচ:** **${currency}${monthlyExpense.toLocaleString()}**।\nআপনার মোট আয়ের বিপরীতে ব্যয়ের অনুপাত বিশ্লেষণ করে দেখুন এবং বাজেটের মধ্যে থাকার চেষ্টা করুন।`;
  }
  if (q.includes('আয়') || q.includes('income') || q.includes('salary')) {
    return `💵 **এই মাসের মোট আয়:** **${currency}${monthlyIncome.toLocaleString()}**।\nআপনার সঞ্চয়ের হার বাড়াতে আয়ের অন্তত ২০% সেভিংস অ্যাকাউন্টে বা ডিপিএস-এ স্থানান্তর করতে পারেন।`;
  }
  if (q.includes('পাব') || q.includes('ধার দিয়েছি') || q.includes('receivable') || q.includes('lent')) {
    return `🤝 **আপনার মোট পাওনা টাকা (Receivable):** **${currency}${totalReceivables.toLocaleString()}**।\nলেনদেনের বিস্তারিত দেখতে Loans সেকশনের "Lent / দেওয়া ঋণ" ট্যাবটি পরীক্ষা করুন।`;
  }
  if (q.includes('ঋণ') || q.includes('loan') || q.includes('ধার') || q.includes('liability') || q.includes('দিতে হবে')) {
    return `⚠️ **আপনার মোট ঋণ ও দেনা (Total Liabilities):** **${currency}${totalLiabilities.toLocaleString()}**।\nপরিশোধের তারিখ স্মরণ রাখতে FINORA-র রিমাইন্ডার ও লোন রিপেমেন্ট ফিচার ব্যবহার করুন।`;
  }
  if (q.includes('ব্যালেন্স') || q.includes('টাকা আছে') || q.includes('balance') || q.includes('net worth')) {
    return `💰 **বর্তমান মোট অ্যাকাউন্ট ব্যালেন্স:** **${currency}${totalBalance.toLocaleString()}**\n💎 **সর্বমোট নেট ওয়ার্থ (Net Worth):** **${currency}${netWorth.toLocaleString()}**।`;
  }

  return `Finora Financial Data সারসংক্ষেপ:\n• মোট ব্যালেন্স: ${currency}${totalBalance.toLocaleString()}\n• নেট ওয়ার্থ: ${currency}${netWorth.toLocaleString()}\n• এই মাসের আয়: ${currency}${monthlyIncome.toLocaleString()}\n• এই মাসের ব্যয়: ${currency}${monthlyExpense.toLocaleString()}\n• মোট পাওনা: ${currency}${totalReceivables.toLocaleString()}\n• মোট ঋণ: ${currency}${totalLiabilities.toLocaleString()}\n\nআরও নির্দিষ্ট প্রশ্নের জন্য যে কোনো অ্যাকাউন্টের নাম, ক্যাটাগরি বা লেনদেন সম্পর্কে জিজ্ঞাসা করতে পারেন!`;
}

function generateRuleBasedInsights(context: any = []): any[] {
  const currency = context?.currency || '৳';
  const monthlyExpense = context?.monthlyExpense || 0;
  const monthlyIncome = context?.monthlyIncome || 0;
  const savingsRate = monthlyIncome > 0 ? Math.round(((monthlyIncome - monthlyExpense) / monthlyIncome) * 100) : 0;
  const totalLiabilities = context?.totalLiabilities || 0;

  const insights = [];

  if (savingsRate > 25) {
    insights.push({
      title: 'চমৎকার সঞ্চয়ের হার! 🎯',
      type: 'success',
      message: `আপনি চলতি মাসে আপনার আয়ের প্রায় ${savingsRate}% সঞ্চয় করতে পারছেন, যা দারুণ আর্থিক শৃঙ্খলা নির্দেশ করে।`,
      action: 'সঞ্চয়ের কিছু অংশ Investment বা Savings Goal-এ বরাদ্দ করুন'
    });
  } else if (monthlyExpense > monthlyIncome && monthlyIncome > 0) {
    insights.push({
      title: 'ব্যয় আয়ের সীমা অতিক্রম করছে ⚠️',
      type: 'warning',
      message: `চলতি মাসে ব্যয়ের পরিমাণ (${currency}${monthlyExpense.toLocaleString()}) আপনার আয়ের চেয়ে বেশি হয়ে গেছে।`,
      action: 'Food, Shopping ও অন্যান্য ঐচ্ছিক খরচ পর্যালোচনা করুন'
    });
  }

  if (totalLiabilities > 0) {
    insights.push({
      title: 'ঋণ পরিশোধ পরিকল্পনা 📋',
      type: 'info',
      message: `আপনার সর্বমোট বকেয়া ঋণ ও ক্রেডিট কার্ড ব্যালেন্স ${currency}${totalLiabilities.toLocaleString()}।`,
      action: 'নিয়মিত কিস্তি পরিশোধ করে অতিরিক্ত সুদ ও জরিমানা এড়ান'
    });
  }

  insights.push({
    title: 'ইমার্জেন্সি ফান্ড সুরক্ষা 🛡️',
    type: 'opportunity',
    message: 'কমপক্ষে ৩-৬ মাসের জীবিকা নির্বাহের সমপরিমাণ অর্থ একটি সহজে উত্তোলনযোগ্য Savings/Cash অ্যাকাউন্টে রাখুন।',
    action: 'একটি Emergency Fund সেভিংস গোল চালু করুন'
  });

  return insights;
}

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FINORA server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
