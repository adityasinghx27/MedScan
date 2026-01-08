
import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { MedicineData, PatientProfile, ChatMessage, DermaData, ScanHistoryItem, DietPlan } from "../types.ts";

// Robustly retrieve API Key
const getApiKey = (): string => {
  if (typeof process !== "undefined" && process.env?.API_KEY) {
    return process.env.API_KEY;
  }
  if (typeof window !== "undefined" && (window as any).process?.env?.API_KEY) {
    return (window as any).process.env.API_KEY;
  }
  return "";
};

const apiKey = getApiKey();
const ai = new GoogleGenAI({ apiKey });

// SAFETY SETTINGS: Crucial for Medical Apps
const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

const cleanJsonString = (str: string): string => {
    if (!str) return "{}";
    let cleaned = str.trim();
    if (cleaned.startsWith("```json")) {
        cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }
    return cleaned;
};

// Define the medicine schema
const MEDICINE_SCHEMA: any = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    medicationsFound: { type: Type.ARRAY, items: { type: Type.STRING } },
    description: { type: Type.STRING },
    simpleExplanation: { type: Type.STRING },
    childFriendlyExplanation: { type: Type.STRING },
    uses: { type: Type.ARRAY, items: { type: Type.STRING } },
    dosage: { type: Type.STRING },
    sideEffects: { type: Type.ARRAY, items: { type: Type.STRING } },
    warnings: { type: Type.STRING },
    keyWarning: { type: Type.STRING },
    riskScore: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
    riskReason: { type: Type.STRING },
    whoShouldAvoid: { type: Type.ARRAY, items: { type: Type.STRING } },
    foodGuidance: { type: Type.STRING },
    alternatives: { type: Type.ARRAY, items: { type: Type.STRING } },
    interactionAnalysis: {
      type: Type.OBJECT,
      properties: {
        severity: { type: Type.STRING, enum: ["Safe", "Warning", "Dangerous"] },
        summary: { type: Type.STRING },
        advice: { type: Type.STRING }
      },
      required: ["severity", "summary", "advice"]
    },
    effectTimeline: {
        type: Type.OBJECT,
        properties: {
            onset: { type: Type.STRING },
            peak: { type: Type.STRING },
            duration: { type: Type.STRING }
        },
        required: ["onset", "peak", "duration"]
    },
    lifestyleWarnings: {
        type: Type.OBJECT,
        properties: {
            alcohol: { type: Type.BOOLEAN },
            driving: { type: Type.BOOLEAN },
            sleep: { type: Type.BOOLEAN }
        },
        required: ["alcohol", "driving", "sleep"]
    },
    safetyRating: { type: Type.NUMBER },
    commonQuestions: {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                question: { type: Type.STRING },
                answer: { type: Type.STRING }
            },
            required: ["question", "answer"]
        }
    },
    criticalWarning: { type: Type.STRING },
    pregnancyWarning: { type: Type.STRING },
    breastfeedingWarning: { type: Type.STRING },
    ageAdvice: { type: Type.STRING },
    expiryDate: { type: Type.STRING, description: "YYYY-MM-DD format" }
  },
  required: [
    "name", "medicationsFound", "description", "simpleExplanation", "childFriendlyExplanation", "uses", "dosage", 
    "sideEffects", "warnings", "keyWarning", "riskScore", "riskReason", "whoShouldAvoid", 
    "foodGuidance", "alternatives", "ageAdvice", "effectTimeline", "lifestyleWarnings", "safetyRating", "commonQuestions"
  ]
};

const DERMA_SCHEMA: any = {
  type: Type.OBJECT,
  properties: {
    conditionName: { type: Type.STRING },
    confidence: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
    severity: { type: Type.STRING, enum: ["Mild", "Moderate", "Severe"] },
    description: { type: Type.STRING },
    symptomsObserved: { type: Type.ARRAY, items: { type: Type.STRING } },
    possibleCauses: { type: Type.ARRAY, items: { type: Type.STRING } },
    homeRemedies: { type: Type.ARRAY, items: { type: Type.STRING } },
    otcSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
    whenToSeeDoctor: { type: Type.STRING },
    isContagious: { type: Type.BOOLEAN },
    disclaimer: { type: Type.STRING }
  },
  required: ["conditionName", "severity", "description", "symptomsObserved", "homeRemedies", "otcSuggestions", "whenToSeeDoctor", "disclaimer"]
};

