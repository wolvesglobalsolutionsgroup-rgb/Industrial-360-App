import { describe, it, expect } from 'vitest';
import { SAMPLE_ISOMETRICS } from '../isometric/sampleIsometrics';
import { generateAsBuiltPdf } from '../isometric/asBuiltPdfGenerator';

describe('Visor Vectorial de Isométricos CAD/SVG (IC360-016)', () => {
  it('carga planos isométricos de muestra con datos técnicos completos', () => {
    expect(SAMPLE_ISOMETRICS.length).toBeGreaterThanOrEqual(3);

    const iso104 = SAMPLE_ISOMETRICS[0];
    expect(iso104.number).toBe('ISO-PDVSA-104');
    expect(iso104.lineTag).toBe('12"-HC-AN-PLC-001');
    expect(iso104.joints.length).toBe(8);
    expect(iso104.spools.length).toBe(3);
    expect(iso104.bom.length).toBeGreaterThan(0);
  });

  it('calcula correctamente el porcentaje de aprobación NDT de un isométrico', () => {
    const iso104 = SAMPLE_ISOMETRICS[0];
    const totalJoints = iso104.joints.length;
    const approvedJoints = iso104.joints.filter(j => j.ndtStatus === 'Aprobado').length;
    const percentApproved = Math.round((approvedJoints / totalJoints) * 100);

    expect(percentApproved).toBe(100);
    expect(approvedJoints).toBe(8);
  });

  it('valida la trazabilidad MTR y WPQ de cada junta', () => {
    const iso104 = SAMPLE_ISOMETRICS[0];
    iso104.joints.forEach(joint => {
      expect(joint.tag).toBeDefined();
      expect(joint.heatNumber).toBeDefined();
      expect(joint.welderStamp).toBeDefined();
      expect(joint.ndtMethod).toBeDefined();
    });
  });

  it('genera correctamente el Certificado As-Built en PDF con hash SHA-256', async () => {
    const iso104 = SAMPLE_ISOMETRICS[0];
    const result = await generateAsBuiltPdf(iso104, 'SEMAX PINO C.A.', 'Proyecto Tuberías PDVSA');

    expect(result.pdfBlob).toBeDefined();
    expect(result.pdfBlob.size).toBeGreaterThan(500);
    expect(result.hashSha256).toBeDefined();
    expect(result.hashSha256.length).toBe(64); // SHA-256 length in hex
  });
});
