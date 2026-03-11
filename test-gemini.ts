import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
console.log("API Key exists:", !!apiKey);

const genAI = new GoogleGenAI({ apiKey });

const SAFETY_SETTINGS = [
  { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
];

async function test() {
  try {
    const response = await genAI.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Hello",
      config: {
        safetySettings: SAFETY_SETTINGS as any
      }
    });
    console.log("Response:", response.text);
  } catch (e) {
    console.error("Error:", e);
  }
}
test();
