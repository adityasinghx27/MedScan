
import React, { useState, useRef } from 'react';
import { analyzeSkinCondition } from '../services/geminiService';
import { DermaData } from '../types';

interface DermaScannerProps {
  onBack: () => void;
}

const DermaScanner: React.FC<DermaScannerProps> = ({ onBack }) => {
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<DermaData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const checkOnline = () => {
    if (!navigator.onLine) {
        alert("Internet Required for Derma Analysis. Please turn on mobile data or Wi-Fi.");
        return false;
    }
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const startAnalysis = async () => {
    if (!checkOnline()) return;
    if (!image) return;
    setAnalyzing(true);
    try {
      const data = await analyzeSkinCondition(image);
      setResult(data);
    } catch (error) {
      alert("Failed to analyze skin condition. Please ensure the image is clear.");
    } finally {
      setAnalyzing(false);
    }
  };

  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case 'Severe': return 'bg-rose-500 text-white';
      case 'Moderate': return 'bg-orange-400 text-white';
      default: return 'bg-teal-500 text-white';
    }
  };

  if (result) {
    return (
      <div className="min-h-screen bg-slate-50 pb-24 animate-fade-in relative z-50">
         <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-slate-100">
             <button onClick={() => setResult(null)} className="flex items-center text-slate-500 font-bold">
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                Rescan
             </button>
             <h2 className="text-lg font-black text-violet-600 tracking-tight">Derma-Scan Report</h2>
         </div>

         <div className="p-6 space-y-6">
            <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-violet-50 text-center">
                 <div className={`inline-block px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 ${getSeverityColor(result.severity)}`}>
                    Severity: {result.severity}
                 </div>
                 <h1 className="text-3xl font-black text-slate-900 mb-2">{result.conditionName}</h1>
                 <p className="text-slate-500 font-medium leading-relaxed">{result.description}</p>
            </div>

            <div className="bg-violet-50 p-6 rounded-[2.5rem] border border-violet-100">
                <h3 className="text-xs font-black text-violet-400 uppercase tracking-widest mb-4">Treatment Suggestions (OTC)</h3>
                <div className="flex flex-wrap gap-2">
                    {result.otcSuggestions.map((med, i) => (
                        <div key={i} className="bg-white px-4 py-3 rounded-xl shadow-sm font-bold text-slate-700 text-sm border border-violet-100 flex items-center">
                            <span className="mr-2 text-lg">🧴</span> {med}
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Home Remedies</h3>
                <ul className="space-y-3">
                    {result.homeRemedies.map((rem, i) => (
                        <li key={i} className="flex items-start">
                            <span className="w-1.5 h-1.5 bg-teal-400 rounded-full mt-2 mr-3 shrink-0"></span>
                            <span className="text-slate-700 text-sm font-medium">{rem}</span>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="bg-rose-50 p-6 rounded-[2.5rem] border border-rose-100">
                 <h3 className="text-xs font-black text-rose-400 uppercase tracking-widest mb-2">When to see a Doctor</h3>
                 <p className="text-slate-800 font-bold text-sm leading-relaxed">{result.whenToSeeDoctor}</p>
            </div>

            <div className="text-[10px] text-slate-400 text-center font-bold uppercase tracking-widest leading-relaxed px-4 pt-4 pb-10">
                {result.disclaimer}
            </div>
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative overflow-hidden">
        <input type="file" ref={cameraInputRef} accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
        <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFileChange} className="hidden" />

        <div className="absolute top-0 left-0 w-full h-[50vh] bg-violet-600 rounded-b-[4rem] z-0 overflow-hidden">
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
             <div className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
             <div className="absolute bottom-10 left-10 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 px-6 pt-12 pb-6 flex-1 flex flex-col">
            <button onClick={onBack} className="text-white/60 hover:text-white font-bold flex items-center mb-8 w-fit transition-colors">
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                Home
            </button>

            <div className="text-white mb-10">
                <h1 className="text-4xl font-black tracking-tighter mb-2">Derma-Scan</h1>
                <p className="text-violet-200 font-medium">AI Skin Assistant</p>
            </div>

            <div className="bg-white rounded-[3rem] shadow-2xl shadow-violet-900/20 flex-1 flex flex-col items-center justify-center p-8 relative overflow-hidden">
                {analyzing ? (
                     <div className="text-center">
                         <div className="w-32 h-32 bg-violet-50 rounded-full flex items-center justify-center relative mb-6 mx-auto">
                             <div className="absolute inset-0 border-4 border-violet-500 rounded-full border-t-transparent animate-spin"></div>
                             <span className="text-4xl">🔍</span>
                         </div>
                         <h3 className="text-xl font-black text-slate-900 tracking-tight animate-pulse">Analyzing Skin...</h3>
                         <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Checking texture & color</p>
                     </div>
                ) : image ? (
                    <div className="w-full flex flex-col items-center h-full">
                        <img src={image} alt="Preview" className="w-64 h-64 object-cover rounded-[2rem] shadow-lg mb-8 border-4 border-slate-50" />
                        <button onClick={startAnalysis} className="w-full bg-violet-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl hover:scale-105 transition-all active:scale-95">
                            Identify Condition ⚡
                        </button>
                        <button onClick={() => setImage(null)} className="mt-4 text-slate-400 font-bold text-xs uppercase tracking-widest">Retake Photo</button>
                    </div>
                ) : (
                    <div className="text-center w-full space-y-6">
                        <div className="w-24 h-24 bg-violet-50 rounded-[2rem] flex items-center justify-center mx-auto text-4xl text-violet-500 shadow-inner">
                            🧬
                        </div>
                        <div>
                            <p className="text-slate-900 font-bold text-lg mb-1">Upload a photo</p>
                            <p className="text-slate-400 text-xs px-8 leading-relaxed">Take a clear photo of the rash, pimple, or mark for AI analysis.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 w-full pt-4">
                            <button onClick={() => checkOnline() && cameraInputRef.current?.click()} className="bg-slate-900 text-white py-4 rounded-2xl font-bold text-sm shadow-lg hover:bg-slate-800 transition-colors">
                                Camera 📸
                            </button>
                            <button onClick={() => checkOnline() && fileInputRef.current?.click()} className="bg-white border-2 border-slate-100 text-slate-600 py-4 rounded-2xl font-bold text-sm hover:border-violet-200 hover:text-violet-600 transition-colors">
                                Gallery 🖼️
                            </button>
                        </div>
                    </div>
                )}
            </div>
            
            <p className="text-center text-[10px] text-white/40 font-bold uppercase tracking-widest mt-6">Not a medical diagnosis tool.</p>
        </div>
    </div>
  );
};

export default DermaScanner;
