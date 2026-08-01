export type FasePDVSA = 'V' | 'C' | 'D' | 'I' | 'O';

export type CategoriaDossierPDVSA = 
  | 'General' 
  | 'Ingeniería' 
  | 'PCC / Matriz HWR'
  | 'Trazabilidad Materiales MTR'
  | 'QA/QC' 
  | 'SIHO-A PTW' 
  | 'Calificación WPQ/WPS'
  | 'Prueba Hidrostática'
  | 'ILI Pigging' 
  | 'Certificados Calibración'
  | 'Planos As-Built'
  | 'Valuaciones ROE' 
  | 'Reportes Campo' 
  | 'Completación';

export interface Firma {
  cargo: 'Elaboró' | 'Revisó' | 'Aprobó' | 'Aprobó Cliente' | 'Inspector QA/QC';
  nombre: string;
  cedulaOrFirmaId: string;
  fecha: string;
  status: 'Pendiente' | 'Firmado' | 'Rechazado';
  hashQr?: string;
}

export interface Revision {
  rev: string; // e.g. 'A', 'B', '0', '1'
  fecha: string;
  descripcion: string;
  por: string;
  revisadoPor: string;
  aprobadoPor: string;
}

export interface DocumentoDossier {
  id: string;
  codigoPDVSA: string; // e.g. "A1C0012601-GD0I3-GD01001"
  titulo: string;
  categoria: CategoriaDossierPDVSA;
  capituloNumero?: number; // 1 to 6
  fase: FasePDVSA;
  disciplina: string; // 'G', 'M', 'E', 'C', 'I', 'Q', 'S', etc.
  revisionActual: string;
  revisiones: Revision[];
  firmas: Firma[];
  statusDoc: 'Borrador' | 'En Revisión' | 'Aprobado' | 'Rechazado' | 'Firmado Final';
  origenModulo: 'SIHO' | 'QAQC' | 'ILI' | 'ENGINEERING' | 'VALUATIONS' | 'FIELD_REPORTS' | 'MATERIALS' | 'CALIBRATION' | 'AS_BUILT' | 'MANUAL';
  origenRefId?: string;
  urlPdf?: string;
  hashIntegridad?: string;
  fechaGeneracion: string;
  paginasCount?: number;
}

export interface CapituloDossier {
  id: string;
  numero: number; // 1..6
  tituloCapitulo: string;
  normaReferencia: string;
  codigoSeccion: string;
  descripcion: string;
  documentos: DocumentoDossier[];
}

// Backward compatibility alias
export type SeccionDossier = CapituloDossier;

export interface DossierState {
  idProject: string;
  orgId: string;
  tituloProyecto: string;
  contratoNo: string;
  contratista: string;
  cliente: string;
  faseActual: FasePDVSA;
  capitulos: CapituloDossier[];
  secciones?: CapituloDossier[]; // alias for compatibility
  totalDocumentos: number;
  documentosAprobados: number;
  documentosPendientes: number;
  hashDossierFinal?: string;
  fechaCompilacion?: string;
}

export const CAPITULOS_PDVSA_PIC_01_03_05 = [
  {
    numero: 1,
    id: 'CAP-01',
    tituloCapitulo: 'Capítulo 1: Datos Generales, Portada Oficial y Memoria Descriptiva',
    normaReferencia: 'PDVSA PIC-01-03-05 §1',
    codigoSeccion: 'CAP-01-GEN',
    descripcion: 'Portada oficial Anexo A, datos contractuales, alcance de obra, organigrama y memoria descriptiva.'
  },
  {
    numero: 2,
    id: 'CAP-02',
    tituloCapitulo: 'Capítulo 2: Plan de Control de Calidad (PCC) y Matriz de Puntos Hold/Witness (H/W/R)',
    normaReferencia: 'PDVSA PIC-01-03-05 §2',
    descripcion: 'Plan de Inspección y Ensayo (PIE/PCC), matriz de puntos de inspección Hold, Witness y Review (H/W/R).'
  },
  {
    numero: 3,
    id: 'CAP-03',
    tituloCapitulo: 'Capítulo 3: Trazabilidad de Materiales y Libro de MTR (Heat Numbers)',
    normaReferencia: 'PDVSA PIC-01-03-05 §3 / ASTM / API 5L',
    descripcion: 'Certificados de colada (Mill Test Reports), números de colada (Heat Numbers), trazabilidad de tuberías y accesorios.'
  },
  {
    numero: 4,
    id: 'CAP-04',
    tituloCapitulo: 'Capítulo 4: Registros de Construcción, PTW, Calificación WPQ/WPS, Reportes NDT (API 1104 §9) y Prueba Hidrostática (PI-02-08-01)',
    normaReferencia: 'PDVSA PIC-01-03-05 §4 / API 1104 / PDVSA PI-02-08-01',
    descripcion: 'Permisos de trabajo SIHO-A, WPS/PQR/WPQ soldadura, reportes NDT (VT, UT, RT, PT) y gráfica/acta de prueba hidrostática.'
  },
  {
    numero: 5,
    id: 'CAP-05',
    tituloCapitulo: 'Capítulo 5: Certificados de Calibración de Equipos (Gasotester 6 gases, Manómetros, Barton)',
    normaReferencia: 'PDVSA PIC-01-03-05 §5',
    descripcion: 'Certificados vigentes de trazabilidad metrológica para detectores de gas, manómetros patrón y registradores Barton.'
  },
  {
    numero: 6,
    id: 'CAP-06',
    tituloCapitulo: 'Capítulo 6: Planos As-Built (L-STC-001) y Acta de Recepción Definitiva',
    normaReferencia: 'PDVSA PIC-01-03-05 §6 / PDVSA L-STC-001',
    descripcion: 'Isométricos As-Built, P&IDs rojos/verdes, completación mecánica y Acta de Recepción Definitiva de Obra.'
  }
];

export const FASES_PDVSA_DESCRIPCION: Record<FasePDVSA, { nombre: string; descripcion: string; docsClave: string[] }> = {
  V: {
    nombre: 'V — Visualizar',
    descripcion: 'Evaluación de oportunidades de negocio e identificación preliminar de alternativas técnicas.',
    docsClave: ['DSD1 (Documento Soporte de Decisión 1)', 'Estimado de Costos Clase V', 'Plan de Ejecución del Proyecto (PEP)']
  },
  C: {
    nombre: 'C — Conceptualizar',
    descripcion: 'Selección de la opción técnica y económicamente óptima.',
    docsClave: ['DSD2 (Documento Soporte de Decisión 2)', 'Diagrama de Flujo de Proceso (DFP)', 'Estudio de Impacto Ambiental']
  },
  D: {
    nombre: 'D — Definir',
    descripcion: 'Ingeniería básica de detalle y definición completa del alcance contractual.',
    docsClave: ['DSD3', 'P&IDs (Diagramas de Tuberías e Instrumentación)', 'Hojas de Datos de Equipos', 'Cómputos Métricos']
  },
  I: {
    nombre: 'I — Implantar',
    descripcion: 'Ejecución de procura, construcción, inspección QA/QC, permisos SIHO-A y valuaciones.',
    docsClave: ['Procedimientos Trabajo Seguro (PTS)', 'Informes NDT / Radiografías Juntas', 'Valuaciones ROE', 'Reportes de Campo']
  },
  O: {
    nombre: 'O — Operar',
    descripcion: 'Completación mecánica, pruebas de arranque, entrega formal de dossier y acta de recepción.',
    docsClave: ['Acta de Completación Mecánica', 'Plano As-Built Final', 'Dossier de Calidad y Libro Final']
  }
};

