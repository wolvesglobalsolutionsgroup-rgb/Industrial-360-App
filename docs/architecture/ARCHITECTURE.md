# Arquitectura del Sistema — Industrial Control 360

## Jerarquía de Almacenamiento Multi-Tenant en Firestore

Toda la información operativa de proyectos se organiza de forma estricta bajo la siguiente jerarquía de colecciones:

```text
/organizations/{orgId}
  ├── /projects/{projectId}
  │     ├── /valuations/{valuationId}
  │     ├── /tasks/{taskId}
  │     ├── /weld_joints/{weldId}
  │     ├── /field_reports/{reportId}
  │     ├── /siho_ptw/{ptwId}
  │     └── /dossier_compilations/{dossierId}
  └── /client_portal_access_logs/{logId}
```

## Reglas de Consultas Multi-Tenant

1. **Consultas Directas por Proyecto**:
   Se utiliza la ruta completa: `collection(db, 'organizations', orgId, 'projects', projectId, 'valuations')`.

2. **Consultas Agregadas por Organización (Collection Group Queries)**:
   Se utilizan consultas de grupo de colecciones filtradas estrictamente por `orgId`:
   `query(collectionGroup(db, 'valuations'), where('orgId', '==', orgId))`.

3. **Inmutabilidad y Auditoría**:
   El `orgId` y `projectId` son obligatorios en los payloads de creación de documentos para garantizar la integridad referencial y prevenir brechas de aislamiento de datos entre inquilinos.
