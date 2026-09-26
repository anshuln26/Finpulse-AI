import React from 'react';
import { ShieldCheck, ShieldAlert, ArrowRight } from 'lucide-react';
import { UserConsent } from '../types';

interface ConsentBannerProps {
  consent: UserConsent | null;
  onOpenConsent: () => void;
}

export const ConsentBanner: React.FC<ConsentBannerProps> = ({ consent, onOpenConsent }) => {
  if (!consent) return null;

  const isRestricted =
    !consent.aiAdvisoryConsent ||
    !consent.shareTransactions ||
    !consent.shareIncome ||
    !consent.shareInvestments;

  if (!isRestricted) {
    return (
      <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl px-4 py-3 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs sm:text-sm transition-colors">
        <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
          <ShieldCheck className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>
            <strong>User Consent Active:</strong> AI recommendations are personalized using your consented transaction, income, and risk profile data.
          </span>
        </div>
        <button
          onClick={onOpenConsent}
          className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 font-semibold underline flex items-center gap-1 shrink-0 self-start sm:self-auto"
        >
          Manage Data Permissions <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 rounded-2xl px-4 py-3.5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm transition-colors">
      <div className="flex items-start sm:items-center gap-2.5 text-amber-900 dark:text-amber-200">
        <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
        <div>
          <span className="font-semibold text-amber-800 dark:text-amber-300">Privacy Protection Mode:</span>{' '}
          Some financial data streams are paused by your consent preferences. AI recommendations will be generalized.
        </div>
      </div>
      <button
        onClick={onOpenConsent}
        className="px-3.5 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 dark:bg-amber-500/20 dark:hover:bg-amber-500/30 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 font-semibold flex items-center gap-1.5 self-start sm:self-auto transition shrink-0"
      >
        <span>Consent Center</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
