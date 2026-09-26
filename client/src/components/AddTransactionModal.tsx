import React, { useState } from 'react';
import { X, PlusCircle, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { SpendingCategory, Transaction } from '../types';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (tx: Omit<Transaction, 'id'>) => Promise<void>;
}

const EXPENSE_CATEGORIES: SpendingCategory[] = [
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

const INCOME_CATEGORIES: SpendingCategory[] = [
  'Salary',
  'Freelance',
  'Business',
  'Investment Returns',
  'Rental Income',
  'Bonus',
  'Other Income',
];

const EXPENSE_PAYMENT_METHODS = [
  'UPI (GPay / PhonePe / Paytm)',
  'Net Banking (NEFT / IMPS)',
  'Credit Card',
  'Debit Card',
  'Cash',
];

const INCOME_PAYOUT_METHODS = [
  'Direct Bank Transfer (NEFT / IMPS)',
  'UPI (GPay / PhonePe / Paytm)',
  'Cheque Deposit',
  'Cash',
  'Wire Transfer',
];

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<SpendingCategory>('Food & Dining');
  const [paymentMethod, setPaymentMethod] = useState<string>('UPI (GPay / PhonePe / Paytm)');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // When switching type, update default category & method
  const handleTypeChange = (newType: 'expense' | 'income') => {
    setType(newType);
    if (newType === 'income') {
      setCategory('Salary');
      setPaymentMethod('Direct Bank Transfer (NEFT / IMPS)');
    } else {
      setCategory('Food & Dining');
      setPaymentMethod('UPI (GPay / PhonePe / Paytm)');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;

    setLoading(true);
    try {
      await onAdd({
        description,
        source: type === 'income' ? description : undefined,
        amount: parseFloat(amount),
        type,
        category,
        paymentMethod,
        date,
        notes,
      });
      // Reset form
      setDescription('');
      setAmount('');
      setNotes('');
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isIncome = type === 'income';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-gradient-to-b from-white via-slate-50 to-emerald-50/20 dark:bg-none dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg transition"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
          {isIncome ? (
            <ArrowDownLeft className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <ArrowUpRight className="w-5 h-5 text-rose-600 dark:text-rose-400" />
          )}
          {isIncome ? 'Add Income Entry' : 'Add Expense Entry'}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
          {isIncome
            ? 'Record an incoming salary, freelance payout, or earnings credit.'
            : 'Record an outflow expense to audit spending and budget leakage.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Toggle: Expense vs Income */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition ${
                !isIncome
                  ? 'bg-rose-50 dark:bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-500/40 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Expense (Outflow)</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition ${
                isIncome
                  ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/40 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>Income (Inflow)</span>
            </button>
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isIncome ? 'Amount (Inflow ₹)' : 'Amount (Outflow ₹)'}
              </label>
              <div className="relative">
                <span
                  className={`absolute left-3 top-1/2 -translate-y-1/2 font-bold text-sm ${
                    isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {isIncome ? '+₹' : '-₹'}
                </span>
                <input
                  type="number"
                  step="1"
                  required
                  placeholder={isIncome ? '50000' : '1500'}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={`w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none transition ${
                    isIncome ? 'focus:border-emerald-500' : 'focus:border-rose-500'
                  }`}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
          </div>

          {/* Description / Income Source */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {isIncome ? 'Income Source / Payer' : 'Description / Merchant'}
            </label>
            <input
              type="text"
              required
              placeholder={
                isIncome
                  ? 'e.g. Tech Corp Payroll, Freelance Client, Upwork, Rental Tenant'
                  : 'e.g. Swiggy, Zepto, BESCOM, JioFiber, Rent'
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* Category & Payment / Payout Method */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isIncome ? 'Income Category' : 'Expense Category'}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as SpendingCategory)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500 transition"
              >
                {isIncome
                  ? INCOME_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))
                  : EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isIncome ? 'Method of Payout' : 'Payment Method'}
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500 transition"
              >
                {isIncome
                  ? INCOME_PAYOUT_METHODS.map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))
                  : EXPENSE_PAYMENT_METHODS.map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Notes (Optional)
            </label>
            <input
              type="text"
              placeholder={
                isIncome
                  ? 'e.g. Performance bonus, milestone invoice #104'
                  : 'e.g. Shared with roommate, grocery restock'
              }
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* Submit */}
          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl text-white shadow-sm transition disabled:opacity-50 flex items-center gap-1.5 ${
                isIncome
                  ? 'bg-emerald-600 hover:bg-emerald-500'
                  : 'bg-rose-600 hover:bg-rose-500'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>{loading ? 'Saving...' : isIncome ? 'Save Income' : 'Save Expense'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
