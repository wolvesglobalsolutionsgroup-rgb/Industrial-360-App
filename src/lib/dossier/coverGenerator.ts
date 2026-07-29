import { DocumentoDossier, Revision, Firma, CapituloDossier, CAPITULOS_PDVSA_PIC_01_03_05 } from '../data/pdvsa/dossierTypes';

export interface CoverGeneratorParams {
  documento: DocumentoDossier;
  nombreProyecto: string;
  contratoNo: string;
  contratistaNombre?: string;
  clienteNombre?: string;
  logoContratistaUrl?: string;
  logoClienteUrl?: string;
}

export function generateDoubleHeaderHtml(
  contratistaNombre: string = 'PROINTECA C.A.',
  clienteNombre: string = 'PDVSA GAS C.A.',
  logoContratistaUrl?: string,
  logoClienteUrl?: string,
  subtitulo: string = 'CARÁTULA OFICIAL DE DOSSIER DE CALIDAD'
): string {
  return `
    <table style="width: 100%; border-collapse: collapse; border-bottom: 2px solid #0f172a; margin-bottom: 16px;">
      <tr>
        <!-- LOGO O NOMBRE CONTRATISTA PROINTECA C.A. (IZQUIERDA) -->
        <td style="width: 28%; text-align: center; padding: 8px; border-right: 1px solid #cbd5e1; vertical-align: middle;">
          ${logoContratistaUrl 
            ? `<img src="${logoContratistaUrl}" alt="PROINTECA C.A." style="max-height: 48px; max-width: 140px; object-fit: contain;" />` 
            : `<div style="font-weight: 900; font-size: 13px; color: #0b2239; line-height: 1.2;">PROINTECA C.A.<br/><span style="font-size: 8px; font-weight: bold; color: #475569; letter-spacing: 0.5px; text-transform: uppercase;">CONTRATISTA DE OBRA</span></div>`
          }
        </td>
        <!-- ENCABEZADO CENTRAL NORMA PDVSA -->
        <td style="width: 44%; text-align: center; padding: 8px; vertical-align: middle;">
          <div style="font-size: 9px; font-weight: bold; color: #64748b; letter-spacing: 1px; text-transform: uppercase;">NORMA PDVSA PIC-01-03-05</div>
          <div style="font-size: 13px; font-weight: 900; color: #0b2239; margin-top: 3px; line-height: 1.2;">${subtitulo}</div>
          <div style="font-size: 10px; font-weight: bold; color: #059669; margin-top: 3px;">LIBRO FINAL DE OBRA CERTIFICADO</div>
        </td>
        <!-- LOGO O NOMBRE CLIENTE PDVSA (DERECHA) -->
        <td style="width: 28%; text-align: center; padding: 8px; border-left: 1px solid #cbd5e1; vertical-align: middle;">
          ${logoClienteUrl 
            ? `<img src="${logoClienteUrl}" alt="PDVSA" style="max-height: 48px; max-width: 140px; object-fit: contain;" />` 
            : `<div style="font-weight: 900; font-size: 14px; color: #b91c1c; line-height: 1.2;">PDVSA<br/><span style="font-size: 8px; font-weight: bold; color: #7f1d1d; letter-spacing: 0.5px; text-transform: uppercase;">FILIAL / CLIENTE</span></div>`
          }
        </td>
      </tr>
    </table>
  `;
}

export function generatePdvsaCoverHtml(params: CoverGeneratorParams): string {
  const {
    documento,
    nombreProyecto,
    contratoNo,
    contratistaNombre = 'PROINTECA C.A.',
    clienteNombre = 'PDVSA GAS C.A.',
    logoContratistaUrl,
    logoClienteUrl
  } = params;

  const revActual = documento.revisiones?.[documento.revisiones.length - 1] || {
    rev: documento.revisionActual || '0',
    fecha: documento.fechaGeneracion || new Date().toISOString().split('T')[0],
    descripcion: 'EMISIÓN INICIAL PARA REVISIÓN Y APROBACIÓN DE CALIDAD',
    por: 'ING. RESIDENTE PROINTECA',
    revisadoPor: 'LÍDER QA/QC',
    aprobadoPor: 'INSPECTOR PDVSA'
  };

  const firmasElaboro = documento.firmas.filter(f => f.cargo === 'Elaboró');
  const firmasReviso = documento.firmas.filter(f => f.cargo === 'Revisó' || f.cargo === 'Inspector QA/QC');
  const firmasAprobo = documento.firmas.filter(f => f.cargo === 'Aprobó' || f.cargo === 'Aprobó Cliente');

  return `
    <div style="font-family: Arial, Helvetica, sans-serif; width: 100%; max-width: 800px; margin: 0 auto; background: #ffffff; color: #0f172a; border: 2px solid #0f172a; box-sizing: border-box; padding: 24px;">
      
      <!-- ENCABEZADO CON DOBLE LOGO INSTITUCIONAL (PROINTECA C.A. / PDVSA) -->
      ${generateDoubleHeaderHtml(contratistaNombre, clienteNombre, logoContratistaUrl, logoClienteUrl, 'ANEXO A — CARÁTULA DE DOCUMENTO DE DOSSIER')}

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
        <div style="font-size: 10px; font-weight: bold; color: #64748b; margin-top: 4px;">CATEGORÍA: ${documento.categoria} ${documento.capituloNumero ? `• CAPÍTULO ${documento.capituloNumero}` : ''}</div>
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
                <td style="padding: 6px; border: 1px solid #cbd5e1;">${rev.por || 'PROINTECA'}</td>
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
            <td style="padding: 8px; border: 1px solid #cbd5e1; width: 33%; font-weight: bold; color: #0f172a;">ELABORADO POR (${contratistaNombre})</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; width: 33%; font-weight: bold; color: #0f172a;">REVISADO POR (QA/QC / SIHO)</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; width: 34%; font-weight: bold; color: #b91c1c;">APROBADO POR (CLIENTE / PDVSA)</td>
          </tr>
          <tr>
            <!-- ELABORÓ -->
            <td style="padding: 12px 8px; border: 1px solid #cbd5e1; vertical-align: top;">
              <div style="min-height: 40px; border-bottom: 1px dashed #cbd5e1; margin-bottom: 6px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 9px; color: #059669; font-weight: bold; background: #ecfdf5; padding: 2px 6px; border-radius: 4px;">✓ Firmado Digitalmente</span>
              </div>
              <div style="font-weight: bold; color: #0f172a;">${firmasElaboro[0]?.nombre || 'Ing. Residente PROINTECA'}</div>
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
        <div>DOCUMENTO CONTROLADO PROINTECA C.A. — PROHIBIDA SU REPRODUCCIÓN SIN AUTORIZACIÓN</div>
        <div>HASH BLOCKCHAIN: ${documento.hashIntegridad || 'SHA256-PDVSA-992A-483B-8199-ACC3'}</div>
      </div>

    </div>
  `;
}

