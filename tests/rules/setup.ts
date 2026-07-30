import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { Firestore } from 'firebase/firestore';

let testEnv: RulesTestEnvironment | null = null;

export async function initTestEnv(projectId = 'ic360-security-test'): Promise<RulesTestEnvironment> {
  const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
  const [host, portStr] = emulatorHost.split(':');
  const port = parseInt(portStr || '8080', 10);

  try {
    testEnv = await initializeTestEnvironment({
      projectId,
      firestore: {
        rules: readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8'),
        host,
        port,
      },
    });
    return testEnv;
  } catch (err) {
    throw new Error(
      `[CRITICAL] Error al conectar con el emulador de Firestore en ${emulatorHost}. ` +
      `La suite de pruebas de seguridad ABORTA si el emulador no responde en localhost:8080.\nDetalles: ${err}`
    );
  }
}

export function getTestEnv(): RulesTestEnvironment {
  if (!testEnv) {
    throw new Error(
      '[CRITICAL] RulesTestEnvironment no ha sido inicializado. Llama a initTestEnv() en beforeAll().'
    );
  }
  return testEnv;
}

export function getAuthedDb(uid: string, claims: Record<string, any> = {}): Firestore {
  const env = getTestEnv();
  return env.authenticatedContext(uid, claims).firestore() as unknown as Firestore;
}

export function getUnauthedDb(): Firestore {
  const env = getTestEnv();
  return env.unauthenticatedContext().firestore() as unknown as Firestore;
}

export async function assertAllowed<T>(pr: Promise<T>, message?: string): Promise<T> {
  try {
    return await assertSucceeds(pr);
  } catch (err) {
    const detail = message ? `: ${message}` : '';
    throw new Error(`[ASSERT_ALLOWED_FAILED] Se esperaba que la operación fuera PERMITIDA, pero fue DENEGADA${detail}.\nDetalle: ${err}`);
  }
}

export async function assertDenied<T>(pr: Promise<T>, message?: string): Promise<any> {
  try {
    return await assertFails(pr);
  } catch (err) {
    const detail = message ? `: ${message}` : '';
    throw new Error(`[ASSERT_DENIED_FAILED] Se esperaba que la operación fuera DENEGADA, pero fue PERMITIDA${detail}.\nDetalle: ${err}`);
  }
}
