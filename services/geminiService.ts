
import { GoogleGenAI, Type } from "@google/genai";
import { MedicineData, PatientProfile, ChatMessage, DermaData, ScanHistoryItem, DietPlan } from "../types.ts";

// Robustly retrieve API Key
const getApiKey = (): string => {
  // Check standard process.env (bundlers)
  if (typeof process !== "undefined" && process.env?.API_KEY) {
    return process.env.API_KEY;
  }
  // Check window polyfill (browser runtime)
  if (typeof window !== "undefined" && (window as any).process?.env?.API_KEY) {
    return (window as any).process.env.API_KEY;
  }
  console.warn("API Key not found in environment.");
  return "";
};

const apiKey = getApiKey();
const ai = new GoogleGenAI({ apiKey });

// Helper to clean JSON string (remove markdown fences if present)
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

// Define the medicine schema for structured JSON output as a plain object
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
    expiryDate: { type: Type.STRING, description: "The expiry date visible on the packaging in YYYY-MM-DD format. If not visible, leave empty." }
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
        title: { type: Type.STRING, description: "e.g. 7-Day Anti-Diabetic Meal Plan" },
        overview: { type: Type.STRING, description: "Short summary of why this diet helps" },
        avoidList: { type: Type.ARRAY, items: { type: Type.STRING } },
        includeList: { type: Type.ARRAY, items: { type: Type.STRING } },
        days: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    day: { type: Type.STRING, description: "Day 1, Day 2..." },
                    morning: { type: Type.STRING, description: "Early morning drink or snack" },
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

// Helper to parse errors into user-friendly messages
const getFriendlyErrorMessage = (error: any): string => {
    const msg = error.message || JSON.stringify(error) || "";
    if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("quota")) {
        return "Daily Scan Limit Reached. Please try again tomorrow.";
    }
    if (msg.includes("500") || msg.includes("overloaded")) {
        return "AI Service Busy. Please try again in a moment.";
    }
    if (msg.includes("invalid format")) {
        return "Analysis failed due to an invalid AI response format. Please try your scan again.";
    }
    // Generic fallback
    return "Analysis incomplete. Please try scanning again.";
};

// Fallback logic for models
const generateContentWithFallback = async (params: any): Promise<any> => {
    try {
        // Try the primary model - Using 1.5-flash as it is the most STABLE for general keys
        const response = await ai.models.generateContent({
            ...params,
            model: "gemini-1.5-flash"
        });
        return response;
    } catch (error: any) {
        console.warn("Primary model (1.5-flash) failed, trying fallback...", error);
        try {
            // Try fallback model - Using 1.5-pro as a reliable backup
            const response = await ai.models.generateContent({
                ...params,
                model: "gemini-1.5-pro"
            });
            return response;
        } catch (fallbackError) {
            // As a last resort, try legacy 1.0 pro if available, otherwise fail
            try {
                 const response = await ai.models.generateContent({
                    ...params,
                    model: "gemini-pro"
                });
                return response;
            } catch (finalError) {
                throw error; // Throw the original error if all fallbacks fail
            }
        }
    }
};

export const analyzeMedicineImage = async (base64Images: string[], profile: PatientProfile): Promise<MedicineData> => {
  try {
    const parts = base64Images.map(img => {
      const cleanBase64 = img.includes(",") ? img.split(",")[1] : img;
      return { inlineData: { mimeType: "image/jpeg", data: cleanBase64 } };
    });

    const promptText = {
      text: `Analyze the medicine in these ${base64Images.length} images for a ${profile.ageGroup} (${profile.gender}). 
      Language: ${profile.language}. 
      Pregnancy: ${profile.isPregnant ? 'Yes' : 'No'}. 
      Breastfeeding: ${profile.isBreastfeeding ? 'Yes' : 'No'}.`
    };

    const systemInstruction = `You are MediIQ AI, an expert OCR and medicine analysis system.
    CRITICAL RULE: You MUST ALWAYS output a valid JSON object matching the provided schema. NEVER output plain text, markdown, or any other format.
    
    IMAGE QUALITY TOLERANCE:
    - You are designed to read text from blurry, low-light, rotated, or partially obscured images. ATTEMPT to read the text no matter the quality.
    - If you can read ANY part of the medicine name, use it. Make a best-effort guess.
    
    FAILURE SCENARIO:
    - If an image is COMPLETELY unreadable (e.g., pure black, no distinguishable features), you MUST still return a valid JSON object.
    - In this case, use "Unreadable Image" for the 'name' field, and fill other fields with generic safety warnings like "Consult a doctor as the medicine is unreadable." and set riskScore to "High".
    
    DO NOT DEVIATE. JSON output is mandatory.`;

    // Use fallback wrapper
    const response = await generateContentWithFallback({
      contents: {
        parts: [...parts, promptText]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: MEDICINE_SCHEMA,
        systemInstruction: systemInstruction
      }
    });

    if (!response.text) {
        throw new Error("AI returned an empty response.");
    }
    
    try {
        const cleanedText = cleanJsonString(response.text);
        return JSON.parse(cleanedText) as MedicineData;
    } catch (jsonError) {
        console.error("JSON Parsing Error:", jsonError);
        console.error("Raw AI Response:", response.text);
        throw new Error("AI returned an invalid format. This might be a temporary issue.");
    }
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
      contents: {
        parts: [...parts, { text: "Analyze this skin condition. Identify possible issues like Eczema, Acne, Ringworm, Hives, etc. Provide generic OTC treatment suggestions." }]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: DERMA_SCHEMA,
        systemInstruction: "You are a specialized Dermatology Assistant AI. \n1. Analyze the skin image carefully.\n2. Identify the most probable condition (e.g., Eczema, Acne, Bug Bite, Contact Dermatitis).\n3. Suggest COMMON Over-The-Counter (OTC) creams or treatments (e.g., Hydrocortisone, Calamine, Salicylic Acid).\n4. If the image is NOT skin, return a conditionName of 'Not Skin'.\n5. ALWAYS include a strong disclaimer that you are an AI and they must see a doctor."
      }
    });

    if (response.text) {
      const cleanedText = cleanJsonString(response.text);
      return JSON.parse(cleanedText) as DermaData;
    }
    throw new Error("No response");
  } catch (error) {
    console.error("Derma Analysis Error:", error);
    throw new Error("Could not analyze skin condition. Please try again.");
  }
};

