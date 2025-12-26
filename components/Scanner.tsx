import React, { useRef, useState, useCallback } from 'react';
import { analyzeMedicineImage } from '../services/geminiService';
import { MedicineData, PatientProfile, AgeGroup, Gender, Language } from '../types';

interface ScannerProps {
  onScanComplete: (data: MedicineData, profile: PatientProfile) => void;
  onError: (msg: string) => void;
}

const Scanner: React.FC<ScannerProps> = ({ onScanComplete, onError }) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showShareBanner, setShowShareBanner] = useState(true);
  
  // Profile State
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('adult');
  const [gender, setGender] = useState<Gender>('male');
  const [isPregnant, setIsPregnant] = useState(false);
  const [isBreastfeeding, setIsBreastfeeding] = useState(false);
  const [language, setLanguage] = useState<Language>('english');

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      setShowForm(true); 
    };
    reader.readAsDataURL(file);
  }, []);

  const startAnalysis = async () => {
    if (!imagePreview) return;
    setShowForm(false);
    setAnalyzing(true);

    const profile: PatientProfile = {
        ageGroup,
        gender,
        isPregnant: gender === 'female' ? isPregnant : false,
        isBreastfeeding: gender === 'female' ? isBreastfeeding : false,
        language
    };

    try {
      const data = await analyzeMedicineImage(imagePreview, profile);
      onScanComplete(data, profile);
    } catch (err) {
      onError("Could not analyze image. Please try again.");
      setImagePreview(null);
      setShowForm(false);
    } finally {
      setAnalyzing(false);
    }
  };

  const shareApp = async () => {
      try {
          if (navigator.share) {
              await navigator.share({
                  title: 'MediScan AI',
                  text: 'Help your family take medicines on time ❤️. Check out MediScan AI.',
                  url: window.location.href
              });
          }
      } catch (e) {}
  };

  const triggerCamera = () => cameraInputRef.current?.click();
  const triggerGallery = () => galleryInputRef.current?.click();

  if (showForm && imagePreview) {
      return (
          <div className="w-full max-w-md mx-auto bg-white rounded-3xl shadow-xl overflow-hidden animate-fade-in-up">
              <div className="h-56 relative group">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
                      <h3 className="text-white font-bold text-2xl mb-1">Customize</h3>
                      <p className="text-gray-300 text-sm">Who is this medicine for?</p>
                  </div>
              </div>
              
              <div className="p-6 space-y-6">
                  {/* Language Selection */}
                   <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-3 tracking-wider">Language / भाषा</label>
                      <div className="grid grid-cols-3 gap-3">
                          {(['english', 'hindi', 'hinglish'] as Language[]).map(l => (
                              <button
                                  key={l}
                                  onClick={() => setLanguage(l)}
                                  className={`py-2 px-1 rounded-xl text-sm font-semibold capitalize transition-all duration-200 ${language === l ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/30 scale-105' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'}`}
                              >
                                  {l}
                              </button>
                          ))}
                      </div>
                  </div>

                  {/* Age Group */}
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-3 tracking-wider">Age Group</label>
                      <div className="grid grid-cols-3 gap-3">
                          <button onClick={() => setAgeGroup('child')} className={`py-4 rounded-xl border flex flex-col items-center justify-center transition-all ${ageGroup === 'child' ? 'border-teal-500 bg-white shadow-md text-teal-700 ring-2 ring-teal-500 ring-opacity-20' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                              <span className="text-2xl mb-1">👶</span>
                              <span className="text-xs font-bold">Child</span>
                          </button>
                          <button onClick={() => setAgeGroup('adult')} className={`py-4 rounded-xl border flex flex-col items-center justify-center transition-all ${ageGroup === 'adult' ? 'border-teal-500 bg-white shadow-md text-teal-700 ring-2 ring-teal-500 ring-opacity-20' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                              <span className="text-2xl mb-1">🧑</span>
                              <span className="text-xs font-bold">Adult</span>
                          </button>
                          <button onClick={() => setAgeGroup('senior')} className={`py-4 rounded-xl border flex flex-col items-center justify-center transition-all ${ageGroup === 'senior' ? 'border-teal-500 bg-white shadow-md text-teal-700 ring-2 ring-teal-500 ring-opacity-20' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                              <span className="text-2xl mb-1">👴</span>
                              <span className="text-xs font-bold">Senior</span>
                          </button>
                      </div>
                  </div>

                  {/* Gender */}
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-3 tracking-wider">Gender</label>
                      <div className="grid grid-cols-2 gap-4">
                          <button onClick={() => { setGender('male'); setIsPregnant(false); setIsBreastfeeding(false); }} className={`py-3 rounded-xl font-bold transition-all ${gender === 'male' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-white text-gray-600 border border-gray-200'}`}>
                              Male
                          </button>
                          <button onClick={() => setGender('female')} className={`py-3 rounded-xl font-bold transition-all ${gender === 'female' ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/30' : 'bg-white text-gray-600 border border-gray-200'}`}>
                              Female
                          </button>
                      </div>
                  </div>

                  {/* Pregnancy/Breastfeeding Checks (Only for Female) */}
                  {gender === 'female' && (
                      <div className="bg-pink-50/50 p-5 rounded-2xl space-y-4 border border-pink-100 animate-fade-in-down">
                          <label className="flex items-center space-x-3 cursor-pointer group">
                              <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${isPregnant ? 'bg-pink-500 border-pink-500' : 'bg-white border-pink-300'}`}>
                                  {isPregnant && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                              </div>
                              <input type="checkbox" checked={isPregnant} onChange={(e) => setIsPregnant(e.target.checked)} className="hidden" />
                              <span className="text-gray-800 font-bold">Pregnant 🤰</span>
                          </label>
                          <label className="flex items-center space-x-3 cursor-pointer group">
                              <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${isBreastfeeding ? 'bg-pink-500 border-pink-500' : 'bg-white border-pink-300'}`}>
                                  {isBreastfeeding && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                              </div>
                              <input type="checkbox" checked={isBreastfeeding} onChange={(e) => setIsBreastfeeding(e.target.checked)} className="hidden" />
                              <span className="text-gray-800 font-bold">Breastfeeding 🤱</span>
                          </label>
                      </div>
                  )}

                  <div className="pt-4 space-y-3">
                    <button 
                        onClick={startAnalysis}
                        className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-gray-900/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center"
                    >
                        <span>Analyze Medicine</span>
                        <div className="ml-2 w-6 h-6 bg-white rounded-full flex items-center justify-center text-black">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                        </div>
                    </button>
                    <button onClick={() => { setImagePreview(null); setShowForm(false); }} className="w-full text-center py-3 text-gray-500 font-semibold text-sm hover:text-gray-800 transition-colors">
                        Cancel
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
        <div className="text-center p-10 bg-white rounded-[2rem] shadow-2xl w-full max-w-sm mx-4 relative overflow-hidden mt-10">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-400 via-blue-500 to-teal-400 animate-[shimmer_2s_infinite]"></div>
            
            <div className="relative w-32 h-32 mx-auto mb-8">
                {imagePreview && (
                    <img src={imagePreview} alt="Scanning" className="w-full h-full object-cover rounded-full border-4 border-white shadow-lg relative z-10" />
                )}
                <div className="absolute inset-0 rounded-full border-4 border-teal-500 border-t-transparent animate-spin z-20"></div>
                <div className="absolute -inset-4 rounded-full border-2 border-teal-200 animate-pulse z-0"></div>
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mb-2">Analyzing...</h3>
            <p className="text-gray-500 text-sm font-medium mb-6">Our AI is checking dosage and safety for <span className="text-teal-600">{ageGroup}</span>...</p>
            
            <div className="flex flex-col space-y-2 max-w-[200px] mx-auto">
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-500 animate-[width_1.5s_ease-in-out_infinite] rounded-full" style={{width: '60%'}}></div>
                </div>
            </div>
        </div>
      ) : (
        <div className="w-full space-y-6 animate-fade-in-up">
           
           {/* Soft Share Banner */}
           {showShareBanner && (
               <div className="bg-white/80 backdrop-blur-sm border border-blue-100 p-4 rounded-2xl flex justify-between items-center relative shadow-sm hover:shadow-md transition-shadow">
                   <div className="flex items-center">
                       <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-3">
                           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                       </div>
                       <div>
                           <p className="text-sm font-bold text-gray-800">Care for Family</p>
                           <p className="text-xs text-gray-500">Share this app to keep them safe.</p>
                       </div>
                   </div>
                   <button 
                       onClick={shareApp} 
                       className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-colors"
                   >
                       Share
                   </button>
                   <button onClick={() => setShowShareBanner(false)} className="absolute -top-2 -right-2 bg-white shadow-sm border border-gray-100 rounded-full w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500">&times;</button>
               </div>
           )}
           
           {/* Main Camera Button */}
           <button 
              onClick={triggerCamera}
              className="group relative w-full h-48 rounded-[2rem] overflow-hidden shadow-2xl transition-transform hover:scale-[1.02] active:scale-95"
           >
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500 to-emerald-600"></div>
              <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
              
              <div className="absolute top-0 right-0 p-6 opacity-30">
                  <svg className="w-32 h-32 text-white transform rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
              </div>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10">
                  <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 border border-white/30 animate-pulse-ring">
                       <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </div>
                  <h3 className="text-2xl font-bold tracking-tight">Scan Medicine</h3>
                  <p className="text-teal-100 font-medium mt-1">Camera or Label</p>
              </div>
           </button>
           
           <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-bold tracking-widest uppercase">Or Upload</span>
              <div className="flex-grow border-t border-gray-200"></div>
           </div>

           <button 
             onClick={triggerGallery}
             className="w-full bg-white text-gray-800 py-5 px-6 rounded-2xl font-bold shadow-lg shadow-gray-200/50 border border-white flex items-center justify-between hover:bg-gray-50 transition-all group"
           >
             <div className="flex items-center">
                 <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mr-4 group-hover:bg-indigo-100 transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                 </div>
                 <div className="text-left">
                    <span className="block text-gray-900 text-lg">Select from Gallery</span>
                    <span className="text-gray-400 text-xs font-medium">Use an existing photo</span>
                 </div>
             </div>
             <svg className="w-5 h-5 text-gray-300 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
           </button>
           
           {/* Trust Badges */}
           <div className="flex justify-center space-x-6 pt-6 opacity-70">
               <div className="flex flex-col items-center text-gray-400">
                   <svg className="w-6 h-6 mb-1 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                   <span className="text-[10px] font-bold uppercase tracking-wider">Private</span>
               </div>
               <div className="w-px h-8 bg-gray-200"></div>
               <div className="flex flex-col items-center text-gray-400">
                   <svg className="w-6 h-6 mb-1 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                   <span className="text-[10px] font-bold uppercase tracking-wider">Accurate</span>
               </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Scanner;