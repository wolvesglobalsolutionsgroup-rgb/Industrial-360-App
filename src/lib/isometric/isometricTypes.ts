export type JointNdtStatus = 'Aprobado' | 'Rechazado' | 'Pendiente' | 'SinSoldar';

export interface IsometricJointNode {
  id: string;
  tag: string;             // e.g. J-01
  x: number;               // SVG X coordinate in px
  y: number;               // SVG Y coordinate in px
  spoolTag: string;        // e.g. SPL-01
  type: 'BUTT' | 'FILLET' | 'SOCKET' | 'BRANCH';
  pipeSize: string;        // e.g. 12"
  wallThicknessMm: number; // e.g. 12.7 mm
  material: string;        // e.g. API 5L X52 PSL2
  heatNumber: string;      // Colada MTR e.g. MTR-API-99482-B
  wpsCode: string;         // WPS-PDVSA-01
  welderStamp: string;     // W-402
  welderName: string;      // Téc. José Pérez
  weldDate: string;        // 2026-07-20
  fitupStatus: 'Aprobado' | 'Pendiente' | 'Rechazado';
  vtStatus: 'Aprobado' | 'Pendiente' | 'Rechazado';
  ndtMethod: 'RT' | 'UT/PAUT' | 'PT' | 'MT' | 'VT';
  ndtStatus: JointNdtStatus;
  defectType?: string;
  defectSizeMm?: number;
  ndtReportNo?: string;    // REP-RT-2026-089
  inspectorName?: string;  // Ing. Marcos Silva (ASNT Level II)
  dicondeSampleId?: string;
}

export interface IsometricSpool {
  id: string;
  tag: string;             // SPL-01
  description: string;     // Carrete 12" x 4.8m con Brida WN 150#
  weightKg: number;
  joints: string[];        // Array of joint tags e.g. ['J-01', 'J-02']
}

export interface BomItem {
  itemNo: number;
  qty: number;
  description: string;
  nominalSize: string;
  materialSpec: string;
  heatNumber: string;
}

export interface IsometricPathGeometry {
  d: string;
  strokeWidth?: number;
  stroke?: string;
  type?: 'pipe' | 'elbow' | 'flange' | 'valve' | 'fitting' | 'support';
  label?: string;
}

export interface IsometricDimensionPath {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label: string;
  offsetY?: number;
  offsetX?: number;
}

export interface IsometricDrawing {
  id: string;
  number: string;          // e.g. ISO-PDVSA-104
  title: string;           // e.g. Línea de Transferencia de Crudo 12"-HC
  lineTag: string;         // e.g. 12"-HC-AN-PLC-001
  projectCode: string;
  revision: string;        // e.g. Rev. 0
  date: string;
  fluidSystem: string;     // e.g. Hydrocarbon Crudo Pesado 16° API
  designPressurePsi: number; // e.g. 740 PSI
  designTempC: number;     // e.g. 65°C
  spools: IsometricSpool[];
  joints: IsometricJointNode[];
  bom: BomItem[];
  svgPaths: {
    geometry: IsometricPathGeometry[];
    dimensions: IsometricDimensionPath[];
  };
}

export interface IsometricLiberationRecord {
  id?: string;
  isometricNumber: string;
  lineTag: string;
  lineDescription: string;
  totalJoints: number;
  approvedJoints: number;
  liberatedAt: string;
  liberatedBy: string;
  hashSha256: string;
  projectId: string;
  orgId: string;
  status: 'Liberado As-Built';
}
