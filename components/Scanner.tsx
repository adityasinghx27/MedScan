import React, { useRef, useState, useCallback, useEffect } from 'react';
import { analyzeMedicineImage } from '../services/geminiService';
import { MedicineData, PatientProfile, AgeGroup, Gender, Language } from '../types';

interface ScannerProps {
  onScanComplete: (data: MedicineData, profile: PatientProfile) => void;
  onError: (msg: string) => void;
}

const Scanner: React.FC<ScannerProps> = ({ onScanComplete, onError }) => {
  const [images, setImages] = useState<string[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('adult');
  const [gender, setGender] = useState<Gender>('male');
  const [isPregnant, setIsPregnant] = useState(false);
  const [isBreastfeeding, setIsBreastfeeding] = useState(false);
  const [language, setLanguage] = useState<Language>('english');

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const triggerCamera = () => cameraInputRef.current?.click();
  const triggerGallery = () => galleryInputRef.current?.click();

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const reader = new FileReader();
    reader.onloadend = () => { 
        setImages(prev => [...prev, reader.result as string].slice(-3)); // Max 3 images
    };
    reader.readAsDataURL(file);
    if (e.target) e.target.value = ''; // Reset input to allow same file re-selection if needed
  }, []);

  const removeImage = (index: number) => {
      setImages(prev => prev.filter((_, i) => i !== index));
  };

  const startAnalysis = async () => {
    if (images.length === 0) return;
    setShowForm(false);
    setAnalyzing(true);
    try {
      const profile = { ageGroup, gender, isPregnant, isBreastfeeding, language };
      const data = await analyzeMedicineImage(images, profile);
      onScanComplete(data, profile);
    } catch (err: any) {
      onError(err.message || "Scan failed. Ensure the text is clear and try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  if (showForm) {
      return (
          <div className="w-full max-w-md mx-auto bg-white rounded-[3rem] shadow-2xl overflow-hidden animate-slide-up relative z-[110] border border-slate-100 mb-20">
              <div className="p-8 space-y-8 bg-white">
                  <div className="flex justify-between items-center mb-2">
                      <h3 className="text-slate-900 font-black text-2xl tracking-tighter">Set Patient Profile</h3>
                      <button onClick={() => setShowForm(false)} className="text-slate-400 font-bold text-xs uppercase">Back</button>
                  </div>
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Language</label>
                      <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                          {(['english', 'hindi', 'hinglish'] as Language[]).map(l => (
                              <button key={l} onClick={() => setLanguage(l)} className={`flex-1 py-3 rounded-xl text-xs font-black capitalize transition-all duration-300 ${language === l ? 'bg-white text-teal-700 shadow-xl shadow-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>{l}</button>
                          ))}
                      </div>
                  </div>
                  <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Age Category</label>
                      <div className="grid grid-cols-3 gap-3">
                          {[ { id: 'child', emoji: '👶', label: 'Child' }, { id: 'adult', emoji: '🧑', label: 'Adult' }, { id: 'senior', emoji: '👴', label: 'Senior' } ].map((item) => (
                             <button key={item.id} onClick={() => setAgeGroup(item.id as AgeGroup)} className={`py-5 rounded-3xl border transition-all duration-500 active:scale-90 ${ageGroup === item.id ? 'border-teal-500 bg-teal-50 text-teal-900 ring-4 ring-teal-500/10' : 'border-slate-100 bg-white text-slate-500 hover:bg-slate-50'}`}>
                                <span className="block text-3xl mb-1">{item.emoji}</span>
                                <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
                            </button>
                          ))}
                      </div>
                  </div>
                  <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Gender</label>
                      <div className="grid grid-cols-2 gap-4">
                          <button onClick={() => { setGender('male'); setIsPregnant(false); setIsBreastfeeding(false); }} className={`py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${gender === 'male' ? 'bg-blue-600 text-white shadow-2xl shadow-blue-500/30' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>Male</button>
                          <button onClick={() => setGender('female')} className={`py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${gender === 'female' ? 'bg-rose-500 text-white shadow-2xl shadow-rose-500/30' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>Female</button>
                      </div>
                  </div>
                  {gender === 'female' && (
                      <div className="bg-rose-50 p-6 rounded-[2.5rem] space-y-4 border border-rose-100 animate-fade-in">
                          {[ { label: "Pregnant 🤰", state: isPregnant, setter: setIsPregnant }, { label: "Breastfeeding 🤱", state: isBreastfeeding, setter: setIsBreastfeeding } ].map((item, i) => (
                              <label key={i} className="flex items-center space-x-4 cursor-pointer group select-none">
                                  <div className={`w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all ${item.state ? 'bg-rose-500 border-rose-500' : 'bg-white border-rose-200'}`}>
                                      {item.state && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>}
                                  </div>
                                  <input type="checkbox" checked={item.state} onChange={(e) => item.setter(e.target.checked)} className="hidden" />
                                  <span className="text-slate-800 font-black text-[11px] uppercase tracking-wide">{item.label}</span>
                              </label>
                          ))}
                      </div>
                  )}
                  <div className="pt-4 space-y-3">
                    <button onClick={startAnalysis} className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black text-lg shadow-2xl shadow-slate-900/30 hover:translate-y-[-2px] active:scale-95 transition-all flex items-center justify-center space-x-4">
                        <span>Analyze ({images.length} {images.length > 1 ? 'Meds' : 'Med'})</span>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </button>
                  </div>
              </div>
          </div>
      )
  }

  return (
    <div className="flex flex-col items-center w-full">
      <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} onChange={handleFileChange} className="hidden" />
      <input type="file" accept="image/*" ref={galleryInputRef} onChange={handleFileChange} className="hidden" />

      {analyzing ? (
        <div className="text-center p-12 bg-white rounded-[4rem] shadow-2xl w-full max-w-sm mx-4 relative overflow-hidden mt-10 border border-slate-50">
            <div className="absolute top-0 left-0 w-full h-2.5 bg-gradient-to-r from-teal-400 via-emerald-500 to-teal-400 animate-[shimmer_2s_infinite]"></div>
            <div className="relative w-40 h-40 mx-auto mb-10">
                <img src={images[0]} alt="Scanning" className="w-full h-full object-cover rounded-full border-[10px] border-white shadow-2xl relative z-10" />
                <div className="absolute -inset-3 rounded-full border-[5px] border-teal-500 border-t-transparent animate-spin z-20"></div>
                {images.length > 1 && (
                    <div className="absolute top-0 right-0 bg-indigo-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold border-4 border-white z-30 shadow-lg">
                        +{images.length - 1}
                    </div>
                )}
            </div>
            <h3 className="text-4xl font-black text-slate-900 mb-3 tracking-tighter">
                {images.length > 1 ? 'Checking Combinations...' : 'Analyzing your medicine...'}
            </h3>
            
            {/* Dynamic Status Message */}
            <div className="mb-10">
              <div className="inline-flex items-center space-x-2 bg-slate-50 px-5 py-2 rounded-full border border-slate-100 shadow-inner">
                 <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></div>
                 <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.2em]">
                    Hold tight, almost there!
                 </p>
              </div>
            </div>
            
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] opacity-70">Cross-checking Interactions & Safety</p>
        </div>
      ) : (
        <div className="w-full space-y-6 animate-slide-up">
           
           {/* Preview Stack */}
           {images.length > 0 && (
               <div className="flex flex-wrap gap-3 mb-2 px-2">
                   {images.map((img, i) => (
                       <div key={i} className="relative w-24 h-24 rounded-3xl overflow-hidden border-2 border-white shadow-lg animate-fade-in">
                           <img src={img} className="w-full h-full object-cover" />
                           <button onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-rose-500 text-white w-6 h-6 rounded-full flex items-center justify-center shadow-md">
                               <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                           </button>
                       </div>
                   ))}
                   {images.length < 3 && (
                        <button onClick={triggerCamera} className="w-24 h-24 rounded-3xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-teal-400 hover:text-teal-400 transition-colors">
                            <span className="text-2xl font-bold">+</span>
                            <span className="text-[8px] font-black uppercase">Add More</span>
                        </button>
                   )}
               </div>
           )}

           {images.length === 0 ? (
               <button onClick={triggerCamera} className="group relative w-full h-72 rounded-[4rem] overflow-hidden shadow-2xl shadow-teal-900/30 transition-all duration-500 hover:scale-[1.03] active:scale-95 border-4 border-white">
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-600 via-emerald-600 to-teal-800 transition-colors group-hover:from-teal-700 group-hover:to-teal-800"></div>
                  <div className="animate-scan z-20"></div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-30 px-6 text-center">
                      <div className="w-24 h-24 bg-white/20 backdrop-blur-2xl rounded-[2.5rem] flex items-center justify-center mb-6 border border-white/40 shadow-2xl animate-pulse-soft">
                           <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      </div>
                      <h3 className="text-4xl font-black tracking-tighter mb-2">Scan Medicine</h3>
                      <p className="text-teal-100/80 font-black text-[11px] tracking-[0.4em] uppercase">Box • Strip • Prescription</p>
                  </div>
               </button>
           ) : (
                <div className="space-y-4">
                    <button onClick={() => setShowForm(true)} className="w-full bg-teal-600 text-white py-6 rounded-[2.5rem] font-black text-xl shadow-2xl shadow-teal-600/30 active:scale-95 transition-all flex items-center justify-center space-x-3">
                        <span>{images.length > 1 ? 'Analyze Combination' : 'Analyze Medicine'}</span>
                        <div className="bg-white/20 px-2 py-0.5 rounded-lg text-xs">{images.length}</div>
                    </button>
                    <button onClick={() => setImages([])} className="w-full text-slate-400 font-black text-[10px] uppercase tracking-widest">Reset All</button>
                </div>
           )}
           
           <button onClick={triggerGallery} className="group relative w-full rounded-[3rem] overflow-hidden shadow-xl shadow-slate-200/50 transition-all active:scale-95 hover:scale-[1.03] border-4 border-white">
                {/* Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-blue-700 transition-colors group-hover:from-indigo-600 group-hover:to-blue-800"></div>
                {/* Upload Scan Animation Effect */}
                <div className="animate-upload-scan z-20"></div>
                {/* Internal Content */}
                <div className="relative z-10 p-7 px-8 flex items-center justify-between">
                    <div className="flex items-center">
                        {/* Icon Container with pulse */}
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-2xl text-white rounded-[1.8rem] flex items-center justify-center mr-6 group-hover:scale-110 transition-transform shadow-lg border border-white/40 animate-pulse-soft">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                        <div className="text-left">
                            <span className="block text-white text-2xl font-black tracking-tighter leading-none mb-1">Gallery Import</span>
                            <span className="text-blue-100/80 text-[10px] font-black uppercase tracking-[0.2em]">Choose from photos</span>
                        </div>
                    </div>
                    {/* Arrow Icon */}
                    <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-all duration-300">
                       <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                    </div>
                </div>
            </button>
        </div>
      )}
    </div>
  );
};

export default Scanner;