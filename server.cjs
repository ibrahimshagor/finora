var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json({ limit: "10mb" }));
var genAI = null;
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!genAI) {
    genAI = new import_genai.GoogleGenAI({ apiKey });
  }
  return genAI;
}
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", app: "FINORA", time: (/* @__PURE__ */ new Date()).toISOString() });
});
app.post("/api/ai-assistant", async (req, res) => {
  try {
    const { question, financialContext, conversationHistory } = req.body;
    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }
    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        answer: generateRuleBasedAnswer(question, financialContext),
        source: "rule-based-engine"
      });
    }
    const systemPrompt = `You are FINORA AI Financial Assistant, a precise, helpful, and empathetic financial advisor for the personal finance web application FINORA (\u201CTake Control of Your Money.\u201D Developed by Md. Ibrahim Hossain, Powered by TIKMERK IT).

CRITICAL DIRECTIVES:
1. ONLY use the provided real financialContext (accounts, transactions, loans, budgets, savings goals, bills, net worth). NEVER invent or fabricate transactions, account balances, or fictional numbers.
2. If the user asks in Bengali (\u09AC\u09BE\u0982\u09B2\u09BE), respond in clear, professional, and friendly Bengali. If the user asks in English, respond in English. You can seamlessly understand mixed Bengali and English (Banglish/Bangla).
3. Be precise with calculations and currency (default: \u09F3 / BDT).
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
      model: "gemini-2.5-flash",
      contents: [
        { role: "user", parts: [{ text: `${systemPrompt}

${userContent}` }] }
      ]
    });
    const answer = response.text || "\u0995\u09CB\u09A8\u09CB \u09A4\u09A5\u09CD\u09AF \u09AA\u09BE\u0993\u09DF\u09BE \u09AF\u09BE\u09DF\u09A8\u09BF\u0964 \u0985\u09A8\u09C1\u0997\u09CD\u09B0\u09B9 \u0995\u09B0\u09C7 \u0986\u09AC\u09BE\u09B0 \u099A\u09C7\u09B7\u09CD\u099F\u09BE \u0995\u09B0\u09C1\u09A8\u0964";
    res.json({ answer, source: "gemini-ai" });
  } catch (error) {
    console.error("Error in /api/ai-assistant:", error);
    const fallbackAnswer = generateRuleBasedAnswer(req.body.question, req.body.financialContext);
    res.json({ answer: fallbackAnswer, source: "fallback-engine" });
  }
});
app.post("/api/ai-insights", async (req, res) => {
  try {
    const { financialContext } = req.body;
    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        insights: generateRuleBasedInsights(financialContext),
        source: "rule-based-engine"
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
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json" }
    });
    let insights = [];
    try {
      insights = JSON.parse(response.text || "[]");
    } catch {
      insights = generateRuleBasedInsights(financialContext);
    }
    res.json({ insights, source: "gemini-ai" });
  } catch (error) {
    console.error("Error in /api/ai-insights:", error);
    res.json({
      insights: generateRuleBasedInsights(req.body.financialContext),
      source: "fallback-engine"
    });
  }
});
function generateRuleBasedAnswer(question, context = {}) {
  const q = (question || "").toLowerCase();
  const currency = context.currency || "\u09F3";
  const totalBalance = context.totalBalance || 0;
  const netWorth = context.netWorth || 0;
  const monthlyExpense = context.monthlyExpense || 0;
  const monthlyIncome = context.monthlyIncome || 0;
  const totalLiabilities = context.totalLiabilities || 0;
  const totalReceivables = context.totalReceivables || 0;
  if (q.includes("\u0996\u09B0\u099A") || q.includes("expense") || q.includes("cost")) {
    return `\u{1F4CA} **\u098F\u0987 \u09AE\u09BE\u09B8\u09C7\u09B0 \u09AE\u09CB\u099F \u0996\u09B0\u099A:** **${currency}${monthlyExpense.toLocaleString()}**\u0964
\u0986\u09AA\u09A8\u09BE\u09B0 \u09AE\u09CB\u099F \u0986\u09AF\u09BC\u09C7\u09B0 \u09AC\u09BF\u09AA\u09B0\u09C0\u09A4\u09C7 \u09AC\u09CD\u09AF\u09AF\u09BC\u09C7\u09B0 \u0985\u09A8\u09C1\u09AA\u09BE\u09A4 \u09AC\u09BF\u09B6\u09CD\u09B2\u09C7\u09B7\u09A3 \u0995\u09B0\u09C7 \u09A6\u09C7\u0996\u09C1\u09A8 \u098F\u09AC\u0982 \u09AC\u09BE\u099C\u09C7\u099F\u09C7\u09B0 \u09AE\u09A7\u09CD\u09AF\u09C7 \u09A5\u09BE\u0995\u09BE\u09B0 \u099A\u09C7\u09B7\u09CD\u099F\u09BE \u0995\u09B0\u09C1\u09A8\u0964`;
  }
  if (q.includes("\u0986\u09AF\u09BC") || q.includes("income") || q.includes("salary")) {
    return `\u{1F4B5} **\u098F\u0987 \u09AE\u09BE\u09B8\u09C7\u09B0 \u09AE\u09CB\u099F \u0986\u09AF\u09BC:** **${currency}${monthlyIncome.toLocaleString()}**\u0964
