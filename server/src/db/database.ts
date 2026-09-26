import fs from 'fs';
import path from 'path';
import { Transaction, UserConsent, UserProfile } from '../types.js';

interface DatabaseSchema {
  consent: UserConsent;
  profile: UserProfile;
  transactions: Transaction[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'financial_data.json');

const DEFAULT_CONSENT: UserConsent = {
  shareTransactions: true,
  shareIncome: true,
  shareInvestments: true,
  aiAdvisoryConsent: true,
  lastUpdated: new Date().toISOString(),
};

const DEFAULT_PROFILE: UserProfile = {
  name: 'Aarav Sharma',
  monthlyIncome: 85000,
  savingsGoal: 25000,
  riskTolerance: 'moderate',
  investmentHorizonYears: 7,
  emergencyFundTargetMonths: 6,
  emergencyFundCurrent: 180000,
  existingInvestments: {
    equity: 250000,
    debt: 120000,
    gold: 60000,
    cash: 40000,
  },
};

const DEFAULT_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    date: '2026-09-01',
    description: 'Monthly Salary Credit (Tech Corp)',
    amount: 85000,
    type: 'income',
    category: 'Other',
    paymentMethod: 'Net Banking',
    notes: 'Direct corporate payroll deposit via NEFT',
  },
  {
    id: 'tx-2',
    date: '2026-09-02',
    description: '2BHK Apartment Rent',
    amount: 24000,
    type: 'expense',
    category: 'Housing',
    paymentMethod: 'Net Banking',
    notes: 'Essential house rent',
  },
  {
    id: 'tx-3',
    date: '2026-09-03',
    description: 'Supermarket Grocery & Zepto Pantry',
    amount: 7200,
    type: 'expense',
    category: 'Food & Dining',
    paymentMethod: 'UPI',
    notes: 'Monthly staples & fresh vegetables',
  },
  {
    id: 'tx-4',
    date: '2026-09-05',
    description: 'Electricity Bill & JioFiber Broadband',
    amount: 3100,
    type: 'expense',
    category: 'Utilities',
    paymentMethod: 'UPI',
    notes: 'Monthly utility bills',
  },
  {
    id: 'tx-5',
    date: '2026-09-07',
    description: 'Weekend Dining & Lounge with Friends',
    amount: 4500,
    type: 'expense',
    category: 'Food & Dining',
    paymentMethod: 'Credit Card',
    notes: 'Discretionary weekend social dinner',
  },
  {
    id: 'tx-6',
    date: '2026-09-10',
    description: 'Metro Card Recharge & Uber Auto Commutes',
    amount: 2600,
    type: 'expense',
    category: 'Transportation',
    paymentMethod: 'UPI',
    notes: 'Office commute & metro pass',
  },
  {
    id: 'tx-7',
    date: '2026-09-12',
    description: 'Subscriptions (Netflix, JioCinema, Spotify)',
    amount: 1299,
    type: 'expense',
    category: 'Subscriptions',
    paymentMethod: 'Credit Card',
    notes: 'Recurring entertainment OTT apps',
  },
  {
    id: 'tx-8',
    date: '2026-09-14',
    description: 'UTI Nifty 50 Index Mutual Fund SIP',
    amount: 12000,
    type: 'expense',
    category: 'Investment',
    paymentMethod: 'Net Banking',
    notes: 'Automated disciplined equity SIP on Zerodha Coin',
  },
  {
    id: 'tx-9',
    date: '2026-09-16',
    description: 'Online Shopping (Amazon Great Indian Sale)',
    amount: 5400,
    type: 'expense',
    category: 'Shopping',
    paymentMethod: 'Credit Card',
    notes: 'Apparel and electronics sale',
  },
  {
    id: 'tx-10',
    date: '2026-09-18',
    description: 'Apollo Pharmacy & Diagnostic Lab Checkup',
    amount: 1450,
    type: 'expense',
    category: 'Healthcare',
    paymentMethod: 'UPI',
    notes: 'Routine health vitamins and preventive checkup',
  },
  {
    id: 'tx-11',
    date: '2026-09-20',
    description: 'Swiggy & Zomato Food Deliveries',
    amount: 3800,
    type: 'expense',
    category: 'Food & Dining',
    paymentMethod: 'UPI',
    notes: 'Late night takeout and weekend food deliveries',
  },
  {
    id: 'tx-12',
    date: '2026-09-22',
    description: 'PVR INOX Movie Tickets & Snacks',
    amount: 1400,
    type: 'expense',
    category: 'Entertainment',
    paymentMethod: 'UPI',
    notes: 'Weekend movie outing with popcorn',
  },
];

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.ensureDataDir();
    this.data = this.loadData();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadData(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('Failed to parse database file, re-initializing with defaults', err);
    }

    const initialData: DatabaseSchema = {
      consent: { ...DEFAULT_CONSENT },
      profile: { ...DEFAULT_PROFILE },
      transactions: [...DEFAULT_TRANSACTIONS],
    };
    this.saveData(initialData);
    return initialData;
  }

  private saveData(data: DatabaseSchema) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving database file:', err);
    }
  }

  // --- Consent Methods ---
  public getConsent(): UserConsent {
    return { ...this.data.consent };
  }

  public updateConsent(updated: Partial<UserConsent>): UserConsent {
    this.data.consent = {
      ...this.data.consent,
      ...updated,
      lastUpdated: new Date().toISOString(),
    };
    this.saveData(this.data);
    return this.data.consent;
  }

  // --- User Profile Methods ---
  public getProfile(): UserProfile {
    return { ...this.data.profile };
  }

  public updateProfile(updated: Partial<UserProfile>): UserProfile {
    this.data.profile = {
      ...this.data.profile,
      ...updated,
    };
    this.saveData(this.data);
    return this.data.profile;
  }

  // --- Transaction Methods ---
  public getTransactions(limit?: number): Transaction[] {
    const list = [...this.data.transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return limit ? list.slice(0, limit) : list;
  }

  public addTransaction(tx: Omit<Transaction, 'id'>): Transaction {
    const newTx: Transaction = {
      ...tx,
      id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    };
    this.data.transactions.unshift(newTx);
    this.saveData(this.data);
    return newTx;
  }

  public deleteTransaction(id: string): boolean {
    const initialLen = this.data.transactions.length;
    this.data.transactions = this.data.transactions.filter(t => t.id !== id);
    if (this.data.transactions.length !== initialLen) {
      this.saveData(this.data);
      return true;
    }
    return false;
  }

  public importTransactions(newTransactions: Omit<Transaction, 'id'>[]): Transaction[] {
    const added: Transaction[] = newTransactions.map((tx, idx) => ({
      ...tx,
      id: 'tx-import-' + Date.now() + '-' + idx + '-' + Math.random().toString(36).substring(2, 6),
    }));
    this.data.transactions = [...added, ...this.data.transactions];
    this.saveData(this.data);
    return added;
  }

  // --- Privacy & Consent Control: Wipe Data ---
  public wipeUserData(): void {
    this.data.transactions = [];
    this.data.profile = {
      name: 'User',
      monthlyIncome: 0,
      savingsGoal: 0,
      riskTolerance: 'moderate',
      investmentHorizonYears: 5,
      emergencyFundTargetMonths: 6,
      emergencyFundCurrent: 0,
      existingInvestments: {
        equity: 0,
        debt: 0,
        gold: 0,
        cash: 0,
      },
    };
    this.data.consent = {
      shareTransactions: false,
      shareIncome: false,
      shareInvestments: false,
      aiAdvisoryConsent: false,
      lastUpdated: new Date().toISOString(),
    };
    this.saveData(this.data);
  }

  public resetDemoData(): void {
    this.data = {
      consent: { ...DEFAULT_CONSENT },
      profile: { ...DEFAULT_PROFILE },
      transactions: [...DEFAULT_TRANSACTIONS],
    };
    this.saveData(this.data);
  }
}

export const db = new Database();
