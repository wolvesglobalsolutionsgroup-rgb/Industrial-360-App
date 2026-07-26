import { GoogleGenAI } from '@google/genai';

export interface GeminiProxyRequest {
  prompt?: string;
  model?: string;
  systemInstruction?: string;
  contents?: any;
  config?: any;
}

export async function handleGeminiProxy(reqBody: GeminiProxyRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }

  const ai = new GoogleGenAI({ apiKey });
  const modelName = reqBody.model || 'gemini-2.5-flash';

  let contents = reqBody.contents;
  if (!contents && reqBody.prompt) {
    contents = reqBody.prompt;
  }

  const config: any = reqBody.config || {};
  if (reqBody.systemInstruction) {
    config.systemInstruction = reqBody.systemInstruction;
  }

  const response = await ai.models.generateContent({
    model: modelName,
    contents,
    ...(Object.keys(config).length > 0 ? { config } : {})
  });

  return {
    text: response.text,
    candidates: response.candidates,
    raw: response
  };
}

// HTTPS Cloud Function endpoint export style (Firebase Functions compatible)
export const callGeminiProxy = async (req: any, res: any) => {
  // CORS Handling
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    const result = await handleGeminiProxy(req.body || {});
    res.status(200).json(result);
  } catch (error: any) {
    console.error('Gemini Proxy Error:', error);
    res.status(500).json({ error: error?.message || 'Error executing Gemini request on server.' });
  }
};
