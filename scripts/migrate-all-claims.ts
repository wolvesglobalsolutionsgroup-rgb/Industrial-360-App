import { migrateUserClaims } from './migrate-existing-user-claims';

// Alias para ejecutar el script de migración masiva de Custom Claims
if (process.argv[1]?.endsWith('migrate-all-claims.ts')) {
  migrateUserClaims()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Error fatal en migración:', err);
      process.exit(1);
    });
}

export { migrateUserClaims };
