
export type AgeGroup = 'child' | 'adult' | 'senior';
export type Gender = 'male' | 'female';
export type Language = 'english' | 'hindi' | 'hinglish';
export type VoiceGender = 'male' | 'female';

export interface FamilyMember {
  id: string;
  name: string;
  ageGroup: AgeGroup;
  gender: Gender;
  isPregnant: boolean;
  isBreastfeeding: boolean;
  language: Language;
  avatar: string;
}

export interface User {
  uid: string;
  email: string | null;
  displayName?: string | null;
  photoURL?: string | null;
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
  expiryDate?: string; // YYYY-MM-DD format if found
}

export interface DermaData {
  conditionName: string;
  confidence: string; // High, Medium, Low
  severity: 'Mild' | 'Moderate' | 'Severe';
  description: string;
  symptomsObserved: string[];
  possibleCauses: string[];
  homeRemedies: string[];
  otcSuggestions: string[]; // Over the counter creams/meds
  whenToSeeDoctor: string;
  isContagious: boolean;
  disclaimer: string;
}

export interface DayPlan {
    day: string;
    morning: string; // Early morning drink/snack
    breakfast: string;
    lunch: string;
    snack: string; // Evening
    dinner: string;
    tip: string;
}

export interface DietPlan {
    title: string;
    overview: string;
    avoidList: string[];
    includeList: string[];
    days: DayPlan[];
}

export interface ScanHistoryItem {
  id: string;
  timestamp: number;
  medicineName: string;
  data: MedicineData;
}

export interface CabinetItem {
  id: string;
  medicineName: string;
  expiryDate: string; // YYYY-MM-DD
  addedAt: number;
  notes?: string;
  isExpired: boolean;
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
  customSoundData?: string; 
  voiceTone?: VoiceTone;
  voiceGender?: VoiceGender;
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
  INFO = 'INFO',
  CABINET = 'CABINET',
  EMERGENCY = 'EMERGENCY',
  DERMA = 'DERMA',
  SEARCH = 'SEARCH'
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
