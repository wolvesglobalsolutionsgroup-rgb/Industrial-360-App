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

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // Map legacy / deprecated model names to current models
  let requestedModel = reqBody.model || 'gemini-3.6-flash';
  if (requestedModel === 'gemini-2.5-flash' || requestedModel === 'gemini-1.5-flash' || requestedModel === 'gemini-2.0-flash') {
    requestedModel = 'gemini-3.6-flash';
  } else if (requestedModel === 'gemini-2.5-flash-preview-tts') {
    requestedModel = 'gemini-3.1-flash-tts-preview';
  }

  const candidateModels = [
    requestedModel,
    'gemini-3.6-flash',
    'gemini-3.1-flash-lite',
  ].filter((m, i, self) => self.indexOf(m) === i);

  let contents = reqBody.contents;
  if (!contents && reqBody.prompt) {
    contents = reqBody.prompt;
  }

  const config: any = reqBody.config || {};
  if (reqBody.systemInstruction) {
    config.systemInstruction = reqBody.systemInstruction;
  }

  let lastError: any = null;

  for (const modelName of candidateModels) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents,
          ...(Object.keys(config).length > 0 ? { config } : {}),
        });

        return {
          text: response.text || '',
          candidates: response.candidates,
          raw: response,
        };
      } catch (err: any) {
        lastError = err;
        const status = err?.status || err?.code;
        const msg = err?.message || '';
        const isTransient = status === 503 || status === 429 || msg.includes('503') || msg.includes('high demand') || msg.includes('UNAVAILABLE') || msg.includes('Quota exceeded');

        if (isTransient && attempt === 0) {
          // Wait 800ms before retrying same model
          await new Promise((resolve) => setTimeout(resolve, 800));
          continue;
        }
        if (isTransient) {
          // Break to try next candidate model
          break;
        }
        // If it's a non-transient error (e.g. invalid config), rethrow
        throw err;
      }
    }
  }

  throw lastError || new Error('Failed to generate response from Gemini API models.');
}
