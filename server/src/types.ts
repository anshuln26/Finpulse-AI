export type ExpenseCategory =
  | 'Housing'
  | 'Food & Dining'
  | 'Transportation'
  | 'Utilities'
  | 'Entertainment'
  | 'Healthcare'
  | 'Shopping'
  | 'Investment'
  | 'Debt & Loans'
  | 'Subscriptions'
  | 'Other';

export type IncomeCategory =
  | 'Salary'
  | 'Freelance'
  | 'Business'
  | 'Investment Returns'
  | 'Rental Income'
  | 'Bonus'
  | 'Other Income';

export type SpendingCategory = ExpenseCategory | IncomeCategory | string;

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  description: string; // Merchant or Income Source / Payer name
  source?: string;     // Specific Income Source
  amount: number;
  type: 'expense' | 'income';
  category: SpendingCategory;
  paymentMethod: string;
  notes?: string;
}

export interface UserConsent {
  shareTransactions: boolean;
  shareIncome: boolean;
  shareInvestments: boolean;
  aiAdvisoryConsent: boolean;
  lastUpdated: string;
}

export type RiskTolerance = 'conservative' | 'moderate' | 'aggressive';

export interface UserProfile {
  name: string;
  monthlyIncome: number;
  savingsGoal: number;
  riskTolerance: RiskTolerance;
  investmentHorizonYears: number;
  emergencyFundTargetMonths: number;
  emergencyFundCurrent: number;
  existingInvestments: {
    equity: number;
    debt: number;
    gold: number;
    cash: number;
  };
}

export interface CategoryBreakdown {
  category: SpendingCategory;
  amount: number;
  percentage: number;
}

export interface BudgetHealth {
  monthlyIncome: number;
  totalExpenses: number;
  netSavings: number;
  savingsRate: number;
  rule50_30_20: {
    needs: { amount: number; percentage: number; targetPercentage: 50 };
    wants: { amount: number; percentage: number; targetPercentage: 30 };
    savings: { amount: number; percentage: number; targetPercentage: 20 };
  };
  categories: CategoryBreakdown[];
  overspendingAlerts: Array<{
    category: string;
    message: string;
    severity: 'warning' | 'danger' | 'info';
    amount: number;
  }>;
}

export interface AssetAllocation {
  equity: number; // %
  debt: number;   // %
  gold: number;   // %
  cash: number;   // %
}

export interface InvestmentPlan {
  riskProfile: RiskTolerance;
  recommendedAllocation: AssetAllocation;
  currentAllocation: AssetAllocation;
  monthlySurplus: number;
  recommendedMonthlyInvestment: number;
  emergencyFundHealth: {
    current: number;
    target: number;
    monthsCovered: number;
    targetMonths: number;
    isAdequate: boolean;
    shortfall: number;
    monthlyEssentialExpenses?: number;
    statusLevel?: 'critical' | 'low' | 'moderate' | 'healthy';
    statusColor?: 'red' | 'orange' | 'yellow' | 'green';
    statusLabel?: string;
  };
  suggestedVehicles: Array<{
    type: 'Equity/Index' | 'Debt/FD/Bonds' | 'Gold' | 'Liquid/Emergency';
    name: string;
    allocationPercent: number;
    suggestedMonthlyAmount: number;
    riskLevel: string;
    rationale: string;
  }>;
  actionItems: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  consentFiltered?: boolean;
}
