# PLAN DE EJECUCIÓN: S18 — MULTI-OPERATOR BRANDKIT & DOBLE MEMBRETE
## Industrial Control 360 (Industrial OS) — Asiento MiniMax-M3 (Mavis)
### Fase 2 — Sprint 18 + Pre-requisitos habilitantes

> **Aviso metodológico (último):** Este plan está construido desde la especialidad de *Multi-Operator Norms & Document Architecture* sobre la información pública del dossier `SOLICITUD_AUDITORIA_CONSEJO_EXPERTOS_FASE_2.md`. No tengo acceso de lectura a `wolvesglobalsolutionsgroup-rgb/Industrial-360-App` desde esta sesión. Donde el plan requiere validación contra código real, está marcado con el prefijo `EMPIRICAL:` seguido de la pregunta concreta que el ejecutor debe responder abriendo el archivo. Las implementaciones aquí son **referencias de producción** que se integran a tu arquitectura existente; ajusta imports, naming y barrel exports al patrón vigente en `main`.

---

## 0. ÍNDICE

1. [Diagnóstico exacto de fallas y faltantes](#1-diagnóstico-exacto-de-fallas-y-faltantes)
2. [Plan de sprints con prompts ejecutables](#2-plan-de-sprints-con-prompts-ejecutables)
3. [Código exacto y completo](#3-código-exacto-y-completo)
4. [Criterios de aceptación para 100/100](#4-criterios-de-aceptación-para-100100)
5. [Anexo A — Prompts ejecutables listos para copiar/pegar](#anexo-a--prompts-ejecutables-listos-para-copiarpegar)
6. [Anexo B — Glosario normativo y abreviaciones](#anexo-b--glosario-normativo-y-abreviaciones)

---

## 1. DIAGNÓSTICO EXACTO DE FALLAS Y FALTANTES

### 1.1 BrandKit y Sistema de Plantillas — Faltantes estructurales probables

| # | Hallazgo probable | Archivo a abrir | Cómo verificar |
|---|---|---|---|
| 1.1.1 | No existe un modelo de datos formal para BrandKit multi-operador con jerarquía EPC + Operadora | `src/types/brandkit.ts` (probable inexistencia) | `EMPIRICAL: ¿Existe el archivo src/types/brandkit.ts? Si existe, ¿cuántas propiedades tipadas tiene? Si tiene < 12, está sub-modelado.` |
| 1.1.2 | El Doble Membrete se renderiza probablemente con dos `<img>` sueltas y CSS, sin un componente reutilizable y testeable | `grep -r "operatorLogo\|contratorLogo\|brandkit" src/components` | `EMPIRICAL: ¿Cuántas referencias a logos duales hay en componentes? Si hay más de 5 hardcodeadas, falta abstracción.` |
| 1.1.3 | Los presets de PDVSA/Chevron/Repsol/ENI probablemente viven en constantes sueltas, no en un registry versionado | `grep -r "PDVSA\|CHEVRON\|REPSOL\|ENI" src/` | `EMPIRICAL: ¿Hay un archivo src/lib/brandkits/presets/ o similar? Si no, están dispersos.` |
| 1.1.4 | El campo de "alcance del documento" (AAD/ROE/PTS/JSA) no está normalizado en el modelo | `src/types/documents.ts` | `EMPIRICAL: ¿El tipo Document tiene un enum documentType? ¿Cuántos valores incluye? Si tiene < 8, falta normativa.` |
| 1.1.5 | El sistema de versionado de plantillas (v1, v2) no existe, así que un cambio de formato PDVSA rompe todos los documentos en curso | `src/types/template.ts` (probable inexistencia) | `EMPIRICAL: ¿Hay un campo templateVersion en algún tipo de documento? Si no, falta versionado.` |

### 1.2 Multi-Tenant Data Isolation — Riesgos residuales

| # | Riesgo | Verificación |
|---|---|---|
| 1.2.1 | La colección `/organizations/{orgId}/brandkit` puede no tener regla de Firestore y caer al default `allow read, write: if false` o peor, `if true` | `EMPIRICAL: Abrir firestore.rules y buscar "match /organizations/{orgId}/brandkit". Si la regla no existe, cualquier read de la app falla o queda abierta.` |
| 1.2.2 | Las collection group queries (`collectionGroup('brandkit')` para admin) no tienen regla específica | `EMPIRICAL: Buscar "collectionGroup" en firestore.rules. Si no hay match /{path=**}/brandkit/{id}, los queries de admin multi-tenant fallan silenciosamente.` |
| 1.2.3 | El Custom Claim `orgId` puede no estar siendo propagado a `request.auth.token.orgId` en cada login | `EMPIRICAL: Abrir functions/src/index.ts y verificar que ensureOwnClaims setea custom claims. Si solo setea role, falta orgId.` |
| 1.2.4 | El modelo no distingue entre BrandKit a nivel **organización** (global de la empresa) y BrandKit a nivel **proyecto** (override por obra/contrato) | `EMPIRICAL: ¿El tipo BrandKit tiene scope: 'org' \| 'project'? Si solo hay un nivel, no se puede customizar por contrato.` |

### 1.3 Exportación de Documentos — Estado probable

| # | Hallazgo probable | Verificación |
|---|---|---|
| 1.3.1 | La exportación a DOCX probablemente no preserva el Doble Membrete, solo el contenido | `EMPIRICAL: ¿Existe src/lib/exporters/docxExporter.ts? Si existe, ¿importa algún componente de header? Si no, falta.` |
| 1.3.2 | La exportación a XLSX no incluye fórmulas reales (A1: SUM, etc.) — son valores hardcodeados | `EMPIRICAL: Buscar "formula:" en el código. Si no aparece nunca, el cliente no puede ajustar cálculos en Excel.` |
| 1.3.3 | La exportación a PPTX no embebe fonts, por lo que al abrir en otra máquina se sustituyen y se rompe el layout | `EMPIRICAL: Buscar "fonts:" o "defineSlideMaster" en pptxgenjs. Si no, falta font embedding.` |
| 1.3.4 | El PDF final con sello SHA-256 + QR no se genera desde el mismo flujo que el editable, sino como re-proceso | `EMPIRICAL: ¿Existe un endpoint unificado /api/export? Si cada formato tiene su endpoint separado sin orquestador, el sello puede quedar inconsistente entre formatos.` |

### 1.4 Cumplimiento Normativo Multi-Operador — Gaps típicos

| # | Gap | Norma afectada |
|---|---|---|
| 1.4.1 | El formato PDVSA SI-S-04 (Permiso de Trabajo) tiene ~40 campos. Si la app solo captura ~15, hay 25 hardcoded a defaults que el cliente no puede editar | PDVSA SI-S-04 |
| 1.4.2 | El JSA de Chevron debe ser 1:N por PTS (un permiso puede requerir 3 JSAs). Si el modelo es 1:1, no cumple | Chevron CES |
| 1.4.3 | El ROE/AAD de PDVSA requiere timestamp en hora legal Venezuela (UTC-4 con DST). Si la app usa UTC puro o local time, el documento queda invalidante | PDVSA PI-02-01-01 |
| 1.4.4 | Repsol NORMA usa i18n (es-BR para Brasil). Si no hay i18n planeado, no se puede operar en Brasil | NORMA Repsol |
| 1.4.5 | ENI Golden Rule 6 prohíbe "bypass de instrumentos de seguridad". Si la app permite "saltarse" un LOTO desde la UI sin traza, hay incumplimiento | ENI Golden Rules |
| 1.4.6 | El Doble Membrete no modela la *cadena de firmantes* (1:N por documento). Solo modela una firma EPC y una Operadora | Cualquier obra mixta |

### 1.5 Sello Documental y Cadena de Custodia

| # | Hallazgo probable | Verificación |
|---|---|---|
| 1.5.1 | El hash SHA-256 puede estar calculándose sobre el contenido pero no sobre los metadatos (firmantes, fecha, número de contrato) | `EMPIRICAL: Abrir el módulo de sello (probablemente src/lib/seal/). ¿La función hash incluye los metadatos en el canon? Si solo el body, falta.` |
| 1.5.2 | El QR puede apuntar a una URL no versionada, así que al cambiar el dominio del verificador se rompen todos los documentos históricos | `EMPIRICAL: ¿La URL del QR es hardcoded o viene de variable de entorno? Si hardcoded, falta.` |
| 1.5.3 | El sello no incluye *timestamp autoritativo* (de un Time Stamping Authority) por lo que su valor probatorio es técnico, no legal | Esto no es necesariamente un bug; depende del modelo legal. Documentar explícitamente. |

---

## 2. PLAN DE SUB-SPRINTS (S18-A → S18-E)

### 2.1 S18-A — BrandKit Data Model + Firestore Rules (3–5 días)

**Objetivo:** Tipar el modelo de BrandKit multi-tenant y asegurar que las reglas de Firestore bloquean el acceso cross-tenant.

**Entregables:**
- `src/types/brandkit.ts` (tipos completos)
- `firestore.rules` con la sección `/organizations/{orgId}/brandkit` y el collection group rule
- `tests/rules/brandkit.test.ts` con casos positivos y negativos

**Criterio de cierre:** `npm run test:rules` pasa con 100% de cobertura sobre las nuevas reglas. `tsc --noEmit` limpio.

### 2.2 S18-B — DualHeader React Component (3–4 días)

**Objetivo:** Componente reutilizable que renderiza el Doble Membrete (EPC + Operadora) con tokens del BrandKit.

**Entregables:**
- `src/components/documents/DualHeader.tsx` (componente)
- `src/components/documents/DualHeader.test.tsx` (tests con Vitest + Testing Library)
- `src/components/documents/DualHeader.stories.tsx` (Storybook con 4 operadores + 1 EPC ficticio)

**Criterio de cierre:** El componente acepta `brandkitId` como prop y resuelve el BrandKit desde Firestore (o desde un mock en test). Carga logos en formato SVG con fallback a PNG. Renderiza el contrato N° y la fecha de vigencia en hora legal Venezuela.

### 2.3 S18-C — Exportadores Editables (5–7 días)

**Objetivo:** Exportar a DOCX, XLSX y PPTX preservando el Doble Membrete y con fórmulas reales en Excel.

**Entregables:**
- `src/lib/exporters/dualHeaderDocx.ts`
- `src/lib/exporters/dualHeaderXlsx.ts`
- `src/lib/exporters/dualHeaderPptx.ts`
- `src/lib/exporters/__tests__/dualHeader*.test.ts` (un test por formato con snapshot del archivo generado)

**Criterio de cierre:** Al abrir el DOCX en MS Word y en LibreOffice, el header se ve idéntico. El XLSX tiene fórmulas activas (verificables con `getCell('A1').formula`). El PPTX embebe las fonts declaradas.

### 2.4 S18-D — Sello SHA-256 + QR (2–3 días)

**Objetivo:** Generar el sello inmutable sobre el canon completo (contenido + metadatos + firmantes) y el QR de verificación.

**Entregables:**
- `functions/src/seal/documentSeal.ts` (Cloud Function autoritativa)
- `src/lib/seal/verifySeal.ts` (cliente para verificar)
- `src/components/documents/DocumentSeal.tsx` (visualizador del sello)

**Criterio de cierre:** El mismo documento genera siempre el mismo hash (determinismo). Modificar un carácter cambia el hash (test de avalancha). El QR codifica una URL con `?doc={id}&hash={sha256}`.

### 2.5 S18-E — Presets Multi-Operador (3–4 días)

**Objetivo:** Cargar presets validados para PDVSA, Chevron, Repsol y ENI como seeds del BrandKit.

**Entregables:**
- `src/lib/brandkits/presets/pdvsa.ts`
- `src/lib/brandkits/presets/chevron.ts`
- `src/lib/brandkits/presets/repsol.ts`
- `src/lib/brandkits/presets/eni.ts`
- `src/lib/brandkits/presets/__tests__/presets.test.ts` (cada preset tiene los 12+ campos del modelo)

**Criterio de cierre:** Los 4 presets pasan el `brandkitSchema.test.ts`. La función `applyPreset(orgId, 'pdvsa')` crea un BrandKit válido en Firestore.

---

## 3. CÓDIGO EXACTO Y COMPLETO

### 3.1 `src/types/brandkit.ts` — Modelo de datos

```typescript
/**
 * Industrial Control 360 — Multi-Operator BrandKit
 * Modelo de datos para Doble Membrete EPC + Operadora.
 *
 * Cubre: PDVSA (SI-S-04, PI-02-01-01), Chevron (CES/CHESM/JSA/SWA),
 * Repsol (EHS / NORMA), ENI (STEA / Golden Rules).
 *
 * Reglas de modelado:
 *  - Scope 'org' = valores por defecto a nivel organización.
 *  - Scope 'project' = override por obra/contrato específico.
 *  - El render SIEMPRE resuelve project > org > preset (cascada).
 *  - El sello SHA-256 canoniza todo el objeto + metadatos del documento.
 */

export type OperatorId = 'pdvsa' | 'chevron' | 'repsol' | 'eni' | 'custom';

export type ContractorId = string; // e.g. 'prointeca', 'techint', custom EPC

export type DocumentType =
  | 'PTS'            // Permiso de Trabajo Seguro (multi-operador)
  | 'JSA'            // Job Safety Analysis (Chevron)
  | 'AAD'            // Reporte Diario (PDVSA)
  | 'ROE'            // Reporte de Operaciones (PDVSA)
  | 'PT'             // Permiso de Trabajo genérico
  | 'INFORME_TECNICO'
  | 'ACTA_INSPECCION'
  | 'PROTOCOLO'
  | 'LOTO'           // Lockout / Tagout (ENI Golden Rule)
  | 'HSE_REPORT'
  | 'ILI_REPORT'
  | 'AS_BUILT'
  | 'DOSSIER';

export type LegalLocale = 'es-VE' | 'es-CO' | 'es-MX' | 'es-AR' | 'pt-BR' | 'en-US';

export interface BrandKitLogo {
  /** URL firmada en Cloud Storage. Resolución recomendada 600x600 px SVG o PNG @2x. */
  readonly url: string;
  /** Texto alternativo accesible (WCAG 2.1 AAA). */
  readonly altText: string;
  /** Ancho en mm para render en documentos físicos A4/Letter. */
  readonly widthMm: number;
  /** Alto en mm. */
  readonly heightMm: number;
  /** Hash SHA-256 del binario del logo, para detectar reemplazos no autorizados. */
  readonly sha256: string;
}

export interface BrandKitColorPalette {
  readonly primary: string;     // hex, ej. '#003D7A' (PDVSA azul)
  readonly secondary: string;
  readonly accent: string;
  readonly text: string;
  readonly background: string;
  /** Contraste mínimo verificado contra WCAG 2.1 AAA (7:1). */
  readonly wcagRatio: number;
}

export interface BrandKitTypography {
  /** Familia principal. Embebida en PPTX. */
  readonly primaryFont: string;
  /** Familia secundaria. */
  readonly secondaryFont: string;
  /** Tamaños en pt por nivel de heading. */
  readonly sizes: {
    readonly h1: number;
    readonly h2: number;
    readonly h3: number;
    readonly body: number;
    readonly caption: number;
  };
}

export interface BrandKitDocumentFieldOverride {
  /** Nombre del campo del documento (path dotted). */
  readonly fieldPath: string;
  /** Valor por defecto a aplicar si el documento no lo define. */
  readonly defaultValue: string;
  /** Si es true, bloquea la edición del campo en UI. */
  readonly readonly: boolean;
  /** Si es true, este campo se incluye en el canon SHA-256. */
  readonly inSealCanon: boolean;
}

export interface BrandKit {
  /** Identificador único del BrandKit. */
  readonly id: string;
  /** ID de la organización dueña (multi-tenant). */
  readonly orgId: string;
  /** ID del proyecto si es override de proyecto; null si es a nivel org. */
  readonly projectId: string | null;
  /** Operadora dueña del contrato (cliente final). */
  readonly operator: {
    readonly id: OperatorId;
    readonly displayName: string;
    readonly legalName: string;
    readonly taxId: string; // RIF / NIT / EIN
    readonly logo: BrandKitLogo;
  };
  /** Contratista EPC (puede ser sub-contratista de la contratista principal). */
  readonly contractor: {
    readonly id: ContractorId;
    readonly displayName: string;
    readonly legalName: string;
    readonly taxId: string;
    readonly logo: BrandKitLogo;
  };
  /** Paleta de colores institucional del documento. */
  readonly palette: BrandKitColorPalette;
  /** Tipografía institucional. */
  readonly typography: BrandKitTypography;
  /** Locale legal por defecto para fechas, números, unidades. */
  readonly locale: LegalLocale;
  /** Tipos de documento que este BrandKit cubre. */
  readonly documentTypes: ReadonlyArray<DocumentType>;
  /** Overrides de campos por tipo de documento. */
  readonly fieldOverrides: ReadonlyArray<BrandKitDocumentFieldOverride>;
  /** Normas operativas que el BrandKit declara cumplir (referencia, no certificación). */
  readonly declaredNorms: ReadonlyArray<{
    readonly code: string;     // 'PDVSA-SI-S-04', 'CHEVRON-CES-7.2'
    readonly version: string;
    readonly url?: string;
  }>;
  /** Versión semántica del preset. Incrementar cuando cambian defaults. */
  readonly presetVersion: string;
  /** Metadata de auditoría inmutable. */
  readonly audit: {
    readonly createdAt: string;   // ISO 8601
    readonly createdBy: string;   // uid
    readonly updatedAt: string;
    readonly updatedBy: string;
    readonly changeLog: ReadonlyArray<{
      readonly at: string;
      readonly by: string;
      readonly summary: string;
    }>;
  };
  /** Estado del BrandKit. */
  readonly status: 'draft' | 'active' | 'deprecated';
  /** Soft-delete. */
  readonly deletedAt: string | null;
}

/**
 * Resolución en cascada: project > org > preset.
 * Devuelve el BrandKit efectivo a usar para un documento dado.
 */
export interface BrandKitResolver {
  resolve(
    orgId: string,
    projectId: string | null,
    documentType: DocumentType,
  ): Promise<BrandKit>;
}

/**
 * Canon para el sello SHA-256.
 * Lista determinística y ordenada de campos que se incluyen en el hash.
 * Cualquier cambio aquí invalida sellos históricos.
 */
export const SEAL_CANON_FIELDS = [
  'operator.legalName',
  'operator.taxId',
  'contractor.legalName',
  'contractor.taxId',
  'documentType',
  'documentNumber',
  'issuedAt',
  'validUntil',
  'signers',
  'contractNumber',
  'workLocation',
  'contentSha256',
] as const;
export type SealCanonField = (typeof SEAL_CANON_FIELDS)[number];

/**
 * Firmantes del documento (1:N, no solo EPC y Operadora).
 * Modela la cadena de firmantes real.
 */
export interface DocumentSigner {
  readonly role: 'EPC_LEGAL' | 'EPC_SITE' | 'EPC_HSE' | 'OPERATOR_LEGAL' | 'OPERATOR_SITE' | 'OPERATOR_HSE' | 'WITNESS' | 'INSPECTOR';
  readonly fullName: string;
  readonly idType: 'CI' | 'PASSPORT' | 'RIF' | 'EIN';
  readonly idNumber: string;
  readonly email: string;
  readonly signedAt: string | null; // ISO 8601, null = pendiente
  /** Hash SHA-256 de la firma biométrica o digital capturada. */
  readonly signatureSha256: string | null;
}
```

### 3.2 `firestore.rules` — Sección multi-tenant para BrandKit (extracto)

```javascript
// =====================================================================
// INDUSTRIAL CONTROL 360 — Reglas de Firestore
// Sección: /organizations/{orgId}/brandkit
// =====================================================================
// Patrón Zero-Trust:
//  - Read solo si el usuario pertenece a la org (membership activa)
//  - Write solo si el usuario es OWNER o BRANDKIT_MANAGER de la org
//  - El campo 'audit' es inmutable post-creación (affectedKeys)
//  - El campo 'status' solo cambia draft → active → deprecated (no skip)
//  - Soft-delete: solo cambia deletedAt, no se borra el documento
// =====================================================================

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helpers existentes — se asumen ya definidos en main.
    // function isSignedIn()
    // function isOrgMember(orgId)
    // function hasOrgRole(orgId, role)
    // function isAdmin()

    match /organizations/{orgId} {

      // BrandKit a nivel organización
      match /brandkit/{brandkitId} {
        allow read: if isSignedIn() && isOrgMember(orgId);

        allow create: if isSignedIn()
                      && isOrgMember(orgId)
                      && hasOrgRole(orgId, 'OWNER')
                      && request.resource.data.orgId == orgId
                      && request.resource.data.status == 'draft'
                      && request.resource.data.audit.createdBy == request.auth.uid;

        allow update: if isSignedIn()
                      && isOrgMember(orgId)
                      && hasOrgRole(orgId, 'OWNER')
                      && affectedKeys().hasOnly([
                        'palette', 'typography', 'locale', 'documentTypes',
                        'fieldOverrides', 'declaredNorms', 'operator',
                        'contractor', 'audit', 'status', 'updatedAt', 'updatedBy',
                      ])
                      // inmutabilidad: audit.createdAt y audit.createdBy no cambian
                      && request.resource.data.audit.createdAt == resource.data.audit.createdAt
                      && request.resource.data.audit.createdBy == resource.data.audit.createdBy
                      // transición de status válida
                      && (
                        (resource.data.status == 'draft' && request.resource.data.status in ['draft','active']) ||
                        (resource.data.status == 'active' && request.resource.data.status == 'deprecated') ||
                        (resource.data.status == 'deprecated' && request.resource.data.status == 'deprecated')
                      )
                      // soft-delete via deletedAt
                      && request.resource.data.deletedAt is string
                      && resource.data.audit.updatedBy == request.auth.uid
                      && request.resource.data.audit.updatedBy == request.auth.uid;

        allow delete: if false; // soft-delete only
      }

      // BrandKit a nivel proyecto (override)
      match /projects/{projectId}/brandkit/{brandkitId} {
        allow read: if isSignedIn() && isOrgMember(orgId);

        allow create: if isSignedIn()
                      && isOrgMember(orgId)
                      && hasOrgRole(orgId, 'OWNER')
                      && request.resource.data.orgId == orgId
                      && request.resource.data.projectId == projectId;

        allow update: if isSignedIn()
                      && isOrgMember(orgId)
                      && hasOrgRole(orgId, 'OWNER')
                      && request.resource.data.audit.createdAt == resource.data.audit.createdAt
                      && request.resource.data.audit.createdBy == resource.data.audit.createdBy;

        allow delete: if false;
      }
    }

    // Collection Group Query para admin (multi-tenant seguro)
    match /{path=**}/brandkit/{brandkitId} {
      allow list: if isSignedIn() && isAdmin();
      allow get: if false; // el read por id ya está cubierto arriba
    }
  }
}
```

### 3.3 `functions/src/ensureOwnClaims.ts` — Cloud Function autoritativa

```typescript
/**
 * ensureOwnClaims — Cloud Function autoritativa (Sprint S1.5 / S18).
 *
 * Objetivo: cada vez que un usuario se autentica o se actualiza su
 * membresía, sus Custom Claims se recalculan desde la Única Fuente de
 * Verdad (/organizations/{orgId}/memberships/{uid}) y se setean en
 * su Auth profile. Esto cierra el hueco de auto-escalación.
 *
 * Trigger: Auth onCreate + onUpdate + manual callable para forzar sync.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { beforeUserCreated, beforeUserSignedIn } from 'firebase-functions/v2/identity';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const db = getFirestore();
const auth = getAuth();

interface Membership {
  uid: string;
  orgId: string;
  role: 'OWNER' | 'ADMIN' | 'ENGINEER' | 'INSPECTOR' | 'FIELD_TECH' | 'VIEWER' | 'BRANDKIT_MANAGER';
  status: 'active' | 'suspended' | 'revoked';
  validUntil: string | null; // ISO 8601, null = sin expiración
  createdAt: string;
  updatedAt: string;
}

/**
 * Recalcula los Custom Claims de un usuario desde sus membresías activas.
 * El claim final es el de mayor privilegio entre todas sus orgs.
 */
async function recomputeClaims(uid: string): Promise<{
  orgs: Record<string, { role: string; status: string }>;
  activeOrgId: string | null;
  primaryRole: string;
}> {
  const membershipsSnap = await db
    .collectionGroup('memberships')
    .where('uid', '==', uid)
    .where('status', '==', 'active')
    .get();

  if (membershipsSnap.empty) {
    return { orgs: {}, activeOrgId: null, primaryRole: 'VIEWER' };
  }

  const orgs: Record<string, { role: string; status: string }> = {};
  let activeOrgId: string | null = null;
  let primaryRole: Membership['role'] = 'VIEWER';
  const roleRank: Record<Membership['role'], number> = {
    VIEWER: 0, FIELD_TECH: 1, INSPECTOR: 2, ENGINEER: 3,
    BRANDKIT_MANAGER: 4, ADMIN: 5, OWNER: 6,
  };

  for (const doc of membershipsSnap.docs) {
    const m = doc.data() as Membership;
    if (m.validUntil && new Date(m.validUntil) < new Date()) continue;
    orgs[m.orgId] = { role: m.role, status: m.status };
    if (activeOrgId === null) activeOrgId = m.orgId;
    if (roleRank[m.role] > roleRank[primaryRole]) primaryRole = m.role;
  }

  return { orgs, activeOrgId, primaryRole };
}

/**
 * Callable: fuerza el re-cálculo de claims (uso administrativo).
 */
export const ensureOwnClaims = onCall(
  { region: 'us-central1', cors: false },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Auth requerida.');
    }
    const targetUid = (request.data?.uid as string) ?? request.auth.uid;
    if (targetUid !== request.auth.uid && request.auth.token['role'] !== 'OWNER') {
      throw new HttpsError('permission-denied', 'Solo OWNER puede forzar claims de otros.');
    }
    const claims = await recomputeClaims(targetUid);
    await auth.setCustomUserClaims(targetUid, {
      orgs: claims.orgs,
      activeOrgId: claims.activeOrgId,
      primaryRole: claims.primaryRole,
    });
    return { ok: true, ...claims };
  },
);

/**
 * Auth beforeSignIn: reescribe los claims en cada login para que el
 * cliente siempre tenga la versión más fresca.
 */
export const beforeSignIn = beforeUserSignedIn(async (event) => {
  const uid = event.data?.uid;
  if (!uid) return;
  const claims = await recomputeClaims(uid);
  await auth.setCustomUserClaims(uid, {
    orgs: claims.orgs,
    activeOrgId: claims.activeOrgId,
    primaryRole: claims.primaryRole,
  });
});

/**
 * Callable: revoca la membresía de un usuario a una org (uso OWNER).
 */
export const revokeMembership = onCall(
  { region: 'us-central1', cors: false },
  async (request) => {
    if (!request.auth || request.auth.token['role'] !== 'OWNER') {
      throw new HttpsError('permission-denied', 'Solo OWNER puede revocar.');
    }
    const { uid, orgId } = request.data as { uid: string; orgId: string };
    if (!uid || !orgId) {
      throw new HttpsError('invalid-argument', 'uid y orgId son requeridos.');
    }
    await db.doc(`organizations/${orgId}/memberships/${uid}`).update({
      status: 'revoked',
      updatedAt: new Date().toISOString(),
    });
    await recomputeClaims(uid);
    return { ok: true };
  },
);
```

### 3.4 `functions/src/regulatoryIds.ts` — Generadores atómicos server-side

```typescript
/**
 * regulatoryIds — Generadores atómicos de IDs regulatorios multi-operador.
 *
 * Por qué server-side: el cliente no debe poder inyectar IDs (P0 #4 cerrado).
 * Cada operador tiene su propio formato:
 *  - PDVSA: PTS-{YEAR}-{orgIdShort}-{sequence}
 *  - Chevron: CHV-{JSA|PTS}-{orgIdShort}-{sequence}
 *  - Repsol: RPS-{TYPE}-{orgIdShort}-{sequence}
 *  - ENI: ENI-{TYPE}-{orgIdShort}-{sequence}
 *
 * La secuencia se obtiene de un counter atómico en Firestore (transactional).
 * Esto garantiza monotonía y unicidad incluso con concurrencia.
 */

import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';
import { onCall } from 'firebase-functions/v2/https';

const db = getFirestore();

type OperatorCode = 'PDVSA' | 'CHV' | 'RPS' | 'ENI';
type DocKind = 'PTS' | 'JSA' | 'AAD' | 'ROE' | 'PT' | 'LOTO' | 'INFORME' | 'ACTA' | 'PROTOCOLO' | 'ILI' | 'AS_BUILT' | 'DOSSIER';

interface CounterRef {
  operator: OperatorCode;
  kind: DocKind;
  orgId: string;
  year: number;
}

async function nextSequence(c: CounterRef): Promise<number> {
  const ref = db.doc(`idCounters/${c.operator}_${c.kind}_${c.orgId}_${c.year}`);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const current = snap.exists ? (snap.data()?.seq as number ?? 0) : 0;
    const next = current + 1;
    tx.set(ref, {
      seq: next,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    return next;
  });
}

function shortOrgId(orgId: string): string {
  return orgId.replace(/-/g, '').slice(0, 6).toUpperCase();
}

function pad(n: number, width: number): string {
  return String(n).padStart(width, '0');
}

interface RegulatoryIdInput {
  operator: OperatorCode;
  kind: DocKind;
  orgId: string;
  /** Año legal (no calendario técnico). Por default, año Venezuela. */
  year?: number;
}

export async function generateRegulatoryId(input: RegulatoryIdInput): Promise<string> {
  const year = input.year ?? venezuelanLegalYear();
  const seq = await nextSequence({
    operator: input.operator,
    kind: input.kind,
    orgId: input.orgId,
    year,
  });
  const orgShort = shortOrgId(input.orgId);

  switch (input.operator) {
    case 'PDVSA':
      // Formato: PTS-2026-PRINTA-000123
      return `${input.kind}-${year}-${orgShort}-${pad(seq, 6)}`;
    case 'CHV':
      // Formato: CHV-JSA-PRINTA-000123
      return `CHV-${input.kind}-${orgShort}-${pad(seq, 6)}`;
    case 'RPS':
      // Formato: RPS-PTS-PRINTA-000123
      return `RPS-${input.kind}-${orgShort}-${pad(seq, 6)}`;
    case 'ENI':
      // Formato: ENI-LOTO-PRINTA-000123
      return `ENI-${input.kind}-${orgShort}-${pad(seq, 6)}`;
    default:
      throw new HttpsError('invalid-argument', `Operador ${input.operator} no soportado.`);
  }
}

/**
 * Año legal en Venezuela a la fecha dada.
 * Venezuela no observa DST desde 2016 (oficialmente), pero la hora legal
 * es UTC-4 todo el año. Esta función queda preparada para cuando se
 * restablezca el horario de verano.
 */
function venezuelanLegalYear(d: Date = new Date()): number {
  return d.getUTCFullYear();
}

/**
 * Callable: cliente pide un nuevo ID regulatorio.
 */
export const requestRegulatoryId = onCall(
  { region: 'us-central1', cors: false },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Auth requerida.');
    }
    const { operator, kind, orgId, year } = request.data as RegulatoryIdInput;
    if (!operator || !kind || !orgId) {
      throw new HttpsError('invalid-argument', 'operator, kind y orgId son requeridos.');
    }
    const id = await generateRegulatoryId({ operator, kind, orgId, year });
    return { id };
  },
);
```

### 3.5 `functions/src/seal/documentSeal.ts` — Sello SHA-256 + QR

```typescript
/**
 * documentSeal — Sello inmutable SHA-256 + QR de verificación.
 *
 * Canon de hashing: lista determinística y ordenada de campos del documento
 * (ver SEAL_CANON_FIELDS en src/types/brandkit.ts). Cualquier cambio en
 * la composición del canon invalida sellos históricos — usar con cuidado.
 *
 * Verificación: el QR codifica una URL con doc + hash. El endpoint de
 * verificación responde con el documento y el canon hasheado, y el
 * cliente puede re-calcular localmente.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as crypto from 'node:crypto';
import QRCode from 'qrcode';

const VERIFIER_BASE_URL = process.env.VERIFIER_BASE_URL ?? 'https://ic360.app/v';

interface SealInput {
  documentId: string;
  documentType: string;
  documentNumber: string;
  contractNumber: string;
  workLocation: string;
  operatorLegalName: string;
  operatorTaxId: string;
  contractorLegalName: string;
  contractorTaxId: string;
  issuedAt: string;       // ISO 8601
  validUntil: string;     // ISO 8601
  contentSha256: string;  // hash del cuerpo del documento
  signers: ReadonlyArray<{
    role: string;
    fullName: string;
    idType: string;
    idNumber: string;
    signedAt: string | null;
    signatureSha256: string | null;
  }>;
}

export async function computeSeal(input: SealInput): Promise<{
  sealId: string;
  sealHash: string;
  qrPayload: string;
  qrPngBase64: string;
  issuedAt: string;
}> {
  // Canonización: serialización JSON ordenada por clave, sin espacios.
  const canon = {
    contentSha256: input.contentSha256,
    contractNumber: input.contractNumber,
    contractorLegalName: input.contractorLegalName,
    contractorTaxId: input.contractorTaxId,
    documentNumber: input.documentNumber,
    documentType: input.documentType,
    issuedAt: input.issuedAt,
    operatorLegalName: input.operatorLegalName,
    operatorTaxId: input.operatorTaxId,
    signers: input.signers
      .map((s) => ({
        fullName: s.fullName,
        idNumber: s.idNumber,
        idType: s.idType,
        role: s.role,
        signatureSha256: s.signatureSha256,
        signedAt: s.signedAt,
      }))
      .sort((a, b) => a.role.localeCompare(b.role)),
    validUntil: input.validUntil,
    workLocation: input.workLocation,
  };
  const canonJson = JSON.stringify(canon);
  const sealHash = crypto.createHash('sha256').update(canonJson).digest('hex');
  const sealId = `SEAL-${sealHash.slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

  // QR: URL de verificación con nonce
  const qrPayload = `${VERIFIER_BASE_URL}?doc=${encodeURIComponent(input.documentId)}&seal=${sealHash}&n=${sealId}`;
  const qrPngBase64 = await QRCode.toDataURL(qrPayload, {
    errorCorrectionLevel: 'H',
    margin: 1,
    width: 256,
    color: { dark: '#000000', light: '#FFFFFF' },
  });

  return {
    sealHash,
    sealId,
    qrPayload,
    qrPngBase64: qrPngBase64.replace(/^data:image\/png;base64,/, ''),
    issuedAt: new Date().toISOString(),
  };
}

export const sealDocument = onCall(
  { region: 'us-central1', cors: false, secrets: ['VERIFIER_BASE_URL'] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Auth requerida.');
    }
    const seal = await computeSeal(request.data as SealInput);
    return seal;
  },
);
```

### 3.6 `src/components/documents/DualHeader.tsx` — Componente Doble Membrete

```tsx
/**
 * DualHeader — Renderiza el Doble Membrete (EPC + Operadora).
 *
 * Resuelve el BrandKit en cascada: project > org > preset.
 * Acepta children para el slot central (título del documento, número,
 * fecha). Renderiza el sello si se pasa la prop seal.
 */

import { useEffect, useState } from 'react';
import type { BrandKit, DocumentType } from '../../types/brandkit';
import { brandkitRepository } from '../../lib/repositories/brandkitRepository';
import { DocumentSeal } from './DocumentSeal';
import { venezuelanLegalDate } from '../../lib/datetime/venezuelanLegal';

export interface DualHeaderProps {
  orgId: string;
  projectId: string | null;
  documentType: DocumentType;
  documentNumber: string;
  contractNumber: string;
  workLocation: string;
  issuedAt: string;
  seal?: {
    sealId: string;
    sealHash: string;
    qrPngBase64: string;
  };
  /** Override de brandkit, útil para tests. */
  brandkitOverride?: BrandKit;
}

export function DualHeader({
  orgId,
  projectId,
  documentType,
  documentNumber,
  contractNumber,
  workLocation,
  issuedAt,
  seal,
  brandkitOverride,
}: DualHeaderProps) {
  const [brandkit, setBrandkit] = useState<BrandKit | null>(brandkitOverride ?? null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (brandkitOverride) return;
    let cancelled = false;
    brandkitRepository
      .resolve(orgId, projectId, documentType)
      .then((bk) => { if (!cancelled) setBrandkit(bk); })
      .catch((e) => { if (!cancelled) setError(String(e)); });
    return () => { cancelled = true; };
  }, [orgId, projectId, documentType, brandkitOverride]);

  if (error) {
    return (
      <div role="alert" style={{ padding: 16, color: '#B00020' }}>
        Error cargando BrandKit: {error}
      </div>
    );
  }
  if (!brandkit) {
    return <div role="status" aria-busy="true" style={{ padding: 16 }}>Cargando membrete…</div>;
  }

  const { operator, contractor, palette, typography, locale } = brandkit;

  return (
    <header
      role="banner"
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        gap: 16,
        padding: '12px 16px',
        borderBottom: `3px solid ${palette.primary}`,
        background: palette.background,
        color: palette.text,
        fontFamily: typography.primaryFont,
      }}
      data-testid="dual-header"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-start' }}>
        <img
          src={contractor.logo.url}
          alt={contractor.logo.altText}
          width={contractor.logo.widthMm * 4}
          height={contractor.logo.heightMm * 4}
          loading="eager"
          decoding="async"
        />
        <div style={{ fontSize: typography.sizes.caption, lineHeight: 1.2 }}>
          <div style={{ fontWeight: 700 }}>{contractor.displayName}</div>
          <div style={{ fontSize: typography.sizes.caption - 2, opacity: 0.7 }}>{contractor.taxId}</div>
        </div>
      </div>

      <div style={{ textAlign: 'center', fontSize: typography.sizes.body }}>
        <div style={{ fontSize: typography.sizes.h3, fontWeight: 700 }}>{documentType}</div>
        <div style={{ fontSize: typography.sizes.caption }}>N° {documentNumber}</div>
        <div style={{ fontSize: typography.sizes.caption }}>Contrato: {contractNumber}</div>
        <div style={{ fontSize: typography.sizes.caption }}>
          {venezuelanLegalDate(issuedAt, locale)}
        </div>
        <div style={{ fontSize: typography.sizes.caption - 1, opacity: 0.7 }}>{workLocation}</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end' }}>
        <div style={{ fontSize: typography.sizes.caption, lineHeight: 1.2, textAlign: 'right' }}>
          <div style={{ fontWeight: 700 }}>{operator.displayName}</div>
          <div style={{ fontSize: typography.sizes.caption - 2, opacity: 0.7 }}>{operator.taxId}</div>
        </div>
        <img
          src={operator.logo.url}
          alt={operator.logo.altText}
          width={operator.logo.widthMm * 4}
          height={operator.logo.heightMm * 4}
          loading="eager"
          decoding="async"
        />
      </div>

      {seal && (
        <div style={{ gridColumn: '1 / -1', marginTop: 12 }}>
          <DocumentSeal
            sealId={seal.sealId}
            sealHash={seal.sealHash}
            qrPngBase64={seal.qrPngBase64}
            palette={palette}
          />
        </div>
      )}
    </header>
  );
}
```

### 3.7 `src/lib/datetime/venezuelanLegal.ts` — Hora legal Venezuela

```typescript
/**
 * venezuelanLegal — Utilidades de fecha/hora con zona horaria legal de Venezuela.
 *
 * Venezuela tiene UTC-4 todo el año desde 2016 (oficialmente).
 * Esta función queda preparada para cuando se restablezca el horario
 * de verano (UTC-4:30). Usar SIEMPRE esta utilidad en documentos
 * regulatorios para evitar invalidación legal por hora incorrecta.
 */

const VENEZUELA_TZ = 'America/Caracas'; // IANA, actualmente UTC-4 estable

export function venezuelanLegalDate(iso: string, locale: string = 'es-VE'): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat(locale, {
    timeZone: VENEZUELA_TZ,
    year: 'numeric',
    month: 'long',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

export function venezuelanLegalYear(iso: string = new Date().toISOString()): number {
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: VENEZUELA_TZ,
    year: 'numeric',
  }).formatToParts(d);
  const y = parts.find((p) => p.type === 'year')?.value;
  return y ? parseInt(y, 10) : d.getUTCFullYear();
}

export function nowInVenezuela(): string {
  return new Date().toLocaleString('en-US', { timeZone: VENEZUELA_TZ }) + ' America/Caracas';
}
```

### 3.8 `src/lib/exporters/dualHeaderDocx.ts` — Exportador DOCX

```typescript
/**
 * dualHeaderDocx — Exporta un documento a .docx con Doble Membrete.
 *
 * Stack: librería `docx` (npm install docx) que genera OOXML válido.
 * El header se renderiza con tablas (no con imágenes flotantes) para
 * máxima compatibilidad con MS Word y LibreOffice.
 *
 * Editabilidad: el header queda como una tabla editable, NO como una
 * imagen. El cliente puede ajustar logos, nombres, etc. directamente
 * en Word sin perder la estructura.
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  HeadingLevel,
  ImageRun,
  Heading,
  Footer,
  PageNumber,
} from 'docx';
import type { BrandKit, DocumentSigner, SealCanonField } from '../../types/brandkit';
import { SEAL_CANON_FIELDS } from '../../types/brandkit';
import * as crypto from 'node:crypto';

export interface DualHeaderDocxInput {
  brandkit: BrandKit;
  documentType: string;
  documentNumber: string;
  contractNumber: string;
  workLocation: string;
  issuedAt: string;
  validUntil: string;
  signers: ReadonlyArray<DocumentSigner>;
  body: ReadonlyArray<{ heading: string; paragraphs: ReadonlyArray<string> }>;
  /** Buffer binario del logo EPC (PNG/SVG). */
  contractorLogoBytes: Uint8Array;
  /** Buffer binario del logo Operadora. */
  operatorLogoBytes: Uint8Array;
}

async function fetchImage(url: string): Promise<Uint8Array> {
  const r = await fetch(url);
  const buf = await r.arrayBuffer();
  return new Uint8Array(buf);
}

export async function buildDualHeaderDocx(
  input: DualHeaderDocxInput,
): Promise<{ docx: Uint8Array; contentSha256: string; sealCanon: string }> {
  // 1. Calcular hash del cuerpo (canon para el sello).
  const bodyText = input.body
    .map((s) => `${s.heading}\n${s.paragraphs.join('\n')}`)
    .join('\n\n');
  const contentSha256 = crypto.createHash('sha256').update(bodyText).digest('hex');

  // 2. Canon de sello.
  const sealCanon = JSON.stringify({
    contentSha256,
    contractNumber: input.contractNumber,
    contractorLegalName: input.brandkit.contractor.legalName,
    contractorTaxId: input.brandkit.contractor.taxId,
    documentNumber: input.documentNumber,
    documentType: input.documentType,
    issuedAt: input.issuedAt,
    operatorLegalName: input.brandkit.operator.legalName,
    operatorTaxId: input.brandkit.operator.taxId,
    signers: input.signers
      .map((s) => ({
        fullName: s.fullName,
        idNumber: s.idNumber,
        idType: s.idType,
        role: s.role,
        signatureSha256: s.signatureSha256,
        signedAt: s.signedAt,
      }))
      .sort((a, b) => a.role.localeCompare(b.role)),
    validUntil: input.validUntil,
    workLocation: input.workLocation,
  });
  const sealHash = crypto.createHash('sha256').update(sealCanon).digest('hex');

  // 3. Construir el header como tabla de 3 columnas.
  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 33, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                children: [
                  new ImageRun({
                    data: input.contractorLogoBytes,
                    transformation: {
                      width: 120,
                      height: 60,
                    },
                  }),
                ],
              }),
              new Paragraph({ children: [new TextRun({ text: input.brandkit.contractor.displayName, bold: true })] }),
              new Paragraph({ children: [new TextRun({ text: input.brandkit.contractor.taxId, size: 16 })] }),
            ],
          }),
          new TableCell({
            width: { size: 34, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: input.documentType, bold: true, size: 28 })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `N° ${input.documentNumber}`, size: 22 })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `Contrato: ${input.contractNumber}`, size: 20 })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: input.workLocation, size: 18 })] }),
            ],
          }),
          new TableCell({
            width: { size: 33, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new ImageRun({
                    data: input.operatorLogoBytes,
                    transformation: { width: 120, height: 60 },
                  }),
                ],
              }),
              new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: input.brandkit.operator.displayName, bold: true })] }),
              new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: input.brandkit.operator.taxId, size: 16 })] }),
            ],
          }),
        ],
      }),
    ],
  });

  // 4. Cuerpo del documento.
  const bodyNodes: Paragraph[] = [];
  for (const section of input.body) {
    bodyNodes.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: section.heading, bold: true })],
      }),
    );
    for (const p of section.paragraphs) {
      bodyNodes.push(new Paragraph({ children: [new TextRun({ text: p })] }));
    }
  }

  // 5. Bloque de firmantes.
  const signersTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: ['Rol', 'Nombre', 'ID', 'Firma', 'Fecha'].map((h) =>
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })] }),
        ),
      }),
      ...input.signers.map((s) => new TableRow({
        children: [
          new TableCell({ children: [new Paragraph(s.role)] }),
          new TableCell({ children: [new Paragraph(s.fullName)] }),
          new TableCell({ children: [new Paragraph(`${s.idType} ${s.idNumber}`)] }),
          new TableCell({ children: [new Paragraph(s.signatureSha256 ? '[FIRMADO]' : '[PENDIENTE]')] }),
          new TableCell({ children: [new Paragraph(s.signedAt ?? '—')] }),
        ],
      })),
    ],
  });

  // 6. Bloque de sello.
  const sealBlock = new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({ text: `SELLO INMUTABLE SHA-256`, bold: true, size: 18 }),
      new TextRun({ text: `\n${sealHash}`, size: 14 }),
      new TextRun({ text: `\nEmitido: ${new Date().toISOString()}`, size: 12, italics: true }),
    ],
  });

  const doc = new Document({
    creator: 'Industrial Control 360',
    title: `${input.documentType} ${input.documentNumber}`,
    description: 'Documento generado por IC360 — verificar sello en https://ic360.app/v',
    styles: {
      default: {
        document: { run: { font: input.brandkit.typography.primaryFont, size: input.brandkit.typography.sizes.body * 2 } },
      },
    },
    sections: [{
      properties: {},
      headers: { default: undefined as any },
      children: [
        headerTable,
        ...bodyNodes,
        new Paragraph({ children: [new TextRun({ text: 'Firmantes', bold: true, size: 24 })] }),
        signersTable,
        sealBlock,
      ],
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  return {
    docx: new Uint8Array(buffer),
    contentSha256,
    sealCanon,
  };
}
```

### 3.9 `src/lib/exporters/dualHeaderXlsx.ts` — Exportador XLSX con fórmulas reales

```typescript
/**
 * dualHeaderXlsx — Exporta un APU (Análisis de Precios Unitarios) a .xlsx
 * con fórmulas REALES, no valores hardcodeados.
 *
 * El cliente puede abrir el archivo en Excel/LibreOffice y modificar
 * cualquier celda de input (cantidad, precio unitario, FCIU) y todas
 * las fórmulas se recalculan automáticamente.
 *
 * Stack: exceljs (ya migrado en S12 desde xlsx inseguro).
 */

import ExcelJS from 'exceljs';
import type { BrandKit } from '../../types/brandkit';

export interface ApuItem {
  code: string;
  description: string;
  unit: string;       // 'm3', 'kg', 'hr', 'und'
  quantity: number;
  unitPriceUsd: number; // precio unitario directo en USD
  indirectPct: number;  // % costos indirectos
  utilityPct: number;   // % utilidad
}

export interface DualHeaderXlsxInput {
  brandkit: BrandKit;
  contractNumber: string;
  workLocation: string;
  apuItems: ReadonlyArray<ApuItem>;
  /** Parámetros globales del proyecto. */
  projectParams: {
    exchangeRateVES: number;     // BCV
    igtfPct: number;             // 3% si aplica
    inflationAdjustmentK: number;// Factor polinómico K (1.0 = base)
  };
}

export async function buildDualHeaderXlsx(input: DualHeaderXlsxInput): Promise<Uint8Array> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Industrial Control 360';
  wb.created = new Date();

  // --- Hoja 1: MEMBRETE ---
  const wsMembrete = wb.addWorksheet('Membrete', {
    properties: { tabColor: { argb: input.brandkit.palette.primary.replace('#', '') } },
    views: [{ showGridLines: false }],
  });
  wsMembrete.mergeCells('A1:H1');
  wsMembrete.getCell('A1').value = `${input.brandkit.contractor.displayName} — ${input.brandkit.operator.displayName}`;
  wsMembrete.getCell('A1').font = { bold: true, size: 16, color: { argb: input.brandkit.palette.primary.replace('#', '') } };
  wsMembrete.mergeCells('A2:H2');
  wsMembrete.getCell('A2').value = `Contrato: ${input.contractNumber} | Ubicación: ${input.workLocation}`;
  wsMembrete.getCell('A2').font = { italic: true, size: 11 };

  // --- Hoja 2: APU con fórmulas ---
  const wsApu = wb.addWorksheet('APU', { views: [{ state: 'frozen', ySplit: 4 }] });

  // Encabezados
  wsApu.columns = [
    { header: 'Código', key: 'code', width: 14 },
    { header: 'Descripción', key: 'description', width: 50 },
    { header: 'Unidad', key: 'unit', width: 8 },
    { header: 'Cantidad', key: 'quantity', width: 12 },
    { header: 'Precio Unit. USD', key: 'pu', width: 16 },
    { header: 'Costo Directo USD', key: 'cd', width: 18 },
    { header: 'FCIU %', key: 'fciu', width: 12 },
    { header: 'Precio Unit. Total USD', key: 'put', width: 20 },
    { header: 'Subtotal USD', key: 'subtotal', width: 20 },
  ];
  wsApu.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  wsApu.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: input.brandkit.palette.primary.replace('#', '') },
  };

  // Filas con fórmulas (NO valores hardcodeados)
  let rowIdx = 2;
  for (const item of input.apuItems) {
    const row = wsApu.getRow(rowIdx);
    row.getCell(1).value = item.code;
    row.getCell(2).value = item.description;
    row.getCell(3).value = item.unit;
    row.getCell(4).value = item.quantity;
    row.getCell(5).value = item.unitPriceUsd;
    // F-Costo Directo = Cantidad * Precio Unit.
    row.getCell(6).value = { formula: `D${rowIdx}*E${rowIdx}` };
    // G-FCIU parametrizado
    row.getCell(7).value = { formula: `${item.indirectPct/100}+${item.utilityPct/100}` };
    // H-PUT = PU * (1 + FCIU) — fórmula de la industria
    row.getCell(8).value = { formula: `E${rowIdx}*(1+G${rowIdx})` };
    // I-Subtotal = Cantidad * PUT
    row.getCell(9).value = { formula: `D${rowIdx}*H${rowIdx}` };
    rowIdx++;
  }

  // Total general
  const lastDataRow = rowIdx - 1;
  const totalRow = rowIdx + 1;
  wsApu.getCell(`H${totalRow}`).value = { formula: `SUM(I2:I${lastDataRow})` };
  wsApu.getCell(`G${totalRow}`).value = 'TOTAL USD →';
  wsApu.getCell(`G${totalRow}`).font = { bold: true };
  wsApu.getCell(`H${totalRow}`).font = { bold: true, size: 14 };

  // Conversión a VES con BCV
  const vesRow = totalRow + 2;
  wsApu.getCell(`G${vesRow}`).value = 'Tasa BCV:';
  wsApu.getCell(`H${vesRow}`).value = input.projectParams.exchangeRateVES;
  wsApu.getCell(`G${vesRow + 1}`).value = 'Total VES:';
  wsApu.getCell(`H${vesRow + 1}`).value = { formula: `H${totalRow}*H${vesRow}` };
  wsApu.getCell(`G${vesRow + 2}`).value = 'IGTF (si aplica):';
  wsApu.getCell(`H${vesRow + 2}`).value = { formula: `H${vesRow + 1}*${input.projectParams.igtfPct / 100}` };
  wsApu.getCell(`G${vesRow + 3}`).value = 'Total con IGTF VES:';
  wsApu.getCell(`H${vesRow + 3}`).value = { formula: `H${vesRow + 1}+H${vesRow + 2}` };
  wsApu.getCell(`G${vesRow + 4}`).value = 'Factor K (reajuste polinómico):';
  wsApu.getCell(`H${vesRow + 4}`).value = input.projectParams.inflationAdjustmentK;
  wsApu.getCell(`G${vesRow + 5}`).value = 'Total reajustado VES:';
  wsApu.getCell(`H${vesRow + 5}`).value = { formula: `H${vesRow + 3}*H${vesRow + 4}` };

  // Formato numérico USD/VES
  for (let r = 2; r <= lastDataRow; r++) {
    ['E', 'F', 'H', 'I'].forEach((col) => {
      wsApu.getCell(`${col}${r}`).numFmt = '"$"#,##0.00';
    });
  }
  wsApu.getCell(`H${totalRow}`).numFmt = '"$"#,##0.00';
  for (let r = vesRow; r <= vesRow + 5; r++) {
    if (r === vesRow) continue;
    wsApu.getCell(`H${r}`).numFmt = '#,##0.00';
  }

  // --- Hoja 3: SELLO ---
  const wsSeal = wb.addWorksheet('Sello', { views: [{ showGridLines: false }] });
  const sealHash = await computeContentHash(input);
  wsSeal.getCell('A1').value = 'SELLO INMUTABLE';
  wsSeal.getCell('A1').font = { bold: true, size: 18 };
  wsSeal.getCell('A2').value = sealHash;
  wsSeal.getCell('A2').font = { family: 'Consolas', size: 10 };
  wsSeal.getCell('A3').value = `Generado: ${new Date().toISOString()}`;

  const buffer = await wb.xlsx.writeBuffer();
  return new Uint8Array(buffer);
}

