// @ts-nocheck

// ===========================================================================
// 👇👇👇 STEP 1: APNI ASLI KEY YAHAN DALEIN 👇👇👇
// ===========================================================================
const API_KEY = "AIzaSyCiAA2DhF7VlNKDBN5dWVl3ko4GqOoEYtw"; 
// ===========================================================================

const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

// 🛠️ Helper Function: Bina Library ke Call karega
async function callGemini(promptText: string, imageBase64: string | null = null, jsonMode: boolean = false) {
  
  // Check 1: Key Dali hai ya nahi?
  if (!API_KEY || API_KEY.includes("YAHAN_APNI")) {
    alert("CRITICAL ERROR: API Key nahi mili! Code me Line 9 check karein.");
    throw new Error("API Key Missing");
  }

  try {
    const parts: any[] = [{ text: promptText }];
    
    if (imageBase64) {
      // Image clean karo
      const cleanBase64 = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;
      parts.unshift({
        inline_data: { mime_type: "image/jpeg", data: cleanBase64 }
      });
    }

    const body = {
      contents: [{ parts: parts }],
      generationConfig: jsonMode ? { response_mime_type: "application/json" } : {}
    };

    // 🚀 Direct Server Call (No Library)
    const response = await fetch(`${BASE_URL}?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    // 🛑 Check 2: Google ne koi Error diya kya?
    if (data.error) {
      alert(`GOOGLE ERROR: ${data.error.message}`); // Ye Screen par dikhega
      throw new Error(data.error.message);
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Empty Response from AI");
    
    return jsonMode ? JSON.parse(text) : text;

  } catch (error: any) {
    // 🛑 Check 3: Network ya Code Error
    if (!error.message.includes("GOOGLE ERROR")) {
       alert(`SYSTEM ERROR: ${error.message}`);
    }
    throw error;
  }
}

// ===================== EXPORTED FUNCTIONS =====================

export const analyzeMedicineImage = async (base64Images: string[], profile: any) => {
  const prompt = `Analyze medicine for patient: ${profile.ageGroup}. 
  Output strict JSON with fields: name, description, uses (array), dosage, sideEffects (array), warnings, riskScore (Low/Medium/High), riskReason.
  If image is blurry, TRY TO READ ANYWAY.`;
  return await callGemini(prompt, base64Images[0], true);
};

export const analyzeSkinCondition = async (base64Image: string) => {
  const prompt = `Analyze skin condition. Output JSON: conditionName, severity, description, homeRemedies (array), disclaimer.`;
  return await callGemini(prompt, base64Image, true);
};

export const generateDietPlan = async (medicineName: string) => {
  const prompt = `Create a 7-Day Indian Diet Plan for ${medicineName}. Output JSON.`;
  return await callGemini(prompt, null, true);
};

export const checkConditionSafety = async (medicineName: string, condition: string) => {
  return await callGemini(`Can I take ${medicineName} with ${condition}? Short answer.`, null, false);
};

export const getHealthTip = async () => {
  return await callGemini("One short health tip.", null, false);
};

export const getDoctorAIResponse = async (history: any[]) => {
  const lastMsg = history[history.length - 1].content;
  return await callGemini(`You are a Doctor AI. User says: "${lastMsg}". Answer shortly.`, null, false);
};

