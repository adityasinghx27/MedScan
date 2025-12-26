import React, { useState, useEffect } from 'react';
import Scanner from './components/Scanner';
import MedicineResult from './components/MedicineResult';
import Reminders from './components/Reminders';
import PremiumModal from './components/PremiumModal';
import AlarmRingingModal from './components/AlarmRingingModal';
import LegalAndHelp from './components/LegalAndHelp';
import { MedicineData, AppView, Reminder, PatientProfile } from './types';
import { getHealthTip } from './services/geminiService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.HOME);
  const [scannedData, setScannedData] = useState<MedicineData | null>(null);
  const [patientProfile, setPatientProfile] = useState<PatientProfile | undefined>(undefined);
  
  const [isPremium, setIsPremium] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [healthTip, setHealthTip] = useState<string>("");
  
  // Alarm State
  const [ringingReminder, setRingingReminder] = useState<Reminder | null>(null);
  const [missedAlarm, setMissedAlarm] = useState<string | null>(null);

  // Load state
  useEffect(() => {
    const savedPremium = localStorage.getItem('mediScan_premium');
    if (savedPremium === 'true') setIsPremium(true);

    const savedReminders = localStorage.getItem('mediScan_reminders');
    if (savedReminders) setReminders(JSON.parse(savedReminders));
    
    // Check alarms frequently
    const interval = setInterval(checkAlarms, 10000);
    getHealthTip().then(setHealthTip);
    return () => clearInterval(interval);
  }, []);

  // Save reminders
  useEffect(() => {
    localStorage.setItem('mediScan_reminders', JSON.stringify(reminders));
  }, [reminders]);

  // Remove missed alarm toast after 5s
  useEffect(() => {
      if (missedAlarm) {
          const timer = setTimeout(() => setMissedAlarm(null), 5000);
          return () => clearTimeout(timer);
      }
  }, [missedAlarm]);

  const checkAlarms = () => {
    if (ringingReminder) return;

    const now = new Date();
    const currentHours = String(now.getHours()).padStart(2, '0');
    const currentMinutes = String(now.getMinutes()).padStart(2, '0');
    const currentTime = `${currentHours}:${currentMinutes}`;
    const currentDay = now.getDay();

    reminders.forEach(rem => {
        if (!rem.active) return;
        if (rem.snoozedUntil) {
            if (Date.now() >= rem.snoozedUntil) triggerAlarm(rem);
            return;
        }
        if (rem.time === currentTime) {
            let shouldRing = false;
            if (rem.repeat === 'daily') shouldRing = true;
            else if (rem.repeat === 'custom' && rem.customDays.includes(currentDay)) shouldRing = true;
            else if (rem.repeat === 'alternate') {
                const oneDay = 24 * 60 * 60 * 1000;
                const daysSinceCreation = Math.floor((Date.now() - rem.createdAt) / oneDay);
                if (daysSinceCreation % 2 === 0) shouldRing = true;
            }
            if (shouldRing) triggerAlarm(rem);
        }
    });
  };

  const triggerAlarm = (rem: Reminder) => {
      setRingingReminder(rem);
      if (rem.snoozedUntil) updateReminder(rem.id, { snoozedUntil: null });
  };

  const updateReminder = (id: string, updates: Partial<Reminder>) => {
      setReminders(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const handleTakeMedicine = () => setRingingReminder(null);
  const handleSnooze = (minutes: number) => {
      if (!ringingReminder) return;
      const snoozeTime = Date.now() + (minutes * 60 * 1000);
      updateReminder(ringingReminder.id, { snoozedUntil: snoozeTime });
      setRingingReminder(null);
  };
  const handleSkip = () => {
      if (!ringingReminder) return;
      setMissedAlarm(`Skipped: ${ringingReminder.medicineName}`);
      setRingingReminder(null);
  };

  const handleUpgrade = () => {
    setIsPremium(true);
    localStorage.setItem('mediScan_premium', 'true');
    setShowPremiumModal(false);
  };

  const addReminder = (r: Reminder) => setReminders([...reminders, r]);
  const deleteReminder = (id: string) => setReminders(reminders.filter(r => r.id !== id));
  const toggleReminder = (id: string) => setReminders(reminders.map(r => r.id === id ? { ...r, active: !r.active } : r));
  const handleScanComplete = (data: MedicineData, profile: PatientProfile) => {
    setScannedData(data);
    setPatientProfile(profile);
  };

  const renderContent = () => {
    if (scannedData) {
      return (
        <MedicineResult 
          data={scannedData} 
          profile={patientProfile}
          isPremium={isPremium} 
          onOpenPremium={() => setShowPremiumModal(true)}
          onClose={() => setScannedData(null)}
        />
      );
    }

    switch (currentView) {
      case AppView.HOME:
      case AppView.SCANNER:
        return (
          <div className="p-6 pb-32">
            <header className="mb-6 flex justify-between items-center animate-fade-in-down">
               <div>
                   <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">MediScan <span className="text-teal-500">AI</span></h1>
                   <p className="text-gray-500 text-sm font-medium">Your pocket pharmacist</p>
               </div>
               <button onClick={() => setCurrentView(AppView.INFO)} className="bg-white p-2.5 rounded-full shadow-sm border border-gray-100 text-gray-500 hover:text-teal-600 transition-colors">
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               </button>
            </header>
            
            {healthTip && (
                 <div className="mb-8 p-4 bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100 rounded-2xl flex items-start shadow-sm animate-fade-in-down" style={{animationDelay: '0.1s'}}>
                    <span className="mr-3 text-2xl">💡</span>
                    <span className="text-sm text-teal-900 font-medium leading-relaxed">{healthTip}</span>
                 </div>
            )}

            <Scanner 
              onScanComplete={handleScanComplete} 
              onError={(msg) => alert(msg)} 
            />
            
            {!isPremium && (
                <div 
                    onClick={() => setShowPremiumModal(true)}
                    className="mt-8 bg-gray-900 text-white p-6 rounded-3xl shadow-xl flex justify-between items-center cursor-pointer transform transition-all hover:scale-[1.02] active:scale-95 group relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-900 z-0"></div>
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-5 rounded-full blur-xl"></div>
                    
                    <div className="relative z-10">
                        <h3 className="font-bold text-lg group-hover:text-yellow-300 transition-colors">Go Premium 👑</h3>
                        <p className="text-xs text-gray-400 mt-1">Unlock Side Effects & Voices</p>
                    </div>
                    <div className="relative z-10 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg">
                        ₹49
                    </div>
                </div>
            )}
          </div>
        );
      case AppView.REMINDERS:
        return (
          <Reminders 
            reminders={reminders} 
            addReminder={addReminder} 
            deleteReminder={deleteReminder}
            toggleReminder={toggleReminder}
          />
        );
      case AppView.INFO:
          return <LegalAndHelp />;
      default:
        return <div>View not found</div>;
    }
  };

  return (
    <div className="max-w-md mx-auto bg-slate-50 min-h-screen relative shadow-2xl overflow-hidden">
      {/* Background decoration */}
      <div className="fixed top-0 left-0 w-full h-96 bg-gradient-to-b from-teal-50/50 to-transparent pointer-events-none z-0"></div>
      
      {/* Missed Alarm Toast */}
      {missedAlarm && (
          <div className="absolute top-6 left-4 right-4 bg-red-500 text-white p-4 rounded-2xl shadow-2xl z-[110] animate-bounce flex items-center">
              <span className="text-2xl mr-4">⚠️</span>
              <div>
                  <h4 className="font-bold text-base">Dose Missed</h4>
                  <p className="text-xs opacity-90">{missedAlarm}</p>
              </div>
          </div>
      )}

      {ringingReminder && (
          <AlarmRingingModal 
            reminder={ringingReminder}
            onTake={handleTakeMedicine}
            onSnooze={handleSnooze}
            onSkip={handleSkip}
          />
      )}

      <main className="min-h-screen relative z-10">
        {renderContent()}
      </main>

      {!scannedData && (
        <nav className="fixed bottom-6 left-6 right-6 max-w-[calc(28rem-3rem)] mx-auto glass rounded-2xl shadow-2xl shadow-teal-900/10 px-6 py-4 flex justify-around items-center z-40 transform transition-transform">
            <button 
                onClick={() => setCurrentView(AppView.HOME)}
                className={`flex flex-col items-center space-y-1 transition-all duration-300 ${currentView === AppView.HOME || currentView === AppView.SCANNER ? 'text-teal-600 scale-110' : 'text-gray-400 hover:text-gray-600'}`}
            >
                {currentView === AppView.HOME || currentView === AppView.SCANNER ? (
                    <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                )}
                <span className="text-[10px] font-bold tracking-wide">Scan</span>
            </button>

            <button 
                onClick={() => setCurrentView(AppView.REMINDERS)}
                className={`flex flex-col items-center space-y-1 transition-all duration-300 ${currentView === AppView.REMINDERS ? 'text-teal-600 scale-110' : 'text-gray-400 hover:text-gray-600'}`}
            >
                {currentView === AppView.REMINDERS ? (
                    <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25-3 8.2-3 9v1h18v-1c0-.8-3-3.75-3-9 0-3.87-3.13-7-7-7z" /></svg>
                ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                )}
                <span className="text-[10px] font-bold tracking-wide">Alarms</span>
            </button>

            <button 
                onClick={() => setShowPremiumModal(true)}
                className={`flex flex-col items-center space-y-1 transition-all duration-300 ${isPremium ? 'text-yellow-500 scale-110' : 'text-gray-400 hover:text-gray-600'}`}
            >
                {isPremium ? (
                     <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                ) : (
                     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                )}
                <span className="text-[10px] font-bold tracking-wide">{isPremium ? 'Premium' : 'Upgrade'}</span>
            </button>
        </nav>
      )}

      <PremiumModal 
        isOpen={showPremiumModal} 
        onClose={() => setShowPremiumModal(false)} 
        onUpgrade={handleUpgrade}
      />
    </div>
  );
};

export default App;