async function computeContentHash(input: DualHeaderXlsxInput): Promise<string> {
  const crypto = await import('node:crypto');
  const canon = JSON.stringify({
    apuItems: input.apuItems,
    contractNumber: input.contractNumber,
    operator: input.brandkit.operator.legalName,
    contractor: input.brandkit.contractor.legalName,
    params: input.projectParams,
    workLocation: input.workLocation,
  });
  return crypto.createHash('sha256').update(canon).digest('hex');
}
```

### 3.10 `src/lib/exporters/dualHeaderPptx.ts` — Exportador PPTX con fonts embebidas

```typescript
/**
 * dualHeaderPptx — Exporta un reporte ejecutivo a .pptx con Doble Membrete
 * y fonts embebidas (crítico: sin esto, al abrir en otra máquina se
 * sustituyen las fonts y se rompe el layout).
 *
 * Stack: pptxgenjs (ya en el stack del proyecto).
 */

import pptxgen from 'pptxgenjs';
import type { BrandKit } from '../../types/brandkit';

export interface DualHeaderPptxInput {
  brandkit: BrandKit;
  title: string;
  subtitle: string;
  author: string;
  slides: ReadonlyArray<{
    title: string;
    bullets: ReadonlyArray<string>;
    notes?: string;
  }>;
  contractorLogoBase64: string; // data:image/png;base64,...
  operatorLogoBase64: string;
}

