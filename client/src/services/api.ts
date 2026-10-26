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
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${BASE_URL}/transactions/csv-upload`, {
      method: 'POST',
      body: formData,
    });
    return res.json();
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
