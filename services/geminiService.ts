import { GoogleGenAI, SchemaType } from "@google/genai";
import { MedicineData, PatientProfile, ChatMessage, DermaData, ScanHistoryItem, DietPlan } from "../types";

// ✅ CONFIG: Hum yahan sabse STABLE model use karenge taaki 'Unavailable' error na aaye.
// Agar aapko Gemini 3 hi use karna hai, to niche "gemini-3-flash-preview" likh sakte ho.
// Lekin "gemini-1.5-flash" abhi sabse badhiya chal raha hai (Error Free).
const MODEL_NAME = "gemini-1.5-flash"; 

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// ---------------------- SCHEMAS (Data Structure) ---------------------- //

const MEDICINE_SCHEMA: any = {
  type: SchemaType.OBJECT,
  properties: {
    name: { type: SchemaType.STRING },
    medicationsFound: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    description: { type: SchemaType.STRING },
    simpleExplanation: { type: SchemaType.STRING },
    childFriendlyExplanation: { type: SchemaType.STRING },
    uses: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    dosage: { type: SchemaType.STRING },
    sideEffects: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    warnings: { type: SchemaType.STRING },
    keyWarning: { type: SchemaType.STRING },
    riskScore: { type: SchemaType.STRING, enum: ["Low", "Medium", "High"] },
    riskReason: { type: SchemaType.STRING },
    whoShouldAvoid: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    foodGuidance: { type: SchemaType.STRING },
    alternatives: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    interactionAnalysis: {
      type: SchemaType.OBJECT,
      properties: {
        severity: { type: SchemaType.STRING, enum: ["Safe", "Warning", "Dangerous"] },
        summary: { type: SchemaType.STRING },
        advice: { type: SchemaType.STRING }
      },
      required: ["severity", "summary", "advice"]
    },
    effectTimeline: {
        type: SchemaType.OBJECT,
        properties: {
            onset: { type: SchemaType.STRING },
            peak: { type: SchemaType.STRING },
            duration: { type: SchemaType.STRING }
        },
        required: ["onset", "peak", "duration"]
    },
    lifestyleWarnings: {
        type: SchemaType.OBJECT,
        properties: {
            alcohol: { type: SchemaType.BOOLEAN },
            driving: { type: SchemaType.BOOLEAN },
            sleep: { type: SchemaType.BOOLEAN }
        },
        required: ["alcohol", "driving", "sleep"]
    },
    safetyRating: { type: SchemaType.NUMBER },
    commonQuestions: {
        type: SchemaType.ARRAY,
        items: {
            type: SchemaType.OBJECT,
            properties: {
                question: { type: SchemaType.STRING },
                answer: { type: SchemaType.STRING }
            },
            required: ["question", "answer"]
        }
    },
    criticalWarning: { type: SchemaType.STRING },
    pregnancyWarning: { type: SchemaType.STRING },
    breastfeedingWarning: { type: SchemaType.STRING },
    ageAdvice: { type: SchemaType.STRING },
    expiryDate: { type: SchemaType.STRING, description: "Expiry date in YYYY-MM-DD format if visible." }
  },
  required: [
    "name", "medicationsFound", "description", "simpleExplanation", "childFriendlyExplanation", "uses", "dosage", 
    "sideEffects", "warnings", "keyWarning", "riskScore", "riskReason", "whoShouldAvoid", 
    "foodGuidance", "alternatives", "ageAdvice", "effectTimeline", "lifestyleWarnings", "safetyRating", "commonQuestions"
  ]
};

const DERMA_SCHEMA: any = {
  type: SchemaType.OBJECT,
  properties: {
    conditionName: { type: SchemaType.STRING },
    confidence: { type: SchemaType.STRING, enum: ["High", "Medium", "Low"] },
    severity: { type: SchemaType.STRING, enum: ["Mild", "Moderate", "Severe"] },
    description: { type: SchemaType.STRING },
    symptomsObserved: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    possibleCauses: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    homeRemedies: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    otcSuggestions: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    whenToSeeDoctor: { type: SchemaType.STRING },
    isContagious: { type: SchemaType.BOOLEAN },
    disclaimer: { type: SchemaType.STRING }
  },
  required: ["conditionName", "severity", "description", "symptomsObserved", "homeRemedies", "otcSuggestions", "whenToSeeDoctor", "disclaimer"]
};

const DIET_SCHEMA: any = {
    type: SchemaType.OBJECT,
    properties: {
        title: { type: SchemaType.STRING },
        overview: { type: SchemaType.STRING },
        avoidList: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        includeList: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        days: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    day: { type: SchemaType.STRING },
                    morning: { type: SchemaType.STRING },
                    breakfast: { type: SchemaType.STRING },
                    lunch: { type: SchemaType.STRING },
                    snack: { type: SchemaType.STRING },
                    dinner: { type: SchemaType.STRING },
                    tip: { type: SchemaType.STRING }
                },
                required: ["day", "morning", "breakfast", "lunch", "snack", "dinner", "tip"]
            }
        }
    },
    required: ["title", "overview", "avoidList", "includeList", "days"]
};

// ---------------------- ERROR HANDLING ---------------------- //

