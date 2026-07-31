/**
 * DualHeader — Renderiza el Doble Membrete (EPC + Operadora).
 *
 * Resuelve el BrandKit en cascada: project > org > preset.
 * Renderiza el sello criptográfico si se incluye la prop seal.
 */

import React, { useEffect, useState } from 'react';
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
