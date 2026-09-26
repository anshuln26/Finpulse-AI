import { GoogleGenAI } from '@google/genai';
import { db } from '../db/database.js';
import { FinancialEngine } from './financialEngine.js';
import { Transaction, UserConsent, UserProfile, BudgetHealth, InvestmentPlan } from '../types.js';

export class AIAdvisorService {
  private static getGeminiClient(): GoogleGenAI | null {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey || apiKey.trim() === '') return null;
    return new GoogleGenAI({ apiKey });
  }

  public static async chat(
    userMessage: string,
    history: { role: 'user' | 'assistant'; content: string }[] = []
  ): Promise<{ response: string; consentFiltered: boolean }> {
    const consent = db.getConsent();

    // 1. Consent Gate: Respect user data sovereignty
    if (!consent.aiAdvisoryConsent) {
      return {
        response:
          '🔒 **AI Financial Advisory Consent Required**\n\n' +
          'To protect your privacy, AI processing is currently paused because "AI Financial Advisory Consent" is toggled OFF in your **Consent & Privacy Center**.\n\n' +
          'Please visit the Consent Center to enable AI assistance whenever you feel comfortable.',
        consentFiltered: true,
      };
    }

    const profile = db.getProfile();
    const transactions = db.getTransactions();
    const budgetHealth = FinancialEngine.calculateBudgetHealth(transactions, profile, consent);
    const investmentPlan = FinancialEngine.generateInvestmentPlan(profile, budgetHealth, consent);

    // 2. Build privacy-consented context for LLM
    let contextSummary = '=== USER FINANCIAL TELEMETRY (CONSENT FILTERED) ===\n';

    if (consent.shareIncome) {
      contextSummary += `- Monthly Income: ₹${profile.monthlyIncome.toLocaleString('en-IN')}\n`;
      contextSummary += `- Savings Rate: ${budgetHealth.savingsRate}%\n`;
      contextSummary += `- Net Monthly Surplus: ₹${budgetHealth.netSavings.toLocaleString('en-IN')}\n`;
    } else {
      contextSummary += '- Monthly Income: [WITHHELD BY USER CONSENT]\n';
    }

    if (consent.shareTransactions) {
      contextSummary += `- Total Monthly Expenses: ₹${budgetHealth.totalExpenses.toLocaleString('en-IN')}\n`;
      contextSummary += `- 50/30/20 Breakdown: Needs: ${budgetHealth.rule50_30_20.needs.percentage}% (₹${budgetHealth.rule50_30_20.needs.amount.toLocaleString('en-IN')}), Wants: ${budgetHealth.rule50_30_20.wants.percentage}% (₹${budgetHealth.rule50_30_20.wants.amount.toLocaleString('en-IN')}), Savings: ${budgetHealth.rule50_30_20.savings.percentage}%\n`;
      contextSummary += `- Category Breakdown:\n`;
      budgetHealth.categories.forEach((c) => {
        contextSummary += `   • ${c.category}: ₹${c.amount.toLocaleString('en-IN')} (${c.percentage}% of expenses)\n`;
      });
      if (budgetHealth.overspendingAlerts.length > 0) {
        contextSummary += `- Active Overspending Alerts:\n`;
        budgetHealth.overspendingAlerts.forEach((a) => {
          contextSummary += `   • [${a.severity.toUpperCase()}] ${a.category}: ${a.message}\n`;
        });
      }
    } else {
      contextSummary += '- Spending & Transactions: [WITHHELD BY USER CONSENT]\n';
    }

    if (consent.shareInvestments) {
      contextSummary += `- Risk Tolerance: ${profile.riskTolerance.toUpperCase()}\n`;
      contextSummary += `- Investment Horizon: ${profile.investmentHorizonYears} years\n`;
      contextSummary += `- Emergency Fund: ₹${investmentPlan.emergencyFundHealth.current.toLocaleString('en-IN')} / Target: ₹${investmentPlan.emergencyFundHealth.target.toLocaleString('en-IN')} (${investmentPlan.emergencyFundHealth.monthsCovered} months covered, status: ${investmentPlan.emergencyFundHealth.statusLabel || 'Active'})\n`;
      contextSummary += `- Target Asset Allocation: Equity ${investmentPlan.recommendedAllocation.equity}%, Debt ${investmentPlan.recommendedAllocation.debt}%, Gold ${investmentPlan.recommendedAllocation.gold}%, Cash ${investmentPlan.recommendedAllocation.cash}%\n`;
      contextSummary += `- Recommended Monthly Investment (SIP): ₹${investmentPlan.recommendedMonthlyInvestment.toLocaleString('en-IN')}\n`;
    } else {
      contextSummary += '- Investment Profile: [WITHHELD BY USER CONSENT]\n';
    }

    // 3. Try Gemini API if key is available
    const ai = this.getGeminiClient();
    if (ai) {
      try {
        const systemPrompt = `You are FinPulse AI, an empathetic, highly analytical personal financial advisor and wealth coach specialized in the Indian economy and retail personal finance.
You help users manage household budgets, cut runaway spending (Swiggy, dining, OTT, Amazon impulse buys), optimize savings, and build long-term wealth through disciplined Systematic Investment Plans (SIPs) in Nifty 50 Index funds, PPF, and Sovereign Gold.
Always express monetary values in Indian Rupees (₹) and use Indian numbering benchmarks (lakhs, crores).
Answer the user's specific typed question directly, incorporating the exact numbers, math, and calculations from their live context.
Keep advice practical, encouraging, mathematically accurate, and formatted cleanly using markdown with clear headings, bold metrics, and bullet steps.
Adhere strictly to user privacy: only reference financial metrics explicitly permitted in the context below. If data was withheld, note that gracefully without scolding.

${contextSummary}`;

        // Build conversation contents including history
        const conversationHistory = (history || [])
          .filter((h) => h.content && (h.role === 'user' || h.role === 'assistant'))
          .map((h) => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`)
          .join('\n\n');

        const fullPrompt = `${systemPrompt}\n\n=== CONVERSATION HISTORY ===\n${conversationHistory}\n\nUser Question: ${userMessage}\n\nAssistant Response:`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: fullPrompt,
        });

        if (response && response.text && response.text.trim().length > 0) {
          return { response: response.text, consentFiltered: false };
        }
      } catch (err) {
        console.warn('Gemini API call failed or timed out, activating Natural Language Financial Engine fallback:', err);
      }
    }

    // 4. Advanced Natural Language Financial Reasoning Engine (Offline & Real-Time Dynamic)
    const reasoningResponse = this.analyzeAndRespond(
      userMessage,
      history,
      budgetHealth,
      investmentPlan,
      profile,
      transactions,
      consent
    );

    return {
      response: reasoningResponse,
      consentFiltered: false,
    };
  }

  public static async generateQuickInsights(): Promise<
    Array<{ title: string; desc: string; type: 'tip' | 'alert' | 'success' }>
  > {
    const consent = db.getConsent();
    const profile = db.getProfile();
    const transactions = db.getTransactions();
    const budget = FinancialEngine.calculateBudgetHealth(transactions, profile, consent);
    const plan = FinancialEngine.generateInvestmentPlan(profile, budget, consent);

    const insights: Array<{ title: string; desc: string; type: 'tip' | 'alert' | 'success' }> = [];

    if (!consent.aiAdvisoryConsent) {
      insights.push({
        title: 'AI Advisory Paused',
        desc: 'Enable AI Advisory in Consent Center to activate continuous expense and investment scanning.',
        type: 'alert',
      });
      return insights;
    }

    // Savings Rate Insight
    if (consent.shareIncome && consent.shareTransactions) {
      if (budget.savingsRate >= 25) {
        insights.push({
          title: 'Strong Savings Rate',
          desc: `You are currently saving ${budget.savingsRate}% of your income, beating the benchmark 20% rule!`,
          type: 'success',
        });
      } else {
        insights.push({
          title: 'Savings Potential Gap',
          desc: `Your savings rate is ${budget.savingsRate}%. Trimming discretionary expenses like dining or Swiggy could elevate this to 25%+.`,
          type: 'alert',
        });
      }
    }

    // Emergency Fund Insight
    if (consent.shareInvestments) {
      if (plan.emergencyFundHealth.monthsCovered >= 5) {
        insights.push({
          title: 'Emergency Cushion Secured (Green Tier)',
          desc: `Your emergency reserve covers ${plan.emergencyFundHealth.monthsCovered} months of expenses (≥ 5 months buffer). You have a solid financial moat protecting your investments.`,
          type: 'success',
        });
      } else if (plan.emergencyFundHealth.monthsCovered > 2) {
        insights.push({
          title: 'Emergency Cushion in Progress (Yellow Tier)',
          desc: `You have ${plan.emergencyFundHealth.monthsCovered} months of expenses covered (moderate buffer). Keep building towards 5–6 months before aggressive risk allocations.`,
          type: 'tip',
        });
      } else if (plan.emergencyFundHealth.monthsCovered > 1) {
        insights.push({
          title: 'Low Emergency Buffer Alert (Orange Tier)',
          desc: `Your emergency fund covers only ${plan.emergencyFundHealth.monthsCovered} months of expenses. Allocate extra liquid cash before taking new market risks.`,
          type: 'alert',
        });
      } else {
        insights.push({
          title: 'Critical Emergency Reserve Warning (Red Tier)',
          desc: `Your emergency fund covers ≤ 1 month of expenses (${plan.emergencyFundHealth.monthsCovered} mo). Any sudden disruption could force debt or asset liquidation. Prioritize emergency reserves immediately.`,
          type: 'alert',
        });
      }
    }

    // Investment SIP Insight
    if (consent.shareInvestments && consent.shareIncome) {
      insights.push({
        title: `Recommended ${plan.riskProfile.toUpperCase()} Allocation`,
        desc: `Deploy ₹${plan.recommendedMonthlyInvestment.toLocaleString('en-IN')}/mo with ${plan.recommendedAllocation.equity}% into Nifty 50 Index funds and ${plan.recommendedAllocation.debt}% into Debt/PPF.`,
        type: 'tip',
      });
    }

    return insights;
  }

  // =========================================================================
  // NATURAL LANGUAGE FINANCIAL REASONING ENGINE
  // Extracts numerical parameters, determines user intent, and performs exact
  // financial math over live database transactions and user profile.
  // =========================================================================

  private static parseRupeeAmount(text: string): number | null {
    const clean = text.replace(/,/g, '');

    // Pattern 1: e.g. "1.5 lakh", "2 lakhs", "1 lac"
    const lakhMatch = clean.match(/(\d+(?:\.\d+)?)\s*(?:lakhs?|lacs?)\b/i);
    if (lakhMatch) {
      return Math.round(parseFloat(lakhMatch[1]) * 100000);
    }

    // Pattern 2: e.g. "1.2 cr", "1 crore"
    const croreMatch = clean.match(/(\d+(?:\.\d+)?)\s*(?:crores?|crs?)\b/i);
    if (croreMatch) {
      return Math.round(parseFloat(croreMatch[1]) * 10000000);
    }

    // Pattern 3: e.g. "50k", "80k", "10k"
    const kMatch = clean.match(/(\d+(?:\.\d+)?)\s*k\b/i);
    if (kMatch) {
      return Math.round(parseFloat(kMatch[1]) * 1000);
    }

    // Pattern 4: ₹5000, ₹ 5000, 5000 rs, 5000 inr, or standalone 4+ digit number
    const rupeeMatch = clean.match(/(?:₹|rs\.?|inr)?\s*(\d{3,10})\s*(?:₹|rs\.?|inr|rupees)?/i);
    if (rupeeMatch) {
      const val = parseInt(rupeeMatch[1], 10);
      // Avoid parsing year numbers like 2026 as amount unless preceded by ₹
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

  private static parseYears(text: string): number | null {
    const match = text.match(/(\d+)\s*(?:years?|yrs?|yr)\b/i);
    if (match) {
      return parseInt(match[1], 10);
    }
    return null;
  }

  private static calculateSIPFutureValue(monthlyInvestment: number, years: number, annualRatePct: number): number {
    const r = annualRatePct / 100 / 12;
    const n = years * 12;
    if (r === 0) return monthlyInvestment * n;
    return Math.round(monthlyInvestment * ((Math.pow(1 + r, n) - 1) / r) * (1 + r));
  }

  private static analyzeAndRespond(
    query: string,
    history: { role: 'user' | 'assistant'; content: string }[],
    budget: BudgetHealth,
    plan: InvestmentPlan,
    profile: UserProfile,
    transactions: Transaction[],
    consent: UserConsent
  ): string {
    const q = query.toLowerCase().trim();
    const extractedAmount = this.parseRupeeAmount(query);
    const extractedYears = this.parseYears(query);

    // -----------------------------------------------------------------------
    // INTENT 1: Targeted Expense Cutting & Spend Optimization
    // e.g., "Where can I cut ₹5,000 from my monthly expenses?", "Cut 8000 from expenses",
    //       "How to reduce expenses", "Save money on dining"
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
        return (
          '📊 **Expense Optimization Guidance (Consent Withheld)**\n\n' +
          'To generate a precise category-by-category rupee reduction plan, please enable **Share Transactions** in the Consent & Privacy Center.\n\n' +
          '**General Indian Expense Optimization Principles:**\n' +
          '1. **Food & Dining Leakage**: Frequent food delivery (Swiggy/Zomato) adds 30–40% in packaging, delivery fees, and surge pricing. Restricting orders to 1–2 times weekly typically saves ₹3,500–₹6,000/month.\n' +
          '2. **Subscription Audit**: Check credit card & UPI auto-debits for unused OTT or gym apps.\n' +
          '3. **48-Hour Purchase Delay**: For discretionary shopping on Amazon/Flipkart, place items in your cart and wait 2 days before completing payment.'
        );
      }

      // Group discretionary categories
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

      let resp = `### 💡 Personalized Plan to Cut ${targetCutFormatted} from Monthly Expenses\n\n`;
      resp += `Your current total monthly expenditure is **₹${budget.totalExpenses.toLocaleString('en-IN')}**, of which discretionary "Wants" account for **₹${budget.rule50_30_20.wants.amount.toLocaleString('en-IN')} (${budget.rule50_30_20.wants.percentage}%)**.\n\n`;

      if (totalDiscretionary <= 0) {
        resp += `You currently have zero recorded discretionary expenses. Any cost reduction must come from renegotiating fixed living needs (rent, utilities).\n`;
        return resp;
      }

      resp += `**Recommended Rupee Reduction by Category:**\n`;

      // Proportional cut across discretionary categories
      let allocatedCut = 0;
      const cuts: { category: string; current: number; cut: number; revised: number; tip: string }[] = [];

      const tipsMap: Record<string, string> = {
        'Food & Dining': 'Cook staples at home 2 extra days/week; cap Swiggy/Zomato orders to weekends.',
        'Shopping': 'Implement a 48-hour cool-off rule on Amazon/Myntra impulse buys.',
        'Subscriptions': 'Audit UPI auto-debits; cancel duplicate OTT, cloud storage, or idle memberships.',
        'Entertainment': 'Opt for matinee screenings or community sports instead of high-markup lounges.',
        'Other': 'Review miscellaneous digital micropayments and unclassified UPI transfers.',
      };

      const categoriesWithSpend = Object.keys(discretionaryMap).filter((k) => (discretionaryMap[k] || 0) > 0);

      categoriesWithSpend.forEach((cat, idx) => {
        const currentAmount = discretionaryMap[cat];
        let share: number;
        if (idx === categoriesWithSpend.length - 1) {
          share = Math.max(0, targetCut - allocatedCut);
        } else {
          share = Math.round(targetCut * (currentAmount / totalDiscretionary));
          // Don't cut more than 60% of any category
          share = Math.min(share, Math.round(currentAmount * 0.6));
        }
        allocatedCut += share;
        cuts.push({
          category: cat,
          current: currentAmount,
          cut: share,
          revised: Math.max(0, currentAmount - share),
          tip: tipsMap[cat] || 'Optimize and set a strict monthly cap.',
        });
      });

      cuts.forEach((c) => {
        if (c.cut > 0) {
          resp += `- **${c.category}**: Cut **-₹${c.cut.toLocaleString('en-IN')}** (from ₹${c.current.toLocaleString('en-IN')} down to **₹${c.revised.toLocaleString('en-IN')}**)\n  *Strategy:* ${c.tip}\n`;
        }
      });

      const revisedTotalExpenses = Math.max(0, budget.totalExpenses - targetCut);
      const currentSurplus = budget.netSavings;
      const revisedSurplus = currentSurplus + targetCut;
      const revisedSavingsRate = profile.monthlyIncome > 0 ? Math.round((revisedSurplus / profile.monthlyIncome) * 100) : 0;
      const fiveYearGrowth = this.calculateSIPFutureValue(targetCut, 5, 12);

      resp += `\n**📊 Financial Impact on Your Numbers:**\n`;
      resp += `- **Monthly Outflow:** Drops from ₹${budget.totalExpenses.toLocaleString('en-IN')} ➔ **₹${revisedTotalExpenses.toLocaleString('en-IN')}**\n`;
      resp += `- **Net Monthly Surplus:** Expands from ₹${currentSurplus.toLocaleString('en-IN')} ➔ **₹${revisedSurplus.toLocaleString('en-IN')}** (+₹${targetCut.toLocaleString('en-IN')}/mo)\n`;
      resp += `- **Target Savings Rate:** Improves from **${budget.savingsRate}%** ➔ **${revisedSavingsRate}%** of income\n`;
      resp += `- **5-Year Compounding Wealth:** Redirecting this saved ₹${targetCut.toLocaleString('en-IN')}/month into a low-cost Nifty 50 Index Fund at 12% CAGR yields approximately **₹${fiveYearGrowth.toLocaleString('en-IN')}** in 5 years!\n\n`;

      resp += `**Actionable Execution:** Set up an auto-debit SIP on salary day (e.g. 5th of every month) for this saved amount so you invest first and spend only what remains.`;
      return resp;
    }

    // -----------------------------------------------------------------------
    // INTENT 2: Affordability & Big Purchases
    // e.g., "Can I afford a ₹50,000 vacation?", "Can I buy an iPhone for 80,000?",
    //       "Can I afford a 1.5 lakh bike?"
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
      const monthlyEssential = budget.rule50_30_20.needs.amount > 0 ? budget.rule50_30_20.needs.amount : Math.round((profile.monthlyIncome || 60000) * 0.5);
      const currentRunway = Number((emergencyReserve / (monthlyEssential || 1)).toFixed(1));

      let resp = `### 🔍 Affordability Assessment for ₹${itemCost.toLocaleString('en-IN')}\n\n`;

      resp += `**Your Financial Baseline:**\n`;
      resp += `- **Monthly Net Surplus:** ₹${monthlySurplus.toLocaleString('en-IN')}\n`;
      resp += `- **Liquid Emergency Reserve:** ₹${emergencyReserve.toLocaleString('en-IN')} (${currentRunway} months buffer)\n`;
      resp += `- **Monthly Essential Expenses:** ₹${monthlyEssential.toLocaleString('en-IN')}\n\n`;

      // Option A: Paying from Emergency Fund (Lump sum)
      const postReserve = emergencyReserve - itemCost;
      const postRunway = Number((postReserve / (monthlyEssential || 1)).toFixed(1));

      resp += `**Scenario 1: Dipping into Existing Reserves (Lump Sum)**\n`;
      if (postReserve < 0) {
        resp += `❌ **Not Feasible with Cash:** Item cost exceeds your entire emergency reserve by ₹${Math.abs(postReserve).toLocaleString('en-IN')}.\n\n`;
      } else if (postRunway < 5) {
        resp += `⚠️ **High Risk:** Paying ₹${itemCost.toLocaleString('en-IN')} in cash drops your emergency runway from **${currentRunway} months down to ${postRunway} months** (below the safe Indian benchmark of ≥ 5 months). Any sudden job disruption or medical event would risk debt.\n\n`;
      } else {
        resp += `✅ **Buffer Remains Healthy:** Your runway would remain at **${postRunway} months** (≥ 5 months buffer). However, replenishing this reserve should take immediate priority.\n\n`;
      }

      // Option B: Funding from Monthly Surplus (Disciplined Path)
      if (monthlySurplus > 0) {
        // Dedicated 50% surplus allocation
        const dedicatedSurplus = Math.round(monthlySurplus * 0.5);
        const monthsNeededWith50 = Math.ceil(itemCost / dedicatedSurplus);
        const monthsNeededWith100 = Math.ceil(itemCost / monthlySurplus);

        resp += `**Scenario 2: Sinking Fund via Monthly Surplus (Recommended)**\n`;
        resp += `- By routing **50% of your surplus (₹${dedicatedSurplus.toLocaleString('en-IN')}/mo)** into an auto sweep-in FD or overnight fund, you can purchase this in **${monthsNeededWith50} months** completely debt-free without touching emergency savings or pausing your mutual fund SIPs!\n`;
        resp += `- If you route **100% of your surplus (₹${monthlySurplus.toLocaleString('en-IN')}/mo)**, you can purchase it in **${monthsNeededWith100} month(s)**.\n\n`;
      } else {
        resp += `**Scenario 2: Sinking Fund:** You currently have zero monthly surplus. You must first trim discretionary expenses before taking on this cost.\n\n`;
      }

      resp += `**FinPulse Verdict:** `;
      if (monthlySurplus >= itemCost * 0.5 && currentRunway >= 5) {
        resp += `🟢 **Comfortably Affordable** with 2–3 months of disciplined sinking fund planning. Avoid No-Cost EMI credit card traps that lock up future cash flow.`;
      } else if (currentRunway >= 5) {
        resp += `🟡 **Affordable with Staged Savings.** Save via a dedicated 3 to 6-month recurring deposit before buying.`;
      } else {
        resp += `🔴 **Not Recommended Right Now.** Secure your 5–6 month emergency cushion (currently ${currentRunway} mo) first before committing to this discretionary purchase.`;
      }

      return resp;
    }

    // -----------------------------------------------------------------------
    // INTENT 3: Loan & EMI Feasibility
    // e.g., "Can I afford an EMI of ₹15,000?", "Can I take a car loan of 12000 emi?"
    // -----------------------------------------------------------------------
    const isLoanOrEMIIntent =
      q.includes('emi') ||
      q.includes('loan') ||
      q.includes('home loan') ||
      q.includes('car loan') ||
      q.includes('personal loan');

    if (isLoanOrEMIIntent && extractedAmount !== null) {
      const proposedEMI = extractedAmount;
      const income = profile.monthlyIncome || 0;
      const currentDebt = budget.categories.find((c) => c.category === 'Debt & Loans')?.amount || 0;
      const totalPostEMI = currentDebt + proposedEMI;
      const foir = income > 0 ? Math.round((totalPostEMI / income) * 100) : 0;
      const surplus = budget.netSavings;
      const postSurplus = surplus - proposedEMI;

      let resp = `### 💳 EMI Feasibility Analysis for ₹${proposedEMI.toLocaleString('en-IN')}/month\n\n`;

      resp += `**Debt Metrics & Banking Ratios:**\n`;
      resp += `- **Monthly Net Income:** ₹${income.toLocaleString('en-IN')}\n`;
      resp += `- **Existing Debt/EMI Payments:** ₹${currentDebt.toLocaleString('en-IN')}\n`;
      resp += `- **Proposed New Total EMI:** ₹${totalPostEMI.toLocaleString('en-IN')}\n`;
      resp += `- **FOIR (Fixed Obligation to Income Ratio):** **${foir}%** (Prudent Indian Banking Limit is ≤ 35%)\n`;
      resp += `- **Impact on Monthly Surplus:** Reduces surplus from ₹${surplus.toLocaleString('en-IN')} ➔ **₹${postSurplus.toLocaleString('en-IN')}**\n\n`;

      if (postSurplus < 0) {
        resp += `🚨 **Critical Risk:** This EMI would trigger a **monthly deficit of -₹${Math.abs(postSurplus).toLocaleString('en-IN')}**, pushing you into high-interest revolving credit debt. Do NOT proceed with this loan without either increasing your down payment or extending the tenure.`;
      } else if (foir > 40) {
        resp += `⚠️ **High Debt Burden:** At ${foir}% FOIR, your loan obligations exceed prudent thresholds. It will severely crowd out your mutual fund SIPs and emergency cushion contributions.`;
      } else {
        resp += `✅ **Safe & Manageable:** Your FOIR remains healthy at **${foir}%** (well below the 35% ceiling), leaving a residual monthly buffer of **₹${postSurplus.toLocaleString('en-IN')}**. Ensure you maintain at least 6 months of EMI payments in your liquid emergency fund.`;
      }

      return resp;
    }

    // -----------------------------------------------------------------------
    // INTENT 4: SIP Compounding & Long-term Wealth Projections
    // e.g., "What will my wealth be in 10 years if I invest ₹10,000?", "Compound interest in 5 years",
    //       "How much will 15000 sip grow to in 15 years?"
    // -----------------------------------------------------------------------
    const isSIPWealthIntent =
      q.includes('wealth') ||
      q.includes('grow') ||
      q.includes('compound') ||
      q.includes('future value') ||
      q.includes('sip calculator') ||
      q.includes('crore') ||
      (q.includes('in') && (q.includes('year') || q.includes('yr'))) ||
      q.includes('returns');

    if (isSIPWealthIntent) {
      const monthlySIP = extractedAmount || plan.recommendedMonthlyInvestment || 15000;
      const years = extractedYears || profile.investmentHorizonYears || 10;

      const totalInvested = monthlySIP * 12 * years;
      const equityConservative = this.calculateSIPFutureValue(monthlySIP, years, 11);
      const equityNifty50 = this.calculateSIPFutureValue(monthlySIP, years, 13);
      const equityAggressive = this.calculateSIPFutureValue(monthlySIP, years, 15);
      const ppfDebt = this.calculateSIPFutureValue(monthlySIP, years, 7.1);

      let resp = `### 🚀 SIP Wealth Projection: ₹${monthlySIP.toLocaleString('en-IN')}/mo over ${years} Years\n\n`;
      resp += `If you consistently invest **₹${monthlySIP.toLocaleString('en-IN')} per month** for **${years} years** (${years * 12} installments), your total capital outlay will be **₹${totalInvested.toLocaleString('en-IN')}**.\n\n`;

      resp += `**Projected Maturity Corpus across Indian Asset Classes:**\n\n`;
      resp += `| Vehicle / Asset Class | Expected CAGR | Total Invested | Estimated Corpus | Wealth Multiplier |\n`;
      resp += `| :--- | :---: | :---: | :---: | :---: |\n`;
      resp += `| **PPF / Sovereign Debt** | 7.1% | ₹${totalInvested.toLocaleString('en-IN')} | **₹${ppfDebt.toLocaleString('en-IN')}** | ${(ppfDebt / totalInvested).toFixed(1)}x |\n`;
      resp += `| **Nifty 50 Index Fund** | 13.0% | ₹${totalInvested.toLocaleString('en-IN')} | **₹${equityNifty50.toLocaleString('en-IN')}** | **${(equityNifty50 / totalInvested).toFixed(1)}x** |\n`;
      resp += `| **Flexi Cap / Midcap Active** | 15.0% | ₹${totalInvested.toLocaleString('en-IN')} | **₹${equityAggressive.toLocaleString('en-IN')}** | ${(equityAggressive / totalInvested).toFixed(1)}x |\n\n`;

      const wealthCreated = equityNifty50 - totalInvested;
      resp += `**💡 The Power of Disciplined Indian Equities:**\n`;
      resp += `- Pure Compound Growth Gain: **+₹${wealthCreated.toLocaleString('en-IN')}** created purely by compounding in a broad Nifty 50 Index fund.\n`;
      resp += `- **Step-up SIP Hack:** If you increase your SIP by just **10% annually** as your salary grows, your final corpus will nearly **double** to approx. **₹${Math.round(equityNifty50 * 1.65).toLocaleString('en-IN')}**!\n\n`;

      resp += `**Actionable Suggestion:** Start with low-cost direct plans (e.g. UTI Nifty 50 Index Direct or HDFC Index Fund) with 0.15% expense ratio to save on intermediary commissions.`;
      return resp;
    }

    // -----------------------------------------------------------------------
    // INTENT 5: Emergency Reserve & Runway Audit
    // e.g., "Is my emergency fund sufficient for 6 months?", "How many months can I survive?"
    // -----------------------------------------------------------------------
    const isEmergencyIntent =
      q.includes('emergency') ||
      q.includes('safety cushion') ||
      q.includes('runway') ||
      q.includes('lose job') ||
      q.includes('buffer') ||
      q.includes('months covered');

    if (isEmergencyIntent) {
      const current = plan.emergencyFundHealth.current;
      const target = plan.emergencyFundHealth.target;
      const months = plan.emergencyFundHealth.monthsCovered;
      const essential = plan.emergencyFundHealth.monthlyEssentialExpenses || (budget.rule50_30_20.needs.amount > 0 ? budget.rule50_30_20.needs.amount : Math.round((profile.monthlyIncome || 60000) * 0.5));
      const shortfall = plan.emergencyFundHealth.shortfall;

      let tierBadge = '';
      if (months <= 1) tierBadge = '🔴 Critical Buffer (≤ 1 Month)';
      else if (months <= 2) tierBadge = '🟠 Low Buffer (1–2 Months)';
      else if (months < 5) tierBadge = '🟡 Moderate Buffer (2–4 Months)';
      else tierBadge = '🟢 Healthy Cushion (≥ 5 Months Buffer)';

      let resp = `### 🛡️ Emergency Safety Cushion & Runway Analysis\n\n`;
      resp += `**Current Reserve Status:** ${tierBadge}\n\n`;
      resp += `- **Liquid Emergency Reserve:** ₹${current.toLocaleString('en-IN')}\n`;
      resp += `- **Monthly Essential Living Needs:** ₹${essential.toLocaleString('en-IN')}/month\n`;
      resp += `- **Runway Months Covered:** **${months} months** (Target: 6 months = ₹${target.toLocaleString('en-IN')})\n`;
      resp += `- **Buffer Condition:** ${months >= 5 ? '✅ Solid Cushion protecting your equities from panic liquidation' : '⚠️ Shortfall of ₹' + shortfall.toLocaleString('en-IN')}\n\n`;

      resp += `**Where to Park Emergency Reserves in India for Zero Penalty & Instant Liquidity:**\n`;
      resp += `1. **Auto Sweep-in Savings Account (30%)**: Auto-transfers excess balance into 6.5–7.0% FDs while maintaining instant UPI/ATM withdrawal access without breakage penalty.\n`;
      resp += `2. **Overnight / Liquid Mutual Funds (Direct Plan) (70%)**: Features SEBI-mandated instant redemption of up to ₹50,000/day into your bank account within 30 minutes, with no lock-in.`;

      return resp;
    }

    // -----------------------------------------------------------------------
    // INTENT 6: Specific Merchant or Category Spend Breakdown
    // e.g., "How much did I spend on Swiggy?", "What are my food expenses?",
    //       "Show me grocery spending", "Rent expenses"
    // -----------------------------------------------------------------------
    const merchantKeywords = [
      { name: 'Swiggy & Zomato Food Delivery', tags: ['swiggy', 'zomato', 'food delivery'] },
      { name: 'Food & Dining (Total)', tags: ['food', 'dining', 'restaurant', 'cafe'] },
      { name: 'Grocery & Zepto Staples', tags: ['grocery', 'groceries', 'zepto', 'blinkit', 'supermarket', 'staples'] },
      { name: 'Apartment Housing & Rent', tags: ['rent', 'housing', 'maintenance'] },
      { name: 'Utilities & Broadband', tags: ['electricity', 'utility', 'utilities', 'wifi', 'broadband', 'jiofiber', 'bescom'] },
      { name: 'Digital Subscriptions', tags: ['subscription', 'netflix', 'hotstar', 'prime', 'spotify', 'ott'] },
      { name: 'Commute & Travel', tags: ['travel', 'uber', 'ola', 'metro', 'transport', 'cab'] },
      { name: 'Shopping & Apparel', tags: ['shopping', 'clothes', 'amazon', 'flipkart', 'myntra'] },
    ];

    for (const m of merchantKeywords) {
      if (m.tags.some((t) => q.includes(t))) {
        const matchingTx = transactions.filter((tx) =>
          tx.type === 'expense' &&
          (m.tags.some((t) => tx.description.toLowerCase().includes(t)) ||
           m.tags.some((t) => tx.category.toLowerCase().includes(t)))
        );

        const totalSpent = matchingTx.reduce((acc, t) => acc + t.amount, 0);
        const percentOfExpenses = budget.totalExpenses > 0 ? Math.round((totalSpent / budget.totalExpenses) * 100) : 0;
        const percentOfIncome = profile.monthlyIncome > 0 ? Math.round((totalSpent / profile.monthlyIncome) * 100) : 0;

        let resp = `### 🧾 Spending Audit: ${m.name}\n\n`;
        resp += `- **Total Spent this Month:** **₹${totalSpent.toLocaleString('en-IN')}**\n`;
        resp += `- **Share of Monthly Expenses:** **${percentOfExpenses}%**\n`;
        resp += `- **Share of Monthly Income:** **${percentOfIncome}%**\n`;
        resp += `- **Total Recorded Transactions:** ${matchingTx.length}\n\n`;

        if (matchingTx.length > 0) {
          resp += `**Itemized Transactions:**\n`;
          matchingTx.forEach((tx) => {
            resp += `- **${tx.date}**: ${tx.description} ➔ **-₹${tx.amount.toLocaleString('en-IN')}** (${tx.paymentMethod})\n`;
          });
          resp += `\n`;
        }

        resp += `**Copilot Recommendation:** `;
        if (percentOfIncome > 15) {
          resp += `This category is consuming a disproportionate share (${percentOfIncome}%) of your salary. Trimming orders by 20% would free up ~₹${Math.round(totalSpent * 0.2).toLocaleString('en-IN')}/mo to boost your SIP.`;
        } else {
          resp += `This spend is well-contained within healthy Indian retail benchmarks. Keep tracking it regularly.`;
        }

        return resp;
      }
    }

    // -----------------------------------------------------------------------
    // INTENT 7: Top Expenses & Spending Leakage Audit
    // e.g., "What are my highest expenses?", "Where is my money going?", "Top expenses"
    // -----------------------------------------------------------------------
    if (q.includes('highest') || q.includes('top expense') || q.includes('biggest') || q.includes('where is my money going')) {
      let resp = `### 📊 Your Top Monthly Expenses Breakdown\n\n`;
      resp += `You have spent **₹${budget.totalExpenses.toLocaleString('en-IN')}** across ${budget.categories.length} categories this month:\n\n`;

      budget.categories.forEach((c, idx) => {
        const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '•';
        resp += `${medal} **${c.category}**: **₹${c.amount.toLocaleString('en-IN')}** (${c.percentage}% of expenses)\n`;
      });

      if (budget.overspendingAlerts.length > 0) {
        resp += `\n**⚠️ Active Anomaly Alerts Detected:**\n`;
        budget.overspendingAlerts.forEach((a) => {
          resp += `- **${a.category}**: ${a.message}\n`;
        });
      }

      return resp;
    }

    // -----------------------------------------------------------------------
    // INTENT 8: 50/30/20 Rule Analysis
    // e.g., "Explain the 50/30/20 rule for my salary", "How is my 50/30/20 budget?"
    // -----------------------------------------------------------------------
    if (q.includes('50/30/20') || q.includes('rule') || q.includes('budget framework')) {
      const income = profile.monthlyIncome || 0;
      const idealNeeds = Math.round(income * 0.5);
      const idealWants = Math.round(income * 0.3);
      const idealSavings = Math.round(income * 0.2);

      let resp = `### 📐 The 50/30/20 Budget Breakdown for Your ₹${income.toLocaleString('en-IN')} Salary\n\n`;
      resp += `The 50/30/20 framework splits your net income into three disciplined buckets:\n\n`;

      resp += `1. **Essential Needs (Target: 50% = ₹${idealNeeds.toLocaleString('en-IN')}):**\n`;
      resp += `   - **Your Status:** ₹${budget.rule50_30_20.needs.amount.toLocaleString('en-IN')} (**${budget.rule50_30_20.needs.percentage}%**)\n`;
      resp += `   - Covers housing rent, groceries, electricity bills, transit, and loan EMIs.\n\n`;

      resp += `2. **Discretionary Wants (Target: 30% = ₹${idealWants.toLocaleString('en-IN')}):**\n`;
      resp += `   - **Your Status:** ₹${budget.rule50_30_20.wants.amount.toLocaleString('en-IN')} (**${budget.rule50_30_20.wants.percentage}%**)\n`;
      resp += `   - Covers dining out, weekend social outings, shopping, and OTT subscriptions.\n\n`;

      resp += `3. **Savings & Wealth Accumulation (Target: 20% = ₹${idealSavings.toLocaleString('en-IN')}):**\n`;
      resp += `   - **Your Status:** ₹${budget.rule50_30_20.savings.amount.toLocaleString('en-IN')} (**${budget.rule50_30_20.savings.percentage}%**)\n`;
      resp += `   - Dedicated to building your liquid emergency runway and monthly index SIPs.\n\n`;

      if (budget.rule50_30_20.savings.percentage >= 20) {
        resp += `✨ **Status:** You are outperforming the benchmark 20% savings target! Keep channeling your surplus into compounding assets.`;
      } else {
        resp += `⚠️ **Status:** Your savings rate is below the 20% target. Cutting ~₹${Math.max(0, idealSavings - budget.netSavings).toLocaleString('en-IN')} from Wants will align your budget.`;
      }

      return resp;
    }

    // -----------------------------------------------------------------------
    // INTENT 9: Investment Strategy & Portfolio Allocation
    // e.g., "What is the best Nifty 50 & PPF allocation for my risk level?",
    //       "How should I invest a ₹15,000 monthly surplus?"
    // -----------------------------------------------------------------------
    if (q.includes('invest') || q.includes('portfolio') || q.includes('nifty') || q.includes('ppf') || q.includes('stocks') || q.includes('gold')) {
      const monthlyDeploy = extractedAmount || plan.recommendedMonthlyInvestment || 15000;

      let resp = `### 📈 Personalized Investment Allocation (${plan.riskProfile.toUpperCase()} Profile)\n\n`;
      resp += `For your **${plan.riskProfile}** risk tolerance with a **${profile.investmentHorizonYears}-year horizon**, we recommend deploying **₹${monthlyDeploy.toLocaleString('en-IN')}/month** as follows:\n\n`;

      const eqAmt = Math.round((monthlyDeploy * plan.recommendedAllocation.equity) / 100);
      const debtAmt = Math.round((monthlyDeploy * plan.recommendedAllocation.debt) / 100);
      const goldAmt = Math.round((monthlyDeploy * plan.recommendedAllocation.gold) / 100);
      const cashAmt = Math.round((monthlyDeploy * plan.recommendedAllocation.cash) / 100);

      resp += `- 🏛️ **Equities (${plan.recommendedAllocation.equity}% ➔ ₹${eqAmt.toLocaleString('en-IN')}/mo):** Low-cost Nifty 50 Index Fund Direct Plan (e.g. UTI/HDFC) for compounding at 12–14% CAGR.\n`;
      resp += `- 🛡️ **Debt & Fixed Income (${plan.recommendedAllocation.debt}% ➔ ₹${debtAmt.toLocaleString('en-IN')}/mo):** Public Provident Fund (PPF, 7.1% tax-exempt EEE) or Corporate Bond Fund for capital preservation.\n`;
      resp += `- 🪙 **Gold (${plan.recommendedAllocation.gold}% ➔ ₹${goldAmt.toLocaleString('en-IN')}/mo):** Sovereign Gold Bonds (SGB) or Nippon India Gold BeES for geopolitical and rupee inflation hedging.\n`;
      resp += `- 💧 **Liquid Buffer (${plan.recommendedAllocation.cash}% ➔ ₹${cashAmt.toLocaleString('en-IN')}/mo):** High-yield sweep-in FD or Liquid Mutual Fund for short-term liquidity.\n\n`;

      if (plan.emergencyFundHealth.monthsCovered < 5) {
        resp += `⚠️ **Important Precondition:** Your emergency cushion is currently at ${plan.emergencyFundHealth.monthsCovered} months (healthy is ≥ 5 mo). Allocate ₹${Math.min(5000, plan.emergencyFundHealth.shortfall).toLocaleString('en-IN')}/mo towards your emergency fund first before aggressive equity exposure.`;
      }

      return resp;
    }

    // -----------------------------------------------------------------------
    // DEFAULT INTENT: Contextual Financial Q&A / Summary
    // -----------------------------------------------------------------------
    return (
      `### 🙏 Namaste! FinPulse AI Financial Copilot\n\n` +
      `Here is your real-time financial telemetry based on your live account data:\n\n` +
      `- **Monthly Net Income:** ${consent.shareIncome ? '₹' + profile.monthlyIncome.toLocaleString('en-IN') : '[Consent Withheld]'}\n` +
      `- **Monthly Expenses:** ${consent.shareTransactions ? '₹' + budget.totalExpenses.toLocaleString('en-IN') : '[Consent Withheld]'}\n` +
      `- **Net Monthly Surplus:** ${consent.shareIncome && consent.shareTransactions ? '₹' + budget.netSavings.toLocaleString('en-IN') + ' (' + budget.savingsRate + '% savings rate)' : '[Consent Withheld]'}\n` +
      `- **Emergency Runway:** ${consent.shareInvestments ? plan.emergencyFundHealth.monthsCovered + ' months (₹' + plan.emergencyFundHealth.current.toLocaleString('en-IN') + ')' : '[Consent Withheld]'}\n` +
      `- **Risk Profile:** ${consent.shareInvestments ? plan.riskProfile.toUpperCase() : '[Consent Withheld]'}\n\n` +
      `**You can ask me specific questions like:**\n` +
      `- *"Where can I cut ₹5,000 from my monthly expenses?"*\n` +
      `- *"Can I afford a ₹50,000 vacation without hurting my savings?"*\n` +
      `- *"Can I afford a car EMI of ₹15,000?"*\n` +
      `- *"How much will a ₹10,000 monthly SIP grow to in 10 years?"*\n` +
      `- *"How much did I spend on Swiggy and dining out?"*\n` +
      `- *"Is my emergency fund sufficient for 6 months?"*`
    );
  }
}
