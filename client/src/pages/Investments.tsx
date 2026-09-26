import React, { useState } from 'react';
import {
  TrendingUp,
  ShieldCheck,
  AlertCircle,
  PieChart as PieIcon,
  Calculator,
  Compass,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { InvestmentPlan, UserProfile, UserConsent, RiskTolerance } from '../types';

interface InvestmentsProps {
  plan: InvestmentPlan | null;
  profile: UserProfile | null;
  consent: UserConsent | null;
  onUpdateRiskProfile: (risk: RiskTolerance) => Promise<void>;
  onNavigateToConsent: () => void;
}

const ALLOCATION_COLORS: Record<string, string> = {
  equity: '#10b981', // emerald
  debt: '#3b82f6',   // blue
  gold: '#f59e0b',   // amber
  cash: '#06b6d4',   // cyan
};

export const Investments: React.FC<InvestmentsProps> = ({
  plan,
  profile,
  consent,
  onUpdateRiskProfile,
  onNavigateToConsent,
}) => {
  const isInvestShared = consent?.shareInvestments;

  // SIP Calculator State
  const defaultMonthly = plan?.recommendedMonthlyInvestment || 15000;
  const [sipMonthly, setSipMonthly] = useState<number>(defaultMonthly);
  const [sipYears, setSipYears] = useState<number>(profile?.investmentHorizonYears || 10);
  const [expectedReturn, setExpectedReturn] = useState<number>(12); // 12% default for diversified Indian equity

  // Calculate SIP returns
  const monthlyRate = expectedReturn / 12 / 100;
  const totalMonths = sipYears * 12;
  const totalInvested = sipMonthly * totalMonths;
  const futureValue =
    monthlyRate > 0
      ? Math.round(
          sipMonthly *
            ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate) *
            (1 + monthlyRate)
        )
      : totalInvested;
  const estimatedReturns = Math.max(0, futureValue - totalInvested);

  // Prepare Pie Chart data
  const targetData = plan
    ? [
        { name: 'Nifty 50 / Equity', value: plan.recommendedAllocation.equity, color: ALLOCATION_COLORS.equity },
        { name: 'Debt / PPF', value: plan.recommendedAllocation.debt, color: ALLOCATION_COLORS.debt },
        { name: 'Gold / SGB', value: plan.recommendedAllocation.gold, color: ALLOCATION_COLORS.gold },
        { name: 'Liquid / Sweep FD', value: plan.recommendedAllocation.cash, color: ALLOCATION_COLORS.cash },
      ]
    : [];

  const currentData = plan
    ? [
        { name: 'Equity', value: plan.currentAllocation.equity, color: ALLOCATION_COLORS.equity },
        { name: 'Debt', value: plan.currentAllocation.debt, color: ALLOCATION_COLORS.debt },
        { name: 'Gold', value: plan.currentAllocation.gold, color: ALLOCATION_COLORS.gold },
        { name: 'Cash', value: plan.currentAllocation.cash, color: ALLOCATION_COLORS.cash },
      ]
    : [];

  return (
    <div className="space-y-8">
      {/* Top Banner: Light Minimalist Colorful Style */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-teal-50/90 via-emerald-50/60 to-cyan-50/50 dark:bg-none dark:bg-[#111827] border border-teal-200/90 dark:border-slate-800 p-6 rounded-2xl transition-colors shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Personalized Investment Advisor
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            SEBI risk-adjusted asset allocation, emergency runway hedging, and disciplined wealth building.
          </p>
        </div>

        {/* Risk Profile Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-white/90 dark:bg-slate-900 rounded-xl border border-teal-200 dark:border-slate-800 self-start sm:self-auto shadow-xs">
          {(['conservative', 'moderate', 'aggressive'] as RiskTolerance[]).map((r) => {
            const isActive = plan?.riskProfile === r;
            return (
              <button
                key={r}
                onClick={() => onUpdateRiskProfile(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {r}
              </button>
            );
          })}
        </div>
      </div>

      {!isInvestShared ? (
        <div className="bg-amber-50/80 dark:bg-[#111827] border border-amber-200/90 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-600 dark:text-slate-400 transition-colors shadow-sm">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            Investment Profiling Consent Required
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-4">
            To generate personalized asset allocations, emergency fund metrics, and monthly investment roadmaps, please enable investment data sharing in your Consent Center.
          </p>
          <button
            onClick={onNavigateToConsent}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm"
          >
            Open Consent Center
          </button>
        </div>
      ) : (
        <>
          {/* Emergency Fund Runway Metric Card (Soft Emerald-Teal Pastel Tint) */}
          {plan?.emergencyFundHealth && (() => {
            const months = plan.emergencyFundHealth.monthsCovered;
            // 4-Tier Cushion Rules:
            // <= 1 Mo: Red (Critical)
            // 1-2 Mo: Orange (Low)
            // 2-4 Mo: Yellow (Moderate)
            // >= 5 Mo: Green (Healthy)
            const cushion =
              months <= 1
                ? {
                    tier: 'critical',
                    label: 'Critical (≤ 1 Mo Buffer)',
                    badgeClass:
                      'bg-rose-100 dark:bg-rose-500/10 text-rose-800 dark:text-rose-400 border border-rose-300 dark:border-rose-500/30',
                    dotClass: 'bg-rose-500',
                    barClass: 'bg-rose-500',
                    iconClass: 'text-rose-600 dark:text-rose-400',
                    cardBg: 'bg-gradient-to-br from-rose-50/90 to-red-50/40 border-rose-300/80',
                  }
                : months <= 2
                ? {
                    tier: 'low',
                    label: 'Low Buffer (1–2 Mo Buffer)',
                    badgeClass:
                      'bg-orange-100 dark:bg-orange-500/10 text-orange-800 dark:text-orange-400 border border-orange-300 dark:border-orange-500/30',
                    dotClass: 'bg-orange-500',
                    barClass: 'bg-orange-500',
                    iconClass: 'text-orange-600 dark:text-orange-400',
                    cardBg: 'bg-gradient-to-br from-orange-50/90 to-amber-50/40 border-orange-300/80',
                  }
                : months < 5
                ? {
                    tier: 'moderate',
                    label: 'Moderate Buffer (2–4 Mo Buffer)',
                    badgeClass:
                      'bg-amber-100 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30',
                    dotClass: 'bg-amber-400',
                    barClass: 'bg-amber-400',
                    iconClass: 'text-amber-600 dark:text-amber-400',
                    cardBg: 'bg-gradient-to-br from-amber-50/90 to-yellow-50/40 border-amber-300/80',
                  }
                : {
                    tier: 'healthy',
                    label: 'Healthy Cushion (≥ 5 Mo Buffer)',
                    badgeClass:
                      'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30',
                    dotClass: 'bg-emerald-500',
                    barClass: 'bg-emerald-500',
                    iconClass: 'text-emerald-600 dark:text-emerald-400',
                    cardBg: 'bg-gradient-to-br from-emerald-50/80 via-teal-50/40 to-green-50/30 border-emerald-300/80',
                  };

            const progressPercent = Math.min(
              100,
              (plan.emergencyFundHealth.current / (plan.emergencyFundHealth.target || 1)) * 100
            );

            return (
              <div className={`${cushion.cardBg} dark:bg-none dark:bg-[#111827] border dark:border-slate-800 rounded-2xl p-6 transition-colors shadow-sm`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <ShieldCheck className={`w-5 h-5 ${cushion.iconClass}`} />
                      Emergency Safety Cushion
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                      Your financial moat: protects long-term investments against forced liquidation during emergencies.
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs sm:text-sm font-bold ${cushion.badgeClass}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${cushion.dotClass}`} />
                      <span>{months} / {plan.emergencyFundHealth.targetMonths} Months Covered</span>
                      <span className="opacity-80 font-medium">({cushion.label})</span>
                    </span>
                  </div>
                </div>

                {/* Progress bar with dynamic tier color */}
                <div className="w-full h-3.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-3">
                  <div
                    style={{ width: `${progressPercent}%` }}
                    className={`h-full transition-all duration-500 ${cushion.barClass}`}
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between text-xs sm:text-sm text-slate-500 dark:text-slate-400 gap-2">
                  <span>
                    Current Liquid Reserve:{' '}
                    <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                      +₹{plan.emergencyFundHealth.current.toLocaleString('en-IN')}
                    </strong>
                  </span>
                  <span>
                    Target ({plan.emergencyFundHealth.targetMonths} Mo):{' '}
                    <strong className="text-slate-900 dark:text-white font-bold">
                      ₹{plan.emergencyFundHealth.target.toLocaleString('en-IN')}
                    </strong>
                  </span>
                  {plan.emergencyFundHealth.shortfall > 0 ? (
                    <span
                      className={
                        cushion.tier === 'healthy'
                          ? 'text-amber-600 dark:text-amber-400 font-bold'
                          : 'text-rose-600 dark:text-rose-400 font-bold'
                      }
                    >
                      Shortfall to {plan.emergencyFundHealth.targetMonths} Mo: -₹
                      {plan.emergencyFundHealth.shortfall.toLocaleString('en-IN')}
                    </span>
                  ) : (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      ✓ {plan.emergencyFundHealth.targetMonths} Mo Target Fully Secured
                    </span>
                  )}
                </div>

                {/* Cushion Tier Indicator Legend */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Cushion Health Tiers:
                  </span>
                  <div className="flex items-center gap-3 flex-wrap font-medium">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      <span>≤ 1 Mo (Red • Critical)</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-orange-500" />
                      <span>1–2 Mo (Orange • Low)</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <span>2–4 Mo (Yellow • Moderate)</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>≥ 5 Mo (Green • Healthy)</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Asset Allocation: Target vs Current */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recommended Target Allocation (Soft Sky/Blue Pastel Tint) */}
            <div className="bg-gradient-to-br from-sky-50/80 via-blue-50/40 to-indigo-50/30 dark:bg-none dark:bg-[#111827] border border-sky-200/90 dark:border-slate-800 rounded-2xl p-6 flex flex-col transition-colors shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <PieIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  Recommended Asset Allocation
                </h2>
                <span className="text-xs uppercase font-bold text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 rounded-md bg-emerald-100/80 dark:bg-emerald-500/10 border border-emerald-200/60">
                  {plan?.riskProfile}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-4">
                Optimal risk-adjusted balance tailored for your investment horizon.
              </p>

              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={targetData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                    >
                      {targetData.map((entry, index) => (
                        <Cell key={`target-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0];
                          return (
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl text-xs shadow-lg">
                              <p className="font-semibold text-slate-900 dark:text-white">{data.name}</p>
                              <p className="text-emerald-600 dark:text-emerald-400 font-bold">{data.value}%</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                {targetData.map((d) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: d.color }}
                    />
                    <span className="text-slate-700 dark:text-slate-300 font-medium truncate">{d.name}</span>
                    <span className="text-slate-900 dark:text-white font-bold ml-auto">{d.value}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Current Portfolio Distribution (Soft Teal/Cyan Pastel Tint) */}
            <div className="bg-gradient-to-br from-teal-50/80 via-cyan-50/40 to-slate-50/50 dark:bg-none dark:bg-[#111827] border border-teal-200/90 dark:border-slate-800 rounded-2xl p-6 flex flex-col transition-colors shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <Compass className="w-5 h-5 text-teal-600 dark:text-blue-400" />
                Current Portfolio Snapshot
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-4">
                Your existing investment distribution across declared holdings.
              </p>

              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={currentData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                    >
                      {currentData.map((entry, index) => (
                        <Cell key={`current-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0];
                          return (
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl text-xs shadow-lg">
                              <p className="font-semibold text-slate-900 dark:text-white">{data.name}</p>
                              <p className="text-blue-600 dark:text-blue-400 font-bold">{data.value}%</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                {currentData.map((d) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: d.color }}
                    />
                    <span className="text-slate-700 dark:text-slate-300 font-medium truncate">{d.name}</span>
                    <span className="text-slate-900 dark:text-white font-bold ml-auto">{d.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Suggested Monthly SIP Vehicles (Soft Indigo-Purple Pastel Tint) */}
          {plan?.suggestedVehicles && plan.suggestedVehicles.length > 0 && (
            <div className="bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-white dark:bg-none dark:bg-[#111827] border border-indigo-200/80 dark:border-slate-800 rounded-2xl p-6 space-y-4 transition-colors shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Recommended Monthly Systematic Investment (SIP)
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                    Deploying your monthly investable surplus across diversified Indian assets.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Total Recommended: </span>
                  <span className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    ₹{plan.recommendedMonthlyInvestment.toLocaleString('en-IN')} / mo
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plan.suggestedVehicles.map((vehicle, idx) => {
                  const vehicleTint =
                    vehicle.type === 'Liquid/Emergency'
                      ? 'bg-teal-50/90 border-teal-200/90 text-teal-950'
                      : vehicle.type === 'Equity/Index'
                      ? 'bg-emerald-50/90 border-emerald-200/90 text-emerald-950'
                      : vehicle.type === 'Debt/FD/Bonds'
                      ? 'bg-blue-50/90 border-blue-200/90 text-blue-950'
                      : 'bg-amber-50/90 border-amber-200/90 text-amber-950';

                  return (
                    <div
                      key={idx}
                      className={`p-4 ${vehicleTint} dark:bg-slate-900/60 rounded-xl border dark:border-slate-800 flex flex-col justify-between shadow-xs`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-white/80 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border border-slate-200/60">
                            {vehicle.type}
                          </span>
                          <span className="text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-400">
                            ~₹{vehicle.suggestedMonthlyAmount.toLocaleString('en-IN')} / mo ({vehicle.allocationPercent}%)
                          </span>
                        </div>
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-1">{vehicle.name}</h3>
                        <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-400 leading-relaxed mb-2">
                          {vehicle.rationale}
                        </p>
                      </div>
                      <div className="text-xs font-medium text-slate-600 dark:text-slate-500">
                        Risk Profile: {vehicle.riskLevel}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Actionable Steps (Soft Emerald-Teal Pastel Tint) */}
          {plan?.actionItems && plan.actionItems.length > 0 && (
            <div className="bg-gradient-to-br from-emerald-50/70 via-teal-50/30 to-slate-50/50 dark:bg-none dark:bg-[#111827] border border-emerald-200/80 dark:border-slate-800 rounded-2xl p-6 transition-colors shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Actionable Next Steps</h2>
              <div className="space-y-2.5">
                {plan.actionItems.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                    <div className="w-5 h-5 rounded-full bg-emerald-200/70 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 flex items-center justify-center shrink-0 font-bold mt-0.5 border border-emerald-300/60">
                      {idx + 1}
                    </div>
                    <p className="leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interactive SIP Wealth Compounding Simulator (Soft Violet-Purple Pastel Tint) */}
          <div className="bg-gradient-to-br from-violet-50/80 via-purple-50/40 to-fuchsia-50/20 dark:bg-none dark:bg-[#111827] border border-violet-200/80 dark:border-slate-800 rounded-2xl p-6 transition-colors shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-violet-600 dark:text-teal-400" />
              SIP Compounding Wealth Calculator
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-6">
              Visualize the power of systematic compounding in the Indian market over time.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Sliders */}
              <div className="space-y-5 lg:col-span-2">
                <div>
                  <div className="flex justify-between text-xs sm:text-sm font-medium mb-1.5">
                    <span className="text-slate-700 dark:text-slate-400 font-semibold">Monthly Investment</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold text-sm sm:text-base">₹{sipMonthly.toLocaleString('en-IN')}</span>
                  </div>
                  <input
                    type="range"
                    min="1000"
                    max="100000"
                    step="1000"
                    value={sipMonthly}
                    onChange={(e) => setSipMonthly(Number(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs sm:text-sm font-medium mb-1.5">
                    <span className="text-slate-700 dark:text-slate-400 font-semibold">Investment Horizon</span>
                    <span className="text-blue-700 dark:text-blue-400 font-bold text-sm sm:text-base">{sipYears} Years</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="30"
                    step="1"
                    value={sipYears}
                    onChange={(e) => setSipYears(Number(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs sm:text-sm font-medium mb-1.5">
                    <span className="text-slate-700 dark:text-slate-400 font-semibold">Expected Annual Return (%)</span>
                    <span className="text-amber-700 dark:text-amber-400 font-bold text-sm sm:text-base">{expectedReturn}%</span>
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="20"
                    step="0.5"
                    value={expectedReturn}
                    onChange={(e) => setExpectedReturn(Number(e.target.value))}
                    className="w-full accent-amber-600 cursor-pointer"
                  />
                </div>
              </div>

              {/* Result Summary */}
              <div className="bg-white/95 dark:bg-slate-900/60 rounded-xl p-5 border border-violet-200/90 dark:border-slate-800 flex flex-col justify-between shadow-sm">
                <div>
                  <div className="text-xs sm:text-sm font-bold text-violet-800 dark:text-slate-400 uppercase tracking-wider mb-1">Estimated Future Wealth</div>
                  <div className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 mb-4">
                    ₹{futureValue.toLocaleString('en-IN')}
                  </div>

                  <div className="space-y-2 text-xs sm:text-sm">
                    <div className="flex justify-between text-slate-700 dark:text-slate-300">
                      <span>Total Invested:</span>
                      <strong className="text-slate-900 dark:text-white font-semibold">₹{totalInvested.toLocaleString('en-IN')}</strong>
                    </div>
                    <div className="flex justify-between text-slate-700 dark:text-slate-300">
                      <span>Estimated Wealth Gain:</span>
                      <strong className="text-emerald-600 dark:text-emerald-400 font-bold">+₹{estimatedReturns.toLocaleString('en-IN')}</strong>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-500 mt-4 leading-normal">
                  *Projections are illustrative based on periodic compounding. Mutual fund investments are subject to market risks.
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
