
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, ScanHistoryItem } from '../types.ts';
import { getDoctorAIResponse } from '../services/geminiService.ts';

interface DoctorAIProps {
  isPremium: boolean;
  onOpenPremium: () => void;
  userId: string;
}

// Type definition for Web Speech API
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

const DoctorAI: React.FC<DoctorAIProps> = ({ isPremium, onOpenPremium, userId }) => {
  // Helper to get scoped keys
  const getChatKey = () => userId === 'guest' ? 'mediIQ_chat_history' : `mediIQ_${userId}_chat_history`;
  const getUsageKey = () => userId === 'guest' ? 'mediIQ_daily_chat_usage' : `mediIQ_${userId}_daily_chat_usage`;
  
  // Helper to get history key (logic matched with App.tsx)
  const getHistoryKey = () => userId === 'guest' ? 'mediScan_history' : `mediScan_${userId}_history`;

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(getChatKey());
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to load chat history", e);
    }
    return [
      {
        id: 'welcome',
        role: 'assistant' as const,
        content: 'Hello! I am your MediIQ Doctor AI. I can access your scan history to give you better advice. How can I help you today?',
        timestamp: Date.now()
      }
    ];
  });

  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const [usage, setUsage] = useState(() => {
    const today = new Date().toISOString().split('T')[0];
    const saved = localStorage.getItem(getUsageKey());
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.date === today) return parsed.count;
    }
    return 0;
  });

  // Load Scan History for RAG
  useEffect(() => {
      try {
          const savedHistory = localStorage.getItem(getHistoryKey());
          if (savedHistory) {
              const parsed = JSON.parse(savedHistory);
              // Sort by date desc
              setScanHistory(parsed.sort((a: any, b: any) => b.timestamp - a.timestamp));
          }
      } catch (e) {
          console.error("Failed to load scan history for Doctor AI", e);
      }
  }, [userId]);

  // Reload history when User ID changes (e.g. login/logout)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(getChatKey());
      if (saved) {
        setMessages(JSON.parse(saved));
      } else {
        // Reset to welcome if no history found for this user
        setMessages([{
          id: 'welcome',
          role: 'assistant' as const,
          content: 'Hello! I am your MediIQ Doctor AI. I can access your scan history to give you better advice. How can I help you today?',
          timestamp: Date.now()
        }]);
      }
      
      const today = new Date().toISOString().split('T')[0];
      const savedUsage = localStorage.getItem(getUsageKey());
      if (savedUsage) {
          const parsed = JSON.parse(savedUsage);
          setUsage(parsed.date === today ? parsed.count : 0);
      } else {
          setUsage(0);
      }
    } catch(e) { console.error(e); }
  }, [userId]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const MAX_FREE_MESSAGES = 10;
  const isLimitReached = !isPremium && usage >= MAX_FREE_MESSAGES;

  useEffect(() => {
    localStorage.setItem(getChatKey(), JSON.stringify(messages));
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, userId]);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(getUsageKey(), JSON.stringify({ date: today, count: usage }));
  }, [usage, userId]);

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleVoiceInput = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser. Please use Chrome or Safari.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = 'en-US'; // Could map to profile.language later
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    
    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        setInput(prev => {
          const trimmed = prev.trim();
          return trimmed ? `${trimmed} ${transcript}` : transcript;
        });
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch (e) {
      console.error("Failed to start recognition", e);
    }
  };

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading || isLimitReached) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: text,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    if (!isPremium) setUsage(prev => prev + 1);

    try {
      // PASSING SCAN HISTORY HERE FOR RAG
      const responseText = await getDoctorAIResponse([...messages, userMsg], scanHistory);
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
        content: 'Hello! I am your MediIQ Doctor AI. I can access your scan history to give you better advice. How can I help you today?',
        timestamp: Date.now()
      };
      setMessages([welcome]);
      localStorage.removeItem(getChatKey());
    }
  };

  const quickPrompts = [
    "Check my history for conflicts",
    "Should I take Advil for headache?",
    "Healthy breakfast tips",
    "How to treat a burn?"
  ];

  return (
    <div className="flex flex-col h-screen max-w-lg mx-auto bg-slate-50 relative overflow-hidden">
      <header className="p-6 pt-10 bg-white border-b border-slate-100 shrink-0 relative z-[60] shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
             <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-indigo-100 relative">
               👨‍⚕️
               {scanHistory.length > 0 && (
                   <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-teal-500 rounded-full border-2 border-white animate-pulse" title="Connected to Scan History"></span>
               )}
             </div>
             <div>
               <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1">Doctor AI</h2>
               <div className="flex items-center space-x-2">
                 {scanHistory.length > 0 ? (
                     <span className="text-[9px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md uppercase tracking-widest">History Connected</span>
                 ) : (
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">No History</span>
                 )}
               </div>
               
               {!isPremium && (
                 <div className="flex items-center space-x-2 mt-1">
                    <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500" style={{ width: `${(usage/MAX_FREE_MESSAGES)*100}%` }}></div>
                    </div>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{MAX_FREE_MESSAGES - usage} Left</span>
                 </div>
               )}
               {isPremium && (
                 <div className="flex items-center mt-1">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse mr-1"></div>
                    <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest">Premium Active</span>
                 </div>
               )}
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

      <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-64 no-scrollbar bg-slate-50">
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

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-[70] bg-slate-50 border-t border-slate-100 px-6 pt-6 pb-28">
        {isLimitReached ? (
            <div className="bg-white rounded-[2.5rem] p-6 shadow-xl border-2 border-indigo-100 text-center animate-slide-up">
                <div className="text-2xl mb-2">🛑</div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Daily Limit Reached</h3>
                <p className="text-[10px] text-slate-500 font-bold mb-4 uppercase tracking-widest">Upgrade to Premium for unlimited AI Consultation</p>
                <button 
                    onClick={onOpenPremium}
                    className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-200 active:scale-95 transition-all"
                >
                    Unlock Unlimited Forever 👑
                </button>
            </div>
        ) : (
            <>
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
                    
                    {/* Voice Input Button */}
                    <button
                      onClick={handleVoiceInput}
                      className={`w-10 h-10 rounded-2xl mr-2 flex items-center justify-center transition-all ${isListening ? 'bg-rose-500 text-white animate-pulse' : 'text-slate-400 hover:text-indigo-500 bg-slate-50'}`}
                      title={isListening ? "Stop listening" : "Speak"}
                    >
                      {isListening ? (
                        <div className="w-3 h-3 bg-white rounded-sm animate-bounce"></div>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                      )}
                    </button>

                    <button 
                        onClick={() => handleSend(input)}
                        disabled={!input.trim() || isLoading}
                        className={`w-14 h-14 rounded-3xl flex items-center justify-center transition-all ${input.trim() ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200' : 'bg-slate-100 text-slate-300'}`}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                    </button>
                </div>
            </>
        )}
        <p className="text-center text-[7px] font-black text-slate-300 uppercase tracking-[0.3em] mt-6 leading-relaxed px-4">AI Doctor can make mistakes. For serious conditions, see a human doctor immediately.</p>
      </div>
    </div>
  );
};

export default DoctorAI;
