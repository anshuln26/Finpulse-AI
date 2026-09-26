import React, { useState } from 'react';
import {
  Receipt,
  Plus,
  UploadCloud,
  Search,
  Trash2,
  AlertTriangle,
  CreditCard,
  Calendar,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import { Transaction, BudgetHealth, SpendingCategory, UserConsent } from '../types';

interface ExpensesProps {
  transactions: Transaction[];
  budget: BudgetHealth | null;
  consent: UserConsent | null;
  onAddTransaction: () => void;
  onUploadCSV: () => void;
  onDeleteTransaction: (id: string) => Promise<void>;
}

const ALL_CATEGORIES: SpendingCategory[] = [
  'Salary',
  'Freelance',
  'Business',
  'Investment Returns',
  'Rental Income',
  'Bonus',
  'Housing',
  'Food & Dining',
  'Transportation',
  'Utilities',
  'Entertainment',
  'Healthcare',
  'Shopping',
  'Investment',
  'Debt & Loans',
  'Subscriptions',
  'Other',
];

export const Expenses: React.FC<ExpensesProps> = ({
  transactions,
  budget,
  consent,
  onAddTransaction,
  onUploadCSV,
  onDeleteTransaction,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isTxShared = consent?.shareTransactions;

  // Filter logic
  const filtered = transactions.filter((tx) => {
    const matchesSearch =
      tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tx.notes && tx.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'all' || tx.category === selectedCategory;

    const matchesType =
      selectedType === 'all' || tx.type === selectedType;

    return matchesSearch && matchesCategory && matchesType;
  });

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await onDeleteTransaction(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner: Light Minimalist Colorful Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-rose-50/90 via-orange-50/50 to-amber-50/50 dark:bg-none dark:bg-[#111827] border border-rose-200/90 dark:border-slate-800 p-6 rounded-2xl transition-colors shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Receipt className="w-5 h-5 text-rose-600 dark:text-emerald-400" />
            Expense Management & Ledger
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Detect spend leakage, audit transactions, and enforce disciplined monthly budgets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onUploadCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium bg-white/90 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300/80 dark:border-slate-800 transition shadow-xs"
          >
            <UploadCloud className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>Import CSV</span>
          </button>
          <button
            onClick={onAddTransaction}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Entry</span>
          </button>
        </div>
      </div>

      {/* Overspending Alerts: Clean Flat Alert Cards (Rose/Red Pastel Tint) */}
      {budget?.overspendingAlerts && budget.overspendingAlerts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>Expense Control Alerts</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {budget.overspendingAlerts.map((alert, idx) => (
              <div
                key={idx}
                className="bg-gradient-to-br from-rose-50/90 to-red-50/40 dark:bg-none dark:bg-[#111827] border border-rose-300/80 dark:border-rose-500/20 rounded-2xl p-5 flex gap-3 text-xs sm:text-sm transition-colors shadow-sm"
              >
                <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-300 dark:border-rose-500/20">
                  <AlertTriangle className="w-4.5 h-4.5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">{alert.category}</span>
                    <span className="font-bold text-rose-700 dark:text-rose-300 px-2.5 py-0.5 rounded-md bg-rose-100/80 dark:bg-rose-500/10 text-xs sm:text-sm border border-rose-300/80 dark:border-rose-500/20">
                      -₹{alert.amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm leading-relaxed">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Search Bar: Minimal Flat Style (Slate-Sky Pastel Tint) */}
      <div className="bg-gradient-to-r from-slate-50/95 via-sky-50/40 to-indigo-50/30 dark:bg-none dark:bg-[#111827] border border-slate-300/80 dark:border-slate-800 rounded-2xl p-4 transition-colors shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by merchant, description, or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/95 dark:bg-slate-900 border border-slate-300/80 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition shadow-xs"
            />
          </div>

          {/* Category Dropdown */}
          <div className="sm:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-white/95 dark:bg-slate-900 border border-slate-300/80 dark:border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition shadow-xs"
            >
              <option value="all">All Categories</option>
              {ALL_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Type Dropdown */}
          <div className="sm:col-span-3">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full bg-white/95 dark:bg-slate-900 border border-slate-300/80 dark:border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition shadow-xs"
            >
              <option value="all">All Types (Expenses & Income)</option>
              <option value="expense">Expenses Only</option>
              <option value="income">Income Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transaction Table / Cards: Groww Clean Flat List (Soft Slate-Blue Pastel Tint) */}
      <div className="bg-gradient-to-b from-slate-50/90 via-white to-blue-50/20 dark:bg-none dark:bg-[#111827] border border-slate-300/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm transition-colors">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          <span>
            Showing <strong className="text-slate-900 dark:text-white">{filtered.length}</strong> transactions
          </span>
        </div>

        {!isTxShared ? (
          <div className="p-12 text-center text-slate-400">
            <p className="text-sm">Transaction sharing is paused in your Consent Center.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Layers className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No transactions match your filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {filtered.map((tx) => (
              <div
                key={tx.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/95 dark:hover:bg-slate-800/30 transition"
              >
                <div className="flex items-start gap-3 min-w-0">
                  {/* Distinct Icon Badge: Green for Income, Red for Expense */}
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                      tx.type === 'income'
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/20 shadow-xs'
                        : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-500/20 shadow-xs'
                    }`}
                  >
                    {tx.type === 'income' ? (
                      <ArrowDownLeft className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white truncate">
                      {tx.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {tx.date}
                      </span>
                      <span>•</span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-xs font-semibold ${
                          tx.type === 'income'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40'
                            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40'
                        }`}
                      >
                        {tx.category}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-xs">
                        <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                        {tx.paymentMethod}
                      </span>
                    </div>
                    {tx.notes && (
                      <p className="text-xs text-slate-400 italic mt-1">{tx.notes}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pl-13 sm:pl-0">
                  <div className="text-right">
                    <p
                      className={`text-sm sm:text-base font-bold ${
                        tx.type === 'income'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {tx.type === 'income' ? '+ ' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                    </p>
                    <span
                      className={`text-xs font-semibold capitalize ${
                        tx.type === 'income'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {tx.type}
                    </span>
                  </div>

                  <button
                    onClick={() => handleDelete(tx.id)}
                    disabled={deletingId === tx.id}
                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition disabled:opacity-50"
                    title="Delete transaction"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
