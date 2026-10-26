import React, { useState } from 'react';
import {
  Sparkles,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  ArrowUpRight,
  ArrowDownLeft,
  Shield,
  Layers,
  Plus,
  UploadCloud,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import {
  BudgetHealth,
  UserConsent,
  UserProfile,
  Transaction,
  AIInsight,
  InvestmentPlan,
  RiskTolerance,
} from '../types';

interface DashboardProps {
  budget: BudgetHealth | null;
  profile: UserProfile | null;
  consent: UserConsent | null;
  plan: InvestmentPlan | null;
  transactions: Transaction[];
  insights: AIInsight[];
  onNavigate: (tab: any) => void;
  onOpenAddModal: () => void;
  onOpenCSVModal?: () => void;
  onUpdateRiskProfile?: (risk: RiskTolerance) => Promise<void>;
}

const EXPENSE_COLORS = [
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#f59e0b', // amber
  '#ef4444', // red
  '#64748b', // slate
];

const ALLOCATION_COLORS: Record<string, string> = {
  equity: '#10b981', // emerald
  debt: '#3b82f6',   // blue
  gold: '#f59e0b',   // amber
  cash: '#06b6d4',   // cyan
};

export const Dashboard: React.FC<DashboardProps> = ({
  budget,
  profile,
  consent,
  plan,
  transactions,
  insights,
  onNavigate,
  onOpenAddModal,
  onOpenCSVModal,
  onUpdateRiskProfile,
}) => {
  const isIncomeShared = consent?.shareIncome;
  const isTxShared = consent?.shareTransactions;
  const isInvestShared = consent?.shareInvestments;

  const [updatingRisk, setUpdatingRisk] = useState(false);

  // Prepare Expense Donut Data
  const expensePieData = (budget?.categories || []).map((cat) => ({
    name: cat.category,
    value: cat.amount,
  }));

  // Prepare Investment Allocation Donut Data
  const targetAllocationData = plan
    ? [
        { name: 'Nifty 50 / Equity', value: plan.recommendedAllocation.equity, color: ALLOCATION_COLORS.equity },
        { name: 'Debt / PPF', value: plan.recommendedAllocation.debt, color: ALLOCATION_COLORS.debt },
        { name: 'Gold / SGB', value: plan.recommendedAllocation.gold, color: ALLOCATION_COLORS.gold },
        { name: 'Liquid / Sweep FD', value: plan.recommendedAllocation.cash, color: ALLOCATION_COLORS.cash },
      ]
    : [];

  const handleRiskChange = async (risk: RiskTolerance) => {
    if (!onUpdateRiskProfile || updatingRisk) return;
    setUpdatingRisk(true);
    try {
      await onUpdateRiskProfile(risk);
    } finally {
      setUpdatingRisk(false);
    }
  };

  const emergencyMonths = plan?.emergencyFundHealth.monthsCovered ?? 0;
  const emergencyTarget = plan?.emergencyFundHealth.target ?? 180000;
  const emergencyCurrent = plan?.emergencyFundHealth.current ?? 0;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* =========================================================================
          1. TOP WELCOME & QUICK ACTIONS HEADER
         ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-50/90 via-teal-50/60 to-cyan-50/50 dark:bg-none dark:bg-[#111827] p-6 rounded-2xl border border-emerald-200/90 dark:border-slate-800 transition-colors shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300">
              Master Financial Dashboard
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Welcome back, {profile?.name || 'Aarav'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Financial Health & Wealth Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            Unified view of monthly cashflow, 50/30/20 budget adherence, expense leakage controls, and personalized investment compounding.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition active:scale-95"
            title="Add Expense or Income Entry"
          >
            <Plus className="w-4 h-4" />
            <span>Add Entry</span>
          </button>

          {onOpenCSVModal && (
            <button
              onClick={onOpenCSVModal}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold shadow-xs transition active:scale-95"
              title="Import Bank Statement CSV"
            >
              <UploadCloud className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Import CSV</span>
            </button>
          )}

          <button
            onClick={() => onNavigate('aichat')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-semibold shadow-sm transition active:scale-95"
            title="Consult FinPulse AI Copilot"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ask AI Copilot</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          2. TOP 4 KEY KPI CARDS: CASHFLOW & SAVINGS
         ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Monthly Income */}
        <div className="bg-gradient-to-br from-emerald-50/90 to-teal-50/40 dark:bg-none dark:bg-[#111827] border border-emerald-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-slate-700 rounded-2xl p-5 transition-colors shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">
              Monthly Income
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
            {isIncomeShared && budget ? (
              `+₹${budget.monthlyIncome.toLocaleString('en-IN')}`
            ) : (
              <span className="text-slate-400 text-sm font-normal flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" /> Withheld
              </span>
            )}
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 font-medium">
            {isIncomeShared ? 'Primary declared salary/cashflow' : 'Enable in Consent Center'}
          </p>
        </div>

        {/* Monthly Expenses */}
        <div className="bg-gradient-to-br from-rose-50/90 to-pink-50/40 dark:bg-none dark:bg-[#111827] border border-rose-200 dark:border-slate-800 hover:border-rose-300 dark:hover:border-slate-700 rounded-2xl p-5 transition-colors shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-bold text-rose-800 dark:text-rose-400 uppercase tracking-wider">
              Monthly Outflow
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
            {isTxShared && budget ? (
              `-₹${budget.totalExpenses.toLocaleString('en-IN')}`
            ) : (
              <span className="text-slate-400 text-sm font-normal flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" /> Withheld
              </span>
            )}
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 font-medium">
            {isTxShared ? `${transactions.length} total entries recorded` : 'Sharing disabled'}
          </p>
        </div>

        {/* Net Monthly Surplus */}
        <div className="bg-gradient-to-br from-indigo-50/90 to-blue-50/40 dark:bg-none dark:bg-[#111827] border border-indigo-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-slate-700 rounded-2xl p-5 transition-colors shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-bold text-indigo-800 dark:text-indigo-400 uppercase tracking-wider">
              Monthly Surplus
            </span>
            <Wallet className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
            {isIncomeShared && isTxShared && budget ? (
              `₹${budget.netSavings.toLocaleString('en-IN')}`
            ) : (
              <span className="text-slate-400 text-sm font-normal flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" /> Withheld
              </span>
            )}
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 font-medium">
            {isIncomeShared ? 'Net cash available for Index SIP' : 'Consent required'}
          </p>
        </div>

        {/* Savings Rate */}
        <div className="bg-gradient-to-br from-sky-50/90 to-cyan-50/40 dark:bg-none dark:bg-[#111827] border border-sky-200 dark:border-slate-800 hover:border-sky-300 dark:hover:border-slate-700 rounded-2xl p-5 transition-colors shadow-sm">
          <div className="text-xs sm:text-sm font-bold text-sky-800 dark:text-sky-400 uppercase tracking-wider mb-2">
            Savings Rate
          </div>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {isIncomeShared && isTxShared && budget ? (
              `${budget.savingsRate}%`
            ) : (
              <span className="text-slate-400 text-sm font-normal flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" /> Withheld
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-semibold">
            {budget && budget.savingsRate >= 20 ? (
              <>
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Healthy (Target &ge; 20%)</span>
              </>
            ) : (
              <span className="text-amber-600 dark:text-amber-400">Below 20% benchmark</span>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. THE 50/30/20 BUDGET FRAMEWORK (EXPENSES & CASHFLOW HEALTH)
         ========================================================================= */}
      {isTxShared && budget && (
        <div className="bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-slate-50/60 dark:bg-none dark:bg-[#111827] border border-indigo-200/80 dark:border-slate-800 rounded-2xl p-6 transition-colors shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-bold uppercase tracking-wider">
                  Budget Discipline
                </span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  The 50/30/20 Budget Breakdown
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Benchmark: 50% Needs, 30% Wants, 20% Savings/Investments.
              </p>
            </div>
            <button
              onClick={() => onNavigate('expenses')}
              className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 hover:underline font-semibold flex items-center gap-1 self-start sm:self-auto"
            >
              Detailed Expense Manager <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          {/* Stacked Progress Bar */}
          <div className="w-full h-3.5 bg-slate-200/70 dark:bg-slate-800 rounded-full overflow-hidden flex mb-5 shadow-inner">
            <div
              style={{ width: `${Math.min(100, budget.rule50_30_20.needs.percentage)}%` }}
              className="bg-blue-500 transition-all duration-500"
              title={`Needs: ${budget.rule50_30_20.needs.percentage}%`}
            />
            <div
              style={{ width: `${Math.min(100, budget.rule50_30_20.wants.percentage)}%` }}
              className="bg-purple-500 transition-all duration-500"
              title={`Wants: ${budget.rule50_30_20.wants.percentage}%`}
            />
            <div
              style={{ width: `${Math.min(100, budget.rule50_30_20.savings.percentage)}%` }}
              className="bg-emerald-500 transition-all duration-500"
              title={`Savings: ${budget.rule50_30_20.savings.percentage}%`}
            />
          </div>

          {/* Legend and Numbers: Clean Colorful Sub-cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 bg-blue-50/90 dark:bg-slate-900/50 rounded-xl border border-blue-200/90 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-xs sm:text-sm mb-1.5">
                <span className="font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  Needs (Target 50%)
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {budget.rule50_30_20.needs.percentage}%
                </span>
              </div>
              <div className="text-lg font-bold text-rose-600 dark:text-rose-400">
                -₹{budget.rule50_30_20.needs.amount.toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Rent, groceries, utilities, transit, EMI</p>
            </div>

            <div className="p-4 bg-purple-50/90 dark:bg-slate-900/50 rounded-xl border border-purple-200/90 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-xs sm:text-sm mb-1.5">
                <span className="font-semibold text-purple-700 dark:text-purple-400 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                  Wants (Target 30%)
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {budget.rule50_30_20.wants.percentage}%
                </span>
              </div>
              <div className="text-lg font-bold text-rose-600 dark:text-rose-400">
                -₹{budget.rule50_30_20.wants.amount.toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Dining, Swiggy, shopping, OTT, leisure</p>
            </div>

            <div className="p-4 bg-emerald-50/90 dark:bg-slate-900/50 rounded-xl border border-emerald-200/90 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-xs sm:text-sm mb-1.5">
                <span className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Savings & SIP (Target 20%)
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {budget.rule50_30_20.savings.percentage}%
                </span>
              </div>
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                +₹{budget.rule50_30_20.savings.amount.toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Mutual fund SIPs, PPF, emergency buffer</p>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          4. TWO COLUMN SECTION: EXPENSE BREAKDOWN + RECENT TRANSACTIONS STREAM
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Breakdown Donut Chart */}
        <div className="lg:col-span-5 bg-gradient-to-br from-amber-50/70 via-orange-50/30 to-yellow-50/40 dark:bg-none dark:bg-[#111827] border border-amber-200/80 dark:border-slate-800 rounded-2xl p-6 flex flex-col transition-colors shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Expense Distribution</h2>
            <button
              onClick={() => onNavigate('expenses')}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
            >
              Analyze
            </button>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-4">
            Category-wise rupee spend allocation this month.
          </p>

          {isTxShared && expensePieData.length > 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="w-full h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expensePieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                    >
                      {expensePieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0];
                          return (
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl text-xs shadow-lg">
                              <p className="font-semibold text-slate-900 dark:text-white">{data.name}</p>
                              <p className="text-rose-600 dark:text-rose-400 font-bold">-₹{Number(data.value).toLocaleString('en-IN')}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Top Categories Grid */}
              <div className="w-full grid grid-cols-2 gap-2 mt-4 text-xs">
                {budget?.categories.slice(0, 6).map((c, i) => (
                  <div key={c.category} className="flex items-center gap-2 p-1.5 rounded-lg bg-white/70 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: EXPENSE_COLORS[i % EXPENSE_COLORS.length] }}
                    />
                    <span className="text-slate-700 dark:text-slate-300 font-medium truncate">{c.category}</span>
                    <span className="text-rose-600 dark:text-rose-400 font-bold ml-auto">{c.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400">
              <Shield className="w-10 h-10 mb-2 opacity-40" />
              <p className="text-xs sm:text-sm">
                {isTxShared ? 'No expense transactions recorded yet.' : 'Transaction data withheld by user consent.'}
              </p>
            </div>
          )}
        </div>

        {/* Recent Transactions Feed */}
        <div className="lg:col-span-7 bg-gradient-to-br from-cyan-50/60 via-sky-50/30 to-slate-50/80 dark:bg-none dark:bg-[#111827] border border-cyan-200/80 dark:border-slate-800 rounded-2xl p-6 flex flex-col transition-colors shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recent Transactions</h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Live itemized entries in your financial ledger</p>
            </div>
            <button
              onClick={() => onNavigate('expenses')}
              className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 hover:underline font-semibold flex items-center gap-1"
            >
              View All ({transactions.length}) <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          {isTxShared && transactions.length > 0 ? (
            <div className="divide-y divide-slate-200/70 dark:divide-slate-800/80 overflow-y-auto max-h-[380px]">
              {transactions.slice(0, 5).map((tx) => (
                <div key={tx.id} className="py-3 flex items-center justify-between gap-3 hover:bg-white/80 dark:hover:bg-slate-800/30 px-2 rounded-xl transition">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        tx.type === 'income'
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/20 shadow-xs'
                          : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-500/20 shadow-xs'
                      }`}
                    >
                      {tx.type === 'income' ? (
                        <ArrowDownLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{tx.description}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        <span>{tx.date}</span>
                        <span>•</span>
                        <span
                          className={`px-2 py-0.5 rounded-md font-semibold text-xs ${
                            tx.type === 'income'
                              ? 'bg-emerald-100/70 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-800/40'
                              : 'bg-rose-100/70 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-300/80 dark:border-rose-800/40'
                          }`}
                        >
                          {tx.category}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className={`text-sm sm:text-base font-bold ${
                        tx.type === 'income'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {tx.type === 'income' ? '+ ' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[140px]">{tx.paymentMethod}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400">
              <Layers className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-xs mb-3">No transactions found or consent withheld.</p>
              <button
                onClick={onOpenAddModal}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-500/20 hover:bg-emerald-600/20 transition"
              >
                + Add First Transaction
              </button>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          5. INTEGRATED INVESTMENTS & WEALTH INTELLIGENCE SECTION
         ========================================================================= */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Investments & Wealth Intelligence
            </h2>
          </div>
          <button
            onClick={() => onNavigate('investments')}
            className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 hover:underline font-semibold flex items-center gap-1"
          >
            Explore Full Portfolio <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        {/* Emergency Cushion Meter + Asset Allocation Donut */}
        {isInvestShared ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Emergency Fund Runway Meter (5 Cols) */}
            <div className="lg:col-span-5 bg-gradient-to-br from-emerald-50/80 via-teal-50/40 to-slate-50/80 dark:bg-none dark:bg-[#111827] border border-emerald-200/90 dark:border-slate-800 rounded-2xl p-6 transition-colors shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                    Emergency Runway
                  </span>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                      emergencyMonths >= 5
                        ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30'
                        : emergencyMonths >= 2
                        ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30'
                        : 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30'
                    }`}
                  >
                    {emergencyMonths >= 5 ? '🟢 Healthy Cushion' : emergencyMonths >= 2 ? '🟡 Moderate Buffer' : '🔴 Critical Buffer'}
                  </span>
                </div>

                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                    {emergencyMonths}
                  </span>
                  <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                    months covered (Target: 6 mo)
                  </span>
                </div>

                {/* Runway Progress Bar */}
                <div className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mb-4 shadow-inner">
                  <div
                    style={{ width: `${Math.min(100, (emergencyMonths / 6) * 100)}%` }}
                    className={`h-full rounded-full transition-all duration-700 ${
                      emergencyMonths >= 5 ? 'bg-emerald-500' : emergencyMonths >= 2 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400 mb-4">
                  <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                    <p className="text-[11px] font-semibold text-slate-500">Liquid Reserve</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">₹{emergencyCurrent.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                    <p className="text-[11px] font-semibold text-slate-500">6-Mo Safe Goal</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">₹{emergencyTarget.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </div>

              <div className="text-xs text-slate-600 dark:text-slate-400 bg-white/60 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">Where to park:</span> Maintain 30% in high-yield auto sweep-in savings account and 70% in instant-redemption Liquid Mutual Funds.
              </div>
            </div>

            {/* Recommended Asset Allocation & Risk Profiling (7 Cols) */}
            <div className="lg:col-span-7 bg-gradient-to-br from-blue-50/70 via-indigo-50/30 to-purple-50/40 dark:bg-none dark:bg-[#111827] border border-blue-200/80 dark:border-slate-800 rounded-2xl p-6 transition-colors shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Target Asset Allocation
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Deploying ₹{(plan?.recommendedMonthlyInvestment || 15000).toLocaleString('en-IN')}/mo based on your horizon
                    </p>
                  </div>

                  {/* Risk Profile Switcher */}
                  {profile && onUpdateRiskProfile && (
                    <div className="flex items-center gap-1 bg-white/80 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold">
                      {(['conservative', 'moderate', 'aggressive'] as RiskTolerance[]).map((r) => (
                        <button
                          key={r}
                          onClick={() => handleRiskChange(r)}
                          disabled={updatingRisk}
                          className={`px-2.5 py-1 rounded-lg capitalize transition ${
                            profile.riskTolerance === r
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Allocation Donut Chart + Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                  <div className="sm:col-span-6 h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={targetAllocationData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={70}
                          paddingAngle={4}
                        >
                          {targetAllocationData.map((entry, index) => (
                            <Cell key={`alloc-cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0];
                              return (
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl text-xs shadow-lg">
                                  <p className="font-semibold text-slate-900 dark:text-white">{data.name}</p>
                                  <p className="text-emerald-600 dark:text-emerald-400 font-bold">{data.value}% Allocation</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="sm:col-span-6 space-y-2 text-xs">
                    {targetAllocationData.map((item) => (
                      <div key={item.name} className="flex items-center justify-between p-2 rounded-xl bg-white/70 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{item.name}</span>
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Risk Profile: <strong className="capitalize text-slate-800 dark:text-slate-200">{profile?.riskTolerance || 'Conservative'}</strong></span>
                <span>Horizon: <strong className="text-slate-800 dark:text-slate-200">{profile?.investmentHorizonYears || 7} Years</strong></span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-center shadow-sm">
            <Shield className="w-10 h-10 mx-auto mb-2 text-slate-400 opacity-50" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Investment Telemetry Withheld</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4 max-w-md mx-auto">
              Enable "Share Investment & Risk Profile" in Consent & Privacy Center to visualize your live emergency runway and personalized asset allocation donut.
            </p>
            <button
              onClick={() => onNavigate('consent')}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500 transition shadow-sm"
            >
              Enable Investment Sharing
            </button>
          </div>
        )}
      </div>

      {/* =========================================================================
          6. AI WEALTH INSIGHTS & COPILOT RECOMMENDATIONS
         ========================================================================= */}
      {insights.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>AI Telemetry & Personalized Wealth Insights</span>
            </h2>
            <button
              onClick={() => onNavigate('aichat')}
              className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
            >
              Consult AI Advisor &rarr;
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {insights.map((item, idx) => {
              const cardBg =
                item.type === 'alert'
                  ? 'bg-gradient-to-br from-amber-50/90 to-orange-50/40 border-amber-300/80 text-amber-950'
                  : item.type === 'success'
                  ? 'bg-gradient-to-br from-emerald-50/90 to-teal-50/40 border-emerald-300/80 text-emerald-950'
                  : 'bg-gradient-to-br from-sky-50/90 to-blue-50/40 border-sky-300/80 text-sky-950';

              return (
                <div
                  key={idx}
                  className={`${cardBg} dark:bg-none dark:bg-[#111827] border dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between transition-colors shadow-sm`}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      {item.type === 'alert' ? (
                        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0" />
                      ) : item.type === 'success' ? (
                        <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : (
                        <Lightbulb className="w-4 h-4 text-sky-600 dark:text-teal-400 shrink-0" />
                      )}
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">{item.title}</h3>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
