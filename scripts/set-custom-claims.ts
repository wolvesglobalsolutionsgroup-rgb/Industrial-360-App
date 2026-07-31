import * as admin from 'firebase-admin';

/**
 * Script de Administración de Custom Claims para Firebase Auth
 * Estándares: SOC2 / ISO 27001 / GDPR
 * 
 * Este script asigna o actualiza los Custom User Claims (`role` y `orgId`)
 * en el token JWT de Firebase Auth de un usuario.
 * 
 * Uso desde línea de comandos:
 *   npx tsx scripts/set-custom-claims.ts <UID> <ROLE> <ORG_ID>
 * 
 * Ejemplo:
 *   npx tsx scripts/set-custom-claims.ts "usr_12345" "gerente" "semax_pino"
 */

// Inicializar Firebase Admin SDK si aún no se ha inicializado
if (!admin.apps.length) {
  admin.initializeApp();
}

export interface CustomClaimsInput {
  role: 'superadmin' | 'gerente' | 'supervisor' | 'inspector' | 'campo';
  orgId: string;
}

export async function setCustomUserClaims(uid: string, claims: CustomClaimsInput) {
  if (!uid) {
    throw new Error('UID de usuario es requerido.');
  }

  const { role, orgId } = claims;

  if (!role || !orgId) {
    throw new Error('Parámetros requeridos faltantes: "role" y "orgId".');
  }

  console.log(`🔒 Asignando Custom Claims a usuario UID: [${uid}]...`);
  console.log(`   Rol: ${role}`);
  console.log(`   Org ID: ${orgId}`);

  await admin.auth().setCustomUserClaims(uid, { role, orgId });

  // Verificar claims del usuario
  const userRecord = await admin.auth().getUser(uid);
  console.log('✅ Custom Claims asignados exitosamente.');
  console.log('   Usuario:', userRecord.email || userRecord.uid);
  console.log('   Custom Claims en Token:', userRecord.customClaims);

  return userRecord;
}

// Ejecución directa vía CLI
const args = process.argv.slice(2);
if (args.length >= 3) {
  const [uid, role, orgId] = args;
  const claims: CustomClaimsInput = {
    role: (role as CustomClaimsInput['role']) || 'gerente',
    orgId: orgId,
  };

  setCustomUserClaims(uid, claims)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Error al asignar Custom Claims:', err);
      process.exit(1);
    });
} else {
  console.log('ℹ️ Script de Custom User Claims para Industrial Control 360.');
  console.log('Ejemplo de uso:');
  console.log('  npx tsx scripts/set-custom-claims.ts "USER_UID" "gerente" "org_demo"');
}
