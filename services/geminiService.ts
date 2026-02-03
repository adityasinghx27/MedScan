
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
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
// Initialize GenAI only if key exists to prevent immediate crash
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// SAFETY SETTINGS: Crucial for Medical Apps
const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

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

// Error Helper
const getFriendlyErrorMessage = (error: any): string => {
    console.error("Gemini API Error Detail:", error);
    const msg = (error.message || JSON.stringify(error) || "").toLowerCase();
    
    if (msg.includes("429") || msg.includes("resource_exhausted") || msg.includes("quota")) 
        return "Daily Scan Limit Reached (Quota). Try again later.";
    
    if (msg.includes("500") || msg.includes("overloaded") || msg.includes("internal")) 
        return "AI Server is busy. Please try again in 5 seconds.";
    
    if (msg.includes("404") || msg.includes("not_found")) 
        return "AI Model unavailable. The system is updating, please retry.";
    
    if (msg.includes("api key") || msg.includes("key not valid") || msg.includes("forbidden") || msg.includes("403")) 
        return "Invalid API Key. Please update the key in the app settings.";
    
    if (msg.includes("fetch failed") || msg.includes("network") || msg.includes("offline")) 
        return "Network Error. Please check your internet connection.";
        
    if (msg.includes("candidate")) 
        return "The AI could not identify this image. Please ensure it's a medicine box or strip.";

    return "Scan failed (" + msg.substring(0, 30) + "...). Please try a clearer image.";
};

// --- SCHEMA DEFINITIONS ---
const MEDICINE_SCHEMA_STR = `
{
    "name": "Medicine Name",
    "medicationsFound": ["Chemical Name 1", "Chemical Name 2"],
    "description": "Short description",
    "simpleExplanation": "ELI5 explanation",
    "childFriendlyExplanation": "Explanation for a kid",
    "uses": ["Headache", "Fever"],
    "dosage": "Standard dosage info",
    "sideEffects": ["Nausea", "Dizziness"],
    "warnings": "General warnings",
    "keyWarning": "Most important warning",
    "riskScore": "Low" | "Medium" | "High",
    "riskReason": "Why is it risky?",
    "whoShouldAvoid": ["Pregnant women", "Children"],
    "foodGuidance": "Before food" | "After food" | "Empty stomach",
    "alternatives": ["Alt 1", "Alt 2"],
    "interactionAnalysis": { "severity": "Safe", "summary": "Safe to take", "advice": "No issues" },
    "effectTimeline": { "onset": "30 mins", "peak": "1 hour", "duration": "4 hours" },
    "lifestyleWarnings": { "alcohol": true, "driving": false, "sleep": false },
    "safetyRating": 85,
    "commonQuestions": [{ "question": "Can I take it at night?", "answer": "Yes" }],
    "expiryDate": "YYYY-MM-DD" (if visible on pack)
}
`;

const DERMA_SCHEMA_STR = `
{
  "conditionName": "Name of condition",
  "confidence": "High" | "Medium" | "Low",
  "severity": "Mild" | "Moderate" | "Severe",
  "description": "Description",
  "symptomsObserved": ["Redness", "Itching"],
  "possibleCauses": ["Allergy", "Bug bite"],
  "homeRemedies": ["Ice pack"],
  "otcSuggestions": ["Calamine"],
  "whenToSeeDoctor": "If it spreads",
  "isContagious": false,
  "disclaimer": "Consult a doctor"
}
`;