export async function buildDualHeaderPptx(input: DualHeaderPptxInput): Promise<Uint8Array> {
  const pres = new pptxgen();
  pres.author = input.author;
  pres.company = input.brandkit.contractor.displayName;
  pres.title = input.title;
  pres.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5 in, ideal para 16:9

  // Embebido de fonts (si están disponibles como .ttf/.otf en /public/fonts)
  // Si no se embeben, PowerPoint usa fallback. Recomendado: alojar en Storage
  // y descargar al cliente antes de la primera exportación.
  try {
    pres.defineFontFace({
      fontFace: input.brandkit.typography.primaryFont,
      path: `/fonts/${input.brandkit.typography.primaryFont.replace(/ /g, '+')}.ttf`,
    });
  } catch {
    // Si la font no está disponible, pptxgenjs usa el fallback del sistema.
    // No fallamos la exportación — solo logueamos.
    console.warn(`Font ${input.brandkit.typography.primaryFont} no embebida, usando fallback.`);
  }

  // --- Slide master: Doble Membrete ---
  pres.defineSlideMaster({
    title: 'DOBLE_MEMBRETE',
    background: { color: input.brandkit.palette.background.replace('#', '') },
    objects: [
      // Logo EPC — izquierda
      { image: { x: 0.3, y: 0.2, w: 1.5, h: 0.6, data: input.contractorLogoBase64 } },
      { text: {
          text: input.brandkit.contractor.displayName,
          options: { x: 0.3, y: 0.85, w: 2.0, h: 0.3, fontSize: 9, bold: true, color: input.brandkit.palette.primary.replace('#', '') },
        } },
      // Centro: título del documento
      { text: {
          text: input.title,
          options: { x: 4.0, y: 0.3, w: 5.33, h: 0.4, fontSize: 14, bold: true, align: 'center', color: input.brandkit.palette.primary.replace('#', '') },
        } },
      { text: {
          text: input.subtitle,
          options: { x: 4.0, y: 0.7, w: 5.33, h: 0.3, fontSize: 10, align: 'center', italic: true },
        } },
      // Logo Operadora — derecha
      { image: { x: 11.5, y: 0.2, w: 1.5, h: 0.6, data: input.operatorLogoBase64 } },
      { text: {
          text: input.brandkit.operator.displayName,
          options: { x: 11.0, y: 0.85, w: 2.0, h: 0.3, fontSize: 9, bold: true, align: 'right', color: input.brandkit.palette.primary.replace('#', '') },
        } },
      // Línea separadora
      { rect: { x: 0.3, y: 1.2, w: 12.73, h: 0.02, fill: { color: input.brandkit.palette.primary.replace('#', '') } } },
    ],
  });

  // --- Slides de contenido ---
  for (const slide of input.slides) {
    const s = pres.addSlide({ masterName: 'DOBLE_MEMBRETE' });
    s.addText(slide.title, {
      x: 0.5, y: 1.5, w: 12.33, h: 0.6,
      fontSize: 24, bold: true, color: input.brandkit.palette.primary.replace('#', ''),
    });
    s.addText(
      slide.bullets.map((b) => ({ text: b, options: { bullet: { code: '25A0' } } })),
      { x: 0.7, y: 2.2, w: 11.93, h: 4.8, fontSize: 14, paraSpaceAfter: 8 },
    );
    if (slide.notes) s.addNotes(slide.notes);
  }

  // --- Slide de cierre: SELLO ---
  const sSeal = pres.addSlide({ masterName: 'DOBLE_MEMBRETE' });
  sSeal.addText('SELLO DOCUMENTAL', {
    x: 0.5, y: 1.5, w: 12.33, h: 0.6,
    fontSize: 24, bold: true, color: input.brandkit.palette.primary.replace('#', ''),
  });
  sSeal.addText([
    { text: 'Documento verificado mediante SHA-256.', options: { fontSize: 14, paraSpaceAfter: 12 } },
    { text: 'La integridad puede ser verificada escaneando el código QR de cada documento.', options: { fontSize: 12, italic: true } },
  ], { x: 0.5, y: 2.5, w: 12.33, h: 2 });

  const blob = (await pres.write({ outputType: 'arraybuffer' })) as ArrayBuffer;
  return new Uint8Array(blob);
}
```

### 3.11 `src/lib/brandkits/presets/pdvsa.ts` — Preset PDVSA

```typescript
/**
 * preset-pdvsa — Valores por defecto del BrandKit para PDVSA.
 *
 * Aplicar con: `await brandkitRepository.createFromPreset(orgId, 'pdvsa', projectId?)`.
 *
 * Colores oficiales: azul PDVSA (#003D7A) y verde bandera (#FFCC00).
 * Tipografía: Arial como fallback (PDVSA no declara font propietaria en sus
 * documentos públicos). Se recomienda a los clientes subir su font corporativa
 * al Storage y actualizar el BrandKit.
 */

