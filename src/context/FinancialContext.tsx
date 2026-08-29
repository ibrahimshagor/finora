import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  writeBatch 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { 
  Account, 
  Transaction, 
  Category, 
  Loan, 
  Budget, 
  SavingsGoal, 
  BillSubscription, 
  Investment, 
  FinancialSummary, 
  FinancialInsight, 
  AppNotification,
  AccountStatement
} from '../types';
import { 
  DEFAULT_ACCOUNTS, 
  DEFAULT_INCOME_CATEGORIES, 
  DEFAULT_EXPENSE_CATEGORIES, 
  CURRENCIES 
} from '../lib/constants';
import { 
  getAutoBackupConfig, 
  saveAutoBackupConfig, 
  createBackupSnapshot, 
  saveSnapshot 
} from '../lib/autoBackupManager';
import { 
  getStoredGoogleDriveToken, 
  uploadBackupFileToDrive, 
  getGoogleDriveSettings 
} from '../lib/googleDriveBackup';

interface FinancialContextType {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  loans: Loan[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  bills: BillSubscription[];
  investments: Investment[];
  currency: string;
  currencySymbol: string;
  language: 'bn' | 'en';
  privacyMode: boolean;
  theme: 'light' | 'dark';
  notifications: AppNotification[];
  insights: FinancialInsight[];
  summary: FinancialSummary;
  loading: boolean;
  syncStatus: 'synced' | 'syncing' | 'offline' | 'error';
  setCurrency: (code: string) => void;
  setCurrencySymbol: (symbolOrCode: string) => void;
  setLanguage: (lang: 'bn' | 'en') => void;
  setPrivacyMode: (val: boolean) => void;
  togglePrivacyMode: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;
  
  // Account Operations
  addAccount: (account: Omit<Account, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateAccount: (id: string, updates: Partial<Account>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  toggleHideAccount: (id: string) => Promise<void>;
  
  // Transaction Operations
  addTransaction: (tx: Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  
  // Transfer Operations
  transferFunds: (params: {
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    date: string;
    description?: string;
    notes?: string;
  }) => Promise<string>;

  // Loan Operations
  addLoan: (params: {
    type: 'borrowed' | 'lent';
    personName: string;
    contactInfo?: string;
    totalAmount: number;
    targetAccountId: string; // Cash or Bank where money is received/given
    startDate: string;
    dueDate?: string;
    interestRate?: number;
    notes?: string;
  }) => Promise<string>;
  repayBorrowedLoan: (params: {
    loanId: string;
    amount: number;
    fromAccountId: string;
    date: string;
    notes?: string;
  }) => Promise<void>;
  collectLentLoan: (params: {
    loanId: string;
    amount: number;
    toAccountId: string;
    date: string;
    notes?: string;
  }) => Promise<void>;
  deleteLoan: (id: string) => Promise<void>;

  // Credit Card Operations
  payCreditCardBill: (params: {
    creditCardAccountId: string;
    fromAccountId: string;
    amount: number;
    date: string;
    notes?: string;
  }) => Promise<void>;

  // Budget Operations
  addBudget: (budget: Omit<Budget, 'id' | 'userId' | 'createdAt'>) => Promise<string>;
  updateBudget: (id: string, updates: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;

  // Savings Goal Operations
  addSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'userId' | 'createdAt'>) => Promise<string>;
  updateSavingsGoal: (id: string, updates: Partial<SavingsGoal>) => Promise<void>;
  deleteSavingsGoal: (id: string) => Promise<void>;
  contributeToGoal: (goalId: string, amount: number, fromAccountId?: string) => Promise<void>;

  // Bill Operations
  addBill: (bill: Omit<BillSubscription, 'id' | 'userId' | 'createdAt'>) => Promise<string>;
  updateBill: (id: string, updates: Partial<BillSubscription>) => Promise<void>;
  deleteBill: (id: string) => Promise<void>;
  payBill: (billId: string, fromAccountId: string, paidDate: string) => Promise<void>;

  // Investment Operations
  addInvestment: (inv: Omit<Investment, 'id' | 'userId' | 'createdAt'>) => Promise<string>;
  updateInvestment: (id: string, updates: Partial<Investment>) => Promise<void>;
  deleteInvestment: (id: string) => Promise<void>;

  // Category Operations
  addCategory: (cat: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  // Statement & Tools
  getAccountStatement: (accountId: string, startDate?: string, endDate?: string) => AccountStatement | null;
  exportDataJSON: () => string;
  importDataJSON: (jsonStr: string) => Promise<boolean>;
  resetAllData: () => Promise<void>;
  exportFullDataJSON: () => string;
  importFullDataJSON: (jsonStr: string) => Promise<boolean>;
  resetToDemoData: () => Promise<void>;
  syncAllDataToFirestore: () => Promise<{ success: boolean; count: number }>;
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

export const FinancialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isGuest } = useAuth();
  const userId = user?.uid || 'guest_default_user';

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([
    ...DEFAULT_INCOME_CATEGORIES,
    ...DEFAULT_EXPENSE_CATEGORIES
  ]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [bills, setBills] = useState<BillSubscription[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [currency, setCurrencyState] = useState<string>('BDT');
  const [language, setLanguageState] = useState<'bn' | 'en'>('bn');
  const [privacyMode, setPrivacyModeState] = useState<boolean>(false);
  const [theme, setThemeState] = useState<'light' | 'dark'>('light');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [insights, setInsights] = useState<FinancialInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error'>('synced');

  // Load preferences from localStorage
  useEffect(() => {
    const savedCurrency = localStorage.getItem('finora_currency') || 'BDT';
    const savedLanguage = (localStorage.getItem('finora_language') as 'bn' | 'en') || 'bn';
    const savedPrivacy = localStorage.getItem('finora_privacy') === 'true';
    const savedTheme = (localStorage.getItem('finora_theme') as 'light' | 'dark') || 'light';
    setCurrencyState(savedCurrency);
    setLanguageState(savedLanguage);
    setPrivacyModeState(savedPrivacy);
    setThemeState(savedTheme);
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const setCurrency = (code: string) => {
    setCurrencyState(code);
    localStorage.setItem('finora_currency', code);
  };

  const setCurrencySymbol = (symbolOrCode: string) => {
    const found = CURRENCIES.find((c) => c.symbol === symbolOrCode || c.code === symbolOrCode);
    const code = found ? found.code : symbolOrCode;
    setCurrency(code);
  };

  const setLanguage = (lang: 'bn' | 'en') => {
    setLanguageState(lang);
    localStorage.setItem('finora_language', lang);
  };

  const setPrivacyMode = (val: boolean) => {
    setPrivacyModeState(val);
    localStorage.setItem('finora_privacy', String(val));
  };

  const togglePrivacyMode = () => {
    setPrivacyModeState((prev) => {
      const next = !prev;
      localStorage.setItem('finora_privacy', String(next));
      return next;
    });
  };

  const setTheme = (t: 'light' | 'dark') => {
    setThemeState(t);
    localStorage.setItem('finora_theme', t);
    if (t === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const currencySymbol = useMemo(() => {
    const found = CURRENCIES.find((c) => c.code === currency);
    return found ? found.symbol : '৳';
  }, [currency]);

  // Fallback Local Storage Loader & Saver
  const loadFromLocalStorage = useCallback(() => {
    try {
      const storedAccs = localStorage.getItem(`finora_${userId}_accounts`);
      const storedTxs = localStorage.getItem(`finora_${userId}_transactions`);
      const storedLoans = localStorage.getItem(`finora_${userId}_loans`);
      const storedBudgets = localStorage.getItem(`finora_${userId}_budgets`);
      const storedGoals = localStorage.getItem(`finora_${userId}_goals`);
      const storedBills = localStorage.getItem(`finora_${userId}_bills`);
      const storedInvs = localStorage.getItem(`finora_${userId}_investments`);
      const storedCats = localStorage.getItem(`finora_${userId}_categories`);

      if (storedAccs) setAccounts(JSON.parse(storedAccs));
      else seedInitialData();

      if (storedTxs) setTransactions(JSON.parse(storedTxs));
      if (storedLoans) setLoans(JSON.parse(storedLoans));
      if (storedBudgets) setBudgets(JSON.parse(storedBudgets));
      if (storedGoals) setSavingsGoals(JSON.parse(storedGoals));
      if (storedBills) setBills(JSON.parse(storedBills));
      if (storedInvs) setInvestments(JSON.parse(storedInvs));
      if (storedCats) setCategories(JSON.parse(storedCats));
    } catch (e) {
      console.error('Error loading local storage:', e);
      seedInitialData();
    }
  }, [userId]);

  const saveToLocalStorage = useCallback((key: string, data: any) => {
    try {
      localStorage.setItem(`finora_${userId}_${key}`, JSON.stringify(data));
    } catch (e) {
      console.warn('Local storage write error:', e);
    }
  }, [userId]);

  // Initial Seed Data Generator for rich first-run experience
  const seedInitialData = useCallback(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const initialAccounts: Account[] = DEFAULT_ACCOUNTS.map((acc, index) => ({
      id: `acc_${Date.now()}_${index}`,
      userId,
      ...acc,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    }));

    const sampleTxs: Transaction[] = [
      {
        id: `tx_${Date.now()}_1`,
        userId,
        type: 'income',
        amount: 65000,
        date: todayStr,
        accountId: initialAccounts[1].id, // City Bank
        categoryId: 'cat_inc_salary',
        subcategory: 'Monthly Salary',
        payerPayee: 'Tech Innovators Ltd.',
        description: 'Monthly professional salary credited',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
      {
        id: `tx_${Date.now()}_2`,
        userId,
        type: 'expense',
        amount: 8500,
        date: todayStr,
        accountId: initialAccounts[0].id, // Cash
        categoryId: 'cat_exp_grocery',
        subcategory: 'Daily Market',
        payerPayee: 'Shwapno Super Shop',
        description: 'Weekly household bazaar and groceries',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
      {
        id: `tx_${Date.now()}_3`,
        userId,
        type: 'expense',
        amount: 1750,
        date: todayStr,
        accountId: initialAccounts[2].id, // bKash
        categoryId: 'cat_exp_utilities',
        subcategory: 'Internet WiFi',
        payerPayee: 'AmberIT Broadband',
        description: 'Monthly high-speed fiber internet bill',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      }
    ];

    const sampleLoans: Loan[] = [
      {
        id: `loan_${Date.now()}_1`,
        userId,
        type: 'borrowed',
        personName: 'Mr. Rafiqul Islam (Friend)',
        contactInfo: '01711223344',
        totalAmount: 50000,
        paidAmount: 20000,
        remainingAmount: 30000,
        startDate: new Date(now.getTime() - 30 * 86400000).toISOString().split('T')[0],
        dueDate: new Date(now.getTime() + 60 * 86400000).toISOString().split('T')[0],
        status: 'active',
        notes: 'Borrowed for urgent project equipment procurement',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
      {
        id: `loan_${Date.now()}_2`,
        userId,
        type: 'lent',
        personName: 'Tanvir Ahmed (Colleague)',
        contactInfo: '01899887766',
        totalAmount: 25000,
        paidAmount: 10000,
        remainingAmount: 15000,
        startDate: new Date(now.getTime() - 15 * 86400000).toISOString().split('T')[0],
        dueDate: new Date(now.getTime() + 20 * 86400000).toISOString().split('T')[0],
        status: 'active',
        notes: 'Temporary personal advance loan',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      }
    ];

    const sampleBudgets: Budget[] = [
      {
        id: `bgt_${Date.now()}_1`,
        userId,
        categoryId: 'cat_exp_food',
        categoryName: 'Food & Dining',
        targetAmount: 18000,
        period: 'monthly',
        month: todayStr.substring(0, 7),
        alertThreshold: 80,
        createdAt: now.toISOString(),
      },
      {
        id: `bgt_${Date.now()}_2`,
        userId,
        categoryId: 'cat_exp_grocery',
        categoryName: 'Grocery & Bazaar',
        targetAmount: 25000,
        period: 'monthly',
        month: todayStr.substring(0, 7),
        alertThreshold: 85,
        createdAt: now.toISOString(),
      }
    ];

    const sampleGoals: SavingsGoal[] = [
      {
        id: `goal_${Date.now()}_1`,
        userId,
        title: 'Emergency Rainy Day Fund',
        targetAmount: 150000,
        currentAmount: 95000,
        targetDate: new Date(now.getFullYear() + 1, 11, 31).toISOString().split('T')[0],
        category: 'Safety',
        color: '#10b981',
        icon: 'ShieldCheck',
        notes: '6-months emergency contingency reserve',
        createdAt: now.toISOString(),
      },
      {
        id: `goal_${Date.now()}_2`,
        userId,
        title: 'M3 MacBook Pro Upgrade',
        targetAmount: 220000,
        currentAmount: 110000,
        targetDate: new Date(now.getFullYear(), now.getMonth() + 4, 15).toISOString().split('T')[0],
        category: 'Gadgets',
        color: '#3b82f6',
        icon: 'Laptop',
        notes: 'Workstation machine upgrade',
        createdAt: now.toISOString(),
      }
    ];

    const sampleBills: BillSubscription[] = [
      {
        id: `bill_${Date.now()}_1`,
        userId,
        title: 'DESCO Electricity Bill',
        amount: 3450,
        category: 'Utilities',
        frequency: 'monthly',
        dueDate: new Date(now.getFullYear(), now.getMonth(), 18).toISOString().split('T')[0],
        reminderDays: 3,
        status: 'unpaid',
        createdAt: now.toISOString(),
      },
      {
        id: `bill_${Date.now()}_2`,
        userId,
        title: 'Netflix Premium UHD',
        amount: 1250,
        category: 'Entertainment',
        frequency: 'monthly',
        dueDate: new Date(now.getFullYear(), now.getMonth(), 25).toISOString().split('T')[0],
        reminderDays: 2,
        status: 'unpaid',
        createdAt: now.toISOString(),
      }
    ];

    const sampleInvestments: Investment[] = [
      {
        id: `inv_${Date.now()}_1`,
        userId,
        name: 'Monthly 5-Year Islamic DPS',
        type: 'dps',
        investedAmount: 120000,
        currentValue: 135400,
        expectedReturnRate: 8.5,
        startDate: '2024-01-10',
        maturityDate: '2029-01-10',
        institution: 'Islami Bank Bangladesh',
        notes: 'Monthly ৳5,000 automated installment',
        createdAt: now.toISOString(),
      }
    ];

    setAccounts(initialAccounts);
    setTransactions(sampleTxs);
    setLoans(sampleLoans);
    setBudgets(sampleBudgets);
    setSavingsGoals(sampleGoals);
    setBills(sampleBills);
    setInvestments(sampleInvestments);

    saveToLocalStorage('accounts', initialAccounts);
    saveToLocalStorage('transactions', sampleTxs);
    saveToLocalStorage('loans', sampleLoans);
    saveToLocalStorage('budgets', sampleBudgets);
    saveToLocalStorage('goals', sampleGoals);
    saveToLocalStorage('bills', sampleBills);
    saveToLocalStorage('investments', sampleInvestments);
  }, [userId, saveToLocalStorage]);

  // Real-time Firestore Synchronizer (with offline fallback)
  useEffect(() => {
    if (!user || isGuest) {
      loadFromLocalStorage();
      setLoading(false);
      return;
    }

    setSyncStatus('syncing');
    const unsubscribers: (() => void)[] = [];

    try {
      // 1. Accounts listener
      const accRef = collection(db, `users/${user.uid}/accounts`);
      const unsubAcc = onSnapshot(accRef, async (snapshot) => {
        if (!snapshot.empty) {
          const accs = snapshot.docs.map((d) => d.data() as Account);
          setAccounts(accs);
          saveToLocalStorage('accounts', accs);
        } else {
          // If Firestore is empty for this user, seed default accounts to state and immediately save to Firestore
          const now = new Date();
          const initialAccounts: Account[] = DEFAULT_ACCOUNTS.map((acc, index) => ({
            id: `acc_${Date.now()}_${index}`,
            userId: user.uid,
            ...acc,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
          }));
          setAccounts(initialAccounts);
          saveToLocalStorage('accounts', initialAccounts);

          try {
            const batch = writeBatch(db);
            batch.set(doc(db, 'users', user.uid), {
              email: user.email || '',
              displayName: user.displayName || '',
              updatedAt: now.toISOString(),
            }, { merge: true });

            initialAccounts.forEach((acc) => {
              batch.set(doc(db, `users/${user.uid}/accounts`, acc.id), acc, { merge: true });
            });
            await batch.commit();
          } catch (e) {
            console.warn('Initial accounts sync notice:', e);
          }
        }
        setSyncStatus('synced');
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/accounts`);
        setSyncStatus('offline');
        loadFromLocalStorage();
      });
      unsubscribers.push(unsubAcc);

      // 2. Transactions listener
      const txRef = collection(db, `users/${user.uid}/transactions`);
      const unsubTx = onSnapshot(txRef, (snapshot) => {
        const txs = snapshot.docs.map((d) => d.data() as Transaction);
        setTransactions(txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        saveToLocalStorage('transactions', txs);
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/transactions`);
      });
      unsubscribers.push(unsubTx);

      // 3. Loans listener
      const loanRef = collection(db, `users/${user.uid}/loans`);
      const unsubLoan = onSnapshot(loanRef, (snapshot) => {
        const lnList = snapshot.docs.map((d) => d.data() as Loan);
        setLoans(lnList);
        saveToLocalStorage('loans', lnList);
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/loans`);
      });
      unsubscribers.push(unsubLoan);

      // 4. Budgets listener
      const bgtRef = collection(db, `users/${user.uid}/budgets`);
      const unsubBgt = onSnapshot(bgtRef, (snapshot) => {
        const bList = snapshot.docs.map((d) => d.data() as Budget);
        setBudgets(bList);
        saveToLocalStorage('budgets', bList);
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/budgets`);
      });
      unsubscribers.push(unsubBgt);

      // 5. Goals listener
      const goalRef = collection(db, `users/${user.uid}/savingsGoals`);
      const unsubGoal = onSnapshot(goalRef, (snapshot) => {
        const gList = snapshot.docs.map((d) => d.data() as SavingsGoal);
        setSavingsGoals(gList);
        saveToLocalStorage('goals', gList);
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/savingsGoals`);
      });
      unsubscribers.push(unsubGoal);

      // 6. Bills listener
      const billRef = collection(db, `users/${user.uid}/bills`);
      const unsubBill = onSnapshot(billRef, (snapshot) => {
        const bList = snapshot.docs.map((d) => d.data() as BillSubscription);
        setBills(bList);
        saveToLocalStorage('bills', bList);
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/bills`);
      });
      unsubscribers.push(unsubBill);

      // 7. Investments listener
      const invRef = collection(db, `users/${user.uid}/investments`);
      const unsubInv = onSnapshot(invRef, (snapshot) => {
        const iList = snapshot.docs.map((d) => d.data() as Investment);
        setInvestments(iList);
        saveToLocalStorage('investments', iList);
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/investments`);
      });
      unsubscribers.push(unsubInv);

      setLoading(false);
    } catch (e) {
      console.warn('Firestore subscription fallback:', e);
      loadFromLocalStorage();
      setLoading(false);
    }

    return () => {
      unsubscribers.forEach((u) => u());
    };
  }, [user, isGuest, loadFromLocalStorage, saveToLocalStorage]);

  // Automated Daily Backup Engine (Runs background checks and syncs with Google Drive & Local Storage)
  useEffect(() => {
    if (!accounts || accounts.length === 0) return;

    const performDailyBackupCheck = async () => {
      try {
        const config = getAutoBackupConfig(userId);
        if (!config.enabled) return;

        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        // Parse scheduled time e.g. "23:00"
        const [targetHourStr, targetMinuteStr] = (config.scheduledTime || '23:00').split(':');
        const targetHour = parseInt(targetHourStr, 10) || 23;
        const targetMinute = parseInt(targetMinuteStr, 10) || 0;

        // Check if today hasn't been backed up yet and current time >= scheduled time
        const alreadyBackedUpToday = config.lastBackupDate === todayStr;
        const isPastOrAtScheduledTime = 
          currentHour > targetHour || (currentHour === targetHour && currentMinute >= targetMinute);

        if (!alreadyBackedUpToday && isPastOrAtScheduledTime) {
          // Take snapshot
          const snapshot = createBackupSnapshot({
            accounts,
            transactions,
            loans,
            budgets,
            savingsGoals,
            bills,
            investments,
            categories,
          }, 'auto_daily');

          // Save to local snapshot storage
          saveSnapshot(snapshot, config.maxStoredSnapshots || 10, userId);

          // If Google Drive token exists and auto-sync is enabled, upload to user's personal Google Drive
          const driveToken = getStoredGoogleDriveToken(userId);
          const driveSettings = getGoogleDriveSettings(userId);
          if (driveToken && driveSettings.autoSync) {
            try {
              await uploadBackupFileToDrive(driveToken, snapshot.data, `FINORA_AutoDaily_${todayStr}.json`, userId);
              console.log('✅ Automated daily backup successfully uploaded to personal Google Drive');
            } catch (driveErr) {
              console.warn('Google Drive auto-backup error:', driveErr);
            }
          }

          // Update config with last backup date & time
          saveAutoBackupConfig({
            lastBackupDate: todayStr,
            lastBackupTimestamp: now.toISOString(),
          }, userId);
        }
      } catch (err) {
        console.error('Error during auto backup check:', err);
      }
    };

    // Run on mount
    performDailyBackupCheck();

    // Check periodically every 60 seconds
    const interval = setInterval(performDailyBackupCheck, 60000);
    return () => clearInterval(interval);
  }, [accounts, transactions, loans, budgets, savingsGoals, bills, investments, categories, userId]);

  // Synchronize generated notifications (bills due, budget overshoots, loan payments)
  useEffect(() => {
    const newNotifications: AppNotification[] = [];
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentMonth = todayStr.substring(0, 7);

    // Bill due notifications
    bills.forEach((b) => {
      if (b.status === 'unpaid') {
        const due = new Date(b.dueDate);
        const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 3600 * 24));
        if (diffDays < 0) {
          newNotifications.push({
            id: `notif_bill_overdue_${b.id}`,
            title: `বিল বকেয়া: ${b.title}`,
            message: `${b.title} বিলের নির্ধারিত সময় পার হয়ে গেছে (${b.dueDate})। জরিমানা এড়াতে অবিলম্বে পরিশোধ করুন।`,
            type: 'bill_due',
            date: todayStr,
            isRead: false,
          });
        } else if (diffDays <= (b.reminderDays || 3)) {
          newNotifications.push({
            id: `notif_bill_due_${b.id}`,
            title: `আসন্ন বিল: ${b.title}`,
            message: `${b.title}-এর ${currencySymbol}${Number(b.amount || 0).toLocaleString()} বিল আগামী ${diffDays === 0 ? 'আজ' : `${diffDays} দিনের মধ্যে`} পরিশোধের সময় আসছে।`,
            type: 'bill_due',
            date: todayStr,
            isRead: false,
          });
        }
      }
    });

    // Budget warnings
    budgets.forEach((b) => {
      if (b.month === currentMonth) {
        const spent = transactions
          .filter((t) => t.type === 'expense' && t.categoryId === b.categoryId && t.date.startsWith(currentMonth))
          .reduce((sum, t) => sum + t.amount, 0);

        const pct = Math.round((spent / (b.targetAmount || 1)) * 100);
        if (pct >= 100) {
          newNotifications.push({
            id: `notif_bgt_exceed_${b.id}`,
            title: `বাজেট সীমা অতিক্রম: ${b.categoryName}`,
            message: `${b.categoryName}-এ আপনি বাজেটের ${pct}% (${currencySymbol}${Number(spent || 0).toLocaleString()}) খরচ করে ফেলেছেন!`,
            type: 'budget_alert',
            date: todayStr,
            isRead: false,
          });
        } else if (pct >= (b.alertThreshold || 80)) {
          newNotifications.push({
            id: `notif_bgt_warn_${b.id}`,
            title: `বাজেট সতর্কতা: ${b.categoryName}`,
            message: `${b.categoryName}-এ বাজেট সীমার ${pct}% ব্যবহৃত হয়েছে। সতর্কভাবে খরচ করুন।`,
            type: 'budget_alert',
            date: todayStr,
            isRead: false,
          });
        }
      }
    });

    // Active loan due notifications
    loans.forEach((l) => {
      if (l.status === 'active' && l.dueDate && (l.remainingAmount ?? 0) > 0) {
        const due = new Date(l.dueDate);
        const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 3600 * 24));
        if (diffDays <= 7 && diffDays >= 0) {
          newNotifications.push({
            id: `notif_loan_due_${l.id}`,
            title: l.type === 'borrowed' ? `ঋণ পরিশোধের সময়: ${l.personName}` : `ঋণ আদায়ের সময়: ${l.personName}`,
            message: `${l.personName}-এর ${currencySymbol}${Number(l.remainingAmount || 0).toLocaleString()} টাকার কিস্তি ${diffDays === 0 ? 'আজ' : `${diffDays} দিনের মধ্যে`} সম্পন্ন করতে হবে।`,
            type: 'loan_due',
            date: todayStr,
            isRead: false,
          });
        }
      }
    });

    setNotifications(newNotifications);
  }, [bills, budgets, loans, transactions, currencySymbol]);

  // Compute Absolute Mathematical Financial Summary (Zero Double Counting)
  const summary: FinancialSummary = useMemo(() => {
    const currentMonth = new Date().toISOString().substring(0, 7);

    // 1. Total Active Asset Accounts Balance (Exclude hidden & credit card liabilities)
    const activeAssetAccounts = accounts.filter((a) => !a.isHidden && a.type !== 'credit_card');
    const totalBalance = activeAssetAccounts.reduce((sum, a) => sum + (a.balance || 0), 0);

    // 2. Receivables (Loans Given where remainingAmount > 0)
    const totalReceivables = loans
      .filter((l) => l.type === 'lent' && l.status === 'active')
      .reduce((sum, l) => sum + (l.remainingAmount || 0), 0);

    // 3. Investments Value
    const totalInvestments = investments.reduce((sum, i) => sum + (i.currentValue || i.investedAmount || 0), 0);

    // Total Assets = Active Accounts Balance + Receivables + Investments
    const totalAssets = totalBalance + totalReceivables + totalInvestments;

    // 4. Liabilities: Borrowed Loans + Credit Card Outstanding Debt
    const borrowedLiabilities = loans
      .filter((l) => l.type === 'borrowed' && l.status === 'active')
      .reduce((sum, l) => sum + (l.remainingAmount || 0), 0);

    const creditCardLiabilities = accounts
      .filter((a) => a.type === 'credit_card' && a.balance < 0)
      .reduce((sum, a) => sum + Math.abs(a.balance), 0);

    const totalLiabilities = borrowedLiabilities + creditCardLiabilities;
    const totalPayables = totalLiabilities;

    // Net Worth = Total Assets - Total Liabilities
    const netWorth = totalAssets - totalLiabilities;

    // Monthly Income & Expenses (Strictly excluding transfers and loan principals)
    const monthlyTransactions = transactions.filter((t) => t.date.startsWith(currentMonth));

    const monthlyIncome = monthlyTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyExpense = monthlyTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlySavings = monthlyIncome - monthlyExpense;

    return {
      totalBalance,
      totalAssets,
      totalLiabilities,
      netWorth,
      monthlyIncome,
      monthlyExpense,
      monthlySavings,
      totalReceivables,
      totalPayables,
    };
  }, [accounts, loans, investments, transactions]);

  // ACCOUNT CRUD OPERATIONS
  const addAccount = async (accountData: Omit<Account, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const id = `acc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newAcc: Account = {
      ...accountData,
      id,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [...accounts, newAcc];
    setAccounts(updated);
    saveToLocalStorage('accounts', updated);

    if (user && !isGuest) {
      try {
        await setDoc(doc(db, `users/${user.uid}/accounts`, id), newAcc);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/accounts/${id}`);
      }
    }
    return id;
  };

  const updateAccount = async (id: string, updates: Partial<Account>) => {
    const updated = accounts.map((a) => (a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a));
    setAccounts(updated);
    saveToLocalStorage('accounts', updated);

    if (user && !isGuest) {
      try {
        await updateDoc(doc(db, `users/${user.uid}/accounts`, id), {
          ...updates,
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/accounts/${id}`);
      }
    }
  };

  const deleteAccount = async (id: string) => {
    const updated = accounts.filter((a) => a.id !== id);
    setAccounts(updated);
    saveToLocalStorage('accounts', updated);

    if (user && !isGuest) {
      try {
        await deleteDoc(doc(db, `users/${user.uid}/accounts`, id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/accounts/${id}`);
      }
    }
  };

  const toggleHideAccount = async (id: string) => {
    const target = accounts.find((a) => a.id === id);
    if (!target) return;
    await updateAccount(id, { isHidden: !target.isHidden });
  };

  // TRANSACTION OPERATIONS (With atomic account balance adjustment)
  const addTransaction = async (txData: Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const id = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newTx: Transaction = {
      ...txData,
      id,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Update affected account balance
    const updatedAccounts = accounts.map((acc) => {
      if (acc.id === newTx.accountId) {
        if (newTx.type === 'income') {
          return { ...acc, balance: (acc.balance || 0) + newTx.amount };
        } else if (newTx.type === 'expense') {
          return { ...acc, balance: (acc.balance || 0) - newTx.amount };
        }
      }
      return acc;
    });

    const updatedTxs = [newTx, ...transactions];
    setTransactions(updatedTxs);
    setAccounts(updatedAccounts);
    saveToLocalStorage('transactions', updatedTxs);
    saveToLocalStorage('accounts', updatedAccounts);

    if (user && !isGuest) {
      try {
        const batch = writeBatch(db);
        batch.set(doc(db, `users/${user.uid}/transactions`, id), newTx);
        const targetAcc = updatedAccounts.find((a) => a.id === newTx.accountId);
        if (targetAcc) {
          batch.set(doc(db, `users/${user.uid}/accounts`, targetAcc.id), targetAcc, { merge: true });
        }
        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/transactions/${id}`);
      }
    }

    return id;
  };

  const deleteTransaction = async (id: string) => {
    const tx = transactions.find((t) => t.id === id);
    if (!tx) return;

    // Reverse account balance effect
    const updatedAccounts = accounts.map((acc) => {
      if (acc.id === tx.accountId) {
        if (tx.type === 'income') {
          return { ...acc, balance: (acc.balance || 0) - tx.amount };
        } else if (tx.type === 'expense') {
          return { ...acc, balance: (acc.balance || 0) + tx.amount };
        } else if (tx.type === 'transfer' && tx.targetAccountId) {
          return { ...acc, balance: (acc.balance || 0) + tx.amount };
        }
      }
      if (tx.type === 'transfer' && tx.targetAccountId && acc.id === tx.targetAccountId) {
        return { ...acc, balance: (acc.balance || 0) - tx.amount };
      }
      return acc;
    });

    const updatedTxs = transactions.filter((t) => t.id !== id);
    setTransactions(updatedTxs);
    setAccounts(updatedAccounts);
    saveToLocalStorage('transactions', updatedTxs);
    saveToLocalStorage('accounts', updatedAccounts);

    if (user && !isGuest) {
      try {
        const batch = writeBatch(db);
        batch.delete(doc(db, `users/${user.uid}/transactions`, id));
        const targetAcc = updatedAccounts.find((a) => a.id === tx.accountId);
        if (targetAcc) {
          batch.set(doc(db, `users/${user.uid}/accounts`, targetAcc.id), targetAcc, { merge: true });
        }
        if (tx.type === 'transfer' && tx.targetAccountId) {
          const toAcc = updatedAccounts.find((a) => a.id === tx.targetAccountId);
          if (toAcc) {
            batch.set(doc(db, `users/${user.uid}/accounts`, toAcc.id), toAcc, { merge: true });
          }
        }
        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/transactions/${id}`);
      }
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    const oldTx = transactions.find((t) => t.id === id);
    if (!oldTx) return;

    const updatedTx = { ...oldTx, ...updates, updatedAt: new Date().toISOString() };
    const updatedTxs = transactions.map((t) => (t.id === id ? updatedTx : t));
    setTransactions(updatedTxs);
    saveToLocalStorage('transactions', updatedTxs);

    if (user && !isGuest) {
      try {
        await setDoc(doc(db, `users/${user.uid}/transactions`, id), updatedTx, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/transactions/${id}`);
      }
    }
  };

  // TRANSFER SYSTEM (Strictly internal movement, zero income/expense alteration)
  const transferFunds = async ({
    fromAccountId,
    toAccountId,
    amount,
    date,
    description,
    notes,
  }: {
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    date: string;
    description?: string;
    notes?: string;
  }): Promise<string> => {
    if (fromAccountId === toAccountId) {
      throw new Error('From Account and To Account cannot be the same.');
    }

    const fromAcc = accounts.find((a) => a.id === fromAccountId);
    const toAcc = accounts.find((a) => a.id === toAccountId);
    if (!fromAcc || !toAcc) {
      throw new Error('Invalid source or target account.');
    }

    const id = `tx_trf_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newTx: Transaction = {
      id,
      userId,
      type: 'transfer',
      amount,
      date,
      accountId: fromAccountId,
      targetAccountId: toAccountId,
      categoryId: 'cat_transfer',
      description: description || `Transfer: ${fromAcc.name} → ${toAcc.name}`,
      notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedAccounts = accounts.map((acc) => {
      if (acc.id === fromAccountId) {
        return { ...acc, balance: (acc.balance || 0) - amount };
      }
      if (acc.id === toAccountId) {
        return { ...acc, balance: (acc.balance || 0) + amount };
      }
      return acc;
    });

    const updatedTxs = [newTx, ...transactions];
    setTransactions(updatedTxs);
    setAccounts(updatedAccounts);
    saveToLocalStorage('transactions', updatedTxs);
    saveToLocalStorage('accounts', updatedAccounts);

    if (user && !isGuest) {
      try {
        const batch = writeBatch(db);
        batch.set(doc(db, `users/${user.uid}/transactions`, id), newTx);
        const fromAccObj = updatedAccounts.find((a) => a.id === fromAccountId);
        const toAccObj = updatedAccounts.find((a) => a.id === toAccountId);
        if (fromAccObj) {
          batch.set(doc(db, `users/${user.uid}/accounts`, fromAccountId), fromAccObj, { merge: true });
        }
        if (toAccObj) {
          batch.set(doc(db, `users/${user.uid}/accounts`, toAccountId), toAccObj, { merge: true });
        }
        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/transfers`);
      }
    }

    return id;
  };

  // LOAN SYSTEM (Fully connected to Accounts with precise asset/liability balancing)
  const addLoan = async ({
    type,
    personName,
    contactInfo,
    totalAmount,
    targetAccountId,
    startDate,
    dueDate,
    interestRate,
    notes,
  }: {
    type: 'borrowed' | 'lent';
    personName: string;
    contactInfo?: string;
    totalAmount: number;
    targetAccountId: string;
    startDate: string;
    dueDate?: string;
    interestRate?: number;
    notes?: string;
  }): Promise<string> => {
    const loanId = `loan_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const txId = `tx_loan_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const newLoan: Loan = {
      id: loanId,
      userId,
      type,
      personName,
      contactInfo,
      totalAmount,
      paidAmount: 0,
      remainingAmount: totalAmount,
      startDate,
      dueDate,
      interestRate,
      accountId: targetAccountId,
      status: 'active',
      notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Connected Transaction Creation
    let newTx: Transaction;
    let updatedAccounts = [...accounts];

    if (type === 'borrowed') {
      // I borrowed money: targetAccount receives cash/bank (+amount). NOT income!
      newTx = {
        id: txId,
        userId,
        type: 'loan_taken',
        amount: totalAmount,
        date: startDate,
        accountId: targetAccountId,
        loanId,
        categoryId: 'cat_loan_borrowed',
        payerPayee: personName,
        description: `Loan Received from ${personName}`,
        notes: `Liability created. Deposited into account. ${notes || ''}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      updatedAccounts = accounts.map((acc) =>
        acc.id === targetAccountId ? { ...acc, balance: (acc.balance || 0) + totalAmount } : acc
      );
    } else {
      // I lent money to someone: sourceAccount pays out (-amount), becomes Receivable. NOT expense!
      newTx = {
        id: txId,
        userId,
        type: 'loan_given',
        amount: totalAmount,
        date: startDate,
        accountId: targetAccountId,
        loanId,
        categoryId: 'cat_loan_given',
        payerPayee: personName,
        description: `Loan Given to ${personName}`,
        notes: `Receivable created. Deducted from account. ${notes || ''}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      updatedAccounts = accounts.map((acc) =>
        acc.id === targetAccountId ? { ...acc, balance: (acc.balance || 0) - totalAmount } : acc
      );
    }

    const updatedLoans = [newLoan, ...loans];
    const updatedTxs = [newTx, ...transactions];

    setLoans(updatedLoans);
    setTransactions(updatedTxs);
    setAccounts(updatedAccounts);

    saveToLocalStorage('loans', updatedLoans);
    saveToLocalStorage('transactions', updatedTxs);
    saveToLocalStorage('accounts', updatedAccounts);

    if (user && !isGuest) {
      try {
        const batch = writeBatch(db);
        batch.set(doc(db, `users/${user.uid}/loans`, loanId), newLoan);
        batch.set(doc(db, `users/${user.uid}/transactions`, txId), newTx);
        const targetAcc = updatedAccounts.find((a) => a.id === targetAccountId);
        if (targetAcc) {
          batch.update(doc(db, `users/${user.uid}/accounts`, targetAccountId), {
            balance: targetAcc.balance,
            updatedAt: new Date().toISOString(),
          });
        }
        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/loans`);
      }
    }

    return loanId;
  };

  // Repaying a borrowed loan (Source Account -Amount, Loan Liability -Amount, NOT an Expense!)
  const repayBorrowedLoan = async ({
    loanId,
    amount,
    fromAccountId,
    date,
    notes,
  }: {
    loanId: string;
    amount: number;
    fromAccountId: string;
    date: string;
    notes?: string;
  }) => {
    const loan = loans.find((l) => l.id === loanId);
    const sourceAcc = accounts.find((a) => a.id === fromAccountId);
    if (!loan || !sourceAcc) throw new Error('Loan or source account not found.');

    const newRemaining = Math.max(0, loan.remainingAmount - amount);
    const newPaid = loan.paidAmount + amount;
    const newStatus = newRemaining === 0 ? 'settled' : 'active';

    const txId = `tx_repay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newTx: Transaction = {
      id: txId,
      userId,
      type: 'loan_repayment',
      amount,
      date,
      accountId: fromAccountId,
      loanId,
      categoryId: 'cat_loan_repay',
      payerPayee: loan.personName,
      description: `Loan Repayment to ${loan.personName}`,
      notes: `Liability reduced. Deducted from ${sourceAcc.name}. ${notes || ''}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedLoans = loans.map((l) =>
      l.id === loanId
        ? { ...l, paidAmount: newPaid, remainingAmount: newRemaining, status: newStatus, updatedAt: new Date().toISOString() }
        : l
    );

    const updatedAccounts = accounts.map((acc) =>
      acc.id === fromAccountId ? { ...acc, balance: (acc.balance || 0) - amount } : acc
    );

    const updatedTxs = [newTx, ...transactions];

    setLoans(updatedLoans);
    setAccounts(updatedAccounts);
    setTransactions(updatedTxs);

    saveToLocalStorage('loans', updatedLoans);
    saveToLocalStorage('accounts', updatedAccounts);
    saveToLocalStorage('transactions', updatedTxs);

    if (user && !isGuest) {
      try {
        const batch = writeBatch(db);
        const updatedLoanDoc = updatedLoans.find((l) => l.id === loanId);
        if (updatedLoanDoc) {
          batch.set(doc(db, `users/${user.uid}/loans`, loanId), updatedLoanDoc, { merge: true });
        }
        batch.set(doc(db, `users/${user.uid}/transactions`, txId), newTx);
        const sourceAccObj = updatedAccounts.find((a) => a.id === fromAccountId);
        if (sourceAccObj) {
          batch.set(doc(db, `users/${user.uid}/accounts`, fromAccountId), sourceAccObj, { merge: true });
        }
        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/loan_repayment`);
      }
    }
  };

  // Collecting back a lent loan (Receiving Account +Amount, Loan Receivable -Amount, NOT Income!)
  const collectLentLoan = async ({
    loanId,
    amount,
    toAccountId,
    date,
    notes,
  }: {
    loanId: string;
    amount: number;
    toAccountId: string;
    date: string;
    notes?: string;
  }) => {
    const loan = loans.find((l) => l.id === loanId);
    const targetAcc = accounts.find((a) => a.id === toAccountId);
    if (!loan || !targetAcc) throw new Error('Loan or target account not found.');

    const newRemaining = Math.max(0, loan.remainingAmount - amount);
    const newPaid = loan.paidAmount + amount;
    const newStatus = newRemaining === 0 ? 'settled' : 'active';

    const txId = `tx_collect_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newTx: Transaction = {
      id: txId,
      userId,
      type: 'loan_collection',
      amount,
      date,
      accountId: toAccountId,
      loanId,
      categoryId: 'cat_loan_collect',
      payerPayee: loan.personName,
      description: `Loan Repayment Received from ${loan.personName}`,
      notes: `Receivable settled. Received in ${targetAcc.name}. ${notes || ''}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedLoans = loans.map((l) =>
      l.id === loanId
        ? { ...l, paidAmount: newPaid, remainingAmount: newRemaining, status: newStatus, updatedAt: new Date().toISOString() }
        : l
    );

    const updatedAccounts = accounts.map((acc) =>
      acc.id === toAccountId ? { ...acc, balance: (acc.balance || 0) + amount } : acc
    );

    const updatedTxs = [newTx, ...transactions];

    setLoans(updatedLoans);
    setAccounts(updatedAccounts);
    setTransactions(updatedTxs);

    saveToLocalStorage('loans', updatedLoans);
    saveToLocalStorage('accounts', updatedAccounts);
    saveToLocalStorage('transactions', updatedTxs);

    if (user && !isGuest) {
      try {
        const batch = writeBatch(db);
        const updatedLoanDoc = updatedLoans.find((l) => l.id === loanId);
        if (updatedLoanDoc) {
          batch.set(doc(db, `users/${user.uid}/loans`, loanId), updatedLoanDoc, { merge: true });
        }
        batch.set(doc(db, `users/${user.uid}/transactions`, txId), newTx);
        const targetAccObj = updatedAccounts.find((a) => a.id === toAccountId);
        if (targetAccObj) {
          batch.set(doc(db, `users/${user.uid}/accounts`, toAccountId), targetAccObj, { merge: true });
        }
        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/loan_collection`);
      }
    }
  };

  const deleteLoan = async (id: string) => {
    const updated = loans.filter((l) => l.id !== id);
    setLoans(updated);
    saveToLocalStorage('loans', updated);
    if (user && !isGuest) {
      try {
        await deleteDoc(doc(db, `users/${user.uid}/loans`, id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/loans/${id}`);
      }
    }
  };

  // CREDIT CARD BILL PAYMENT (Paying Account -Amount, CC Balance +Amount towards 0, NOT an Expense!)
  const payCreditCardBill = async ({
    creditCardAccountId,
    fromAccountId,
    amount,
    date,
    notes,
  }: {
    creditCardAccountId: string;
    fromAccountId: string;
    amount: number;
    date: string;
    notes?: string;
  }) => {
    const ccAcc = accounts.find((a) => a.id === creditCardAccountId);
    const fromAcc = accounts.find((a) => a.id === fromAccountId);
    if (!ccAcc || !fromAcc) throw new Error('Credit card or paying account not found.');

    const txId = `tx_ccpay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newTx: Transaction = {
      id: txId,
      userId,
      type: 'credit_card_payment',
      amount,
      date,
      accountId: fromAccountId,
      targetAccountId: creditCardAccountId,
      categoryId: 'cat_cc_payment',
      description: `Credit Card Bill Payment: ${ccAcc.name}`,
      notes: `Paid from ${fromAcc.name}. CC liability reduced. ${notes || ''}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedAccounts = accounts.map((acc) => {
      if (acc.id === fromAccountId) {
        return { ...acc, balance: (acc.balance || 0) - amount };
      }
      if (acc.id === creditCardAccountId) {
        return { ...acc, balance: (acc.balance || 0) + amount };
      }
      return acc;
    });

    const updatedTxs = [newTx, ...transactions];
    setAccounts(updatedAccounts);
    setTransactions(updatedTxs);

    saveToLocalStorage('accounts', updatedAccounts);
    saveToLocalStorage('transactions', updatedTxs);

    if (user && !isGuest) {
      try {
        const batch = writeBatch(db);
        batch.set(doc(db, `users/${user.uid}/transactions`, txId), newTx);
        batch.update(doc(db, `users/${user.uid}/accounts`, fromAccountId), {
          balance: (fromAcc.balance || 0) - amount,
          updatedAt: new Date().toISOString(),
        });
        batch.update(doc(db, `users/${user.uid}/accounts`, creditCardAccountId), {
          balance: (ccAcc.balance || 0) + amount,
          updatedAt: new Date().toISOString(),
        });
        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/credit_card_payment`);
      }
    }
  };

  // BUDGET OPERATIONS
  const addBudget = async (bgtData: Omit<Budget, 'id' | 'userId' | 'createdAt'>): Promise<string> => {
    const id = `bgt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newBgt: Budget = {
      ...bgtData,
      id,
      userId,
      createdAt: new Date().toISOString(),
    };
    const updated = [...budgets, newBgt];
    setBudgets(updated);
    saveToLocalStorage('budgets', updated);
    if (user && !isGuest) {
      try {
        await setDoc(doc(db, `users/${user.uid}/budgets`, id), newBgt);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/budgets/${id}`);
      }
    }
    return id;
  };

  const updateBudget = async (id: string, updates: Partial<Budget>) => {
    const updated = budgets.map((b) => (b.id === id ? { ...b, ...updates, updatedAt: new Date().toISOString() } : b));
    setBudgets(updated);
    saveToLocalStorage('budgets', updated);
    if (user && !isGuest) {
      try {
        await updateDoc(doc(db, `users/${user.uid}/budgets`, id), { ...updates, updatedAt: new Date().toISOString() });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/budgets/${id}`);
      }
    }
  };

  const deleteBudget = async (id: string) => {
    const updated = budgets.filter((b) => b.id !== id);
    setBudgets(updated);
    saveToLocalStorage('budgets', updated);
    if (user && !isGuest) {
      try {
        await deleteDoc(doc(db, `users/${user.uid}/budgets`, id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/budgets/${id}`);
      }
    }
  };

  // SAVINGS GOALS
  const addSavingsGoal = async (goalData: Omit<SavingsGoal, 'id' | 'userId' | 'createdAt'>): Promise<string> => {
    const id = `goal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newGoal: SavingsGoal = {
      ...goalData,
      id,
      userId,
      createdAt: new Date().toISOString(),
    };
    const updated = [...savingsGoals, newGoal];
    setSavingsGoals(updated);
    saveToLocalStorage('goals', updated);
    if (user && !isGuest) {
      try {
        await setDoc(doc(db, `users/${user.uid}/savingsGoals`, id), newGoal);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/savingsGoals/${id}`);
      }
    }
    return id;
  };

  const updateSavingsGoal = async (id: string, updates: Partial<SavingsGoal>) => {
    const updated = savingsGoals.map((g) => (g.id === id ? { ...g, ...updates, updatedAt: new Date().toISOString() } : g));
    setSavingsGoals(updated);
    saveToLocalStorage('goals', updated);
    if (user && !isGuest) {
      try {
        await updateDoc(doc(db, `users/${user.uid}/savingsGoals`, id), { ...updates, updatedAt: new Date().toISOString() });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/savingsGoals/${id}`);
      }
    }
  };

  const deleteSavingsGoal = async (id: string) => {
    const updated = savingsGoals.filter((g) => g.id !== id);
    setSavingsGoals(updated);
    saveToLocalStorage('goals', updated);
    if (user && !isGuest) {
      try {
        await deleteDoc(doc(db, `users/${user.uid}/savingsGoals`, id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/savingsGoals/${id}`);
      }
    }
  };

  const contributeToGoal = async (goalId: string, amount: number, fromAccountId?: string) => {
    const goal = savingsGoals.find((g) => g.id === goalId);
    if (!goal) return;

    const newCurrent = goal.currentAmount + amount;
    const isCompleted = newCurrent >= goal.targetAmount;

    await updateSavingsGoal(goalId, {
      currentAmount: newCurrent,
      isCompleted,
    });

    if (fromAccountId) {
      const fromAcc = accounts.find((a) => a.id === fromAccountId);
      if (fromAcc) {
        await updateAccount(fromAccountId, { balance: (fromAcc.balance || 0) - amount });
      }
    }
  };

  // BILLS & SUBSCRIPTIONS
  const addBill = async (billData: Omit<BillSubscription, 'id' | 'userId' | 'createdAt'>): Promise<string> => {
    const id = `bill_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newBill: BillSubscription = {
      ...billData,
      id,
      userId,
      createdAt: new Date().toISOString(),
    };
    const updated = [...bills, newBill];
    setBills(updated);
    saveToLocalStorage('bills', updated);
    if (user && !isGuest) {
      try {
        await setDoc(doc(db, `users/${user.uid}/bills`, id), newBill);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/bills/${id}`);
      }
    }
    return id;
  };

  const updateBill = async (id: string, updates: Partial<BillSubscription>) => {
    const updated = bills.map((b) => (b.id === id ? { ...b, ...updates, updatedAt: new Date().toISOString() } : b));
    setBills(updated);
    saveToLocalStorage('bills', updated);
    if (user && !isGuest) {
      try {
        await updateDoc(doc(db, `users/${user.uid}/bills`, id), { ...updates, updatedAt: new Date().toISOString() });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/bills/${id}`);
      }
    }
  };

  const deleteBill = async (id: string) => {
    const updated = bills.filter((b) => b.id !== id);
    setBills(updated);
    saveToLocalStorage('bills', updated);
    if (user && !isGuest) {
      try {
        await deleteDoc(doc(db, `users/${user.uid}/bills`, id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/bills/${id}`);
      }
    }
  };

  const payBill = async (billId: string, fromAccountId: string, paidDate: string) => {
    const bill = bills.find((b) => b.id === billId);
    if (!bill) return;

    // Create an expense transaction
    await addTransaction({
      type: 'expense',
      amount: bill.amount,
      date: paidDate,
      accountId: fromAccountId,
      categoryId: 'cat_exp_utilities',
      subcategory: bill.category,
      payerPayee: bill.title,
      description: `Bill Payment: ${bill.title}`,
      notes: `Recurring ${bill.frequency} bill cleared.`,
    });

    // Update bill status and push due date forward based on frequency
    const currentDue = new Date(bill.dueDate);
    let nextDue = new Date(currentDue);
    if (bill.frequency === 'monthly') nextDue.setMonth(nextDue.getMonth() + 1);
    else if (bill.frequency === 'yearly') nextDue.setFullYear(nextDue.getFullYear() + 1);
    else if (bill.frequency === 'quarterly') nextDue.setMonth(nextDue.getMonth() + 3);
    else if (bill.frequency === 'weekly') nextDue.setDate(nextDue.getDate() + 7);

    await updateBill(billId, {
      status: 'paid',
      lastPaidDate: paidDate,
      dueDate: nextDue.toISOString().split('T')[0],
    });
  };

  // INVESTMENTS
  const addInvestment = async (invData: Omit<Investment, 'id' | 'userId' | 'createdAt'>): Promise<string> => {
    const id = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newInv: Investment = {
      ...invData,
      id,
      userId,
      createdAt: new Date().toISOString(),
    };
    const updated = [...investments, newInv];
    setInvestments(updated);
    saveToLocalStorage('investments', updated);
    if (user && !isGuest) {
      try {
        await setDoc(doc(db, `users/${user.uid}/investments`, id), newInv);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/investments/${id}`);
      }
    }
    return id;
  };

  const updateInvestment = async (id: string, updates: Partial<Investment>) => {
    const updated = investments.map((i) => (i.id === id ? { ...i, ...updates, updatedAt: new Date().toISOString() } : i));
    setInvestments(updated);
    saveToLocalStorage('investments', updated);
    if (user && !isGuest) {
      try {
        await updateDoc(doc(db, `users/${user.uid}/investments`, id), { ...updates, updatedAt: new Date().toISOString() });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/investments/${id}`);
      }
    }
  };

  const deleteInvestment = async (id: string) => {
    const updated = investments.filter((i) => i.id !== id);
    setInvestments(updated);
    saveToLocalStorage('investments', updated);
    if (user && !isGuest) {
      try {
        await deleteDoc(doc(db, `users/${user.uid}/investments`, id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/investments/${id}`);
      }
    }
  };

  // CATEGORIES
  const addCategory = (cat: Omit<Category, 'id'>) => {
    const id = `cat_custom_${Date.now()}`;
    const newCat: Category = { ...cat, id, isCustom: true };
    const updated = [...categories, newCat];
    setCategories(updated);
    saveToLocalStorage('categories', updated);
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    const updated = categories.map((c) => (c.id === id ? { ...c, ...updates } : c));
    setCategories(updated);
    saveToLocalStorage('categories', updated);
  };

  const deleteCategory = (id: string) => {
    const updated = categories.filter((c) => c.id !== id);
    setCategories(updated);
    saveToLocalStorage('categories', updated);
  };

  // NOTIFICATIONS
  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // STATEMENT GENERATOR FOR ANY ACCOUNT
  const getAccountStatement = (accountId: string, startDate?: string, endDate?: string): AccountStatement | null => {
    const account = accounts.find((a) => a.id === accountId);
    if (!account) return null;

    let filteredTxs = transactions.filter(
      (t) => t.accountId === accountId || t.targetAccountId === accountId
    );

    if (startDate) {
      filteredTxs = filteredTxs.filter((t) => t.date >= startDate);
    }
    if (endDate) {
      filteredTxs = filteredTxs.filter((t) => t.date <= endDate);
    }

    let totalIncome = 0;
    let totalExpense = 0;
    let totalTransferIn = 0;
    let totalTransferOut = 0;
    let totalLoanReceipts = 0;
    let totalLoanPayments = 0;

    filteredTxs.forEach((t) => {
      if (t.accountId === accountId) {
        if (t.type === 'income') totalIncome += t.amount;
        else if (t.type === 'expense') totalExpense += t.amount;
        else if (t.type === 'transfer') totalTransferOut += t.amount;
        else if (t.type === 'loan_given' || t.type === 'loan_repayment' || t.type === 'credit_card_payment') {
          totalLoanPayments += t.amount;
        }
      }
      if (t.targetAccountId === accountId) {
        if (t.type === 'transfer' || t.type === 'credit_card_payment') {
          totalTransferIn += t.amount;
        } else if (t.type === 'loan_taken' || t.type === 'loan_collection') {
          totalLoanReceipts += t.amount;
        }
      }
    });

    const netChange =
      totalIncome + totalTransferIn + totalLoanReceipts - (totalExpense + totalTransferOut + totalLoanPayments);
    const openingBalance = account.initialBalance || 0;
    const closingBalance = account.balance || 0;

    return {
      account,
      startDate: startDate || (filteredTxs.length > 0 ? filteredTxs[filteredTxs.length - 1].date : ''),
      endDate: endDate || (filteredTxs.length > 0 ? filteredTxs[0].date : ''),
      openingBalance,
      totalIncome,
      totalExpense,
      totalTransferIn,
      totalTransferOut,
      totalLoanReceipts,
      totalLoanPayments,
      netChange,
      closingBalance,
      transactions: filteredTxs,
    };
  };

  // BACKUP & RESTORE
  const exportDataJSON = () => {
    const fullBackup = {
      app: 'FINORA',
      version: '2.5.0',
      exportedAt: new Date().toISOString(),
      currency,
      accounts,
      transactions,
      loans,
      budgets,
      savingsGoals,
      bills,
      investments,
      categories,
    };
    return JSON.stringify(fullBackup, null, 2);
  };

  const importDataJSON = async (jsonInput: string | any): Promise<boolean> => {
    try {
      let data: any = typeof jsonInput === 'string' ? JSON.parse(jsonInput) : jsonInput;
      if (!data) return false;

      // Check if data is nested inside a payload or data wrapper (from snapshots or cloud backups)
      if (data.payload && typeof data.payload === 'object') {
        data = data.payload;
      } else if (data.data && typeof data.data === 'object' && (data.data.accounts || data.data.transactions)) {
        data = data.data;
      }

      const importedAccounts = Array.isArray(data.accounts) ? data.accounts : (data.accounts ? [data.accounts] : accounts);
      const importedTransactions = Array.isArray(data.transactions) ? data.transactions : (data.transactions ? [data.transactions] : transactions);
      const importedLoans = Array.isArray(data.loans) ? data.loans : loans;
      const importedBudgets = Array.isArray(data.budgets) ? data.budgets : budgets;
      const importedSavings = Array.isArray(data.savingsGoals) ? data.savingsGoals : (Array.isArray(data.goals) ? data.goals : savingsGoals);
      const importedBills = Array.isArray(data.bills) ? data.bills : bills;
      const importedInvestments = Array.isArray(data.investments) ? data.investments : investments;
      const importedCategories = Array.isArray(data.categories) && data.categories.length > 0 ? data.categories : categories;

      setAccounts(importedAccounts);
      setTransactions(importedTransactions);
      setLoans(importedLoans);
      setBudgets(importedBudgets);
      setSavingsGoals(importedSavings);
      setBills(importedBills);
      setInvestments(importedInvestments);
      setCategories(importedCategories);

      if (data.currency) {
        setCurrency(data.currency);
      }

      saveToLocalStorage('accounts', importedAccounts);
      saveToLocalStorage('transactions', importedTransactions);
      saveToLocalStorage('loans', importedLoans);
      saveToLocalStorage('budgets', importedBudgets);
      saveToLocalStorage('goals', importedSavings);
      saveToLocalStorage('bills', importedBills);
      saveToLocalStorage('investments', importedInvestments);
      saveToLocalStorage('categories', importedCategories);

      // Cloud Firestore batch sync if authenticated
      if (user && !isGuest) {
        try {
          const batch = writeBatch(db);
          for (const acc of importedAccounts) {
            batch.set(doc(db, `users/${user.uid}/accounts`, acc.id), acc);
          }
          for (const tx of importedTransactions.slice(0, 100)) {
            batch.set(doc(db, `users/${user.uid}/transactions`, tx.id), tx);
          }
          await batch.commit();
        } catch (err) {
          console.warn('Firestore restore sync warning:', err);
        }
      }

      return true;
    } catch (e) {
      console.error('Import error:', e);
      return false;
    }
  };

  const syncAllDataToFirestore = async (): Promise<{ success: boolean; count: number }> => {
    if (!user || isGuest) {
      return { success: false, count: 0 };
    }

    try {
      setSyncStatus('syncing');
      const batch = writeBatch(db);
      let count = 0;

      // 1. User profile doc
      const userRef = doc(db, 'users', user.uid);
      batch.set(userRef, {
        email: user.email || '',
        displayName: user.displayName || '',
        lastActive: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      count++;

      // 2. Accounts
      accounts.forEach((acc) => {
        batch.set(doc(db, `users/${user.uid}/accounts`, acc.id), acc, { merge: true });
        count++;
      });

      // 3. Transactions
      transactions.forEach((tx) => {
        batch.set(doc(db, `users/${user.uid}/transactions`, tx.id), tx, { merge: true });
        count++;
      });

      // 4. Loans
      loans.forEach((loan) => {
        batch.set(doc(db, `users/${user.uid}/loans`, loan.id), loan, { merge: true });
        count++;
      });

      // 5. Budgets
      budgets.forEach((bgt) => {
        batch.set(doc(db, `users/${user.uid}/budgets`, bgt.id), bgt, { merge: true });
        count++;
      });

      // 6. Savings Goals
      savingsGoals.forEach((goal) => {
        batch.set(doc(db, `users/${user.uid}/savingsGoals`, goal.id), goal, { merge: true });
        count++;
      });

      // 7. Bills
      bills.forEach((bill) => {
        batch.set(doc(db, `users/${user.uid}/bills`, bill.id), bill, { merge: true });
        count++;
      });

      // 8. Investments
      investments.forEach((inv) => {
        batch.set(doc(db, `users/${user.uid}/investments`, inv.id), inv, { merge: true });
        count++;
      });

      // 9. Categories
      categories.forEach((cat) => {
        batch.set(doc(db, `users/${user.uid}/categories`, cat.id), cat, { merge: true });
        count++;
      });

      await batch.commit();
      setSyncStatus('synced');
      return { success: true, count };
    } catch (err) {
      console.error('Error syncing all data to Firestore:', err);
      setSyncStatus('error');
      return { success: false, count: 0 };
    }
  };

  const resetAllData = async () => {
    localStorage.clear();
    seedInitialData();
  };

  return (
    <FinancialContext.Provider
      value={{
        accounts,
        transactions,
        categories,
        loans,
        budgets,
        savingsGoals,
        bills,
        investments,
        currency,
        currencySymbol,
        language,
        privacyMode,
        theme,
        notifications,
        insights,
        summary,
        loading,
        syncStatus,
        setCurrency,
        setCurrencySymbol,
        setLanguage,
        setPrivacyMode,
        togglePrivacyMode,
        setTheme,
        markNotificationAsRead,
        clearAllNotifications,
        addAccount,
        updateAccount,
        deleteAccount,
        toggleHideAccount,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        transferFunds,
        addLoan,
        repayBorrowedLoan,
        collectLentLoan,
        deleteLoan,
        payCreditCardBill,
        addBudget,
        updateBudget,
        deleteBudget,
        addSavingsGoal,
        updateSavingsGoal,
        deleteSavingsGoal,
        contributeToGoal,
        addBill,
        updateBill,
        deleteBill,
        payBill,
        addInvestment,
        updateInvestment,
        deleteInvestment,
        addCategory,
        updateCategory,
        deleteCategory,
        getAccountStatement,
        exportDataJSON,
        importDataJSON,
        resetAllData,
        exportFullDataJSON: exportDataJSON,
        importFullDataJSON: importDataJSON,
        resetToDemoData: resetAllData,
        syncAllDataToFirestore,
      }}
    >
      {children}
    </FinancialContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinancialContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinancialProvider');
  }
  return context;
};
