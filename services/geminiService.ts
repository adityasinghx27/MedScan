
import { GoogleGenAI, Type } from "@google/genai";
import { MedicineData, PatientProfile, ChatMessage, DermaData, ScanHistoryItem, DietPlan } from "../types.ts";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Define the medicine schema for structured JSON output as a plain object to avoid deprecated types
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
    const msg = JSON.stringify(error) || "";
    if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("quota")) {
        return "Daily Scan Limit Reached. Please try again tomorrow.";
    }
    if (msg.includes("500") || msg.includes("overloaded")) {
        return "AI Service Busy. Please try again in a moment.";
    }
    return "Scan failed. Ensure image is clear and try again.";
};

export const analyzeMedicineImage = async (base64Images: string[], profile: PatientProfile): Promise<MedicineData> => {
  try {
    const parts = base64Images.map(img => {
      const cleanBase64 = img.includes(",") ? img.split(",")[1] : img;
      return { inlineData: { mimeType: "image/jpeg", data: cleanBase64 } };
    });

    const promptText = {
      text: `Analyze all medicines shown in these ${base64Images.length} images for a ${profile.ageGroup} (${profile.gender}). 
      Language: ${profile.language}. 
      Pregnancy: ${profile.isPregnant ? 'Yes' : 'No'}. 
      Breastfeeding: ${profile.isBreastfeeding ? 'Yes' : 'No'}.
      IMPORTANT: Specifically check if these medicines interact with each other and are safe to take as a combination.
      CRITICAL: Look for the Expiry Date (EXP) on the package and extract it in YYYY-MM-DD format.`
    };

    // System instruction updated to prioritize extraction even from imperfect images
    const systemInstruction = "You are MediIQ AI. Provide professional, accurate medicine analysis. " + 
        "ALWAYS attempt to extract text, even if the image is slightly blurry, low light, or rotated. " +
        "Only return an error if the image is completely black, white, or contains absolutely no recognizable object. " +
        "Try to detect the Expiry Date from the image.";

    try {
        const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
            parts: [...parts, promptText]
        },
        config: {
            responseMimeType: "application/json",
            responseSchema: MEDICINE_SCHEMA,
            systemInstruction: systemInstruction
        }
        });

        if (response.text) {
            return JSON.parse(response.text) as MedicineData;
        }
    } catch (innerError) {
        console.warn("Primary analysis attempt failed:", innerError);
        throw innerError; 
    }
    
    throw new Error("Empty AI response");
  } catch (error) {
    console.error("Analysis Error:", error);
    throw new Error(getFriendlyErrorMessage(error));
  }
};

export const analyzeSkinCondition = async (base64Image: string): Promise<DermaData> => {
  try {
    const cleanBase64 = base64Image.includes(",") ? base64Image.split(",")[1] : base64Image;
    const parts = [{ inlineData: { mimeType: "image/jpeg", data: cleanBase64 } }];

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
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
      return JSON.parse(response.text) as DermaData;
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

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: DIET_SCHEMA
            }
        });

        if (response.text) {
            return JSON.parse(response.text) as DietPlan;
        }
        throw new Error("Failed to generate diet");
    } catch (e) {
        console.error("Diet Generation Error", e);
        throw e;
    }
};

export const checkConditionSafety = async (medicineName: string, condition: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Safety check: Can I take ${medicineName} if I have ${condition}? Reply in 2 short sentences.`
    });
    return response.text || "Consult your doctor for specific advice.";
  } catch (e) {
    return "Unable to verify due to high traffic. Please ask your doctor.";
  }
};

export const getHealthTip = async (): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: "Provide one short daily health tip about medicine safety (15 words max)."
        });
        return response.text || "Always check the expiry date of your medicines.";
    } catch (e) {
        return "Stay hydrated and consult your doctor regularly.";
    }
}

export const getDoctorAIResponse = async (history: ChatMessage[], scanHistory?: ScanHistoryItem[]): Promise<string> => {
  try {
    // RAG Logic: Summarize the scan history into context
    let contextData = "";
    if (scanHistory && scanHistory.length > 0) {
        const historySummary = scanHistory.slice(0, 10).map(item => {
            const date = new Date(item.timestamp).toLocaleDateString();
            return `- [${date}] Scanned: ${item.medicineName}. Risk: ${item.data.riskScore}. Purpose: ${item.data.uses.join(', ')}.`;
        }).join('\n');
        
        contextData = `
        CONTEXT: You have access to the user's recent medical scan history (Medicines/Reports). 
        Use this to answer questions about past conditions, comparisons, or drug interactions.
        USER HISTORY:
        ${historySummary}
        
        If the user asks "Has my sugar increased?", check if there are diabetes medicines or reports in the history and compare them.
        If the user asks about interactions, check the medicines in the history.
        `;
    }

    const contents = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    const systemInstruction = `You are 'MediIQ Doctor AI', a professional and empathetic medical assistant. 
    ${contextData}
    Help users understand symptoms, health conditions, and wellness. 
    ALWAYS include a disclaimer that you are an AI and not a real doctor. 
    If symptoms sound severe, strongly advise visiting an Emergency Room immediately. 
    Keep responses concise and structured with bullet points where appropriate.`;

    // Retry Helper Function
    const generateWithRetry = async (modelName: string, maxRetries = 1) => {
        let attempt = 0;
        let lastError;
        
        while (attempt <= maxRetries) {
            try {
                const result = await ai.models.generateContent({
                    model: modelName,
                    contents: contents,
                    config: { systemInstruction }
                });
                return result;
            } catch (e) {
                lastError = e;
                attempt++;
                console.warn(`Attempt ${attempt} failed for ${modelName}:`, e);
                if (attempt <= maxRetries) {
                    // Backoff delay
                    await new Promise(r => setTimeout(r, 1000)); 
                }
            }
        }
        throw lastError;
    };

    try {
        // Attempt with Gemini Pro (with retry)
        const response = await generateWithRetry("gemini-3-pro-preview", 1);
        return response.text || "I apologize, I'm having trouble processing that right now.";
    } catch (error: any) {
        const errorMsg = JSON.stringify(error);
        console.warn("Gemini Pro failed, failing back to Flash:", errorMsg);
        
        if (errorMsg.includes("429") || errorMsg.includes("quota")) {
             return "I'm currently receiving too many requests. Please try again in a few minutes.";
        }

        try {
            // Fallback to Gemini Flash (with retry)
            const response = await generateWithRetry("gemini-3-flash-preview", 1);
            return response.text || "I'm currently unable to assist. Please try again later.";
        } catch (fallbackError) {
             const fbMsg = JSON.stringify(fallbackError);
             console.error("Doctor AI Critical Error:", fbMsg); // Log real error
             if (fbMsg.includes("429") || fbMsg.includes("quota")) {
                 return "Server usage limit reached. Please come back tomorrow.";
             }
             return "I am currently unavailable due to technical issues. Please try again in a moment.";
        }
    }
  } catch (error) {
    console.error("Doctor AI Top-Level Error:", error);
    return "I'm currently unable to assist due to a connection issue. If this is an emergency, please call local medical services immediately.";
  }
};
