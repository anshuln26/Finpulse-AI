import { Router } from 'express';
import { db } from '../db/database.js';
import { FinancialEngine } from '../services/financialEngine.js';

export const financialRouter = Router();

// GET Budget Health & 50/30/20 summary
financialRouter.get('/budget', (req, res) => {
  const consent = db.getConsent();
  const profile = db.getProfile();
  const transactions = db.getTransactions();

  const budget = FinancialEngine.calculateBudgetHealth(transactions, profile, consent);
  res.json({ success: true, budget, consent });
});

// GET Investment Plan & Asset Allocation
financialRouter.get('/investments', (req, res) => {
  const consent = db.getConsent();
  const profile = db.getProfile();
  const transactions = db.getTransactions();

  const budget = FinancialEngine.calculateBudgetHealth(transactions, profile, consent);
  const investmentPlan = FinancialEngine.generateInvestmentPlan(profile, budget, consent);

  res.json({ success: true, investmentPlan, consent });
});

// GET user profile
financialRouter.get('/profile', (req, res) => {
  const profile = db.getProfile();
  res.json({ success: true, profile });
});

// PUT update user profile
financialRouter.put('/profile', (req, res) => {
  const updated = db.updateProfile(req.body);
  res.json({ success: true, profile: updated });
});
