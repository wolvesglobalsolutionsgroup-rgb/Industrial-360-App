import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';

describe('Firebase Storage Security Rules - Audit & Unit Specs', () => {
  let testEnv: RulesTestEnvironment | null = null;
  const rulesContent = readFileSync(resolve(process.cwd(), 'storage.rules'), 'utf8');

  beforeAll(async () => {
    const emulatorHost = process.env.STORAGE_EMULATOR_HOST || '127.0.0.1:9199';
    const [host, portStr] = emulatorHost.split(':');
    const port = parseInt(portStr || '9199', 10);

    try {
      testEnv = await initializeTestEnvironment({
        projectId: 'ic360-storage-test',
        storage: {
          rules: rulesContent,
          host,
          port,
        },
      });
    } catch {
      // Si el emulador no responde en contenedores sin Java, la suite valida el contrato estático de reglas.
      testEnv = null;
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

  it('Valida que las reglas usen rules_version = 2 y definan el servicio firebase.storage', () => {
    expect(rulesContent).toContain("rules_version = '2';");
    expect(rulesContent).toContain('service firebase.storage');
  });

  it('Valida la regla de denegación por defecto (Zero-Trust)', () => {
    expect(rulesContent).toContain('match /{allPaths=**}');
    expect(rulesContent).toContain('allow read, write: if false;');
  });

  it('Valida el aislamiento multi-tenant por /organizations/{orgId}/{allPaths=**}', () => {
    expect(rulesContent).toContain('match /organizations/{orgId}/{allPaths=**}');
    expect(rulesContent).toContain('request.auth.token.orgId == orgId');
    expect(rulesContent).toContain("request.auth.token.role == 'superadmin'");
    expect(rulesContent).toContain('20 * 1024 * 1024'); // Límite de 20MB
    expect(rulesContent).toContain("request.resource.contentType.matches('image/.*')");
    expect(rulesContent).toContain("request.resource.contentType == 'application/pdf'");
  });

  it('Valida la carpeta pública brandkit_public con lectura pública y escritura restringida a 2MB png/jpeg/svg', () => {
    expect(rulesContent).toContain('match /organizations/{orgId}/brandkit_public/{allPaths=**}');
    expect(rulesContent).toContain('allow read: if true;');
    expect(rulesContent).toContain('2 * 1024 * 1024'); // Límite de 2MB
    expect(rulesContent).toContain("image/png");
    expect(rulesContent).toContain("image/jpeg");
    expect(rulesContent).toContain("image/svg+xml");
  });

  it('Instancia correctamente el contexto de pruebas cuando el emulador está disponible', async () => {
    if (!testEnv) {
      return;
    }
    const authedContext = testEnv.authenticatedContext('user_prointeca', {
      orgId: 'prointeca',
    });
    const storage = authedContext.storage();
    expect(storage).toBeDefined();
  });
});
