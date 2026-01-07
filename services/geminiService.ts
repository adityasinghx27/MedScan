// @ts-nocheck
import { GoogleGenAI, SchemaType } from "@google/genai";

// ---------------------------------------------------------
// CONFIGURATION
// ---------------------------------------------------------

// ✅ FIX: Match the Vercel Variable Name
// Hum 'REACT_APP_GEMINI_KEY' pehle check karenge kyunki wo standard hai
const API_KEY = process.env.REACT_APP_GEMINI_KEY || process.env.NEXT_PUBLIC_GEMINI_KEY || "dummy_key";

// ✅ MODEL: Using the most stable model to prevent 'Unavailable' errors
const MODEL_NAME = "gemini-1.5-flash";

const ai = new GoogleGenAI({ apiKey: API_KEY });

// ✅ SAFETY SETTINGS: Disable filters so it doesn't reject "Blurry" images
const SAFETY_SETTINGS = [
  { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" }
];

// ---------------------------------------------------------
// SCHEMAS (Data Structure)
// ---------------------------------------------------------

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
    expiryDate: { type: SchemaType.STRING }
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

// ---------------------------------------------------------
// ERROR HANDLING
// ---------------------------------------------------------

const getFriendlyErrorMessage = (error: any): string => {
    const msg = error.message || JSON.stringify(error) || "";
    console.error("Gemini Error Log:", msg); // For debugging
    
    if (msg.includes("429") || msg.includes("quota")) return "Daily Scan Limit Reached. Try again tomorrow.";
    if (msg.includes("500") || msg.includes("overloaded") || msg.includes("unavailable")) return "Server Busy. Please retry.";
    if (msg.includes("API Key") || msg.includes("API_KEY")) return "System Error: API Key is missing or invalid.";
    return `Scan Failed: ${msg.substring(0, 50)}...`;
};

// ---------------------------------------------------------
// MAIN EXPORTED FUNCTIONS
// ---------------------------------------------------------

export const analyzeMedicineImage = async (base64Images: string[], profile: any): Promise<any> => {
  try {
    const parts = base64Images.map(img => {
      const cleanBase64 = img.includes(",") ? img.split(",")[1] : img;
      return { inlineData: { mimeType: "image/jpeg", data: cleanBase64 } };
    });

    // Prompt to force reading blurry text
    const systemInstruction = `You are MediIQ AI. 
    IMPORTANT: You are an expert at reading BLURRY and LOW LIGHT images.
    1. NEVER reject an image because it is blurry. ALWAYS try to read the text.
    2. If you see even 2-3 letters, guess the medicine name.
    3. Output MUST be valid JSON.
    4. If completely unreadable, set name to "Unknown Medicine".`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [...parts, { text: `Analyze medicine for ${profile.ageGroup}. Lang: ${profile.language}.` }]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: MEDICINE_SCHEMA,
        systemInstruction: systemInstruction,
        safetySettings: SAFETY_SETTINGS // ✅ Safety check OFF
      }
    });

    if (!response.text) throw new Error("Empty Response");
    return JSON.parse(response.text);

  } catch (error) {
    throw new Error(getFriendlyErrorMessage(error));
  }
};

export const analyzeSkinCondition = async (base64Image: string): Promise<any> => {
  try {
    const cleanBase64 = base64Image.includes(",") ? base64Image.split(",")[1] : base64Image;
    const parts = [{ inlineData: { mimeType: "image/jpeg", data: cleanBase64 } }];

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: { parts: [...parts, { text: "Analyze skin condition." }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: DERMA_SCHEMA,
        safetySettings: SAFETY_SETTINGS
      }
    });

    if (response.text) return JSON.parse(response.text);
    throw new Error("No response");
  } catch (error) {
    throw new Error("Skin analysis failed.");
  }
};

export const generateDietPlan = async (medicineName: string, uses: string[], profile: any): Promise<any> => {
    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: `7-Day Indian Diet Plan for ${medicineName}. JSON.`,
            config: { 
                responseMimeType: "application/json", 
                responseSchema: DIET_SCHEMA,
                safetySettings: SAFETY_SETTINGS 
            }
        });
        if (response.text) return JSON.parse(response.text);
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
    } catch (e) { return "Unavailable."; }
};

// ✅ DOCTOR AI FIX
export const getDoctorAIResponse = async (history: any[], scanHistory?: any[]): Promise<string> => {
  try {
    let contextData = "";
    if (scanHistory?.length) {
        contextData = `User's recent scans: [${scanHistory.slice(0, 5).map(i => i.medicineName).join(', ')}].`;
    }

    const relevantHistory = history.filter(msg => msg.id !== 'welcome' && msg.content.trim() !== '');
    const contents = relevantHistory.slice(-10).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    if (contents.length === 0) return "How can I help you today?";

    const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: contents,
        config: { 
            systemInstruction: `You are Doctor AI. ${contextData}. Keep answers short.`,
            safetySettings: SAFETY_SETTINGS 
        }
    });

    return response?.text || "I'm having trouble connecting.";

  } catch (error) {
    console.error("Doctor AI Error:", error);
    return "Doctor AI is currently unavailable (Network/API Error). Please retry.";
  }
};

