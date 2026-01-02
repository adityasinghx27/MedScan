import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Reminder, FoodContext, RepeatType, SoundType, VoiceTone, VoiceGender } from '../types';

interface RemindersProps {
  reminders: Reminder[];
  addReminder: (r: Reminder) => void;
  updateReminder: (r: Reminder) => void;
  deleteReminder: (id: string) => void;
  toggleReminder: (id: string) => void;
  notificationPermission: NotificationPermission;
  onRequestNotificationPermission: () => void;
}

const Reminders: React.FC<RemindersProps> = ({ reminders, addReminder, updateReminder, deleteReminder, toggleReminder, notificationPermission, onRequestNotificationPermission }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [time, setTime] = useState('');
  const [foodContext, setFoodContext] = useState<FoodContext>('after_food');
  const [repeat, setRepeat] = useState<RepeatType>('daily');
  const [soundType, setSoundType] = useState<SoundType>('ringtone');
  const [voiceTone, setVoiceTone] = useState<VoiceTone>('normal');
  const [voiceGender, setVoiceGender] = useState<VoiceGender>('female');
  const [customSoundData, setCustomSoundData] = useState<string | undefined>(undefined);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (notificationPermission === 'default') {
      onRequestNotificationPermission();
    }
  }, [notificationPermission, onRequestNotificationPermission]);

  const getSpeechVoice = useCallback((gender: VoiceGender, lang: string = 'en-US'): SpeechSynthesisVoice | null => {
    const voices = window.speechSynthesis.getVoices();
    const langPrefix = lang.substring(0, 2).toLowerCase();
    const filteredVoicesByLang = voices.filter(voice => voice.lang.toLowerCase().startsWith(langPrefix));

    let selectedVoice: SpeechSynthesisVoice | null = null;

    if (gender === 'male') {
        selectedVoice = filteredVoicesByLang.find(voice => 
            voice.name.toLowerCase().includes('male') || 
            voice.name.toLowerCase().includes('david') || 
            voice.name.toLowerCase().includes('aaron') ||
            voice.name.toLowerCase().includes('daniel') ||
            (voice.name.toLowerCase().includes('google') && voice.name.toLowerCase().includes('us english') && !voice.name.toLowerCase().includes('female')) ||
            (!voice.name.toLowerCase().includes('female') && !voice.name.toLowerCase().includes('zira') && !voice.name.toLowerCase().includes('sara') && !voice.name.toLowerCase().includes('helen'))
        );
        if (!selectedVoice) {
            selectedVoice = voices.find(voice =>
                (voice.name.toLowerCase().includes('male') ||
                voice.name.toLowerCase().includes('david') ||
                voice.name.toLowerCase().includes('aaron')) &&
                !voice.name.toLowerCase().includes('female')
            );
        }
    } else {
        selectedVoice = filteredVoicesByLang.find(voice => 
            voice.name.toLowerCase().includes('female') || 
            voice.name.toLowerCase().includes('zira') || 
            voice.name.toLowerCase().includes('sara') ||
            voice.name.toLowerCase().includes('helen') ||
            (voice.name.toLowerCase().includes('google') && voice.name.toLowerCase().includes('us english') && voice.name.toLowerCase().includes('female')) ||
            (!voice.name.toLowerCase().includes('male') && !voice.name.toLowerCase().includes('david') && !voice.name.toLowerCase().includes('aaron'))
        );
        if (!selectedVoice) {
            selectedVoice = voices.find(voice =>
                (voice.name.toLowerCase().includes('female') ||
                voice.name.toLowerCase().includes('zira') ||
                voice.name.toLowerCase().includes('sara')) &&
                !voice.name.toLowerCase().includes('male')
            );
        }
    }
    return selectedVoice || voices.find(voice => voice.default) || (voices.length > 0 ? voices[0] : null);
  }, []);

  const previewSound = useCallback((type: SoundType, tone?: VoiceTone, customData?: string, gender?: VoiceGender) => {
      window.speechSynthesis.cancel();

      if (type !== 'voice' && type !== 'custom') {
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume().catch(e => console.error("AudioContext resume failed:", e));
        }
      }

      if (type === 'voice') {
          let text = '';
          const currentTone = tone || voiceTone;
          const currentGender = gender || voiceGender;
          let lang = 'en-US';

          if (currentTone === 'hindi') {
              text = "Namaste. Yeh aapki dawai lene ka sahi samay hai. Kripya ise abhi lein.";
              lang = 'hi-IN';
          } else if (currentTone === 'strict') {
              text = "Attention! This is your AI health assistant. It is time for your medicine.";
          } else if (currentTone === 'friendly') {
              text = "Hello! Just a friendly reminder that you need to take your medication now.";
          } else {
              text = "Time for your medicine.";
          }

          const u = new SpeechSynthesisUtterance(text);
          u.lang = lang;
          u.rate = 0.9;
          u.volume = 0.9;
          
          const setVoiceAndSpeak = () => {
            const selectedVoice = getSpeechVoice(currentGender, lang);
            if (selectedVoice) u.voice = selectedVoice;
            window.speechSynthesis.speak(u);
          };

          if (window.speechSynthesis.getVoices().length === 0) {
            window.speechSynthesis.onvoiceschanged = setVoiceAndSpeak;
          } else {
            setVoiceAndSpeak();
          }
          
      } else if (type === 'custom' && customData) {
          const audio = new Audio(customData);
          audio.volume = 0.8;
          audio.play().catch((e) => console.error("Custom audio preview failed:", e));
          setTimeout(() => { if (!audio.paused) audio.pause(); }, 3000);
      } else {
           try {
               const ctx = audioContextRef.current;
               if (!ctx) return;

               const osc = ctx.createOscillator();
               const gain = ctx.createGain();
               osc.connect(gain); 
               gain.connect(ctx.destination);
               gain.gain.setValueAtTime(0.5, ctx.currentTime);

               if (type === 'soft') { osc.type = 'sine'; osc.frequency.setValueAtTime(350, ctx.currentTime); }
               else if (type === 'loud') { osc.type = 'square'; osc.frequency.setValueAtTime(600, ctx.currentTime); }
               else if (type === 'zen') { osc.type = 'sine'; osc.frequency.setValueAtTime(200, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.5); }
               else if (type === 'emergency') { osc.type = 'sawtooth'; osc.frequency.setValueAtTime(1200, ctx.currentTime); osc.frequency.setValueAtTime(400, ctx.currentTime + 0.1); }
               else if (type === 'musical') { osc.type = 'triangle'; osc.frequency.setValueAtTime(523.25, ctx.currentTime); osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15); osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.3); }
               else if (type === 'ringtone') { osc.type = 'sine'; osc.frequency.setValueAtTime(440, ctx.currentTime); osc.frequency.setValueAtTime(480, ctx.currentTime + 0.1); osc.frequency.setValueAtTime(0, ctx.currentTime + 0.2); osc.frequency.setValueAtTime(440, ctx.currentTime + 0.3); }
               else { osc.type = 'square'; osc.frequency.setValueAtTime(440, ctx.currentTime); }
               osc.start(); 
               osc.stop(ctx.currentTime + 0.6);
           } catch (e) { console.error("Tone preview failed:", e); }
      }
  }, [voiceTone, voiceGender, getSpeechVoice]); 

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
        const base64 = reader.result as string;
        setCustomSoundData(base64);
        setSoundType('custom');
        previewSound('custom', undefined, base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSoundSelect = (type: SoundType) => { 
    if (type === 'custom') {
        fileInputRef.current?.click();
    } else {
        setSoundType(type); 
        previewSound(type, voiceTone, customSoundData, voiceGender); 
    }
  };

  const handleEdit = (r: Reminder) => {
      setName(r.medicineName);
      setDose(r.dose);
      setTime(r.time);
      setFoodContext(r.foodContext);
      setRepeat(r.repeat);
      setSoundType(r.soundType);
      setVoiceTone(r.voiceTone || 'normal');
      setVoiceGender(r.voiceGender || 'female');
      setCustomSoundData(r.customSoundData);
      setEditingId(r.id);
      setShowForm(true);
  };

  const resetForm = () => {
      setName(''); setDose(''); setTime(''); setCustomSoundData(undefined); setEditingId(null);
      setSoundType('ringtone'); 
      setVoiceTone('normal');
      setVoiceGender('female');
      setFoodContext('after_food');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !time || !dose) return;
    
    const reminderData: Reminder = { 
        id: editingId || Date.now().toString(), 
        medicineName: name, 
        dose, 
        time, 
        foodContext, 
        repeat, 
        customDays: [], 
        soundType, 
        customSoundData,
        voiceTone: soundType === 'voice' ? voiceTone : undefined, 
        voiceGender: soundType === 'voice' ? voiceGender : undefined,
        active: true, 
        snoozedUntil: null, 
        createdAt: editingId ? (reminders.find(r => r.id === editingId)?.createdAt || Date.now()) : Date.now()
    };

    if (editingId) {
        updateReminder(reminderData);
    } else {
        addReminder(reminderData);
    }
    
    setShowForm(false); 
    resetForm();
  };

  const cancelEdit = () => {
      setShowForm(false);
      resetForm();
  };

  return (
    <div className="p-8 pb-40 animate-fade-in max-w-lg mx-auto bg-slate-50 min-h-screen">
      <div className="flex justify-between items-end mb-12">
        <div>
            <h2 className="text-4xl font-extrabold text-slate-900 tracking-tighter">My Alarms</h2>
            <p className="text-teal-600 text-[10px] font-black uppercase tracking-[0.4em] mt-2 opacity-60">Precision Schedule</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }} className="bg-slate-900 text-white w-14 h-14 rounded-3xl shadow-2xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all border border-slate-700">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
        </button>
      </div>

      {notificationPermission === 'default' && (
        <div className="bg-blue-50 border border-blue-100 p-6 rounded-[2.5rem] mb-8 text-sm text-blue-800 animate-fade-in flex items-center space-x-4 shadow-lg shadow-blue-500/5">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-xl shrink-0">🔔</div>
          <div>
            <p className="font-bold mb-2">Enable Notifications</p>
            <p className="text-xs">Allow MedScan to send alerts even when the app is in the background for reliable alarms.</p>
            <button onClick={onRequestNotificationPermission} className="mt-3 bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-blue-600 transition-colors active:scale-95">
              Allow Notifications
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[3.5rem] shadow-2xl border border-slate-100 mb-12 space-y-10 animate-slide-up relative z-[110]">
            <h3 className="text-xl font-black text-slate-900 flex items-center tracking-tight">
                <span className="w-3 h-3 bg-teal-500 rounded-full mr-4 shadow-teal-200 shadow-lg"></span> 
                {editingId ? 'Edit Schedule' : 'New Schedule'}
            </h3>
            
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="audio/*" className="hidden" />

            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Medicine</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Advil" required className="w-full p-5 bg-slate-50 rounded-2xl border-none font-bold text-slate-800 placeholder-slate-300 focus:ring-4 focus:ring-teal-500/10 transition-all" />
                </div>
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Quantity</label>
                    <input type="text" value={dose} onChange={(e) => setDose(e.target.value)} placeholder="1 pill" required className="w-full p-5 bg-slate-50 rounded-2xl border-none font-bold text-slate-800 placeholder-slate-300 focus:ring-4 focus:ring-teal-500/10 transition-all" />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Exact Time</label>
                    <input type="time" value={time} onChange={(e) => setTime(e.target.value)} required className="w-full p-5 bg-slate-50 rounded-2xl border-none font-black text-2xl text-teal-700 shadow-inner" />
                </div>
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Intake Rule</label>
                    <select value={foodContext} onChange={(e) => setFoodContext(e.target.value as FoodContext)} className="w-full p-5 bg-slate-50 rounded-2xl border-none font-bold text-xs text-slate-700 focus:ring-4 focus:ring-teal-500/10 transition-all">
                        <option value="after_food">After Food 🥣</option>
                        <option value="before_food">Before Food 🍎</option>
                        <option value="empty_stomach">Empty Stomach 🚫</option>
                        <option value="any">Anytime 🤷</option>
                    </select>
                </div>
            </div>

            <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Alert Sound</label>
                <div className="grid grid-cols-3 gap-2.5">
                     {[ 'ringtone', 'musical', 'zen', 'emergency', 'soft', 'loud', 'voice', 'custom' ].map(s => (
                         <button key={s} type="button" onClick={() => handleSoundSelect(s as SoundType)} className={`py-3.5 text-[9px] font-black rounded-2xl border transition-all uppercase tracking-tighter active:scale-90 ${soundType === s ? 'bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-900/30' : 'border-slate-100 text-slate-400 bg-slate-50 hover:bg-white'}`}>
                            {s === 'custom' && customSoundData ? '🎵 Uploaded' : s}
                         </button>
                     ))}
                </div>
                {soundType === 'voice' && (
                    <div className="bg-teal-50/50 p-6 rounded-3xl space-y-5 border border-teal-100 animate-fade-in">
                        <div className="space-y-3">
                            <label className="text-[9px] font-black text-teal-600/70 uppercase tracking-widest ml-1">AI Voice Tone</label>
                            <div className="flex space-x-2">
                                {(['normal', 'strict', 'friendly', 'hindi'] as VoiceTone[]).map(t => (
                                    <button key={t} type="button" onClick={() => { setVoiceTone(t); previewSound('voice', t, customSoundData, voiceGender); }} className={`flex-1 py-3 text-[10px] font-black rounded-xl capitalize border transition-all ${voiceTone === t ? 'bg-white text-teal-700 border-teal-200 shadow-md' : 'text-slate-400 border-transparent hover:text-slate-600'}`}>{t}</button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[9px] font-black text-teal-600/70 uppercase tracking-widest ml-1">AI Gender</label>
                            <div className="flex space-x-2">
                                {(['female', 'male'] as VoiceGender[]).map(g => (
                                    <button key={g} type="button" onClick={() => { setVoiceGender(g); previewSound('voice', voiceTone, customSoundData, g); }} className={`flex-1 py-3 text-[10px] font-black rounded-xl capitalize border transition-all ${voiceGender === g ? 'bg-white text-teal-700 border-teal-200 shadow-md' : 'text-slate-400 border-transparent hover:text-slate-600'}`}>
                                        {g === 'female' ? 'Female 👩' : 'Male 👨'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="pt-6 flex space-x-4">
                <button type="button" onClick={cancelEdit} className="flex-1 bg-slate-100 text-slate-500 py-6 rounded-[2.5rem] font-black text-[11px] uppercase tracking-widest hover:bg-slate-200 transition-colors">Cancel</button>
                <button type="submit" className="flex-[2] bg-teal-600 text-white py-6 rounded-[2.5rem] font-black text-sm uppercase tracking-widest shadow-2xl shadow-teal-600/30 hover:translate-y-[-2px] active:scale-95 transition-all">
                    {editingId ? 'Update Alarm' : 'Enable Alarm'}
                </button>
            </div>
        </form>
      )}

      <div className="space-y-8">
            {reminders.map(rem => (
                <div key={rem.id} className={`p-8 rounded-[3.5rem] border transition-all duration-500 relative overflow-hidden group ${rem.active ? 'bg-white border-white shadow-2xl shadow-slate-200/50' : 'bg-slate-100 border-transparent opacity-40 grayscale blur-[0.5px]'}`}>
                    <div className="flex justify-between items-center relative z-10">
                        <div className="flex items-center space-x-8">
                            <div className={`w-20 h-20 rounded-[2rem] flex flex-col items-center justify-center shadow-2xl transition-all duration-500 ${rem.active ? 'bg-slate-900 text-white scale-100' : 'bg-slate-200 text-slate-500'}`}>
                                <span className="text-2xl font-black tracking-tighter leading-none">{rem.time}</span>
                                <span className="text-[9px] uppercase font-black tracking-widest mt-1 opacity-60">{rem.repeat}</span>
                            </div>
                            <div>
                                <h3 className={`font-black text-2xl tracking-tighter leading-none mb-2 ${rem.active ? 'text-slate-900' : 'text-slate-500'}`}>{rem.medicineName}</h3>
                                <div className="flex items-center space-x-3">
                                    <span className="text-[10px] font-black text-white bg-teal-600 px-3 py-1.5 rounded-xl uppercase tracking-widest shadow-md">{rem.dose}</span>
                                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest opacity-70 italic">{rem.foodContext.replace('_', ' ')}</span>
                                </div>
                                <div className="mt-2 text-[8px] font-bold text-slate-300 uppercase tracking-widest flex items-center">
                                    <span className="mr-1">🔊</span> {rem.soundType === 'custom' ? 'Custom Ringtone' : rem.soundType === 'voice' ? `AI Voice (${rem.voiceTone} ${rem.voiceGender})` : rem.soundType}
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col space-y-3">
                            <button onClick={() => toggleReminder(rem.id)} className={`w-14 h-7 rounded-full p-1.5 transition-all duration-500 shadow-inner ${rem.active ? 'bg-teal-500' : 'bg-slate-300'}`}>
                                <div className={`bg-white w-4 h-4 rounded-full shadow-2xl transform transition-transform duration-500 ${rem.active ? 'translate-x-7' : ''}`}></div>
                            </button>
                            
                            {/* Edit Button */}
                            <button onClick={() => handleEdit(rem)} className="w-14 h-10 rounded-2xl bg-indigo-50 text-indigo-400 flex items-center justify-center hover:bg-indigo-500 hover:text-white transition-all active:scale-90 border border-indigo-100/50">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </button>

                            <button onClick={() => deleteReminder(rem.id)} className="w-14 h-10 rounded-2xl bg-rose-50 text-rose-300 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all active:scale-90 border border-rose-100/50">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </div>
                    </div>
                </div>
            ))}
            {reminders.length === 0 && !showForm && (
                <div className="text-center py-32 animate-fade-in opacity-40">
                    <div className="w-32 h-32 bg-white rounded-[3.5rem] flex items-center justify-center mx-auto mb-8 text-slate-100 shadow-xl border border-slate-50">
                        <svg className="w-14 h-14 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <h3 className="text-slate-900 font-black text-2xl tracking-tighter">No Active Alarms</h3>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">Time for your first med?</p>
                </div>
            )}
      </div>
    </div>
  );
};

export default Reminders;