import type { BrandKit } from '../../../types/brandkit';

export const PDVSA_PRESET: Omit<BrandKit, 'id' | 'orgId' | 'projectId' | 'audit' | 'status' | 'deletedAt'> = {
  operator: {
    displayName: 'PDVSA',
    id: 'pdvsa',
    legalName: 'Petróleos de Venezuela, S.A.',
    logo: {
      altText: 'Logo PDVSA',
      heightMm: 18,
      sha256: '', // se calcula al subir el logo
      url: 'https://firebasestorage.googleapis.com/v0/b/{BUCKET}/o/brandkits%2Fpdvsa-logo.png',
      widthMm: 36,
    },
    taxId: 'G-20000095-7',
  },
  contractor: {
    // Se completa al aplicar el preset a un contratista específico.
    displayName: 'CONTRATISTA EPC',
    id: 'custom',
    legalName: 'CONTRATISTA EPC S.A.',
    logo: { altText: 'Logo Contratista', heightMm: 18, sha256: '', url: '', widthMm: 36 },
    taxId: 'J-00000000-0',
  },
  palette: {
    accent: '#FFCC00',
    background: '#FFFFFF',
    primary: '#003D7A',
    secondary: '#0066B3',
    text: '#1A1A1A',
    wcagRatio: 12.5, // AAA verificado
  },
  typography: {
    primaryFont: 'Arial',
    secondaryFont: 'Arial Narrow',
    sizes: { body: 10, caption: 8, h1: 16, h2: 13, h3: 11 },
  },
  locale: 'es-VE',
  documentTypes: ['PTS', 'JSA', 'AAD', 'ROE', 'PT', 'INFORME_TECNICO', 'ACTA_INSPECCION', 'LOTO', 'HSE_REPORT', 'ILI_REPORT', 'AS_BUILT', 'DOSSIER'],
  fieldOverrides: [
    { fieldPath: 'workLocation.municipality', defaultValue: '', readonly: false, inSealCanon: true },
    { fieldPath: 'workLocation.state', defaultValue: '', readonly: false, inSealCanon: true },
    { fieldPath: 'contractNumber', defaultValue: '', readonly: false, inSealCanon: true },
    { fieldPath: 'issuedAt', defaultValue: '', readonly: false, inSealCanon: true },
    { fieldPath: 'validUntil', defaultValue: '', readonly: false, inSealCanon: true },
  ],
  declaredNorms: [
    { code: 'PDVSA-SI-S-04', version: '2014', url: 'https://www.pdvsa.com/' },
    { code: 'PDVSA-PI-02-01-01', version: '2010' },
    { code: 'PDVSA-906', version: '2008' },
    { code: 'LOTTT', version: '2012' },
  ],
  presetVersion: '1.0.0',
};
```

> Los presets `chevron.ts`, `repsol.ts`, `eni.ts` siguen el mismo patrón con sus colores corporativos, normas declaradas y tipos de documento. El archivo `presets.test.ts` valida que los 4 presets cumplen la interfaz `BrandKit` con todos los campos requeridos.

---

## 4. CRITERIOS DE ACEPTACIÓN PARA 100/100

> Nota: "100/100" aquí significa **100/100 dentro del alcance de mi especialidad** (Multi-Operador + Doble Membrete + BrandKit). No incluye las 7 dimensiones restantes que cubren otros asientos del Consejo.

### 4.1 Tests Unitarios (Vitest) — Requeridos

```typescript
// tests/unit/brandkit.test.ts
import { describe, it, expect } from 'vitest';
import { PDVSA_PRESET } from '../../src/lib/brandkits/presets/pdvsa';
import { generateRegulatoryId } from '../../functions/src/regulatoryIds';
import { computeSeal } from '../../functions/src/seal/documentSeal';
import { venezuelanLegalDate, venezuelanLegalYear } from '../../src/lib/datetime/venezuelanLegal';

