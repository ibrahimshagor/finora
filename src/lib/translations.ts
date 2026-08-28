export type Language = 'bn' | 'en';

export interface TranslationDict {
  [key: string]: {
    bn: string;
    en: string;
  };
}

export const TRANSLATIONS: TranslationDict = {
  // Navigation & Titles
  dashboard: { bn: 'ড্যাশবোর্ড', en: 'Dashboard' },
  accounts: { bn: 'অ্যাকাউন্টস ও ওয়ালেট', en: 'Accounts & Wallets' },
  transactions: { bn: 'লেনদেনের লেজার', en: 'Transactions Ledger' },
  loans: { bn: 'ধার ও ঋণ', en: 'Loans & Debts' },
  credit_cards: { bn: 'ক্রেডিট কার্ড', en: 'Credit Cards' },
  budgets_goals: { bn: 'বাজেট ও লক্ষ্য', en: 'Budgets & Goals' },
  bills: { bn: 'বিল ও সাবস্ক্রিপশন', en: 'Bills & Subscriptions' },
  investments: { bn: 'বিনিয়োগ পোর্টফোলিও', en: 'Investments' },
  reports: { bn: 'রিপোর্ট ও বিবরণী', en: 'Reports & Analytics' },
  reconciliation: { bn: 'হিসাব সমন্বয় ও অডিট', en: 'Reconciliation & Audit' },
  ai_assistant: { bn: 'FINORA AI অ্যাসিস্ট্যান্ট', en: 'FINORA AI Assistant' },
  settings: { bn: 'সেটিংস ও ব্যাকআপ', en: 'Settings & Backup' },
  calculator: { bn: 'ক্যালকুলেটর', en: 'Calculator' },
  about: { bn: 'FINORA পরিচিতি', en: 'About FINORA' },

  // Common Actions
  new_transaction: { bn: 'নতুন লেনদেন', en: 'New Transaction' },
  add_account: { bn: 'নতুন অ্যাকাউন্ট যোগ করুন', en: 'Add Account' },
  edit: { bn: 'সম্পাদনা', en: 'Edit' },
  delete: { bn: 'মুছুন', en: 'Delete' },
  delete_account: { bn: 'অ্যাকাউন্ট মুছুন', en: 'Delete Account' },
  cancel: { bn: 'বাতিল', en: 'Cancel' },
  save: { bn: 'সংরক্ষণ করুন', en: 'Save' },
  close: { bn: 'বন্ধ করুন', en: 'Close' },
  confirm: { bn: 'নিশ্চিত করুন', en: 'Confirm' },
  filter: { bn: 'ফিল্টার', en: 'Filter' },
  search: { bn: 'অনুসন্ধান করুন...', en: 'Search...' },
  transfer: { bn: 'স্থানান্তর', en: 'Transfer' },
  statement: { bn: 'স্টেটমেন্ট', en: 'Statement' },
  deposit: { bn: 'জমা (Inflow)', en: 'Deposit (Inflow)' },
  withdraw: { bn: 'খরচ (Outflow)', en: 'Expense (Outflow)' },
  card_view: { bn: 'কার্ড ভিউ', en: 'Card View' },
  list_view: { bn: 'লিস্ট ভিউ', en: 'List View' },
  
  // Dashboard & Metrics
  net_worth: { bn: 'মোট নিট সম্পদ', en: 'Total Net Worth' },
  total_assets: { bn: 'মোট আর্থিক সম্পদ', en: 'Total Assets' },
  total_liabilities: { bn: 'মোট আর্থিক দায় ও দেনা', en: 'Total Liabilities' },
  monthly_income: { bn: 'চলতি মাসের প্রকৃত আয়', en: 'Monthly Income' },
  monthly_expense: { bn: 'চলতি মাসের প্রকৃত ব্যয়', en: 'Monthly Expense' },
  monthly_savings: { bn: 'চলতি মাসের নিট সঞ্চয়', en: 'Monthly Savings' },
  savings_rate: { bn: 'সঞ্চয়ের হার', en: 'Savings Rate' },
  receivables: { bn: 'পাওনা টাকা', en: 'Receivables' },
  payables: { bn: 'দেনা টাকা', en: 'Payables' },
  current_balance: { bn: 'বর্তমান ব্যালেন্স', en: 'Current Balance' },
  available_balance: { bn: 'উপলব্ধ ব্যালেন্স', en: 'Available Balance' },

  // Accounts
  all_accounts: { bn: 'সব অ্যাকাউন্ট', en: 'All Accounts' },
  active_accounts: { bn: 'সক্রিয় অ্যাকাউন্ট', en: 'Active Accounts' },
  hidden_accounts: { bn: 'লুকানো', en: 'Hidden' },
  cash: { bn: 'নগদ টাকা', en: 'Cash' },
  bank: { bn: 'ব্যাংক হিসাব', en: 'Bank Account' },
  wallet: { bn: 'মোবাইল ওয়ালেট', en: 'Mobile Wallet' },
  savings: { bn: 'সঞ্চয়ী হিসাব', en: 'Savings Deposit' },
  credit_card: { bn: 'ক্রেডিট কার্ড', en: 'Credit Card' },
  investment: { bn: 'বিনিয়োগ', en: 'Investment' },
  account_name: { bn: 'অ্যাকাউন্টের নাম', en: 'Account Name' },
  account_type: { bn: 'অ্যাকাউন্টের ধরন', en: 'Account Type' },
  account_number: { bn: 'অ্যাকাউন্ট নং', en: 'Account No' },
  institution: { bn: 'প্রতিষ্ঠানের নাম', en: 'Institution' },

  // Messages
  delete_account_confirm: { 
    bn: 'আপনি কি নিশ্চিত যে এই অ্যাকাউন্টটি স্থায়ীভাবে মুছে ফেলতে চান? এতে আপনার অ্যাকাউন্টের সব ডেটা ডিলিট হবে।', 
    en: 'Are you sure you want to permanently delete this account? This will remove all associated records.' 
  },
  account_deleted_success: {
    bn: 'অ্যাকাউন্টটি সফলভাবে মুছে ফেলা হয়েছে।',
    en: 'Account has been deleted successfully.'
  },
  
  // Theme & Language
  switch_language: { bn: 'Change to English', en: 'বাংলায় পরিবর্তন করুন' },
  light_mode: { bn: 'লাইট মোড', en: 'Light Mode' },
  dark_mode: { bn: 'ডার্ক মোড', en: 'Dark Mode' },
  privacy_mode: { bn: 'প্রাইভেসি মোড', en: 'Privacy Mode' },
};