// --- GENERIC FALLBACK HANDLER ---
const generateContentWithFallback = async (params: any, isVision: boolean = false): Promise<string> => {
    // OFFLINE CHECK
    if (!navigator.onLine) {
        throw new Error("You are currently offline. Internet is required for AI analysis.");
    }
    
    if (!genAI) {
        throw new Error("API Key is missing. Please restart the app.");
    }

    // Models priority list - Adjusted for v0.21.0 compatibility
    const models = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-1.5-pro"]; 

    let lastError = null;

    for (const modelName of models) {
        try {
            console.log(`MediIQ: Attempting ${modelName}...`);
            const model = genAI.getGenerativeModel({ 
                model: modelName,
                safetySettings: SAFETY_SETTINGS,
                // Removed generationConfig.responseMimeType for broad compatibility on failures
            });
            
            // Standardize contents
            let finalContent: any = [];
            
            if (params.contents && Array.isArray(params.contents)) {
                // Chat format
                 // v0.21.0 expects array for chat, but here we are using generateContent for single turn sometimes
                 // if contents is array of objects with parts
                 finalContent = params.contents;
            } else if (params.contents && params.contents.parts) {
                // Vision format
                finalContent = [params.contents];
            } else {
                // String prompt
                finalContent = [params.contents];
            }

            const result = await model.generateContent(finalContent);
            const response = await result.response;
            const text = response.text();
            
            if (!text) throw new Error("Empty response from AI");
            return text;

        } catch (error: any) {
            console.warn(`MediIQ: Model ${modelName} failed:`, error.message);
            lastError = error;
            // Immediate failure on Auth errors, don't retry other models
            if (error.message?.includes("API key") || error.message?.includes("403")) {
                throw error;
            }
        }
    }
    throw lastError;
};

// --- EXPORTED FUNCTIONS ---

export const analyzeMedicineImage = async (base64Images: string[], profile: PatientProfile): Promise<MedicineData> => {
  try {
    console.log("MediIQ: Starting Medicine Analysis...");
    
    // Prepare image parts
    const imageParts = base64Images.map(img => {
      const cleanBase64 = img.includes(",") ? img.split(",")[1] : img;
      return {
        inlineData: {
          data: cleanBase64,
          mimeType: "image/jpeg"
        }
      };
    });

    const prompt = `
    You are MediIQ AI, an expert OCR and medicine analysis system.
    Analyze the medicine in these images for a ${profile.ageGroup} (${profile.gender}). 
    Language: ${profile.language}. 
    Pregnancy: ${profile.isPregnant ? 'Yes' : 'No'}. 
    Breastfeeding: ${profile.isBreastfeeding ? 'Yes' : 'No'}.
    
    CRITICAL RULE: Return ONLY a valid JSON object matching this structure:
    ${MEDICINE_SCHEMA_STR}

    If image is unreadable, set 'name' to 'Unreadable Image' and 'riskScore' to 'High'.
    `;

    // Structure for v0.21.0
    const contentPayload = {
        parts: [
            ...imageParts,
            { text: prompt }
        ]
    };

    const responseText = await generateContentWithFallback({ contents: contentPayload }, true);
    console.log("MediIQ: Raw Response Received");
    
    try {
        return JSON.parse(cleanJsonString(responseText)) as MedicineData;
    } catch (parseError) {
        console.error("MediIQ: JSON Parse Failed", responseText);
        throw new Error("AI output was not valid JSON. Please try again.");
    }

  } catch (error) {
    throw new Error(getFriendlyErrorMessage(error));
  }
};

export const analyzeSkinCondition = async (base64Image: string): Promise<DermaData> => {
  try {
    const cleanBase64 = base64Image.includes(",") ? base64Image.split(",")[1] : base64Image;
    const imagePart = {
        inlineData: {
            data: cleanBase64,
            mimeType: "image/jpeg"
        }
    };

    const prompt = `
    Analyze this skin condition. Identify possible issues.
    Return ONLY JSON matching:
    ${DERMA_SCHEMA_STR}
    `;

    const contentPayload = {
        parts: [
            imagePart,
            { text: prompt }
        ]
    };

    const responseText = await generateContentWithFallback({ contents: contentPayload }, true);

    return JSON.parse(cleanJsonString(responseText)) as DermaData;
  } catch (error) {
     throw new Error(getFriendlyErrorMessage(error));
  }
};

