import { supabase } from './supabaseClient';
import { UserProfile, UserConsent, Transaction } from '../types';

export const supabaseService = {
  // 1. Profile
  async getProfile(userId: string): Promise<UserProfile | null> {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.warn('Error fetching Supabase profile:', error.message);
      return null;
    }

    if (!data) return null;

    return {
      name: data.name,
      monthlyIncome: Number(data.monthly_income),
      savingsGoal: Number(data.savings_goal),
      riskTolerance: data.risk_tolerance,
      investmentHorizonYears: Number(data.investment_horizon_years),
      emergencyFundTargetMonths: Number(data.emergency_fund_target_months),
      emergencyFundCurrent: Number(data.emergency_fund_current),
      existingInvestments: data.existing_investments || {
        equity: 0,
        debt: 0,
        gold: 0,
        cash: 0,
      },
    };
  },

  async updateProfile(userId: string, profile: Partial<UserProfile>): Promise<void> {
    if (!supabase) return;
    const updatePayload: Record<string, any> = {};
    if (profile.name !== undefined) updatePayload.name = profile.name;
    if (profile.monthlyIncome !== undefined) updatePayload.monthly_income = profile.monthlyIncome;
    if (profile.savingsGoal !== undefined) updatePayload.savings_goal = profile.savingsGoal;
    if (profile.riskTolerance !== undefined) updatePayload.risk_tolerance = profile.riskTolerance;
    if (profile.investmentHorizonYears !== undefined) updatePayload.investment_horizon_years = profile.investmentHorizonYears;
    if (profile.emergencyFundTargetMonths !== undefined) updatePayload.emergency_fund_target_months = profile.emergencyFundTargetMonths;
    if (profile.emergencyFundCurrent !== undefined) updatePayload.emergency_fund_current = profile.emergencyFundCurrent;
    if (profile.existingInvestments !== undefined) updatePayload.existing_investments = profile.existingInvestments;

    const { error } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('id', userId);

    if (error) {
      console.error('Error updating profile in Supabase:', error);
      throw error;
    }
  },

  // 2. Consent
  async getConsent(userId: string): Promise<UserConsent | null> {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('user_consents')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.warn('Error fetching Supabase consent:', error.message);
      return null;
    }

    if (!data) return null;

    return {
      shareTransactions: Boolean(data.share_transactions),
      shareIncome: Boolean(data.share_income),
      shareInvestments: Boolean(data.share_investments),
      aiAdvisoryConsent: Boolean(data.ai_advisory_consent),
      lastUpdated: data.last_updated || new Date().toISOString(),
    };
  },

  async updateConsent(userId: string, consent: Partial<UserConsent>): Promise<void> {
    if (!supabase) return;
    const updatePayload: Record<string, any> = {
      last_updated: new Date().toISOString(),
    };
    if (consent.shareTransactions !== undefined) updatePayload.share_transactions = consent.shareTransactions;
    if (consent.shareIncome !== undefined) updatePayload.share_income = consent.shareIncome;
    if (consent.shareInvestments !== undefined) updatePayload.share_investments = consent.shareInvestments;
    if (consent.aiAdvisoryConsent !== undefined) updatePayload.ai_advisory_consent = consent.aiAdvisoryConsent;

    const { error } = await supabase
      .from('user_consents')
      .update(updatePayload)
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating consent in Supabase:', error);
      throw error;
    }
  },

  // 3. Transactions
  async getTransactions(userId: string): Promise<Transaction[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching Supabase transactions:', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      date: row.date,
      description: row.description,
      source: row.source,
      amount: Number(row.amount),
      type: row.type,
      category: row.category,
      paymentMethod: row.payment_method,
      notes: row.notes || '',
    }));
  },

  async addTransaction(userId: string, tx: Omit<Transaction, 'id'>): Promise<Transaction> {
    if (!supabase) throw new Error('Supabase is not configured');

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        date: tx.date,
        description: tx.description,
        source: tx.source,
        amount: tx.amount,
        type: tx.type,
        category: tx.category,
        payment_method: tx.paymentMethod,
        notes: tx.notes || '',
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting transaction in Supabase:', error);
      throw error;
    }

    return {
      id: data.id,
      date: data.date,
      description: data.description,
      source: data.source,
      amount: Number(data.amount),
      type: data.type,
      category: data.category,
      paymentMethod: data.payment_method,
      notes: data.notes || '',
    };
  },

  async deleteTransaction(userId: string, txId: string): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', txId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting transaction in Supabase:', error);
      throw error;
    }
  },

  // 4. Data Sovereignty
  async wipeUserData(userId: string): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase.rpc('wipe_user_data', { target_user_id: userId });
    if (error) {
      // Fallback manual wipe if RPC not loaded
      await supabase.from('transactions').delete().eq('user_id', userId);
      await supabase.from('user_consents').update({
        share_transactions: false,
        share_income: false,
        share_investments: false,
        ai_advisory_consent: false,
        last_updated: new Date().toISOString(),
      }).eq('user_id', userId);
    }
  },

  async resetDemoData(userId: string): Promise<void> {
    if (!supabase) return;
    // Delete existing
    await supabase.from('transactions').delete().eq('user_id', userId);
    
    // Reset Profile
    await supabase.from('profiles').update({
      monthly_income: 85000,
      savings_goal: 25000,
      risk_tolerance: 'moderate',
      investment_horizon_years: 7,
      emergency_fund_target_months: 6,
      emergency_fund_current: 180000,
      existing_investments: { equity: 250000, debt: 120000, gold: 60000, cash: 40000 },
    }).eq('id', userId);

    // Reset Consent
    await supabase.from('user_consents').update({
      share_transactions: true,
      share_income: true,
      share_investments: true,
      ai_advisory_consent: true,
      last_updated: new Date().toISOString(),
    }).eq('user_id', userId);

    // Re-insert starter transactions
    await supabase.from('transactions').insert([
      { user_id: userId, date: '2026-10-01', description: 'Monthly Salary Credit (Tech Corp)', amount: 85000, type: 'income', category: 'Salary', payment_method: 'Direct Bank Transfer', notes: 'Corporate payroll deposit' },
      { user_id: userId, date: '2026-10-02', description: '2BHK Apartment Rent', amount: 24000, type: 'expense', category: 'Housing', payment_method: 'Net Banking', notes: 'Essential house rent' },
      { user_id: userId, date: '2026-10-05', description: 'Supermarket Grocery & Zepto Pantry', amount: 7200, type: 'expense', category: 'Food & Dining', payment_method: 'UPI', notes: 'Monthly groceries' },
      { user_id: userId, date: '2026-10-10', description: 'Electricity & Water Utility Bills', amount: 3200, type: 'expense', category: 'Utilities', payment_method: 'UPI', notes: 'Utility bills' },
      { user_id: userId, date: '2026-10-14', description: 'Metro Pass & Fuel Commute', amount: 2800, type: 'expense', category: 'Transportation', payment_method: 'Card', notes: 'Daily commute' },
      { user_id: userId, date: '2026-10-18', description: 'Weekend Family Dinner Out', amount: 3400, type: 'expense', category: 'Food & Dining', payment_method: 'UPI', notes: 'Dining out' },
      { user_id: userId, date: '2026-10-21', description: 'OTT & Music Subscriptions', amount: 1199, type: 'expense', category: 'Subscriptions', payment_method: 'Auto-debit', notes: 'Netflix & Spotify' },
      { user_id: userId, date: '2026-10-24', description: 'Health & Term Insurance Premium', amount: 2500, type: 'expense', category: 'Healthcare', payment_method: 'Net Banking', notes: 'Quarterly policy' },
    ]);
  },
};
