import React, { useState, useEffect } from 'react';
import { MedicineData, PatientProfile } from '../types';

interface MedicineResultProps {
  data: MedicineData;
  profile?: PatientProfile;
  isPremium: boolean;
  onOpenPremium: () => void;
  onClose: () => void;
}

const MedicineResult: React.FC<MedicineResultProps> = ({ data, profile, isPremium, onOpenPremium, onClose }) => {
  const [speaking, setSpeaking] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<'yes' | 'no' | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  useEffect(() => {
    return () => {
        window.speechSynthesis.cancel();
    }
  }, []);

  const toggleSpeech = () => {
    if (speaking) {
        window.speechSynthesis.cancel();
        setSpeaking(false);
    } else {
        const textToRead = `
            ${data.name}. 
            ${data.simpleExplanation}. 
            ${data.ageAdvice}. 
            ${data.pregnancyWarning ? 'Warning: ' + data.pregnancyWarning : ''}
        `;
        const utterance = new SpeechSynthesisUtterance(textToRead);
        utterance.lang = profile?.language === 'hindi' ? 'hi-IN' : 'en-US';
        utterance.onend = () => setSpeaking(false);
        window.speechSynthesis.speak(utterance);
        setSpeaking(true);
    }
  };

  const handleShare = async () => {
      const shareData = {
          title: `MediScan Info: ${data.name}`,
          text: `Check out this medicine: ${data.name}. Usage: ${data.simpleExplanation}. identified via MediScan AI App.`,
          url: window.location.href
      };
      try {
          if (navigator.share) await navigator.share(shareData);
          else {
              alert("Copied to clipboard!");
              await navigator.clipboard.writeText(shareData.text);
          }
      } catch (err) {}
  };

  const submitFeedback = () => {
      setFeedbackSent(true);
      setTimeout(() => setFeedbackSent(false), 3000); 
  };

  return (
    <div className="pb-32 bg-gray-50 min-h-screen">
        
        {/* Hero Header */}
        <div className="bg-teal-700 text-white rounded-b-[2.5rem] shadow-2xl relative overflow-hidden pb-12">
            <div className="absolute top-0 right-0 -mr-10 -mt-10 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-48 h-48 bg-teal-400 opacity-10 rounded-full blur-2xl"></div>
            
            <div className="p-6 pt-8 relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <div className="bg-teal-800/50 backdrop-blur-md px-3 py-1 rounded-full border border-teal-600/30">
                        <span className="text-[10px] font-bold tracking-widest uppercase text-teal-100">AI Analysis</span>
                    </div>
                    <button onClick={onClose} className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                
                <h2 className="text-3xl font-extrabold mb-2 leading-tight">{data.name}</h2>
                <p className="text-teal-100 text-sm opacity-90 font-medium">{data.description}</p>
            </div>

            {/* Floating Play Button */}
            <button 
                onClick={toggleSpeech}
                className="absolute -bottom-7 right-8 w-16 h-16 bg-yellow-400 rounded-full shadow-lg shadow-yellow-500/30 flex items-center justify-center text-black hover:scale-110 active:scale-95 transition-transform z-20"
            >
                {speaking ? (
                    <div className="flex space-x-1 items-center h-5">
                        <div className="w-1.5 h-6 bg-black animate-[bounce_1s_infinite_0ms]"></div>
                        <div className="w-1.5 h-6 bg-black animate-[bounce_1s_infinite_200ms]"></div>
                        <div className="w-1.5 h-6 bg-black animate-[bounce_1s_infinite_400ms]"></div>
                    </div>
                ) : (
                    <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                )}
            </button>
        </div>

        <div className="px-6 pt-10 space-y-6">
            
            {/* CRITICAL ALERTS */}
            {(data.pregnancyWarning || data.breastfeedingWarning) && (
                <div className="bg-red-50 border border-red-100 p-5 rounded-2xl animate-pulse-ring">
                    <div className="flex items-start">
                        <div className="flex-shrink-0 bg-red-100 p-2 rounded-full">
                            <svg className="h-6 w-6 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <h3 className="text-sm font-bold text-red-900 uppercase tracking-wide">Critical Safety Alert</h3>
                            {data.pregnancyWarning && <p className="text-sm text-red-700 mt-2 font-medium">🤰 {data.pregnancyWarning}</p>}
                            {data.breastfeedingWarning && <p className="text-sm text-red-700 mt-1 font-medium">🤱 {data.breastfeedingWarning}</p>}
                        </div>
                    </div>
                </div>
            )}

            {/* Simple Explanation */}
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-teal-500"></div>
                <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center tracking-wider">
                    Simply Put
                </h3>
                <p className="text-gray-800 text-lg font-medium leading-relaxed">
                    "{data.simpleExplanation}"
                </p>
                <div className="mt-4 flex justify-end">
                    <span className="text-[10px] text-teal-700 font-bold bg-teal-50 border border-teal-100 px-3 py-1 rounded-full">Medical AI Analysis</span>
                </div>
            </section>

             {/* Age Specific Advice */}
            <section className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100">
                 <div className="flex items-center mb-3">
                    <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    </div>
                    <h3 className="text-base font-bold text-gray-800">For {profile?.ageGroup}s</h3>
                </div>
                <div className="text-indigo-900 text-sm leading-relaxed pl-11">
                    {data.ageAdvice}
                </div>
            </section>

            {/* Grid for Uses and Dosage */}
            <div className="grid grid-cols-1 gap-4">
                {/* Uses */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-sm font-bold text-gray-400 uppercase mb-3 flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Common Uses
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {data.uses.map((use, i) => (
                            <span key={i} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-semibold border border-blue-100">
                                {use}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Dosage */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-sm font-bold text-gray-400 uppercase mb-3 flex items-center">
                         <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Dosage Guide
                    </h3>
                    <div className="text-gray-700 text-sm leading-relaxed font-medium">
                        {data.dosage}
                    </div>
                </div>
            </div>

            {/* Side Effects - PREMIUM LOCKED */}
            <section className="relative overflow-hidden rounded-2xl border border-red-100 shadow-sm bg-white">
                <div className={`p-5 ${!isPremium ? 'filter blur-sm select-none' : 'bg-red-50/30'}`}>
                    <h3 className="text-sm font-bold text-red-400 uppercase mb-3 flex items-center">
                        Side Effects
                    </h3>
                    <ul className="space-y-3">
                        {isPremium ? (
                            data.sideEffects.map((effect, i) => (
                                <li key={i} className="flex items-start text-sm text-gray-700">
                                    <span className="text-red-400 mr-2">•</span> {effect}
                                </li>
                            ))
                        ) : (
                            <>
                                <li className="flex items-start text-sm text-gray-700"><span className="text-red-400 mr-2">•</span> Nausea and dizziness in some cases.</li>
                                <li className="flex items-start text-sm text-gray-700"><span className="text-red-400 mr-2">•</span> May cause drowsiness.</li>
                                <li className="flex items-start text-sm text-gray-700"><span className="text-red-400 mr-2">•</span> Stomach upset if taken on empty stomach.</li>
                            </>
                        )}
                    </ul>
                </div>

                {!isPremium && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 z-10 backdrop-blur-[2px]">
                        <div className="bg-gray-900 p-5 rounded-2xl shadow-2xl text-center max-w-[85%] border border-gray-700 text-white">
                            <span className="text-3xl mb-2 block">👑</span>
                            <h4 className="font-bold text-lg mb-1">Detailed Risks</h4>
                            <p className="text-xs text-gray-400 mb-4">Unlock complete side effects & safety data.</p>
                            <button 
                                onClick={onOpenPremium}
                                className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg hover:scale-105 transition-transform"
                            >
                                Unlock for ₹49
                            </button>
                        </div>
                    </div>
                )}
            </section>
            
            {/* Share Button */}
            <button 
                onClick={handleShare}
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center"
            >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                Share with Family
            </button>

            {/* Feedback Section */}
            <div className="bg-gray-100 p-5 rounded-2xl">
                {!feedbackSent ? (
                    <>
                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 text-center">Was this helpful?</h4>
                        <div className="flex space-x-4">
                            <button 
                                onClick={() => { setFeedbackGiven('yes'); submitFeedback(); }}
                                className={`flex-1 py-3 rounded-xl border border-gray-200 bg-white font-bold text-sm shadow-sm hover:border-green-400 hover:text-green-600 transition-colors ${feedbackGiven === 'yes' ? 'border-green-500 text-green-600 bg-green-50' : 'text-gray-600'}`}
                            >
                                👍 Yes
                            </button>
                            <button 
                                onClick={() => setFeedbackGiven('no')}
                                className={`flex-1 py-3 rounded-xl border border-gray-200 bg-white font-bold text-sm shadow-sm hover:border-red-400 hover:text-red-600 transition-colors ${feedbackGiven === 'no' ? 'border-red-500 text-red-600 bg-red-50' : 'text-gray-600'}`}
                            >
                                👎 No
                            </button>
                        </div>
                        
                        {feedbackGiven === 'no' && (
                            <div className="mt-4 animate-fade-in-down">
                                <textarea 
                                    className="w-full p-3 border border-gray-300 rounded-xl text-sm mb-3 focus:outline-none focus:border-black focus:ring-1 focus:ring-black" 
                                    placeholder="What was wrong?"
                                    value={feedbackText}
                                    onChange={(e) => setFeedbackText(e.target.value)}
                                    rows={2}
                                />
                                <button 
                                    onClick={submitFeedback}
                                    className="w-full py-2 bg-gray-800 text-white text-xs font-bold rounded-lg"
                                >
                                    Submit
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center text-green-600 font-bold py-2 flex items-center justify-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        Thanks for helping us improve!
                    </div>
                )}
            </div>
            
            <div className="text-center py-4 border-t border-gray-200">
                 <p className="text-[10px] text-gray-400 font-medium">
                    This app does not provide medical diagnosis. Always consult a doctor.
                </p>
            </div>
        </div>
    </div>
  );
};

export default MedicineResult;