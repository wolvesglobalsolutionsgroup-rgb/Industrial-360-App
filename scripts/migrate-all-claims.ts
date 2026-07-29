import * as admin from 'firebase-admin';

/**
 * Script de Migración Masiva de Custom Claims (SOC2 / ISO 27001)
 * 
 * Recorre la lista de usuarios existentes en Firebase Auth y asigna los claims `role` y `orgId`
 * necesarios para la arquitectura multi-tenant de Industrial Control 360.
 * 
 * Uso:
 *   npx tsx scripts/migrate-all-claims.ts
 */

if (!admin.apps.length) {
  admin.initializeApp();
}

// Mapeo opcional explícito por UID -> { role, orgId } para casos conocidos
const EXPLICIT_MIGRATION_MAP: Record<string, { role: string; orgId: string }> = {
  // 'UID_EJEMPLO': { role: 'gerente', orgId: 'semax_pino' }
};

export async function migrateAllClaims() {
  console.log('🚀 Iniciando migración masiva de Custom Claims en Firebase Auth...');
  
  let pageToken: string | undefined;
  let totalProcessed = 0;
  let totalUpdated = 0;

  do {
    const listResult = await admin.auth().listUsers(1000, pageToken);
    for (const user of listResult.users) {
      totalProcessed++;
      const currentClaims = user.customClaims || {};
      
      // Determinar si necesita actualización
      const explicitMapping = EXPLICIT_MIGRATION_MAP[user.uid];
      const targetOrgId = explicitMapping?.orgId || currentClaims.orgId || 'semax_pino';
      const targetRole = explicitMapping?.role || currentClaims.role || 'gerente';

      if (!currentClaims.orgId || !currentClaims.role || explicitMapping) {
        console.log(`🔒 Actualizando UID [${user.uid}] (${user.email || 'sin email'}) -> orgId: '${targetOrgId}', role: '${targetRole}'`);
        await admin.auth().setCustomUserClaims(user.uid, {
          ...currentClaims,
          orgId: targetOrgId,
          role: targetRole,
          migratedAt: new Date().toISOString()
        });
        
        // Revocar refresh tokens para forzar re-autenticación con claims actualizados (SOC2)
        await admin.auth().revokeRefreshTokens(user.uid);
        totalUpdated++;
      }
    }
    pageToken = listResult.pageToken;
  } while (pageToken);

  console.log('\n✅ Migración masiva completada:');
  console.log(`   Total usuarios procesados: ${totalProcessed}`);
  console.log(`   Total usuarios actualizados: ${totalUpdated}`);
}

if (typeof require !== 'undefined' && require.main === module) {
  migrateAllClaims()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Error ejecutando migración masiva de claims:', err);
      process.exit(1);
    });
}
