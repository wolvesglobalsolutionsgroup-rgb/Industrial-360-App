import { GoogleGenAI } from '@google/genai';
import { assertAllowedGeminiModel, enforceGeminiRateLimit, requireFirebaseUser } from './security';

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
  assertAllowedGeminiModel(reqBody.model);
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
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    const user = await requireFirebaseUser(req.headers.authorization);
    enforceGeminiRateLimit(user.uid);
    const result = await handleGeminiProxy(req.body || {});
    res.status(200).json(result);
  } catch (error: any) {
    const status = error?.status;
    const is429 = status === 429 || error?.message?.includes('429') || error?.message?.includes('Quota exceeded');
    if (is429) {
      console.warn('Gemini Proxy Quota Limit Exceeded:', error?.message);
      res.status(429).json({ error: error?.message || 'Quota exceeded for Gemini API.' });
    } else if (status === 400 || status === 401) {
      res.status(status).json({ error: error?.message || 'Unauthorized request.' });
    } else {
      console.error('Gemini Proxy Error:', error);
      res.status(500).json({ error: error?.message || 'Error executing Gemini request on server.' });
    }
  }
};
