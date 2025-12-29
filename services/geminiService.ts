
import { GoogleGenAI, Type } from "@google/genai";
import { MedicineData, PatientProfile, ChatMessage } from "../types";

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
    ageAdvice: { type: Type.STRING }
  },
  required: [
    "name", "medicationsFound", "description", "simpleExplanation", "childFriendlyExplanation", "uses", "dosage", 
    "sideEffects", "warnings", "keyWarning", "riskScore", "riskReason", "whoShouldAvoid", 
    "foodGuidance", "alternatives", "ageAdvice", "effectTimeline", "lifestyleWarnings", "safetyRating", "commonQuestions"
  ]
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
      IMPORTANT: Specifically check if these medicines interact with each other and are safe to take as a combination.`
    };

    try {
        const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
            parts: [...parts, promptText]
        },
        config: {
            responseMimeType: "application/json",
            responseSchema: MEDICINE_SCHEMA,
            systemInstruction: "You are MedScan AI. Provide professional, accurate medicine analysis. When multiple images are provided, analyze the combined safety of all medications identified."
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

export const getDoctorAIResponse = async (history: ChatMessage[]): Promise<string> => {
  try {
    const contents = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: contents,
            config: {
                systemInstruction: "You are 'MedScan Doctor AI', a professional and empathetic medical assistant. Help users understand symptoms, health conditions, and wellness. ALWAYS include a disclaimer that you are an AI and not a real doctor. If symptoms sound severe, strongly advise visiting an Emergency Room immediately. Keep responses concise and structured with bullet points where appropriate."
            }
        });
        return response.text || "I apologize, I'm having trouble processing that right now.";
    } catch (error: any) {
        const errorMsg = JSON.stringify(error);
        console.warn("Gemini Pro failed, failing back to Flash:", errorMsg);
        
        if (errorMsg.includes("429") || errorMsg.includes("quota")) {
             return "I'm currently receiving too many requests. Please try again in a few minutes.";
        }

        try {
            const response = await ai.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: contents,
                config: {
                    systemInstruction: "You are 'MedScan Doctor AI'. Be concise and helpful. Disclaimer: I am an AI, not a doctor."
                }
            });
            return response.text || "I'm currently unable to assist. Please try again later.";
        } catch (fallbackError) {
             const fbMsg = JSON.stringify(fallbackError);
             if (fbMsg.includes("429") || fbMsg.includes("quota")) {
                 return "Server usage limit reached. Please come back tomorrow.";
             }
             return "I am currently unavailable due to technical issues.";
        }
    }
  } catch (error) {
    console.error("Doctor AI Error:", error);
    return "I'm currently unable to assist due to a connection issue. If this is an emergency, please call local medical services immediately.";
  }
};
