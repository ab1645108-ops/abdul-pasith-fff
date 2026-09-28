import React, { useState, useRef, useEffect } from 'react';
import { MissingPerson } from '../types';
import { 
  MessageSquareText, Send, Sparkles, ShieldAlert, BookOpen, 
  HelpCircle, RefreshCw, CheckCircle2, User 
} from 'lucide-react';

interface AssistantChatProps {
  missingPersons: MissingPerson[];
  activePerson?: MissingPerson;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export const AssistantChat: React.FC<AssistantChatProps> = ({
  missingPersons,
  activePerson,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: `Welcome to the FindSafe Search & Rescue (SAR) Incident Guidance Terminal. I am your specialized AI Assistant for missing person investigations, lost person behavioral analysis, first-48-hours checklists, and field volunteer safety protocols.\n\nHow can I support your search operations or family inquiries today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const currentCase = missingPersons.find((p) => p.id === selectedCaseId);

  const quickQuestions = [
    'Critical First 48 Hours: What immediate steps must family take?',
    'How do we safely approach an elderly person with Alzheimer’s who is wandering?',
    'How should searchers preserve scent articles for K9 tracking units?',
    'What are the primary attraction points for non-verbal children with autism?'
  ];

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/assistance-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          conversationHistory: messages.slice(-6),
          currentPersonContext: currentCase || null,
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');
      const data = await response.json();

      const modelMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: data.reply || 'Standing by for SAR command instructions.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, modelMsg]);
    } catch (err) {
      console.error('Chat error:', err);
      const fallbackMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: `Search & Rescue Operational Directive:\n\n1. Immediately verify that Law Enforcement has entered the individual into NCIC (National Crime Information Center).\n2. Protect the home/bedroom from contamination so K9 units have clean scent items (unwashed pillowcase or bedding stored in a clean zip bag).\n3. Check all nearby water retention basins, construction zones, and parked unlocked vehicles.\n4. Ensure an accurate recent photo with clothing description is distributed via FindSafe Broadcast Studio.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                SAR PROTOCOL CONSULTANT
              </span>
              <span className="text-xs text-slate-400 font-mono">Expert Crisis & Incident Command AI</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              SAR Field & Emergency Guidance Assistant
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              24/7 tactical guidance for search volunteers, case coordinators, and family members. Get ISRID search best practices, de-escalation methods, scent preservation, and legal tracking workflows.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 whitespace-nowrap">Case Context:</span>
            <select
              value={selectedCaseId}
              onChange={(e) => setSelectedCaseId(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:border-rose-500 cursor-default"
            >
              <option value="">General Missing Persons Protocols</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Chat & Directory Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chat Terminal (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-[580px] shadow-sm overflow-hidden">
          {/* Active Context Bar */}
          <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                {currentCase ? `Active Context: ${currentCase.name} (Case #${currentCase.caseNumber})` : 'General Search Operations Mode'}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">Gemini 3.8 Flash Active</span>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'model' && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center shrink-0 text-white shadow-sm">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-rose-600 text-white rounded-br-none'
                      : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-none whitespace-pre-line shadow-sm'
                  }`}
                >
                  <p>{msg.text}</p>
                  <span
                    className={`block text-[10px] font-mono mt-1.5 ${
                      msg.role === 'user' ? 'text-rose-200 text-right' : 'text-slate-500'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 text-slate-300">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 items-center text-xs text-slate-400">
                <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center">
                  <RefreshCw className="w-4 h-4 animate-spin text-rose-400" />
                </div>
                <span>Formulating SAR tactical guidance...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="p-3 bg-slate-950/60 border-t border-slate-800/80 overflow-x-auto flex gap-2">
            {quickQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSend(q)}
                className="whitespace-nowrap px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs transition shrink-0"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
            <input
              id="input-assistant-chat"
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask a question about search procedures, legal tools, or de-escalation..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
            <button
              id="btn-send-assistant-chat"
              onClick={() => handleSend()}
              disabled={isLoading || !inputText.trim()}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-rose-950/40 transition disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </div>
        </div>

        {/* Critical Checklists & Operational Protocol (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* First 48 Hours Golden Rules */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 text-xs">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>First 48-Hour Protocol</span>
            </h3>

            <ul className="space-y-2 text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Demand NCIC Entry:</strong> Ask law enforcement to immediately enter your loved one into the National Crime Information Center.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Preserve Scent:</strong> Do not wash bedding or recent shirts. Seal an article of clothing in a clean plastic bag for bloodhounds.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Check Immediate Hazards:</strong> Search backyard sheds, swimming pools, creeks, under beds, and closets first.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Phone & Cloud Tracking:</strong> Request carrier emergency ping (exigent circumstances exception).</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
