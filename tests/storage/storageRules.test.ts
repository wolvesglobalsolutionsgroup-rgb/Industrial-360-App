import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest';

describe('Firebase Storage Security Rules - Multi-Tenant Isolation', () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    const emulatorHost = process.env.STORAGE_EMULATOR_HOST || '127.0.0.1:9199';
    const [host, portStr] = emulatorHost.split(':');
    const port = parseInt(portStr || '9199', 10);

    try {
      testEnv = await initializeTestEnvironment({
        projectId: 'ic360-storage-test',
        storage: {
          rules: readFileSync(resolve(process.cwd(), 'storage.rules'), 'utf8'),
          host,
          port,
        },
      });
    } catch (err) {
      throw new Error(
        `[CRITICAL ERROR] Error al conectar con el emulador de Storage en ${emulatorHost}. ` +
        `La suite de pruebas de Storage ABORTA si el emulador no responde.\nDetalles: ${err}`
      );
    }
  });

  afterAll(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  beforeEach(async () => {
    if (testEnv) {
      await testEnv.clearStorage();
    }
  });

  it('Verifica la inicialización de reglas de Storage para aislamiento por orgId', async () => {
    if (!testEnv) {
      throw new Error('RulesTestEnvironment para Storage no está inicializado.');
    }
    const authedContext = testEnv.authenticatedContext('user_prointeca', {
      orgId: 'prointeca',
    });
    const storage = authedContext.storage();
    if (!storage) {
      throw new Error('No se pudo instanciar el cliente de Storage del emulador.');
    }
  });
});
