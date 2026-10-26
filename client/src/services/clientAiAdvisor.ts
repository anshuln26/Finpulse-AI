import { BudgetHealth, InvestmentPlan, Transaction, UserConsent, UserProfile } from '../types';
import { FinancialEngine } from './financialEngine';

export interface ClientAIContext {
  consent?: UserConsent | null;
  profile?: UserProfile | null;
  transactions?: Transaction[];
  budget?: BudgetHealth | null;
  plan?: InvestmentPlan | null;
}

export class ClientAIAdvisorService {
  public static cleanFormatting(text: string): string {
    if (!text) return text;
    return text
      .replace(/^#{1,6}\s*/gm, '')
      .replace(/\*\*([^*]+?)\*\*/g, '$1')
      .replace(/(^|[^*])\*([^*]+?)\*([^*]|$)/g, '$1$2$3')
      .replace(/\|?\s*:\s*-+\s*:\s*\|?/g, '')
      .replace(/[*#]/g, '')
      .trim();
  }

  private static parseRupeeAmount(text: string): number | null {
    const clean = text.replace(/,/g, '');

    const lakhMatch = clean.match(/(\d+(?:\.\d+)?)\s*(?:lakhs?|lacs?)\b/i);
    if (lakhMatch) {
      return Math.round(parseFloat(lakhMatch[1]) * 100000);
    }

    const croreMatch = clean.match(/(\d+(?:\.\d+)?)\s*(?:crores?|crs?)\b/i);
    if (croreMatch) {
      return Math.round(parseFloat(croreMatch[1]) * 10000000);
    }

    const kMatch = clean.match(/(\d+(?:\.\d+)?)\s*k\b/i);
    if (kMatch) {
      return Math.round(parseFloat(kMatch[1]) * 1000);
    }

    const rupeeMatch = clean.match(/(?:₹|rs\.?|inr)?\s*(\d{3,10})\s*(?:₹|rs\.?|inr|rupees)?/i);
    if (rupeeMatch) {
      const val = parseInt(rupeeMatch[1], 10);
      if (val === 2025 || val === 2026 || val === 2024) {
        if (text.includes('₹') || /rs|inr|rupees/i.test(text)) {
          return val;
        }
      } else {
        return val;
      }
    }

    return null;
  }

  private static calculateSIPFutureValue(monthlyInvestment: number, years: number, annualRatePct: number): number {
    const r = annualRatePct / 100 / 12;
    const n = years * 12;
    if (r === 0) return monthlyInvestment * n;
    return Math.round(monthlyInvestment * ((Math.pow(1 + r, n) - 1) / r) * (1 + r));
  }

  public static chat(
    userMessage: string,
    _history: { role: 'user' | 'assistant'; content: string }[] = [],
    context: ClientAIContext = {}
  ): { reply: string; consentFiltered: boolean } {
    const consent: UserConsent = context.consent || {
      shareTransactions: true,
      shareIncome: true,
      shareInvestments: true,
      aiAdvisoryConsent: true,
      lastUpdated: new Date().toISOString(),
    };

    if (!consent.aiAdvisoryConsent) {
      return {
        reply:
          'AI Financial Advisory Consent Required\n\n' +
          'To protect your privacy, AI processing is currently paused because "AI Financial Advisory Consent" is toggled OFF in your Consent & Privacy Center.\n\n' +
          'Please visit the Consent Center to enable AI assistance whenever you feel comfortable.',
        consentFiltered: true,
      };
    }

    const profile: UserProfile = context.profile || {
      name: 'User',
      monthlyIncome: 0,
      savingsGoal: 0,
      riskTolerance: 'moderate',
      investmentHorizonYears: 7,
      emergencyFundTargetMonths: 6,
      emergencyFundCurrent: 0,
      existingInvestments: { equity: 0, debt: 0, gold: 0, cash: 0 },
    };

    const transactions: Transaction[] = context.transactions || [];
    const budget: BudgetHealth = context.budget || FinancialEngine.calculateBudgetHealth(transactions, profile, consent);
    const plan: InvestmentPlan = context.plan || FinancialEngine.generateInvestmentPlan(profile, budget, consent);

    const q = userMessage.toLowerCase().trim();
    const extractedAmount = this.parseRupeeAmount(userMessage);

    // -----------------------------------------------------------------------
    // INTENT 1: Targeted Expense Cutting & Spend Optimization
    // -----------------------------------------------------------------------
    const isCutExpenseIntent =
      q.includes('cut') ||
      q.includes('reduce') ||
      q.includes('trim') ||
      q.includes('save') ||
      q.includes('lower') ||
      q.includes('decrease') ||
      q.includes('leakage');

    if (isCutExpenseIntent && (q.includes('expense') || q.includes('spend') || q.includes('budget') || extractedAmount !== null || q.includes('money'))) {
      if (!consent.shareTransactions) {
        return {
          reply: this.cleanFormatting(
            'Expense Optimization Guidance (Consent Withheld)\n\n' +
            'To generate a precise category-by-category rupee reduction plan, please enable Share Transactions in the Consent & Privacy Center.'
          ),
          consentFiltered: true,
        };
      }

      const discretionaryMap: Record<string, number> = {};
      const discretionaryCategories = ['Food & Dining', 'Shopping', 'Subscriptions', 'Entertainment', 'Other'];
      let totalDiscretionary = 0;

      budget.categories.forEach((c) => {
        if (discretionaryCategories.includes(c.category)) {
          discretionaryMap[c.category] = c.amount;
          totalDiscretionary += c.amount;
        }
      });

      const targetCut = extractedAmount || Math.round(Math.min(totalDiscretionary * 0.25, 5000));
      const targetCutFormatted = '₹' + targetCut.toLocaleString('en-IN');

      let resp = `💡 Personalized Plan to Cut ${targetCutFormatted} from Monthly Expenses\n\n`;
      resp += `Your current total monthly expenditure is ₹${budget.totalExpenses.toLocaleString('en-IN')}, of which discretionary "Wants" account for ₹${budget.rule50_30_20.wants.amount.toLocaleString('en-IN')} (${budget.rule50_30_20.wants.percentage}%).\n\n`;

      if (totalDiscretionary <= 0) {
        resp += `You currently have zero recorded discretionary expenses. Any cost reduction must come from renegotiating fixed living needs (rent, utilities).\n`;
        return { reply: this.cleanFormatting(resp), consentFiltered: false };
      }

      resp += `Recommended Rupee Reduction by Category:\n`;
      let allocatedCut = 0;
      const cuts: { category: string; current: number; cut: number; revised: number; tip: string }[] = [];

      const tipsMap: Record<string, string> = {
        'Food & Dining': 'Cook staples at home 2 extra days/week; cap Swiggy/Zomato orders to weekends.',
        'Shopping': 'Implement a 48-hour cool-off rule on Amazon/Myntra impulse buys.',
        'Subscriptions': 'Audit UPI auto-debits; cancel duplicate OTT, cloud storage, or idle memberships.',
        'Entertainment': 'Opt for matinee screenings or community sports instead of high-markup lounges.',
        'Other': 'Review miscellaneous digital micropayments and unclassified UPI transfers.',
      };

      const sortedCategories = Object.keys(discretionaryMap).sort((a, b) => discretionaryMap[b] - discretionaryMap[a]);

      sortedCategories.forEach((cat, index) => {
        const curAmt = discretionaryMap[cat];
        if (curAmt <= 0) return;

        let cutForThisCat = 0;
        if (index === sortedCategories.length - 1) {
          cutForThisCat = Math.max(0, targetCut - allocatedCut);
        } else {
          const proportion = curAmt / totalDiscretionary;
          cutForThisCat = Math.round(targetCut * proportion);
        }

        cutForThisCat = Math.min(cutForThisCat, curAmt);
        allocatedCut += cutForThisCat;

        if (cutForThisCat > 0) {
          cuts.push({
            category: cat,
            current: curAmt,
            cut: cutForThisCat,
            revised: curAmt - cutForThisCat,
            tip: tipsMap[cat] || 'Eliminate impulsive micro-transactions.',
          });
        }
      });

      cuts.forEach((c) => {
        resp += `• ${c.category}: Current ₹${c.current.toLocaleString('en-IN')} ➔ Trim by ₹${c.cut.toLocaleString('en-IN')} (Target: ₹${c.revised.toLocaleString('en-IN')})\n`;
        resp += `   Tip: ${c.tip}\n`;
      });

      const revisedTotalExpenses = Math.max(0, budget.totalExpenses - targetCut);
      const currentSurplus = budget.netSavings;
      const revisedSurplus = currentSurplus + targetCut;
      const effectiveIncome = budget.monthlyIncome || profile.monthlyIncome || 0;
      const revisedSavingsRate = effectiveIncome > 0 ? Math.round((revisedSurplus / effectiveIncome) * 100) : 0;
      const fiveYearGrowth = this.calculateSIPFutureValue(targetCut, 5, 12);

      resp += `\nFinancial Impact on Your Numbers:\n`;
      resp += `• Monthly Outflow: Drops from ₹${budget.totalExpenses.toLocaleString('en-IN')} ➔ ₹${revisedTotalExpenses.toLocaleString('en-IN')}\n`;
      resp += `• Net Monthly Surplus: Expands from ₹${currentSurplus.toLocaleString('en-IN')} ➔ ₹${revisedSurplus.toLocaleString('en-IN')} (+₹${targetCut.toLocaleString('en-IN')}/mo)\n`;
      resp += `• Target Savings Rate: Improves from ${budget.savingsRate}% ➔ ${revisedSavingsRate}% of income\n`;
      resp += `• 5-Year Compounding Wealth: Redirecting this saved ₹${targetCut.toLocaleString('en-IN')}/month into a low-cost Nifty 50 Index Fund at 12% CAGR yields approximately ₹${fiveYearGrowth.toLocaleString('en-IN')} in 5 years!\n\n`;
      resp += `Actionable Execution: Set up an auto-debit SIP on salary day for this saved amount so you invest first and spend only what remains.`;

      return { reply: this.cleanFormatting(resp), consentFiltered: false };
    }

    // -----------------------------------------------------------------------
    // INTENT 2: Affordability & Big Purchases
    // -----------------------------------------------------------------------
    const isAffordabilityIntent =
      q.includes('afford') ||
      q.includes('can i buy') ||
      q.includes('can i purchase') ||
      q.includes('vacation') ||
      q.includes('trip') ||
      q.includes('iphone') ||
      q.includes('laptop') ||
      q.includes('bike') ||
      q.includes('spend on');

    if (isAffordabilityIntent && extractedAmount !== null) {
      const itemCost = extractedAmount;
      const monthlySurplus = Math.max(0, budget.netSavings);
      const emergencyReserve = profile.emergencyFundCurrent || 0;
      const monthlyEssential = budget.rule50_30_20.needs.amount > 0 ? budget.rule50_30_20.needs.amount : Math.round((budget.monthlyIncome || 60000) * 0.5);
      const currentRunway = monthlyEssential > 0 ? Number((emergencyReserve / monthlyEssential).toFixed(1)) : 0;

      let resp = `🔍 Affordability Assessment for ₹${itemCost.toLocaleString('en-IN')}\n\n`;
      resp += `Your Live Financial Baseline:\n`;
      resp += `• Monthly Net Surplus: ₹${monthlySurplus.toLocaleString('en-IN')}\n`;
      resp += `• Liquid Emergency Reserve: ₹${emergencyReserve.toLocaleString('en-IN')} (${currentRunway} months buffer)\n`;
      resp += `• Monthly Essential Expenses: ₹${monthlyEssential.toLocaleString('en-IN')}\n\n`;

      resp += `Scenario 1: Dipping into Existing Reserves (Lump Sum)\n`;
      const postReserve = emergencyReserve - itemCost;
      const postRunway = monthlyEssential > 0 ? Number((postReserve / monthlyEssential).toFixed(1)) : 0;

      if (postReserve < 0) {
        resp += `❌ Not Feasible with Cash: You currently have ₹${emergencyReserve.toLocaleString('en-IN')} in liquid reserves. This purchase exceeds your available reserve by ₹${Math.abs(postReserve).toLocaleString('en-IN')}.\n\n`;
      } else if (postRunway < 5) {
        resp += `⚠️ High Risk: Paying ₹${itemCost.toLocaleString('en-IN')} in cash drops your emergency runway from ${currentRunway} months down to ${postRunway} months (below the safe Indian benchmark of ≥ 5 months). Any sudden job disruption or medical event would risk debt.\n\n`;
      } else {
        resp += `✅ Buffer Remains Healthy: Your runway would remain at ${postRunway} months (≥ 5 months buffer).\n\n`;
      }

      if (monthlySurplus > 0) {
        const dedicatedSurplus = Math.round(monthlySurplus * 0.5);
        const monthsNeededWith50 = Math.ceil(itemCost / dedicatedSurplus);
        const monthsNeededWith100 = Math.ceil(itemCost / monthlySurplus);

        resp += `Scenario 2: Sinking Fund via Monthly Surplus (Recommended)\n`;
        resp += `• By routing 50% of your surplus (₹${dedicatedSurplus.toLocaleString('en-IN')}/mo) into an auto sweep-in FD or liquid fund, you can purchase this in ${monthsNeededWith50} months completely debt-free without touching emergency savings or pausing mutual fund SIPs!\n`;
        resp += `• If you route 100% of your surplus (₹${monthlySurplus.toLocaleString('en-IN')}/mo), you can purchase it in ${monthsNeededWith100} month(s).\n\n`;
      } else {
        resp += `Scenario 2: Sinking Fund: You currently have zero monthly surplus recorded. You must first trim discretionary expenses or build surplus before taking on this cost.\n\n`;
      }

      resp += `FinPulse Verdict: `;
      if (emergencyReserve === 0) {
        resp += `🔴 Not Recommended Right Now. Your current liquid emergency reserve is ₹0. You should prioritize building at least a 3–6 month emergency moat (₹${(monthlyEssential * 6).toLocaleString('en-IN')}) before allocating cash towards high-ticket luxury electronics.`;
      } else if (monthlySurplus >= itemCost * 0.5 && currentRunway >= 5) {
        resp += `🟢 Comfortably Affordable with 2–3 months of disciplined sinking fund planning. Avoid No-Cost EMI credit card traps that lock up future cash flow.`;
      } else if (currentRunway >= 5) {
        resp += `🟡 Affordable with Staged Savings. Save via a dedicated 3 to 6-month recurring deposit before buying.`;
      } else {
        resp += `🔴 Not Recommended Right Now. Secure your 5–6 month emergency cushion (currently ${currentRunway} mo) first before committing to this discretionary purchase.`;
      }

      return { reply: this.cleanFormatting(resp), consentFiltered: false };
    }

    // -----------------------------------------------------------------------
    // INTENT 3: Loan & EMI Feasibility
    // -----------------------------------------------------------------------
    const isLoanOrEMIIntent =
      q.includes('emi') ||
      q.includes('loan') ||
      q.includes('home loan') ||
      q.includes('car loan') ||
      q.includes('personal loan');

    if (isLoanOrEMIIntent && extractedAmount !== null) {
      const proposedEMI = extractedAmount;
      const income = budget.monthlyIncome || profile.monthlyIncome || 0;
      const currentDebt = budget.categories.find((c) => c.category === 'Debt & Loans')?.amount || 0;
      const totalPostEMI = currentDebt + proposedEMI;
      const foir = income > 0 ? Math.round((totalPostEMI / income) * 100) : 0;
      const surplus = budget.netSavings;
      const postSurplus = surplus - proposedEMI;

      let resp = `💳 EMI Feasibility Analysis for ₹${proposedEMI.toLocaleString('en-IN')}/month\n\n`;
      resp += `Debt Metrics & Banking Ratios:\n`;
      resp += `• Monthly Net Income: ₹${income.toLocaleString('en-IN')}\n`;
      resp += `• Existing Debt/EMI Payments: ₹${currentDebt.toLocaleString('en-IN')}\n`;
      resp += `• Proposed New Total EMI: ₹${totalPostEMI.toLocaleString('en-IN')}\n`;
      resp += `• FOIR (Fixed Obligation to Income Ratio): ${foir}% (Prudent Indian Banking Limit is ≤ 35%)\n`;
      resp += `• Impact on Monthly Surplus: Reduces surplus from ₹${surplus.toLocaleString('en-IN')} ➔ ₹${postSurplus.toLocaleString('en-IN')}\n\n`;

      if (postSurplus < 0) {
        resp += `🚨 Critical Risk: This EMI would trigger a monthly deficit of -₹${Math.abs(postSurplus).toLocaleString('en-IN')}, pushing you into high-interest debt. Do not proceed without increasing down payment or extending tenure.`;
      } else if (foir > 40) {
        resp += `⚠️ High Debt Burden: At ${foir}% FOIR, your loan obligations exceed prudent thresholds and crowd out investments.`;
      } else {
        resp += `✅ Safe & Manageable: Your FOIR remains healthy at ${foir}% (well below 35%), leaving a residual monthly buffer of ₹${postSurplus.toLocaleString('en-IN')}.`;
      }

      return { reply: this.cleanFormatting(resp), consentFiltered: false };
    }

    // -----------------------------------------------------------------------
    // INTENT 4: Emergency Fund & Runway Status
    // -----------------------------------------------------------------------
    const isEmergencyFundIntent =
      q.includes('emergency') ||
      q.includes('runway') ||
      q.includes('buffer') ||
      q.includes('liquid reserve') ||
      q.includes('cushion');

    if (isEmergencyFundIntent) {
      const currentReserve = profile.emergencyFundCurrent || 0;
      const targetMonths = profile.emergencyFundTargetMonths || 6;
      const targetReserve = plan.emergencyFundHealth.target;
      const monthsCovered = plan.emergencyFundHealth.monthsCovered;
      const monthlyEssential = budget.rule50_30_20.needs.amount || Math.round((budget.monthlyIncome || 60000) * 0.5);

      let resp = `🛡️ Emergency Runway Assessment\n\n`;
      resp += `Current Telemetry:\n`;
      resp += `• Current Liquid Reserve: ₹${currentReserve.toLocaleString('en-IN')}\n`;
      resp += `• ${targetMonths}-Month Target Reserve: ₹${targetReserve.toLocaleString('en-IN')}\n`;
      resp += `• Months of Essential Needs Covered: ${monthsCovered} months\n`;
      resp += `• Monthly Essential Outflow: ₹${monthlyEssential.toLocaleString('en-IN')}\n\n`;

      if (currentReserve === 0) {
        resp += `Status: 🔴 Critical (0 Months Buffer)\n`;
        resp += `You currently have ₹0 designated in liquid emergency reserves. Any unexpected medical cost, job transition, or appliance breakdown creates an immediate debt hazard.\n\n`;
        resp += `Action Plan: Direct at least 30–50% of your monthly surplus into a high-yield sweep-in savings account or liquid mutual fund until you reach at least ₹${(monthlyEssential * 3).toLocaleString('en-IN')} (3 months of essential needs).`;
      } else if (monthsCovered >= 5) {
        resp += `Status: 🟢 Healthy Cushion (≥ 5 Months Buffer)\n`;
        resp += `Your emergency fund is in an excellent position! Your moat protects your equity and mutual fund SIPs from panic withdrawals during market downturns.`;
      } else {
        resp += `Status: 🟡 Moderate Buffer (${monthsCovered} Months Buffer)\n`;
        resp += `You have made good progress, but you are still short of the recommended ${targetMonths}-month safety benchmark by ₹${(targetReserve - currentReserve).toLocaleString('en-IN')}. Continue building your liquid buffer.`;
      }

      return { reply: this.cleanFormatting(resp), consentFiltered: false };
    }

    // -----------------------------------------------------------------------
    // DEFAULT FINANCIAL COACHING SUMMARY
    // -----------------------------------------------------------------------
    const income = budget.monthlyIncome || profile.monthlyIncome || 0;
    const surplus = budget.netSavings;
    const expenses = budget.totalExpenses;
    const emergency = profile.emergencyFundCurrent || 0;

    let defaultResp = `FinPulse Financial Assessment for ${profile.name || 'User'}\n\n`;
    defaultResp += `Here is your current live financial snapshot:\n`;
    defaultResp += `• Monthly Income: ₹${income.toLocaleString('en-IN')}\n`;
    defaultResp += `• Monthly Outflow: ₹${expenses.toLocaleString('en-IN')}\n`;
    defaultResp += `• Monthly Surplus: ₹${surplus.toLocaleString('en-IN')}\n`;
    defaultResp += `• Savings Rate: ${budget.savingsRate}%\n`;
    defaultResp += `• Emergency Reserve: ₹${emergency.toLocaleString('en-IN')} (${plan.emergencyFundHealth.monthsCovered} months buffer)\n`;
    defaultResp += `• Risk Profile: ${profile.riskTolerance.toUpperCase()}\n\n`;
    defaultResp += `You can ask me specific questions like:\n`;
    defaultResp += `• "Can I buy a ₹80,000 laptop?"\n`;
    defaultResp += `• "Where can I cut ₹5,000 from expenses?"\n`;
    defaultResp += `• "Is my emergency fund sufficient?"\n`;
    defaultResp += `• "Can I afford a ₹15,000 car EMI?"`;

    return { reply: this.cleanFormatting(defaultResp), consentFiltered: false };
  }

  public static generateQuickInsights(
    consent: UserConsent | null,
    _profile: UserProfile | null,
    budget: BudgetHealth | null,
    plan: InvestmentPlan | null
  ): Array<{ title: string; desc: string; type: 'tip' | 'alert' | 'success' }> {
    const insights: Array<{ title: string; desc: string; type: 'tip' | 'alert' | 'success' }> = [];

    if (!consent?.aiAdvisoryConsent) {
      insights.push({
        title: 'AI Advisory Paused',
        desc: 'Enable AI Advisory in Consent Center to activate continuous expense and investment scanning.',
        type: 'alert',
      });
      return insights;
    }

    if (budget && consent.shareIncome && consent.shareTransactions) {
      if (budget.savingsRate >= 25) {
        insights.push({
          title: 'Strong Savings Rate',
          desc: `You are currently saving ${budget.savingsRate}% of your income, beating the benchmark 20% rule!`,
          type: 'success',
        });
      } else if (budget.savingsRate > 0) {
        insights.push({
          title: 'Savings Potential Gap',
          desc: `Your savings rate is ${budget.savingsRate}%. Trimming discretionary expenses like dining or shopping could elevate this to 25%+.`,
          type: 'alert',
        });
      } else {
        insights.push({
          title: 'Zero Surplus Recorded',
          desc: 'Your recorded outlays match or exceed your recorded inflows. Focus on building an initial cash buffer.',
          type: 'alert',
        });
      }
    }

    if (plan && consent.shareInvestments) {
      const months = plan.emergencyFundHealth.monthsCovered;
      if (months >= 5) {
        insights.push({
          title: 'Emergency Cushion Secured (Green Tier)',
          desc: `Your emergency reserve covers ${months} months of expenses (≥ 5 months buffer). You have a solid financial moat.`,
          type: 'success',
        });
      } else if (months >= 2) {
        insights.push({
          title: 'Emergency Cushion in Progress (Yellow Tier)',
          desc: `You have ${months} months of expenses covered. Build towards 5–6 months before aggressive risk allocations.`,
          type: 'tip',
        });
      } else if (months > 0) {
        insights.push({
          title: 'Low Emergency Buffer Alert (Orange Tier)',
          desc: `Your emergency fund covers only ${months} months of expenses. Allocate extra liquid cash before market investments.`,
          type: 'alert',
        });
      } else {
        insights.push({
          title: 'Critical Emergency Reserve Warning (Red Tier)',
          desc: 'Your emergency reserve is currently ₹0 (0 months buffer). Any sudden disruption risks debt. Prioritize emergency savings immediately.',
          type: 'alert',
        });
      }
    }

    if (plan && consent.shareInvestments && consent.shareIncome) {
      insights.push({
        title: `Recommended ${(plan.riskProfile || 'Moderate').toUpperCase()} Allocation`,
        desc: `Deploy ₹${plan.recommendedMonthlyInvestment.toLocaleString('en-IN')}/mo with ${plan.recommendedAllocation.equity}% into Nifty 50 Index funds and ${plan.recommendedAllocation.debt}% into Debt/PPF.`,
        type: 'tip',
      });
    }

    return insights;
  }
}
