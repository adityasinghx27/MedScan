
import React, { useState, useEffect } from 'react';
import Scanner from './components/Scanner';
import MedicineResult from './components/MedicineResult';
import Reminders from './components/Reminders';
import History from './components/History';
import DoctorAI from './components/DoctorAI';
import PremiumModal from './components/PremiumModal';
import Profile from './components/Profile';
import LegalAndHelp from './components/LegalAndHelp';
import AlarmRingingModal from './components/AlarmRingingModal';
import { MedicineData, AppView, Reminder, PatientProfile, ScanHistoryItem } from './types';
import { getHealthTip } from './services/geminiService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.HOME);
  const [scannedData, setScannedData] = useState<MedicineData | null>(null);
  const [patientProfile, setPatientProfile] = useState<PatientProfile | undefined>(undefined);
  
  const [isPremium, setIsPremium] = useState<boolean>(() => {
    try {
      return localStorage.getItem('mediScan_premium') === 'true';
    } catch {
      return false;
    }
  });
  
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [healthTip, setHealthTip] = useState<string>("");
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);
  const [isPreviouslyScanned, setIsPreviouslyScanned] = useState(false);
  const [overdoseWarning, setOverdoseWarning] = useState(false);
  const [activeAlarm, setActiveAlarm] = useState<Reminder | null>(null);
  
  useEffect(() => {
    try {
      if (!localStorage.getItem('mediScan_deviceId')) {
          localStorage.setItem('mediScan_deviceId', crypto.randomUUID());
      }
      const savedReminders = localStorage.getItem('mediScan_reminders');
      if (savedReminders) setReminders(JSON.parse(savedReminders));
      const savedHistory = localStorage.getItem('mediScan_history');
      if (savedHistory) setScanHistory(JSON.parse(savedHistory));
      getHealthTip().then(setHealthTip).catch(() => setHealthTip("Stay hydrated and check expiry dates."));
    } catch (e) {
      console.error("Initialization error", e);
    }

    // Alarm Check Logic
    const interval = setInterval(() => {
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        const triggered = reminders.find(r => r.active && r.time === currentTime && (!r.snoozedUntil || Date.now() >= r.snoozedUntil));
        if (triggered && !activeAlarm) {
            setActiveAlarm(triggered);
        }
    }, 10000);

    return () => clearInterval(interval);
  }, [reminders, activeAlarm]);

  useEffect(() => {
    localStorage.setItem('mediScan_reminders', JSON.stringify(reminders));
  }, [reminders]);

  useEffect(() => {
    localStorage.setItem('mediScan_history', JSON.stringify(scanHistory));
  }, [scanHistory]);

  const handleUpgrade = (txnId?: string) => {
    setIsPremium(true);
    localStorage.setItem('mediScan_premium', 'true');
    if (txnId) localStorage.setItem('mediScan_txnId', txnId);
    setShowPremiumModal(false);
    setCurrentView(AppView.PROFILE);
  };

  const addReminder = (r: Reminder) => setReminders(prev => [...prev, r]);
  const deleteReminder = (id: string) => setReminders(prev => prev.filter(r => r.id !== id));
  const toggleReminder = (id: string) => setReminders(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r));
  
  const handleScanComplete = (data: MedicineData, profile: PatientProfile) => {
    const now = Date.now();
    const fourHours = 4 * 60 * 60 * 1000;
    const recentScan = scanHistory.find(item => {
        const isSameMed = item.medicineName.toLowerCase().trim() === data.name.toLowerCase().trim();
        const isRecent = (now - item.timestamp) < fourHours;
        return isSameMed && isRecent;
    });
    setIsPreviouslyScanned(scanHistory.some(item => item.medicineName.toLowerCase().trim() === data.name.toLowerCase().trim()));
    setOverdoseWarning(!!recentScan);
    setScanHistory(prev => [{ id: crypto.randomUUID(), timestamp: now, medicineName: data.name, data }, ...prev].slice(0, 20));
    setScannedData(data);
    setPatientProfile(profile);
  };

  const renderContent = () => {
    if (scannedData) {
      return <MedicineResult data={scannedData} profile={patientProfile} isPremium={isPremium} isPreviouslyScanned={isPreviouslyScanned} overdoseWarning={overdoseWarning} onOpenPremium={() => setShowPremiumModal(true)} onClose={() => setScannedData(null)} />;
    }

    switch (currentView) {
      case AppView.HOME:
      case AppView.SCANNER:
        return (
          <div className="bg-slate-50 min-h-screen">
            {/* Sticky Header with Solid Background */}
            <header className="sticky top-0 z-50 bg-slate-50 px-6 pt-10 pb-4 flex justify-between items-center shadow-sm border-b border-slate-100/50">
               <div className="group cursor-default">
                   <div className="flex items-center space-x-2.5">
                       <h1 className="text-4xl font-extrabold tracking-tighter bg-gradient-to-br from-slate-900 via-teal-800 to-slate-800 bg-clip-text text-transparent">MedScan</h1>
                       <div className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-heartbeat shadow-[0_0_12px_rgba(244,63,94,0.6)]"></div>
                   </div>
                   <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 ml-0.5 mt-1.5 opacity-60">AI Health Companion</p>
               </div>
               <button onClick={() => setCurrentView(AppView.INFO)} className="w-11 h-11 bg-white flex items-center justify-center rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-50 text-slate-400 hover:text-teal-600 transition-all active:scale-90">
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               </button>
            </header>
            
            <div className="px-6 pb-32 pt-6 max-w-lg mx-auto">
                {healthTip && (
                     <div className="mb-10 p-6 bg-white border border-teal-50/50 rounded-[2.5rem] flex items-start shadow-xl shadow-teal-900/5 animate-slide-up hover:shadow-teal-900/10 transition-shadow">
                        <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center mr-4 shrink-0 text-2xl shadow-inner">💊</div>
                        <div>
                            <h4 className="text-[10px] font-black text-teal-600/70 uppercase tracking-widest mb-1.5">Smart Tip</h4>
                            <span className="text-sm text-slate-700 font-bold leading-relaxed">{healthTip}</span>
                        </div>
                     </div>
                )}

                <Scanner onScanComplete={handleScanComplete} onError={(msg) => alert(msg)} />
                
                {!isPremium && (
                    <div onClick={() => setShowPremiumModal(true)} className="mt-10 bg-slate-900 text-white p-7 rounded-[3rem] shadow-2xl shadow-slate-900/20 flex justify-between items-center cursor-pointer transform transition-all hover:translate-y-[-2px] active:scale-95 group relative overflow-hidden border border-slate-800">
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 z-0"></div>
                        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white opacity-[0.05] rounded-full blur-3xl group-hover:opacity-10 transition-opacity"></div>
                        <div className="relative z-10 text-left">
                            <h3 className="font-extrabold text-xl flex items-center tracking-tight">Expert Insights <span className="ml-2">💎</span></h3>
                            <p className="text-[10px] text-slate-500 mt-1 font-black uppercase tracking-widest opacity-80">Unlock Detailed Safety Reports</p>
                        </div>
                        <div className="relative z-10 bg-white text-slate-900 px-6 py-3 rounded-2xl font-black text-xs shadow-xl tracking-widest uppercase">₹99</div>
                    </div>
                )}
            </div>
          </div>
        );
      case AppView.REMINDERS:
        return <div className="pb-24 bg-slate-50 min-h-screen"><Reminders reminders={reminders} addReminder={addReminder} deleteReminder={deleteReminder} toggleReminder={toggleReminder} /></div>;
      case AppView.HISTORY:
        return <div className="pb-24 bg-slate-50 min-h-screen"><History history={scanHistory} onSelectItem={(data) => { setScannedData(data); setOverdoseWarning(false); setIsPreviouslyScanned(true); }} onClearHistory={() => setScanHistory([])} /></div>;
      case AppView.DOCTOR_AI:
        return <DoctorAI />;
      case AppView.INFO:
          return <div className="pb-24 bg-slate-50 min-h-screen"><LegalAndHelp /></div>;
      case AppView.PROFILE:
          return <div className="pb-24 bg-slate-50 min-h-screen"><Profile isPremium={isPremium} /></div>;
      default:
        return <div className="p-10 text-center">View not found</div>;
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen relative shadow-2xl overflow-hidden font-sans text-slate-800 bg-slate-50">
      <main className="min-h-screen relative z-10 overflow-y-auto hide-scrollbar bg-slate-50">
        {renderContent()}
      </main>

      {activeAlarm && (
          <AlarmRingingModal 
            reminder={activeAlarm} 
            onTake={() => { setActiveAlarm(null); toggleReminder(activeAlarm.id); }}
            onSnooze={(mins) => { setActiveAlarm(null); }}
            onSkip={() => { setActiveAlarm(null); }}
          />
      )}

      {!scannedData && !activeAlarm && (
        // FULL WIDTH SOLID BOTTOM BAR - Fixes transparency issues
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-[100] bg-white border-t border-slate-100 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] pb-safe">
            <nav className="flex justify-around items-center px-2 py-3">
                {[
                    { view: AppView.HOME, icon: "M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M15 13a3 3 0 11-6 0 3 3 0 016 0z", label: "Scan" },
                    { view: AppView.REMINDERS, icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", label: "Alarms" },
                    { view: AppView.DOCTOR_AI, icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", label: "Doctor" },
                    { view: AppView.HISTORY, icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", label: "History" },
                    { view: AppView.PROFILE, icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", label: "Pro" }
                ].map((item) => {
                    const isActive = currentView === item.view || (item.view === AppView.HOME && currentView === AppView.SCANNER);
                    return (
                        <button key={item.label} onClick={() => (item.view === AppView.PROFILE && !isPremium) ? setShowPremiumModal(true) : setCurrentView(item.view)} className={`flex flex-col items-center justify-center w-16 py-1 rounded-xl transition-all duration-300 ${isActive ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>
                            <div className={`mb-1 transition-all duration-300 ${isActive ? 'bg-slate-900 text-white p-2.5 rounded-2xl shadow-lg' : ''}`}>
                                <svg className={`w-6 h-6 ${isActive ? 'stroke-2' : 'stroke-[1.5]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d={
                                    item.view === AppView.DOCTOR_AI ? "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" : 
                                    item.view === AppView.HISTORY ? "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" : 
                                    item.icon
                                } />
                                </svg>
                            </div>
                            <span className={`text-[10px] font-bold tracking-tight ${isActive ? 'font-black' : 'font-medium'}`}>{item.label}</span>
                        </button>
                    );
                })}
            </nav>
        </div>
      )}
      <PremiumModal isOpen={showPremiumModal} onClose={() => setShowPremiumModal(false)} onUpgrade={handleUpgrade} />
    </div>
  );
};

export default App;
