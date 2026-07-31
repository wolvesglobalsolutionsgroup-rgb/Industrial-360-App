import React from 'react';
import type { BrandKitColorPalette } from '../../types/brandkit';

export interface DocumentSealProps {
  sealId: string;
  sealHash: string;
  qrPngBase64: string;
  palette?: BrandKitColorPalette;
}

export function DocumentSeal({ sealId, sealHash, qrPngBase64, palette }: DocumentSealProps) {
  const primaryColor = palette?.primary || '#003D7A';

  return (
    <div
      role="region"
      aria-label="Sello Inmutable Criptográfico SHA-256"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '12px 16px',
        border: `1px solid ${primaryColor}40`,
        borderRadius: 8,
        backgroundColor: `${primaryColor}08`,
        marginTop: 16,
      }}
      data-testid="document-seal"
    >
      {qrPngBase64 && (
        <img
          src={qrPngBase64.startsWith('data:') ? qrPngBase64 : `data:image/png;base64,${qrPngBase64}`}
          alt="Código QR de verificación del sello"
          width={72}
          height={72}
          style={{ borderRadius: 4, border: '1px solid #ccc' }}
        />
      )}
      <div style={{ flex: 1, fontFamily: 'monospace', fontSize: 11, lineHeight: 1.4 }}>
        <div style={{ fontWeight: 700, color: primaryColor, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          🛡️ Sello Criptográfico Inmutable — NORMA SUSCERTE N° 045
        </div>
        <div><strong>ID Sello:</strong> {sealId}</div>
        <div style={{ wordBreak: 'break-all', opacity: 0.85 }}><strong>Hash SHA-256:</strong> {sealHash}</div>
        <div style={{ fontSize: 10, opacity: 0.6, marginTop: 2 }}>Verificable en tiempo real via QR o portal IC360 Shield</div>
      </div>
    </div>
  );
}
