export interface PDVSACodeParams {
  filial: string;         // 'WGS' | 'PDVSA' | 'PAMS' | 'PROIN'
  negocio: string;        // 'EP' (Exploración y Prod), 'RN' (Refinación), 'GA' (Gas)
  proyecto: string;       // 'JUS' (Jusepín), 'BCN' (Barinas), 'LUN' (Lago Unare)
  fase: string;           // 'V', 'C', 'D', 'I', 'O'
  disciplina: string;     // 'G', 'P', 'M', 'E', 'C', 'I', 'S', 'Q', 'H', 'T'
  tipoDoc: string;        // 'MEM', 'ESP', 'ISO', 'DET', 'PLA', 'INF', 'PTD'
  correlativo: number;    // 1 to 9999
  revision: string;       // 'A', 'B', '0', '1'
}

export const PDVSA_FASES = [
  { value: 'V', label: 'V — Visualización (Fase FEL-1)' },
  { value: 'C', label: 'C — Conceptualización (Fase FEL-2)' },
  { value: 'D', label: 'D — Definición / Ingeniería de Detalle (FEL-3)' },
  { value: 'I', label: 'I — Implantación / Construcción' },
  { value: 'O', label: 'O — Operación / Mantenimiento' }
];

export const PDVSA_DISCIPLINAS = [
  { value: 'G', label: 'G — Gerencia / General' },
  { value: 'P', label: 'P — Procesos / Operaciones' },
  { value: 'M', label: 'M — Mecánica / Tuberías' },
  { value: 'E', label: 'E — Electricidad' },
  { value: 'C', label: 'C — Civil / Estructuras' },
  { value: 'I', label: 'I — Instrumentación y Control' },
  { value: 'S', label: 'S — Seguridad, Higiene y Ambiente (SHA/SIAHO)' },
  { value: 'Q', label: 'Q — Química / Corrosión' },
  { value: 'H', label: 'H — Geología / Geotecnia' },
  { value: 'T', label: 'T — Telecomunicaciones' }
];

export const PDVSA_TIPOS_DOC = [
  { value: 'MEM', label: 'MEM — Memoria de Cálculo' },
  { value: 'ESP', label: 'ESP — Especificación Técnica' },
  { value: 'ISO', label: 'ISO — Plano Isométrico' },
  { value: 'DET', label: 'DET — Detalles Constructivos' },
  { value: 'PLA', label: 'PLA — Plano General / Layout' },
  { value: 'INF', label: 'INF — Informe Técnico / Evaluación' },
  { value: 'CRN', label: 'CRN — Cronograma de Ejecución' },
  { value: 'PTD', label: 'PTD — Procedimiento de Trabajo Seguro' }
];

export const PDVSA_NEGOCIOS = [
  { value: 'EP', label: 'EP — Exploración y Producción' },
  { value: 'RN', label: 'RN — Refinación y Petroquímica' },
  { value: 'GA', label: 'GA — Gas y Líquidos' },
  { value: 'CO', label: 'CO — Comercialización y Suministro' }
];

export function formatPDVSACode(params: PDVSACodeParams): string {
  const padCorr = String(params.correlativo || 1).padStart(4, '0');
  // Format according to PDVSA PIC-01-03-05:
  // e.g. WGS-EP-JUS-D-M-MEM-0001-Rev0
  return `${params.filial}-${params.negocio}-${params.proyecto}-${params.fase}${params.disciplina}-${params.tipoDoc}-${padCorr}-REV${params.revision}`;
}

export function parsePDVSACode(code: string): Partial<PDVSACodeParams> | null {
  try {
    const parts = code.split('-');
    if (parts.length < 6) return null;

    const filial = parts[0];
    const negocio = parts[1];
    const proyecto = parts[2];
    const faseDisc = parts[3]; // e.g. 'DM'
    const fase = faseDisc.charAt(0);
    const disciplina = faseDisc.charAt(1) || 'G';
    const tipoDoc = parts[4];
    const correlativo = parseInt(parts[5], 10);
    const revStr = parts[6] ? parts[6].replace('REV', '') : '0';

    return {
      filial,
      negocio,
      proyecto,
      fase,
      disciplina,
      tipoDoc,
      correlativo,
      revision: revStr
    };
  } catch (err) {
    return null;
  }
}
