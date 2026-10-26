import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  ShieldAlert,
  RotateCcw,
} from 'lucide-react';
import { ChatMessage, UserConsent } from '../types';
import { FormattedMessage } from '../components/FormattedMessage';

interface AIChatProps {
  consent: UserConsent | null;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  onResetChat: () => void;
  onSendMessage: (
    message: string,
    history: { role: 'user' | 'assistant'; content: string }[]
  ) => Promise<{ reply: string; consentFiltered: boolean }>;
  onNavigateToConsent: () => void;
}

const SUGGESTIONS = [
  'Where can I cut ₹5,000 from my monthly expenses?',
  'What is the best Nifty 50 & PPF allocation for my risk level?',
  'Is my emergency fund sufficient for 6 months?',
  'Explain the 50/30/20 rule for my salary.',
  'How should I invest a ₹15,000 monthly surplus?',
];

export const AIChat: React.FC<AIChatProps> = ({
  consent,
  messages,
  setMessages,
  onResetChat,
  onSendMessage,
  onNavigateToConsent,
}) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isAIActive = consent?.aiAdvisoryConsent;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

      const { reply, consentFiltered } = await onSendMessage(text.trim(), history);

      const assistantMsg: ChatMessage = {
        id: 'reply-' + Date.now(),
        role: 'assistant',
        content: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        consentFiltered,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          role: 'assistant',
          content: '⚠️ An error occurred while generating your financial advice. Please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    onResetChat();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-130px)] lg:h-[calc(100vh-95px)] bg-gradient-to-b from-teal-50/40 via-emerald-50/20 to-white dark:bg-none dark:bg-[#111827] border border-teal-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm transition-colors">
      {/* Chat Header: Light Minimalist Colorful Style */}
      <div className="p-4 border-b border-teal-200/80 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-50/90 via-teal-50/60 to-white dark:bg-none dark:bg-[#111827]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">FinPulse AI Copilot</h2>
              <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300/80 dark:border-emerald-500/20">
                Online
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Personalized Financial Advisory & Indian Wealth Intelligence
            </p>
          </div>
        </div>

        <button
          onClick={handleClear}
          className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-teal-50 dark:hover:bg-slate-800 transition"
          title="Clear Conversation"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Consent Notice if AI Advisory is off */}
      {!isAIActive && (
        <div className="p-3 bg-amber-50 dark:bg-amber-500/10 border-b border-amber-200 dark:border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              <strong>AI Advisory Consent is OFF:</strong> Queries will receive generalized guidance without personalized financial figures.
            </span>
          </div>
          <button
            onClick={onNavigateToConsent}
            className="text-amber-700 dark:text-amber-400 hover:underline font-semibold shrink-0"
          >
            Enable Consent
          </button>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                  isUser
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                    : 'bg-emerald-50 dark:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-sm leading-relaxed ${
                  isUser
                    ? 'bg-emerald-600 text-white rounded-tr-none shadow-sm whitespace-pre-wrap'
                    : 'bg-white/95 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 border border-teal-200/80 dark:border-slate-700/80 rounded-tl-none shadow-xs'
                }`}
              >
                {isUser ? (
                  <div className="text-sm">{m.content}</div>
                ) : (
                  <FormattedMessage content={m.content} />
                )}
                <div
                  className={`text-xs mt-2 flex items-center gap-1.5 ${
                    isUser ? 'text-emerald-100 justify-end' : 'text-slate-400'
                  }`}
                >
                  <span>{m.timestamp}</span>
                  {m.consentFiltered && (
                    <span className="text-amber-600 dark:text-amber-400 font-semibold">
                      • Consent filtered
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white/95 dark:bg-slate-800/80 border border-teal-200/80 dark:border-slate-700/80 rounded-2xl rounded-tl-none p-3.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2 shadow-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-teal-500 animate-bounce delay-100" />
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce delay-200" />
              <span className="ml-1 text-slate-600 dark:text-slate-400">Analyzing financial telemetry...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompt Pills */}
      <div className="p-3 bg-teal-50/50 dark:bg-slate-900 border-t border-teal-200/80 dark:border-slate-800 overflow-x-auto flex gap-2 no-scrollbar">
        {SUGGESTIONS.map((s, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(s)}
            className="px-3.5 py-1.5 rounded-full bg-white/95 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-slate-700 text-teal-900 dark:text-slate-300 text-xs sm:text-sm whitespace-nowrap border border-teal-200/80 dark:border-slate-700 transition font-medium shadow-xs"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="p-4 border-t border-teal-200/80 dark:border-slate-800 bg-white/95 dark:bg-[#111827]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Ask FinPulse AI (e.g. 'Can I afford a ₹50,000 vacation?')..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="flex-1 bg-teal-50/30 dark:bg-slate-800 border border-teal-200/80 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="w-10 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm transition disabled:opacity-50 active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
