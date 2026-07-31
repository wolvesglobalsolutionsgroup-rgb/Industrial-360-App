/**
 * documentSeal — Sello inmutable SHA-256 + QR de verificación.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as crypto from 'crypto';
import QRCode from 'qrcode';

const VERIFIER_BASE_URL = process.env.VERIFIER_BASE_URL ?? 'https://ic360.app/v';

export interface SealInput {
  documentId: string;
  documentType: string;
  documentNumber: string;
  contractNumber: string;
  workLocation: string;
  operatorLegalName: string;
  operatorTaxId: string;
  contractorLegalName: string;
  contractorTaxId: string;
  issuedAt: string;
  validUntil: string;
  contentSha256: string;
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
    signers: (input.signers || [])
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

export const generateSealCallable = onCall(
  { region: 'us-central1', cors: false, secrets: ['VERIFIER_BASE_URL'] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Auth requerida.');
    }
    const seal = await computeSeal(request.data as SealInput);
    return seal;
  },
);
