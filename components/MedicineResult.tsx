
import React, { useState, useEffect } from 'react';
import { MedicineData, PatientProfile, Reminder, CabinetItem, DietPlan } from '../types';
import { generateDietPlan } from '../services/geminiService';

interface MedicineResultProps {
  data: MedicineData;
  profile?: PatientProfile;
  isPremium: boolean;
  isPreviouslyScanned: boolean;
  overdoseWarning?: boolean;
  onOpenPremium: () => void;
  onClose: () => void;
  onAddReminder?: (rem: Reminder) => void;
  onAddToCabinet: (item: CabinetItem) => void;
}

const MedicineResult: React.FC<MedicineResultProps> = ({ 
    data, 
    profile, 
    isPremium, 
    isPreviouslyScanned, 
    overdoseWarning,
    onOpenPremium, 
    onClose,
    onAddReminder,
    onAddToCabinet
}) => {
  const [useEli5, setUseEli5] = useState(false);
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [showCabinetConfirm, setShowCabinetConfirm] = useState(false);
  
  // Diet Plan State
  const [loadingDiet, setLoadingDiet] = useState(false);
  const [dietPlan, setDietPlan] = useState<DietPlan | null>(null);
  const [showDietView, setShowDietView] = useState(false);
  
  const timeline = data?.effectTimeline || { onset: 'N/A', peak: 'N/A', duration: 'N/A' };
  const interaction = data?.interactionAnalysis;
  const medsList = data?.medicationsFound || [];
  const alternatives = data?.alternatives || [];

  useEffect(() => {
    // Attempt to pre-fill expiry if AI extracted it
    if (data.expiryDate) {
        setExpiryDate(data.expiryDate);
    }
  }, [data]);

  const handleDownloadReport = () => {
      if (!isPremium) {
          onOpenPremium();
          return;
      }
      window.print();
  };

  const handleQuickReminder = () => {
    if (onAddReminder) {
      const now = new Date();
      now.setMinutes(0);
      now.setHours(now.getHours() + 1); 
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      onAddReminder({
        id: Date.now().toString(),
        medicineName: data.name,
        dose: data.dosage || '1 unit',
        time: timeStr,
        foodContext: data.foodGuidance.toLowerCase().includes('before') ? 'before_food' : 'after_food',
        repeat: 'daily',
        customDays: [],
        soundType: 'voice',
        voiceTone: 'friendly',
        voiceGender: 'female',
        active: true,
        snoozedUntil: null,
        createdAt: Date.now()
      });
    }
  };

  const handleAddToCabinet = () => {
      if (!expiryDate) {
          alert("Please select an expiry date first.");
          return;
      }
      onAddToCabinet({
          id: crypto.randomUUID(),
          medicineName: data.name,
          expiryDate: expiryDate,
          addedAt: Date.now(),
          isExpired: new Date(expiryDate) < new Date()
      });
      setShowCabinetConfirm(true);
      setTimeout(() => setShowCabinetConfirm(false), 3000);
  };

  const handleGenerateDiet = async () => {
      if (!isPremium) {
          onOpenPremium();
          return;
      }
      setLoadingDiet(true);
      setShowDietView(true);
      try {
          const plan = await generateDietPlan(
              data.name, 
              data.uses, 
              profile || { ageGroup: 'adult', gender: 'male', isPregnant: false, isBreastfeeding: false, language: 'english' }
          );
          setDietPlan(plan);
      } catch (e) {
          alert("Could not generate diet plan. Please try again.");
          setShowDietView(false);
      } finally {
          setLoadingDiet(false);
      }
  };

  const getHeaderColor = () => {
      if (overdoseWarning || data?.riskScore === 'High' || interaction?.severity === 'Dangerous') return 'bg-rose-600';
      if (data?.riskScore === 'Medium' || interaction?.severity === 'Warning') return 'bg-amber-500';
      return 'bg-teal-600';
  };

  if (!data) return null;

  if (showDietView) {
      return (
          <div className="bg-slate-50 min-h-screen pb-32 animate-fade-in relative z-50">
              <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-slate-100">
                  <button onClick={() => setShowDietView(false)} className="flex items-center text-slate-500 font-bold">
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                    Back to Result
                  </button>
                  <h2 className="text-lg font-black text-emerald-600 tracking-tight">AI Dietitian</h2>
              </div>

              {loadingDiet ? (
                  <div className="flex flex-col items-center justify-center h-[70vh]">
                      <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-6 relative">
                          <span className="text-4xl">🥗</span>
                          <div className="absolute inset-0 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin"></div>
                      </div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight animate-pulse">Creating Meal Plan...</h3>
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Checking Interactions & Needs</p>
                  </div>
              ) : dietPlan && (
                  <div className="p-6 space-y-6">
                      <div className="bg-emerald-600 text-white p-8 rounded-[2.5rem] shadow-xl shadow-emerald-600/20 text-center">
                          <h1 className="text-2xl font-black mb-2">{dietPlan.title}</h1>
                          <p className="text-emerald-100 font-medium leading-relaxed text-sm">{dietPlan.overview}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div className="bg-rose-50 p-5 rounded-3xl border border-rose-100">
                              <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-3">🚫 Avoid</h4>
                              <ul className="text-sm font-bold text-slate-700 space-y-1">
                                  {dietPlan.avoidList.slice(0, 4).map((item, i) => <li key={i}>• {item}</li>)}
                              </ul>
                          </div>
                          <div className="bg-emerald-50 p-5 rounded-3xl border border-emerald-100">
                              <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-3">✅ Include</h4>
                              <ul className="text-sm font-bold text-slate-700 space-y-1">
                                  {dietPlan.includeList.slice(0, 4).map((item, i) => <li key={i}>• {item}</li>)}
                              </ul>
                          </div>
                      </div>

                      <div className="space-y-4">
                          {dietPlan.days.map((day, idx) => (
                              <div key={idx} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                                  <div className="flex justify-between items-center mb-4 border-b border-slate-50 pb-3">
                                      <h3 className="font-black text-slate-900 text-lg">{day.day}</h3>
                                      <span className="text-2xl">🍽️</span>
                                  </div>
                                  <div className="space-y-4 text-sm">
                                      <div className="flex items-start">
                                          <span className="w-6 shrink-0 text-slate-400">🌅</span>
                                          <div className="font-bold text-slate-700"><span className="text-[10px] text-slate-400 uppercase font-black block">Morning</span>{day.morning}</div>
                                      </div>
                                      <div className="flex items-start">
                                          <span className="w-6 shrink-0 text-slate-400">🍳</span>
                                          <div className="font-bold text-slate-700"><span className="text-[10px] text-slate-400 uppercase font-black block">Breakfast</span>{day.breakfast}</div>
                                      </div>
                                      <div className="flex items-start">
                                          <span className="w-6 shrink-0 text-slate-400">🍛</span>
                                          <div className="font-bold text-slate-700"><span className="text-[10px] text-slate-400 uppercase font-black block">Lunch</span>{day.lunch}</div>
                                      </div>
                                      <div className="flex items-start">
                                          <span className="w-6 shrink-0 text-slate-400">🥣</span>
                                          <div className="font-bold text-slate-700"><span className="text-[10px] text-slate-400 uppercase font-black block">Dinner</span>{day.dinner}</div>
                                      </div>
                                  </div>
                                  <div className="mt-4 bg-yellow-50 p-3 rounded-xl border border-yellow-100 text-xs font-bold text-yellow-800">
                                      💡 Tip: {day.tip}
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              )}
          </div>
      );
  }

  return (
    <div className="bg-slate-50 min-h-screen pb-32 animate-fade-in relative z-50 print:bg-white print:p-0 print:m-0">
        <style dangerouslySetInnerHTML={{ __html: `
            @media print {
                nav, footer, button, .PremiumLock, header button, .print-hide { display: none !important; }
                .print-only { display: block !important; }
                body { background: white !important; }
                .bg-slate-50 { background: white !important; }
                .rounded-[2rem], .rounded-[3rem], .rounded-b-[3rem] { border-radius: 0 !important; }
                .shadow-2xl, .shadow-sm { box-shadow: none !important; border: 1px solid #eee !important; }
                header { background: #0d9488 !important; color: white !important; padding: 40px !important; margin-bottom: 20px !important; }
            }
        `}} />

        <div className="hidden print:block print-only text-center py-6 border-b-2 border-slate-900 mb-8">
            <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Medical Safety Report</h1>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Generated by MediIQ AI Assistance</p>
        </div>

        <header className={`${getHeaderColor()} text-white rounded-b-[3rem] shadow-2xl relative overflow-hidden pb-12 print:rounded-none`}>
            <div className="p-6 pt-8 relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <div className="bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
                        <span className="text-[10px] font-bold tracking-widest uppercase">Risk: {data?.riskScore}</span>
                    </div>
                    <button onClick={onClose} className="bg-white/10 p-2.5 rounded-full border border-white/10 print-hide">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <h2 className="text-3xl font-extrabold mb-2 tracking-tight">{data.name}</h2>
                <div className="flex flex-wrap gap-2 mb-4">
                    {medsList.map((m, i) => (
                        <span key={i} className="text-[9px] font-black uppercase bg-white/10 px-2 py-1 rounded-md">{m}</span>
                    ))}
                </div>
                <div className="text-white/90 text-sm font-medium leading-relaxed">{data.description}</div>
            </div>
        </header>

        <div className="px-5 pt-12 space-y-6">
            
            {/* Expiry Tracker Section */}
            <section className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 print-hide">
                <div className="flex items-center justify-between mb-4">
                     <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Expiry Tracker</h3>
                     <span className="text-[8px] bg-indigo-50 text-indigo-500 px-2 py-1 rounded-md font-black uppercase">Virtual Cabinet</span>
                </div>
                <div className="flex items-end space-x-3">
                    <div className="flex-1 space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Set Expiry Date</label>
                        <input 
                            type="date" 
                            value={expiryDate} 
                            onChange={(e) => setExpiryDate(e.target.value)} 
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-teal-500 outline-none"
                        />
                    </div>
                    <button 
                        onClick={handleAddToCabinet}
                        disabled={showCabinetConfirm}
                        className={`px-5 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95 ${showCabinetConfirm ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                    >
                        {showCabinetConfirm ? 'Added ✓' : 'Track'}
                    </button>
                </div>
            </section>

            <section className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">AI Summary</h3>
                    <button onClick={() => setUseEli5(!useEli5)} className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-slate-50 text-slate-500 border border-slate-200 print-hide">
                        {useEli5 ? 'Deep' : 'Simple'}
                    </button>
                </div>
                <p className="text-slate-800 text-lg font-medium leading-relaxed">
                    "{useEli5 ? data?.childFriendlyExplanation : data?.simpleExplanation}"
                </p>
            </section>

             <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                <h3 className="text-xs font-bold text-slate-400 uppercase mb-8 tracking-widest">Effect Timeline</h3>
                <div className="flex justify-between items-start px-2">
                    {[
                        { label: "Starts", val: timeline.onset, emoji: "⏱️" },
                        { label: "Peak", val: timeline.peak, emoji: "📈" },
                        { label: "Lasts", val: timeline.duration, emoji: "⌛" }
                    ].map((item, i) => (
                        <div key={i} className="flex flex-col items-center">
                            <div className="w-9 h-9 bg-teal-50 rounded-2xl flex items-center justify-center mb-3">
                                 <span className="text-[14px]">{item.emoji}</span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-black uppercase mb-1">{item.label}</p>
                            <p className="text-xs font-black text-slate-900">{item.val}</p>
                        </div>
                    ))}
                </div>
             </div>

             <section className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 tracking-widest">Risks & Avoidance</h3>
                <div className="space-y-4">
                    <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100/50">
                        <span className="text-[9px] font-black text-rose-500 uppercase block mb-1">Key Warning</span>
                        <p className="text-xs font-bold text-slate-700 leading-relaxed">{data.warnings}</p>
                    </div>
                </div>
             </section>

             {alternatives.length > 0 && (
                <section className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 animate-fade-in">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Potential Alternatives</h3>
                        <span className="text-[8px] font-black bg-blue-50 text-blue-500 px-2 py-0.5 rounded-md uppercase">Medical Reference</span>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                        {alternatives.map((alt, i) => (
                            <div key={i} className="bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl flex items-center space-x-2">
                                <span className="text-blue-400 text-xs">💊</span>
                                <span className="text-xs font-black text-slate-700">{alt}</span>
                            </div>
                        ))}
                    </div>
                    <p className="mt-4 text-[9px] text-slate-400 font-bold leading-relaxed italic border-t border-slate-50 pt-3">
                        * Note: These are common substitutes. Never switch medications without consulting your prescribing doctor.
                    </p>
                </section>
             )}

            <div className="space-y-3 pt-2 print-hide">
                {/* DIET PLAN BUTTON */}
                <button onClick={handleGenerateDiet} className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-200 flex items-center justify-center border border-white/20 active:scale-95 transition-transform relative overflow-hidden group">
                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                    <span className="mr-2 text-base">🥗</span> 
                    {isPremium ? 'Get 7-Day Diet Plan' : 'Get Diet Plan (Premium 👑)'}
                </button>

                <button onClick={handleQuickReminder} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg flex items-center justify-center">
                    Set Daily Alarm 🔔
                </button>
                <button onClick={handleDownloadReport} className="w-full bg-white text-slate-800 py-4 rounded-2xl font-black text-xs uppercase tracking-widest border border-slate-200 shadow-sm flex items-center justify-center">
                    {isPremium ? 'Download Report PDF 📄' : 'Unlock Report PDF 👑'}
                </button>
                <button onClick={onClose} className="w-full text-slate-400 py-3 font-bold text-[10px] uppercase tracking-widest hover:text-slate-600">
                    Close Result
                </button>
            </div>
            
            <div className="hidden print:block text-center pt-10 border-t border-slate-100 text-[9px] text-slate-400 uppercase font-bold">
              Disclaimer: This report is generated by MediIQ AI. Always verify medical decisions with a qualified healthcare professional.
            </div>
        </div>
    </div>
  );
};

export default MedicineResult;