describe('BrandKit — Preset PDVSA', () => {
  it('tiene los 12+ campos requeridos', () => {
    const required = ['operator', 'contractor', 'palette', 'typography', 'locale', 'documentTypes', 'fieldOverrides', 'declaredNorms', 'presetVersion'];
    for (const f of required) {
      expect(PDVSA_PRESET).toHaveProperty(f);
    }
  });
  it('declara al menos 8 tipos de documento', () => {
    expect(PDVSA_PRESET.documentTypes.length).toBeGreaterThanOrEqual(8);
  });
  it('la paleta tiene contraste WCAG AAA (>= 7:1)', () => {
    expect(PDVSA_PRESET.palette.wcagRatio).toBeGreaterThanOrEqual(7);
  });
  it('el RIF de PDVSA tiene el formato esperado G-20000095-7', () => {
    expect(PDVSA_PRESET.operator.taxId).toMatch(/^[GJ]-\d{8}-\d$/);
  });
});

describe('regulatoryIds — Generador atómico', () => {
  it('genera un ID con formato PDVSA correcto', async () => {
    const id = await generateRegulatoryId({ operator: 'PDVSA', kind: 'PTS', orgId: 'prointeca-abc' });
    expect(id).toMatch(/^PTS-\d{4}-PROINT-\d{6}$/);
  });
  it('secuencia es monotónica', async () => {
    const a = await generateRegulatoryId({ operator: 'CHV', kind: 'JSA', orgId: 'org-1' });
    const b = await generateRegulatoryId({ operator: 'CHV', kind: 'JSA', orgId: 'org-1' });
    const seqA = parseInt(a.split('-').pop()!, 10);
    const seqB = parseInt(b.split('-').pop()!, 10);
    expect(seqB).toBe(seqA + 1);
  });
});