const DIET_SCHEMA: any = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING },
        overview: { type: Type.STRING },
        avoidList: { type: Type.ARRAY, items: { type: Type.STRING } },
        includeList: { type: Type.ARRAY, items: { type: Type.STRING } },
        days: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    day: { type: Type.STRING },
                    morning: { type: Type.STRING },
                    breakfast: { type: Type.STRING },
                    lunch: { type: Type.STRING },
                    snack: { type: Type.STRING },
                    dinner: { type: Type.STRING },
                    tip: { type: Type.STRING }
                },
                required: ["day", "morning", "breakfast", "lunch", "snack", "dinner", "tip"]
            }
        }
    },
    required: ["title", "overview", "avoidList", "includeList", "days"]
};

const getFriendlyErrorMessage = (error: any): string => {
    const msg = error.message || JSON.stringify(error) || "";
    if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) return "Daily Scan Limit Reached. Please try again tomorrow.";
    if (msg.includes("500") || msg.includes("overloaded")) return "AI Service Busy. Please try again in a moment.";
    if (msg.includes("404") || msg.includes("NOT_FOUND")) return "AI Model unavailable. Retrying with backup...";
    if (msg.includes("invalid format")) return "Analysis failed. Please try a clearer image.";
    return "Analysis incomplete. Please try scanning again.";
};

// Smart Fallback Strategy
const generateContentWithFallback = async (params: any): Promise<any> => {
    // Add safety settings to ALL requests
    const configWithSafety = {
        ...params.config,
        safetySettings: SAFETY_SETTINGS
    };

    // Determine if this is a vision request (has images) by checking inlineData structure
    // Checking both direct params.contents or if it is an array of messages
    let isVision = false;
    if (params.contents && !Array.isArray(params.contents)) {
        // Single request object
        if (params.contents.parts) {
            isVision = params.contents.parts.some((p: any) => p.inlineData);
        }
    } else if (Array.isArray(params.contents)) {
        // Array of messages (Chat)
        isVision = params.contents.some((c: any) => c.parts && c.parts.some((p: any) => p.inlineData));
    }

    // Define model priority list based on task
    // 1.5-flash: Fast, Standard
    // 2.0-flash-exp: New, Experimental (often works when 1.5 doesn't)
    // 1.5-pro: High Quality
    let models = ["gemini-1.5-flash", "gemini-2.0-flash-exp", "gemini-1.5-pro"];
    
    // If it's purely text (like Doctor AI), we can add the legacy gemini-pro as a final hail-mary
    if (!isVision) {
        models.push("gemini-pro");
    }

    let lastError = null;

    for (const modelName of models) {
        try {
            console.log(`MediIQ: Attempting AI request with model: ${modelName}`);
            const response = await ai.models.generateContent({
                ...params,
                model: modelName,
                config: configWithSafety
            });
            return response;
        } catch (error: any) {
            console.warn(`MediIQ: Model ${modelName} failed:`, error.message);
            lastError = error;
            // Continue to next model in loop
        }
    }
    
    // If we get here, all models failed
    throw lastError;
};