const getFriendlyErrorMessage = (error: any): string => {
    const msg = error.message || JSON.stringify(error) || "";
    if (msg.includes("429") || msg.includes("quota")) return "Daily Limit Reached. Try again later.";
    if (msg.includes("500") || msg.includes("overloaded") || msg.includes("unavailable")) return "Server Busy. Please retry.";
    return "Could not analyze. Please try a clearer photo.";
};

// ---------------------- MAIN FUNCTIONS ---------------------- //

export const analyzeMedicineImage = async (base64Images: string[], profile: PatientProfile): Promise<MedicineData> => {
  try {
    const parts = base64Images.map(img => {
      const cleanBase64 = img.includes(",") ? img.split(",")[1] : img;
      return { inlineData: { mimeType: "image/jpeg", data: cleanBase64 } };
    });

    const promptText = {
      text: `Analyze this medicine for ${profile.ageGroup} (${profile.gender}). Language: ${profile.language}.`
    };

    // ✅ FIX: Strict instructions to IGNORE blurriness
    const systemInstruction = `You are MediIQ AI. 
    IMPORTANT: You are an expert at reading BLURRY and LOW LIGHT images.
    1. NEVER reject an image because it is blurry. ALWAYS try to read the text.
    2. If you see even 2-3 letters, guess the medicine name.
    3. Output MUST be valid JSON.
    4. If completely unreadable, set name to "Unknown Medicine" but fill other fields with general advice.`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: { parts: [...parts, promptText] },
      config: {
        responseMimeType: "application/json",
        responseSchema: MEDICINE_SCHEMA,
        systemInstruction: systemInstruction
      }
    });

    if (!response.text) throw new Error("Empty response");
    return JSON.parse(response.text) as MedicineData;

  } catch (error) {
    console.error("Scan Error:", error);
    throw new Error(getFriendlyErrorMessage(error));
  }
};

export const analyzeSkinCondition = async (base64Image: string): Promise<DermaData> => {
  try {
    const cleanBase64 = base64Image.includes(",") ? base64Image.split(",")[1] : base64Image;
    const parts = [{ inlineData: { mimeType: "image/jpeg", data: cleanBase64 } }];

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: { parts: [...parts, { text: "Analyze this skin condition." }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: DERMA_SCHEMA,
        systemInstruction: "You are a Dermatology AI. Identify condition. Suggest OTC treatments. Include Disclaimer."
      }
    });

    if (response.text) return JSON.parse(response.text) as DermaData;
    throw new Error("No response");
  } catch (error) {
    throw new Error("Skin analysis failed.");
  }
};

export const generateDietPlan = async (medicineName: string, uses: string[], profile: PatientProfile): Promise<DietPlan> => {
    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: `Create a 7-Day Indian Diet Plan for someone taking ${medicineName}. JSON format.`,
            config: { responseMimeType: "application/json", responseSchema: DIET_SCHEMA }
        });
        if (response.text) return JSON.parse(response.text) as DietPlan;
        throw new Error("Failed to generate diet");
    } catch (e) { throw e; }
};

export const checkConditionSafety = async (medicineName: string, condition: string): Promise<string> => {
    try {
        const res = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: `Can I take ${medicineName} with ${condition}? Short answer.`
        });
        return res.text || "Consult doctor.";
    } catch (e) { return "Check with doctor."; }
};

export const getHealthTip = async (): Promise<string> => {
    try {
        const res = await ai.models.generateContent({ model: MODEL_NAME, contents: "One short health tip." });
        return res.text || "Stay hydrated.";
    } catch (e) { return "Health Tip Unavailable."; }
};

// ✅ FIX: Doctor AI with RETRY LOGIC (To fix 'Unavailable' error)
export const getDoctorAIResponse = async (history: ChatMessage[], scanHistory?: ScanHistoryItem[]): Promise<string> => {
  try {
    let contextData = "";
    if (scanHistory?.length) {
        contextData = `User's recent scans: [${scanHistory.slice(0, 5).map(i => i.medicineName).join(', ')}].`;
    }

    const relevantHistory = history.filter(msg => msg.id !== 'welcome' && msg.content.trim() !== '');
    const contents = relevantHistory.slice(-15).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    if (contents.length === 0) return "How can I help you today?";

    const systemInstruction = `You are 'MediIQ Doctor AI'. ${contextData}
    If a scanned medicine image was blurry, DO NOT complain. Ask the user to type the name.
    Keep answers short and helpful. Always include disclaimer.`;

    // 🔄 RETRY LOGIC: Agar pehla model fail ho, to dusra try karo
    const generateWithRetry = async () => {
        try {
            // Attempt 1: Try with Stable Model (Fast)
            return await ai.models.generateContent({
                model: "gemini-1.5-flash",
                contents: contents,
                config: { systemInstruction }
            });
        } catch (e) {
            console.warn("Flash failed, trying Pro/Preview...", e);
            // Attempt 2: Try with Pro/Preview Model (Smart)
            return await ai.models.generateContent({
                model: "gemini-1.5-pro", // Ya "gemini-3-flash-preview" agar available hai
                contents: contents,
                config: { systemInstruction }
            });
        }
    };

    const response = await generateWithRetry();
    return response?.text || "I'm having trouble connecting. Please try again.";

  } catch (error) {
    console.error("Doctor AI Error:", error);
    return "I am currently unavailable due to network issues. Please try again in a moment.";
  }
};

