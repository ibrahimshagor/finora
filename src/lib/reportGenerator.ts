import { Account, Transaction, Loan, Budget, SavingsGoal, BillSubscription, Investment, Category } from '../types';

// CSV string creator with UTF-8 BOM so Excel opens Bengali correctly
export function downloadCSV(filename: string, csvContent: string) {
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Printable HTML Window Opener that renders a clean, professional print layout
export function openPrintableReport(title: string, htmlContent: string) {
  const printWindow = window.open('', '_blank', 'width=900,height=750');
  if (!printWindow) {
    // If popup is blocked in iframe, create a hidden printable iframe or trigger alert
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);
    
    const doc = printFrame.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(getReportHTMLTemplate(title, htmlContent));
      doc.close();
      setTimeout(() => {
        printFrame.contentWindow?.focus();
        printFrame.contentWindow?.print();
        setTimeout(() => document.body.removeChild(printFrame), 2000);
      }, 500);
    }
    return;
  }

  printWindow.document.open();
  printWindow.document.write(getReportHTMLTemplate(title, htmlContent));
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 400);
}

function getReportHTMLTemplate(title: string, bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <title>${title} - FINORA Report</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Hind Siliguri", "Noto Sans Bengali", Arial, sans-serif;
      color: #1e293b;
      background: #fff;
      padding: 32px;
      line-height: 1.5;
      font-size: 13px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #059669;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .brand {
      font-size: 24px;
      font-weight: 800;
      color: #059669;
      letter-spacing: -0.5px;
    }
    .brand-sub {
      font-size: 11px;
      color: #64748b;
      font-weight: 500;
    }
    .report-title {
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
      margin-top: 4px;
    }
    .meta-box {
      text-align: right;
      font-size: 11px;
      color: #64748b;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 12px;
      margin-bottom: 24px;
    }
    .kpi-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px;
    }
    .kpi-label {
      font-size: 11px;
      color: #64748b;
      margin-bottom: 4px;
    }
    .kpi-val {
      font-size: 16px;
      font-weight: 700;
      font-family: "Courier New", monospace;
      color: #0f172a;
    }
    .kpi-income { color: #059669; }
    .kpi-expense { color: #dc2626; }
    .kpi-balance { color: #2563eb; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 16px;
      margin-bottom: 24px;
      font-size: 12px;
    }
    th {
      background: #f1f5f9;
      color: #334155;
      text-align: left;
      padding: 8px 10px;
      font-weight: 600;
      border-bottom: 2px solid #cbd5e1;
    }
    td {
      padding: 8px 10px;
      border-bottom: 1px solid #e2e8f0;
      color: #334155;
    }
    tr:nth-child(even) {
      background: #f8fafc;
    }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .amount-in { color: #059669; font-weight: 600; font-family: monospace; }
    .amount-out { color: #dc2626; font-weight: 600; font-family: monospace; }
    .footer {
      margin-top: 32px;
      padding-top: 12px;
      border-top: 1px dashed #cbd5e1;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #94a3b8;
    }
    @media print {
      body { padding: 12px; }
      .no-print { display: none; }
      @page { margin: 1.5cm; }
    }
  </style>
</head>
<body>
  ${bodyContent}
</body>
</html>`;
}

// 1. Single Account Statement Report (PDF/Print & CSV)
export function generateAccountReport(
  account: Account,
  transactions: Transaction[],
  currencySymbol: string,
  startDate?: string,
  endDate?: string
) {
  // Filter txs
  let filtered = transactions.filter((t) => t.accountId === account.id || t.targetAccountId === account.id);
  if (startDate) {
    filtered = filtered.filter((t) => t.date >= startDate);
  }
  if (endDate) {
    filtered = filtered.filter((t) => t.date <= endDate);
  }

  // Sort ascending by date for statement
  const sorted = [...filtered].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let totalIn = 0;
  let totalOut = 0;

  sorted.forEach((t) => {
    if (t.type === 'income' || t.targetAccountId === account.id) {
      totalIn += t.amount;
    } else if (t.type === 'expense' || t.type === 'transfer' || t.type === 'loan_repayment' || t.type === 'credit_card_payment') {
      totalOut += t.amount;
    }
  });

  const title = `${account.name} - হিসাব বিবরণী (Statement)`;

  const html = `
    <div class="header">
      <div>
        <div class="brand">FINORA</div>
        <div class="brand-sub">ব্যক্তিগত ফাইন্যান্স ম্যানেজমেন্ট সিস্টেম</div>
        <div class="report-title">${title}</div>
        <div style="font-size: 12px; color: #475569; margin-top: 2px;">
          অ্যাকাউন্টের ধরন: <strong>${account.type.toUpperCase()}</strong> | প্রতিষ্ঠান: <strong>${account.institutionName || 'N/A'}</strong> ${account.accountNumber ? `| অ্যাকাউন্ট নং: ${account.accountNumber}` : ''}
        </div>
      </div>
      <div class="meta-box">
        <div>তারিখ: <strong>${new Date().toLocaleDateString('bn-BD')}</strong></div>
        <div>সময়কাল: <strong>${startDate ? startDate : 'শুরু থেকে'}</strong> হতে <strong>${endDate ? endDate : 'বর্তমান'}</strong></div>
        <div>মোট লেনদেন: <strong>${sorted.length} টি</strong></div>
      </div>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">মোট জমা / আয় (Total Inflow)</div>
        <div class="kpi-val kpi-income">+${currencySymbol}${totalIn.toLocaleString()}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">মোট খরচ / উত্তোলন (Total Outflow)</div>
        <div class="kpi-val kpi-expense">-${currencySymbol}${totalOut.toLocaleString()}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">বর্তমান স্থিতি (Current Balance)</div>
        <div class="kpi-val kpi-balance">${currencySymbol}${(account.balance ?? 0).toLocaleString()}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 15%;">তারিখ</th>
          <th style="width: 15%;">ধরন</th>
          <th style="width: 30%;">বিবরণ / প্রাপক / খাত</th>
          <th style="width: 20%;" class="text-right">জমা (Inflow)</th>
          <th style="width: 20%;" class="text-right">খরচ (Outflow)</th>
        </tr>
      </thead>
      <tbody>
        ${sorted.length === 0 ? `<tr><td colspan="5" class="text-center" style="padding: 24px; color: #94a3b8;">কোনো লেনদেন পাওয়া যায়নি</td></tr>` : ''}
        ${sorted.map((t) => {
          const isCredit = t.type === 'income' || t.targetAccountId === account.id;
          return `
            <tr>
              <td>${t.date}</td>
              <td><span style="font-size: 10px; text-transform: uppercase; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-weight: 600;">${t.type}</span></td>
              <td>
                <div style="font-weight: 600; color: #0f172a;">${t.description || t.payerPayee || 'লেনদেন'}</div>
                ${t.subcategory ? `<div style="font-size: 10px; color: #64748b;">${t.subcategory}</div>` : ''}
              </td>
              <td class="text-right">
                ${isCredit ? `<span class="amount-in">+${currencySymbol}${t.amount.toLocaleString()}</span>` : '-'}
              </td>
              <td class="text-right">
                ${!isCredit ? `<span class="amount-out">-${currencySymbol}${t.amount.toLocaleString()}</span>` : '-'}
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>

    <div class="footer">
      <div>FINORA Financial Suite • Generated on ${new Date().toLocaleString()}</div>
      <div>পৃষ্ঠা ১ / ১</div>
    </div>
  `;

  return {
    print: () => openPrintableReport(title, html),
    downloadCSV: () => {
      const headers = ['Date', 'Type', 'Description', 'Category', 'Payer/Payee', 'Inflow (Credit)', 'Outflow (Debit)'];
      const rows = sorted.map((t) => {
        const isCredit = t.type === 'income' || t.targetAccountId === account.id;
        return [
          `"${t.date}"`,
          `"${t.type}"`,
          `"${(t.description || '').replace(/"/g, '""')}"`,
          `"${(t.categoryId || '').replace(/"/g, '""')}"`,
          `"${(t.payerPayee || '').replace(/"/g, '""')}"`,
          isCredit ? t.amount : 0,
          !isCredit ? t.amount : 0
        ].join(',');
      });
      const csv = [headers.join(','), ...rows].join('\n');
      downloadCSV(`FINORA_Account_${account.name.replace(/\s+/g, '_')}_Statement`, csv);
    }
  };
}

// 2. All Accounts Combined Statement / Summary Report
export function generateAllAccountsReport(
  accounts: Account[],
  transactions: Transaction[],
  currencySymbol: string,
  startDate?: string,
  endDate?: string
) {
  let filtered = [...transactions];
  if (startDate) filtered = filtered.filter((t) => t.date >= startDate);
  if (endDate) filtered = filtered.filter((t) => t.date <= endDate);

  const sorted = [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalAssets = accounts.filter(a => a.type !== 'credit_card').reduce((s, a) => s + (a.balance || 0), 0);
  const totalDebts = accounts.filter(a => a.type === 'credit_card').reduce((s, a) => s + Math.abs(a.balance || 0), 0);
  const netAccountBalance = totalAssets - totalDebts;

  const title = `সকল অ্যাকাউন্টের সম্মিলিত বিবরণী ও স্থিতি (All Accounts Report)`;

  const html = `
    <div class="header">
      <div>
        <div class="brand">FINORA</div>
        <div class="brand-sub">ব্যক্তিগত ফাইন্যান্স ম্যানেজমেন্ট সিস্টেম</div>
        <div class="report-title">${title}</div>
      </div>
      <div class="meta-box">
        <div>তারিখ: <strong>${new Date().toLocaleDateString('bn-BD')}</strong></div>
        <div>মোট অ্যাকাউন্ট: <strong>${accounts.length} টি</strong></div>
        <div>মোট লেনদেন: <strong>${sorted.length} টি</strong></div>
      </div>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">মোট সম্পদ / ব্যালেন্স (Assets)</div>
        <div class="kpi-val kpi-income">${currencySymbol}${totalAssets.toLocaleString()}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">মোট ক্রেডিট দায় (Credit Card Debt)</div>
        <div class="kpi-val kpi-expense">${currencySymbol}${totalDebts.toLocaleString()}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">প্রকৃত নিট স্থিতি (Net Balance)</div>
        <div class="kpi-val kpi-balance">${currencySymbol}${netAccountBalance.toLocaleString()}</div>
      </div>
    </div>

    <h3 style="font-size: 13px; font-weight: 700; color: #1e293b; margin-top: 16px;">১. অ্যাকাউন্টসমূহের বর্তমান স্থিতি তালিকা:</h3>
    <table>
      <thead>
        <tr>
          <th>অ্যাকাউন্টের নাম</th>
          <th>ধরন (Type)</th>
          <th>ব্যাংক / প্রতিষ্ঠান</th>
          <th>অ্যাকাউন্ট নং</th>
          <th class="text-right">বর্তমান ব্যালেন্স</th>
        </tr>
      </thead>
      <tbody>
        ${accounts.map(a => `
          <tr>
            <td style="font-weight: 600;">${a.name}</td>
            <td><span style="font-size: 10px; text-transform: uppercase; background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${a.type}</span></td>
            <td>${a.institutionName || '-'}</td>
            <td>${a.accountNumber || '-'}</td>
            <td class="text-right font-mono" style="font-weight: 700; color: ${a.type === 'credit_card' ? '#dc2626' : '#059669'};">
              ${currencySymbol}${(a.balance ?? 0).toLocaleString()}
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <h3 style="font-size: 13px; font-weight: 700; color: #1e293b; margin-top: 24px;">২. সাম্প্রতিক সমন্বিত লেনদেনসমূহ:</h3>
    <table>
      <thead>
        <tr>
          <th>তারিখ</th>
          <th>অ্যাকাউন্ট</th>
          <th>ধরন</th>
          <th>বিবরণ / খাত</th>
          <th class="text-right">পরিমাণ</th>
        </tr>
      </thead>
      <tbody>
        ${sorted.slice(0, 50).map(t => {
          const acc = accounts.find(a => a.id === t.accountId);
          return `
            <tr>
              <td>${t.date}</td>
              <td style="font-weight: 600;">${acc ? acc.name : 'অ্যাকাউন্ট'}</td>
              <td><span style="font-size: 10px; text-transform: uppercase;">${t.type}</span></td>
              <td>${t.description || t.payerPayee || '-'}</td>
              <td class="text-right" style="font-weight: 700; font-family: monospace; color: ${t.type === 'income' ? '#059669' : '#dc2626'};">
                ${t.type === 'income' ? '+' : '-'}${currencySymbol}${t.amount.toLocaleString()}
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>

    <div class="footer">
      <div>FINORA Financial Suite • Generated on ${new Date().toLocaleString()}</div>
      <div>পৃষ্ঠা ১ / ১</div>
    </div>
  `;

  return {
    print: () => openPrintableReport(title, html),
    downloadCSV: () => {
      const headers = ['Date', 'Account Name', 'Type', 'Description', 'Payer/Payee', 'Amount'];
      const rows = sorted.map((t) => {
        const acc = accounts.find(a => a.id === t.accountId);
        return [
          `"${t.date}"`,
          `"${(acc ? acc.name : '').replace(/"/g, '""')}"`,
          `"${t.type}"`,
          `"${(t.description || '').replace(/"/g, '""')}"`,
          `"${(t.payerPayee || '').replace(/"/g, '""')}"`,
          t.amount
        ].join(',');
      });
      const csv = [headers.join(','), ...rows].join('\n');
      downloadCSV(`FINORA_All_Accounts_Master_Report`, csv);
    }
  };
}

// 3. Loans & Debts Report (PDF/Print & CSV)
export function generateLoansReport(
  loans: Loan[],
  currencySymbol: string
) {
  const borrowed = loans.filter(l => l.type === 'borrowed');
  const lent = loans.filter(l => l.type === 'lent');

  const totalBorrowedRemaining = borrowed.reduce((s, l) => s + (l.remainingAmount || 0), 0);
  const totalLentRemaining = lent.reduce((s, l) => s + (l.remainingAmount || 0), 0);
  const netLoanPosition = totalLentRemaining - totalBorrowedRemaining;

  const title = `ঋণ ও দেনা-পাওনা পূর্ণাঙ্গ রিপোর্ট (Loans & Debts Audit)`;

  const html = `
    <div class="header">
      <div>
        <div class="brand">FINORA</div>
        <div class="brand-sub">ব্যক্তিগত ফাইন্যান্স ম্যানেজমেন্ট সিস্টেম</div>
        <div class="report-title">${title}</div>
      </div>
      <div class="meta-box">
        <div>তারিখ: <strong>${new Date().toLocaleDateString('bn-BD')}</strong></div>
        <div>মোট ঋণ এন্ট্রি: <strong>${loans.length} টি</strong></div>
      </div>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">মোট গৃহীত ঋণ (বাকি দেনা)</div>
        <div class="kpi-val kpi-expense">${currencySymbol}${totalBorrowedRemaining.toLocaleString()}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">মোট প্রদত্ত ঋণ (পাওনা টাকা)</div>
        <div class="kpi-val kpi-income">${currencySymbol}${totalLentRemaining.toLocaleString()}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">নিট ঋণ স্থিতি (Net Balance)</div>
        <div class="kpi-val kpi-balance">${currencySymbol}${netLoanPosition.toLocaleString()}</div>
      </div>
    </div>

    <h3 style="font-size: 13px; font-weight: 700; color: #1e293b; margin-top: 16px;">১. গৃহীত ঋণ (যে টাকা পরিশোধ করতে হবে):</h3>
    <table>
      <thead>
        <tr>
          <th>ব্যক্তি / প্রতিষ্ঠানের নাম</th>
          <th>যোগাযোগ</th>
          <th>শুরুর তারিখ</th>
          <th>পরিশোধের শেষ তারিখ</th>
          <th class="text-right">মোট পরিমাণ</th>
          <th class="text-right">পরিশোধিত</th>
          <th class="text-right">অবশিষ্ট বকেয়া</th>
        </tr>
      </thead>
      <tbody>
        ${borrowed.length === 0 ? `<tr><td colspan="7" class="text-center" style="padding: 16px; color: #94a3b8;">কোনো গৃহীত ঋণ নেই</td></tr>` : ''}
        ${borrowed.map(l => `
          <tr>
            <td style="font-weight: 600;">${l.personName}</td>
            <td>${l.contactInfo || '-'}</td>
            <td>${l.startDate}</td>
            <td>${l.dueDate || '-'}</td>
            <td class="text-right font-mono">${currencySymbol}${l.totalAmount.toLocaleString()}</td>
            <td class="text-right font-mono" style="color: #059669;">${currencySymbol}${(l.paidAmount || 0).toLocaleString()}</td>
            <td class="text-right font-mono" style="font-weight: 700; color: #dc2626;">${currencySymbol}${l.remainingAmount.toLocaleString()}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <h3 style="font-size: 13px; font-weight: 700; color: #1e293b; margin-top: 24px;">২. প্রদত্ত ঋণ (যে টাকা আপনি পাবেন):</h3>
    <table>
      <thead>
        <tr>
          <th>ব্যক্তি / প্রতিষ্ঠানের নাম</th>
          <th>যোগাযোগ</th>
          <th>শুরুর তারিখ</th>
          <th>পরিশোধের শেষ তারিখ</th>
          <th class="text-right">মোট পরিমাণ</th>
          <th class="text-right">আদায়কৃত</th>
          <th class="text-right">অবশিষ্ট পাওনা</th>
        </tr>
      </thead>
      <tbody>
        ${lent.length === 0 ? `<tr><td colspan="7" class="text-center" style="padding: 16px; color: #94a3b8;">কোনো প্রদত্ত ঋণ নেই</td></tr>` : ''}
        ${lent.map(l => `
          <tr>
            <td style="font-weight: 600;">${l.personName}</td>
            <td>${l.contactInfo || '-'}</td>
            <td>${l.startDate}</td>
            <td>${l.dueDate || '-'}</td>
            <td class="text-right font-mono">${currencySymbol}${l.totalAmount.toLocaleString()}</td>
            <td class="text-right font-mono" style="color: #059669;">${currencySymbol}${(l.paidAmount || 0).toLocaleString()}</td>
            <td class="text-right font-mono" style="font-weight: 700; color: #059669;">${currencySymbol}${l.remainingAmount.toLocaleString()}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="footer">
      <div>FINORA Financial Suite • Generated on ${new Date().toLocaleString()}</div>
      <div>পৃষ্ঠা ১ / ১</div>
    </div>
  `;

  return {
    print: () => openPrintableReport(title, html),
    downloadCSV: () => {
      const headers = ['Type', 'Person Name', 'Contact', 'Start Date', 'Due Date', 'Total Amount', 'Paid/Collected', 'Remaining'];
      const rows = loans.map((l) => [
        `"${l.type}"`,
        `"${l.personName.replace(/"/g, '""')}"`,
        `"${(l.contactInfo || '').replace(/"/g, '""')}"`,
        `"${l.startDate}"`,
        `"${l.dueDate || ''}"`,
        l.totalAmount,
        l.paidAmount || 0,
        l.remainingAmount
      ].join(','));
      const csv = [headers.join(','), ...rows].join('\n');
      downloadCSV(`FINORA_Loans_Report`, csv);
    }
  };
}

// 4. Credit Cards Report
export function generateCreditCardsReport(
  cards: Account[],
  currencySymbol: string
) {
  const title = `ক্রেডিট কার্ড বিবরণী ও ব্যবহার রিপোর্ট (Credit Cards Audit)`;

  const totalLimit = cards.reduce((s, c) => s + (c.creditLimit || 0), 0);
  const totalOutstanding = cards.reduce((s, c) => s + Math.abs(c.balance || 0), 0);
  const totalAvailable = Math.max(0, totalLimit - totalOutstanding);

  const html = `
    <div class="header">
      <div>
        <div class="brand">FINORA</div>
        <div class="brand-sub">ব্যক্তিগত ফাইন্যান্স ম্যানেজমেন্ট সিস্টেম</div>
        <div class="report-title">${title}</div>
      </div>
      <div class="meta-box">
        <div>তারিখ: <strong>${new Date().toLocaleDateString('bn-BD')}</strong></div>
        <div>মোট কার্ড: <strong>${cards.length} টি</strong></div>
      </div>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">মোট ক্রেডিট লিমিট (Total Limit)</div>
        <div class="kpi-val">${currencySymbol}${totalLimit.toLocaleString()}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">মোট ব্যবহৃত বকেয়া (Outstanding)</div>
        <div class="kpi-val kpi-expense">${currencySymbol}${totalOutstanding.toLocaleString()}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">উপলব্ধ ক্রেডিট (Available Credit)</div>
        <div class="kpi-val kpi-income">${currencySymbol}${totalAvailable.toLocaleString()}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>কার্ডের নাম</th>
          <th>ব্যাংক / ইস্যুকারী</th>
          <th>বিলিং তারিখ</th>
          <th>বিল পরিশোধের শেষ তারিখ</th>
          <th class="text-right">ক্রেডিট লিমিট</th>
          <th class="text-right">ব্যবহৃত বকেয়া</th>
          <th class="text-right">ব্যবহার হার (%)</th>
        </tr>
      </thead>
      <tbody>
        ${cards.length === 0 ? `<tr><td colspan="7" class="text-center" style="padding: 16px; color: #94a3b8;">কোনো ক্রেডিট কার্ড নেই</td></tr>` : ''}
        ${cards.map(c => {
          const used = Math.abs(c.balance || 0);
          const limit = c.creditLimit || 1;
          const ratio = Math.round((used / limit) * 100);
          return `
            <tr>
              <td style="font-weight: 600;">${c.name}</td>
              <td>${c.institutionName || '-'}</td>
              <td>মাসের ${c.billingDate || 1} তারিখ</td>
              <td>মাসের ${c.dueDate || 15} তারিখ</td>
              <td class="text-right font-mono">${currencySymbol}${(c.creditLimit || 0).toLocaleString()}</td>
              <td class="text-right font-mono" style="font-weight: 700; color: #dc2626;">${currencySymbol}${used.toLocaleString()}</td>
              <td class="text-right font-mono" style="font-weight: 600; color: ${ratio > 70 ? '#dc2626' : ratio > 30 ? '#d97706' : '#059669'};">${ratio}%</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>

    <div class="footer">
      <div>FINORA Financial Suite • Generated on ${new Date().toLocaleString()}</div>
      <div>পৃষ্ঠা ১ / ১</div>
    </div>
  `;

  return {
    print: () => openPrintableReport(title, html),
    downloadCSV: () => {
      const headers = ['Card Name', 'Bank', 'Billing Date', 'Due Date', 'Credit Limit', 'Outstanding Balance', 'Utilization (%)'];
      const rows = cards.map((c) => {
        const used = Math.abs(c.balance || 0);
        const limit = c.creditLimit || 1;
        const ratio = Math.round((used / limit) * 100);
        return [
          `"${c.name.replace(/"/g, '""')}"`,
          `"${(c.institutionName || '').replace(/"/g, '""')}"`,
          c.billingDate || 1,
          c.dueDate || 15,
          c.creditLimit || 0,
          used,
          `${ratio}%`
        ].join(',');
      });
      const csv = [headers.join(','), ...rows].join('\n');
      downloadCSV(`FINORA_Credit_Cards_Report`, csv);
    }
  };
}

// 5. Bills & Subscriptions Report
export function generateBillsReport(
  bills: BillSubscription[],
  currencySymbol: string
) {
  const title = `ইউটিলিটি বিল ও সাবস্ক্রিপশন সূচি রিপোর্ট (Bills & Subscriptions)`;

  const totalMonthlyCommitment = bills.reduce((s, b) => s + b.amount, 0);

  const html = `
    <div class="header">
      <div>
        <div class="brand">FINORA</div>
        <div class="brand-sub">ব্যক্তিগত ফাইন্যান্স ম্যানেজমেন্ট সিস্টেম</div>
        <div class="report-title">${title}</div>
      </div>
      <div class="meta-box">
        <div>তারিখ: <strong>${new Date().toLocaleDateString('bn-BD')}</strong></div>
        <div>মোট বিল: <strong>${bills.length} টি</strong></div>
      </div>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">মাসিক মোট বিলের বাজেট</div>
        <div class="kpi-val kpi-expense">${currencySymbol}${totalMonthlyCommitment.toLocaleString()}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">মোট সক্রিয় সাবস্ক্রিপশন</div>
        <div class="kpi-val">${bills.length} টি</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>বিলের শিরোনাম</th>
          <th>ক্যাটাগরি</th>
          <th>সময়কাল (Frequency)</th>
          <th>পরিশোধের শেষ তারিখ</th>
          <th>স্ট্যাটাস</th>
          <th class="text-right">পরিমাণ</th>
        </tr>
      </thead>
      <tbody>
        ${bills.length === 0 ? `<tr><td colspan="6" class="text-center" style="padding: 16px; color: #94a3b8;">কোনো বিল এন্ট্রি নেই</td></tr>` : ''}
        ${bills.map(b => `
          <tr>
            <td style="font-weight: 600;">${b.title}</td>
            <td>${b.category}</td>
            <td style="text-transform: uppercase;">${b.frequency}</td>
            <td>${b.dueDate}</td>
            <td><span style="font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 4px; background: ${b.status === 'paid' ? '#dcfce7; color: #166534;' : '#fee2e2; color: #991b1b;'}">${b.status.toUpperCase()}</span></td>
            <td class="text-right font-mono" style="font-weight: 700;">${currencySymbol}${b.amount.toLocaleString()}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="footer">
      <div>FINORA Financial Suite • Generated on ${new Date().toLocaleString()}</div>
      <div>পৃষ্ঠা ১ / ১</div>
    </div>
  `;

  return {
    print: () => openPrintableReport(title, html),
    downloadCSV: () => {
      const headers = ['Title', 'Category', 'Frequency', 'Due Date', 'Status', 'Amount'];
      const rows = bills.map((b) => [
        `"${b.title.replace(/"/g, '""')}"`,
        `"${b.category.replace(/"/g, '""')}"`,
        `"${b.frequency}"`,
        `"${b.dueDate}"`,
        `"${b.status}"`,
        b.amount
      ].join(','));
      const csv = [headers.join(','), ...rows].join('\n');
      downloadCSV(`FINORA_Bills_Report`, csv);
    }
  };
}

