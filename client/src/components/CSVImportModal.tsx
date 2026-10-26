import React, { useState, useRef } from 'react';
import { X, UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle, Download, Sparkles } from 'lucide-react';
import { SYNTHETIC_CSV_DATA } from '../data/syntheticTransactions';

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<{ count: number }>;
}

export const CSVImportModal: React.FC<CSVImportModalProps> = ({
  isOpen,
  onClose,
  onUpload,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ count: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const res = await onUpload(file);
      setResult(res);
      setTimeout(() => {
        setFile(null);
        setResult(null);
        onClose();
      }, 1800);
    } catch (err: any) {
      setError(err.message || 'Failed to upload CSV statement');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadSample = () => {
    const blob = new Blob([SYNTHETIC_CSV_DATA], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'synthetic_financial_statement.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLoadSyntheticData = async () => {
    setLoading(true);
    setError(null);
    try {
      const syntheticBlob = new Blob([SYNTHETIC_CSV_DATA], { type: 'text/csv;charset=utf-8;' });
      const syntheticFile = new File([syntheticBlob], 'synthetic_financial_statement.csv', { type: 'text/csv' });
      setFile(syntheticFile);
      const res = await onUpload(syntheticFile);
      setResult(res);
      setTimeout(() => {
        setFile(null);
        setResult(null);
        onClose();
      }, 1800);
    } catch (err: any) {
      setError(err.message || 'Failed to feed synthetic data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-gradient-to-b from-white via-slate-50 to-teal-50/25 dark:bg-none dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg transition"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
          <UploadCloud className="w-5 h-5 text-teal-500 dark:text-teal-400" />
          Import Bank Statement CSV
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Bulk import your financial transactions for automated categorization and AI analysis.
        </p>

        {/* Drop / Select zone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition ${
            file
              ? 'border-emerald-500/50 bg-emerald-50 dark:bg-emerald-500/5'
              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/70'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv,text/csv"
            className="hidden"
          />

          <FileSpreadsheet className={`w-10 h-10 mb-2 ${file ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-400'}`} />
          {file ? (
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{file.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{(file.size / 1024).toFixed(1)} KB • Click to change</p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Click or drag & drop CSV bank statement here
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Accepts standard bank exports (Date, Description, Amount, Category)
              </p>
            </div>
          )}
        </div>

        {/* Synthetic Dataset & Sample Template */}
        <div className="mt-4 p-3.5 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent dark:from-emerald-500/15 dark:to-slate-800/60 rounded-xl border border-emerald-500/30 dark:border-emerald-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Realistic Synthetic Dataset (50 Entries)</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Salary, investments, rent, utilities, and dining data pre-configured.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleLoadSyntheticData}
              disabled={loading}
              type="button"
              className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50"
              title="Instantly import 50 realistic transactions without file browsing"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Feed Data</span>
            </button>
            <button
              onClick={handleDownloadSample}
              type="button"
              className="flex items-center gap-1 px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 transition"
              title="Download synthetic CSV file to your computer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </button>
          </div>
        </div>

        {/* Status messages */}
        {result && (
          <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Successfully imported {result.count} transactions! Recalculating metrics...</span>
          </div>
        )}

        {error && (
          <div className="mt-3 p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={!file || loading}
            className="px-5 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-500 text-white shadow-sm transition disabled:opacity-50"
          >
            {loading ? 'Processing CSV...' : 'Import Data'}
          </button>
        </div>
      </div>
    </div>
  );
};