export const generateDietPlan = async (medicineName: string, uses: string[], profile: PatientProfile): Promise<DietPlan> => {
    try {
        const prompt = `Create a 7-Day Diet Plan for a patient taking ${medicineName}. 
        The medicine suggests the user has issues related to: ${uses.join(', ')}.
        Patient Profile: ${profile.ageGroup} ${profile.gender}, Language: ${profile.language}.
        Region/Style: "Desi" Indian Diet (Use simple home cooked meals like Roti, Dal, Sabzi, Methi water etc).
        If the condition is Diabetes, focus on low GI. If Cholesterol, focus on low oil/fat.
        Format: JSON.`;

        const response = await generateContentWithFallback({
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: DIET_SCHEMA
            }
        });

        if (response.text) {
            const cleanedText = cleanJsonString(response.text);
            return JSON.parse(cleanedText) as DietPlan;
        }
        throw new Error("Failed to generate diet");
    } catch (e) {
        console.error("Diet Generation Error", e);
        throw e;
    }
};

export const checkConditionSafety = async (medicineName: string, condition: string): Promise<string> => {
  try {
    const response = await generateContentWithFallback({
      contents: `Safety check: Can I take ${medicineName} if I have ${condition}? Reply in 2 short sentences.`
    });
    return response.text || "Consult your doctor for specific advice.";
  } catch (e) {
    return "Unable to verify due to high traffic. Please ask your doctor.";
  }
};

export const getHealthTip = async (): Promise<string> => {
    try {
        const response = await generateContentWithFallback({
            contents: "Provide one short daily health tip about medicine safety (15 words max)."
        });
        return response.text || "Always check the expiry date of your medicines.";
    } catch (e) {
        console.error("Health Tip Error", e);
        return "Stay hydrated and consult your doctor regularly.";
    }
}

export const getDoctorAIResponse = async (history: ChatMessage[], scanHistory?: ScanHistoryItem[]): Promise<string> => {
  try {
    let contextData = "";
    if (scanHistory && scanHistory.length > 0) {
        const recentMedNames = scanHistory.slice(0, 5).map(item => item.medicineName).join(', ');
        contextData = `
        CONTEXT: The user's 5 most recent medicine scans are: [${recentMedNames}].
        Use this scan history to answer questions about past medicines or potential interactions.
        For example, if the user asks "can I take this with what I took yesterday?", refer to this list.
        `;
    }

    const MAX_HISTORY_MESSAGES = 10; // Reduced history to prevent overload
    const relevantHistory = history.filter(msg => msg.id !== 'welcome' && msg.content.trim() !== '');
    const truncatedHistory = relevantHistory.slice(-MAX_HISTORY_MESSAGES);

    const contents = truncatedHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    if (contents.length === 0) {
        return "How can I help you today?";
    }

    const systemInstruction = `You are 'MediIQ Doctor AI', a professional and empathetic medical assistant. 
    ${contextData}
    Help users understand symptoms, health conditions, and wellness. 
    ALWAYS include a disclaimer that you are an AI and not a real doctor. 
    If symptoms sound severe, strongly advise visiting an Emergency Room immediately. 
    Keep responses concise and structured with bullet points where appropriate.`;
    
    // Using fallback logic for Doctor AI as well
    try {
        const response = await generateContentWithFallback({
            contents: contents,
            config: { systemInstruction }
        });
        return response.text || "I apologize, I'm having trouble processing that right now. Could you rephrase?";
    } catch (error: any) {
        const errorMsg = JSON.stringify(error);
        console.error("Doctor AI Critical Error:", errorMsg); 
        if (errorMsg.includes("429") || errorMsg.includes("quota")) {
            return "Server usage limit reached. Please come back tomorrow.";
        }
        return "I am currently unavailable due to a technical issue. Please try again in a moment. If the problem continues, clearing the chat might help resolve it.";
    }
  } catch (error) {
    console.error("Doctor AI Top-Level Error:", error);
    return "I'm currently unable to assist due to a connection issue. If this is an emergency, please call local medical services immediately.";
  }
};