export const analyzeMedicineImage = async (base64Images: string[], profile: PatientProfile): Promise<MedicineData> => {
  try {
    const parts = base64Images.map(img => {
      const cleanBase64 = img.includes(",") ? img.split(",")[1] : img;
      return { inlineData: { mimeType: "image/jpeg", data: cleanBase64 } };
    });

    const promptText = {
      text: `Analyze the medicine in these images for a ${profile.ageGroup} (${profile.gender}). 
      Language: ${profile.language}. 
      Pregnancy: ${profile.isPregnant ? 'Yes' : 'No'}. 
      Breastfeeding: ${profile.isBreastfeeding ? 'Yes' : 'No'}.`
    };

    const systemInstruction = `You are MediIQ AI, an expert OCR and medicine analysis system.
    CRITICAL RULE: Output valid JSON only matching the schema.
    If image is unreadable, set 'name' to 'Unreadable' and 'riskScore' to 'High'.`;

    const response = await generateContentWithFallback({
      contents: { parts: [...parts, promptText] },
      config: {
        responseMimeType: "application/json",
        responseSchema: MEDICINE_SCHEMA,
        systemInstruction: systemInstruction
      }
    });

    if (!response.text) throw new Error("Empty response");
    return JSON.parse(cleanJsonString(response.text)) as MedicineData;
  } catch (error) {
    console.error("Analysis Error:", error);
    throw new Error(getFriendlyErrorMessage(error));
  }
};

export const analyzeSkinCondition = async (base64Image: string): Promise<DermaData> => {
  try {
    const cleanBase64 = base64Image.includes(",") ? base64Image.split(",")[1] : base64Image;
    const parts = [{ inlineData: { mimeType: "image/jpeg", data: cleanBase64 } }];

    const response = await generateContentWithFallback({
      contents: { parts: [...parts, { text: "Analyze this skin condition. Identify possible issues." }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: DERMA_SCHEMA,
        systemInstruction: "You are a specialized Dermatology AI. Identify condition, suggest OTC meds, and advise seeing a doctor."
      }
    });

    if (response.text) return JSON.parse(cleanJsonString(response.text)) as DermaData;
    throw new Error("No response");
  } catch (error) {
    throw new Error("Could not analyze skin condition.");
  }
};

export const generateDietPlan = async (medicineName: string, uses: string[], profile: PatientProfile): Promise<DietPlan> => {
    try {
        const prompt = `Create a 7-Day Diet Plan for a patient taking ${medicineName}. Issues: ${uses.join(', ')}. Profile: ${profile.ageGroup}. Style: Indian/Desi.`;
        const response = await generateContentWithFallback({
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: DIET_SCHEMA
            }
        });
        if (response.text) return JSON.parse(cleanJsonString(response.text)) as DietPlan;
        throw new Error("Failed to generate diet");
    } catch (e) {
        throw e;
    }
};

export const checkConditionSafety = async (medicineName: string, condition: string): Promise<string> => {
  try {
    const response = await generateContentWithFallback({
      contents: `Can I take ${medicineName} if I have ${condition}? Short answer.`
    });
    return response.text || "Consult doctor.";
  } catch (e) {
    return "Please ask your doctor.";
  }
};

export const getHealthTip = async (): Promise<string> => {
    try {
        const response = await generateContentWithFallback({
            contents: "One short health tip about medicine safety (15 words max)."
        });
        return response.text || "Check expiry dates.";
    } catch (e) {
        return "Stay hydrated.";
    }
}

export const getDoctorAIResponse = async (history: ChatMessage[], scanHistory?: ScanHistoryItem[]): Promise<string> => {
  try {
    let contextData = "";
    if (scanHistory && scanHistory.length > 0) {
        const recentMedNames = scanHistory.slice(0, 5).map(item => item.medicineName).join(', ');
        contextData = `User's recent scans: [${recentMedNames}]. Use this for context.`;
    }

    const relevantHistory = history.filter(msg => msg.id !== 'welcome' && msg.content.trim() !== '').slice(-10);
    const contents = relevantHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    if (contents.length === 0) return "How can I help?";

    const systemInstruction = `You are MediIQ Doctor AI. ${contextData}
    Provide helpful medical info. Always disclaim you are an AI. Advising on symptoms? Suggest a doctor.`;
    
    const response = await generateContentWithFallback({
        contents: contents,
        config: { systemInstruction }
    });
    return response.text || "I'm having trouble responding. Please try again.";
  } catch (error: any) {
    console.error("Doctor AI Error:", error);
    if (error.message?.includes("429")) return "I am busy right now. Please try again later.";
    return "I cannot answer right now due to a connection issue.";
  }
};
