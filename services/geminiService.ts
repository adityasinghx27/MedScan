// @ts-nocheck
import { GoogleGenAI, Type } from "@google/genai";

// ---------------------------------------------------------
// 👇👇👇 SIRF YAHAN APNI KEY DALEIN 👇👇👇
// ---------------------------------------------------------

// In quotes ke beech mein apni lambi wali Key paste karein
const API_KEY = "AIzaSyCiAA2DhF7VlNKDBN5dWVl3ko4GqOoEYtw"; 

// ---------------------------------------------------------

const MODEL_NAME = "gemini-1.5-flash";

const ai = new GoogleGenAI({ apiKey: API_KEY });

// ✅ SAFETY SETTINGS
const SAFETY_SETTINGS = [
  { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" }
];

// ---------------------- SCHEMAS (Fixed 'Type' Error) ----------------------

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
    expiryDate: { type: Type.STRING }
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

// ---------------------- MAIN FUNCTIONS ----------------------

const getFriendlyErrorMessage = (error: any): string => {
    const msg = error.message || JSON.stringify(error) || "";
    if (msg.includes("429") || msg.includes("quota")) return "Daily Limit Reached.";
    if (msg.includes("500") || msg.includes("overloaded")) return "Server Busy. Please retry.";
    return `Scan Failed: ${msg.substring(0, 50)}...`;
};

export const analyzeMedicineImage = async (base64Images: string[], profile: any): Promise<any> => {
  try {
    const parts = base64Images.map(img => {
      const cleanBase64 = img.includes(",") ? img.split(",")[1] : img;
      return { inlineData: { mimeType: "image/jpeg", data: cleanBase64 } };
    });

    const systemInstruction = `You are MediIQ AI. 
    IMPORTANT: Ignore blurriness. ALWAYS try to read the text.
    Output MUST be valid JSON.`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [...parts, { text: `Analyze medicine for ${profile.ageGroup}. Lang: ${profile.language}.` }]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: MEDICINE_SCHEMA,
        systemInstruction: systemInstruction,
        safetySettings: SAFETY_SETTINGS
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
    return "Doctor AI is currently unavailable. Please retry.";
  }
};

