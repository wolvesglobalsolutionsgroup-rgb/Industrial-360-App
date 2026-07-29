import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  doc,
  getDoc,
  setDoc,
  collectionGroup,
  query,
  where,
  getDocs,
} from 'firebase/firestore';

describe('Firestore Security Rules - Multi-Tenant Isolation (IC360-008)', () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
    const [host, portStr] = emulatorHost.split(':');
    const port = parseInt(portStr || '8080', 10);

    testEnv = await initializeTestEnvironment({
      projectId: 'ic360-security-test',
      firestore: {
        rules: readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8'),
        host,
        port,
      },
    });
  });

  afterAll(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  beforeEach(async () => {
    if (testEnv) {
      await testEnv.clearFirestore();
    }
  });

  it('Caso 1: Usuario de semax_pino con rol gerente PUEDE leer /organizations/semax_pino/projects/proj_1', async () => {
    // Seed project document in semax_pino
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'organizations/semax_pino/projects/proj_1'), {
        name: 'Proyecto 1 Semax',
        orgId: 'semax_pino',
      });
    });

    // Authenticated user in semax_pino with role gerente
    const gerenteDb = testEnv
      .authenticatedContext('user_semax_gerente', {
        orgId: 'semax_pino',
        role: 'gerente',
      })
      .firestore();

    const projDocRef = doc(gerenteDb, 'organizations/semax_pino/projects/proj_1');
    await assertSucceeds(getDoc(projDocRef));
  });

  it('Caso 2 (INTRUSIÓN BLOQUEADA): Usuario de semax_pino NO PUEDE leer ni escribir en /organizations/prointeca/projects/proj_456', async () => {
    // Seed project document in prointeca
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'organizations/prointeca/projects/proj_456'), {
        name: 'Proyecto Prointeca 456',
        orgId: 'prointeca',
      });
    });

    const semaxUserDb = testEnv
      .authenticatedContext('user_semax_1', {
        orgId: 'semax_pino',
        role: 'gerente',
      })
      .firestore();

    const prointecaProjRef = doc(semaxUserDb, 'organizations/prointeca/projects/proj_456');

    // Attempt read - MUST FAIL
    await assertFails(getDoc(prointecaProjRef));

    // Attempt write - MUST FAIL
    await assertFails(
      setDoc(prointecaProjRef, {
        name: 'Intrusión no autorizada',
        orgId: 'prointeca',
      })
    );
  });

  it('Caso 3 (ZERO TRUST): Usuario autenticado SIN claim orgId NO PUEDE leer ni escribir en ninguna organización', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'organizations/semax_pino/projects/proj_1'), {
        name: 'Proyecto 1 Semax',
        orgId: 'semax_pino',
      });
    });

    // Authenticated user with NO custom claims
    const noClaimDb = testEnv
      .authenticatedContext('user_no_claims', {})
      .firestore();

    const semaxProjRef = doc(noClaimDb, 'organizations/semax_pino/projects/proj_1');

    // Read attempt MUST FAIL
    await assertFails(getDoc(semaxProjRef));

    // Write attempt MUST FAIL
    await assertFails(
      setDoc(semaxProjRef, {
        name: 'Ataque sin claims',
        orgId: 'semax_pino',
      })
    );
  });

  it('Caso 4 (COLLECTION GROUP ISOLATION): Consulta collectionGroup en tasks solo retorna registros de su orgId', async () => {
    // Seed tasks in different organizations
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(
        doc(context.firestore(), 'organizations/semax_pino/projects/proj_1/tasks/task_semax_1'),
        {
          title: 'Tarea Inspección Semax',
          orgId: 'semax_pino',
          projectId: 'proj_1',
        }
      );

      await setDoc(
        doc(context.firestore(), 'organizations/prointeca/projects/proj_2/tasks/task_prointeca_1'),
        {
          title: 'Tarea Auditoría Prointeca',
          orgId: 'prointeca',
          projectId: 'proj_2',
        }
      );
    });

    const semaxUserDb = testEnv
      .authenticatedContext('user_semax_1', {
        orgId: 'semax_pino',
        role: 'gerente',
      })
      .firestore();

    // Query collectionGroup for own orgId -> MUST SUCCEED
    const validGroupQuery = query(
      collectionGroup(semaxUserDb, 'tasks'),
      where('orgId', '==', 'semax_pino')
    );
    await assertSucceeds(getDocs(validGroupQuery));

    // Query collectionGroup for another orgId (prointeca) -> MUST FAIL
    const crossTenantGroupQuery = query(
      collectionGroup(semaxUserDb, 'tasks'),
      where('orgId', '==', 'prointeca')
    );
    await assertFails(getDocs(crossTenantGroupQuery));
  });
});
