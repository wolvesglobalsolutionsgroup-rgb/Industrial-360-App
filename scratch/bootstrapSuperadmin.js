/**
 * Script de Bootstrapping para asignar el primer Superadministrador en Firebase Auth.
 * Uso: node scratch/bootstrapSuperadmin.js <email_o_uid>
 */
const admin = require('firebase-admin');
const path = require('path');

// Inicializa Firebase Admin usando Service Account o Default Credentials
if (!admin.apps.length) {
  admin.initializeApp();
}

async function bootstrap() {
  const target = process.argv[2];
  if (!target) {
    console.error('❌ Error: Debe especificar un Email o UID de usuario.');
    console.log('Ejemplo: node scratch/bootstrapSuperadmin.js admin@industrial360.com');
    process.exit(1);
  }

  let uid = target;
  if (target.includes('@')) {
    const user = await admin.auth().getUserByEmail(target);
    uid = user.uid;
  }

  console.log(`⏳ Asignando rol superadmin a UID: ${uid}...`);

  await admin.auth().setCustomUserClaims(uid, {
    role: 'superadmin',
    orgId: 'industrial-360-admin',
  });

  await admin.auth().revokeRefreshTokens(uid);

  console.log(`✅ ¡Éxito! El usuario ${target} (UID: ${uid}) ahora es SUPERADMIN.`);
  console.log('📌 Nota: El usuario debe cerrar sesión y volver a ingresar para actualizar su token JWT.');
  process.exit(0);
}

bootstrap().catch((err) => {
  console.error('❌ Error durante el bootstrapping:', err);
  process.exit(1);
});
