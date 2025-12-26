import { GoogleGenAI, Type, Schema } from "@google/genai";
import { MedicineData, PatientProfile } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MEDICINE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "The name of the medicine." },
    description: { type: Type.STRING, description: "Standard medical description." },
    simpleExplanation: { type: Type.STRING, description: "A very simple, easy to understand explanation in the requested language (e.g. 'Isse neend aa sakti hai')." },
    uses: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "List of common ailments this medicine treats."
    },
    dosage: { type: Type.STRING, description: "General dosage guidelines." },
    sideEffects: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "List of potential side effects."
    },
    warnings: { type: Type.STRING, description: "General warnings." },
    pregnancyWarning: { type: Type.STRING, description: "Specific warning for pregnancy if applicable (or 'Safe'/'Unsafe'/'Consult Doctor'). Return null/empty if not relevant to profile." },
    breastfeedingWarning: { type: Type.STRING, description: "Specific warning for breastfeeding if applicable. Return null/empty if not relevant to profile." },
    ageAdvice: { type: Type.STRING, description: "Specific advice based on the patient's age group (Child/Adult/Senior)." }
  },
  required: ["name", "description", "simpleExplanation", "uses", "dosage", "sideEffects", "warnings", "ageAdvice"]
};

export const analyzeMedicineImage = async (base64Image: string, profile: PatientProfile): Promise<MedicineData> => {
  try {
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

    const profileDescription = `
      Patient Profile:
      - Age Group: ${profile.ageGroup}
      - Gender: ${profile.gender}
      - Pregnant: ${profile.isPregnant ? 'YES' : 'NO'}
      - Breastfeeding: ${profile.isBreastfeeding ? 'YES' : 'NO'}
      - Output Language: ${profile.language} (Provide the 'simpleExplanation' and 'ageAdvice' primarily in this language, keeping medical terms in English if needed for clarity).
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64
            }
          },
          {
            text: `Analyze this medicine image. 
            ${profileDescription}
            
            IMPORTANT SAFETY CHECKS:
            1. Check if this medicine is safe for the specified Age Group.
            2. IF the patient is Pregnant or Breastfeeding, you MUST provide a specific warning in 'pregnancyWarning' or 'breastfeedingWarning' fields. If it is dangerous, say so clearly.
            3. In 'simpleExplanation', explain what the medicine does in very simple terms (like talking to a layperson). Example: "Ye dawai bukhaar kam karti hai".
            
            Provide accurate medical information. Always include a disclaimer.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: MEDICINE_SCHEMA,
        systemInstruction: "You are an expert pharmacist AI assistant. Identify the medicine from the image. Tailor advice to the specific patient profile provided."
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as MedicineData;
    } else {
      throw new Error("No data returned from AI");
    }
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

export const getHealthTip = async (): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: "Give me one short, random, interesting daily health tip in 15 words or less."
        });
        return response.text || "Drink water and stay hydrated!";
    } catch (e) {
        return "Stay active and eat healthy!";
    }
}