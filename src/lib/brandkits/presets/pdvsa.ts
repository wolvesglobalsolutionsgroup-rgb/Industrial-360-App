/**
 * preset-pdvsa — Valores por defecto del BrandKit para PDVSA y Empresas Mixtas.
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
      sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      url: '/logos/pdvsa-logo.png',
      widthMm: 36,
    },
    taxId: 'G-20000095-7',
  },
  contractor: {
    displayName: 'CONTRATISTA EPC',
    id: 'custom',
    legalName: 'CONTRATISTA EPC S.A.',
    logo: { altText: 'Logo Contratista', heightMm: 18, sha256: '', url: '/logos/contractor-logo.png', widthMm: 36 },
    taxId: 'J-00000000-0',
  },
  palette: {
    accent: '#FFCC00',
    background: '#FFFFFF',
    primary: '#003D7A',
    secondary: '#0066B3',
    text: '#1A1A1A',
    wcagRatio: 12.5,
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
