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

  it('Caso 1 (Acceso Autorizado Tenant A): Usuario de prointeca con rol gerente PUEDE leer y escribir en /organizations/prointeca/projects/proj_1/valuations/val_1', async () => {
    const gerenteProintecaDb = testEnv
      .authenticatedContext('user_prointeca_gerente', {
        orgId: 'prointeca',
        role: 'gerente',
      })
      .firestore();

    const valDocRef = doc(gerenteProintecaDb, 'organizations/prointeca/projects/proj_1/valuations/val_1');

    // Escribir valuación -> DEBE PERMITIR
    await assertSucceeds(
      setDoc(valDocRef, {
        number: 1,
        orgId: 'prointeca',
        projectId: 'proj_1',
        amount: 50000,
        status: 'Borrador',
      })
    );

    // Leer valuación -> DEBE PERMITIR
    await assertSucceeds(getDoc(valDocRef));
  });

  it('Caso 2 (Bloqueo Cross-Tenant): Usuario de semax_pino recibe PERMISSION_DENIED al intentar leer o escribir en /organizations/prointeca/projects/proj_1/valuations/val_1', async () => {
    // Seed document in prointeca tenant
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'organizations/prointeca/projects/proj_1/valuations/val_1'), {
        number: 1,
        orgId: 'prointeca',
        projectId: 'proj_1',
        amount: 50000,
      });
    });

    const semaxUserDb = testEnv
      .authenticatedContext('user_semax_1', {
        orgId: 'semax_pino',
        role: 'gerente',
      })
      .firestore();

    const prointecaValRef = doc(semaxUserDb, 'organizations/prointeca/projects/proj_1/valuations/val_1');

    // Intento de lectura -> DEBE FALLAR (PERMISSION_DENIED)
    await assertFails(getDoc(prointecaValRef));

    // Intento de escritura -> DEBE FALLAR (PERMISSION_DENIED)
    await assertFails(
      setDoc(prointecaValRef, {
        number: 99,
        orgId: 'prointeca',
        projectId: 'proj_1',
        amount: 99999,
      })
    );
  });

  it('Caso 3 (Bloqueo Sin Claim): Usuario autenticado SIN claim orgId recibe PERMISSION_DENIED en cualquier ruta de /organizations/{orgId}/...', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'organizations/prointeca/projects/proj_1/valuations/val_1'), {
        number: 1,
        orgId: 'prointeca',
        projectId: 'proj_1',
      });
    });

    // Authenticated user with NO orgId claim
    const noClaimDb = testEnv
      .authenticatedContext('user_no_claims', {})
      .firestore();

    const valDocRef = doc(noClaimDb, 'organizations/prointeca/projects/proj_1/valuations/val_1');

    // Intento de lectura -> DEBE FALLAR
    await assertFails(getDoc(valDocRef));

    // Intento de escritura -> DEBE FALLAR
    await assertFails(
      setDoc(valDocRef, {
        number: 1,
        orgId: 'prointeca',
        projectId: 'proj_1',
      })
    );
  });

  it('Caso 4 (Aislamiento de CollectionGroup): Consultas collectionGroup en valuations, siho_ptw y weld_joints filtradas por orgId == prointeca son permitidas pero denegadas para otros tenants', async () => {
    // Seed documents for both tenants across collections
    await testEnv.withSecurityRulesDisabled(async (context) => {
      // Valuations
      await setDoc(doc(context.firestore(), 'organizations/prointeca/projects/proj_1/valuations/val_prointeca'), {
        orgId: 'prointeca',
        number: 101,
      });
      await setDoc(doc(context.firestore(), 'organizations/semax_pino/projects/proj_2/valuations/val_semax'), {
        orgId: 'semax_pino',
        number: 201,
      });

      // SIHO PTW
      await setDoc(doc(context.firestore(), 'organizations/prointeca/projects/proj_1/siho_ptw/ptw_prointeca'), {
        orgId: 'prointeca',
        code: 'PTW-PRO-01',
      });
      await setDoc(doc(context.firestore(), 'organizations/semax_pino/projects/proj_2/siho_ptw/ptw_semax'), {
        orgId: 'semax_pino',
        code: 'PTW-SEM-01',
      });

      // Weld Joints
      await setDoc(doc(context.firestore(), 'organizations/prointeca/projects/proj_1/weld_joints/weld_prointeca'), {
        orgId: 'prointeca',
        jointNo: 'J-001',
      });
      await setDoc(doc(context.firestore(), 'organizations/semax_pino/projects/proj_2/weld_joints/weld_semax'), {
        orgId: 'semax_pino',
        jointNo: 'J-002',
      });
    });

    const prointecaUserDb = testEnv
      .authenticatedContext('user_prointeca_gerente', {
        orgId: 'prointeca',
        role: 'gerente',
      })
      .firestore();

    // 1. Valuations - Prointeca consulta propio orgId -> PERMITIDO
    const validValuationsQuery = query(
      collectionGroup(prointecaUserDb, 'valuations'),
      where('orgId', '==', 'prointeca')
    );
    await assertSucceeds(getDocs(validValuationsQuery));

    // 1b. Valuations - Prointeca consulta semax_pino -> DENEGADO
    const crossValuationsQuery = query(
      collectionGroup(prointecaUserDb, 'valuations'),
      where('orgId', '==', 'semax_pino')
    );
    await assertFails(getDocs(crossValuationsQuery));

    // 2. SIHO PTW - Prointeca consulta propio orgId -> PERMITIDO
    const validPtwQuery = query(
      collectionGroup(prointecaUserDb, 'siho_ptw'),
      where('orgId', '==', 'prointeca')
    );
    await assertSucceeds(getDocs(validPtwQuery));

    // 2b. SIHO PTW - Prointeca consulta semax_pino -> DENEGADO
    const crossPtwQuery = query(
      collectionGroup(prointecaUserDb, 'siho_ptw'),
      where('orgId', '==', 'semax_pino')
    );
    await assertFails(getDocs(crossPtwQuery));

    // 3. Weld Joints - Prointeca consulta propio orgId -> PERMITIDO
    const validWeldQuery = query(
      collectionGroup(prointecaUserDb, 'weld_joints'),
      where('orgId', '==', 'prointeca')
    );
    await assertSucceeds(getDocs(validWeldQuery));

    // 3b. Weld Joints - Prointeca consulta semax_pino -> DENEGADO
    const crossWeldQuery = query(
      collectionGroup(prointecaUserDb, 'weld_joints'),
      where('orgId', '==', 'semax_pino')
    );
    await assertFails(getDocs(crossWeldQuery));
  });
});

