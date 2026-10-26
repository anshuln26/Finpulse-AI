import {
  Transaction,
  UserProfile,
  UserConsent,
  BudgetHealth,
  CategoryBreakdown,
  SpendingCategory,
  InvestmentPlan,
  AssetAllocation,
} from '../types';

export class FinancialEngine {
  private static NEEDS_CATEGORIES: SpendingCategory[] = [
    'Housing',
    'Utilities',
    'Healthcare',
    'Debt & Loans',
    'Transportation',
  ];

  private static WANTS_CATEGORIES: SpendingCategory[] = [
    'Food & Dining',
    'Entertainment',
    'Shopping',
    'Subscriptions',
    'Other',
  ];

  public static calculateBudgetHealth(
    transactions: Transaction[],
    profile: UserProfile,
    consent: UserConsent
  ): BudgetHealth {
    const monthlyIncome = consent.shareIncome ? profile.monthlyIncome : 0;

    // Filter transactions if consent allows
    const activeTx = consent.shareTransactions ? transactions : [];

    // Group expenses by category
    const categoryTotals: Record<SpendingCategory, number> = {
      Housing: 0,
      'Food & Dining': 0,
      Transportation: 0,
      Utilities: 0,
      Entertainment: 0,
      Healthcare: 0,
      Shopping: 0,
      Investment: 0,
      'Debt & Loans': 0,
      Subscriptions: 0,
      Other: 0,
    };

    let totalExpenses = 0;
    let actualInvestmentsFromTx = 0;

    for (const tx of activeTx) {
      if (tx.type === 'expense') {
        if (tx.category === 'Investment') {
          actualInvestmentsFromTx += tx.amount;
        } else {
          categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + tx.amount;
          totalExpenses += tx.amount;
        }
      }
    }

    // 50/30/20 breakdown calculation
    let needsAmount = 0;
    let wantsAmount = 0;

    for (const cat of this.NEEDS_CATEGORIES) {
      needsAmount += categoryTotals[cat] || 0;
    }

    for (const cat of this.WANTS_CATEGORIES) {
      wantsAmount += categoryTotals[cat] || 0;
    }

    const netSavings = Math.max(0, monthlyIncome - totalExpenses);
    const savingsAmount = actualInvestmentsFromTx + (monthlyIncome > 0 ? netSavings : 0);

    const baseForPerc = monthlyIncome > 0 ? monthlyIncome : totalExpenses > 0 ? totalExpenses : 1;

    const needsPerc = Math.round((needsAmount / baseForPerc) * 100);
    const wantsPerc = Math.round((wantsAmount / baseForPerc) * 100);
    const savingsPerc = Math.round((savingsAmount / baseForPerc) * 100);
    const savingsRate = monthlyIncome > 0 ? Math.round((netSavings / monthlyIncome) * 100) : 0;

    const categories: CategoryBreakdown[] = Object.entries(categoryTotals)
      .filter(([_, amount]) => amount > 0)
      .map(([cat, amount]) => ({
        category: cat as SpendingCategory,
        amount,
        percentage: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    // Overspending / Anomaly detection
    const alerts: BudgetHealth['overspendingAlerts'] = [];

    if (consent.shareTransactions && consent.shareIncome && monthlyIncome > 0) {
      // Check Food & Dining leakage
      const foodSpend = categoryTotals['Food & Dining'] || 0;
      if (foodSpend > monthlyIncome * 0.15) {
        alerts.push({
          category: 'Food & Dining',
          severity: 'warning',
          amount: foodSpend,
          message: `Food & Dining accounts for ${Math.round((foodSpend / monthlyIncome) * 100)}% of your monthly income. Cooking at home 2 more days a week or cutting Swiggy/Zomato orders could save approx. ₹3,500–₹6,000 monthly.`,
        });
      }

      // Check Subscriptions
      const subSpend = categoryTotals['Subscriptions'] || 0;
      if (subSpend > 999) {
        alerts.push({
          category: 'Subscriptions',
          severity: 'info',
          amount: subSpend,
          message: `You are spending ₹${subSpend.toLocaleString('en-IN')} across recurring digital subscriptions. Review and cancel unused OTT, fitness, or cloud memberships to boost your SIP.`,
        });
      }

      // Check Needs exceeding 50%
      if (needsPerc > 55) {
        alerts.push({
          category: 'Essential Needs',
          severity: 'danger',
          amount: needsAmount,
          message: `Fixed living costs (rent, utilities, groceries) represent ${needsPerc}% of your monthly income (ideal Indian benchmark is 50%). Consider renegotiating rent or utility packages.`,
        });
      }

      // Check Shopping
      const shoppingSpend = categoryTotals['Shopping'] || 0;
      if (shoppingSpend > monthlyIncome * 0.08) {
        alerts.push({
          category: 'Shopping',
          severity: 'warning',
          amount: shoppingSpend,
          message: `Discretionary shopping is at ${Math.round((shoppingSpend / monthlyIncome) * 100)}% of income (₹${shoppingSpend.toLocaleString('en-IN')}). Adopting a 48-hour cool-off rule before checkout reduces festive sale impulse spending.`,
        });
      }
    }

    return {
      monthlyIncome,
      totalExpenses,
      netSavings,
      savingsRate,
      rule50_30_20: {
        needs: { amount: needsAmount, percentage: needsPerc, targetPercentage: 50 },
        wants: { amount: wantsAmount, percentage: wantsPerc, targetPercentage: 30 },
        savings: { amount: savingsAmount, percentage: savingsPerc, targetPercentage: 20 },
      },
      categories,
      overspendingAlerts: alerts,
    };
  }

  public static generateInvestmentPlan(
    profile: UserProfile,
    budget: BudgetHealth,
    _consent?: UserConsent
  ): InvestmentPlan {
    const risk = profile.riskTolerance || 'moderate';
    let targetAllocation: AssetAllocation;

    switch (risk) {
      case 'conservative':
        targetAllocation = { equity: 30, debt: 50, gold: 10, cash: 10 };
        break;
      case 'aggressive':
        targetAllocation = { equity: 75, debt: 15, gold: 5, cash: 5 };
        break;
      case 'moderate':
      default:
        targetAllocation = { equity: 60, debt: 25, gold: 10, cash: 5 };
        break;
    }

    // Calculate current allocation from profile
    const existing = profile.existingInvestments || { equity: 0, debt: 0, gold: 0, cash: 0 };
    const totalExisting = existing.equity + existing.debt + existing.gold + existing.cash;

    const currentAllocation: AssetAllocation = totalExisting > 0
      ? {
          equity: Math.round((existing.equity / totalExisting) * 100),
          debt: Math.round((existing.debt / totalExisting) * 100),
          gold: Math.round((existing.gold / totalExisting) * 100),
          cash: Math.round((existing.cash / totalExisting) * 100),
        }
      : { equity: 0, debt: 0, gold: 0, cash: 0 };

    // Emergency fund calculation (dynamic according to monthly expenses & income)
    const monthlyEssentialExpenses = budget.rule50_30_20.needs.amount > 0
      ? budget.rule50_30_20.needs.amount
      : (budget.totalExpenses > 0
          ? budget.totalExpenses
          : Math.round((profile.monthlyIncome || 60000) * 0.5));

    const targetMonths = profile.emergencyFundTargetMonths || 6;
    const targetEmergencyFund = monthlyEssentialExpenses * targetMonths;
    const currentEmergencyFund = profile.emergencyFundCurrent || 0;
    const monthsCovered = monthlyEssentialExpenses > 0
      ? Number((currentEmergencyFund / monthlyEssentialExpenses).toFixed(1))
      : 0;

    let statusLevel: 'critical' | 'low' | 'moderate' | 'healthy';
    let statusColor: 'red' | 'orange' | 'yellow' | 'green';
    let statusLabel: string;

    if (monthsCovered <= 1) {
      statusLevel = 'critical';
      statusColor = 'red';
      statusLabel = 'Critical (≤ 1 Mo Buffer)';
    } else if (monthsCovered <= 2) {
      statusLevel = 'low';
      statusColor = 'orange';
      statusLabel = 'Low Buffer (1–2 Mo Buffer)';
    } else if (monthsCovered < 5) {
      statusLevel = 'moderate';
      statusColor = 'yellow';
      statusLabel = 'Moderate Buffer (2–4 Mo Buffer)';
    } else {
      statusLevel = 'healthy';
      statusColor = 'green';
      statusLabel = 'Healthy Cushion (≥ 5 Mo Buffer)';
    }

    const isAdequate = monthsCovered >= 5;
    const shortfall = Math.max(0, targetEmergencyFund - currentEmergencyFund);

    // Monthly investable surplus
    const monthlySurplus = Math.max(0, budget.netSavings);
    const recommendedMonthlyInvestment = monthlySurplus > 0
      ? Math.round(monthlySurplus * 0.85) // Leave 15% liquid buffer
      : Math.round(profile.savingsGoal || profile.monthlyIncome * 0.2);

    // Suggested Indian Financial Vehicles
    const suggestedVehicles = [];

    if (monthsCovered < 5 && shortfall > 0) {
      // Allocate portion towards emergency fund first
      const emergencyShare = Math.min(recommendedMonthlyInvestment * 0.4, shortfall);
      suggestedVehicles.push({
        type: 'Liquid/Emergency' as const,
        name: 'Liquid Mutual Fund / Auto Sweep-in FD',
        allocationPercent: Math.round((emergencyShare / (recommendedMonthlyInvestment || 1)) * 100),
        suggestedMonthlyAmount: Math.round(emergencyShare),
        riskLevel: 'Ultra-Low Risk (Capital Preservation)',
        rationale: `Build your emergency reserve up to ${targetMonths} months of living expenses (₹${shortfall.toLocaleString('en-IN')} shortfall remaining). Keep in T+1 liquid funds or bank sweep FDs.`,
      });
    }

    // Equity index allocation
    const equityAmt = Math.round((recommendedMonthlyInvestment * targetAllocation.equity) / 100);
    suggestedVehicles.push({
      type: 'Equity/Index' as const,
      name: 'Nifty 50 Index Fund / Flexi Cap Mutual Fund (Direct Plan)',
      allocationPercent: targetAllocation.equity,
      suggestedMonthlyAmount: equityAmt,
      riskLevel: risk === 'aggressive' ? 'High Growth' : 'Moderate-High Growth',
      rationale: 'Long-term compounding vehicle capturing India GDP growth with low expense ratios (<0.20%).',
    });

    // Debt allocation
    const debtAmt = Math.round((recommendedMonthlyInvestment * targetAllocation.debt) / 100);
    suggestedVehicles.push({
      type: 'Debt/FD/Bonds' as const,
      name: 'Public Provident Fund (PPF) / High-Grade Corporate Bond Fund',
      allocationPercent: targetAllocation.debt,
      suggestedMonthlyAmount: debtAmt,
      riskLevel: 'Low-to-Moderate (Sovereign / AAA)',
      rationale: 'Provides guaranteed tax-free stability (Section 80C) and insulates against equity market drawdowns.',
    });

    // Gold allocation
    const goldAmt = Math.round((recommendedMonthlyInvestment * targetAllocation.gold) / 100);
    suggestedVehicles.push({
      type: 'Gold' as const,
      name: 'Sovereign Gold Bonds (SGB) / Gold ETFs',
      allocationPercent: targetAllocation.gold,
      suggestedMonthlyAmount: goldAmt,
      riskLevel: 'Low-Moderate (Inflation Hedge)',
      rationale: 'Provides 2.5% p.a. sovereign interest plus capital appreciation exempt from LTCG at redemption.',
    });

    // Action Items
    const actionItems: string[] = [];

    if (monthsCovered < 5) {
      actionItems.push(
        `Priority 1: Top up your liquid emergency fund by ₹${shortfall.toLocaleString('en-IN')} to achieve a solid safety cushion (≥ 5 months of financial runway).`
      );
    }

    actionItems.push(
      `Set up an automated monthly SIP of ₹${recommendedMonthlyInvestment.toLocaleString('en-IN')} on the 5th of every month (right after salary credit).`
    );

    if (currentAllocation.equity < targetAllocation.equity - 15) {
      actionItems.push(
        `Your portfolio is currently underweight in Indian Equities (${currentAllocation.equity}% vs ${targetAllocation.equity}% target). Gradually ramp up broad index fund SIPs.`
      );
    }

    actionItems.push(
      'Perform a portfolio rebalancing check every 6 months to maintain your target asset allocation across equity, debt, and gold.'
    );

    return {
      riskProfile: risk,
      recommendedAllocation: targetAllocation,
      currentAllocation,
      monthlySurplus,
      recommendedMonthlyInvestment,
      emergencyFundHealth: {
        current: currentEmergencyFund,
        target: targetEmergencyFund,
        monthsCovered,
        targetMonths,
        isAdequate,
        shortfall,
        monthlyEssentialExpenses,
        statusLevel,
        statusColor,
        statusLabel,
      },
      suggestedVehicles,
      actionItems,
    };
  }
}
