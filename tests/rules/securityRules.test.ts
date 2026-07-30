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
import {
  initTestEnv,
  getTestEnv,
  getAuthedDb,
  getUnauthedDb,
  assertAllowed,
  assertDenied,
} from './setup';

describe('Firestore Security Rules - Multi-Tenant Isolation (IC360-008)', () => {
  beforeAll(async () => {
    // Inicializar testEnv. Si el emulador no responde en localhost:8080, initTestEnv lanza una excepción ruidosa y la suite ABORTA.
    const testEnv = await initTestEnv('ic360-security-test');
    
    // Verificación activa de respuesta del emulador
    try {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const pingRef = doc(context.firestore(), '_emulator_health_check/ping');
        await setDoc(pingRef, { ping: true, timestamp: Date.now() });
      });
    } catch (err) {
      throw new Error(
        `[CRITICAL ERROR] El emulador de Firestore no respondió a la prueba de conexión en localhost:8080.\n` +
        `La suite de pruebas ABORTA para evitar aprobaciones falsas positivas sin emulador.\nError: ${err}`
      );
    }
  });

  afterAll(async () => {
    const env = getTestEnv();
    if (env) {
      await env.cleanup();
    }
  });

  beforeEach(async () => {
    const env = getTestEnv();
    if (env) {
      await env.clearFirestore();
    }
  });

  it('Caso 1 (Acceso Autorizado Tenant A): Usuario de prointeca con rol gerente PUEDE leer y escribir en /organizations/prointeca/projects/proj_1/valuations/val_1', async () => {
    const gerenteProintecaDb = getAuthedDb('user_prointeca_gerente', {
      orgId: 'prointeca',
      role: 'gerente',
    });

    const valDocRef = doc(gerenteProintecaDb, 'organizations/prointeca/projects/proj_1/valuations/val_1');

    // Escribir valuación -> DEBE PERMITIR
    await assertAllowed(
      setDoc(valDocRef, {
        number: 1,
        orgId: 'prointeca',
        projectId: 'proj_1',
        amount: 50000,
        status: 'Borrador',
      }),
      'Gerente de prointeca debe poder crear valuaciones en su propia organización'
    );

    // Leer valuación -> DEBE PERMITIR
    await assertAllowed(
      getDoc(valDocRef),
      'Gerente de prointeca debe poder leer valuaciones en su propia organización'
    );
  });

  it('Caso 2 (Bloqueo Cross-Tenant): Usuario de semax_pino recibe PERMISSION_DENIED al intentar leer o escribir en /organizations/prointeca/projects/proj_1/valuations/val_1', async () => {
    const env = getTestEnv();
    // Seed document in prointeca tenant
    await env.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'organizations/prointeca/projects/proj_1/valuations/val_1'), {
        number: 1,
        orgId: 'prointeca',
        projectId: 'proj_1',
        amount: 50000,
      });
    });

    const semaxUserDb = getAuthedDb('user_semax_1', {
      orgId: 'semax_pino',
      role: 'gerente',
    });

    const prointecaValRef = doc(semaxUserDb, 'organizations/prointeca/projects/proj_1/valuations/val_1');

    // Intento de lectura -> DEBE FALLAR (PERMISSION_DENIED)
    await assertDenied(
      getDoc(prointecaValRef),
      'Usuario de semax_pino NO debe poder leer valuaciones de prointeca'
    );

    // Intento de escritura -> DEBE FALLAR (PERMISSION_DENIED)
    await assertDenied(
      setDoc(prointecaValRef, {
        number: 99,
        orgId: 'prointeca',
        projectId: 'proj_1',
        amount: 99999,
      }),
      'Usuario de semax_pino NO debe poder escribir valuaciones de prointeca'
    );
  });

  it('Caso 3 (Bloqueo Sin Claim): Usuario autenticado SIN claim orgId recibe PERMISSION_DENIED en cualquier ruta de /organizations/{orgId}/...', async () => {
    const env = getTestEnv();
    await env.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'organizations/prointeca/projects/proj_1/valuations/val_1'), {
        number: 1,
        orgId: 'prointeca',
        projectId: 'proj_1',
      });
    });

    // Authenticated user with NO orgId claim
    const noClaimDb = getAuthedDb('user_no_claims', {});

    const valDocRef = doc(noClaimDb, 'organizations/prointeca/projects/proj_1/valuations/val_1');

    // Intento de lectura -> DEBE FALLAR
    await assertDenied(
      getDoc(valDocRef),
      'Usuario sin claim orgId NO debe poder leer datos de ninguna organización'
    );

    // Intento de escritura -> DEBE FALLAR
    await assertDenied(
      setDoc(valDocRef, {
        number: 1,
        orgId: 'prointeca',
        projectId: 'proj_1',
      }),
      'Usuario sin claim orgId NO debe poder escribir datos de ninguna organización'
    );
  });

  it('Caso 3b (Bloqueo Usuario No Autenticado): Usuario anónimo recibe PERMISSION_DENIED', async () => {
    const unauthedDb = getUnauthedDb();
    const valDocRef = doc(unauthedDb, 'organizations/prointeca/projects/proj_1/valuations/val_1');

    await assertDenied(
      getDoc(valDocRef),
      'Usuario no autenticado NO debe poder leer datos'
    );
  });

  it('Caso 4 (Aislamiento de CollectionGroup): Consultas collectionGroup en valuations, siho_ptw y weld_joints filtradas por orgId == prointeca son permitidas pero denegadas para otros tenants', async () => {
    const env = getTestEnv();
    // Seed documents for both tenants across collections
    await env.withSecurityRulesDisabled(async (context) => {
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

    const prointecaUserDb = getAuthedDb('user_prointeca_gerente', {
      orgId: 'prointeca',
      role: 'gerente',
    });

    // 1. Valuations - Prointeca consulta propio orgId -> PERMITIDO
    const validValuationsQuery = query(
      collectionGroup(prointecaUserDb, 'valuations'),
      where('orgId', '==', 'prointeca')
    );
    await assertAllowed(getDocs(validValuationsQuery), 'Consulta collectionGroup de su propio orgId debe permitirse');

    // 1b. Valuations - Prointeca consulta semax_pino -> DENEGADO
    const crossValuationsQuery = query(
      collectionGroup(prointecaUserDb, 'valuations'),
      where('orgId', '==', 'semax_pino')
    );
    await assertDenied(getDocs(crossValuationsQuery), 'Consulta collectionGroup a otro orgId debe denegarse');

    // 2. SIHO PTW - Prointeca consulta propio orgId -> PERMITIDO
    const validPtwQuery = query(
      collectionGroup(prointecaUserDb, 'siho_ptw'),
      where('orgId', '==', 'prointeca')
    );
    await assertAllowed(getDocs(validPtwQuery), 'Consulta SIHO PTW de su propio orgId debe permitirse');

    // 2b. SIHO PTW - Prointeca consulta semax_pino -> DENEGADO
    const crossPtwQuery = query(
      collectionGroup(prointecaUserDb, 'siho_ptw'),
      where('orgId', '==', 'semax_pino')
    );
    await assertDenied(getDocs(crossPtwQuery), 'Consulta SIHO PTW a otro orgId debe denegarse');

    // 3. Weld Joints - Prointeca consulta propio orgId -> PERMITIDO
    const validWeldQuery = query(
      collectionGroup(prointecaUserDb, 'weld_joints'),
      where('orgId', '==', 'prointeca')
    );
    await assertAllowed(getDocs(validWeldQuery), 'Consulta Weld Joints de su propio orgId debe permitirse');

    // 3b. Weld Joints - Prointeca consulta semax_pino -> DENEGADO
    const crossWeldQuery = query(
      collectionGroup(prointecaUserDb, 'weld_joints'),
      where('orgId', '==', 'semax_pino')
    );
    await assertDenied(getDocs(crossWeldQuery), 'Consulta Weld Joints a otro orgId debe denegarse');
  });
});