\u0986\u09AA\u09A8\u09BE\u09B0 \u09B8\u099E\u09CD\u099A\u09AF\u09BC\u09C7\u09B0 \u09B9\u09BE\u09B0 \u09AC\u09BE\u09DC\u09BE\u09A4\u09C7 \u0986\u09DF\u09C7\u09B0 \u0985\u09A8\u09CD\u09A4\u09A4 \u09E8\u09E6% \u09B8\u09C7\u09AD\u09BF\u0982\u09B8 \u0985\u09CD\u09AF\u09BE\u0995\u09BE\u0989\u09A8\u09CD\u099F\u09C7 \u09AC\u09BE \u09A1\u09BF\u09AA\u09BF\u098F\u09B8-\u098F \u09B8\u09CD\u09A5\u09BE\u09A8\u09BE\u09A8\u09CD\u09A4\u09B0 \u0995\u09B0\u09A4\u09C7 \u09AA\u09BE\u09B0\u09C7\u09A8\u0964`;
  }
  if (q.includes("\u09AA\u09BE\u09AC") || q.includes("\u09A7\u09BE\u09B0 \u09A6\u09BF\u09DF\u09C7\u099B\u09BF") || q.includes("receivable") || q.includes("lent")) {
    return `\u{1F91D} **\u0986\u09AA\u09A8\u09BE\u09B0 \u09AE\u09CB\u099F \u09AA\u09BE\u0993\u09A8\u09BE \u099F\u09BE\u0995\u09BE (Receivable):** **${currency}${totalReceivables.toLocaleString()}**\u0964
\u09B2\u09C7\u09A8\u09A6\u09C7\u09A8\u09C7\u09B0 \u09AC\u09BF\u09B8\u09CD\u09A4\u09BE\u09B0\u09BF\u09A4 \u09A6\u09C7\u0996\u09A4\u09C7 Loans \u09B8\u09C7\u0995\u09B6\u09A8\u09C7\u09B0 "Lent / \u09A6\u09C7\u0993\u09DF\u09BE \u098B\u09A3" \u099F\u09CD\u09AF\u09BE\u09AC\u099F\u09BF \u09AA\u09B0\u09C0\u0995\u09CD\u09B7\u09BE \u0995\u09B0\u09C1\u09A8\u0964`;
  }
  if (q.includes("\u098B\u09A3") || q.includes("loan") || q.includes("\u09A7\u09BE\u09B0") || q.includes("liability") || q.includes("\u09A6\u09BF\u09A4\u09C7 \u09B9\u09AC\u09C7")) {
    return `\u26A0\uFE0F **\u0986\u09AA\u09A8\u09BE\u09B0 \u09AE\u09CB\u099F \u098B\u09A3 \u0993 \u09A6\u09C7\u09A8\u09BE (Total Liabilities):** **${currency}${totalLiabilities.toLocaleString()}**\u0964
\u09AA\u09B0\u09BF\u09B6\u09CB\u09A7\u09C7\u09B0 \u09A4\u09BE\u09B0\u09BF\u0996 \u09B8\u09CD\u09AE\u09B0\u09A3 \u09B0\u09BE\u0996\u09A4\u09C7 FINORA-\u09B0 \u09B0\u09BF\u09AE\u09BE\u0987\u09A8\u09CD\u09A1\u09BE\u09B0 \u0993 \u09B2\u09CB\u09A8 \u09B0\u09BF\u09AA\u09C7\u09AE\u09C7\u09A8\u09CD\u099F \u09AB\u09BF\u099A\u09BE\u09B0 \u09AC\u09CD\u09AF\u09AC\u09B9\u09BE\u09B0 \u0995\u09B0\u09C1\u09A8\u0964`;
  }
  if (q.includes("\u09AC\u09CD\u09AF\u09BE\u09B2\u09C7\u09A8\u09CD\u09B8") || q.includes("\u099F\u09BE\u0995\u09BE \u0986\u099B\u09C7") || q.includes("balance") || q.includes("net worth")) {
    return `\u{1F4B0} **\u09AC\u09B0\u09CD\u09A4\u09AE\u09BE\u09A8 \u09AE\u09CB\u099F \u0985\u09CD\u09AF\u09BE\u0995\u09BE\u0989\u09A8\u09CD\u099F \u09AC\u09CD\u09AF\u09BE\u09B2\u09C7\u09A8\u09CD\u09B8:** **${currency}${totalBalance.toLocaleString()}**
