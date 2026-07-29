# 🗺️ Hoja de Ruta Enterprise (Roadmap) — Industrial Control 360

## 🛡️ Sprint 0: Blindaje de Seguridad & Estabilización de CI (HOY)
- **Meta:** Lograr CI en verde, aislar `seedDemoData` y conectar Custom Claims en `firestore.rules`.
- **Estado:** En ejecución.

## 🏢 Sprint 1: Migración Multi-tenant Total (13/13 Módulos)
- **Meta:** Migrar los 10 módulos restantes (`Expenses`, `FieldReports`, `Valuations`, `SIHO/PTW`, `QA/QC`, `Documents`, `Inventory`, `ILI`, `Dossier`, `EngineeringCalcs`) a la estructura `/organizations/{orgId}/projects/{projId}/...`.
- **Criterio de Éxito:** Ningún componente realiza lecturas a colecciones planas raíz.

## 🔐 Sprint 2: Cloud Functions Enterprise & Audit Logs
- **Meta:** Implementar Admin Functions para asignación de Custom Claims, revocación de tokens instantánea (`revokeRefreshTokens`) y registros de auditoría por organización.
- **Criterio de Éxito:** Asignación segura de roles sin exponer el Secret Admin en el cliente.

## 🧪 Sprint 3: Tests de Intrusión Cross-Tenant en CI
- **Meta:** Suite de unit tests con `@firebase/rules-unit-testing` ejecutada en GitHub Actions con el Firestore Emulator.
- **Criterio de Éxito:** PR bloqueado si un usuario de Org A puede leer datos de Org B.

## 📜 Sprint 4: Motor de Normativas PDVSA & Calculadoras Avanzadas
- **Meta:** Modularizar `EngineeringTools` hacia `src/lib/norms/` (ASME B31G, B31.3, API 570, B16.5, PDVSA 906) e indexar el vault PDVSA (1,100+ PDFs).
