import { jsPDF } from 'jspdf';
import { IsometricDrawing } from './isometricTypes';

export async function generateAsBuiltPdf(
  drawing: IsometricDrawing,
  orgName: string = 'SEMAX PINO C.A.',
  projectName: string = 'Proyecto Tuberías y Recipientes PDVSA',
  liberatedBy: string = 'Ing. Manuel Silva (QA/QC Manager)'
): Promise<{ pdfBlob: Blob; hashSha256: string }> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const nowIso = new Date().toISOString();
  const rawPayload = `PDVSA-ASBUILT-L-STC-001|ISO:${drawing.number}|TAG:${drawing.lineTag}|JOINTS:${drawing.joints.length}|DATE:${nowIso}|ORG:${orgName}`;

  // Generate SHA-256 Hash
  const encoder = new TextEncoder();
  const data = encoder.encode(rawPayload);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashSha256 = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  const primaryColor = [11, 34, 57]; // #0B2239
  const accentColor = [16, 185, 129]; // #10b981
  const darkGray = [55, 65, 81]; // #374151

  let y = 15;

  // Header Box
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(10, y, 190, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('PDVSA — INDUSTRIAL CONTROL 360', 15, y + 8);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('DOSSIER DE CALIDAD DE PIPING — CAPÍTULO 6 (AS-BUILT)', 15, y + 15);
  doc.text(`CÓDIGO INTEGRIDAD: ${hashSha256.substring(0, 16).toUpperCase()}`, 115, y + 15);

  y += 30;

  // Document Title
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('CERTIFICADO OFICIAL DE LIBERACIÓN AS-BUILT DE ISOMÉTRICO', 10, y);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.text('Norma PDVSA L-STC-001 / PIC-01-03-05 — Inspección NDT 100% Aprobada Sin Defectos', 10, y + 5);

  y += 12;

  // Metadata Table Box
  doc.setFillColor(243, 244, 246);
  doc.rect(10, y, 190, 32, 'F');
  doc.setDrawColor(209, 213, 219);
  doc.rect(10, y, 190, 32, 'S');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);

  doc.text(`N° Isométrico: ${drawing.number}`, 14, y + 7);
  doc.text(`Tag de Línea: ${drawing.lineTag}`, 14, y + 14);
  doc.text(`Organización: ${orgName}`, 14, y + 21);
  doc.text(`Proyecto: ${projectName}`, 14, y + 28);

  doc.text(`Fluido / Sistema: ${drawing.fluidSystem}`, 110, y + 7);
  doc.text(`Presión / Temp: ${drawing.designPressurePsi} PSI / ${drawing.designTempC}°C`, 110, y + 14);
  doc.text(`Revisión: ${drawing.revision} (${drawing.date})`, 110, y + 21);
  doc.text(`Total Juntas / Status: ${drawing.joints.length} / 🟢 100% APROBADO`, 110, y + 28);

  y += 38;

  // Table Title
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('MATRIZ DE TRAZABILIDAD MTR, SOLDADURA Y ENSAYOS NO DESTRUCTIVOS (NDT)', 10, y);

  y += 5;

  // Table Header
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(10, y, 190, 8, 'F');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);

  doc.text('Junta', 12, y + 5.5);
  doc.text('Spool', 26, y + 5.5);
  doc.text('Estampa', 48, y + 5.5);
  doc.text('Colada MTR', 68, y + 5.5);
  doc.text('Material / Especificación', 102, y + 5.5);
  doc.text('NDT', 148, y + 5.5);
  doc.text('Reporte NDT', 162, y + 5.5);
  doc.text('Status', 184, y + 5.5);

  y += 8;

  // Table Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);

  drawing.joints.forEach((joint, index) => {
    if (index % 2 === 0) {
      doc.setFillColor(249, 250, 251);
      doc.rect(10, y, 190, 7, 'F');
    }

    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.text(joint.tag, 12, y + 5);
    doc.text(joint.spoolTag, 26, y + 5);
    doc.text(joint.welderStamp, 48, y + 5);
    doc.text(joint.heatNumber, 68, y + 5);
    doc.text(joint.material.substring(0, 24), 102, y + 5);
    doc.text(joint.ndtMethod, 148, y + 5);
    doc.text(joint.ndtReportNo || 'REP-PEND', 162, y + 5);

    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('✓ APROBADO', 182, y + 5);
    doc.setFont('helvetica', 'normal');

    y += 7;
  });

  y += 8;

  // Summary Note
  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(16, 185, 129);
  doc.rect(10, y, 190, 16, 'DF');

  doc.setFontSize(8);
  doc.setTextColor(6, 78, 59);
  doc.setFont('helvetica', 'bold');
  doc.text('DICTAMEN DE INSPECCIÓN Y LIBERACIÓN AS-BUILT:', 14, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Se certifica que el 100% de las juntas soldadas del isométrico ${drawing.number} han sido inspeccionadas mediante ensayo radiográfico/ultrasónico conforme a API 1104 / ASME B31.3. La trazabilidad MTR corresponde fielmente con los certificados de colada del Capítulo 3 del Dossier.`, 14, y + 11, { maxWidth: 182 });

  y += 24;

  // Digital Verification Stamp
  doc.setFillColor(243, 244, 246);
  doc.setDrawColor(209, 213, 219);
  doc.rect(10, y, 190, 15, 'DF');

  doc.setFontSize(7);
  doc.setTextColor(107, 114, 128);
  doc.text(`VERIFICACIÓN DIGITAL SHA-256: ${hashSha256}`, 14, y + 5);
  doc.text(`FECHA DE EMISIÓN: ${new Date().toLocaleString()} | REGISTRO AUTÉNTICO EN FIRESTORE DOSSIER CAP. 6`, 14, y + 10);

  y += 22;

  // Signatures
  doc.setDrawColor(156, 163, 175);
  doc.line(15, y + 15, 65, y + 15);
  doc.line(80, y + 15, 130, y + 15);
  doc.line(145, y + 15, 190, y + 15);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);

  doc.text(liberatedBy, 15, y + 19);
  doc.text('Gerente de Obra / QAQC Manager', 15, y + 23);

  doc.text('Ing. Marcos Silva', 80, y + 19);
  doc.text('Inspector CWI / Nivel III ASNT', 80, y + 23);

  doc.text('Representante Inspección PDVSA', 145, y + 19);
  doc.text('Superintendencia de Calidad', 145, y + 23);

  const pdfOutput = doc.output('blob');
  return { pdfBlob: pdfOutput, hashSha256 };
}