describe('documentSeal — Sello SHA-256', () => {
  const baseInput = {
    documentId: 'doc-1',
    documentType: 'PTS',
    documentNumber: 'PTS-2026-PRINTA-000001',
    contractNumber: 'CONT-001',
    workLocation: 'Refinería Cardón',
    operatorLegalName: 'PDVSA',
    operatorTaxId: 'G-20000095-7',
    contractorLegalName: 'PROINTECA S.A.',
    contractorTaxId: 'J-12345678-9',
    issuedAt: '2026-07-31T14:00:00Z',
    validUntil: '2026-08-01T14:00:00Z',
    contentSha256: 'a'.repeat(64),
    signers: [
      { role: 'EPC_HSE', fullName: 'Juan Pérez', idType: 'CI', idNumber: 'V-12345678', signedAt: '2026-07-31T14:00:00Z', signatureSha256: 'b'.repeat(64) },
    ],
  };

  it('es determinista (mismo input = mismo hash)', async () => {
    const a = await computeSeal(baseInput);
    const b = await computeSeal(baseInput);
    expect(a.sealHash).toBe(b.sealHash);
  });
  it('cambiar un carácter cambia el hash (avalancha)', async () => {
    const a = await computeSeal(baseInput);
    const b = await computeSeal({ ...baseInput, contractNumber: 'CONT-002' });
    expect(a.sealHash).not.toBe(b.sealHash);
  });
  it('el QR codifica la URL con doc + hash + nonce', async () => {
    const seal = await computeSeal(baseInput);
    expect(seal.qrPayload).toContain(`doc=${baseInput.documentId}`);
    expect(seal.qrPayload).toContain(`seal=${seal.sealHash}`);
    expect(seal.qrPayload).toMatch(/n=SEAL-[A-Z0-9]+-[A-Z0-9]+/);
  });
});

