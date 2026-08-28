import { Category } from '../types';

export const APP_INFO = {
  name: 'FINORA',
  tagline: 'Take Control of Your Money.',
  developedBy: 'Md. Ibrahim Hossain',
  poweredBy: 'TIKMERK IT',
  website: 'https://www.tikmerk.com',
  version: '2.5.0',
  description: 'A complete personal financial management system for tracking accounts, cash flows, loans, transfers, credit cards, investments, budgets, and savings goals with absolute precision.'
};

export const CURRENCIES = [
  { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka (BDT)' },
  { code: 'USD', symbol: '$', name: 'US Dollar (USD)' },
  { code: 'EUR', symbol: '€', name: 'Euro (EUR)' },
  { code: 'GBP', symbol: '£', name: 'British Pound (GBP)' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee (INR)' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal (SAR)' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham (AED)' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar (CAD)' },
  { code: 'AUD', symbol: 'AU$', name: 'Australian Dollar (AUD)' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit (MYR)' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar (SGD)' },
];

export const DEFAULT_INCOME_CATEGORIES: Category[] = [
  {
    id: 'cat_inc_salary',
    name: 'Salary / বেতন',
    nameBn: 'বেতন',
    type: 'income',
    icon: 'Briefcase',
    color: '#10b981',
    subcategories: ['Monthly Salary', 'Overtime', 'Bonus', 'Allowance']
  },
  {
    id: 'cat_inc_business',
    name: 'Business / ব্যবসা',
    nameBn: 'ব্যবসা ও ট্রেড',
    type: 'income',
    icon: 'Building2',
    color: '#3b82f6',
    subcategories: ['Sales Revenue', 'Client Project', 'Product Sales', 'Consulting']
  },
  {
    id: 'cat_inc_freelance',
    name: 'Freelancing / আউটসোর্সিং',
    nameBn: 'ফ্রিল্যান্সিং',
    type: 'income',
    icon: 'Laptop',
    color: '#8b5cf6',
    subcategories: ['Upwork', 'Fiverr', 'Direct Client', 'Software Dev']
  },
  {
    id: 'cat_inc_investment',
    name: 'Investment Return / বিনিয়োগ আয়',
    nameBn: 'বিনিয়োগ ও মুনাফা',
    type: 'income',
    icon: 'TrendingUp',
    color: '#06b6d4',
    subcategories: ['Dividends', 'Interest Profit', 'DPS Maturity', 'Stock Capital Gain']
  },
  {
    id: 'cat_inc_rent',
    name: 'Rental Income / বাড়ি ভাড়া',
    nameBn: 'ভাড়া প্রাপ্তি',
    type: 'income',
    icon: 'Home',
    color: '#f59e0b',
    subcategories: ['House Rent', 'Commercial Shop', 'Sublet']
  },
  {
    id: 'cat_inc_gift',
    name: 'Gift & Remittance / উপহার ও অনুদান',
    nameBn: 'উপহার ও রেমিট্যান্স',
    type: 'income',
    icon: 'Gift',
    color: '#ec4899',
    subcategories: ['Foreign Remittance', 'Eid Gift', 'Family Support', 'Prize']
  },
  {
    id: 'cat_inc_other',
    name: 'Other Income / অন্যান্য আয়',
    nameBn: 'অন্যান্য আয়',
    type: 'income',
    icon: 'PlusCircle',
    color: '#64748b',
    subcategories: ['Cashback', 'Refund', 'Asset Sale', 'Miscellaneous']
  }
];

export const DEFAULT_EXPENSE_CATEGORIES: Category[] = [
  {
    id: 'cat_exp_food',
    name: 'Food & Dining / খাবার ও ডাইনিং',
    nameBn: 'খাবার ও রেস্তোরাঁ',
    type: 'expense',
    icon: 'Utensils',
    color: '#ef4444',
    subcategories: ['Restaurants', 'Snacks & Tea', 'Coffee', 'Office Lunch', 'Party']
  },
  {
    id: 'cat_exp_grocery',
    name: 'Grocery & Bazaar / কাঁচাবাজার ও মুদি',
    nameBn: 'মুদি ও বাজার',
    type: 'expense',
    icon: 'ShoppingBag',
    color: '#f97316',
    subcategories: ['Daily Market', 'Super Shop', 'Fish & Meat', 'Vegetables', 'Cooking Oil']
  },
  {
    id: 'cat_exp_rent',
    name: 'Rent & Housing / বাড়ি ভাড়া ও রক্ষণাবেক্ষণ',
    nameBn: 'বাড়ি ভাড়া',
    type: 'expense',
    icon: 'Home',
    color: '#6366f1',
    subcategories: ['Apartment Rent', 'Service Charge', 'Home Repair', 'Furniture']
  },
  {
    id: 'cat_exp_utilities',
    name: 'Bills & Utilities / বিল ও ইউটিলিটি',
    nameBn: 'ইউটিলিটি বিল',
    type: 'expense',
    icon: 'Zap',
    color: '#eab308',
    subcategories: ['Electricity (DESCO/DPDC)', 'Gas (Titas/LPG)', 'Water (WASA)', 'Internet WiFi', 'Mobile Recharge']
  },
  {
    id: 'cat_exp_transport',
    name: 'Transportation / যাতায়াত',
    nameBn: 'পরিবহন ও যাতায়াত',
    type: 'expense',
    icon: 'Car',
    color: '#14b8a6',
    subcategories: ['Bus / Metro Rail', 'Ride Sharing (Uber/Pathao)', 'CNG / Rickshaw', 'Fuel / Petrol', 'Vehicle Maintenance']
  },
  {
    id: 'cat_exp_health',
    name: 'Healthcare & Medicine / চিকিৎসা ও ওষুধ',
    nameBn: 'চিকিৎসা ও ওষুধ',
    type: 'expense',
    icon: 'HeartPulse',
    color: '#ec4899',
    subcategories: ['Pharmacy & Medicine', 'Doctor Fee', 'Diagnostic Tests', 'Hospital Bills']
  },
  {
    id: 'cat_exp_education',
    name: 'Education / শিক্ষা',
    nameBn: 'শিক্ষা ও প্রশিক্ষণ',
    type: 'expense',
    icon: 'GraduationCap',
    color: '#8b5cf6',
    subcategories: ['School/College Tuition', 'Books & Stationery', 'Courses & Training', 'Exam Fees']
  },
  {
    id: 'cat_exp_shopping',
    name: 'Shopping & Clothing / কেনাকাটা ও পোশাক',
    nameBn: 'কেনাকাটা',
    type: 'expense',
    icon: 'Shirt',
    color: '#d946ef',
    subcategories: ['Clothes & Shoes', 'Electronics & Gadgets', 'Accessories', 'Household Goods']
  },
  {
    id: 'cat_exp_entertainment',
    name: 'Entertainment & Leisure / বিনোদন ও ভ্রমণ',
    nameBn: 'বিনোদন ও ভ্রমণ',
    type: 'expense',
    icon: 'Film',
    color: '#06b6d4',
    subcategories: ['Movie & Theatre', 'Streaming Subscriptions', 'Travel & Tour', 'Hobbies']
  },
  {
    id: 'cat_exp_family',
    name: 'Family & Donations / পরিবার ও দান',
    nameBn: 'পরিবার ও দান',
    type: 'expense',
    icon: 'Users',
    color: '#84cc16',
    subcategories: ['Parents Support', 'Zakat & Sadaqah', 'Mosque/Charity', 'Pocket Money']
  },
  {
    id: 'cat_exp_other',
    name: 'Other Expense / অন্যান্য খরচ',
    nameBn: 'অন্যান্য খরচ',
    type: 'expense',
    icon: 'CreditCard',
    color: '#64748b',
    subcategories: ['Bank Charges', 'Fines/Taxes', 'Unforeseen Loss', 'General Misc']
  }
];

export const DEFAULT_ACCOUNTS = [
  {
    name: 'Cash in Hand / নগদ টাকা',
    type: 'cash' as const,
    institutionName: 'Wallet',
    balance: 15000,
    initialBalance: 15000,
    color: '#10b981',
    icon: 'Banknote',
    notes: 'Physical cash in wallet and home'
  },
  {
    name: 'City Bank / সিটি ব্যাংক',
    type: 'bank' as const,
    institutionName: 'City Bank PLC',
    accountNumber: '**** 8842',
    balance: 85000,
    initialBalance: 85000,
    color: '#3b82f6',
    icon: 'Building2',
    notes: 'Primary salary and transaction account'
  },
  {
    name: 'bKash / বিকাশ',
    type: 'wallet' as const,
    institutionName: 'bKash Limited',
    accountNumber: '017****9922',
    balance: 12450,
    initialBalance: 12450,
    color: '#e11d48',
    icon: 'Smartphone',
    notes: 'Personal mobile financial service'
  },
  {
    name: 'High Yield Savings / সঞ্চয়ী হিসাব',
    type: 'savings' as const,
    institutionName: 'Islami Bank Bangladesh',
    accountNumber: '**** 4019',
    balance: 120000,
    initialBalance: 120000,
    color: '#059669',
    icon: 'PiggyBank',
    notes: 'Emergency and planned savings deposit'
  },
  {
    name: 'Visa Platinum Credit Card / ক্রেডিট কার্ড',
    type: 'credit_card' as const,
    institutionName: 'BRAC Bank',
    accountNumber: '**** 5120',
    balance: -18500, // Current outstanding liability
    initialBalance: -18500,
    creditLimit: 150000,
    billingDate: 15,
    dueDate: 5,
    color: '#8b5cf6',
    icon: 'CreditCard',
    notes: 'Shopping & travel rewards card'
  }
];
