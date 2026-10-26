import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  TrendingUp,
  BotMessageSquare,
  ShieldCheck,
} from 'lucide-react';

export type NavTab = 'dashboard' | 'expenses' | 'investments' | 'aichat' | 'consent';

interface NavigationProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentTab, onSelectTab }) => {
  const tabs = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'expenses' as NavTab, label: 'Expenses', icon: Receipt },
    { id: 'investments' as NavTab, label: 'Investments', icon: TrendingUp },
    { id: 'aichat' as NavTab, label: 'AI Advisor', icon: BotMessageSquare, badge: 'Copilot' },
    { id: 'consent' as NavTab, label: 'Consent & Privacy', icon: ShieldCheck },
  ];

  return (
    <>
      {/* Desktop Sidebar (Left side on >= lg screens) */}
      <aside className="hidden lg:flex flex-col w-60 border-r border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0e1424] p-3.5 shrink-0 min-h-[calc(100vh-61px)] transition-colors">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
          Menu
        </div>
        <nav className="flex flex-col gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                  isActive
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  />
                  <span>{tab.label}</span>
                </div>
                {tab.badge && (
                  <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Security badge at bottom of sidebar */}
        <div className="mt-auto p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50/70 to-teal-50/40 dark:bg-none dark:bg-slate-900/60 border border-emerald-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Consent-First Model</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-tight">
            Financial telemetry is anonymized and never analyzed without opt-in.
          </p>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar (Fixed at bottom on < lg screens) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0b0f19]/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 pb-safe shadow-lg transition-colors">
        <div className="flex items-center justify-around">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-all ${
                  isActive
                    ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <div className="relative">
                  <Icon
                    className={`w-5 h-5 ${
                      isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                    }`}
                  />
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  )}
                </div>
                <span className="text-xs mt-1 tracking-tight truncate max-w-[70px]">
                  {tab.id === 'consent' ? 'Privacy' : tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
