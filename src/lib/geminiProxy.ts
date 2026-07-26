export interface GeminiRequestOptions {
  prompt?: string;
  model?: string;
  systemInstruction?: string;
  contents?: any;
  config?: any;
}

export async function callGeminiProxy(options: GeminiRequestOptions): Promise<{ text: string; raw?: any }> {
  try {
    const response = await fetch('/api/callGeminiProxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(errData.error || `Error en el servidor (${response.status})`);
    }

    const data = await response.json();
    return {
      text: data.text || '',
      raw: data,
    };
  } catch (error: any) {
    console.error('Error calling Gemini Proxy:', error);
    throw error;
  }
}
