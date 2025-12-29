
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { getDoctorAIResponse } from '../services/geminiService';

const DoctorAI: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('mediScan_chat_history');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to load chat history", e);
    }
    return [
      {
        id: 'welcome',
        role: 'assistant' as const,
        content: 'Hello! I am your MedScan Doctor AI. How can I help you today? Please remember, I am an AI, not a human doctor.',
        timestamp: Date.now()
      }
    ];
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('mediScan_chat_history', JSON.stringify(messages));
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;

    // Use 'as const' to ensure the role property is correctly typed as a literal
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: text,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const responseText = await getDoctorAIResponse([...messages, userMsg]);

      // Use 'as const' to fix the role assignment error and ensure Date.now() is used
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: responseText,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error("Chat error", error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    if (confirm("Clear all chat history?")) {
      const welcome: ChatMessage = {
        id: 'welcome',
        role: 'assistant' as const,
        content: 'Hello! I am your MedScan Doctor AI. How can I help you today? Please remember, I am an AI, not a human doctor.',
        timestamp: Date.now()
      };
      setMessages([welcome]);
      localStorage.removeItem('mediScan_chat_history');
    }
  };

  const quickPrompts = [
    "I have a mild fever",
    "Should I take Advil for headache?",
    "Healthy breakfast tips",
    "How to treat a burn?"
  ];

  return (
    <div className="flex flex-col h-screen max-w-lg mx-auto bg-slate-50 relative overflow-hidden">
      {/* Header - Fixed & Solid */}
      <header className="p-6 pt-10 bg-white border-b border-slate-100 shrink-0 relative z-[60] shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
             <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-indigo-100">
               👨‍⚕️
             </div>
             <div>
               <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1">Doctor AI</h2>
               <div className="flex items-center">
                 <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse mr-2"></div>
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Always Online</span>
               </div>
             </div>
          </div>
          {messages.length > 1 && (
            <button 
              onClick={clearChat}
              className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-rose-500 hover:bg-rose-50 transition-all active:scale-90"
              title="Clear Chat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          )}
        </div>
      </header>

      {/* Messages - Scrollable */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-60 no-scrollbar bg-slate-50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
            <div className={`max-w-[85%] p-5 rounded-[2rem] shadow-sm text-sm leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-br-none shadow-indigo-100' 
                : 'bg-white text-slate-800 rounded-bl-none border border-slate-100'
            }`}>
              {msg.content.split('\n').map((line, i) => (
                <p key={i} className={i > 0 ? 'mt-2' : ''}>{line}</p>
              ))}
              <div className="flex items-center justify-between mt-3">
                  <p className={`text-[8px] font-bold uppercase tracking-widest ${msg.role === 'user' ? 'text-indigo-200' : 'text-slate-300'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {msg.role === 'assistant' && <span className="text-[10px] opacity-20">🏥</span>}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-white p-5 rounded-[2rem] rounded-bl-none border border-slate-100 shadow-sm flex items-center space-x-1.5">
               <div className="w-2 h-2 bg-indigo-200 rounded-full animate-bounce"></div>
               <div className="w-2 h-2 bg-indigo-300 rounded-full animate-bounce delay-75"></div>
               <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-150"></div>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input Area - Fixed, Solid, and Full Coverage */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-[70] bg-slate-50 border-t border-slate-100 px-6 pt-6 pb-28">
        {messages.length < 3 && !isLoading && (
           <div className="flex overflow-x-auto no-scrollbar space-x-2 mb-4">
             {quickPrompts.map(p => (
               <button key={p} onClick={() => handleSend(p)} className="shrink-0 bg-white border border-slate-200 text-slate-500 px-5 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-all active:scale-95 shadow-sm">
                 {p}
               </button>
             ))}
           </div>
        )}

        <div className="bg-white rounded-[2.5rem] p-2 shadow-[0_-10px_40px_rgba(15,23,42,0.05)] border border-slate-100 flex items-center">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend(input)}
            placeholder="Describe your symptoms..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-slate-800 text-sm font-bold px-6 placeholder-slate-300"
          />
          <button 
            onClick={() => handleSend(input)}
            disabled={!input.trim() || isLoading}
            className={`w-14 h-14 rounded-3xl flex items-center justify-center transition-all ${input.trim() ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200' : 'bg-slate-100 text-slate-300'}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
          </button>
        </div>
        <p className="text-center text-[7px] font-black text-slate-300 uppercase tracking-[0.3em] mt-6 leading-relaxed">Medical Disclaimer: AI is not a substitute for professional diagnosis.</p>
      </div>
    </div>
  );
};

export default DoctorAI;
