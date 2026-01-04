import React, { useState, useEffect } from 'react';

interface IntroFlowProps {
  onComplete: () => void;
}

const IntroFlow: React.FC<IntroFlowProps> = ({ onComplete }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  // Pre-load images or assets if necessary, currently using CSS shapes
  
  const slides = [
    {
      title: "Welcome to MediIQ",
      text: "MediIQ helps you understand medicines safely using AI. Scan medicines, check side effects, and get clear information instantly.",
      icon: (
        <div className="relative">
             <div className="w-36 h-36 bg-gradient-to-br from-teal-400 to-emerald-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-teal-500/30 relative z-10">
                <svg className="w-16 h-16 text-white drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             </div>
             {/* Decorative Elements */}
             <div className="absolute -top-4 -right-4 w-12 h-12 bg-teal-200 rounded-full blur-xl opacity-60 animate-pulse"></div>
             <div className="absolute -bottom-2 -left-2 w-16 h-16 bg-emerald-200 rounded-full blur-xl opacity-60 animate-pulse delay-700"></div>
        </div>
      ),
    },
    {
      title: "Smart Medicine Scan",
      text: "Scan or upload a medicine photo to see its uses, side effects, safety warnings, and general dosage information.",
      icon: (
        <div className="relative">
             <div className="w-36 h-36 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-indigo-500/30 relative z-10">
                <svg className="w-16 h-16 text-white drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
             </div>
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-1 bg-white/20 rotate-45 blur-md"></div>
        </div>
      ),
    },
    {
      title: "AI Doctor & Reminders",
      text: "Ask health questions, set medicine reminders, and keep track of your medicine history in one place.",
      icon: (
        <div className="relative">
            <div className="w-36 h-36 bg-gradient-to-br from-rose-400 to-orange-500 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-rose-500/30 relative z-10">
              <svg className="w-16 h-16 text-white drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div className="absolute -right-6 top-10 bg-white p-2 rounded-xl shadow-lg animate-bounce delay-1000">
                <span className="text-xl">🔔</span>
            </div>
        </div>
      ),
    }
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      finish();
    }
  };

  const finish = () => {
    setIsExiting(true);
    setTimeout(onComplete, 600);
  };

  return (
    <div className={`fixed inset-0 z-[9999] bg-slate-50 flex flex-col justify-between overflow-hidden transition-all duration-700 ${isExiting ? 'opacity-0 scale-105' : 'opacity-100 scale-100'}`}>
      
      {/* CSS Keyframes */}
      <style>{`
        @keyframes float { 
            0%, 100% { transform: translateY(0px); } 
            50% { transform: translateY(-12px); } 
        }
        @keyframes panBg { 
            0% { transform: scale(1) translate(0, 0); } 
            100% { transform: scale(1.15) translate(-5%, -5%); } 
        }
        @keyframes slideInUpShort {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Mock App Background (Blurred Preview) */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none">
         {/* White mist overlay to fade content into background */}
         <div className="absolute inset-0 bg-slate-50/90 z-10 backdrop-blur-[2px]"></div>
         
         {/* Moving Mock UI */}
         <div className="w-[120%] h-[120%] -ml-[10%] -mt-[10%] bg-slate-100 flex flex-col items-center pt-24 px-8 space-y-8 opacity-40 blur-md animate-[panBg_25s_ease-in-out_infinite_alternate]">
             {/* Mock Header */}
             <div className="w-full flex justify-between items-center opacity-50">
                 <div className="w-32 h-8 bg-slate-300 rounded-full"></div>
                 <div className="w-10 h-10 bg-slate-300 rounded-xl"></div>
             </div>
             
             {/* Mock Scanner Circle (Centerpiece) */}
             <div className="w-64 h-80 bg-white rounded-[3rem] border-4 border-slate-200 shadow-xl flex items-center justify-center relative overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-br from-teal-50 to-slate-50"></div>
                 <div className="w-40 h-40 border-4 border-teal-100 rounded-full"></div>
             </div>
             
             {/* Mock Cards */}
             <div className="w-full space-y-4">
                 <div className="h-24 bg-white rounded-[2rem] border border-slate-200 w-full shadow-sm"></div>
                 <div className="h-24 bg-white rounded-[2rem] border border-slate-200 w-full shadow-sm"></div>
                 <div className="h-24 bg-white rounded-[2rem] border border-slate-200 w-full shadow-sm"></div>
             </div>
         </div>
      </div>

      {/* Top Bar */}
      <div className="p-8 flex justify-end relative z-20">
        <button 
            onClick={finish}
            className={`text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-slate-800 transition-all px-4 py-2 ${currentSlide === slides.length - 1 ? 'opacity-0 pointer-events-none duration-300' : 'opacity-100 duration-300'}`}
        >
            Skip
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 relative z-20 pb-10">
        <div key={currentSlide} className="flex flex-col items-center w-full">
            {/* Icon Container */}
            <div className="mb-12 animate-[float_5s_ease-in-out_infinite]">
                 <div className="animate-[slideInUpShort_0.6s_cubic-bezier(0.2,0.8,0.2,1)_forwards]">
                    {slides[currentSlide].icon}
                 </div>
            </div>

            {/* Text Content */}
            <div className="text-center space-y-5 max-w-xs">
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter leading-tight opacity-0 animate-[slideInUpShort_0.7s_ease-out_0.15s_forwards]">
                {slides[currentSlide].title}
              </h2>
              <p className="text-slate-500 font-medium text-sm leading-relaxed opacity-0 animate-[slideInUpShort_0.7s_ease-out_0.3s_forwards]">
                {slides[currentSlide].text}
              </p>
            </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="p-8 pb-12 relative z-20">
        {/* Pagination Dots */}
        <div className="flex justify-center space-x-3 mb-10">
            {slides.map((_, idx) => (
                <div 
                    key={idx} 
                    className={`h-2 rounded-full transition-all duration-500 ease-out ${idx === currentSlide ? 'w-8 bg-slate-900 shadow-md scale-100' : 'w-2 bg-slate-300 scale-90'}`}
                ></div>
            ))}
        </div>

        {/* Primary Button */}
        <button 
            onClick={handleNext}
            className="w-full group bg-slate-900 text-white py-6 rounded-[2.5rem] font-black text-lg shadow-xl shadow-slate-900/20 active:scale-[0.98] active:shadow-none transition-all duration-300 flex items-center justify-center space-x-3 overflow-hidden relative"
        >
            {/* Subtle glow effect on hover */}
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            
            <span className="relative z-10">{currentSlide === slides.length - 1 ? "Get Started" : "Next"}</span>
            {currentSlide === slides.length - 1 ? (
                <span className="text-xl relative z-10 group-hover:translate-x-1 transition-transform">🚀</span>
            ) : (
                <svg className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            )}
        </button>
      </div>
    </div>
  );
};

export default IntroFlow;