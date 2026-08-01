import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../src/firebase';

/**
 * Script de Migración Multi-Tenancy
 * Migra datos desde colecciones planas raíz hacia la estructura jerárquica Multi-Tenant:
 * /organizations/{orgId}/projects/{projId}/{subcollection}/{docId}
 */

export async function migrateToMultitenant(orgId: string = 'prointeca-demo') {
  console.log(`🚀 Iniciando migración multi-tenancy para Organización: ${orgId}...`);

  try {
    // 1. Migrar Organización Principal
    const orgRef = doc(db, 'organizations', orgId);
    await setDoc(orgRef, {
      id: orgId,
      name: 'PROINTECA C.A.',
      taxId: 'RIF J-30489210-4',
      description: 'Empresa de Ingeniería Industrial y Proyectos de Ductos - Monagas, Venezuela',
      createdAt: new Date().toISOString()
    }, { merge: true });

    // 2. Obtener Proyectos Planos
    const projectsSnap = await getDocs(collection(db, 'projects'));
    console.log(`📦 Proyectos encontrados en raíz: ${projectsSnap.size}`);

    for (const projDoc of projectsSnap.docs) {
      const projId = projDoc.id;
      const projData = projDoc.data();

      // Guardar proyecto en subcolección de organización
      const targetProjRef = doc(db, 'organizations', orgId, 'projects', projId);
      await setDoc(targetProjRef, {
        ...projData,
        orgId,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      console.log(`  └─ Proyecto migrado a /organizations/${orgId}/projects/${projId}`);

      // Subcolecciones vinculadas al proyecto a migrar
      const subcollectionsToMigrate = [
        'tasks',
        'field_reports',
        'valuations',
        'documents',
        'expenses',
        'inventory',
        'siho_ptw',
        'weld_joints',
        'ndt_reports',
        'ili_runs',
        'standby_claims',
        'fleet_equipment',
        'dossier_compilations'
      ];

      for (const colName of subcollectionsToMigrate) {
        try {
          const colSnap = await getDocs(collection(db, colName));
          for (const subDoc of colSnap.docs) {
            const data = subDoc.data();
            // Migrar solo si pertenecen al proyecto actual o si no tienen projectId
            if (data.projectId === projId || !data.projectId) {
              const targetSubRef = doc(db, 'organizations', orgId, 'projects', projId, colName, subDoc.id);
              await setDoc(targetSubRef, {
                ...data,
                orgId,
                projectId: projId,
                migratedAt: new Date().toISOString()
              }, { merge: true });
            }
          }
        } catch (colErr) {
          console.warn(`    ⚠️ Aviso procesando colección ${colName}:`, colErr);
        }
      }
    }

    console.log(`✅ Migración Multi-Tenancy completada exitosamente para Organización '${orgId}'!`);
    return { success: true, orgId };
  } catch (error) {
    console.error('❌ Error ejecutando migración multi-tenancy:', error);
    throw error;
  }
}

if (typeof window !== 'undefined') {
  (window as any).migrateToMultitenant = migrateToMultitenant;
}
