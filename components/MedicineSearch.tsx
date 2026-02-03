
import React, { useState } from 'react';
import { analyzeTextQuery } from '../services/geminiService';
import { PatientProfile, AgeGroup, Gender, Language } from '../types';

interface MedicineSearchProps {
  onBack: () => void;
}

const MedicineSearch: React.FC<MedicineSearchProps> = ({ onBack }) => {
  const [med1, setMed1] = useState('');
  const [med2, setMed2] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  // Default profile for search context (could be passed as prop in future)
  const defaultProfile: PatientProfile = {
      ageGroup: 'adult',
      gender: 'male',
      isPregnant: false,
      isBreastfeeding: false,
      language: 'english'
  };

  const handleSearch = async () => {
      if (!med1) return;
      
      const query = med2 ? `Compare ${med1} and ${med2}` : `Tell me about ${med1}`;
      
      setLoading(true);
      setResult(null);
      
      try {
          const response = await analyzeTextQuery(query, defaultProfile);
          setResult(response);
      } catch (e: any) {
          alert("Search failed: " + e.message);
      } finally {
          setLoading(false);
      }
  };

  const renderMarkdown = (text: string) => {
      return text.split('\n').map((line, i) => {
          if (line.startsWith('###')) return <h3 key={i} className="text-lg font-black text-slate-800 mt-4 mb-2">{line.replace('###', '').trim()}</h3>;
          if (line.startsWith('**')) return <strong key={i} className="text-slate-900">{line.replace(/\*\*/g, '')}</strong>;
          if (line.startsWith('-')) return <li key={i} className="ml-4 text-slate-700 mb-1">{line.replace('-', '').trim()}</li>;
          return <p key={i} className="text-slate-600 mb-2 leading-relaxed">{line}</p>;
      });
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 animate-fade-in relative z-50">
        <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-slate-100">
             <button onClick={onBack} className="flex items-center text-slate-500 font-bold">
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                Home
             </button>
             <h2 className="text-lg font-black text-blue-600 tracking-tight">Search & Compare</h2>
        </div>

        <div className="p-6 space-y-6">
            <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-blue-50">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-3xl mb-6 mx-auto shadow-inner">
                    💊
                </div>
                
                <h3 className="text-center font-black text-slate-900 text-xl mb-6">Enter Medicine Names</h3>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Medicine 1 (Required)</label>
                        <input 
                            type="text" 
                            value={med1}
                            onChange={(e) => setMed1(e.target.value)}
                            placeholder="e.g. Paracetamol"
                            className="w-full bg-slate-50 p-4 rounded-xl border border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>

                    <div className="relative flex py-2 items-center justify-center">
                        <div className="h-px bg-slate-100 w-full"></div>
                        <span className="px-3 text-[10px] text-slate-400 font-bold uppercase tracking-widest bg-white">VS (Optional)</span>
                        <div className="h-px bg-slate-100 w-full"></div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Medicine 2 (Compare)</label>
                        <input 
                            type="text" 
                            value={med2}
                            onChange={(e) => setMed2(e.target.value)}
                            placeholder="e.g. Ibuprofen"
                            className="w-full bg-slate-50 p-4 rounded-xl border border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>

                    <button 
                        onClick={handleSearch}
                        disabled={loading || !med1}
                        className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg transition-all flex items-center justify-center space-x-2 mt-4 ${loading || !med1 ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:scale-[1.02] active:scale-95 shadow-blue-500/30'}`}
                    >
                        {loading ? 'Analyzing...' : med2 ? 'Compare Medicines' : 'Get Info'}
                    </button>
                </div>
            </div>

            {result && (
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 animate-slide-up">
                    <div className="prose prose-sm max-w-none text-slate-600">
                        {renderMarkdown(result)}
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default MedicineSearch;
