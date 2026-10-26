import { useState, useEffect, useCallback } from 'react';
import { api } from './services/api';
import { supabaseService } from './services/supabaseService';
import { supabase } from './services/supabaseClient';
import { FinancialEngine } from './services/financialEngine';
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
import { AuthModal } from './components/AuthModal';
import { Dashboard } from './pages/Dashboard';
import { Expenses } from './pages/Expenses';
import { Investments } from './pages/Investments';
import { AIChat } from './pages/AIChat';
import { ConsentCenter } from './pages/ConsentCenter';

const INITIAL_CHAT_MESSAGE: ChatMessage = {
  id: 'init-1',
  role: 'assistant',
  content:
    '🙏 Namaste! I am FinPulse AI, your consent-governed personal financial recommender tailored for the Indian market.\n\n' +
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

  // User Auth State (Supabase)
  const [user, setUser] = useState<any>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Theme state: defaults to dark
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('finpulse_theme');
    return (saved as 'light' | 'dark') || 'dark';
  });

  // Chat conversation state
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

  // Sync Supabase Auth State
  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch all core data (Cloud Supabase if logged in, else Local API fallback)
  const refreshAllData = useCallback(async () => {
    try {
      if (user && supabase) {
        // 1. Fetch cloud records for this authenticated user
        const [c, p, tx] = await Promise.all([
          supabaseService.getConsent(user.id),
          supabaseService.getProfile(user.id),
          supabaseService.getTransactions(user.id),
        ]);

        const activeConsent: UserConsent = c || {
          shareTransactions: true,
          shareIncome: true,
          shareInvestments: true,
          aiAdvisoryConsent: true,
          lastUpdated: new Date().toISOString(),
        };

        const activeProfile: UserProfile = p || {
          name: user.user_metadata?.full_name || 'My Account',
          monthlyIncome: 85000,
          savingsGoal: 25000,
          riskTolerance: 'moderate',
          investmentHorizonYears: 7,
          emergencyFundTargetMonths: 6,
          emergencyFundCurrent: 180000,
          existingInvestments: { equity: 250000, debt: 120000, gold: 60000, cash: 40000 },
        };

        const activeTx: Transaction[] = tx || [];

        // Real-time calculations with FinancialEngine
        const b = FinancialEngine.calculateBudgetHealth(activeTx, activeProfile, activeConsent);
        const pl = FinancialEngine.generateInvestmentPlan(activeProfile, b, activeConsent);

        setConsent(activeConsent);
        setProfile(activeProfile);
        setTransactions(activeTx);
        setBudget(b);
        setPlan(pl);

        try {
          const ins = await api.getAIInsights();
          setInsights(ins);
        } catch {
          setInsights([]);
        }
      } else {
        // 2. Demo / Offline Fallback (Local API)
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
      }
    } catch (err) {
      console.error('Failed to load application data:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  // Handlers
  const handleUpdateConsent = async (updated: Partial<UserConsent>) => {
    if (user && supabase) {
      await supabaseService.updateConsent(user.id, updated);
      showToast('Privacy consent settings updated in Supabase cloud!');
    } else {
      await api.updateConsent(updated);
    }
    await refreshAllData();
  };

  const handleWipeData = async () => {
    if (user && supabase) {
      await supabaseService.wipeUserData(user.id);
      showToast('All your cloud records have been permanently erased (Right to be Forgotten).', 'info');
    } else {
      await api.wipeUserData();
    }
    await refreshAllData();
  };

  const handleResetDemo = async () => {
    if (user && supabase) {
      await supabaseService.resetDemoData(user.id);
      showToast('Restored demo profile & starter transactions in Supabase!', 'success');
    } else {
      await api.resetDemoData();
    }
    await refreshAllData();
  };

  const handleAddTransaction = async (tx: Omit<Transaction, 'id'>) => {
    if (user && supabase) {
      await supabaseService.addTransaction(user.id, tx);
      showToast(`Added ${tx.type === 'income' ? 'income' : 'expense'}: ${tx.description}`);
    } else {
      await api.addTransaction(tx);
    }
    await refreshAllData();
  };

  const handleDeleteTransaction = async (id: string) => {
    if (user && supabase) {
      await supabaseService.deleteTransaction(user.id, id);
      showToast('Transaction deleted from cloud.');
    } else {
      await api.deleteTransaction(id);
    }
    await refreshAllData();
  };

  const handleUploadCSV = async (file: File) => {
    const res = await api.uploadCSV(file);
    if (user && supabase && res.transactions) {
      for (const tx of res.transactions) {
        await supabaseService.addTransaction(user.id, {
          date: tx.date,
          description: tx.description,
          source: tx.source,
          amount: tx.amount,
          type: tx.type,
          category: tx.category,
          paymentMethod: tx.paymentMethod,
          notes: tx.notes,
        });
      }
    }
    await refreshAllData();
    return res;
  };

  const handleUpdateRiskProfile = async (risk: RiskTolerance) => {
    if (user && supabase) {
      await supabaseService.updateProfile(user.id, { riskTolerance: risk });
      showToast(`Switched risk profile to ${risk.toUpperCase()}`);
    } else {
      await api.updateProfile({ riskTolerance: risk });
    }
    await refreshAllData();
  };

  const handleSendMessage = async (
    message: string,
    history: { role: 'user' | 'assistant'; content: string }[]
  ) => {
    return api.chatWithAI(message, history);
  };

  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
      setUser(null);
      showToast('Signed out of cloud account.');
      await refreshAllData();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 transition-colors">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 animate-pulse mb-4 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-emerald-500/20">
          F
        </div>
        <p className="text-sm font-medium">Initializing FinPulse AI & Supabase Telemetry...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
          <div
            className={`px-4 py-3 rounded-xl shadow-xl text-xs font-semibold border backdrop-blur-md flex items-center gap-2 ${
              toastMessage.type === 'error'
                ? 'bg-rose-500/90 text-white border-rose-400'
                : toastMessage.type === 'info'
                ? 'bg-blue-600/90 text-white border-blue-400'
                : 'bg-emerald-600/90 text-white border-emerald-400'
            }`}
          >
            <span>{toastMessage.message}</span>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        consent={consent}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenCSVModal={() => setIsCSVModalOpen(true)}
        onNavigateToConsent={() => setCurrentTab('consent')}
        user={user}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onSignOut={handleSignOut}
      />

      <div className="flex-1 flex max-w-[1720px] w-full mx-auto">
        {/* Navigation */}
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

          {/* Tab Views: Kept mounted in DOM with display toggle */}
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

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(loggedInUser) => {
          setUser(loggedInUser);
          showToast(`Signed in as ${loggedInUser.email}!`);
          refreshAllData();
        }}
        showToast={showToast}
      />
    </div>
  );
}

export default App;
