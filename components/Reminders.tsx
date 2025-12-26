import React, { useState } from 'react';
import { Reminder, FoodContext, RepeatType, SoundType, VoiceTone } from '../types';

interface RemindersProps {
  reminders: Reminder[];
  addReminder: (r: Reminder) => void;
  deleteReminder: (id: string) => void;
  toggleReminder: (id: string) => void;
}

const Reminders: React.FC<RemindersProps> = ({ reminders, addReminder, deleteReminder, toggleReminder }) => {
  const [showForm, setShowForm] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [time, setTime] = useState('');
  const [foodContext, setFoodContext] = useState<FoodContext>('after_food');
  const [repeat, setRepeat] = useState<RepeatType>('daily');
  const [customDays, setCustomDays] = useState<number[]>([]); 
  const [soundType, setSoundType] = useState<SoundType>('default');
  const [voiceTone, setVoiceTone] = useState<VoiceTone>('normal');

  const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const toggleDay = (idx: number) => {
      setCustomDays(prev => prev.includes(idx) ? prev.filter(d => d !== idx) : [...prev, idx]);
  };

  const previewSound = (type: SoundType, tone?: VoiceTone) => {
      if (type === 'voice') {
          window.speechSynthesis.cancel();
          let text = "It's time to take your medicine.";
          if (tone === 'strict') text = "Please take your medicine now.";
          if (tone === 'friendly') text = "Hey! Don't forget your medicine.";
          if (tone === 'hindi') text = "Dawai lene ka time ho gaya hai.";
          const u = new SpeechSynthesisUtterance(text);
          if (tone === 'hindi') u.lang = 'hi-IN';
          window.speechSynthesis.speak(u);
      } else {
           try {
               const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
               const ctx = new AudioContext();
               const osc = ctx.createOscillator();
               const gain = ctx.createGain();
               osc.connect(gain);
               gain.connect(ctx.destination);
               if (type === 'soft') { osc.type = 'sine'; osc.frequency.setValueAtTime(300, ctx.currentTime); } 
               else if (type === 'loud') { osc.type = 'sawtooth'; osc.frequency.setValueAtTime(800, ctx.currentTime); } 
               else { osc.type = 'square'; osc.frequency.setValueAtTime(440, ctx.currentTime); }
               osc.start(); osc.stop(ctx.currentTime + 0.3);
           } catch (e) {}
      }
  };

  const handleSoundSelect = (type: SoundType) => { setSoundType(type); previewSound(type, voiceTone); };
  const handleToneSelect = (tone: VoiceTone) => { setVoiceTone(tone); previewSound('voice', tone); }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !time || !dose) return;
    if (repeat === 'custom' && customDays.length === 0) { alert("Select days"); return; }

    addReminder({
      id: Date.now().toString(),
      medicineName: name,
      dose: dose,
      time: time,
      foodContext: foodContext,
      repeat: repeat,
      customDays: repeat === 'custom' ? customDays : [],
      soundType: soundType,
      voiceTone: soundType === 'voice' ? voiceTone : undefined,
      active: true,
      snoozedUntil: null,
      createdAt: Date.now()
    });

    setName(''); setDose(''); setTime(''); setFoodContext('after_food'); setRepeat('daily'); setCustomDays([]); setSoundType('default'); setVoiceTone('normal'); setShowForm(false);
  };

  return (
    <div className="p-6 pb-32 animate-fade-in-up">
      <div className="flex justify-between items-center mb-8">
        <div>
            <h2 className="text-2xl font-bold text-gray-900">Alarms</h2>
            <p className="text-gray-400 text-xs font-medium">{reminders.length} Active Reminders</p>
        </div>
        <button 
            onClick={() => setShowForm(!showForm)}
            className="bg-black text-white px-6 py-3 rounded-2xl shadow-lg shadow-gray-400/20 hover:scale-105 transition-transform font-bold text-sm flex items-center"
        >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add New
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-[2rem] shadow-2xl border border-gray-100 mb-8 space-y-5 animate-fade-in-down">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Medicine</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Paracetamol" required className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-teal-500 font-semibold" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Dose</label>
                    <input type="text" value={dose} onChange={(e) => setDose(e.target.value)} placeholder="1 Tablet" required className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-teal-500 font-semibold" />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Time</label>
                    <input type="time" value={time} onChange={(e) => setTime(e.target.value)} required className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-teal-500 font-mono font-bold text-lg" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Condition</label>
                    <select value={foodContext} onChange={(e) => setFoodContext(e.target.value as FoodContext)} className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-teal-500 font-semibold text-sm">
                        <option value="before_food">Before Food 🍎</option>
                        <option value="after_food">After Food 🥣</option>
                        <option value="empty_stomach">Empty Stomach 🚫</option>
                        <option value="any">Anytime 🤷</option>
                    </select>
                </div>
            </div>

            <div>
                 <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Frequency</label>
                 <div className="flex bg-gray-100 p-1 rounded-xl mb-3">
                     {['daily', 'alternate', 'custom'].map((r) => (
                         <button key={r} type="button" onClick={() => setRepeat(r as RepeatType)} className={`flex-1 py-2 text-xs font-bold rounded-lg capitalize transition-all ${repeat === r ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-500'}`}>{r}</button>
                     ))}
                 </div>
                 {repeat === 'custom' && (
                     <div className="flex justify-between px-2">
                         {DAYS.map((d, i) => (
                             <button key={i} type="button" onClick={() => toggleDay(i)} className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center transition-all ${customDays.includes(i) ? 'bg-teal-500 text-white shadow-md' : 'bg-gray-100 text-gray-400'}`}>{d}</button>
                         ))}
                     </div>
                 )}
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Alert Sound</label>
                <div className="grid grid-cols-4 gap-2 mb-3">
                     {(['default', 'soft', 'loud', 'voice'] as SoundType[]).map(s => (
                         <button key={s} type="button" onClick={() => handleSoundSelect(s)} className={`py-2 text-xs font-bold rounded-xl border transition-all capitalize ${soundType === s ? 'bg-teal-50 border-teal-500 text-teal-700' : 'border-gray-200 text-gray-500'}`}>{s}</button>
                     ))}
                </div>
                {soundType === 'voice' && (
                    <div className="bg-teal-50/50 p-3 rounded-xl border border-teal-100">
                        <div className="flex space-x-2">
                             {(['normal', 'strict', 'friendly', 'hindi'] as VoiceTone[]).map(t => (
                                 <button key={t} type="button" onClick={() => handleToneSelect(t)} className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg capitalize transition-all ${voiceTone === t ? 'bg-teal-600 text-white shadow-md' : 'bg-white text-gray-500 border border-gray-200'}`}>{t}</button>
                             ))}
                        </div>
                    </div>
                )}
            </div>

            <button type="submit" className="w-full bg-teal-600 text-white py-4 rounded-xl font-bold shadow-xl shadow-teal-600/30 hover:scale-[1.02] transition-all">Set Alarm</button>
        </form>
      )}

      <div className="space-y-4">
            {reminders.map(rem => (
                <div key={rem.id} className={`p-5 rounded-[1.5rem] border transition-all duration-300 relative overflow-hidden group ${rem.active ? 'bg-white border-teal-100 shadow-lg shadow-teal-900/5' : 'bg-gray-50 border-transparent opacity-75'}`}>
                    <div className="flex justify-between items-center relative z-10">
                        <div className="flex items-center space-x-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-mono font-bold text-lg shadow-inner ${rem.active ? 'bg-teal-50 text-teal-600' : 'bg-gray-200 text-gray-500'}`}>
                                {rem.time}
                            </div>
                            <div>
                                <h3 className={`font-bold text-lg leading-tight ${rem.active ? 'text-gray-900' : 'text-gray-500'}`}>{rem.medicineName}</h3>
                                <p className="text-xs text-gray-400 font-medium">{rem.dose} • {rem.foodContext.replace('_', ' ')}</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                             <button onClick={() => toggleReminder(rem.id)} className={`w-12 h-7 rounded-full p-1 transition-all duration-300 ${rem.active ? 'bg-teal-500' : 'bg-gray-300'}`}>
                                <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${rem.active ? 'translate-x-5' : ''}`}></div>
                            </button>
                            <button onClick={() => deleteReminder(rem.id)} className="text-gray-300 hover:text-red-400 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </div>
                    </div>
                </div>
            ))}
            {reminders.length === 0 && (
                <div className="text-center py-20">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <p className="text-gray-400 font-medium">No active alarms.</p>
                </div>
            )}
      </div>
    </div>
  );
};

export default Reminders;