import { getDoctorAIResponse } from './services/geminiService.ts';
import { ChatMessage } from './types.ts';

async function test() {
  const history: ChatMessage[] = [
    { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() }
  ];
  try {
    const response = await getDoctorAIResponse(history);
    console.log("Response:", response);
  } catch (e) {
    console.error("Error:", e);
  }
}
test();