export const analyzeTextQuery = async (query: string, profile: PatientProfile): Promise<string> => {
    try {
        const prompt = `
        User Query: "${query}"
        
        Profile Context:
        - Age: ${profile.ageGroup}
        - Gender: ${profile.gender}
        - Language: ${profile.language}
        - Pregnant: ${profile.isPregnant}
        - Breastfeeding: ${profile.isBreastfeeding}

        Task:
        1. If the query mentions TWO medicines, compare them (Differences, Uses, Side Effects, Interactions).
        2. If the query mentions ONE medicine, provide detailed info (Uses, Dosage, Side Effects, Warnings).
        
        Output Style:
        - Use clear Markdown headings (###).
        - Use bullet points for readability.
        - Keep it medical but easy to understand.
        - Important: Add a "⚠️ Safety Warning" section at the end.
        `;

        const responseText = await generateContentWithFallback({ contents: { parts: [{ text: prompt }] } }, false);
        return responseText;
    } catch (e) {
        throw new Error(getFriendlyErrorMessage(e));
    }
};

export const generateDietPlan = async (medicineName: string, uses: string[], profile: PatientProfile): Promise<DietPlan> => {
    try {
        const prompt = `Create a 7-Day Diet Plan for a patient taking ${medicineName}. 
        Issues: ${uses.join(', ')}. Profile: ${profile.ageGroup}. Style: Indian/Desi.
        Return strictly JSON with keys: title, overview, avoidList (string[]), includeList (string[]), days (array of {day, morning, breakfast, lunch, snack, dinner, tip}).`;
        
        const responseText = await generateContentWithFallback({ contents: { parts: [{ text: prompt }] } }, false);
        return JSON.parse(cleanJsonString(responseText)) as DietPlan;
    } catch (e) {
        throw new Error(getFriendlyErrorMessage(e));
    }
};

export const checkConditionSafety = async (medicineName: string, condition: string): Promise<string> => {
  try {
    const responseText = await generateContentWithFallback({
      contents: { parts: [{ text: `Can I take ${medicineName} if I have ${condition}? Short answer.` }] }
    }, false);
    return responseText;
  } catch (e) {
    return "Please ask your doctor.";
  }
};

export const getHealthTip = async (): Promise<string> => {
    try {
        const responseText = await generateContentWithFallback({
            contents: { parts: [{ text: "One short health tip about medicine safety (15 words max)." }] }
        }, false);
        return responseText;
    } catch (e) {
        return "Stay hydrated and check expiry dates.";
    }
}

export const getDoctorAIResponse = async (history: ChatMessage[], scanHistory?: ScanHistoryItem[]): Promise<string> => {
  try {
    let contextData = "";
    if (scanHistory && scanHistory.length > 0) {
        const recentMedNames = scanHistory.slice(0, 5).map(item => item.medicineName).join(', ');
        contextData = `User's recent scans: [${recentMedNames}]. Use this for context.`;
    }

    const conversation = history.map(msg => `${msg.role === 'user' ? 'User' : 'Doctor'}: ${msg.content}`).join('\n');
    
    const prompt = `
    You are MediIQ Doctor AI, a professional medical assistant.
    ${contextData}
    Current Conversation:
    ${conversation}
    
    User's last message is at the end. Reply as Doctor. Keep it helpful, concise, and safe.
    ALWAYS include a disclaimer that you are an AI.
    `;

    const responseText = await generateContentWithFallback({ contents: { parts: [{ text: prompt }] } }, false);
    return responseText;
  } catch (error: any) {
    console.error("Doctor AI Error:", error);
    if (error.message?.includes("offline")) return "I cannot check online resources right now. Please connect to the internet.";
    if (error.message?.includes("429")) return "I am busy right now. Please try again later (Quota Exceeded).";
    return "I cannot answer right now due to a connection issue.";
  }
};
