# 🛡️ PLAN DE ACCIÓN CONSOLIDADO Y HOJA DE RUTA DE ENDURECIMIENTO (AUDITORÍAS CHATGPT, CLAUDE, KIMI)

**Código del Documento:** `DOC-GOV-2026-009`  
**Ubicación:** `docs/governance/PLAN_DE_ACCION_Y_ENDURECIMIENTO_CONSOLIDADO.md`  
**Fecha:** 29 de Julio de 2026  
**Fuentes de Auditoría:** Reportes Auditores ChatGPT, Claude 3.5 Sonnet y Kimi K3  
**Estado:** Directiva Obligatoria de Cierre de Brechas P0, P1, P2  

---

## 1. RESUMEN EJECUTIVO Y ANÁLISIS DE REQUISITOS

Las auditorías externas destacan la **impresionante amplitud funcional** de Industrial Control 360 (31 módulos operativos, herramientas de ingeniería ASME/API, offline PWA, motor de valuaciones, CPM/EVM y asistencia IA). Sin embargo, identifican áreas de **endurecimiento crítico de producción** que debemos cerrar para la operación industrial multi-tenant:

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                   RESUMEN DE BRECHAS Y PLAN DE RESOLUCIÓN INMEDIATO                      │
├──────────────────────────┬─────────────────────────────┬─────────────────────────────────┤
│ ÁREA CRÍTICA             │ HALLAZGO DE AUDITORÍA       │ ACCIÓN DE RESOLUCIÓN (SPRINTS) │
├──────────────────────────┼─────────────────────────────┼─────────────────────────────────┤
│ 1. Reglas Firestore      │ Asegurar aislamiento        │ Endurecer `firestore.rules` con │
│    Multi-Tenant (P0)     │ estricto por `/orgId/projId`│ validación de claims y denegado │
├──────────────────────────┼─────────────────────────────┼─────────────────────────────────┤
│ 2. Formatos PDF &        │ Evitar fugas de escape HTML │ Usar textos limpios, doble      │
│    BrandKit (P0)         │ (`&8&4...`), aplicar logos  │ membrete BrandKit y fotos       │
├──────────────────────────┼─────────────────────────────┼─────────────────────────────────┤
│ 3. Evidencias de Campo   │ Informes de calidad sin     │ Mapear 2 fotos obligatorias de  │
│    Fotográficas (P1)     │ evidencia de zanja/soldadura│ inspección en ensayos y PDFs    │
├──────────────────────────┼─────────────────────────────┼─────────────────────────────────┤
│ 4. RBAC Server-Side      │ Roles en cliente            │ Custom Claims de Auth y eliminar│
│    (P0)                  │                             │ rutas alias sin guard           │
└──────────────────────────┴─────────────────────────────┴─────────────────────────────────┘
```

---

## 2. PLAN DE TRABAJO Y HITOS DE EJECUCIÓN (FASES P0, P1, P2)

### 🔴 FASE P0 — SEGURIDAD Y FORMATOS CRÍTICOS (SPRINTS 14 & 15)
1. **Refactorización de Formatos PDF & Evidencias Fotográficas:**
   - Limpieza de caracteres escapados HTML (`&...&`) en `jsPDF`.
   - Inyección obligatoria de fotos de evidencia de campo en Ensayos Civiles, NDT y PTW.
   - Membrete dinámico `BrandKit` (Logo Contratista y Logo Cliente).
2. **Endurecimiento de Firestore Rules:**
   - Validar `/organizations/{orgId}/projects/{projectId}/...` con denegación explícita por defecto (`match /{document=**} { allow read, write: if false; }`).
3. **Control de Acceso (RBAC) Firmado por Servidor:**
   - Custodia de roles mediante Custom Claims JWT emitidos por Admin SDK en Cloud Functions.

### 🟠 FASE P1 — ESTABILIZACIÓN Y REFACTORIZACIÓN (SPRINTS 16 & 17)
1. **Unificación de Motores Offline:**
   - Consolidar en `dexieDb.ts` + `syncEngine.ts` con outbox, versionado `updatedAt` y deduplicación.
2. **IDs Regulatorios Secuenciales:**
   - Reemplazar `Math.random()` por contadores transaccionales por organización/serie (`PTS-2026-0001`, `ENS-2026-0001`).

---

## 3. COMPROMISO DE COMPLIANCE NORMATIVO OIL & GAS

Todas las plantillas de salida (PDF, Excel `.xlsx`, vistas de inspección) respetarán la **Norma PDVSA L-STC-001** (Dossier As-Built), **PIC-01-03-05** (Planes de Calidad), **COVENIN 2000-92** (Ensayos Civiles) y el **Manual de Ingeniería PDVSA**.