// 6. Budgets & Savings Goals Report
export function generateBudgetsGoalsReport(
  budgets: Budget[],
  goals: SavingsGoal[],
  transactions: Transaction[],
  categories: Category[],
  currencySymbol: string
) {
  const title = `বাজেট ও সঞ্চয় লক্ষ্যমাত্রা পারফরম্যান্স রিপোর্ট (Budgets & Goals)`;

  const currentMonth = new Date().toISOString().substring(0, 7);

  const html = `
    <div class="header">
      <div>
        <div class="brand">FINORA</div>
        <div class="brand-sub">ব্যক্তিগত ফাইন্যান্স ম্যানেজমেন্ট সিস্টেম</div>
        <div class="report-title">${title}</div>
      </div>
      <div class="meta-box">
        <div>মাস: <strong>${currentMonth}</strong></div>
        <div>তারিখ: <strong>${new Date().toLocaleDateString('bn-BD')}</strong></div>
      </div>
    </div>

    <h3 style="font-size: 13px; font-weight: 700; color: #1e293b; margin-top: 16px;">১. বাজেট পর্যবেক্ষণ (Budgets):</h3>
    <table>
      <thead>
        <tr>
          <th>খাত / ক্যাটাগরি</th>
          <th class="text-right">বাজেট লিমিট</th>
          <th class="text-right">চলতি মাসে খরচ</th>
          <th class="text-right">অবশিষ্ট বাজেট</th>
          <th class="text-right">ব্যবহার (%)</th>
        </tr>
      </thead>
      <tbody>
        ${budgets.map(b => {
          const cat = categories.find(c => c.id === b.categoryId);
          const spent = transactions
            .filter(t => t.type === 'expense' && t.categoryId === b.categoryId && t.date.startsWith(currentMonth))
            .reduce((s, t) => s + t.amount, 0);
          const remaining = b.targetAmount - spent;
          const pct = Math.round((spent / (b.targetAmount || 1)) * 100);
          return `
            <tr>
              <td style="font-weight: 600;">${cat?.nameBn || b.categoryName || b.categoryId}</td>
              <td class="text-right font-mono">${currencySymbol}${b.targetAmount.toLocaleString()}</td>
              <td class="text-right font-mono" style="color: #dc2626;">${currencySymbol}${spent.toLocaleString()}</td>
              <td class="text-right font-mono" style="font-weight: 700; color: ${remaining >= 0 ? '#059669' : '#dc2626'};">${currencySymbol}${remaining.toLocaleString()}</td>
              <td class="text-right font-mono" style="font-weight: 700; color: ${pct > 100 ? '#dc2626' : pct > 80 ? '#d97706' : '#059669'};">${pct}%</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>

    <h3 style="font-size: 13px; font-weight: 700; color: #1e293b; margin-top: 24px;">২. সঞ্চয় লক্ষ্যমাত্রা (Savings Goals):</h3>
    <table>
      <thead>
        <tr>
          <th>লক্ষ্যমাত্রার নাম</th>
          <th>টার্গেট তারিখ</th>
          <th class="text-right">টার্গেট পরিমাণ</th>
          <th class="text-right">জমা হয়েছে</th>
          <th class="text-right">বাকি প্রয়োজন</th>
          <th class="text-right">অর্জিত (%)</th>
        </tr>
      </thead>
      <tbody>
        ${goals.map(g => {
          const remaining = Math.max(0, g.targetAmount - g.currentAmount);
          const pct = Math.round((g.currentAmount / (g.targetAmount || 1)) * 100);
          return `
            <tr>
              <td style="font-weight: 600;">${g.title}</td>
              <td>${g.targetDate || '-'}</td>
              <td class="text-right font-mono">${currencySymbol}${g.targetAmount.toLocaleString()}</td>
              <td class="text-right font-mono" style="color: #059669; font-weight: 600;">${currencySymbol}${g.currentAmount.toLocaleString()}</td>
              <td class="text-right font-mono">${currencySymbol}${remaining.toLocaleString()}</td>
              <td class="text-right font-mono" style="font-weight: 700; color: #059669;">${pct}%</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>

    <div class="footer">
      <div>FINORA Financial Suite • Generated on ${new Date().toLocaleString()}</div>
      <div>পৃষ্ঠা ১ / ১</div>
    </div>
  `;

  return {
    print: () => openPrintableReport(title, html),
    downloadCSV: () => {
      const headers = ['Type', 'Title / Category', 'Target Amount', 'Current / Spent', 'Progress (%)'];
      const budgetRows = budgets.map((b) => {
        const cat = categories.find(c => c.id === b.categoryId);
        const spent = transactions
          .filter(t => t.type === 'expense' && t.categoryId === b.categoryId && t.date.startsWith(currentMonth))
          .reduce((s, t) => s + t.amount, 0);
        return [
          `"Budget"`,
          `"${(cat?.nameBn || b.categoryName || b.categoryId).replace(/"/g, '""')}"`,
          b.targetAmount,
          spent,
          `${Math.round((spent / (b.targetAmount || 1)) * 100)}%`
        ].join(',');
      });
      const goalRows = goals.map((g) => [
        `"Savings Goal"`,
        `"${g.title.replace(/"/g, '""')}"`,
        g.targetAmount,
        g.currentAmount,
        `${Math.round((g.currentAmount / (g.targetAmount || 1)) * 100)}%`
      ].join(','));

      const csv = [headers.join(','), ...budgetRows, ...goalRows].join('\n');
      downloadCSV(`FINORA_Budgets_Goals_Report`, csv);
    }
  };
}

// 7. Investments Portfolio Report
export function generateInvestmentsReport(
  investments: Investment[],
  currencySymbol: string
) {
  const title = `বিনিয়োগ পোর্টফোলিও ও রিটার্ন রিপোর্ট (Investments Portfolio)`;

  const totalInvested = investments.reduce((s, i) => s + (i.investedAmount || 0), 0);
  const totalCurrentValue = investments.reduce((s, i) => s + (i.currentValue || i.investedAmount || 0), 0);
  const totalGainLoss = totalCurrentValue - totalInvested;
  const returnRate = totalInvested > 0 ? ((totalGainLoss / totalInvested) * 100).toFixed(2) : '0';

  const html = `
    <div class="header">
      <div>
        <div class="brand">FINORA</div>
        <div class="brand-sub">ব্যক্তিগত ফাইন্যান্স ম্যানেজমেন্ট সিস্টেম</div>
        <div class="report-title">${title}</div>
      </div>
      <div class="meta-box">
        <div>তারিখ: <strong>${new Date().toLocaleDateString('bn-BD')}</strong></div>
        <div>মোট সম্পদ এন্ট্রি: <strong>${investments.length} টি</strong></div>
      </div>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">মোট বিনিয়োগ মূলধন (Invested)</div>
        <div class="kpi-val">${currencySymbol}${totalInvested.toLocaleString()}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">বর্তমান বাজারমূল্য (Market Value)</div>
        <div class="kpi-val kpi-balance">${currencySymbol}${totalCurrentValue.toLocaleString()}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">মোট লাভ / ক্ষতি (Gain/Loss)</div>
        <div class="kpi-val ${totalGainLoss >= 0 ? 'kpi-income' : 'kpi-expense'}">
          ${totalGainLoss >= 0 ? '+' : ''}${currencySymbol}${totalGainLoss.toLocaleString()} (${returnRate}%)
        </div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>সম্পদ / স্কিমের নাম</th>
          <th>ক্যাটাগরি</th>
          <th>প্রতিষ্ঠান</th>
          <th>বিনিয়োগ তারিখ</th>
          <th class="text-right">ক্রয়মূল্য / মূলধন</th>
          <th class="text-right">বর্তমান মূল্য</th>
          <th class="text-right">রিটার্ন (%)</th>
        </tr>
      </thead>
      <tbody>
        ${investments.map(i => {
          const val = i.currentValue || i.investedAmount;
          const profit = val - i.investedAmount;
          const pct = i.investedAmount > 0 ? ((profit / i.investedAmount) * 100).toFixed(1) : '0';
          return `
            <tr>
              <td style="font-weight: 600;">${i.name}</td>
              <td style="text-transform: uppercase;">${i.type}</td>
              <td>${i.institution || '-'}</td>
              <td>${i.startDate || '-'}</td>
              <td class="text-right font-mono">${currencySymbol}${i.investedAmount.toLocaleString()}</td>
              <td class="text-right font-mono" style="font-weight: 700;">${currencySymbol}${val.toLocaleString()}</td>
              <td class="text-right font-mono" style="font-weight: 700; color: ${profit >= 0 ? '#059669' : '#dc2626'};">${profit >= 0 ? '+' : ''}${pct}%</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>

    <div class="footer">
      <div>FINORA Financial Suite • Generated on ${new Date().toLocaleString()}</div>
      <div>পৃষ্ঠা ১ / ১</div>
    </div>
  `;

  return {
    print: () => openPrintableReport(title, html),
    downloadCSV: () => {
      const headers = ['Name', 'Type', 'Institution', 'Purchase Date', 'Invested Amount', 'Current Value', 'Gain/Loss'];
      const rows = investments.map((i) => {
        const val = i.currentValue || i.investedAmount;
        const profit = val - i.investedAmount;
        return [
          `"${i.name.replace(/"/g, '""')}"`,
          `"${i.type}"`,
          `"${(i.institution || '').replace(/"/g, '""')}"`,
          `"${i.startDate || ''}"`,
          i.investedAmount,
          val,
          profit
        ].join(',');
      });
      const csv = [headers.join(','), ...rows].join('\n');
      downloadCSV(`FINORA_Investments_Report`, csv);
    }
  };
}