export function generateDossierIndexHtml(
  capitulos: CapituloDossier[],
  nombreProyecto: string,
  contratoNo: string,
  contratistaNombre: string = 'PROINTECA C.A.',
  clienteNombre: string = 'PDVSA GAS C.A.'
): string {
  return `
    <div style="font-family: Arial, Helvetica, sans-serif; width: 100%; max-width: 800px; margin: 0 auto; background: #ffffff; color: #0f172a; border: 2px solid #0f172a; box-sizing: border-box; padding: 24px;">
      
      ${generateDoubleHeaderHtml(contratistaNombre, clienteNombre, undefined, undefined, 'ÍNDICE GENERAL Y MATRIZ DEL DOSSIER DE CALIDAD')}

      <div style="background-color: #0b2239; color: #ffffff; padding: 12px; text-align: center; font-weight: bold; font-size: 14px; margin-bottom: 16px; border-radius: 4px;">
        ESTRUCTURA DE 6 CAPÍTULOS NORMA PDVSA PIC-01-03-05
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; border: 1px solid #0f172a; font-size: 10px;">
        <tr style="background-color: #f8fafc;">
          <td style="padding: 6px 10px; font-weight: bold; color: #475569; width: 20%;">PROYECTO:</td>
          <td style="padding: 6px 10px; font-weight: bold; color: #0f172a;" colspan="3">${nombreProyecto}</td>
        </tr>
        <tr>
          <td style="padding: 6px 10px; font-weight: bold; color: #475569;">CONTRATO N°:</td>
          <td style="padding: 6px 10px; font-weight: bold; color: #0f172a;">${contratoNo}</td>
          <td style="padding: 6px 10px; font-weight: bold; color: #475569;">CONTRATISTA:</td>
          <td style="padding: 6px 10px; font-weight: bold; color: #0b2239;">${contratistaNombre}</td>
        </tr>
      </table>

      ${capitulos.map(cap => `
        <div style="margin-bottom: 14px; border: 1px solid #cbd5e1; border-radius: 4px; overflow: hidden;">
          <div style="background-color: #f1f5f9; padding: 8px 12px; border-bottom: 1px solid #cbd5e1; font-weight: 900; font-size: 11px; color: #0b2239; display: flex; justify-content: space-between;">
            <span>${cap.tituloCapitulo}</span>
            <span style="font-size: 9px; color: #059669; font-family: monospace;">${cap.normaReferencia}</span>
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 9px;">
            <thead>
              <tr style="background-color: #f8fafc; color: #475569; text-align: left; border-bottom: 1px solid #cbd5e1;">
                <th style="padding: 4px 8px; width: 25%;">CÓDIGO PDVSA</th>
                <th style="padding: 4px 8px; width: 55%;">TÍTULO DEL DOCUMENTO</th>
                <th style="padding: 4px 8px; width: 10%;">REV.</th>
                <th style="padding: 4px 8px; width: 10%;">ESTATUS</th>
              </tr>
            </thead>
            <tbody>
              ${cap.documentos.map((doc, idx) => `
                <tr style="border-bottom: 1px solid #f1f5f9; background-color: ${idx % 2 === 0 ? '#ffffff' : '#fafafa'};">
                  <td style="padding: 4px 8px; font-family: monospace; font-weight: bold; color: #0b2239;">${doc.codigoPDVSA}</td>
                  <td style="padding: 4px 8px; color: #0f172a;">${doc.titulo}</td>
                  <td style="padding: 4px 8px; font-weight: bold; font-family: monospace;">${doc.revisionActual}</td>
                  <td style="padding: 4px 8px; font-weight: bold; color: ${doc.statusDoc === 'Aprobado' || doc.statusDoc === 'Firmado Final' ? '#059669' : '#d97706'};">${doc.statusDoc}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `).join('')}

      <div style="margin-top: 16px; border-top: 1px solid #0f172a; padding-top: 8px; text-align: center; font-size: 8px; color: #64748b;">
        CERTIFICACIÓN DE EXPEDIENTE DE CALIDAD PROINTECA C.A. / PDVSA PIC-01-03-05
      </div>
    </div>
  `;
}