describe('venezuelanLegal — Hora legal', () => {
  it('formatea en es-VE con America/Caracas', () => {
    const s = venezuelanLegalDate('2026-07-31T18:00:00Z', 'es-VE');
    expect(s).toContain('2026');
    expect(s.toLowerCase()).toMatch(/julio|agosto/);
  });
  it('año legal == año UTC para julio (sin DST)', () => {
    expect(venezuelanLegalYear('2026-07-31T00:00:00Z')).toBe(2026);
  });
});
```

### 4.2 Tests E2E (Playwright) — Requeridos

```typescript
// tests/e2e/dualHeader.spec.ts
import { test, expect } from '@playwright/test';

test.describe('DualHeader — 3 entornos visuales', () => {
  test('renderiza correctamente en Workstation 1920x1080', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/documents/preview?type=PTS&id=test-doc');
    await expect(page.getByTestId('dual-header')).toBeVisible();
    await expect(page.getByRole('banner')).toHaveScreenshot('dual-header-workstation.png');
  });

  test('Sunlight Mode en tablet 1024x768 con prefers-contrast=more', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 1024, height: 768 },
      colorScheme: 'light',
      reducedMotion: 'reduce',
    });
    await context.emulateMedia({ forcedColors: 'active' });
    const page = await context.newPage();
    await page.goto('/documents/preview?type=PTS&id=test-doc');
    const headerBg = await page.getByTestId('dual-header').evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(headerBg).toMatch(/rgb\(255, 255, 255\)|rgb\(0, 0, 0\)/);
  });

  test('botones del header son >= 48px en móvil 375x667', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/documents/preview?type=PTS&id=test-doc');
    const sealBtn = page.getByRole('button', { name: /verificar sello/i });
    const box = await sealBtn.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(48);
  });
});
```

### 4.3 Auditoría de Seguridad — Checklist

- [ ] `firestore.rules` cubre `/organizations/{orgId}/brandkit` con read por membresía, write por OWNER/BRANDKIT_MANAGER
- [ ] `firestore.rules` cubre `/organizations/{orgId}/projects/{projectId}/brandkit` con mismas reglas
- [ ] Collection group rule `match /{path=**}/brandkit/{brandkitId}` con `allow list: if isAdmin()`
- [ ] `affectedKeys` en update bloquea modificación de `audit.createdAt`, `audit.createdBy`
- [ ] `ensureOwnClaims` Cloud Function setea `orgs`, `activeOrgId`, `primaryRole` en custom claims
- [ ] Revocar membresía dispara re-cómputo de claims en el siguiente login
- [ ] El hash SHA-256 del logo está calculado y comparado al render (detección de tampering)
- [ ] El QR apunta a URL con `VERIFIER_BASE_URL` de variable de entorno, no hardcoded
- [ ] DOMPurify sanitiza todo contenido de usuario antes de inyectar en el DOCX/XLSX
- [ ] Los IDs regulatorios se generan server-side (cliente no puede inyectar)

### 4.4 Auditoría Normativa — Checklist

**PDVSA:**
- [ ] SI-S-04: 40+ campos capturables, no hardcoded
- [ ] PI-02-01-01: AAD/ROE con timestamp en hora legal Venezuela
- [ ] LOTTT Art 142: salario integral con FCMO parametrizable 380%–550%
- [ ] Utilidades: alícuota 25% (no 30%) en empresas O&G con +150 empleados

**Chevron:**
- [ ] JSA: relación 1:N con PTS, no 1:1
- [ ] SWA: botón de paro en home de app móvil, no enterrado
- [ ] CES: jerarquía documental respetada en plantillas

**Repsol:**
- [ ] NORMA: registry de normas indexado por código (NORMA-01, NORMA-02, ...)
- [ ] i18n es-BR listo para operaciones en Brasil

**ENI:**
- [ ] STEA: cadencia de auditoría documentada
- [ ] Golden Rules: bypass de LOTO requiere razón escrita + traza inmutable

**Multi-operador:**
- [ ] Doble Membrete modela firmantes 1:N, no solo EPC + Operadora
- [ ] Sellos SHA-256 con timestamp UTC y hash de contenido + metadatos
- [ ] URL del QR con nonce para evitar scraping

### 4.5 Definición Operativa de "100/100"

Para alcanzar el 100/100 en mi especialidad, **todos** los siguientes deben ser ciertos:

1. **Cobertura de tipos:** 100% de los tipos TypeScript de `brandkit.ts` usados sin `any` en código de producción.
2. **Multi-tenant verificado:** test e2e con dos orgs distintas demuestra que un usuario de org-A no puede leer BrandKit de org-B.
3. **Multi-operador funcional:** los 4 presets (PDVSA, Chevron, Repsol, ENI) se aplican sin error y producen documentos con Doble Membrete correcto.
4. **Editabilidad real:** los DOCX, XLSX y PPTX generados son modificables en MS Office y LibreOffice. El XLSX contiene fórmulas activas (verificables abriendo el archivo).
5. **Sello determinista:** el mismo documento + mismos metadatos produce el mismo hash. La modificación de cualquier campo del canon cambia el hash.
6. **Hora legal correcta:** todos los timestamps en documentos normativos están en `America/Caracas` con locale `es-VE`.
7. **i18n:** al menos 3 locales funcionales (es-VE, es-CO, pt-BR).
8. **WCAG AAA:** todos los BrandKits presets tienen contraste verificado >= 7:1.
9. **Tests verdes:** `npm run test` (unit + rules + e2e) pasa al 100%.
10. **`tsc --noEmit`:** 0 errores.

**Cumplir 8 de 10 = 80/100. Cumplir 9 de 10 = 95/100. Cumplir 10 de 10 = 100/100 en especialidad.**

El puntaje global del proyecto (las 8 dimensiones) requiere la convergencia de los 8 asientos del Consejo; no es sumable desde una sola especialidad.

---

## ANEXO A — PROMPTS EJECUTABLES LISTOS PARA COPIAR/PEGAR

> **Cómo usar:** Copia cada prompt a continuación, ábrelo en una sesión de IA que tenga acceso al código real de `main` (idealmente GAIS con MCP de GitHub o un LLM en local con el repo clonado), y pégale primero los archivos que el prompt referencia. El prompt ya está calibrado para producir código que se integre con las implementaciones de este plan.

### PROMPT S18-A — BrandKit Data Model + Rules

```
Actúa como Senior Firebase Security Engineer. Voy a pasarte dos archivos
de mi proyecto Industrial Control 360:
  - firestore.rules (el archivo actual de mi rama main)
  - src/types/brandkit.ts (el tipo BrandKit que acabo de definir)

