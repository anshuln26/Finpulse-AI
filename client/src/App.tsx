import { useState, useEffect, useCallback } from 'react';
import { api } from './services/api';
import {
  UserConsent,
  UserProfile,
  Transaction,
  BudgetHealth,
  InvestmentPlan,
  AIInsight,
  RiskTolerance,
  ChatMessage,
} from './types';
import { Navbar } from './components/Navbar';
import { Navigation, NavTab } from './components/Navigation';
import { ConsentBanner } from './components/ConsentBanner';
import { AddTransactionModal } from './components/AddTransactionModal';
import { CSVImportModal } from './components/CSVImportModal';
import { Dashboard } from './pages/Dashboard';
import { Expenses } from './pages/Expenses';
import { Investments } from './pages/Investments';
import { AIChat } from './pages/AIChat';
import { ConsentCenter } from './pages/ConsentCenter';

const INITIAL_CHAT_MESSAGE: ChatMessage = {
  id: 'init-1',
  role: 'assistant',
  content:
    '🙏 **Namaste! I am FinPulse AI**, your consent-governed personal financial recommender tailored for the Indian market.\n\n' +
    'I can help you audit household expenses, cut spend leakages (Swiggy, dining, OTT), calculate emergency runway, and tailor an optimal asset allocation (Nifty 50 Index funds, PPF, Sovereign Gold).\n\n' +
    'How can I help optimize your wealth today?',
  timestamp: 'Just now',
};

export function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [consent, setConsent] = useState<UserConsent | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [budget, setBudget] = useState<BudgetHealth | null>(null);
  const [plan, setPlan] = useState<InvestmentPlan | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);

  // Theme state: defaults to dark
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('finpulse_theme');
    return (saved as 'light' | 'dark') || 'dark';
  });

  // Chat conversation state: persisted across tab switches and page refreshes
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('finpulse_chat_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading stored chat history:', e);
    }
    return [INITIAL_CHAT_MESSAGE];
  });

  useEffect(() => {
    try {
      localStorage.setItem('finpulse_chat_history', JSON.stringify(chatMessages));
    } catch (e) {
      console.error('Error saving chat history:', e);
    }
  }, [chatMessages]);

  const handleResetChat = () => {
    setChatMessages([INITIAL_CHAT_MESSAGE]);
    localStorage.removeItem('finpulse_chat_history');
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
    localStorage.setItem('finpulse_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCSVModalOpen, setIsCSVModalOpen] = useState(false);

  // Fetch all core data
  const refreshAllData = useCallback(async () => {
    try {
      const [c, p, b, pl, tx, ins] = await Promise.all([
        api.getConsent(),
        api.getProfile(),
        api.getBudgetHealth(),
        api.getInvestmentPlan(),
        api.getTransactions(),
        api.getAIInsights(),
      ]);

      setConsent(c);
      setProfile(p);
      setBudget(b);
      setPlan(pl);
      setTransactions(tx);
      setInsights(ins);
    } catch (err) {
      console.error('Failed to load application data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  // Handlers
  const handleUpdateConsent = async (updated: Partial<UserConsent>) => {
    const newConsent = await api.updateConsent(updated);
    setConsent(newConsent);
    // Refresh calculations based on updated consent
    await refreshAllData();
  };

  const handleWipeData = async () => {
    await api.wipeUserData();
    await refreshAllData();
  };

  const handleResetDemo = async () => {
    await api.resetDemoData();
    await refreshAllData();
  };

  const handleAddTransaction = async (tx: Omit<Transaction, 'id'>) => {
    await api.addTransaction(tx);
    await refreshAllData();
  };

  const handleDeleteTransaction = async (id: string) => {
    await api.deleteTransaction(id);
    await refreshAllData();
  };

  const handleUploadCSV = async (file: File) => {
    const res = await api.uploadCSV(file);
    await refreshAllData();
    return res;
  };

  const handleUpdateRiskProfile = async (risk: RiskTolerance) => {
    await api.updateProfile({ riskTolerance: risk });
    await refreshAllData();
  };

  const handleSendMessage = async (
    message: string,
    history: { role: 'user' | 'assistant'; content: string }[]
  ) => {
    return api.chatWithAI(message, history);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 transition-colors">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 animate-pulse mb-4 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-emerald-500/20">
          F
        </div>
        <p className="text-sm font-medium">Initializing FinPulse AI & Consent Telemetry...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Top Navbar */}
      <Navbar
        consent={consent}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenCSVModal={() => setIsCSVModalOpen(true)}
        onNavigateToConsent={() => setCurrentTab('consent')}
      />

      <div className="flex-1 flex max-w-[1720px] w-full mx-auto">
        {/* Navigation (Sidebar on desktop / Bottom bar on mobile) */}
        <Navigation
          currentTab={currentTab}
          onSelectTab={(tab) => setCurrentTab(tab)}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 min-w-0 max-w-full">
          {/* Global Consent Alert Banner */}
          {currentTab !== 'consent' && (
            <ConsentBanner
              consent={consent}
              onOpenConsent={() => setCurrentTab('consent')}
            />
          )}

          {/* Tab Views: Kept mounted in DOM with display toggle to preserve state, conversation history, and scroll position */}
          <div className={currentTab === 'dashboard' ? 'block' : 'hidden'}>
            <Dashboard
              budget={budget}
              profile={profile}
              consent={consent}
              transactions={transactions}
              insights={insights}
              onNavigate={(tab) => setCurrentTab(tab)}
              onOpenAddModal={() => setIsAddModalOpen(true)}
            />
          </div>

          <div className={currentTab === 'expenses' ? 'block' : 'hidden'}>
            <Expenses
              transactions={transactions}
              budget={budget}
              consent={consent}
              onAddTransaction={() => setIsAddModalOpen(true)}
              onUploadCSV={() => setIsCSVModalOpen(true)}
              onDeleteTransaction={handleDeleteTransaction}
            />
          </div>

          <div className={currentTab === 'investments' ? 'block' : 'hidden'}>
            <Investments
              plan={plan}
              profile={profile}
              consent={consent}
              onUpdateRiskProfile={handleUpdateRiskProfile}
              onNavigateToConsent={() => setCurrentTab('consent')}
            />
          </div>

          <div className={currentTab === 'aichat' ? 'block' : 'hidden'}>
            <AIChat
              consent={consent}
              messages={chatMessages}
              setMessages={setChatMessages}
              onResetChat={handleResetChat}
              onSendMessage={handleSendMessage}
              onNavigateToConsent={() => setCurrentTab('consent')}
            />
          </div>

          <div className={currentTab === 'consent' ? 'block' : 'hidden'}>
            <ConsentCenter
              consent={consent}
              profile={profile}
              budget={budget}
              plan={plan}
              onUpdateConsent={handleUpdateConsent}
              onWipeData={handleWipeData}
              onResetDemo={handleResetDemo}
            />
          </div>
        </main>
      </div>

      {/* Global Modals */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddTransaction}
      />

      <CSVImportModal
        isOpen={isCSVModalOpen}
        onClose={() => setIsCSVModalOpen(false)}
        onUpload={handleUploadCSV}
      />
    </div>
  );
}

export default App;
