import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const GEMINI_MODELS = new Set(['gemini-2.5-flash', 'gemini-2.5-pro']);
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 20;
const requestWindows = new Map<string, { count: number; resetAt: number }>();

function getFirebaseAuth() {
  if (getApps().length === 0) {
    initializeApp({ credential: applicationDefault() });
  }
  return getAuth();
}

export async function requireFirebaseUser(authorization?: string) {
  if (!authorization?.startsWith('Bearer ')) {
    const error = new Error('Authentication is required.');
    (error as Error & { status: number }).status = 401;
    throw error;
  }

  try {
    return await getFirebaseAuth().verifyIdToken(authorization.slice(7));
  } catch {
    const error = new Error('Invalid or expired authentication token.');
    (error as Error & { status: number }).status = 401;
    throw error;
  }
}

export function enforceGeminiRateLimit(userId: string) {
  const now = Date.now();
  const current = requestWindows.get(userId);
  const window = !current || current.resetAt <= now
    ? { count: 0, resetAt: now + WINDOW_MS }
    : current;

  window.count += 1;
  requestWindows.set(userId, window);

  if (window.count > MAX_REQUESTS_PER_WINDOW) {
    const error = new Error('Gemini request rate limit exceeded. Try again shortly.');
    (error as Error & { status: number }).status = 429;
    throw error;
  }
}

export function assertAllowedGeminiModel(model?: string) {
  if (model && !GEMINI_MODELS.has(model)) {
    const error = new Error('Requested Gemini model is not allowed.');
    (error as Error & { status: number }).status = 400;
    throw error;
  }
}
