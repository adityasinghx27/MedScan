
import React, { useEffect, useRef, useState } from 'react';
import { Reminder } from '../types';

interface AlarmRingingModalProps {
  reminder: Reminder;
  onTake: () => void;
  onSnooze: (minutes: number) => void;
  onSkip: () => void;
}

const AlarmRingingModal: React.FC<AlarmRingingModalProps> = ({ reminder, onTake, onSnooze, onSkip }) => {
  const [volumeLevel, setVolumeLevel] = useState(0.4);
  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<number | null>(null);
  const customAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (navigator.vibrate) {
        const pattern = [500, 200, 500, 200, 500, 500, 1000];
        navigator.vibrate(pattern);
        const vibeInterval = setInterval(() => navigator.vibrate(pattern), 4000);
        return () => { clearInterval(vibeInterval); navigator.vibrate(0); };
    }
  }, []);

  useEffect(() => {
    let stopAudio = () => {};
    
    if (reminder.soundType === 'voice') {
       const speak = () => {
           window.speechSynthesis.cancel();
           const tone = reminder.voiceTone || 'normal';
           const foodStr = reminder.foodContext.replace('_', ' ');
           
           let text = '';
           if (tone === 'hindi') {
               text = `Sunneye! Yeh aapki sehat ka sawal hai. Dawai ${reminder.medicineName} lene ka waqt ho gaya hai. Aapko ${reminder.dose} dawai ${foodStr} leni hai. Please ise abhi lein. Main phir se keh rahi hoon, dawai ka naam ${reminder.medicineName} hai aur dose ${reminder.dose} hai. Ise turant lein.`;
           } else if (tone === 'strict') {
               text = `Attention! This is a mandatory health alert. You must ingest ${reminder.dose} of ${reminder.medicineName} immediately. Intake rule is ${foodStr}. Do not ignore this. Repeating: ${reminder.medicineName}, ${reminder.dose}. Take it now.`;
           } else if (tone === 'friendly') {
               text = `Hello! Hope you are feeling better. It's time for your medication. Please take ${reminder.dose} of ${reminder.medicineName} ${foodStr}. Stay healthy and take care! I'll keep reminding you: ${reminder.medicineName} now!`;
           } else {
               text = `Time for your medicine reminder. Medicine name is ${reminder.medicineName}. Dose is ${reminder.dose}. Rule is ${foodStr}. Please confirm you have taken it by pressing the button on your screen. ${reminder.medicineName}, ${reminder.dose}, now.`;
           }
           
           const utterance = new SpeechSynthesisUtterance(text);
           if (tone === 'hindi') utterance.lang = 'hi-IN';
           utterance.rate = 0.85; // Slightly slower for absolute clarity
           utterance.pitch = 1.1; // Slightly higher to grab attention
           window.speechSynthesis.speak(utterance);
       };
       
       speak();
       // "Bahot bole" requirement: Repeat every 10 seconds with very little silence
       const voiceInterval = setInterval(speak, 10000); 
       stopAudio = () => { clearInterval(voiceInterval); window.speechSynthesis.cancel(); };
    } else if (reminder.soundType === 'custom' && reminder.customSoundData) {
        const audio = new Audio(reminder.customSoundData);
        audio.loop = true;
        audio.volume = volumeLevel;
        customAudioRef.current = audio;
        audio.play().catch(e => console.error("Audio play failed", e));
        stopAudio = () => { audio.pause(); audio.currentTime = 0; };
    } else {
       try {
           const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
           audioContextRef.current = ctx;
           const playPattern = (vol: number) => {
               const playTone = (freq: number, start: number, duration: number, type: OscillatorType = 'sine') => {
                    const osc = ctx.createOscillator();
                    const g = ctx.createGain();
                    osc.type = type;
                    osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
                    g.gain.setValueAtTime(0, ctx.currentTime + start);
                    g.gain.linearRampToValueAtTime(vol, ctx.currentTime + start + 0.05);
                    g.gain.linearRampToValueAtTime(0, ctx.currentTime + start + duration);
                    osc.connect(g); g.connect(ctx.destination);
                    osc.start(ctx.currentTime + start); osc.stop(ctx.currentTime + start + duration);
               };

               if (reminder.soundType === 'soft') playTone(300, 0, 0.5);
               else if (reminder.soundType === 'loud') { playTone(800, 0, 0.3, 'square'); playTone(800, 0.4, 0.3, 'square'); }
               else if (reminder.soundType === 'zen') { playTone(200, 0, 1, 'sine'); playTone(300, 0.5, 1, 'sine'); }
               else if (reminder.soundType === 'emergency') { for(let i=0; i<4; i++) playTone(1200 - (i*100), i*0.15, 0.1, 'sawtooth'); }
               else if (reminder.soundType === 'musical') { playTone(440, 0, 0.2, 'triangle'); playTone(554.37, 0.2, 0.2, 'triangle'); playTone(659.25, 0.4, 0.4, 'triangle'); }
               else if (reminder.soundType === 'ringtone') { for(let i=0; i<3; i++) { playTone(600, i*0.2, 0.1); playTone(800, i*0.2 + 0.1, 0.1); } }
               else playTone(440, 0, 0.3, 'square');
           };
           playPattern(volumeLevel);
           const toneInterval = window.setInterval(() => playPattern(volumeLevel), 2000);
           intervalRef.current = toneInterval;
           stopAudio = () => { if (intervalRef.current) clearInterval(intervalRef.current); if (ctx.state !== 'closed') ctx.close(); };
       } catch (e) {}
    }
    return stopAudio;
  }, [reminder, volumeLevel]);

  // Gradually increase volume
  useEffect(() => {
      const volInterval = setInterval(() => {
          setVolumeLevel(p => {
              const next = Math.min(p + 0.1, 1.0);
              if (customAudioRef.current) customAudioRef.current.volume = next;
              return next;
          });
      }, 4000);
      return () => clearInterval(volInterval);
  }, []);

  return (
    <div className="fixed inset-0 z-[2000] bg-slate-900 flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-sm rounded-[3.5rem] shadow-2xl overflow-hidden text-center relative border border-slate-100 animate-slide-up">
        <div className="bg-rose-600 p-12 flex justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-rose-500 to-red-800"></div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <div className="relative">
                <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-30"></div>
                <div className="bg-white rounded-[2.5rem] p-8 relative z-10 text-rose-600 shadow-2xl animate-bounce">
                    <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                </div>
            </div>
        </div>
        <div className="p-10 space-y-8 bg-white">
            <div className="space-y-2">
                <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.4em]">Time for Medication</h4>
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{reminder.medicineName}</h2>
                <div className="flex justify-center items-center space-x-2">
                    <span className="text-teal-600 font-black text-xl tracking-tight uppercase">{reminder.dose}</span>
                    <span className="w-1.5 h-1.5 bg-slate-200 rounded-full"></span>
                    <span className="text-slate-400 font-black text-xs uppercase tracking-widest">{reminder.foodContext.replace('_', ' ')}</span>
                </div>
            </div>

            <div className="space-y-4">
                <button onClick={onTake} className="w-full bg-slate-900 text-white py-6 rounded-[2.5rem] font-black text-lg shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center space-x-3">
                    <span>💊 I Have Taken It</span>
                </button>
                <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => onSnooze(10)} className="bg-slate-50 text-slate-500 py-5 rounded-3xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 border border-slate-100">Snooze 10m</button>
                    <button onClick={() => onSnooze(30)} className="bg-slate-50 text-slate-500 py-5 rounded-3xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 border border-slate-100">Snooze 30m</button>
                </div>
            </div>

            <div className="pt-2">
                 <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.3em]">AI Voice Assistant is Active</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AlarmRingingModal;
