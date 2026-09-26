import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Eye,
  Download,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Code,
} from 'lucide-react';
import { UserConsent, UserProfile, BudgetHealth, InvestmentPlan } from '../types';

interface ConsentCenterProps {
  consent: UserConsent | null;
  profile: UserProfile | null;
  budget: BudgetHealth | null;
  plan: InvestmentPlan | null;
  onUpdateConsent: (updated: Partial<UserConsent>) => Promise<void>;
  onWipeData: () => Promise<void>;
  onResetDemo: () => Promise<void>;
}

export const ConsentCenter: React.FC<ConsentCenterProps> = ({
  consent,
  profile,
  budget,
  plan,
  onUpdateConsent,
  onWipeData,
  onResetDemo,
}) => {
  const [showPayload, setShowPayload] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [confirmWipe, setConfirmWipe] = useState(false);

  const handleToggle = async (key: keyof UserConsent, currentVal: boolean) => {
    setSavingKey(key);
    try {
      await onUpdateConsent({ [key]: !currentVal });
      setActionNotice('Consent preference updated successfully.');
      setTimeout(() => setActionNotice(null), 3000);
    } finally {
      setSavingKey(null);
    }
  };

  const handleExportData = () => {
    const exportObject = {
      exportTimestamp: new Date().toISOString(),
      consent,
      profile,
      budget,
      plan,
    };

    const blob = new Blob([JSON.stringify(exportObject, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `finpulse_personal_data_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Build the live preview of what the AI model actually receives
  const aiTelemetryPayload = {
    consentStatus: {
      aiAdvisoryConsent: consent?.aiAdvisoryConsent,
      lastConsentUpdate: consent?.lastUpdated,
    },
    monthlyIncome: consent?.shareIncome
      ? `+₹${profile?.monthlyIncome?.toLocaleString('en-IN')}`
      : '[WITHHELD BY USER CONSENT]',
    expensesAndTransactions: consent?.shareTransactions
      ? {
          totalExpenses: `-₹${budget?.totalExpenses?.toLocaleString('en-IN')}`,
          savingsRate: `${budget?.savingsRate}%`,
          needsVsWantsVsSavings: budget?.rule50_30_20,
          categories: budget?.categories,
        }
      : '[WITHHELD BY USER CONSENT]',
    investmentProfile: consent?.shareInvestments
      ? {
          riskTolerance: profile?.riskTolerance,
          emergencyFundCurrent: `₹${profile?.emergencyFundCurrent?.toLocaleString('en-IN')}`,
          emergencyFundTarget: `₹${plan?.emergencyFundHealth.target?.toLocaleString('en-IN')}`,
          existingInvestments: profile?.existingInvestments,
        }
      : '[WITHHELD BY USER CONSENT]',
  };

  return (
    <div className="space-y-8 w-full max-w-[1600px] mx-auto">
      {/* Top Banner: Light Minimalist Colorful Style */}
      <div className="bg-gradient-to-r from-emerald-50/90 via-teal-50/60 to-cyan-50/50 dark:bg-none dark:bg-[#111827] border border-emerald-200/90 dark:border-slate-800 p-6 rounded-2xl transition-colors shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center border border-emerald-300 dark:border-emerald-500/20 shadow-xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Privacy & Consent Control Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              You own your financial data. Select what information the AI advisor is permitted to analyze.
            </p>
          </div>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/30 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Granular Permission Toggles: Colorful Pastel Mint/Teal Card */}
      <div className="bg-gradient-to-br from-emerald-50/60 via-teal-50/30 to-white dark:bg-none dark:bg-[#111827] border border-emerald-200/80 dark:border-slate-800 rounded-2xl p-6 space-y-6 transition-colors shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
            <Lock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Granular Data Consent Toggles
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Changes take effect immediately. AI reasoning models only process data you explicitly permit.
          </p>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {/* 1. Transaction Telemetry */}
          <div className="py-4.5 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white">
                  Share Transaction Telemetry & Spending History
                </span>
                {consent?.shareTransactions ? (
                  <span className="text-xs px-2.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-500/20">
                    Granted
                  </span>
                ) : (
                  <span className="text-xs px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium">
                    Withheld
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
                Allows FinPulse to analyze individual transactions, merchant categories, and detect overspending leakages like subscriptions or dining out.
              </p>
            </div>

            <button
              onClick={() => handleToggle('shareTransactions', !!consent?.shareTransactions)}
              disabled={savingKey === 'shareTransactions'}
              className={`w-11 h-6 rounded-full transition-colors relative shrink-0 p-0.5 ${
                consent?.shareTransactions ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  consent?.shareTransactions ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 2. Monthly Income */}
          <div className="py-4.5 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white">
                  Share Monthly Income & Payroll Figures
                </span>
                {consent?.shareIncome ? (
                  <span className="text-xs px-2.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-500/20">
                    Granted
                  </span>
                ) : (
                  <span className="text-xs px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium">
                    Withheld
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
                Enables computation of your 50/30/20 budget framework, savings rate, and maximum monthly investable surplus.
              </p>
            </div>

            <button
              onClick={() => handleToggle('shareIncome', !!consent?.shareIncome)}
              disabled={savingKey === 'shareIncome'}
              className={`w-11 h-6 rounded-full transition-colors relative shrink-0 p-0.5 ${
                consent?.shareIncome ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  consent?.shareIncome ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 3. Investment & Risk Profile */}
          <div className="py-4.5 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white">
                  Share Investment Reserves & Risk Profile
                </span>
                {consent?.shareInvestments ? (
                  <span className="text-xs px-2.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-500/20">
                    Granted
                  </span>
                ) : (
                  <span className="text-xs px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium">
                    Withheld
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
                Enables personalized asset allocation, emergency runway calculation, and vehicle suggestions (Nifty 50, Debt, Gold).
              </p>
            </div>

            <button
              onClick={() => handleToggle('shareInvestments', !!consent?.shareInvestments)}
              disabled={savingKey === 'shareInvestments'}
              className={`w-11 h-6 rounded-full transition-colors relative shrink-0 p-0.5 ${
                consent?.shareInvestments ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  consent?.shareInvestments ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 4. AI Advisory Engine */}
          <div className="py-4.5 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white">
                  Enable AI Financial Advisory Engine
                </span>
                {consent?.aiAdvisoryConsent ? (
                  <span className="text-xs px-2.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-500/20">
                    Active
                  </span>
                ) : (
                  <span className="text-xs px-2.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold border border-amber-200 dark:border-amber-500/20">
                    Paused
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
                Master switch for AI reasoning. When disabled, the AI copilot will not analyze any financial figures.
              </p>
            </div>

            <button
              onClick={() => handleToggle('aiAdvisoryConsent', !!consent?.aiAdvisoryConsent)}
              disabled={savingKey === 'aiAdvisoryConsent'}
              className={`w-11 h-6 rounded-full transition-colors relative shrink-0 p-0.5 ${
                consent?.aiAdvisoryConsent ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  consent?.aiAdvisoryConsent ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Live AI Sanitized Telemetry Inspector */}
      <div className="bg-gradient-to-br from-cyan-50/60 via-blue-50/30 to-white dark:bg-none dark:bg-[#111827] border border-cyan-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Eye className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              Live AI Telemetry Inspector
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Inspect the exact sanitized JSON payload transmitted to the AI engine based on your current consent toggles.
            </p>
          </div>

          <button
            onClick={() => setShowPayload(!showPayload)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/90 dark:bg-slate-800 hover:bg-cyan-50 dark:hover:bg-slate-700 text-xs sm:text-sm font-semibold text-cyan-800 dark:text-teal-300 border border-cyan-200 dark:border-slate-700 transition self-start sm:self-auto shadow-xs"
          >
            <Code className="w-4 h-4" />
            <span>{showPayload ? 'Hide Live Payload' : 'Inspect Live Payload'}</span>
          </button>
        </div>

        {showPayload && (
          <div className="mt-3 p-4 bg-slate-900 dark:bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto max-h-80 animate-in fade-in">
            <pre>{JSON.stringify(aiTelemetryPayload, null, 2)}</pre>
          </div>
        )}
      </div>

      {/* Data Sovereignty & Portability Actions: Groww Cards */}
      <div className="bg-gradient-to-br from-slate-50/90 via-blue-50/30 to-purple-50/20 dark:bg-none dark:bg-[#111827] border border-slate-300/80 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm transition-colors">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Data Sovereignty & Portability</h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Exercise full control over your stored financial history at any time.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Export JSON */}
          <button
            onClick={handleExportData}
            className="p-5 bg-emerald-50/70 hover:bg-emerald-100/70 dark:bg-slate-900/60 dark:hover:bg-slate-900 rounded-2xl border border-emerald-200/80 dark:border-slate-800 text-left transition flex flex-col justify-between shadow-xs"
          >
            <div>
              <Download className="w-5 h-5 text-teal-600 dark:text-teal-400 mb-2" />
              <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">Download My Data</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Export complete transactions and portfolio records as a portable JSON file.
              </p>
            </div>
          </button>

          {/* Reset Demo Data */}
          <button
            onClick={async () => {
              await onResetDemo();
              setActionNotice('Demo financial data and default consent restored.');
              setTimeout(() => setActionNotice(null), 3000);
            }}
            className="p-5 bg-blue-50/70 hover:bg-blue-100/70 dark:bg-slate-900/60 dark:hover:bg-slate-900 rounded-2xl border border-blue-200/80 dark:border-slate-800 text-left transition flex flex-col justify-between shadow-xs"
          >
            <div>
              <RefreshCw className="w-5 h-5 text-blue-600 dark:text-blue-400 mb-2" />
              <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">Restore Demo Profile</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Load rich sample Indian financial data for evaluation and testing.
              </p>
            </div>
          </button>

          {/* Wipe All Data (Danger Zone) */}
          <div className="p-5 bg-rose-50/80 hover:bg-rose-100/80 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/20 rounded-2xl flex flex-col justify-between shadow-xs">
            <div>
              <Trash2 className="w-5 h-5 text-rose-600 dark:text-rose-400 mb-2" />
              <div className="text-sm sm:text-base font-bold text-rose-700 dark:text-rose-300">Wipe All Data (Forget Me)</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Permanently purge all transactions, profile settings, and revoke consent.
              </p>
            </div>

            <div className="mt-3">
              {confirmWipe ? (
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      await onWipeData();
                      setConfirmWipe(false);
                      setActionNotice('All financial data permanently purged.');
                      setTimeout(() => setActionNotice(null), 3000);
                    }}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold rounded-xl transition"
                  >
                    Confirm Wipe
                  </button>
                  <button
                    onClick={() => setConfirmWipe(false)}
                    className="px-2 py-1.5 text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmWipe(true)}
                  className="px-3 py-1.5 bg-rose-100 dark:bg-rose-500/10 hover:bg-rose-200 dark:hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 text-[11px] font-semibold rounded-xl transition flex items-center gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Purge Data</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
