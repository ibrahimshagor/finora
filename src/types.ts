export type AccountType = 
  | 'cash' 
  | 'bank' 
  | 'savings' 
  | 'wallet' 
  | 'loan' 
  | 'credit_card' 
  | 'investment' 
  | 'other';

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  institutionName?: string;
  accountNumber?: string;
  balance: number;
  initialBalance: number;
  creditLimit?: number; // For credit cards
  billingDate?: number; // Day of month
  dueDate?: number; // Day of month
  isHidden?: boolean; // If hidden, excluded from dashboard totals
  color: string;
  icon: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type TransactionType = 
  | 'income' 
  | 'expense' 
  | 'transfer' 
  | 'loan_taken' 
  | 'loan_given' 
  | 'loan_repayment' 
  | 'loan_collection' 
  | 'credit_card_payment';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  date: string; // ISO date string YYYY-MM-DD or full timestamp
  accountId: string; // Source account (or primary account)
  targetAccountId?: string; // Destination account for transfers / loans / CC payments
  loanId?: string; // Linked loan ID
  categoryId: string;
  subcategory?: string;
  payerPayee?: string; // Person or Merchant
  description?: string;
  notes?: string;
  tags?: string[];
  receiptUrl?: string; // URL or base64 image
  isRecurring?: boolean;
  status?: 'cleared' | 'pending' | 'reconciled';
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  nameBn?: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  subcategories: string[];
  isCustom?: boolean;
  isDisabled?: boolean;
}

export interface Loan {
  id: string;
  userId: string;
  type: 'borrowed' | 'lent'; // 'borrowed' = I took money (Liability); 'lent' = I gave money (Asset / Receivable)
  personName: string;
  contactInfo?: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  startDate: string;
  dueDate?: string;
  interestRate?: number;
  accountId?: string; // Primary linked account
  status: 'active' | 'settled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  categoryName: string;
  targetAmount: number;
  period: 'monthly' | 'custom';
  month: string; // YYYY-MM
  alertThreshold: number; // Percentage e.g. 80
  createdAt: string;
  updatedAt?: string;
}

export interface SavingsGoal {
  id: string;
  userId: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  category?: string;
  linkedAccountId?: string;
  isCompleted?: boolean;
  color?: string;
  icon?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface BillSubscription {
  id: string;
  userId: string;
  title: string;
  amount: number;
  category: string;
  frequency: 'monthly' | 'yearly' | 'quarterly' | 'weekly';
  dueDate: string; // YYYY-MM-DD
  reminderDays: number;
  autopay?: boolean;
  status: 'unpaid' | 'paid' | 'overdue';
  lastPaidDate?: string;
  accountId?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export type Bill = BillSubscription;

export interface Investment {
  id: string;
  userId: string;
  name: string;
  type: 'dps' | 'fdr' | 'stocks' | 'mutual_fund' | 'gold' | 'crypto' | 'real_estate' | 'other';
  investedAmount: number;
  currentValue: number;
  expectedReturnRate?: number;
  startDate: string;
  purchaseDate?: string;
  buyPrice?: number;
  maturityDate?: string;
  institution?: string;
  linkedAccountId?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface UserProfile {
  userId: string;
  email: string;
  displayName: string;
  photoURL?: string;
  currency: string;
  currencySymbol: string;
  theme: 'light' | 'dark' | 'system';
  privacyMode: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialSummary {
  totalBalance: number; // Sum of active asset accounts (Cash, Bank, Savings, Wallet, Other)
  totalAssets: number; // Total balance + Total Receivables + Total Investments
  totalLiabilities: number; // Total Borrowed Loans + Credit Card Outstanding
  netWorth: number; // Total Assets - Total Liabilities
  monthlyIncome: number; // Current month pure income
  monthlyExpense: number; // Current month pure expense (including CC purchases)
  monthlySavings: number; // Income - Expense
  totalReceivables: number; // Money owed to me (Loans given remaining)
  totalPayables: number; // Money I owe to others (Loans borrowed remaining + CC due)
}

export interface AccountStatement {
  account: Account;
  startDate: string;
  endDate: string;
  openingBalance: number;
  totalIncome: number;
  totalExpense: number;
  totalTransferIn: number;
  totalTransferOut: number;
  totalLoanReceipts: number;
  totalLoanPayments: number;
  netChange: number;
  closingBalance: number;
  transactions: Transaction[];
}

export interface FinancialInsight {
  title: string;
  type: 'info' | 'warning' | 'success' | 'opportunity';
  message: string;
  action?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'bill_due' | 'loan_due' | 'budget_alert' | 'savings_milestone' | 'info';
  date: string;
  isRead: boolean;
  actionUrl?: string;
}
