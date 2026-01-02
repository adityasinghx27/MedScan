import React, { useRef, useState, useCallback } from 'react';
import { analyzeMedicineImage } from '../services/geminiService';
import { MedicineData, PatientProfile, AgeGroup, Gender, Language, FamilyMember } from '../types';

interface ScannerProps {
  familyMembers: FamilyMember[];
  onScanComplete: (data: MedicineData, profile: PatientProfile) => void;
  onError: (msg: string) => void;
}

const Scanner: React.FC<ScannerProps> = ({ familyMembers, onScanComplete, onError }) => {
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
        setImages(prev => [...prev, reader.result as string].slice(-3)); 
    };
    reader.readAsDataURL(file);
    if (e.target) e.target.value = ''; 
  }, []);

  const removeImage = (index: number) => {
      setImages(prev => prev.filter((_, i) => i !== index));
  };

  const startAnalysis = async (selectedProfile?: PatientProfile) => {
    if (images.length === 0) return;
    setShowForm(false);
    setAnalyzing(true);
    try {
      const profile = selectedProfile || { ageGroup, gender, isPregnant, isBreastfeeding, language };
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
          <div className="w-full max-w-md mx-auto bg-white rounded-[3.5rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)] overflow-hidden animate-slide-up relative z-[110] border border-slate-50 mb-20">
              {/* Clinical Header */}
              <div className="bg-slate-50 p-8 pb-6 border-b border-slate-100">
                  <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-teal-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-teal-100">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                          </div>
                          <h3 className="text-slate-900 font-black text-2xl tracking-tighter">Profile Context</h3>
                      </div>
                      <button onClick={() => setShowForm(false)} className="bg-white px-4 py-2 rounded-xl text-slate-400 font-bold text-[10px] uppercase tracking-widest border border-slate-100 hover:text-slate-600 shadow-sm transition-all">Back</button>
                  </div>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Personalize analysis for medical safety</p>
              </div>

              <div className="p-8 space-y-8 bg-white max-h-[70vh] overflow-y-auto no-scrollbar">
                  {/* Saved Profiles Section */}
                  <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Quick Select</label>
                        <span className="text-[9px] bg-teal-50 text-teal-600 px-2 py-0.5 rounded-full font-black uppercase">Recent</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {familyMembers.map(member => (
                          <button 
                            key={member.id} 
                            onClick={() => startAnalysis({
                              ageGroup: member.ageGroup,
                              gender: member.gender,
                              isPregnant: member.isPregnant,
                              isBreastfeeding: member.isBreastfeeding,
                              language: member.language
                            })}
                            className="bg-slate-50/50 p-5 rounded-[2rem] flex items-center space-x-3 hover:bg-white hover:border-teal-300 border-2 border-transparent transition-all group shadow-sm hover:shadow-xl hover:shadow-teal-900/5"
                          >
                            <span className="text-3xl group-hover:scale-110 transition-transform">{member.avatar}</span>
                            <div className="text-left overflow-hidden">
                              <p className="text-sm font-black text-slate-800 tracking-tight truncate">{member.name}</p>
                              <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">{member.ageGroup}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                  </div>

                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-slate-100"></div>
                    <span className="flex-shrink mx-6 text-[8px] font-black text-slate-300 uppercase tracking-[0.3em]">Or Manual Setup</span>
                    <div className="flex-grow border-t border-slate-100"></div>
                  </div>
                  
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">AI Output Language</label>
                      <div className="flex bg-slate-100/50 p-2 rounded-[1.8rem] border border-slate-100">
                          {(['english', 'hindi', 'hinglish'] as Language[]).map(l => (
                              <button key={l} onClick={() => setLanguage(l)} className={`flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${language === l ? 'bg-white text-teal-700 shadow-xl shadow-slate-200 border border-teal-50' : 'text-slate-400 hover:text-slate-600'}`}>{l}</button>
                          ))}
                      </div>
                  </div>

                  <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Patient Age</label>
                      <div className="grid grid-cols-3 gap-3">
                          {[ { id: 'child', emoji: '👶', label: 'Child' }, { id: 'adult', emoji: '🧑', label: 'Adult' }, { id: 'senior', emoji: '👴', label: 'Senior' } ].map((item) => (
                             <button key={item.id} onClick={() => setAgeGroup(item.id as AgeGroup)} className={`py-6 rounded-[2rem] border-2 transition-all duration-300 ${ageGroup === item.id ? 'border-teal-500 bg-teal-50 text-teal-900 ring-8 ring-teal-500/5' : 'border-slate-100 bg-white text-slate-400 hover:bg-slate-50'}`}>
                                <span className="block text-3xl mb-1.5">{item.emoji}</span>
                                <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
                            </button>
                          ))}
                      </div>
                  </div>

                  <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Gender</label>
                      <div className="grid grid-cols-2 gap-4">
                          <button onClick={() => { setGender('male'); setIsPregnant(false); setIsBreastfeeding(false); }} className={`py-4.5 rounded-[1.8rem] font-black text-[10px] uppercase tracking-widest transition-all ${gender === 'male' ? 'bg-slate-900 text-white shadow-2xl shadow-slate-900/20' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>Male</button>
                          <button onClick={() => setGender('female')} className={`py-4.5 rounded-[1.8rem] font-black text-[10px] uppercase tracking-widest transition-all ${gender === 'female' ? 'bg-rose-500 text-white shadow-2xl shadow-rose-500/20' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>Female</button>
                      </div>
                  </div>

                  {gender === 'female' && (
                      <div className="bg-rose-50/30 p-8 rounded-[2.5rem] space-y-5 border border-rose-100 animate-fade-in">
                          {[ { label: "Current Pregnancy 🤰", state: isPregnant, setter: setIsPregnant }, { label: "Breastfeeding Stage 🤱", state: isBreastfeeding, setter: setIsBreastfeeding } ].map((item, i) => (
                              <label key={i} className="flex items-center justify-between cursor-pointer group select-none">
                                  <span className="text-slate-800 font-black text-[11px] uppercase tracking-wide">{item.label}</span>
                                  <div className={`w-12 h-7 rounded-full transition-all duration-300 p-1 ${item.state ? 'bg-rose-500' : 'bg-slate-200'}`}>
                                      <div className={`w-5 h-5 bg-white rounded-full transition-transform duration-300 ${item.state ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                  </div>
                                  <input type="checkbox" checked={item.state} onChange={(e) => item.setter(e.target.checked)} className="hidden" />
                              </label>
                          ))}
                      </div>
                  )}
              </div>

              {/* Bottom Sticky Analyze Action */}
              <div className="p-8 pt-4 bg-white border-t border-slate-50">
                <button onClick={() => startAnalysis()} className="w-full bg-teal-600 text-white py-6 rounded-[2rem] font-black text-lg shadow-2xl shadow-teal-600/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center space-x-4 border-4 border-white animate-glow-teal">
                    <span>Start AI Analysis</span>
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                </button>
              </div>
          </div>
      )
  }

  return (
    <div className="flex flex-col items-center w-full">
      <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} onChange={handleFileChange} className="hidden" />
      <input type="file" accept="image/*" ref={galleryInputRef} onChange={handleFileChange} className="hidden" />

      {analyzing ? (
        <div className="text-center p-12 bg-white rounded-[4rem] shadow-2xl w-full max-sm mx-4 relative overflow-hidden mt-10 border border-slate-50 animate-glow-teal">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-teal-400 via-emerald-500 to-teal-400 animate-[shimmer_2s_infinite]"></div>
            
            <div className="relative w-48 h-48 mx-auto mb-10">
                <div className="absolute inset-0 bg-teal-500/10 rounded-full animate-pulse"></div>
                <img src={images[0]} alt="Scanning" className="w-full h-full object-cover rounded-full border-[10px] border-white shadow-2xl relative z-10" />
                <div className="absolute -inset-4 rounded-full border-[4px] border-teal-500 border-t-transparent animate-spin z-20"></div>
                <div className="absolute -inset-8 rounded-full border-2 border-teal-100 border-b-transparent animate-spin-reverse z-0 opacity-40"></div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-center space-x-2">
                    <span className="w-2 h-2 bg-teal-500 rounded-full animate-ping"></span>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tighter">AI Processing...</h3>
                </div>
                <div className="max-w-[200px] mx-auto">
                    <div className="flex justify-between text-[8px] font-black text-teal-600/60 uppercase tracking-widest mb-1.5">
                        <span>Neural Link</span>
                        <span>82%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-teal-500 rounded-full w-[82%] shadow-[0_0_10px_rgba(20,184,166,0.5)]"></div>
                    </div>
                </div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] opacity-70">Cross-referencing drug database</p>
            </div>
        </div>
      ) : (
        <div className="w-full space-y-6 animate-slide-up pb-10">
           {images.length > 0 && (
               <div className="flex flex-col space-y-5 mb-4 animate-fade-in">
                   <div className="flex items-center justify-between px-2">
                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Ready for Analysis</h4>
                       <span className="bg-slate-900 text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">{images.length} Items Selected</span>
                   </div>
                   <div className="flex flex-wrap gap-4 px-2">
                       {images.map((img, i) => (
                           <div key={i} className="relative w-24 h-24 rounded-[2rem] overflow-hidden border-4 border-white shadow-xl animate-fade-in group">
                               <img src={img} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                               <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-all"></div>
                               <button onClick={() => removeImage(i)} className="absolute top-1.5 right-1.5 bg-rose-500 text-white w-7 h-7 rounded-2xl flex items-center justify-center shadow-lg border-2 border-white transform active:scale-90 transition-transform">
                                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                               </button>
                           </div>
                       ))}
                       <button onClick={triggerCamera} className="w-24 h-24 rounded-[2rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300 hover:border-teal-400 hover:text-teal-400 transition-all bg-white shadow-inner">
                            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                            <span className="text-[7px] font-black uppercase tracking-widest">Add More</span>
                       </button>
                   </div>
                   
                   <button 
                      onClick={() => setShowForm(true)}
                      className="w-full bg-teal-600 text-white py-6 rounded-[2.5rem] font-black text-lg shadow-2xl shadow-teal-600/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center space-x-3 border-4 border-white animate-glow-teal relative overflow-hidden"
                   >
                       <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] animate-[shimmer_2s_infinite]"></div>
                       <span className="relative z-10">Proceed to Finalize</span>
                       <svg className="w-6 h-6 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 5l7 7-7 7M5 12h14" /></svg>
                   </button>
               </div>
           )}

           <button onClick={triggerCamera} className="group relative w-full h-72 rounded-[4rem] overflow-hidden shadow-2xl shadow-teal-900/30 transition-all duration-500 hover:scale-[1.03] active:scale-95 border-4 border-white animate-glow-teal">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-600 via-emerald-600 to-teal-800 transition-colors group-hover:from-teal-700 group-hover:to-teal-800"></div>
              
              {/* Medicine Background Elements */}
              <div className="absolute inset-0 bg-med-pattern opacity-10"></div>
              <div className="absolute top-10 right-10 text-white/5 text-8xl rotate-12 animate-floating">💊</div>
              <div className="absolute bottom-10 left-10 text-white/5 text-6xl -rotate-12 animate-floating delay-1000">🏥</div>

              {/* Scan Animation Line */}
              <div className="animate-scan"></div>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-30 px-6 text-center">
                  <div className="w-24 h-24 bg-white/20 backdrop-blur-2xl rounded-[2.5rem] flex items-center justify-center mb-6 border border-white/40 shadow-2xl animate-pulse-soft">
                       <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </div>
                  <h3 className="text-4xl font-black tracking-tighter mb-2">Scan Medicine</h3>
                  <p className="text-teal-100/80 font-black text-[11px] tracking-[0.4em] uppercase">Box • Strip • Prescription</p>
              </div>
           </button>
           
           <button onClick={triggerGallery} className="group relative w-full rounded-[3.5rem] overflow-hidden transition-all active:scale-95 hover:scale-[1.02] border-4 border-white min-h-[160px] animate-glow-blue">
                {/* Steady Glowing Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-blue-700 to-indigo-900 transition-colors group-hover:from-indigo-700 group-hover:to-indigo-800"></div>
                
                {/* Medicine Background Elements */}
                <div className="absolute inset-0 bg-med-pattern opacity-10"></div>
                <div className="absolute -top-4 -right-4 text-white/5 text-9xl animate-floating">🩺</div>

                {/* Scan Animation Line (Added to Gallery as requested) */}
                <div className="animate-scan"></div>
                
                <div className="relative z-10 p-8 px-10 flex items-center justify-between">
                    <div className="flex items-center">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-2xl text-white rounded-[1.8rem] flex items-center justify-center mr-6 shadow-lg border border-white/40">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                        <div className="text-left">
                            <span className="block text-white text-3xl font-black tracking-tighter leading-none mb-1.5">Gallery Import</span>
                            <span className="text-indigo-100/50 text-[10px] font-black uppercase tracking-[0.3em]">AI Image Analysis</span>
                        </div>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white/60">
                         <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                    </div>
                </div>
            </button>
        </div>
      )}
    </div>
  );
};

export default Scanner;