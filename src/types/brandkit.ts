/**
 * Industrial Control 360 — Multi-Operator BrandKit
 * Modelo de datos para Doble Membrete EPC + Operadora.
 *
 * Cubre: PDVSA (SI-S-04, PI-02-01-01), Chevron (CES/CHESM/JSA/SWA),
 * Repsol (EHS / NORMA), ENI (STEA / Golden Rules).
 */

export type OperatorId = 'pdvsa' | 'chevron' | 'repsol' | 'eni' | 'custom';

export type ContractorId = string;

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
  readonly url: string;
  readonly altText: string;
  readonly widthMm: number;
  readonly heightMm: number;
  readonly sha256: string;
}

export interface BrandKitColorPalette {
  readonly primary: string;
  readonly secondary: string;
  readonly accent: string;
  readonly text: string;
  readonly background: string;
  readonly wcagRatio: number;
}

export interface BrandKitTypography {
  readonly primaryFont: string;
  readonly secondaryFont: string;
  readonly sizes: {
    readonly h1: number;
    readonly h2: number;
    readonly h3: number;
    readonly body: number;
    readonly caption: number;
  };
}

export interface BrandKitDocumentFieldOverride {
  readonly fieldPath: string;
  readonly defaultValue: string;
  readonly readonly: boolean;
  readonly inSealCanon: boolean;
}

export interface BrandKit {
  readonly id: string;
  readonly orgId: string;
  readonly projectId: string | null;
  readonly operator: {
    readonly id: OperatorId;
    readonly displayName: string;
    readonly legalName: string;
    readonly taxId: string;
    readonly logo: BrandKitLogo;
  };
  readonly contractor: {
    readonly id: ContractorId;
    readonly displayName: string;
    readonly legalName: string;
    readonly taxId: string;
    readonly logo: BrandKitLogo;
  };
  readonly palette: BrandKitColorPalette;
  readonly typography: BrandKitTypography;
  readonly locale: LegalLocale;
  readonly documentTypes: ReadonlyArray<DocumentType>;
  readonly fieldOverrides: ReadonlyArray<BrandKitDocumentFieldOverride>;
  readonly declaredNorms: ReadonlyArray<{
    readonly code: string;
    readonly version: string;
    readonly url?: string;
  }>;
  readonly presetVersion: string;
  readonly audit: {
    readonly createdAt: string;
    readonly createdBy: string;
    readonly updatedAt: string;
    readonly updatedBy: string;
    readonly changeLog: ReadonlyArray<{
      readonly at: string;
      readonly by: string;
      readonly summary: string;
    }>;
  };
  readonly status: 'draft' | 'active' | 'deprecated';
  readonly deletedAt: string | null;
}

export interface BrandKitResolver {
  resolve(
    orgId: string,
    projectId: string | null,
    documentType: DocumentType,
  ): Promise<BrandKit>;
}

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

export interface DocumentSigner {
  readonly role: 'EPC_LEGAL' | 'EPC_SITE' | 'EPC_HSE' | 'OPERATOR_LEGAL' | 'OPERATOR_SITE' | 'OPERATOR_HSE' | 'WITNESS' | 'INSPECTOR';
  readonly fullName: string;
  readonly idType: 'CI' | 'PASSPORT' | 'RIF' | 'EIN';
  readonly idNumber: string;
  readonly email: string;
  readonly signedAt: string | null;
  readonly signatureSha256: string | null;
}
