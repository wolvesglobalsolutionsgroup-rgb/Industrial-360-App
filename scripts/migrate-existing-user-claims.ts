import * as admin from 'firebase-admin';

/**
 * Script de Migración Masiva de Custom Claims
 * Estándares: SOC2 / ISO 27001 / GDPR
 * 
 * Verifica que cada usuario en /users/{uid} posea un campo `orgId` explícito.
 * Si no lo tiene, NO asigna ningún fallback ciego y añade el UID a la lista
 * "REQUIERE_REVISION".
 * 
 * Para usuarios con `orgId` válido, asigna Custom Claims { role, orgId }.
 * 
 * Uso:
 *   npx tsx scripts/migrate-existing-user-claims.ts
 */

if (!admin.apps.length) {
  admin.initializeApp();
}

interface UserDocData {
  orgId?: string;
  role?: string;
  email?: string;
  displayName?: string;
  [key: string]: any;
}

export async function migrateUserClaims() {
  console.log('🚀 Iniciando migración masiva de Custom Claims...');

  const db = admin.firestore();
  const auth = admin.auth();

  let totalProcesados = 0;
  let totalActualizados = 0;
  const requierenRevision: Array<{ uid: string; email?: string; reason: string }> = [];

  // 1. Cargar documentos de /users
  const usersSnap = await db.collection('users').get();
  const usersMap = new Map<string, UserDocData>();

  usersSnap.forEach((doc) => {
    usersMap.set(doc.id, doc.data() as UserDocData);
  });

  console.log(`📁 Encontrados ${usersMap.size} perfiles en la colección /users.`);

  // 2. Listar todos los usuarios de Firebase Auth
  let pageToken: string | undefined = undefined;

  do {
    const listUsersResult = await auth.listUsers(1000, pageToken);
    pageToken = listUsersResult.pageToken;

    for (const userRecord of listUsersResult.users) {
      totalProcesados++;
      const uid = userRecord.uid;
      const email = userRecord.email || 'Sin email';

      const userDoc = usersMap.get(uid);

      if (!userDoc) {
        requierenRevision.push({
          uid,
          email,
          reason: 'No existe documento /users/{uid} en Firestore',
        });
        continue;
      }

      const orgId = userDoc.orgId?.trim();
      if (!orgId) {
        requierenRevision.push({
          uid,
          email,
          reason: 'Campo orgId ausente o vacío en /users/{uid}',
        });
        continue;
      }

      const role = userDoc.role?.trim() || 'campo';

      try {
        await auth.setCustomUserClaims(uid, { role, orgId });
        await auth.revokeRefreshTokens(uid);
        totalActualizados++;
        console.log(`  ✅ [${totalActualizados}] Claims asignados a ${email} (${uid}) -> { role: '${role}', orgId: '${orgId}' }`);
      } catch (err: any) {
        console.error(`  ❌ Error actualizando claims para ${uid}:`, err?.message);
        requierenRevision.push({
          uid,
          email,
          reason: `Error asignando claims: ${err?.message}`,
        });
      }
    }
  } while (pageToken);

  // 3. Imprimir reporte final
  console.log('\n==================================================');
  console.log('📊 REPORTE FINAL DE MIGRACIÓN DE CUSTOM CLAIMS');
  console.log('==================================================');
  console.log(`Total usuarios procesados en Auth: ${totalProcesados}`);
  console.log(`Total usuarios actualizados con exito: ${totalActualizados}`);
  console.log(`Total usuarios que REQUIEREN REVISIÓN: ${requierenRevision.length}`);

  if (requierenRevision.length > 0) {
    console.log('\n⚠️ USUARIOS QUE REQUIEREN REVISIÓN (Sin orgId o sin documento):');
    requierenRevision.forEach((item, index) => {
      console.log(`  ${index + 1}. UID: ${item.uid} | Email: ${item.email} | Motivo: ${item.reason}`);
    });
  }
  console.log('==================================================\n');

  return {
    totalProcesados,
    totalActualizados,
    requierenRevision,
  };
}

// Si se ejecuta directamente desde terminal
if (process.argv[1]?.endsWith('migrate-existing-user-claims.ts')) {
  migrateUserClaims()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Error fatal en migración:', err);
      process.exit(1);
    });
}