\u{1F48E} **\u09B8\u09B0\u09CD\u09AC\u09AE\u09CB\u099F \u09A8\u09C7\u099F \u0993\u09AF\u09BC\u09BE\u09B0\u09CD\u09A5 (Net Worth):** **${currency}${netWorth.toLocaleString()}**\u0964`;
  }
  return `Finora Financial Data \u09B8\u09BE\u09B0\u09B8\u0982\u0995\u09CD\u09B7\u09C7\u09AA:
\u2022 \u09AE\u09CB\u099F \u09AC\u09CD\u09AF\u09BE\u09B2\u09C7\u09A8\u09CD\u09B8: ${currency}${totalBalance.toLocaleString()}
\u2022 \u09A8\u09C7\u099F \u0993\u09AF\u09BC\u09BE\u09B0\u09CD\u09A5: ${currency}${netWorth.toLocaleString()}
\u2022 \u098F\u0987 \u09AE\u09BE\u09B8\u09C7\u09B0 \u0986\u09AF\u09BC: ${currency}${monthlyIncome.toLocaleString()}
\u2022 \u098F\u0987 \u09AE\u09BE\u09B8\u09C7\u09B0 \u09AC\u09CD\u09AF\u09AF\u09BC: ${currency}${monthlyExpense.toLocaleString()}
\u2022 \u09AE\u09CB\u099F \u09AA\u09BE\u0993\u09A8\u09BE: ${currency}${totalReceivables.toLocaleString()}
\u2022 \u09AE\u09CB\u099F \u098B\u09A3: ${currency}${totalLiabilities.toLocaleString()}

