// @ts-nocheck

// ---------------------------------------------------------------------------
// 👇👇👇 YAHAN APNI KEY DALEIN (Last Time) 👇👇👇
// ---------------------------------------------------------------------------
const API_KEY = "AIzaSyCiAA2DhF7VlNKDBN5dWVl3ko4GqOoEYtw"; 
// ---------------------------------------------------------------------------

const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

// Helper function to call API without Library (No Build Errors Guaranteed)
async function callGemini(promptText: string, imageBase64: string | null = null, jsonMode: boolean = false) {
  if (API_KEY.includes("YAHAN_APNI")) {
    throw new Error("API Key nahi dali hai! Code check karein.");
  }

  const parts: any[] = [{ text: promptText }];
  if (imageBase64) {
    const cleanBase64 = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;
    parts.unshift({
      inline_data: { mime_type: "image/jpeg", data: cleanBase64 }
    });
  }

  const body = {
    contents: [{ parts: parts }],
    generationConfig: jsonMode ? { response_mime_type: "application/json" } : {}
  };

  const response = await fetch(`${BASE_URL}?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.error?.message || "API Error");
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!text) throw new Error("Empty Response");
  
  return jsonMode ? JSON.parse(text) : text;
}

// ---------------------- EXPORTED FUNCTIONS ----------------------

export const analyzeMedicineImage = async (base64Images: string[], profile: any) => {
  // Multiple images handling
  const image = base64Images[0]; // Abhi ke liye first image use kar rahe hain direct method me
  
  const prompt = `Analyze medicine for ${profile.ageGroup}. Output JSON with fields: 
  name, description, uses (array), dosage, sideEffects (array), warnings, riskScore (Low/Medium/High).
  Ignore blurriness, just guess the name.`;

  return await callGemini(prompt, image, true);
};

export const analyzeSkinCondition = async (base64Image: string) => {
  const prompt = `Analyze skin condition. Output JSON with fields: 
  conditionName, severity, description, homeRemedies (array), whenToSeeDoctor, disclaimer.`;
  
  return await callGemini(prompt, base64Image, true);
};

export const generateDietPlan = async (medicineName: string, uses: string[], profile: any) => {
  const prompt = `Create a 7-Day Indian Diet Plan for ${medicineName}. Output JSON.`;
  return await callGemini(prompt, null, true);
};

export const checkConditionSafety = async (medicineName: string, condition: string) => {
  return await callGemini(`Can I take ${medicineName} with ${condition}? Short answer.`, null, false);
};

export const getHealthTip = async () => {
  return await callGemini("One short health tip.", null, false);
};

export const getDoctorAIResponse = async (history: any[], scanHistory?: any[]) => {
  // Simple chat handling
  const lastMsg = history[history.length - 1].content;
  return await callGemini(`You are Doctor AI. User asks: ${lastMsg}. Keep it short.`, null, false);
};

