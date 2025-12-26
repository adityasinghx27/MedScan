import React, { useEffect, useRef, useState } from 'react';
import { Reminder } from '../types';

interface AlarmRingingModalProps {
  reminder: Reminder;
  onTake: () => void;
  onSnooze: (minutes: number) => void;
  onSkip: () => void;
}

const AlarmRingingModal: React.FC<AlarmRingingModalProps> = ({ reminder, onTake, onSnooze, onSkip }) => {
  const [volumeLevel, setVolumeLevel] = useState(0.2); // Start low for gradual increase
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const intervalRef = useRef<number | null>(null);

  // Initialize Sound and Vibration
  useEffect(() => {
    // 1. Vibration pattern based on sound type
    if (navigator.vibrate) {
        const pattern = reminder.soundType === 'soft' ? [200, 1000] : 
                        reminder.soundType === 'loud' ? [500, 200, 500, 200, 500] : 
                        [300, 300, 300];
        navigator.vibrate(pattern); // Initial vibe
        const vibeInterval = setInterval(() => navigator.vibrate(pattern), 2000);
        
        return () => {
            clearInterval(vibeInterval);
            navigator.vibrate(0); // Stop vibration
        };
    }
  }, [reminder.soundType]);

  // 2. Audio Logic
  useEffect(() => {
    let stopAudio = () => {};

    if (reminder.soundType === 'voice') {
       // Voice Alarm Logic
       const speak = () => {
           window.speechSynthesis.cancel();
           
           let text = "";
           const tone = reminder.voiceTone || 'normal';

           if (tone === 'strict') {
               text = `Please take your medicine now, ${reminder.medicineName}. Do not skip this dose. It is critical for your health.`;
           } else if (tone === 'friendly') {
               text = `Hey! Don't forget your ${reminder.medicineName} 💊. Take it ${reminder.foodContext.replace('_', ' ')}!`;
           } else if (tone === 'hindi') {
               text = `Dawai lene ka time ho gaya hai. Apni ${reminder.medicineName} dawai lijiye.`;
           } else {
               // Normal
               text = `It is time to take your medicine, ${reminder.medicineName}.`;
           }

           const utterance = new SpeechSynthesisUtterance(text);
           utterance.rate = tone === 'strict' ? 1.0 : 0.9;
           utterance.pitch = tone === 'strict' ? 0.8 : 1.1;
           if (tone === 'hindi') utterance.lang = 'hi-IN';
           
           window.speechSynthesis.speak(utterance);
       };
       
       speak();
       // Emergency Repeat: Loop every 6 seconds until action taken
       const voiceInterval = setInterval(speak, 6000); 
       
       stopAudio = () => {
           clearInterval(voiceInterval);
           window.speechSynthesis.cancel();
       };

    } else {
       // Beep/Tone Alarm (Web Audio API)
       try {
           const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
           const ctx = new AudioContext();
           audioContextRef.current = ctx;

           const playTone = (vol: number) => {
               const osc = ctx.createOscillator();
               const gain = ctx.createGain();
               
               osc.connect(gain);
               gain.connect(ctx.destination);

               // Tone config
               if (reminder.soundType === 'soft') {
                   osc.type = 'sine';
                   osc.frequency.setValueAtTime(300, ctx.currentTime);
                   gain.gain.setValueAtTime(vol * 0.5, ctx.currentTime); // Softer
               } else if (reminder.soundType === 'loud') {
                   osc.type = 'sawtooth'; // Harsh sound
                   osc.frequency.setValueAtTime(800, ctx.currentTime);
                   // Siren effect
                   osc.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 0.5);
                   gain.gain.setValueAtTime(vol, ctx.currentTime);
               } else {
                   osc.type = 'square';
                   osc.frequency.setValueAtTime(440, ctx.currentTime);
                   gain.gain.setValueAtTime(vol * 0.7, ctx.currentTime);
               }

               osc.start();
               osc.stop(ctx.currentTime + 0.5); // Short beep
           };

           // Loop the beep
           playTone(volumeLevel);
           const toneInterval = window.setInterval(() => {
               playTone(volumeLevel);
           }, reminder.soundType === 'loud' ? 600 : 1500);
           
           intervalRef.current = toneInterval;

           stopAudio = () => {
               if (intervalRef.current) clearInterval(intervalRef.current);
               if (ctx.state !== 'closed') ctx.close();
           };
       } catch (e) {
           console.error("Audio init failed", e);
       }
    }

    return stopAudio;
  }, [reminder.soundType, reminder.medicineName, reminder.foodContext, reminder.voiceTone, volumeLevel]);

  // 3. Gradual Volume Increase
  useEffect(() => {
      const volInterval = setInterval(() => {
          setVolumeLevel(prev => Math.min(prev + 0.1, 1.0));
      }, 3000); // Increase every 3 seconds
      return () => clearInterval(volInterval);
  }, []);

  const handleSmartSkip = () => {
      // Smart AI Warning
      const u = new SpeechSynthesisUtterance("Frequent skipping may reduce effectiveness.");
      window.speechSynthesis.speak(u);
      
      if (confirm("Frequent skipping reduces effectiveness. Are you sure?")) {
          onSkip();
      }
  };

  const getFoodIcon = () => {
      switch(reminder.foodContext) {
          case 'before_food': return '🍎 Before Food';
          case 'after_food': return '🥣 After Food';
          case 'empty_stomach': return '🚫 Empty Stomach';
          default: return '';
      }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-teal-900/90 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in-up">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden text-center relative">
        
        {/* Animated Bell Header */}
        <div className="bg-teal-100 p-8 flex justify-center">
            <div className="relative">
                <div className="absolute inset-0 bg-teal-400 rounded-full animate-ping opacity-75"></div>
                <div className="bg-teal-500 rounded-full p-4 relative z-10 text-white animate-bounce">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                </div>
            </div>
        </div>

        <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">{reminder.medicineName}</h2>
            <p className="text-xl text-teal-600 font-semibold mb-2">{reminder.dose}</p>
            
            <div className="inline-block bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-bold mb-6">
                {getFoodIcon()}
            </div>

            <div className="space-y-3">
                <button 
                    onClick={onTake}
                    className="w-full bg-teal-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-teal-700 hover:scale-[1.02] transition-transform"
                >
                    💊 Taken
                </button>

                <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={() => onSnooze(10)}
                        className="bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200"
                    >
                        Repeat 10m
                    </button>
                    <button 
                        onClick={() => onSnooze(30)}
                        className="bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200"
                    >
                        Repeat 30m
                    </button>
                </div>

                <button 
                    onClick={handleSmartSkip}
                    className="text-red-400 text-sm font-medium mt-4 hover:text-red-600 underline"
                >
                    Skip Dose (Warning)
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AlarmRingingModal;