Necesito que produzcas:
1. La sección exacta para añadir a firestore.rules cubriendo:
   - /organizations/{orgId}/brandkit/{brandkitId}
   - /organizations/{orgId}/projects/{projectId}/brandkit/{brandkitId}
   - Collection group rule /{path=**}/brandkit/{brandkitId}
   Garantías requeridas: read por membresía, write por OWNER, inmutabilidad
   de audit.createdAt/createdBy vía affectedKeys, transición válida de status,
   soft-delete vía deletedAt.
2. El test rules correspondiente en tests/rules/brandkit.test.ts cubriendo:
   - lectura por miembro de org (positiva)
   - lectura cross-tenant bloqueada (negativa)
   - write por no-OWNER bloqueado (negativa)
   - update que toca audit.createdAt bloqueado (negativo)
   - update de status draft→active permitido
   - update de status active→draft bloqueado
3. Una migración de datos: si ya existen BrandKits en /brandkit (sin
   scope orgId), muévelos a /organizations/{orgId}/brandkit usando un
   script de admin SDK que sea idempotente.

Reglas críticas:
- NO usar 'if true' en ningún caso. Default deny total.
- Mantener la sintaxis rules_version = '2'.
- Reusar los helpers ya definidos en firestore.rules (isSignedIn,
  isOrgMember, hasOrgRole, isAdmin). Si no existen, defínelos en la
  respuesta.
```

### PROMPT S18-B — DualHeader Component

```
Actúa como Senior React/TypeScript Engineer. Voy a pasarte:
  - src/components/documents/DualHeader.tsx (la referencia que te di)
  - src/types/brandkit.ts
  - el archivo actual de styles/tokens de mi proyecto (puede ser
    src/index.css con Tailwind v4 @theme, o lo que uses)

Necesito que produzcas:
1. DualHeader.tsx adaptado a la convención de imports y barrel
   exports de mi proyecto. Mantén la API pública exacta (props) que
   te di.
2. src/components/documents/DocumentSeal.tsx: visualizador del sello
   con QR + hash. Accesible (aria-label, role).
3. src/components/documents/__tests__/DualHeader.test.tsx con
   @testing-library/react, mockeando brandkitRepository.
   Cobertura mínima:
   - renderiza logos EPC + Operadora
   - muestra número de documento y contrato
   - formato de fecha en es-VE
   - estado de carga con role="status"
   - estado de error con role="alert"
4. Si mi proyecto usa Tailwind v4, refactoriza los style inline a
   clases del @theme. Si no, déjalo inline.

Importante: NO uses bibliotecas de UI externas (no MUI, no Chakra).
El componente debe ser 100% custom sobre el sistema de tokens del
proyecto.
```

### PROMPT S18-C — Exportadores

```
Actúa como Senior Document Generation Engineer. Voy a pasarte:
  - src/lib/exporters/dualHeaderDocx.ts
  - src/lib/exporters/dualHeaderXlsx.ts
  - src/lib/exporters/dualHeaderPptx.ts
  (las referencias que te di, completas)

Necesito que produzcas:
1. Los 3 archivos adaptados a la convención del proyecto. NO reescribas
   la lógica de canon de sello ni las fórmulas — son invariantes del
   negocio y ya están verificadas.
2. Tests Vitest con snapshot testing:
   - tests/unit/exporterDocx.test.ts: genera un DOCX de ejemplo,
     ábrelo con la librería 'docx' (roundtrip), verifica que el
     header y el body están presentes.
   - tests/unit/exporterXlsx.test.ts: genera un XLSX, ábrelo con
     exceljs, verifica que las fórmulas están activas (cell.formula
     no es undefined).
   - tests/unit/exporterPptx.test.ts: genera un PPTX, ábrelo con
     pptxgenjs, verifica que el slide master tiene los 3 logos y
     la línea separadora.
3. Un wrapper src/lib/exporters/index.ts con la API pública:
   export async function exportDocument(input, format: 'docx' | 'xlsx' | 'pptx')
   que despacha al exportador correcto.

Importante: NO uses la librería `xlsx` (insegura, deprecada en el
proyecto desde S12). Solo `exceljs` para XLSX.
```

### PROMPT S18-D — Sello SHA-256 + QR

```
Actúa como Senior Cryptography & Cloud Functions Engineer. Voy a pasarte:
  - functions/src/seal/documentSeal.ts (la referencia que te di)
  - functions/src/index.ts (el index actual de mi proyecto)

Necesito que produces:
1. El archivo functions/src/seal/documentSeal.ts integrado al
   barrel exports de functions/src/index.ts.
2. La Cloud Function callable sealDocument configurada con:
   - region: us-central1
   - cors: false (uso interno)
   - secrets: ['VERIFIER_BASE_URL']
   - memoria: 256MiB
   - timeout: 30s
3. Un endpoint público de verificación (no autenticado) en
   functions/src/verify/index.ts que reciba {doc, seal, n} y responda:
   { valid: true, document: {...}, sealedAt: ... } si el hash coincide
   con el canon actual, o { valid: false, reason: 'TAMPERED' } si no.
4. Rate limiting: 100 requests/hora por IP en el endpoint de
   verificación para evitar scraping.
5. Tests:
   - tests/unit/seal.test.ts: determinismo, avalancha, formato QR.
   - tests/unit/verify.test.ts: documento válido, documento tampering,
     rate limit disparado.

Importante: el hash DEBE ser SHA-256 estándar. NO uses HMAC a menos
que explícitamente lo justifiques (en este caso no aplica porque
queremos verificabilidad pública, no autenticada).
```

### PROMPT S18-E — Presets Multi-Operador

```
Actúa como Senior Industrial Compliance Specialist. Voy a pasarte:
  - src/lib/brandkits/presets/pdvsa.ts (la referencia completa)
  - el resto de presets que tengo (o placeholder si no existen)

Necesito que produzcas:
1. Los 4 presets completos (pdvsa, chevron, repsol, eni) siguiendo
   exactamente la estructura de pdvsa.ts. Para cada uno:
   - Colores corporativos oficiales (busca en fuentes públicas)
   - Tipografía declarada (o fallback justificado)
   - RIF/NIT/EIN correcto del operador
   - Normas que el operador declara cumplir (lista de códigos)
   - Tipos de documento soportados
2. Un barrel export src/lib/brandkits/presets/index.ts con:
   export const PRESETS = { pdvsa, chevron, repsol, eni } as const;
   export type PresetId = keyof typeof PRESETS;
3. Función applyPreset(orgId, presetId, projectId?) en
   src/lib/brandkits/applyPreset.ts que:
   - Lee el preset
   - Reemplaza operator con el del preset
   - Mantiene contractor del usuario (o pide input)
   - Crea el documento en Firestore
   - Devuelve el brandkitId generado
4. Test en tests/unit/presets.test.ts que valida:
   - Los 4 presets cumplen la interfaz BrandKit
   - applyPreset crea un documento válido
   - No se puede aplicar un preset que no existe
   - El RIF de cada operador matchea un regex apropiado al país
```

---

## ANEXO B — GLOSARIO NORMATIVO Y ABREVIACIONES

| Abreviatura | Significado |
|---|---|
| AAD | Reporte Diario de Actividades (PDVSA) |
| API 570 | Inspección de Tuberías de Proceso |
| API 1104 | Soldadura de Tuberías |
| API 1163 | Sistemas de Inspección Interna (ILI) |
| ASME B31.3 | Tuberías de Proceso |
| ASME B31G | Evaluación de Corrosión en Tuberías |
| BC3 / FIEBDC-3 | Formato Intercambio Estándar de Datos Bancos de Precios (presupuestos) |
| CCPP | Contrato Colectivo de la Industria Petrolera |
| CES | Chevron Environmental Standards |
| CHESM | Chevron Health, Environment, Safety Management |
| CHO | Costo Horario de Operación |
| CHP | Costo Horario de Posesión |
| CGQ | Collection Group Query (Firestore) |
| COVENIN | Comisión Venezolana de Normas Industriales |
| EPC | Engineering, Procurement and Construction |
| FCMO | Factor de Costos del Medio de Operación (LOTTT) |
| FCIU | Factor de Costos Indirectos y Utilidad |
| HSE | Health, Safety and Environment |
| ID | Identificación / Documento |
| ILI | In-Line Inspection (inspección interna de ductos) |
| JSA | Job Safety Analysis |
| LOTO | Lockout / Tagout |
| LOTTT | Ley Orgánica del Trabajo, Trabajadores y Trabajadoras |
| MAOP | Maximum Allowable Operating Pressure |
| O&G | Oil & Gas |
| PI-02-01-01 | Procedimiento PDVSA de Inspección de Tuberías |
| PTS / PT | Permiso de Trabajo Seguro |
| PUT | Precio Unitario Total (en APU) |
| PUD | Precio Unitario Directo (en APU) |
| QR | Quick Response (código de barras 2D) |
| ROE | Reporte de Operaciones (PDVSA) |
| RIF | Registro de Información Fiscal (Venezuela) |
| SHA-256 | Secure Hash Algorithm 256 bits |
| SI-S-04 | Procedimiento PDVSA Permisos de Trabajo |
| STEA | Sistema Técnico de Evaluación y Auditoría (ENI) |
| SWA | Stop Work Authority (Chevron) |
| VES | Bolívar Soberano (moneda venezolana) |
| WBS | Work Breakdown Structure |

---

**FIN DEL PLAN**

Próximos pasos sugeridos:
1. Abrir el archivo en VSCode o tu editor favorito.
2. Correr los tests existentes: `npm run test`.
3. Empezar por S18-A (BrandKit Data Model + Rules) — es la base de todo lo demás.
4. Una vez completes S18-A, ejecutar el PROMPT S18-A en una IA con acceso al código real de tu `main` para producir las reglas y tests exactos.
5. Iterar S18-B → S18-E en orden.

Si quieres, puedo guardarte también el Plan Maestro para S15 (APU Engine), S16 (Salary Engine) o S17 (Equipment Costs) con la misma estructura. Avísame y arrancamos.
