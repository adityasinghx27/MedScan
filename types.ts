

export type AgeGroup = 'child' | 'adult' | 'senior';
export type Gender = 'male' | 'female';
export type Language = 'english' | 'hindi' | 'hinglish';

export interface User {
  uid: string;
  email: string | null;
  isGuest: boolean;
  joinedAt: number;
}

export interface PatientProfile {
  ageGroup: AgeGroup;
  gender: Gender;
  isPregnant: boolean;
  isBreastfeeding: boolean;
  language: Language;
}

export type RiskScore = 'Low' | 'Medium' | 'High';

export interface InteractionRisk {
  severity: 'Safe' | 'Warning' | 'Dangerous';
  summary: string;
  advice: string;
}

export interface MedicineData {
  name: string; 
  medicationsFound: string[]; 
  description: string;
  simpleExplanation: string;
  childFriendlyExplanation: string;
  uses: string[];
  dosage: string;
  sideEffects: string[];
  warnings: string;
  keyWarning: string;
  riskScore: RiskScore;
  riskReason: string;
  whoShouldAvoid: string[];
  foodGuidance: string; 
  alternatives: string[];
  interactionAnalysis?: InteractionRisk;
  effectTimeline: {
      onset: string;
      peak: string;
      duration: string;
  };
  lifestyleWarnings: {
      alcohol: boolean;
      driving: boolean;
      sleep: boolean;
  };
  safetyRating: number;
  commonQuestions: {
      question: string;
      answer: string;
  }[];
  criticalWarning?: string; 
  pregnancyWarning?: string;
  breastfeedingWarning?: string;
  ageAdvice?: string;
}

export interface ScanHistoryItem {
  id: string;
  timestamp: number;
  medicineName: string;
  data: MedicineData;
}

export type FoodContext = 'before_food' | 'after_food' | 'empty_stomach' | 'any';
export type RepeatType = 'daily' | 'alternate' | 'custom';
export type SoundType = 'default' | 'soft' | 'loud' | 'voice' | 'zen' | 'emergency' | 'musical' | 'ringtone' | 'custom';
export type VoiceTone = 'normal' | 'strict' | 'friendly' | 'hindi';

export interface Reminder {
  id: string;
  medicineName: string;
  dose: string;
  time: string; 
  foodContext: FoodContext;
  repeat: RepeatType;
  customDays: number[]; 
  soundType: SoundType;
  customSoundData?: string; // Base64 audio data
  voiceTone?: VoiceTone;
  voiceGender?: 'male' | 'female'; // Added voice gender for customization
  active: boolean;
  snoozedUntil: number | null;
  createdAt: number;
}

export enum AppView {
  HOME = 'HOME',
  SCANNER = 'SCANNER',
  REMINDERS = 'REMINDERS',
  HISTORY = 'HISTORY',
  DOCTOR_AI = 'DOCTOR_AI',
  PROFILE = 'PROFILE',
  INFO = 'INFO'
}

export interface AnalysisState {
  loading: boolean;
  data: MedicineData | null;
  error: string | null;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}