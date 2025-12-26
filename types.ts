export type AgeGroup = 'child' | 'adult' | 'senior';
export type Gender = 'male' | 'female';
export type Language = 'english' | 'hindi' | 'hinglish';

export interface PatientProfile {
  ageGroup: AgeGroup;
  gender: Gender;
  isPregnant: boolean;
  isBreastfeeding: boolean;
  language: Language;
}

export interface MedicineData {
  name: string;
  description: string;
  simpleExplanation: string;
  uses: string[];
  dosage: string;
  sideEffects: string[];
  warnings: string;
  pregnancyWarning?: string;
  breastfeedingWarning?: string;
  ageAdvice?: string;
}

export type FoodContext = 'before_food' | 'after_food' | 'empty_stomach' | 'any';
export type RepeatType = 'daily' | 'alternate' | 'custom';
export type SoundType = 'default' | 'soft' | 'loud' | 'voice';
export type VoiceTone = 'normal' | 'strict' | 'friendly' | 'hindi';

export interface Reminder {
  id: string;
  medicineName: string;
  dose: string;
  time: string; // HH:mm
  foodContext: FoodContext;
  repeat: RepeatType;
  customDays: number[]; // 0=Sun, 1=Mon, ... 6=Sat
  soundType: SoundType;
  voiceTone?: VoiceTone; // Optional, defaults to normal if undefined
  active: boolean;
  snoozedUntil: number | null; // Timestamp
  createdAt: number; // To calculate alternate days
}

export enum AppView {
  HOME = 'HOME',
  SCANNER = 'SCANNER',
  REMINDERS = 'REMINDERS',
  PROFILE = 'PROFILE',
  INFO = 'INFO'
}

export interface AnalysisState {
  loading: boolean;
  data: MedicineData | null;
  error: string | null;
}