// 8. Master Analytics & Custom Date Range Report
export function generateAnalyticsReport(
  periodLabel: string,
  transactions: Transaction[],
  categories: Category[],
  accounts: Account[],
  currencySymbol: string,
  startDate?: string,
  endDate?: string
) {
  let filtered = [...transactions];
  if (startDate) filtered = filtered.filter(t => t.date >= startDate);
  if (endDate) filtered = filtered.filter(t => t.date <= endDate);

  const totalIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

  // Category breakdown
  const catExpenseMap: { [key: string]: number } = {};
  filtered.filter(t => t.type === 'expense').forEach(t => {
    const cat = categories.find(c => c.id === t.categoryId);
    const name = cat?.nameBn || t.categoryId || 'অন্যান্য';
    catExpenseMap[name] = (catExpenseMap[name] || 0) + t.amount;
  });

  const title = `আর্থিক আয়-ব্যয় ও পর্যায়বৃত্ত রিপোর্ট (${periodLabel})`;

  const html = `
    <div class="header">
      <div>
        <div class="brand">FINORA</div>
        <div class="brand-sub">ব্যক্তিগত ফাইন্যান্স ম্যানেজমেন্ট সিস্টেম</div>
        <div class="report-title">${title}</div>
      </div>
      <div class="meta-box">
        <div>সময়কাল: <strong>${periodLabel}</strong></div>
        <div>তারিখ: <strong>${new Date().toLocaleDateString('bn-BD')}</strong></div>
        <div>মোট লেনদেন: <strong>${filtered.length} টি</strong></div>
      </div>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">মোট আয় (Total Income)</div>
        <div class="kpi-val kpi-income">+${currencySymbol}${totalIncome.toLocaleString()}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">মোট ব্যয় (Total Expense)</div>
        <div class="kpi-val kpi-expense">-${currencySymbol}${totalExpense.toLocaleString()}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">নিট সঞ্চয় (Net Savings)</div>
        <div class="kpi-val ${netSavings >= 0 ? 'kpi-income' : 'kpi-expense'}">${currencySymbol}${netSavings.toLocaleString()}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">সঞ্চয়ের হার (Savings Rate)</div>
        <div class="kpi-val kpi-balance">${savingsRate}%</div>
      </div>
    </div>

    <h3 style="font-size: 13px; font-weight: 700; color: #1e293b; margin-top: 16px;">১. খাতভিত্তিক ব্যয় বিভাজন (Expense by Category):</h3>
    <table>
      <thead>
        <tr>
          <th>ব্যয়ের খাত</th>
          <th class="text-right">পরিমাণ</th>
          <th class="text-right">মোট ব্যয়ের শতাংশ (%)</th>
        </tr>
      </thead>
      <tbody>
        ${Object.entries(catExpenseMap).sort((a, b) => b[1] - a[1]).map(([catName, amount]) => {
          const pct = totalExpense > 0 ? ((amount / totalExpense) * 100).toFixed(1) : '0';
          return `
            <tr>
              <td style="font-weight: 600;">${catName}</td>
              <td class="text-right font-mono" style="font-weight: 600; color: #dc2626;">${currencySymbol}${amount.toLocaleString()}</td>
              <td class="text-right font-mono">${pct}%</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>

    <h3 style="font-size: 13px; font-weight: 700; color: #1e293b; margin-top: 24px;">২. এই সময়কালের সকল লেনদেনের পূর্ণাঙ্গ তালিকা:</h3>
    <table>
      <thead>
        <tr>
          <th>তারিখ</th>
          <th>অ্যাকাউন্ট</th>
          <th>ধরন</th>
          <th>খাত ও বিবরণ</th>
          <th class="text-right">পরিমাণ</th>
        </tr>
      </thead>
      <tbody>
        ${filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(t => {
          const acc = accounts.find(a => a.id === t.accountId);
          const cat = categories.find(c => c.id === t.categoryId);
          return `
            <tr>
              <td>${t.date}</td>
              <td style="font-weight: 600;">${acc ? acc.name : '-'}</td>
              <td><span style="font-size: 10px; text-transform: uppercase;">${t.type}</span></td>
              <td>
                <div style="font-weight: 600;">${t.description || t.payerPayee || '-'}</div>
                <div style="font-size: 10px; color: #64748b;">${cat?.nameBn || t.categoryId || ''}</div>
              </td>
              <td class="text-right font-mono" style="font-weight: 700; color: ${t.type === 'income' ? '#059669' : '#dc2626'};">
                ${t.type === 'income' ? '+' : '-'}${currencySymbol}${t.amount.toLocaleString()}
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>

    <div class="footer">
      <div>FINORA Financial Suite • Generated on ${new Date().toLocaleString()}</div>
      <div>পৃষ্ঠা ১ / ১</div>
    </div>
  `;

  return {
    print: () => openPrintableReport(title, html),
    downloadCSV: () => {
      const headers = ['Date', 'Account', 'Type', 'Category', 'Description', 'Payer/Payee', 'Amount'];
      const rows = filtered.map(t => {
        const acc = accounts.find(a => a.id === t.accountId);
        const cat = categories.find(c => c.id === t.categoryId);
        return [
          `"${t.date}"`,
          `"${(acc ? acc.name : '').replace(/"/g, '""')}"`,
          `"${t.type}"`,
          `"${(cat?.nameBn || t.categoryId || '').replace(/"/g, '""')}"`,
          `"${(t.description || '').replace(/"/g, '""')}"`,
          `"${(t.payerPayee || '').replace(/"/g, '""')}"`,
          t.amount
        ].join(',');
      });
      const csv = [headers.join(','), ...rows].join('\n');
      downloadCSV(`FINORA_Financial_Report_${periodLabel.replace(/\s+/g, '_')}`, csv);
    }
  };
}
