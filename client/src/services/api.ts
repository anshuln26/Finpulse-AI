import {
  UserConsent,
  UserProfile,
  Transaction,
  BudgetHealth,
  InvestmentPlan,
  AIInsight,
} from '../types';

// In production (Vercel), VITE_API_URL points to the Render backend service
// In development, empty string falls back to Vite proxy at /api
const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const BASE_URL = `${API_BASE}/api`;

export const api = {
  // Consent
  async getConsent(): Promise<UserConsent> {
    const res = await fetch(`${BASE_URL}/consent`);
    const data = await res.json();
    return data.consent;
  },

  async updateConsent(consent: Partial<UserConsent>): Promise<UserConsent> {
    const res = await fetch(`${BASE_URL}/consent`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(consent),
    });
    const data = await res.json();
    return data.consent;
  },

  async wipeUserData(): Promise<void> {
    await fetch(`${BASE_URL}/consent/wipe`, { method: 'POST' });
  },

  async resetDemoData(): Promise<void> {
    await fetch(`${BASE_URL}/consent/reset-demo`, { method: 'POST' });
  },

  // Transactions
  async getTransactions(limit?: number): Promise<Transaction[]> {
    const url = limit ? `${BASE_URL}/transactions?limit=${limit}` : `${BASE_URL}/transactions`;
    const res = await fetch(url);
    const data = await res.json();
    return data.transactions || [];
  },

  async addTransaction(tx: Omit<Transaction, 'id'>): Promise<Transaction> {
    const res = await fetch(`${BASE_URL}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tx),
    });
    const data = await res.json();
    return data.transaction;
  },

  async deleteTransaction(id: string): Promise<void> {
    await fetch(`${BASE_URL}/transactions/${id}`, { method: 'DELETE' });
  },

  async uploadCSV(file: File): Promise<{ count: number; transactions: Transaction[] }> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${BASE_URL}/transactions/csv-upload`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.transactions) && data.transactions.length > 0) {
          return data;
        }
      }
    } catch {
      // Backend unavailable or serverless Vercel host; fallback to browser parser
    }

    return this.parseCSVClientSide(file);
  },

  async parseCSVClientSide(file: File): Promise<{ count: number; transactions: Transaction[] }> {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      return { count: 0, transactions: [] };
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/^["']|["']$/g, ''));
    const transactions: Transaction[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      const row: Record<string, string> = {};
      headers.forEach((h, idx) => {
        row[h] = (values[idx] || '').replace(/^["']|["']$/g, '').trim();
      });

      const desc = row['description'] || row['narrative'] || row['details'] || row['title'] || 'Transaction';
      const rawAmt = row['amount'] || row['debit'] || row['credit'] || '0';
      const parsedAmt = Math.abs(parseFloat(rawAmt.replace(/[^0-9.-]+/g, '')) || 0);

      if (parsedAmt > 0) {
        let type: 'expense' | 'income' = 'expense';
        if (row['type']?.toLowerCase() === 'income' || row['credit']) {
          type = 'income';
        }

        let category: any = row['category'] || 'Other';
        const lowerDesc = desc.toLowerCase();
        if (lowerDesc.includes('rent') || lowerDesc.includes('housing')) category = 'Housing';
        else if (lowerDesc.includes('food') || lowerDesc.includes('swiggy') || lowerDesc.includes('zomato') || lowerDesc.includes('market') || lowerDesc.includes('restaurant')) category = 'Food & Dining';
        else if (lowerDesc.includes('uber') || lowerDesc.includes('metro') || lowerDesc.includes('fuel') || lowerDesc.includes('petrol')) category = 'Transportation';
        else if (lowerDesc.includes('electricity') || lowerDesc.includes('wifi') || lowerDesc.includes('water') || lowerDesc.includes('bill')) category = 'Utilities';
        else if (lowerDesc.includes('movie') || lowerDesc.includes('netflix') || lowerDesc.includes('spotify') || lowerDesc.includes('prime')) category = 'Entertainment';
        else if (lowerDesc.includes('pharmacy') || lowerDesc.includes('hospital') || lowerDesc.includes('clinic')) category = 'Healthcare';
        else if (lowerDesc.includes('amazon') || lowerDesc.includes('flipkart') || lowerDesc.includes('shopping') || lowerDesc.includes('myntra')) category = 'Shopping';
        else if (lowerDesc.includes('sip') || lowerDesc.includes('mutual') || lowerDesc.includes('nifty') || lowerDesc.includes('zerodha') || lowerDesc.includes('groww')) category = 'Investment';
        else if (lowerDesc.includes('emi') || lowerDesc.includes('loan')) category = 'Debt & Loans';
        else if (lowerDesc.includes('sub') || lowerDesc.includes('membership')) category = 'Subscriptions';

        transactions.push({
          id: 'tx-import-' + Date.now() + '-' + i,
          date: row['date'] || new Date().toISOString().split('T')[0],
          description: desc,
          source: type === 'income' ? desc : undefined,
          amount: parsedAmt,
          type,
          category,
          paymentMethod: row['paymentmethod'] || row['payment_method'] || (type === 'income' ? 'Direct Bank Transfer (NEFT / IMPS)' : 'Bank Transfer'),
          notes: row['notes'] || 'Imported via CSV Bank Statement',
        });
      }
    }

    return { count: transactions.length, transactions };
  },

  // Analytics
  async getBudgetHealth(): Promise<BudgetHealth> {
    const res = await fetch(`${BASE_URL}/analytics/budget`);
    const data = await res.json();
    return data.budget;
  },

  async getInvestmentPlan(): Promise<InvestmentPlan> {
    const res = await fetch(`${BASE_URL}/analytics/investments`);
    const data = await res.json();
    return data.investmentPlan;
  },

  // Profile
  async getProfile(): Promise<UserProfile> {
    const res = await fetch(`${BASE_URL}/analytics/profile`);
    const data = await res.json();
    return data.profile;
  },

  async updateProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
    const res = await fetch(`${BASE_URL}/analytics/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    const data = await res.json();
    return data.profile;
  },

  // AI
  async chatWithAI(
    message: string,
    history: { role: 'user' | 'assistant'; content: string }[],
    context?: {
      consent?: UserConsent;
      profile?: UserProfile;
      transactions?: Transaction[];
      budget?: BudgetHealth;
      plan?: InvestmentPlan;
    }
  ): Promise<{ reply: string; consentFiltered: boolean }> {
    const res = await fetch(`${BASE_URL}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history, context }),
    });
    return res.json();
  },

  async getAIInsights(): Promise<AIInsight[]> {
    const res = await fetch(`${BASE_URL}/ai/insights`);
    const data = await res.json();
    return data.insights || [];
  },
};
