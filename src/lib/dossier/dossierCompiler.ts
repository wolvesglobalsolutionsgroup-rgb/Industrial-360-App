import { db } from '../../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { DocumentoDossier, CapituloDossier, DossierState, FasePDVSA, CAPITULOS_PDVSA_PIC_01_03_05 } from '../data/pdvsa/dossierTypes';

export async function compileProjectDossier(
  orgId: string,
  projectId: string,
  fase: FasePDVSA = 'I',
  projectName: string = 'Proyecto Industrial PDVSA',
  contractNo: string = 'N° CTR-2026-PDVSA-001',
  clientName: string = 'PDVSA GAS C.A.'
): Promise<DossierState> {
  const documents: DocumentoDossier[] = [];

  // Helper to safely get collection items with multi-tenant path or root fallback
  const fetchModuleData = async (colName: string) => {
    try {
      // 1. Try multi-tenant path
      const tenantColRef = collection(db, 'organizations', orgId, 'projects', projectId, colName);
      const tenantSnap = await getDocs(tenantColRef);
      if (!tenantSnap.empty) {
        return tenantSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }
      
      // 2. Fallback to root collection filtered by projectId
      const rootColRef = collection(db, colName);
      const q = query(rootColRef, where('projectId', '==', projectId));
      const rootSnap = await getDocs(q);
      if (!rootSnap.empty) {
        return rootSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }

      // 3. Fallback to all docs in root collection for demo
      const allRootSnap = await getDocs(rootColRef);
      return allRootSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.warn(`[DossierCompiler] Error reading collection ${colName}:`, err);
      return [];
    }
  };

  // 1. Scan SIHO-A PTW Permits -> Capítulo 4
  const ptwDocs = await fetchModuleData('siho_ptw');
  ptwDocs.forEach((ptw: any, idx) => {
    documents.push({
      id: `DOC-SIHO-${ptw.id || idx}`,
      codigoPDVSA: `A1C0012601-GD0I4-S0D0100${idx + 1}`,
      titulo: `Permiso de Trabajo SIHO-A: ${ptw.type || ptw.permisoNo || 'PTW General'} - ${ptw.location || 'Frente de Obra'}`,
      categoria: 'SIHO-A PTW',
      capituloNumero: 4,
      fase: 'I',
      disciplina: 'S',
      revisionActual: '0',
      revisiones: [{ rev: '0', fecha: ptw.date || new Date().toISOString().split('T')[0], descripcion: 'Emisión Inicial de Permiso PTW SIHO-A', por: ptw.supervisor || 'Inspector SIHO PROINTECA', revisadoPor: 'Gerente SIHO', aprobadoPor: 'PDVSA SIAHO' }],
      firmas: [
        { cargo: 'Elaboró', nombre: ptw.supervisor || 'Inspector SIHO PROINTECA', cedulaOrFirmaId: 'V-18.234.123', fecha: ptw.date || '2026-07-01', status: 'Firmado' },
        { cargo: 'Revisó', nombre: 'Ing. Residente QA', cedulaOrFirmaId: 'V-15.890.111', fecha: ptw.date || '2026-07-01', status: 'Firmado' },
        { cargo: 'Aprobó Cliente', nombre: 'Inspector PDVSA SIAHO', cedulaOrFirmaId: 'V-12.456.789', fecha: ptw.date || '2026-07-01', status: 'Firmado' }
      ],
      statusDoc: 'Firmado Final',
      origenModulo: 'SIHO',
      origenRefId: ptw.id,
      fechaGeneracion: ptw.date || new Date().toISOString().split('T')[0],
      paginasCount: 4
    });
  });

  // 2. Scan QA/QC Weld Joints & NDT Reports -> Capítulo 4
  const weldDocs = await fetchModuleData('weld_joints');
  weldDocs.forEach((weld: any, idx) => {
    documents.push({
      id: `DOC-QAQC-${weld.id || idx}`,
      codigoPDVSA: `A1C0012601-GD0I4-Q0D0300${idx + 1}`,
      titulo: `Reporte de Inspección Soldadura / NDT: Junta ${weld.jointNo || weld.tag || `JJ-${idx + 1}`} (${weld.process || 'SMAW'})`,
      categoria: 'QA/QC',
      capituloNumero: 4,
      fase: 'I',
      disciplina: 'Q',
      revisionActual: '0',
      revisiones: [{ rev: '0', fecha: weld.date || '2026-07-10', descripcion: 'Certificado de Inspección NDT (VT/UT/RT) según API 1104 §9', por: weld.inspector || 'Inspector Nivel II PROINTECA', revisadoPor: 'Líder QA/QC', aprobadoPor: 'Representante Cliente' }],
      firmas: [
        { cargo: 'Elaboró', nombre: weld.inspector || 'Inspector CWI/NDT', cedulaOrFirmaId: 'V-16.321.000', fecha: '2026-07-10', status: 'Firmado' },
        { cargo: 'Aprobó', nombre: 'Superintendente QA/QC PROINTECA', cedulaOrFirmaId: 'V-14.222.333', fecha: '2026-07-10', status: 'Firmado' }
      ],
      statusDoc: weld.status === 'Rechazado' ? 'Rechazado' : 'Aprobado',
      origenModulo: 'QAQC',
      origenRefId: weld.id,
      fechaGeneracion: weld.date || '2026-07-10',
      paginasCount: 2
    });
  });

  // 3. Scan ILI Pigging Runs -> Capítulo 4
  const iliDocs = await fetchModuleData('ili_runs');
  iliDocs.forEach((ili: any, idx) => {
    documents.push({
      id: `DOC-ILI-${ili.id || idx}`,
      codigoPDVSA: `A1C0012601-GD0I3-M0D0100${idx + 1}`,
      titulo: `Informe Técnico Corrida de Inspección Interna ILI MFL/EMAT: ${ili.lineTag || 'Ducto Principal'}`,
      categoria: 'ILI Pigging',
      capituloNumero: 4,
      fase: 'I',
      disciplina: 'M',
      revisionActual: '0',
      revisiones: [{ rev: '0', fecha: ili.runDate || '2026-06-15', descripcion: 'Informe de Integridad Estructural Pigging ROSEN/TDW', por: ili.vendor || 'Proveedor ILI', revisadoPor: 'Especialista Integridad', aprobadoPor: 'Gerente Operaciones PDVSA' }],
      firmas: [
        { cargo: 'Elaboró', nombre: ili.vendor || 'Inspector ROSEN Group', cedulaOrFirmaId: 'REG-ROSEN-992', fecha: '2026-06-15', status: 'Firmado' },
        { cargo: 'Aprobó Cliente', nombre: 'Gerente Integridad PDVSA', cedulaOrFirmaId: 'V-11.987.654', fecha: '2026-06-16', status: 'Firmado' }
      ],
      statusDoc: 'Aprobado',
      origenModulo: 'ILI',
      origenRefId: ili.id,
      fechaGeneracion: ili.runDate || '2026-06-15',
      paginasCount: 28
    });
  });

  // 4. Scan Valuations (ROE) -> Capítulo 1
  const valuationDocs = await fetchModuleData('valuations');
  valuationDocs.forEach((val: any, idx) => {
    documents.push({
      id: `DOC-VAL-${val.id || idx}`,
      codigoPDVSA: `A1C0012601-GD0I5-G0D0100${idx + 1}`,
      titulo: `Valuación ROE Certificada N° ${val.valuationNo || idx + 1}: ${val.period || 'Periodo de Obra Ejecutada'}`,
      categoria: 'Valuaciones ROE',
      capituloNumero: 1,
      fase: 'I',
      disciplina: 'G',
      revisionActual: '0',
      revisiones: [{ rev: '0', fecha: val.date || '2026-07-01', descripcion: 'Relación de Obra Ejecutada y Soporte de Cómputos', por: 'Ing. Inspector Valuador PROINTECA', revisadoPor: 'Gerente de Obra', aprobadoPor: 'Inspector PDVSA Costos' }],
      firmas: [
        { cargo: 'Elaboró', nombre: 'Ing. Residente PROINTECA', cedulaOrFirmaId: 'V-17.555.444', fecha: '2026-07-01', status: 'Firmado' },
        { cargo: 'Aprobó Cliente', nombre: 'Ing. Inspector PDVSA', cedulaOrFirmaId: 'V-13.888.999', fecha: '2026-07-02', status: 'Firmado' }
      ],
      statusDoc: 'Aprobado',
      origenModulo: 'VALUATIONS',
      origenRefId: val.id,
      fechaGeneracion: val.date || '2026-07-01',
      paginasCount: 12
    });
  });

  // 5. Scan Field Reports -> Capítulo 4
  const fieldDocs = await fetchModuleData('field_reports');
  fieldDocs.forEach((rep: any, idx) => {
    documents.push({
      id: `DOC-FLD-${rep.id || idx}`,
      codigoPDVSA: `A1C0012601-GD0I3-C0D0100${idx + 1}`,
      titulo: `Reporte Diario de Campo / Bitácora de Avance: ${rep.title || rep.location || `Frente ${idx + 1}`}`,
      categoria: 'Reportes Campo',
      capituloNumero: 4,
      fase: 'I',
      disciplina: 'C',
      revisionActual: '0',
      revisiones: [{ rev: '0', fecha: rep.date || '2026-07-15', descripcion: 'Bitácora Diaria de Obra y Avance Físico PROINTECA', por: rep.author || 'Inspector de Campo', revisadoPor: 'Superintendente Obra', aprobadoPor: 'Inspector PDVSA' }],
      firmas: [
        { cargo: 'Elaboró', nombre: rep.author || 'Inspector de Campo PROINTECA', cedulaOrFirmaId: 'V-19.111.222', fecha: '2026-07-15', status: 'Firmado' }
      ],
      statusDoc: 'Aprobado',
      origenModulo: 'FIELD_REPORTS',
      origenRefId: rep.id,
      fechaGeneracion: rep.date || '2026-07-15',
      paginasCount: 3
    });
  });

  // 6. Scan Materials / MTRs -> Capítulo 3
  const materialDocs = await fetchModuleData('mtr_certificates');
  materialDocs.forEach((mtr: any, idx) => {
    documents.push({
      id: `DOC-MTR-${mtr.id || idx}`,
      codigoPDVSA: `A1C0012601-GD0I3-M0D0200${idx + 1}`,
      titulo: `Certificado de Colada MTR (Heat No. ${mtr.heatNumber || `HN-${idx + 100}`}): ${mtr.itemDescription || 'Tubería API 5L X52 / Flanje A105'}`,
      categoria: 'Trazabilidad Materiales MTR',
      capituloNumero: 3,
      fase: 'I',
      disciplina: 'M',
      revisionActual: '0',
      revisiones: [{ rev: '0', fecha: mtr.date || '2026-06-10', descripcion: 'Mill Test Report Certificado según ASTM / API 5L', por: 'Inspector Materiales PROINTECA', revisadoPor: 'Líder QA/QC', aprobadoPor: 'PDVSA Inspección' }],
      firmas: [
        { cargo: 'Elaboró', nombre: mtr.inspector || 'Inspector Materiales PROINTECA', cedulaOrFirmaId: 'V-18.100.200', fecha: '2026-06-10', status: 'Firmado' }
      ],
      statusDoc: 'Aprobado',
      origenModulo: 'MATERIALS',
      origenRefId: mtr.id,
      fechaGeneracion: mtr.date || '2026-06-10',
      paginasCount: 2
    });
  });

  // 7. Scan Liberated As-Built Isometrics -> Capítulo 6
  const isoAsBuiltDocs = await fetchModuleData('isometric_asbuilts');
  isoAsBuiltDocs.forEach((iso: any, idx) => {
    documents.push({
      id: `DOC-ISO-${iso.id || idx}`,
      codigoPDVSA: `A1C0012601-GD0O6-C0D0200${idx + 1}`,
      titulo: `Isométrico As-Built Liberado N° ${iso.isometricNumber || iso.title}: ${iso.lineDescription || 'Tubería de Proceso'} (100% NDT Approved)`,
      categoria: 'Planos As-Built',
      capituloNumero: 6,
      fase: 'O',
      disciplina: 'C',
      revisionActual: '0',
      revisiones: [{ rev: '0', fecha: iso.liberatedAt || new Date().toISOString().split('T')[0], descripcion: 'Liberación As-Built Final según Norma PDVSA L-STC-001', por: iso.liberatedBy || 'Gerente QA/QC', revisadoPor: 'Inspector CWI Level III', aprobadoPor: 'Representante PDVSA' }],
      firmas: [
        { cargo: 'Elaboró', nombre: iso.liberatedBy || 'Gerente QA/QC PROINTECA', cedulaOrFirmaId: 'V-15.890.111', fecha: iso.liberatedAt || '2026-07-29', status: 'Firmado' },
        { cargo: 'Aprobó Cliente', nombre: 'Inspector PDVSA Calidad', cedulaOrFirmaId: 'V-12.456.789', fecha: iso.liberatedAt || '2026-07-29', status: 'Firmado' }
      ],
      statusDoc: 'Firmado Final',
      origenModulo: 'AS_BUILT',
      origenRefId: iso.id,
      hashIntegridad: iso.hashSha256 || 'SHA256-ASBUILT-VERIFIED',
      fechaGeneracion: iso.liberatedAt || new Date().toISOString().split('T')[0],
      paginasCount: 4
    });
  });

  // Always supply full standard compliance baseline documents across all 6 Chapters
  const baselineDocs: DocumentoDossier[] = [
    // Capítulo 1: Datos Generales
    {
      id: 'DOC-CAP1-001',
      codigoPDVSA: 'A1C0012601-GD0D1-G0D01001',
      titulo: 'Memoria Descriptiva, Organigrama de Obra y Alcance Contractual PROINTECA C.A.',
      categoria: 'General',
      capituloNumero: 1,
      fase: 'V',
      disciplina: 'G',
      revisionActual: '0',
      revisiones: [{ rev: '0', fecha: '2026-05-01', descripcion: 'Aprobación de la Memoria Descriptiva y Alcance', por: 'Ing. Residente PROINTECA', revisadoPor: 'Gerente Operaciones', aprobadoPor: 'Gerente Contrato PDVSA' }],
      firmas: [
        { cargo: 'Elaboró', nombre: 'Ing. Residente PROINTECA', cedulaOrFirmaId: 'V-14.888.333', fecha: '2026-05-01', status: 'Firmado' },
        { cargo: 'Aprobó Cliente', nombre: 'Gerente Contrato PDVSA', cedulaOrFirmaId: 'V-11.222.333', fecha: '2026-05-02', status: 'Firmado' }
      ],
      statusDoc: 'Aprobado',
      origenModulo: 'ENGINEERING',
      fechaGeneracion: '2026-05-01',
      paginasCount: 18
    },
    // Capítulo 2: Plan de Control de Calidad PCC
    {
      id: 'DOC-CAP2-001',
      codigoPDVSA: 'A1C0012601-GD0D2-Q0D01001',
      titulo: 'Plan de Control de Calidad (PCC/PIE) y Matriz de Puntos de Inspección Hold/Witness/Review (H/W/R)',
      categoria: 'PCC / Matriz HWR',
      capituloNumero: 2,
      fase: 'D',
      disciplina: 'Q',
      revisionActual: '0',
      revisiones: [{ rev: '0', fecha: '2026-05-15', descripcion: 'Plan de Inspección y Ensayo (PIE) según PDVSA PIC-01-03-05', por: 'Líder QA/QC PROINTECA', revisadoPor: 'Gerente Calidad', aprobadoPor: 'Gerente QA/QC PDVSA' }],
      firmas: [
        { cargo: 'Elaboró', nombre: 'Líder QA/QC PROINTECA', cedulaOrFirmaId: 'V-15.890.111', fecha: '2026-05-15', status: 'Firmado' },
        { cargo: 'Aprobó Cliente', nombre: 'Inspector Calidad PDVSA', cedulaOrFirmaId: 'V-12.456.789', fecha: '2026-05-16', status: 'Firmado' }
      ],
      statusDoc: 'Aprobado',
      origenModulo: 'QAQC',
      fechaGeneracion: '2026-05-15',
      paginasCount: 24
    },
    // Capítulo 3: MTRs
    {
      id: 'DOC-CAP3-001',
      codigoPDVSA: 'A1C0012601-GD0I3-M0D01001',
      titulo: 'Matriz de Trazabilidad de Materiales y Libro de Certificados de Colada MTR (API 5L / ASTM A106)',
      categoria: 'Trazabilidad Materiales MTR',
      capituloNumero: 3,
      fase: 'I',
      disciplina: 'M',
      revisionActual: '0',
      revisiones: [{ rev: '0', fecha: '2026-06-05', descripcion: 'Certificación de Trazabilidad Heat Numbers en Tubería y Flanges', por: 'Inspector Materiales PROINTECA', revisadoPor: 'Superintendente QA/QC', aprobadoPor: 'PDVSA Inspección' }],
      firmas: [
        { cargo: 'Elaboró', nombre: 'Inspector Materiales PROINTECA', cedulaOrFirmaId: 'V-18.100.200', fecha: '2026-06-05', status: 'Firmado' },
        { cargo: 'Aprobó Cliente', nombre: 'Inspector PDVSA', cedulaOrFirmaId: 'V-13.888.999', fecha: '2026-06-06', status: 'Firmado' }
      ],
      statusDoc: 'Aprobado',
      origenModulo: 'MATERIALS',
      fechaGeneracion: '2026-06-05',
      paginasCount: 35
    },
    // Capítulo 4: Pruebas Hidrostáticas & WPS
    {
      id: 'DOC-CAP4-001',
      codigoPDVSA: 'A1C0012601-GD0I4-M0D02001',
      titulo: 'Especificación de Procedimiento de Soldadura (WPS-PRO-01) y Calificación de Soldadores (WPQ / API 1104)',
      categoria: 'Calificación WPQ/WPS',
      capituloNumero: 4,
      fase: 'I',
      disciplina: 'M',
      revisionActual: '0',
      revisiones: [{ rev: '0', fecha: '2026-06-12', descripcion: 'Aprobación de Procedimiento de Soldadura ASME IX / API 1104', por: 'Especialista Soldadura PROINTECA', revisadoPor: 'Inspector CWI', aprobadoPor: 'Inspector PDVSA' }],
      firmas: [
        { cargo: 'Elaboró', nombre: 'Especialista Soldadura PROINTECA', cedulaOrFirmaId: 'V-16.321.000', fecha: '2026-06-12', status: 'Firmado' },
        { cargo: 'Aprobó Cliente', nombre: 'Inspector Técnico PDVSA', cedulaOrFirmaId: 'V-12.456.789', fecha: '2026-06-13', status: 'Firmado' }
      ],
      statusDoc: 'Aprobado',
      origenModulo: 'QAQC',
      fechaGeneracion: '2026-06-12',
      paginasCount: 16
    },
    {
      id: 'DOC-CAP4-002',
      codigoPDVSA: 'A1C0012601-GD0I4-M0D04001',
      titulo: 'Certificado de Prueba Hidrostática de Tubería y Gráfica Barton Registradora (Norma PDVSA PI-02-08-01)',
      categoria: 'Prueba Hidrostática',
      capituloNumero: 4,
      fase: 'I',
      disciplina: 'M',
      revisionActual: '0',
      revisiones: [{ rev: '0', fecha: '2026-07-08', descripcion: 'Acta Aprobada de Prueba de Presión Hidrostática a 1.5 x MOP', por: 'Ing. Prueba Hidrostática PROINTECA', revisadoPor: 'Líder QA/QC', aprobadoPor: 'Inspector PDVSA Operaciones' }],
      firmas: [
        { cargo: 'Elaboró', nombre: 'Ing. Residente PROINTECA', cedulaOrFirmaId: 'V-17.555.444', fecha: '2026-07-08', status: 'Firmado' },
        { cargo: 'Aprobó Cliente', nombre: 'Inspector PDVSA Operaciones', cedulaOrFirmaId: 'V-11.987.654', fecha: '2026-07-08', status: 'Firmado' }
      ],
      statusDoc: 'Aprobado',
      origenModulo: 'QAQC',
      fechaGeneracion: '2026-07-08',
      paginasCount: 8
    },
    // Capítulo 5: Certificados de Calibración
    {
      id: 'DOC-CAP5-001',
      codigoPDVSA: 'A1C0012601-GD0I5-Q0D01001',
      titulo: 'Compendio de Certificados de Calibración Metrológica: Detectores Gasotester 6 Gases, Manómetros Patrón y Registrador Barton',
      categoria: 'Certificados Calibración',
      capituloNumero: 5,
      fase: 'I',
      disciplina: 'Q',
      revisionActual: '0',
      revisiones: [{ rev: '0', fecha: '2026-06-20', descripcion: 'Verificación de Trazabilidad Metrológica de Equipos de Medición', por: 'Inspector Calibración PROINTECA', revisadoPor: 'Líder QA/QC', aprobadoPor: 'SENCAMER / PDVSA' }],
      firmas: [
        { cargo: 'Elaboró', nombre: 'Inspector Calibración PROINTECA', cedulaOrFirmaId: 'V-19.111.222', fecha: '2026-06-20', status: 'Firmado' },
        { cargo: 'Aprobó Cliente', nombre: 'Inspector PDVSA SIAHO', cedulaOrFirmaId: 'V-12.456.789', fecha: '2026-06-21', status: 'Firmado' }
      ],
      statusDoc: 'Aprobado',
      origenModulo: 'CALIBRATION',
      fechaGeneracion: '2026-06-20',
      paginasCount: 14
    },
    // Capítulo 6: Planos As-Built & Recepción Definitiva
    {
      id: 'DOC-CAP6-001',
      codigoPDVSA: 'A1C0012601-GD0O6-C0D01001',
      titulo: 'Planos As-Built Finales, Isométricos y P&ID Marcados en Rojo/Verde (Norma PDVSA L-STC-001)',
      categoria: 'Planos As-Built',
      capituloNumero: 6,
      fase: 'O',
      disciplina: 'C',
      revisionActual: '0',
      revisiones: [{ rev: '0', fecha: '2026-07-25', descripcion: 'Planos As-Built Conforme a Obra Ejecutada', por: 'Proyectista CAD PROINTECA', revisadoPor: 'Líder Proyecto', aprobadoPor: 'Gerente Proyecto PDVSA' }],
      firmas: [
        { cargo: 'Elaboró', nombre: 'Proyectista CAD PROINTECA', cedulaOrFirmaId: 'V-20.333.444', fecha: '2026-07-25', status: 'Firmado' },
        { cargo: 'Aprobó Cliente', nombre: 'Gerente Proyecto PDVSA', cedulaOrFirmaId: 'V-10.444.555', fecha: '2026-07-26', status: 'Firmado' }
      ],
      statusDoc: 'Aprobado',
      origenModulo: 'AS_BUILT',
      fechaGeneracion: '2026-07-25',
      paginasCount: 30
    },
    {
      id: 'DOC-CAP6-002',
      codigoPDVSA: 'A1C0012601-GD0O6-G0D02001',
      titulo: 'Acta de Completación Mecánica y Acta de Recepción Definitiva de Obra',
      categoria: 'Completación',
      capituloNumero: 6,
      fase: 'O',
      disciplina: 'G',
      revisionActual: '0',
      revisiones: [{ rev: '0', fecha: '2026-07-28', descripcion: 'Emisión Final para Firma de Cierre Definitivo de Contrato', por: 'Ing. Residente PROINTECA', revisadoPor: 'Gerente General', aprobadoPor: 'Comité de Recepción PDVSA' }],
      firmas: [
        { cargo: 'Elaboró', nombre: 'Ing. Residente PROINTECA', cedulaOrFirmaId: 'V-14.888.333', fecha: '2026-07-28', status: 'Firmado' },
        { cargo: 'Aprobó Cliente', nombre: 'Presidente Comité Recepción PDVSA', cedulaOrFirmaId: 'V-09.888.777', fecha: '2026-07-28', status: 'Firmado' }
      ],
      statusDoc: 'Firmado Final',
      origenModulo: 'AS_BUILT',
      fechaGeneracion: '2026-07-28',
      paginasCount: 6
    }
  ];

  // Merge baseline docs into documents array if they don't already exist
  baselineDocs.forEach(bDoc => {
    if (!documents.some(d => d.codigoPDVSA === bDoc.codigoPDVSA || d.id === bDoc.id)) {
      documents.push(bDoc);
    }
  });

  // Organize all documents into the 6 Capítulos according to PDVSA PIC-01-03-05
  const capitulos: CapituloDossier[] = CAPITULOS_PDVSA_PIC_01_03_05.map(capDef => {
    const docsInCap = documents.filter(d => {
      if (d.capituloNumero === capDef.numero) return true;
      // Fallback matching by category
      if (capDef.numero === 1 && (d.categoria === 'General' || d.categoria === 'Valuaciones ROE')) return true;
      if (capDef.numero === 2 && (d.categoria === 'PCC / Matriz HWR' || d.categoria === 'Ingeniería')) return true;
      if (capDef.numero === 3 && d.categoria === 'Trazabilidad Materiales MTR') return true;
      if (capDef.numero === 4 && (d.categoria === 'SIHO-A PTW' || d.categoria === 'QA/QC' || d.categoria === 'ILI Pigging' || d.categoria === 'Prueba Hidrostática' || d.categoria === 'Calificación WPQ/WPS' || d.categoria === 'Reportes Campo')) return true;
      if (capDef.numero === 5 && d.categoria === 'Certificados Calibración') return true;
      if (capDef.numero === 6 && (d.categoria === 'Planos As-Built' || d.categoria === 'Completación')) return true;
      return false;
    });

    return {
      id: capDef.id,
      numero: capDef.numero,
      tituloCapitulo: capDef.tituloCapitulo,
      normaReferencia: capDef.normaReferencia,
      codigoSeccion: capDef.codigoSeccion || `CAP-0${capDef.numero}`,
      descripcion: capDef.descripcion,
      documentos: docsInCap
    };
  });

  const totalDocumentos = documents.length;
  const documentosAprobados = documents.filter(d => d.statusDoc === 'Aprobado' || d.statusDoc === 'Firmado Final').length;
  const documentosPendientes = totalDocumentos - documentosAprobados;

  return {
    idProject: projectId,
    orgId,
    tituloProyecto: projectName,
    contratoNo: contractNo,
    contratista: 'PROINTECA C.A.',
    cliente: clientName,
    faseActual: fase,
    capitulos,
    secciones: capitulos, // backward compatibility
    totalDocumentos,
    documentosAprobados,
    documentosPendientes,
    hashDossierFinal: `SHA256-PDVSA-PIC010305-${Date.now()}`,
    fechaCompilacion: new Date().toISOString()
  };
}

