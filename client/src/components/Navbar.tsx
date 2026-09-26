import React from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Plus,
  UploadCloud,
  Sun,
  Moon,
} from 'lucide-react';
import { UserConsent } from '../types';

interface NavbarProps {
  consent: UserConsent | null;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenAddModal: () => void;
  onOpenCSVModal: () => void;
  onNavigateToConsent: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  consent,
  theme,
  onToggleTheme,
  onOpenAddModal,
  onOpenCSVModal,
  onNavigateToConsent,
}) => {
  const isConsentFullyActive =
    consent?.aiAdvisoryConsent &&
    consent?.shareTransactions &&
    consent?.shareIncome &&
    consent?.shareInvestments;

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#0b0f19]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 px-4 sm:px-6 lg:px-8 py-2.5 transition-colors">
      <div className="w-full max-w-[1720px] mx-auto flex items-center justify-between">
        {/* Brand: Clean & Minimal like Groww */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold shadow-sm">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              FinPulse
            </span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 hidden sm:inline">
              Personal Wealth Copilot
            </span>
          </div>
        </div>

        {/* Action Controls & Theme Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Light / Dark Mode Toggle */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title={theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 transition-transform hover:rotate-45" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600 transition-transform hover:-rotate-12" />
            )}
          </button>

          {/* Live Consent Status Pill */}
          <button
            onClick={onNavigateToConsent}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
              isConsentFullyActive
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30'
                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30'
            }`}
            title="Manage consent & privacy permissions"
          >
            {isConsentFullyActive ? (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            )}
            <span className="hidden md:inline">
              {isConsentFullyActive ? 'Consent Active' : 'Consent Restricted'}
            </span>
          </button>

          {/* Upload CSV */}
          <button
            onClick={onOpenCSVModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition"
            title="Import Bank Statement CSV"
          >
            <UploadCloud className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span className="hidden sm:inline">Import CSV</span>
          </button>

          {/* Add Transaction Button */}
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Entry</span>
          </button>
        </div>
      </div>
    </header>
  );
};
