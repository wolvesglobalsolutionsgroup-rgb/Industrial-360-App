export type FasePDVSA = 'V' | 'C' | 'D' | 'I' | 'O';

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
  categoria: 'General' | 'Ingeniería' | 'QA/QC' | 'SIHO-A PTW' | 'ILI Pigging' | 'Valuaciones ROE' | 'Reportes Campo' | 'Completación';
  fase: FasePDVSA;
  disciplina: string; // 'G', 'M', 'E', 'C', 'I', 'Q', 'S', etc.
  revisionActual: string;
  revisiones: Revision[];
  firmas: Firma[];
  statusDoc: 'Borrador' | 'En Revisión' | 'Aprobado' | 'Rechazado' | 'Firmado Final';
  origenModulo: 'SIHO' | 'QAQC' | 'ILI' | 'ENGINEERING' | 'VALUATIONS' | 'FIELD_REPORTS' | 'MANUAL';
  origenRefId?: string;
  urlPdf?: string;
  hashIntegridad?: string;
  fechaGeneracion: string;
  paginasCount?: number;
}

export interface SeccionDossier {
  id: string;
  tituloSeccion: string;
  fase: FasePDVSA;
  codigoSeccion: string;
  documentos: DocumentoDossier[];
}

export interface DossierState {
  idProject: string;
  orgId: string;
  tituloProyecto: string;
  contratoNo: string;
  contratista: string;
  cliente: string;
  faseActual: FasePDVSA;
  secciones: SeccionDossier[];
  totalDocumentos: number;
  documentosAprobados: number;
  documentosPendientes: number;
  hashDossierFinal?: string;
  fechaCompilacion?: string;
}

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