\u0986\u09B0\u0993 \u09A8\u09BF\u09B0\u09CD\u09A6\u09BF\u09B7\u09CD\u099F \u09AA\u09CD\u09B0\u09B6\u09CD\u09A8\u09C7\u09B0 \u099C\u09A8\u09CD\u09AF \u09AF\u09C7 \u0995\u09CB\u09A8\u09CB \u0985\u09CD\u09AF\u09BE\u0995\u09BE\u0989\u09A8\u09CD\u099F\u09C7\u09B0 \u09A8\u09BE\u09AE, \u0995\u09CD\u09AF\u09BE\u099F\u09BE\u0997\u09B0\u09BF \u09AC\u09BE \u09B2\u09C7\u09A8\u09A6\u09C7\u09A8 \u09B8\u09AE\u09CD\u09AA\u09B0\u09CD\u0995\u09C7 \u099C\u09BF\u099C\u09CD\u099E\u09BE\u09B8\u09BE \u0995\u09B0\u09A4\u09C7 \u09AA\u09BE\u09B0\u09C7\u09A8!`;
}
function generateRuleBasedInsights(context = []) {
  const currency = context?.currency || "\u09F3";
  const monthlyExpense = context?.monthlyExpense || 0;
  const monthlyIncome = context?.monthlyIncome || 0;
  const savingsRate = monthlyIncome > 0 ? Math.round((monthlyIncome - monthlyExpense) / monthlyIncome * 100) : 0;
  const totalLiabilities = context?.totalLiabilities || 0;
  const insights = [];
  if (savingsRate > 25) {
    insights.push({
      title: "\u099A\u09AE\u09CE\u0995\u09BE\u09B0 \u09B8\u099E\u09CD\u099A\u09DF\u09C7\u09B0 \u09B9\u09BE\u09B0! \u{1F3AF}",
      type: "success",
      message: `\u0986\u09AA\u09A8\u09BF \u099A\u09B2\u09A4\u09BF \u09AE\u09BE\u09B8\u09C7 \u0986\u09AA\u09A8\u09BE\u09B0 \u0986\u09DF\u09C7\u09B0 \u09AA\u09CD\u09B0\u09BE\u09DF ${savingsRate}% \u09B8\u099E\u09CD\u099A\u09DF \u0995\u09B0\u09A4\u09C7 \u09AA\u09BE\u09B0\u099B\u09C7\u09A8, \u09AF\u09BE \u09A6\u09BE\u09B0\u09C1\u09A3 \u0986\u09B0\u09CD\u09A5\u09BF\u0995 \u09B6\u09C3\u0999\u09CD\u0996\u09B2\u09BE \u09A8\u09BF\u09B0\u09CD\u09A6\u09C7\u09B6 \u0995\u09B0\u09C7\u0964`,
      action: "\u09B8\u099E\u09CD\u099A\u09DF\u09C7\u09B0 \u0995\u09BF\u099B\u09C1 \u0985\u0982\u09B6 Investment \u09AC\u09BE Savings Goal-\u098F \u09AC\u09B0\u09BE\u09A6\u09CD\u09A6 \u0995\u09B0\u09C1\u09A8"
    });
  } else if (monthlyExpense > monthlyIncome && monthlyIncome > 0) {
    insights.push({
      title: "\u09AC\u09CD\u09AF\u09DF \u0986\u09DF\u09C7\u09B0 \u09B8\u09C0\u09AE\u09BE \u0985\u09A4\u09BF\u0995\u09CD\u09B0\u09AE \u0995\u09B0\u099B\u09C7 \u26A0\uFE0F",
      type: "warning",
      message: `\u099A\u09B2\u09A4\u09BF \u09AE\u09BE\u09B8\u09C7 \u09AC\u09CD\u09AF\u09DF\u09C7\u09B0 \u09AA\u09B0\u09BF\u09AE\u09BE\u09A3 (${currency}${monthlyExpense.toLocaleString()}) \u0986\u09AA\u09A8\u09BE\u09B0 \u0986\u09DF\u09C7\u09B0 \u099A\u09C7\u09DF\u09C7 \u09AC\u09C7\u09B6\u09BF \u09B9\u09DF\u09C7 \u0997\u09C7\u099B\u09C7\u0964`,
      action: "Food, Shopping \u0993 \u0985\u09A8\u09CD\u09AF\u09BE\u09A8\u09CD\u09AF \u0990\u099A\u09CD\u099B\u09BF\u0995 \u0996\u09B0\u099A \u09AA\u09B0\u09CD\u09AF\u09BE\u09B2\u09CB\u099A\u09A8\u09BE \u0995\u09B0\u09C1\u09A8"
    });
  }
  if (totalLiabilities > 0) {
    insights.push({
      title: "\u098B\u09A3 \u09AA\u09B0\u09BF\u09B6\u09CB\u09A7 \u09AA\u09B0\u09BF\u0995\u09B2\u09CD\u09AA\u09A8\u09BE \u{1F4CB}",
      type: "info",
      message: `\u0986\u09AA\u09A8\u09BE\u09B0 \u09B8\u09B0\u09CD\u09AC\u09AE\u09CB\u099F \u09AC\u0995\u09C7\u09DF\u09BE \u098B\u09A3 \u0993 \u0995\u09CD\u09B0\u09C7\u09A1\u09BF\u099F \u0995\u09BE\u09B0\u09CD\u09A1 \u09AC\u09CD\u09AF\u09BE\u09B2\u09C7\u09A8\u09CD\u09B8 ${currency}${totalLiabilities.toLocaleString()}\u0964`,
      action: "\u09A8\u09BF\u09DF\u09AE\u09BF\u09A4 \u0995\u09BF\u09B8\u09CD\u09A4\u09BF \u09AA\u09B0\u09BF\u09B6\u09CB\u09A7 \u0995\u09B0\u09C7 \u0985\u09A4\u09BF\u09B0\u09BF\u0995\u09CD\u09A4 \u09B8\u09C1\u09A6 \u0993 \u099C\u09B0\u09BF\u09AE\u09BE\u09A8\u09BE \u098F\u09DC\u09BE\u09A8"
    });
  }
  insights.push({
    title: "\u0987\u09AE\u09BE\u09B0\u09CD\u099C\u09C7\u09A8\u09CD\u09B8\u09BF \u09AB\u09BE\u09A8\u09CD\u09A1 \u09B8\u09C1\u09B0\u0995\u09CD\u09B7\u09BE \u{1F6E1}\uFE0F",
    type: "opportunity",
    message: "\u0995\u09AE\u09AA\u0995\u09CD\u09B7\u09C7 \u09E9-\u09EC \u09AE\u09BE\u09B8\u09C7\u09B0 \u099C\u09C0\u09AC\u09BF\u0995\u09BE \u09A8\u09BF\u09B0\u09CD\u09AC\u09BE\u09B9\u09C7\u09B0 \u09B8\u09AE\u09AA\u09B0\u09BF\u09AE\u09BE\u09A3 \u0985\u09B0\u09CD\u09A5 \u098F\u0995\u099F\u09BF \u09B8\u09B9\u099C\u09C7 \u0989\u09A4\u09CD\u09A4\u09CB\u09B2\u09A8\u09AF\u09CB\u0997\u09CD\u09AF Savings/Cash \u0985\u09CD\u09AF\u09BE\u0995\u09BE\u0989\u09A8\u09CD\u099F\u09C7 \u09B0\u09BE\u0996\u09C1\u09A8\u0964",
    action: "\u098F\u0995\u099F\u09BF Emergency Fund \u09B8\u09C7\u09AD\u09BF\u0982\u09B8 \u0997\u09CB\u09B2 \u099A\u09BE\u09B2\u09C1 \u0995\u09B0\u09C1\u09A8"
  });
  return insights;
}
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`FINORA server running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
