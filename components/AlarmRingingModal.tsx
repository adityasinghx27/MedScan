

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Reminder } from '../types';

interface AlarmRingingModalProps {
  reminder: Reminder;
  onTake: () => void;
  onSnooze: (minutes: number) => void;
  onSkip: () => void;
  notificationPermission: NotificationPermission;
}

const AlarmRingingModal: React.FC<AlarmRingingModalProps> = ({ reminder, onTake, onSnooze, onSkip, notificationPermission }) => {
  const [volumeLevel, setVolumeLevel] = useState(0.8); // Start higher for immediate audibility
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null); // Dedicated gain node for tone volume control
  const intervalRef = useRef<number | null>(null);
  const customAudioRef = useRef<HTMLAudioElement | null>(null);
  const notificationTagRef = useRef<string>(`medscan-alarm-${reminder.id}`); // Unique tag for notification

  // Vibrate on alarm
  useEffect(() => {
    if (navigator.vibrate) {
        const pattern = [500, 200, 500, 200, 500, 500, 1000];
        navigator.vibrate(pattern);
        const vibeInterval = setInterval(() => navigator.vibrate(pattern), 4000);
        return () => { clearInterval(vibeInterval); navigator.vibrate(0); };
    }
  }, []);

  // Handle Web Notification
  useEffect(() => {
    if (notificationPermission === 'granted') {
      const notificationTitle = `Medication Reminder: ${reminder.medicineName}`;
      const notificationOptions: NotificationOptions = {
        body: `${reminder.dose}, ${reminder.foodContext.replace('_', ' ')}.`,
        icon: '/favicon.png', // Or a more relevant icon
        tag: notificationTagRef.current, // Use a unique tag to replace/close later
      };
      
      try {
        // Check if there's already a notification with this tag and close it before creating a new one
        if (('getNotifications' in ServiceWorkerRegistration.prototype) && navigator.serviceWorker.ready) {
          navigator.serviceWorker.ready.then(registration => {
            registration.getNotifications({ tag: notificationTagRef.current }).then(notifications => {
              notifications.forEach(notification => notification.close());
              new Notification(notificationTitle, notificationOptions);
            });
          }).catch(e => console.error("ServiceWorker registration error for notification:", e));
        } else {
          new Notification(notificationTitle, notificationOptions);
        }
      } catch (error) {
        console.error("Failed to show web notification:", error);
      }
    }

    // Function to close the notification when modal is dismissed
    const closeNotification = () => {
        if (notificationPermission === 'granted' && 'getNotifications' in ServiceWorkerRegistration.prototype) {
             navigator.serviceWorker.ready.then(registration => {
                 registration.getNotifications({ tag: notificationTagRef.current }).then(notifications => {
                     notifications.forEach(notification => notification.close());
                 });
             }).catch(e => console.error("ServiceWorker registration error for closing notification:", e));
        }
    };

    // Clean up function to close the notification when component unmounts
    return () => closeNotification();
  }, [notificationPermission, reminder]);

  const getSpeechVoice = useCallback((gender: 'male' | 'female', lang: string = 'en-US'): SpeechSynthesisVoice | null => {
    const voices = window.speechSynthesis.getVoices();
    const langPrefix = lang.substring(0, 2).toLowerCase();

    // Filter voices primarily by language
    const filteredVoicesByLang = voices.filter(voice => voice.lang.toLowerCase().startsWith(langPrefix));

    let selectedVoice: SpeechSynthesisVoice | null = null;

    if (gender === 'male') {
        // Prioritize explicit male voice names or strong male indicators
        selectedVoice = filteredVoicesByLang.find(voice => 
            voice.name.toLowerCase().includes('male') || 
            voice.name.toLowerCase().includes('david') || 
            voice.name.toLowerCase().includes('aaron') ||
            voice.name.toLowerCase().includes('daniel') ||
            (voice.name.toLowerCase().includes('google') && voice.name.toLowerCase().includes('us english') && !voice.name.toLowerCase().includes('female')) ||
            (!voice.name.toLowerCase().includes('female') && !voice.name.toLowerCase().includes('zira') && !voice.name.toLowerCase().includes('sara') && !voice.name.toLowerCase().includes('helen')) // Aggressively exclude known female names
        );

        // Fallback 1: If no specific male voice in current language, try any male voice from all voices
        if (!selectedVoice) {
            selectedVoice = voices.find(voice =>
                (voice.name.toLowerCase().includes('male') ||
                voice.name.toLowerCase().includes('david') ||
                voice.name.toLowerCase().includes('aaron') ||
                voice.name.toLowerCase().includes('daniel')) &&
                !voice.name.toLowerCase().includes('female') && !voice.name.toLowerCase().includes('zira') && !voice.name.toLowerCase().includes('sara')
            );
        }

    } else { // female
        // Prioritize explicit female voice names or strong female indicators
        selectedVoice = filteredVoicesByLang.find(voice => 
            voice.name.toLowerCase().includes('female') || 
            voice.name.toLowerCase().includes('zira') || 
            voice.name.toLowerCase().includes('sara') ||
            voice.name.toLowerCase().includes('helen') ||
            (voice.name.toLowerCase().includes('google') && voice.name.toLowerCase().includes('us english') && voice.name.toLowerCase().includes('female')) ||
            (!voice.name.toLowerCase().includes('male') && !voice.name.toLowerCase().includes('david') && !voice.name.toLowerCase().includes('aaron') && !voice.name.toLowerCase().includes('daniel')) // Exclude known male names
        );
        
        // Fallback 1: If no specific female voice in current language, try any female voice from all voices
        if (!selectedVoice) {
            selectedVoice = voices.find(voice =>
                (voice.name.toLowerCase().includes('female') ||
                voice.name.toLowerCase().includes('zira') ||
                voice.name.toLowerCase().includes('sara') ||
                voice.name.toLowerCase().includes('helen')) &&
                !voice.name.toLowerCase().includes('male') && !voice.name.toLowerCase().includes('david') && !voice.name.toLowerCase().includes('aaron') && !voice.name.toLowerCase().includes('daniel')
            );
        }
    }
    
    // Final fallback: browser default voice, or first available voice if nothing matches
    return selectedVoice || voices.find(voice => voice.default) || (voices.length > 0 ? voices[0] : null);
  }, []);

  // Main audio playback effect
  useEffect(() => {
    let stopAudio = () => {};
    const currentAudioContext = audioContextRef.current; // Capture current ref value for cleanup

    // Initialize AudioContext if not already, and resume it
    const initAndResumeAudioContext = async () => {
      if (!currentAudioContext || currentAudioContext.state === 'closed') {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        gainNodeRef.current = audioContextRef.current.createGain();
        gainNodeRef.current.connect(audioContextRef.current.destination);
        gainNodeRef.current.gain.value = volumeLevel; // Set initial volume
      }
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        try {
          await audioContextRef.current.resume();
        } catch (e) {
          console.error("AudioContext resume failed on alarm:", e);
        }
      }
    };

    if (reminder.soundType === 'voice') {
       const speak = () => {
           window.speechSynthesis.cancel();
           const tone = reminder.voiceTone || 'normal';
           const gender = reminder.voiceGender || 'female';
           const foodStr = reminder.foodContext.replace('_', ' ');
           
           let text = '';
           let lang = 'en-US';

           if (tone === 'hindi') {
               text = `Sunneye! Yeh aapki sehat ka sawal hai. Dawai ${reminder.medicineName} lene ka waqt ho gaya hai. Aapko ${reminder.dose} dawai ${foodStr} leni hai. Kripya ise abhi lein. Main phir se keh rahi hoon, dawai ka naam ${reminder.medicineName} hai aur dose ${reminder.dose} hai. Ise turant lein.`;
               lang = 'hi-IN';
           } else if (tone === 'strict') {
               text = `Attention! This is a mandatory health alert. You must ingest ${reminder.dose} of ${reminder.medicineName} immediately. Intake rule is ${foodStr}. Do not ignore this. Repeating: ${reminder.medicineName}, ${reminder.dose}. Take it now.`;
           } else if (tone === 'friendly') {
               text = `Hello! Hope you are feeling better. It's time for your medication. Please take ${reminder.dose} of ${reminder.medicineName} ${foodStr}. Stay healthy and take care! I'll keep reminding you: ${reminder.medicineName} now!`;
           } else {
               text = `Time for your medicine reminder. Medicine name is ${reminder.medicineName}. Dose is ${reminder.dose}. Rule is ${foodStr}. Please confirm you have taken it by pressing the button on your screen. ${reminder.medicineName}, ${reminder.dose}, now.`;
           }
           
           const utterance = new SpeechSynthesisUtterance(text);
           utterance.lang = lang;
           
           const setVoiceAndSpeak = () => {
             const selectedVoice = getSpeechVoice(gender, lang);
             if (selectedVoice) {
               utterance.voice = selectedVoice;
             }
             utterance.rate = 0.85; // Slightly slower for absolute clarity
             utterance.pitch = 1.1; // Slightly higher to grab attention
             utterance.volume = volumeLevel; // Apply current volume level
             window.speechSynthesis.speak(utterance);
           };

           if (window.speechSynthesis.getVoices().length === 0) {
             window.speechSynthesis.onvoiceschanged = setVoiceAndSpeak;
           } else {
             setVoiceAndSpeak();
           }
       };
       
       speak();
       const voiceInterval = setInterval(speak, 10000); 
       stopAudio = () => { clearInterval(voiceInterval); window.speechSynthesis.cancel(); };
    } else if (reminder.soundType === 'custom' && reminder.customSoundData) {
        const audio = new Audio(reminder.customSoundData);
        audio.loop = true;
        audio.volume = volumeLevel; // Apply current volume level
        customAudioRef.current = audio;
        audio.play().catch(e => console.error("Custom audio play failed:", e));
        stopAudio = () => { audio.pause(); audio.currentTime = 0; };
    } else { // Tone sounds
       initAndResumeAudioContext().then(() => {
           const ctx = audioContextRef.current;
           const gainNode = gainNodeRef.current;
           if (!ctx || !gainNode) return; // Should not happen

           const playPattern = () => {
               const playTone = (freq: number, start: number, duration: number, type: OscillatorType = 'sine') => {
                    const osc = ctx.createOscillator();
                    const g = ctx.createGain(); // Use a local gain for smooth attack/decay per tone
                    osc.type = type;
                    osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
                    g.gain.setValueAtTime(0, ctx.currentTime + start);
                    g.gain.linearRampToValueAtTime(1, ctx.currentTime + start + 0.05); // Full volume for the tone
                    g.gain.linearRampToValueAtTime(0, ctx.currentTime + start + duration);
                    osc.connect(g); g.connect(gainNode); // Connect to the main gain node
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
           playPattern(); // Initial play
           const toneInterval = window.setInterval(playPattern, 2000);
           intervalRef.current = toneInterval;
           stopAudio = () => { 
             if (intervalRef.current) clearInterval(intervalRef.current); 
             // Do not close AudioContext here, as it's managed by the modal's lifecycle
           };
       }).catch(e => console.error("Tone playback initialization failed:", e));
    }

    return () => {
      stopAudio(); // Call specific stop function
      if (customAudioRef.current) {
        customAudioRef.current.pause();
        customAudioRef.current.currentTime = 0;
        customAudioRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state === 'running') {
        // Leave AudioContext running if other parts of the app might need it
        // Or if we need to close, ensure it's safe to do so
        // For simplicity, will not close here, let browser manage
      }
    };
  }, [reminder, getSpeechVoice]); 

  // Gradually increase volume & apply to global gain node
  useEffect(() => {
    // Apply initial volume immediately
    if (gainNodeRef.current) gainNodeRef.current.gain.value = volumeLevel;
    if (customAudioRef.current) customAudioRef.current.volume = volumeLevel;
    
    // Gradual increase interval
    const volInterval = setInterval(() => {
        setVolumeLevel(p => {
            const next = Math.min(p + 0.05, 1.0); // Smaller step for smoother increase
            if (gainNodeRef.current) gainNodeRef.current.gain.value = next;
            if (customAudioRef.current) customAudioRef.current.volume = next;
            if (window.speechSynthesis.speaking) {
                const utterances = window.speechSynthesis.getVoices().map(v => new SpeechSynthesisUtterance("")); // Placeholder, cannot directly modify current utterance volume
                // Can't directly control volume of active SpeechSynthesisUtterance.
                // It's set once on speak(). New utterances will get new volume.
            }
            return next;
        });
    }, 2000); // Check every 2 seconds

    return () => clearInterval(volInterval);
  }, [volumeLevel]); 

  // Helper to close notification
  const closeCurrentNotification = () => {
    if (notificationPermission === 'granted' && 'getNotifications' in ServiceWorkerRegistration.prototype) {
        navigator.serviceWorker.ready.then(registration => {
            registration.getNotifications({ tag: notificationTagRef.current }).then(notifications => {
                notifications.forEach(notification => notification.close());
            });
        }).catch(e => console.error("ServiceWorker registration error for closing notification:", e));
    }
  };

  const handleTake = () => {
    closeCurrentNotification();
    onTake();
  };

  const handleSnooze = (minutes: number) => {
    closeCurrentNotification();
    onSnooze(minutes);
  };

  const handleSkip = () => {
    closeCurrentNotification();
    onSkip();
  };

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
                <button onClick={handleTake} className="w-full bg-slate-900 text-white py-6 rounded-[2.5rem] font-black text-lg shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center space-x-3">
                    <span>💊 I Have Taken It</span>
                </button>
                <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => handleSnooze(10)} className="bg-slate-50 text-slate-500 py-5 rounded-3xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 border border-slate-100">Snooze 10m</button>
                    <button onClick={() => handleSnooze(30)} className="bg-slate-50 text-slate-500 py-5 rounded-3xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 border border-slate-100">Snooze 30m</button>
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