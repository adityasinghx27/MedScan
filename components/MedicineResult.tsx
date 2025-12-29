import React, { useState, useEffect } from 'react';
import { MedicineData, PatientProfile } from '../types';
import { checkConditionSafety } from '../services/geminiService';

interface MedicineResultProps {
  data: MedicineData;
  profile?: PatientProfile;
  isPremium: boolean;
  isPreviouslyScanned: boolean;
  overdoseWarning?: boolean;
  onOpenPremium: () => void;
  onClose: () => void;
}

const MedicineResult: React.FC<MedicineResultProps> = ({ 
    data, 
    profile, 
    isPremium, 
    isPreviouslyScanned, 
    overdoseWarning,
    onOpenPremium, 
    onClose 
}) => {
  const [speaking, setSpeaking] = useState(false);
  const [showCriticalModal, setShowCriticalModal] = useState(false);
  const [useEli5, setUseEli5] = useState(false);
  const [expandedDesc, setExpandedDesc] = useState(false);
  
  // Safety Defaults
  const questions = data?.commonQuestions || [];
  const timeline = data?.effectTimeline || { onset: 'N/A', peak: 'N/A', duration: 'N/A' };
  const lifestyle = data?.lifestyleWarnings || { alcohol: false, driving: false, sleep: false };
  const interaction = data?.interactionAnalysis;
  const medsList = data?.medicationsFound || [];

  useEffect(() => {
    if (data?.riskScore === 'High' || data?.criticalWarning || overdoseWarning || interaction?.severity === 'Dangerous') {
        setShowCriticalModal(true);
    }
    return () => { window.speechSynthesis.cancel(); }
  }, [data, overdoseWarning, interaction]);

  const speakText = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = profile?.language === 'hindi' ? 'hi-IN' : 'en-US';
    utterance.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  };

  const toggleSpeech = () => {
    if (speaking) {
        window.speechSynthesis.cancel();
        setSpeaking(false);
    } else {
        const textToRead = `${data?.name}. ${useEli5 ? data?.childFriendlyExplanation : data?.simpleExplanation}. ${data?.keyWarning || ''} ${interaction ? 'Interaction Check: ' + interaction.summary : ''}`;
        speakText(textToRead);
    }
  };

  const readWarningAloud = () => {
    const textToRead = overdoseWarning 
        ? "Attention! Potential Overdose detected. A recent scan of this medicine was found. Double-dosing can be very dangerous."
        : `Warning. ${data?.criticalWarning || 'High Risk Alert'}. ${interaction ? interaction.summary : ''} ${data?.riskReason || ''}`;
    speakText(textToRead);
  };

  const handleDownloadReport = () => {
      if (!isPremium) {
          onOpenPremium();
          return;
      }
      window.print();
  };

  const getHeaderColor = () => {
      if (overdoseWarning || data?.riskScore === 'High' || interaction?.severity === 'Dangerous') return 'bg-rose-600';
      if (data?.riskScore === 'Medium' || interaction?.severity === 'Warning') return 'bg-amber-500';
      return 'bg-teal-600';
  };

  if (!data) return null;

  const PremiumLock = ({ title }: { title: string }) => (
    <div className="absolute inset-0 bg-white/40 backdrop-blur-[3px] flex flex-col items-center justify-center p-6 text-center z-10 rounded-[2rem]">
        <div className="w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center mb-4 border border-slate-100">
            <span className="text-xl">👑</span>
        </div>
        <h4 className="text-slate-900 font-black text-[11px] uppercase tracking-tighter mb-1">{title} is Premium</h4>
        <button 
            onClick={onOpenPremium}
            className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all"
        >
            Unlock Forever ₹99
        </button>
    </div>
  );

  return (
    <div className="bg-slate-50 min-h-screen pb-32 animate-fade-in relative z-50">
        
        {/* CRITICAL WARNING MODAL */}
        {showCriticalModal && (
            <div className="fixed inset-0 z-[60] bg-slate-900/95 flex items-center justify-center p-6 backdrop-blur-md animate-fade-in">
                <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl w-full max-sm text-center border-t-4 border-rose-500 relative">
                     <button 
                        onClick={readWarningAloud}
                        className="absolute top-6 right-6 w-10 h-10 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 hover:bg-rose-100 transition-colors active:scale-90"
                     >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                     </button>

                     <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                         <span className="text-4xl">⚠️</span>
                     </div>
                     <h2 className="text-2xl font-extrabold text-rose-600 mb-2 leading-tight">
                        {overdoseWarning ? 'Overdose Risk' : interaction?.severity === 'Dangerous' ? 'Dangerous Combo' : 'High Risk Alert'}
                     </h2>
                     <p className="text-slate-600 font-medium mb-6 leading-relaxed">
                         {interaction?.severity === 'Dangerous' 
                            ? interaction.summary 
                            : overdoseWarning 
                                ? "Double-dosing within 4 hours is dangerous."
                                : (data?.criticalWarning || "This medicine carries specific risks.")}
                     </p>
                     <div className="space-y-3">
                        <button onClick={() => { setShowCriticalModal(false); window.speechSynthesis.cancel(); }} className="w-full bg-rose-600 text-white py-4 rounded-2xl font-black shadow-lg uppercase tracking-widest text-xs">
                            I Understand
                        </button>
                     </div>
                </div>
            </div>
        )}

        <header className={`${getHeaderColor()} text-white rounded-b-[3rem] shadow-2xl relative overflow-hidden pb-12`}>
            <div className="p-6 pt-8 relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <div className="flex flex-wrap gap-2">
                         <div className="bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
                            <span className="text-[10px] font-bold tracking-widest uppercase">Risk: {data?.riskScore || 'Unknown'}</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="bg-white/10 p-2.5 rounded-full border border-white/10">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                
                <h2 className="text-3xl font-extrabold mb-2 tracking-tight">{medsList.length > 1 ? "Medicine Stack" : (data?.name || 'Unknown')}</h2>
                <div className="flex flex-wrap gap-2 mb-4">
                    {medsList.map((m, i) => (
                        <span key={i} className="text-[9px] font-black uppercase bg-white/10 px-2 py-1 rounded-md border border-white/5">{m}</span>
                    ))}
                </div>
                
                <div className={`text-white/90 text-sm font-medium leading-relaxed ${expandedDesc ? '' : 'line-clamp-2'}`} onClick={() => setExpandedDesc(!expandedDesc)}>
                    {data?.description || 'No description available.'}
                </div>
                
                {data?.keyWarning && (
                    <div className="mt-6 bg-black/20 backdrop-blur-md p-4 rounded-2xl border-l-4 border-yellow-400">
                        <p className="text-sm font-bold text-white">⚠️ {data.keyWarning}</p>
                    </div>
                )}
            </div>

            <button onClick={toggleSpeech} className="absolute -bottom-7 right-8 w-16 h-16 bg-yellow-400 rounded-full shadow-lg flex items-center justify-center text-slate-900 active:scale-95 transition-transform z-20 border-4 border-white">
                {speaking ? <div className="flex space-x-1"><div className="w-1.5 h-6 bg-slate-900 animate-pulse"></div><div className="w-1.5 h-6 bg-slate-900 animate-pulse delay-75"></div></div> : <svg className="w-7 h-7 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>}
            </button>
        </header>

        <div className="px-5 pt-12 space-y-6">

            {/* COMBINATION SAFETY SECTION - PREMIUM */}
            {interaction && (
                <section className={`relative p-6 rounded-[2rem] border-2 shadow-sm min-h-[160px] ${
                    interaction.severity === 'Safe' ? 'bg-emerald-50 border-emerald-100' :
                    interaction.severity === 'Warning' ? 'bg-amber-50 border-amber-100' :
                    'bg-rose-50 border-rose-100'
                }`}>
                    {!isPremium && <PremiumLock title="Combination Check" />}
                    <div className={!isPremium ? 'opacity-20 blur-[2px] pointer-events-none' : ''}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-[10px] font-black uppercase tracking-widest opacity-60">Combination Safety</h3>
                            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                                interaction.severity === 'Safe' ? 'bg-emerald-500 text-white' :
                                interaction.severity === 'Warning' ? 'bg-amber-500 text-white' :
                                'bg-rose-500 text-white'
                            }`}>
                                {interaction.severity}
                            </div>
                        </div>
                        <p className="text-slate-900 font-bold mb-3">{interaction.summary}</p>
                        <div className="text-xs text-slate-600 bg-white/50 p-4 rounded-2xl italic leading-relaxed">
                            {interaction.advice}
                        </div>
                    </div>
                </section>
            )}
            
            <section className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">AI Summary</h3>
                    <button onClick={() => setUseEli5(!useEli5)} className={`text-[10px] font-bold px-3 py-1.5 rounded-full transition-all border ${useEli5 ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                        {useEli5 ? 'Simple' : 'Deep'}
                    </button>
                </div>
                <p className="text-slate-800 text-lg font-medium leading-relaxed">
                    "{useEli5 ? data?.childFriendlyExplanation : data?.simpleExplanation}"
                </p>
            </section>

             <div className="relative bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 min-h-[120px]">
                {!isPremium && <PremiumLock title="Effect Timeline" />}
                <div className={!isPremium ? 'opacity-20 blur-[2px] pointer-events-none' : ''}>
                    <h3 className="text-xs font-bold text-slate-400 uppercase mb-8 tracking-widest">Effect Timeline</h3>
                    <div className="flex justify-between items-start px-2">
                        {[
                            { id: 'onset', label: "Starts", val: timeline.onset, color: "bg-blue-500" },
                            { id: 'peak', label: "Peak", val: timeline.peak, color: "bg-purple-500" },
                            { id: 'duration', label: "Lasts", val: timeline.duration, color: "bg-emerald-500" }
                        ].map((item, i) => (
                            <div key={i} className="flex flex-col items-center">
                                <div className={`w-9 h-9 ${item.color} rounded-2xl border-4 border-white shadow-lg flex items-center justify-center mb-3`}>
                                     {item.id === 'onset' && <span className="text-white text-[10px]">⏱️</span>}
                                     {item.id === 'peak' && <span className="text-white text-[10px]">📈</span>}
                                     {item.id === 'duration' && <span className="text-white text-[10px]">⌛</span>}
                                </div>
                                <p className="text-[10px] text-slate-400 font-black uppercase mb-1">{item.label}</p>
                                <p className="text-xs font-black text-slate-900">{item.val}</p>
                            </div>
                        ))}
                    </div>
                </div>
             </div>

             <section className="relative bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 min-h-[150px]">
                {!isPremium && <PremiumLock title="Side Effects & Risks" />}
                <div className={!isPremium ? 'opacity-20 blur-[2px] pointer-events-none' : ''}>
                    <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 tracking-widest">Risks & Avoidance</h3>
                    <div className="space-y-4">
                        <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100/50">
                            <span className="text-[9px] font-black text-rose-500 uppercase block mb-1">Key Warnings</span>
                            <p className="text-xs font-bold text-slate-700 leading-relaxed">{data.warnings}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {data.sideEffects.slice(0, 4).map((eff, i) => (
                                <span key={i} className="bg-slate-50 text-slate-500 text-[10px] font-bold px-3 py-1.5 rounded-xl border border-slate-100">🤢 {eff}</span>
                            ))}
                        </div>
                    </div>
                </div>
             </section>

             <div className="grid grid-cols-2 gap-4">
                 <section className="bg-orange-50/50 p-5 rounded-[2rem] border border-orange-100">
                     <span className="text-[10px] font-bold text-orange-400 uppercase mb-2 tracking-widest">Intake</span>
                     <div className="flex items-center mt-1">
                         <span className="text-2xl mr-2">🥣</span>
                         <span className="font-bold text-slate-900 text-sm leading-tight">{data?.foodGuidance || 'Anytime'}</span>
                     </div>
                 </section>

                 <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm">
                     <span className="text-[10px] font-bold text-slate-400 uppercase mb-3 tracking-widest">Restrictions</span>
                     <div className="flex justify-between w-full px-2">
                         <div className={`text-xl ${!lifestyle.alcohol && 'opacity-20 grayscale'}`} title="No Alcohol">🍷</div>
                         <div className={`text-xl ${!lifestyle.driving && 'opacity-20 grayscale'}`} title="No Driving">🚗</div>
                         <div className={`text-xl ${!lifestyle.sleep && 'opacity-20 grayscale'}`} title="Drowsiness">💤</div>
                     </div>
                 </div>
             </div>

            <div className="space-y-3 pt-2">
                <button 
                    onClick={handleDownloadReport}
                    className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg flex items-center justify-center transition-all active:scale-95"
                >
                    {isPremium ? 'Download Health Report PDF' : 'Unlock Health Report 👑'}
                </button>
                <button onClick={onClose} className="w-full bg-white text-teal-700 py-4 rounded-2xl font-black text-xs uppercase tracking-widest border border-slate-100 shadow-sm active:scale-95 transition-all">
                    Back to Scanner
                </button>
            </div>
        </div>
    </div>
  );
};

export default MedicineResult;