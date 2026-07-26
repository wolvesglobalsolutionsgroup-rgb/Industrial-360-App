import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Database, AlertTriangle, ShieldCheck, FileSpreadsheet, Activity, 
  MapPin, Clock, Search, Download, Plus, CheckCircle2, ChevronRight, 
  Layers, Settings, Calculator, FileText, ArrowRight, Compass, Wrench,
  Upload, FileCog, BarChart3, GitBranch, Hammer, Eye, EyeOff,
  X, Save, Printer, Sheet, Table2, Map as MapIcon, RefreshCw
} from 'lucide-react';
import { useProject } from '../ProjectContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { 
  collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc,
  serverTimestamp, onSnapshot, orderBy, Timestamp, setDoc 
} from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';

// ─── INTERFACES ────────────────────────────────────────────────────────────
// Interfaces para el módulo de Integridad de Ductos - ILI ROSEN ROSOFT Level

/** Tipo de reparación estructural según normativa ASME PCC-2 / API 1104 */
export type RemediationType = 'Sleeve' | 'Composite' | 'Replace' | 'Monitor' | 'Grind';

/** Estado de ciclo de vida de una anomalía detectada por ILI */
export type AnomalyStatus = 'Inconclusa' | 'Atención Prioritaria' | 'Dig Sheet Generado' | 'Reparado';

/** Tipos de anomalías estándar ROSEN POF (Pipeline Operator File) */
export type AnomalyType = 'Metal Loss' | 'Dent' | 'Gouge' | 'Crack' | 'Manufacturing Defect';

/** Estado del workflow de reparación */
export type RepairStatus = 'Planificada' | 'Ejecutada' | 'Verificada' | 'Cerrada';

/** Registro de reparación asociado a una anomalía */
export interface RepairRecord {
  id: string;
  type: RemediationType;
  date: string; // ISO date string
  responsible: string;
  inspector: string;
  status: RepairStatus;
  notes: string;
  createdAt?: Timestamp;
}

/** Interfaz principal de anomalía ILI con campos ROSEN y cálculos B31G/RSTRENG */
export interface Anomaly {
  id: string;
  kp: number; // Kilometraje/Chainage in km
  clockPosition: string; // e.g., "04:30"
  depthPercent: number; // % Wall Thickness loss
  lengthMm: number; // Anomaly length in mm
  widthMm: number; // Anomaly width in mm
  type: AnomalyType;
  internalExternal: 'Internal' | 'External';
  nominalWT: number; // Nominal wall thickness in mm
  pipeDiameter: number; // Outer diameter in inches
  smys: number; // SMYS in psi (e.g., 52000 for X52)
  maop: number; // MAOP in psi
  status: AnomalyStatus;
  // Campos ROSEN avanzados
  pSafe: number; // Presión segura calculada Folias (psi)
  pSafeRSTRENG: number; // Presión segura calculada RSTRENG (psi)
  erf: number; // Estimated Repair Factor = MAOP / P_safe
  remediationType: RemediationType;
  // Reparaciones asociadas (sub-colección)
  repairs: RepairRecord[];
}

/** Parámetros para análisis RBI (API 581) */
interface RBIParams {
  diameter: number;
  wallThickness: number;
  fluid: string;
  pressure: number;
  temperature: number;
  fluidType: 'Gas' | 'Oil' | 'Water' | 'Chemical';
}

/** Resultado del análisis de riesgo RBI */
interface RBIResult {
  probabilityCategory: number; // 1-5
  consequenceCategory: number; // 1-5
  riskLevel: 'Low' | 'Medium' | 'Medium-High' | 'High';
  inspectionFreqYears: number;
  riskMatrix: number[][]; // 5×5
}

/** Resultado combinado B31G */
interface B31GCombinedResult {
  dMm: string;
  z: number;
  mFolias: number;
  pDesign: number;
  pSafeFolias: number;
  pSafeRSTRENG: number;
  safeRatioFolias: number;
  safeRatioRSTRENG: number;
  isSafe: boolean;
  erf: number;
  remediationRequired: boolean;
}

/** Datos para generar Dig Sheet en PDF */
interface DigSheetData {
  anomalyId: string;
  kp: number;
  depthPercent: number;
  lengthMm: number;
  widthMm: number;
  clockPosition: string;
  type: string;
  internalExternal: string;
  nominalWT: number;
  pipeDiameter: number;
  pSafe: number;
  remediationType: RemediationType;
  status: AnomalyStatus;
}

// ─── CONSTANTES ────────────────────────────────────────────────────────────
const DEFAULT_SMYS = 52000;   // API 5L X52 en psi
const DEFAULT_MAOP = 1100;    // psi
const DEFAULT_NOMINAL_WT = 12.7; // mm
const DEFAULT_DIAMETER = 16;  // pulgadas
const DEFAULT_DF = 0.72;      // Factor de diseño Clase 1 (ASME B31.4)

// Umbral ERF para reparación urgente según API 1163
const ERF_URGENT_THRESHOLD = 1.1;

// Umbral gravedad para mapa de anomalías
const DEPTH_WARNING = 30;  // %
const DEPTH_CRITICAL = 50; // %

// ─── FUNCIONES DE CÁLCULO (fuera del componente para testabilidad) ─────────

/**
 * Calcula la presión segura mediante método Folias estándar (ASME B31G-2012)
 * Basado en la fórmula de Folias para factores de amplificación de tensión.
 * 
 * @param diameterInches Diámetro exterior en pulgadas
 * @param wtMm Espesor nominal en mm
 * @param depthPct Profundidad de pérdida en % del espesor
 * @param lengthMm Longitud axial de la anomalía en mm
 * @param maopPsi MAOP actual en psi
 * @param smysPsi SMYS del material en psi (ej: 52000 para X52)
 * @param df Factor de diseño (típicamente 0.72)
 */
export function calculateFolias(
  diameterInches: number,
  wtMm: number,
  depthPct: number,
  lengthMm: number,
  maopPsi: number,
  smysPsi: number,
  df: number
): { pDesign: number; pSafe: number; M: number; z: number; dMm: string } {
  const dMm = (depthPct / 100) * wtMm;
  const dOverT = depthPct / 100;
  const D_mm = diameterInches * 25.4;

  // Parámetro de Folias (Z = L² / D·t)
  const z = (lengthMm * lengthMm) / (D_mm * wtMm);
  let M = 1;
  if (z <= 50) {
    M = Math.sqrt(1 + 0.6275 * z - 0.003375 * z * z);
  } else {
    M = 0.032 * z + 3.3;
  }

  // Presión de diseño: P_design = (2 · SMYS · t / D) · DF
  const pDesign = ((2 * smysPsi * (wtMm / 25.4)) / diameterInches) * df;

  // Presión segura con anomalía (ASME B31G Modificado)
  let pSafe = pDesign;
  if (dOverT > 0.1) {
    const num = 1 - (2 / 3) * (dMm / wtMm);
    const den = 1 - (2 / 3) * (dMm / wtMm) * (1 / M);
    pSafe = pDesign * (num / den);
  }

  return { pDesign: Math.round(pDesign), pSafe: Math.round(pSafe), M, z, dMm: dMm.toFixed(2) };
}

/**
 * Calcula la presión segura mediante método RSTRENG (Modified B31G)
 * RSTRENG usa el área efectiva 0.85·d·L en lugar de (2/3)·d·L
 * Generalmente más preciso y menos conservador que Folias estándar.
 * 
 * Referencia: Kiefner & Vieth, "RSTRENG2" (PRCI Catalog No. L51749)
 */
export function calculateRSTRENG(
  diameterInches: number,
  wtMm: number,
  depthPct: number,
  lengthMm: number,
  maopPsi: number,
  smysPsi: number,
  df: number
): { pSafe: number; M: number; z: number } {
  const dMm = (depthPct / 100) * wtMm;
  const dOverT = depthPct / 100;
  const D_mm = diameterInches * 25.4;

  // Parámetro de Folias (Z)
  const z = (lengthMm * lengthMm) / (D_mm * wtMm);
  let M = 1;
  if (z <= 50) {
    M = Math.sqrt(1 + 0.6275 * z - 0.003375 * z * z);
  } else {
    M = 0.032 * z + 3.3;
  }

  // Presión de diseño
  const pDesign = ((2 * smysPsi * (wtMm / 25.4)) / diameterInches) * df;

  // RSTRENG: usa 0.85·d·L en lugar de (2/3)·d·L
  // Esto representa mejor el área de pérdida real
  let pSafe = pDesign;
  if (dOverT > 0.1) {
    const num = 1 - 0.85 * (dMm / wtMm);
    const den = 1 - 0.85 * (dMm / wtMm) * (1 / M);
    pSafe = pDesign * (num / den);
  }

  return { pSafe: Math.round(pSafe), M, z };
}

/**
 * Calcula el ERF (Estimated Repair Factor) = MAOP / P_safe
 * Según API 1163, ERF > 1.1 indica necesidad de reparación urgente.
 */
export function calculateERF(maopPsi: number, pSafe: number): number {
  if (pSafe <= 0) return 99;
  return parseFloat((maopPsi / pSafe).toFixed(3));
}

/**
 * Determina el tipo de remediación según criterios de ingeniería
 */
export function determineRemediation(
  depthPct: number,
  safeRatio: number,
  erf: number
): RemediationType {
  if (depthPct >= 80 || safeRatio < 0.8 || erf > 1.5) return 'Replace';
  if (depthPct >= 60 || erf > 1.1) return 'Sleeve';
  if (depthPct >= 40 || erf > 1.0) return 'Composite';
  if (depthPct >= 20) return 'Monitor';
  return 'Monitor';
}

/**
 * Calcula B31G combinado (Folias + RSTRENG + ERF)
 */
export function calculateB31GCombined(
  diameterInches: number,
  wtMm: number,
  depthPct: number,
  lengthMm: number,
  maopPsi: number,
  smysPsi: number,
  df: number
): B31GCombinedResult {
  const folias = calculateFolias(diameterInches, wtMm, depthPct, lengthMm, maopPsi, smysPsi, df);
  const rstreng = calculateRSTRENG(diameterInches, wtMm, depthPct, lengthMm, maopPsi, smysPsi, df);

  // Usamos el P_safe más conservador (Folias) para ERF
  const erf = calculateERF(maopPsi, folias.pSafe);
  const safeRatioFolias = parseFloat((folias.pSafe / maopPsi).toFixed(3));
  const safeRatioRSTRENG = parseFloat((rstreng.pSafe / maopPsi).toFixed(3));
  const remediationRequired = depthPct >= 80 || safeRatioFolias < 1.0;

  return {
    dMm: folias.dMm,
    z: parseFloat(folias.z.toFixed(2)),
    mFolias: parseFloat(folias.M.toFixed(4)),
    pDesign: folias.pDesign,
    pSafeFolias: folias.pSafe,
    pSafeRSTRENG: rstreng.pSafe,
    safeRatioFolias,
    safeRatioRSTRENG,
    isSafe: safeRatioFolias >= 1.0,
    erf,
    remediationRequired
  };
}

/**
 * Clasifica nivel de probabilidad RBI basado en velocidad de corrosión y espesor
 */
function calculateProbabilityCategory(diameter: number, wallThickness: number): number {
  // Relación diámetro/espesor como proxy de severidad
  const dOverT = diameter * 25.4 / wallThickness;
  if (dOverT > 80) return 5;
  if (dOverT > 60) return 4;
  if (dOverT > 40) return 3;
  if (dOverT > 20) return 2;
  return 1;
}

/**
 * Clasifica nivel de consecuencia RBI basado en fluido, presión y temperatura
 */
function calculateConsequenceCategory(fluid: string, pressure: number, temperature: number): number {
  let severity = 1;
  const upperFluid = fluid.toLowerCase();
  
  // Factor fluido
  if (upperFluid.includes('gas') || upperFluid.includes('natural') || upperFluid.includes('hidrocarburo')) severity += 2;
  else if (upperFluid.includes('oil') || upperFluid.includes('crude') || upperFluid.includes('petróleo') || upperFluid.includes('crudo')) severity += 2;
  else if (upperFluid.includes('chemical') || upperFluid.includes('ácido') || upperFluid.includes('químico')) severity += 2;
  else if (upperFluid.includes('water') || upperFluid.includes('agua')) severity += 0;
  else severity += 1;

  // Factor presión (psi)
  if (pressure > 1000) severity += 2;
  else if (pressure > 500) severity += 1;

  // Factor temperatura (°C)
  if (temperature > 250) severity += 2;
  else if (temperature > 100) severity += 1;

  // Normalizar a 1-5
  return Math.max(1, Math.min(5, severity));
}

/**
 * Calcula el nivel de riesgo RBI (API 581)
 */
function calculateRBI(params: RBIParams): RBIResult {
  const probCat = calculateProbabilityCategory(params.diameter, params.wallThickness);
  const consCat = calculateConsequenceCategory(params.fluid, params.pressure, params.temperature);

  // Matriz 5×5 de riesgo
  const riskMatrix: number[][] = [
    [1, 2, 3, 4, 5],
    [2, 4, 6, 8, 10],
    [3, 6, 9, 12, 15],
    [4, 8, 12, 16, 20],
    [5, 10, 15, 20, 25]
  ];

  const riskScore = riskMatrix[probCat - 1][consCat - 1];

  let riskLevel: RBIResult['riskLevel'];
  let inspectionFreqYears: number;

  if (riskScore >= 15) {
    riskLevel = 'High';
    inspectionFreqYears = 2;
  } else if (riskScore >= 10) {
    riskLevel = 'Medium-High';
    inspectionFreqYears = 3;
  } else if (riskScore >= 5) {
    riskLevel = 'Medium';
    inspectionFreqYears = 5;
  } else {
    riskLevel = 'Low';
    inspectionFreqYears = 10;
  }

  return {
    probabilityCategory: probCat,
    consequenceCategory: consCat,
    riskLevel,
    inspectionFreqYears,
    riskMatrix
  };
}

/**
 * Parseador de archivos POF (Pipeline Operator File) de ROSEN/NIMA
 * Detecta automáticamente columnas y formato.
 */
function parsePOFFile(content: string, fileName: string): Anomaly[] {
  const lines = content.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];

  const headerLine = lines[0];
  const separators = headerLine.includes('\t') ? '\t' : ',';
  const headers = headerLine.split(separators).map(h => h.trim().toLowerCase());

  // Mapa de columnas ROSEN POF típicas
  const colMap: Record<string, string> = {};
  const headerAliases: Record<string, string[]> = {
    distance: ['distance', 'distance[km]', 'kp', 'kp[km]', 'kilometraje', 'chainage', 'odometer', 'meter'],
    clock: ['clock position', 'clockposition', 'orientation', 'orientación', 'posicion', 'posición', 'clock', 'hour'],
    depth: ['depth', 'depth%', 'depth[%]', '%wall', '%wt', 'wall loss', 'profundidad', 'profundidad%', 'depth_percent'],
    length: ['length', 'length[mm]', 'longitud', 'l[mm]', 'axial length', 'axial'],
    width: ['width', 'width[mm]', 'ancho', 'w[mm]', 'circumferential', 'circumferential length'],
    type: ['type', 'feature', 'feature type', 'defect type', 'tipo', 'anomaly type', 'class', 'classification'],
    ioe: ['internal/external', 'internalexternal', 'ioe', 'orientation ioe', 'side', 'internal_external', 'surface']
  };

  // Detectar columnas
  for (const h of headers) {
    let matched = false;
    for (const [key, aliases] of Object.entries(headerAliases)) {
      if (aliases.some(a => h.includes(a))) {
        colMap[key] = headers.indexOf(h) === -1 ? '' : h;
        matched = true;
        break;
      }
    }
    if (!matched) {
      // Asignación posicional si no hay match
      const idx = headers.indexOf(h);
      const positionalKeys = ['distance', 'clock', 'depth', 'length', 'width', 'type'];
      if (idx < positionalKeys.length && !colMap[positionalKeys[idx]]) {
        colMap[positionalKeys[idx]] = h;
      }
    }
  }

  const anomalies: Anomaly[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(separators).map(c => c.trim());
    if (cols.length < 3) continue;

    const getVal = (key: string): string => {
      const colName = colMap[key];
      if (colName === undefined || colName === '') return '';
      const idx = headers.indexOf(colName);
      return idx >= 0 && idx < cols.length ? cols[idx] : '';
    };

    const distance = parseFloat(getVal('distance').replace(',', '.'));
    const clockRaw = getVal('clock');
    const depthRaw = parseFloat(getVal('depth').replace('%', '').replace(',', '.'));
    const lengthRaw = parseFloat(getVal('length').replace(',', '.'));
    const widthRaw = parseFloat(getVal('width').replace(',', '.'));
    const typeRaw = getVal('type');
    const ioeRaw = getVal('ioe');

    if (isNaN(distance) || isNaN(depthRaw)) continue;

    const detectedType: AnomalyType = 
      typeRaw.toLowerCase().includes('dent') ? 'Dent' :
      typeRaw.toLowerCase().includes('gouge') || typeRaw.toLowerCase().includes('scratch') ? 'Gouge' :
      typeRaw.toLowerCase().includes('crack') ? 'Crack' :
      typeRaw.toLowerCase().includes('manufacturing') || typeRaw.toLowerCase().includes('mill') ? 'Manufacturing Defect' :
      'Metal Loss';

    // Formatear clock position
    let clockFormatted = '12:00';
    if (clockRaw) {
      const clockNum = parseFloat(clockRaw.replace(':', '.').replace(',', '.'));
      if (!isNaN(clockNum) && clockNum >= 0 && clockNum <= 12) {
        const hours = Math.floor(clockNum);
        const mins = Math.round((clockNum - hours) * 60);
        clockFormatted = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
      } else {
        clockFormatted = clockRaw.includes(':') ? clockRaw : `${clockRaw}:00`;
      }
    }

    const calcResult = calculateB31GCombined(
      DEFAULT_DIAMETER, DEFAULT_NOMINAL_WT, depthRaw,
      lengthRaw || 50, DEFAULT_MAOP, DEFAULT_SMYS, DEFAULT_DF
    );

    anomalies.push({
      id: `ANO-ROS-${String(anomalies.length + 1).padStart(3, '0')}`,
      kp: distance,
      clockPosition: clockFormatted,
      depthPercent: depthRaw,
      lengthMm: lengthRaw || 50,
      widthMm: widthRaw || 30,
      type: detectedType,
      internalExternal: ioeRaw.toLowerCase().includes('internal') || ioeRaw.toLowerCase().includes('int') ? 'Internal' : 'External',
      nominalWT: DEFAULT_NOMINAL_WT,
      pipeDiameter: DEFAULT_DIAMETER,
      smys: DEFAULT_SMYS,
      maop: DEFAULT_MAOP,
      status: depthRaw >= 40 ? 'Atención Prioritaria' : 'Inconclusa',
      pSafe: calcResult.pSafeFolias,
      pSafeRSTRENG: calcResult.pSafeRSTRENG,
      erf: calcResult.erf,
      remediationType: calculateRemediation(depthRaw, calcResult.safeRatioFolias, calcResult.erf),
      repairs: []
    });
  }

  return anomalies;
}

function calculateRemediation(depthPct: number, safeRatio: number, erf: number): RemediationType {
  if (depthPct >= 80 || safeRatio < 0.8 || erf > 1.5) return 'Replace';
  if (depthPct >= 60 || erf > 1.1) return 'Sleeve';
  if (depthPct >= 40 || erf > 1.0) return 'Composite';
  return 'Monitor';
}

// ─── DEFAULT DATA (FALLBACK) ──────────────────────────────────────────────

const defaultAnomalies: Anomaly[] = [
  {
    id: 'ANO-ROS-001', kp: 4.235, clockPosition: '04:30', depthPercent: 48,
    lengthMm: 145, widthMm: 65, type: 'Metal Loss', internalExternal: 'External',
    nominalWT: 12.7, pipeDiameter: 16, smys: 52000, maop: 1100,
    status: 'Atención Prioritaria',
    pSafe: 980, pSafeRSTRENG: 1020, erf: 1.12, remediationType: 'Composite', repairs: []
  },
  {
    id: 'ANO-ROS-002', kp: 12.890, clockPosition: '01:15', depthPercent: 22,
    lengthMm: 80, widthMm: 40, type: 'Metal Loss', internalExternal: 'Internal',
    nominalWT: 12.7, pipeDiameter: 16, smys: 52000, maop: 1100,
    status: 'Inconclusa',
    pSafe: 1120, pSafeRSTRENG: 1160, erf: 0.98, remediationType: 'Monitor', repairs: []
  },
  {
    id: 'ANO-ROS-003', kp: 28.650, clockPosition: '06:00', depthPercent: 62,
    lengthMm: 210, widthMm: 90, type: 'Metal Loss', internalExternal: 'External',
    nominalWT: 12.7, pipeDiameter: 16, smys: 52000, maop: 1100,
    status: 'Dig Sheet Generado',
    pSafe: 780, pSafeRSTRENG: 840, erf: 1.41, remediationType: 'Sleeve', repairs: []
  },
  {
    id: 'ANO-ROS-004', kp: 34.110, clockPosition: '11:45', depthPercent: 15,
    lengthMm: 45, widthMm: 30, type: 'Manufacturing Defect', internalExternal: 'Internal',
    nominalWT: 12.7, pipeDiameter: 16, smys: 52000, maop: 1100,
    status: 'Inconclusa',
    pSafe: 1180, pSafeRSTRENG: 1210, erf: 0.93, remediationType: 'Monitor', repairs: []
  }
];

// ─── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────

export default function IntegrityIli() {
  const { currentProject } = useProject();
  const [activeTab, setActiveTab] = useState<'ili' | 'calculator' | 'digsheets' | 'api653' | 'api570' | 'rbi'>('ili');
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  // POF Import state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importPreview, setImportPreview] = useState<Anomaly[] | null>(null);
  const [importFileName, setImportFileName] = useState('');

  // Calculator state
  const [calcDiameter, setCalcDiameter] = useState<number>(12);
  const [calcWT, setCalcWT] = useState<number>(12.7);
  const [calcDepth, setCalcDepth] = useState<number>(35);
  const [calcLength, setCalcLength] = useState<number>(120);
  const [calcMAOP, setCalcMAOP] = useState<number>(1100);
  const [calcSMYS, setCalcSMYS] = useState<number>(52000);
  const [calcFolias, setCalcFolias] = useState<number>(0.72);

  // RB state
  const [rbiParams, setRbiParams] = useState<RBIParams>({
    diameter: 16, wallThickness: 12.7, fluid: 'Crudo', pressure: 800, temperature: 65, fluidType: 'Oil'
  });

  // Dig Sheet state
  const [digSheetAnomaly, setDigSheetAnomaly] = useState<Anomaly | null>(null);

  // Repair state
  const [showRepairForm, setShowRepairForm] = useState(false);
  const [newRepair, setNewRepair] = useState<Partial<RepairRecord>>({
    type: 'Sleeve', date: new Date().toISOString().split('T')[0],
    responsible: '', inspector: '', status: 'Planificada', notes: ''
  });
  const [editingRepairIndex, setEditingRepairIndex] = useState<number | null>(null);

  // Canvas 2D map state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredAnomaly, setHoveredAnomaly] = useState<Anomaly | null>(null);
  const [canvasTooltipPos, setCanvasTooltipPos] = useState({ x: 0, y: 0 });

  // Firestore sync state
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string>('');

  // ─── EFECTOS ─────────────────────────────────────────────────────────

  // Cargar anomalías desde Firestore o usar fallback
  useEffect(() => {
    const loadAnomalies = async () => {
      try {
        // Si es portafolio corporativo o no hay proyecto real, usar fallback
        if (!currentProject || currentProject.id === 'all') {
          setAnomalies(defaultAnomalies);
          setSelectedAnomaly(defaultAnomalies[0]);
          return;
        }

        // Intentar cargar desde Firestore
        const anomaliesRef = collection(db, 'projects', currentProject.id, 'ili_runs', 'run-001', 'anomalies');
        const q = query(anomaliesRef, orderBy('kp', 'asc'));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const loaded: Anomaly[] = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            repairs: doc.data().repairs || []
          })) as Anomaly[];
          setAnomalies(loaded);
          setSelectedAnomaly(loaded[0] || null);
        } else {
          // Fallback a datos por defecto
          setAnomalies(defaultAnomalies);
          setSelectedAnomaly(defaultAnomalies[0]);
        }
      } catch (err) {
        console.warn('Error cargando anomalías desde Firestore, usando fallback:', err);
        setAnomalies(defaultAnomalies);
        setSelectedAnomaly(defaultAnomalies[0]);
      }
    };

    loadAnomalies();
  }, [currentProject]);

  // Dibujar canvas 2D cuando cambien las anomalías
  useEffect(() => {
    if (activeTab === 'ili' && canvasRef.current && anomalies.length > 0) {
      drawPipeMap(canvasRef.current, anomalies, selectedAnomaly);
    }
  }, [anomalies, selectedAnomaly, activeTab]);

  // ─── FUNCIONES DE CÁLCULO B31G (tiempo real) ───────────────────────

  const currentB31G = calculateB31GCombined(
    calcDiameter, calcWT, calcDepth, calcLength, calcMAOP, calcSMYS, calcFolias
  );

  // ─── FILTROS ────────────────────────────────────────────────────────

  const filteredAnomalies = anomalies.filter(a => {
    const matchesSearch = a.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          a.kp.toString().includes(searchTerm);
    if (filterType === 'all') return matchesSearch;
    if (filterType === 'critical') return matchesSearch && a.depthPercent >= 40;
    if (filterType === 'urgent') return matchesSearch && a.erf >= ERF_URGENT_THRESHOLD;
    return matchesSearch;
  });

  // ─── POF IMPORT ────────────────────────────────────────────────────

  /** Maneja la subida de archivo POF (CSV, XLSX, TXT) */
  const handlePOFUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportFileName(file.name);

    try {
      let content = '';
      const ext = file.name.split('.').pop()?.toLowerCase();

      if (ext === 'xlsx' || ext === 'xls') {
        // Leer Excel con librería xlsx
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const csv = XLSX.utils.sheet_to_csv(sheet);
        content = csv;
      } else {
        // CSV o TXT - leer como texto
        content = await file.text();
      }

      const parsed = parsePOFFile(content, file.name);
      if (parsed.length === 0) {
        alert('No se pudieron detectar anomalías en el archivo. Verifique el formato (columnas: Distance, Clock Position, Depth%, Length, Width, Type).');
        setImporting(false);
        return;
      }

      // Mostrar preview
      setImportPreview(parsed);
    } catch (err) {
      console.error('Error parsing POF file:', err);
      alert('Error al procesar el archivo. Asegúrese de que sea un archivo POF válido de ROSEN.');
    }

    setImporting(false);
    // Limpiar input para permitir re-subida
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /** Confirma la importación de anomalías desde preview */
  const confirmImport = async () => {
    if (!importPreview || importPreview.length === 0) return;

    // Agregar a estado local
    setAnomalies(prev => [...importPreview, ...prev]);
    setSelectedAnomaly(importPreview[0]);
    setImportPreview(null);
    setImportFileName('');

    // Intentar guardar en Firestore
    if (currentProject && currentProject.id !== 'all') {
      try {
        setSyncing(true);
        for (const anomaly of importPreview) {
          const { repairs, ...anomalyData } = anomaly;
          await setDoc(doc(db, 'projects', currentProject.id, 'ili_runs', 'run-001', 'anomalies', anomaly.id), {
            ...anomalyData,
            createdAt: serverTimestamp()
          });
        }
        setLastSync(new Date().toLocaleString());
      } catch (err) {
        console.warn('No se pudo guardar en Firestore:', err);
      } finally {
        setSyncing(false);
      }
    }
  };

  /** Cancela la importación preview */
  const cancelImport = () => {
    setImportPreview(null);
    setImportFileName('');
  };

  // ─── CANVAS 2D PIPE MAP ────────────────────────────────────────────

  /** Dibuja el mapa 2D de la tubería con anomalías */
  const drawPipeMap = (canvas: HTMLCanvasElement, items: Anomaly[], selected: Anomaly | null) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const padding = { top: 40, bottom: 40, left: 60, right: 30 };
    const plotW = w - padding.left - padding.right;
    const plotH = h - padding.top - padding.bottom;

    // Limpiar
    ctx.clearRect(0, 0, w, h);

    // Fondo
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    // Calcular rangos
    const minKP = Math.min(...items.map(a => a.kp)) - 0.5;
    const maxKP = Math.max(...items.map(a => a.kp)) + 0.5;
    const kpRange = maxKP - minKP || 1;

    // ─── Ejes ───
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;

    // Eje X (KP)
    ctx.beginPath();
    ctx.moveTo(padding.left, h - padding.bottom);
    ctx.lineTo(w - padding.right, h - padding.bottom);
    ctx.stroke();

    // Eje Y (Carátula de reloj)
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, h - padding.bottom);
    ctx.stroke();

    // ─── Etiquetas del eje X (KP) ───
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    const kpSteps = Math.max(3, Math.floor(kpRange / 2));
    for (let i = 0; i <= kpSteps; i++) {
      const kp = minKP + (i / kpSteps) * kpRange;
      const x = padding.left + (i / kpSteps) * plotW;
      ctx.fillText(`${kp.toFixed(1)}`, x, h - padding.bottom + 18);
      ctx.beginPath();
      ctx.moveTo(x, h - padding.bottom - 4);
      ctx.lineTo(x, h - padding.bottom + 4);
      ctx.strokeStyle = '#475569';
      ctx.stroke();
    }

    // ─── Etiquetas del eje Y (Carátula) ───
    ctx.textAlign = 'right';
    const clockLabels = ['12:00', '01:30', '03:00', '04:30', '06:00', '07:30', '09:00', '10:30'];
    const clockPositions = [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875];
    for (let i = 0; i < clockLabels.length; i++) {
      const y = padding.top + clockPositions[i] * plotH;
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(clockLabels[i], padding.left - 8, y + 3);
      ctx.beginPath();
      ctx.moveTo(padding.left - 4, y);
      ctx.lineTo(padding.left + 4, y);
      ctx.strokeStyle = '#475569';
      ctx.stroke();
    }

    // ─── Título ───
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Kilometraje (KP)', w / 2, h - 4);
    ctx.save();
    ctx.translate(14, h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Carátula de Reloj', 0, 0);
    ctx.restore();

    // ─── Línea de tubería (pipe centerline) ───
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top + plotH / 2);
    ctx.lineTo(w - padding.right, padding.top + plotH / 2);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // ─── Pintar anomalías ───
    for (const anomaly of items) {
      const x = padding.left + ((anomaly.kp - minKP) / kpRange) * plotW;
      
      // Convertir clock position a posición Y
      const clockParts = anomaly.clockPosition.split(':').map(Number);
      const clockDecimal = clockParts[0] + clockParts[1] / 60;
      const y = padding.top + (clockDecimal / 12) * plotH;

      // Tamaño del círculo basado en depth%
      const radius = 6 + (anomaly.depthPercent / 100) * 20;

      // Color según gravedad
      let color: string;
      if (anomaly.depthPercent >= DEPTH_CRITICAL) color = '#ef4444'; // Rojo
      else if (anomaly.depthPercent >= DEPTH_WARNING) color = '#f59e0b'; // Amarillo
      else color = '#22c55e'; // Verde

      const isSelected = selected?.id === anomaly.id;
      const isHovered = hoveredAnomaly?.id === anomaly.id;

      // Sombra para seleccionado/hover
      if (isSelected || isHovered) {
        ctx.beginPath();
        ctx.arc(x, y, radius + 5, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? 'rgba(52, 211, 153, 0.3)' : 'rgba(255, 255, 255, 0.15)';
        ctx.fill();
      }

      // Círculo principal
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.8;
      ctx.fill();
      ctx.globalAlpha = 1;

      // Borde
      ctx.strokeStyle = isSelected ? '#34d399' : (isHovered ? '#ffffff' : '#1e293b');
      ctx.lineWidth = isSelected ? 2.5 : 1.5;
      ctx.stroke();

      // Etiqueta ID (solo para anomalías con profundidad > 30%)
      if (anomaly.depthPercent > 30) {
        ctx.fillStyle = '#e2e8f0';
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(anomaly.id, x, y - radius - 6);
      }
    }

    // ─── Leyenda ───
    const legendY = padding.top + 10;
    const legendItems = [
      { label: 'Leve (<30%)', color: '#22c55e' },
      { label: 'Moderada (30-50%)', color: '#f59e0b' },
      { label: 'Severa (>=50%)', color: '#ef4444' }
    ];

    ctx.font = '9px sans-serif';
    ctx.textAlign = 'left';
    let legendX = w - padding.right - 180;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(legendX - 8, legendY - 4, 180, legendItems.length * 18 + 10);

    for (let i = 0; i < legendItems.length; i++) {
      const ly = legendY + 6 + i * 18;
      ctx.beginPath();
      ctx.arc(legendX + 4, ly + 4, 5, 0, Math.PI * 2);
      ctx.fillStyle = legendItems[i].color;
      ctx.fill();
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText(legendItems[i].label, legendX + 14, ly + 8);
    }
  };

  /** Manejador de hover en el canvas */
  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || anomalies.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const padding = { top: 40, bottom: 40, left: 60, right: 30 };
    const plotW = rect.width - padding.left - padding.right;
    const plotH = rect.height - padding.top - padding.bottom;
    const minKP = Math.min(...anomalies.map(a => a.kp)) - 0.5;
    const maxKP = Math.max(...anomalies.map(a => a.kp)) + 0.5;
    const kpRange = maxKP - minKP || 1;

    let found: Anomaly | null = null;

    for (const anomaly of anomalies) {
      const ax = padding.left + ((anomaly.kp - minKP) / kpRange) * plotW;
      const clockParts = anomaly.clockPosition.split(':').map(Number);
      const clockDecimal = clockParts[0] + clockParts[1] / 60;
      const ay = padding.top + (clockDecimal / 12) * plotH;
      const radius = 6 + (anomaly.depthPercent / 100) * 20;

      const dx = mouseX - ax;
      const dy = mouseY - ay;
      if (dx * dx + dy * dy <= radius * radius) {
        found = anomaly;
        break;
      }
    }

    setHoveredAnomaly(found);
    setCanvasTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, [anomalies]);

  // ─── DIG SHEET PDF ─────────────────────────────────────────────────

  /** Genera PDF de Dig Sheet con jsPDF para una anomalía */
  const generateDigSheetPDF = useCallback((anomaly: Anomaly) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageW = 210;
    const margin = 15;
    const contentW = pageW - 2 * margin;

    // Título principal
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(11, 34, 57);
    doc.text('DIG SHEET — FICHA DE EXCAVACIÓN Y VERIFICACIÓN', pageW / 2, 20, { align: 'center' });

    // Línea separadora
    doc.setDrawColor(60, 177, 121);
    doc.setLineWidth(0.8);
    doc.line(margin, 25, pageW - margin, 25);

    // Información del documento
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Documento: DS-IC360-2026-${anomaly.id.split('-')[2] || '001'}`, margin, 32);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, margin, 37);
    doc.text(`Generado por: Industrial 360 ILI Module (ROSEN ROSOFT Level)`, margin, 42);

    // ─── Sección 1: Datos de la anomalía ───
    let yPos = 52;
    doc.setFontSize(12);
    doc.setTextColor(11, 34, 57);
    doc.setFont('helvetica', 'bold');
    doc.text('1. DATOS DE LA ANOMALÍA', margin, yPos);
    yPos += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);

    const fields1 = [
      { label: 'ID Anomalía:', value: anomaly.id },
      { label: 'Kilometraje (KP):', value: `${anomaly.kp} km` },
      { label: 'Posición (Carátula):', value: `${anomaly.clockPosition} o'clock` },
      { label: 'Profundidad:', value: `${anomaly.depthPercent}% WT (${((anomaly.depthPercent / 100) * anomaly.nominalWT).toFixed(2)} mm)` },
      { label: 'Longitud:', value: `${anomaly.lengthMm} mm` },
      { label: 'Ancho:', value: `${anomaly.widthMm} mm` },
      { label: 'Tipo:', value: anomaly.type },
      { label: 'Superficie:', value: anomaly.internalExternal },
    ];

    for (const f of fields1) {
      doc.text(`${f.label} ${f.value}`, margin + 5, yPos);
      yPos += 6;
    }

    // ─── Sección 2: Cálculos de Ingeniería ───
    yPos += 4;
    doc.setFontSize(12);
    doc.setTextColor(11, 34, 57);
    doc.setFont('helvetica', 'bold');
    doc.text('2. CÁLCULOS DE INGENIERÍA (ASME B31G / RSTRENG)', margin, yPos);
    yPos += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);

    const calcFields = [
      { label: 'P_safe (Folias):', value: `${anomaly.pSafe} psi` },
      { label: 'P_safe (RSTRENG):', value: `${anomaly.pSafeRSTRENG} psi` },
      { label: 'ERF (MAOP / P_safe):', value: `${anomaly.erf.toFixed(3)}` },
      { label: 'MAOP:', value: `${anomaly.maop} psi` },
      { label: 'Diámetro:', value: `${anomaly.pipeDiameter}"` },
      { label: 'WT Nominal:', value: `${anomaly.nominalWT} mm` },
      { label: 'SMYS:', value: `${anomaly.smys} psi (API 5L X52)` },
    ];

    for (const f of calcFields) {
      doc.text(`${f.label} ${f.value}`, margin + 5, yPos);
      yPos += 6;
    }

    // ─── Sección 3: Reparación Recomendada ───
    yPos += 4;
    doc.setFontSize(12);
    doc.setTextColor(11, 34, 57);
    doc.setFont('helvetica', 'bold');
    doc.text('3. RECOMENDACIÓN DE REPARACIÓN', margin, yPos);
    yPos += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);

    const remediationText: Record<RemediationType, string> = {
      'Sleeve': 'Camisa de Acero Tipo B (Full Encirclement Sleeve) con soldadura de filete según API 1104.',
      'Composite': 'Envolvente de fibra de carbono/resina epóxica según ASME PCC-2 / ISO 24817.',
      'Replace': 'Reemplazo del segmento de tubería con retiro de sección dañada y soldadura de culata.',
      'Grind': 'Esmerilado cuidadoso para eliminar discontinuidad superficial, seguido de perfilometría.',
      'Monitor': 'Monitoreo continuo sin intervención activa. Re-evaluar en próxima corrida ILI programada.',
    };

    doc.text(`Tipo de Reparación Recomendada: ${anomaly.remediationType}`, margin + 5, yPos);
    yPos += 6;
    doc.setFontSize(8);
    doc.text(remediationText[anomaly.remediationType] || remediationText.Monitor, margin + 5, yPos);
    yPos += 10;

    // Preparación de superficie
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Preparación de Superficie:', margin + 5, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('• Chorro de arena abrasivo a grado SSPC-SP10 / Sa 2.5 (near-white metal)', margin + 10, yPos);
    yPos += 4;
    doc.text('• Perfil de anclaje: 50-100 micras (ASTM D7127)', margin + 10, yPos);
    yPos += 4;
    doc.text('• Aplicación de primer epóxico rico en zinc de 75-125 micras', margin + 10, yPos);
    yPos += 4;
    doc.text('• Curado: 24 horas a temperatura ambiente antes de recubrimiento final', margin + 10, yPos);

    // ─── Sección 4: Coordenadas de Campo ───
    yPos += 8;
    doc.setFontSize(12);
    doc.setTextColor(11, 34, 57);
    doc.setFont('helvetica', 'bold');
    doc.text('4. COORDENADAS DE CAMPO Y REFERENCIA', margin, yPos);
    yPos += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    doc.text('Coordenadas UTM (Referencia):', margin + 5, yPos);
    yPos += 5;
    doc.text(`Norte: ${(984231.42 + anomaly.kp * 100).toFixed(2)}`, margin + 10, yPos);
    yPos += 5;
    doc.text(`Este: ${(382104.88 + anomaly.kp * 50).toFixed(2)}`, margin + 10, yPos);
    yPos += 5;
    doc.text('Sistema de Referencia: WGS84 / UTM Zona 20N', margin + 10, yPos);

    // ─── Pie de página ───
    yPos = 270;
    doc.setDrawColor(60, 177, 121);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageW - margin, yPos);
    yPos += 4;
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.text('DOCUMENTO TÉCNICO EMITIDO BAJO ESTÁNDARES ASME B31G / API 1163 / PDVSA L-IP-01', pageW / 2, yPos, { align: 'center' });
    yPos += 3;
    doc.text('Industrial 360 — Módulo de Integridad Mecánica y Corridas ILI — ROSEN ROSOFT Level', pageW / 2, yPos, { align: 'center' });

    // Descargar PDF
    doc.save(`DigSheet_${anomaly.id}_KP${anomaly.kp}.pdf`);
  }, []);

  // ─── REPAIR HISTORY ─────────────────────────────────────────────────

  /** Agregar una reparación a una anomalía */
  const addRepair = useCallback(() => {
    if (!selectedAnomaly || !newRepair.responsible || !newRepair.inspector) {
      alert('Complete los campos obligatorios: Responsable e Inspector.');
      return;
    }

    const repair: RepairRecord = {
      id: `REP-${Date.now()}`,
      type: (newRepair.type as RemediationType) || 'Sleeve',
      date: newRepair.date || new Date().toISOString().split('T')[0],
      responsible: newRepair.responsible,
      inspector: newRepair.inspector,
      status: (newRepair.status as RepairStatus) || 'Planificada',
      notes: newRepair.notes || ''
    };

    const updatedAnomalies = anomalies.map(a => {
      if (a.id === selectedAnomaly.id) {
        return { ...a, repairs: [...a.repairs, repair], status: 'Reparado' as AnomalyStatus };
      }
      return a;
    });

    setAnomalies(updatedAnomalies);
    setSelectedAnomaly(prev => prev ? { ...prev, repairs: [...prev.repairs, repair], status: 'Reparado' } : null);

    // Resetear formulario
    setNewRepair({
      type: 'Sleeve', date: new Date().toISOString().split('T')[0],
      responsible: '', inspector: '', status: 'Planificada', notes: ''
    });
    setShowRepairForm(false);

    // Sync a Firestore
    syncToFirestore(updatedAnomalies);
  }, [selectedAnomaly, newRepair, anomalies]);

  /** Actualiza el estado de una reparación */
  const updateRepairStatus = useCallback((anomalyId: string, repairId: string, newStatus: RepairStatus) => {
    const updatedAnomalies = anomalies.map(a => {
      if (a.id === anomalyId) {
        return {
          ...a,
          repairs: a.repairs.map(r => r.id === repairId ? { ...r, status: newStatus } : r)
        };
      }
      return a;
    });
    setAnomalies(updatedAnomalies);
    // Actualizar selectedAnomaly si es el mismo
    if (selectedAnomaly?.id === anomalyId) {
      setSelectedAnomaly(prev => prev ? {
        ...prev,
        repairs: prev.repairs.map(r => r.id === repairId ? { ...r, status: newStatus } : r)
      } : null);
    }
    syncToFirestore(updatedAnomalies);
  }, [anomalies, selectedAnomaly]);

  // ─── FIRESTORE SYNC ─────────────────────────────────────────────────

  /** Sincroniza anomalías a Firestore */
  const syncToFirestore = async (anomaliesList: Anomaly[]) => {
    if (!currentProject || currentProject.id === 'all') return;

    try {
      setSyncing(true);
      for (const anomaly of anomaliesList) {
        const { repairs, ...anomalyData } = anomaly;
        await setDoc(doc(db, 'projects', currentProject.id, 'ili_runs', 'run-001', 'anomalies', anomaly.id), {
          ...anomalyData,
          repairs: anomaly.repairs,
          updatedAt: serverTimestamp()
        }, { merge: true });
      }
      setLastSync(new Date().toLocaleString());
    } catch (err) {
      console.warn('Firestore sync error:', err);
    } finally {
      setSyncing(false);
    }
  };

  // ─── EXPORT FUNCTIONS ───────────────────────────────────────────────

  /** Exportar anomalías a Excel (.xlsx) */
  const exportToExcel = useCallback(() => {
    const data = anomalies.map(a => ({
      ID: a.id,
      KP_km: a.kp,
      Posicion: a.clockPosition,
      Profundidad_Pct: a.depthPercent,
      Profundidad_mm: ((a.depthPercent / 100) * a.nominalWT).toFixed(2),
      Longitud_mm: a.lengthMm,
      Ancho_mm: a.widthMm,
      Tipo: a.type,
      Superficie: a.internalExternal,
      P_safe_Folias_psi: a.pSafe,
      P_safe_RSTRENG_psi: a.pSafeRSTRENG,
      ERF: a.erf,
      Estado: a.status,
      Reparacion: a.remediationType,
      MAOP_psi: a.maop,
      WT_mm: a.nominalWT,
      Diametro_pulg: a.pipeDiameter,
      SMYS_psi: a.smys
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Anomalias_ILI');

    // Configurar ancho de columnas
    ws['!cols'] = [
      { wch: 14 }, { wch: 10 }, { wch: 10 }, { wch: 14 }, { wch: 14 },
      { wch: 12 }, { wch: 10 }, { wch: 20 }, { wch: 12 }, { wch: 18 },
      { wch: 18 }, { wch: 8 }, { wch: 22 }, { wch: 14 }, { wch: 10 },
      { wch: 14 }, { wch: 10 }, { wch: 10 }
    ];

    XLSX.writeFile(wb, `ILI_Anomalies_${new Date().toISOString().split('T')[0]}.xlsx`);
  }, [anomalies]);

  /** Exportar reporte completo de integridad a PDF */
  const exportIntegrityReportPDF = useCallback(() => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageW = 210;
    const margin = 15;

    // Portada
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(11, 34, 57);
    doc.text('REPORTE DE INTEGRIDAD', pageW / 2, 50, { align: 'center' });
    doc.setFontSize(14);
    doc.setTextColor(60, 177, 121);
    doc.text('Corridas ILI — ROSEN ROSOFT Level', pageW / 2, 60, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}`, pageW / 2, 75, { align: 'center' });
    doc.text(`Total Anomalías: ${anomalies.length}`, pageW / 2, 82, { align: 'center' });
    doc.text(`Proyecto: ${currentProject?.name || 'Portafolio Corporativo'}`, pageW / 2, 89, { align: 'center' });

    // Resumen
    const criticalCount = anomalies.filter(a => a.depthPercent >= 40).length;
    const urgentCount = anomalies.filter(a => a.erf >= ERF_URGENT_THRESHOLD).length;
    const safeCount = anomalies.filter(a => {
      const calc = calculateB31GCombined(a.pipeDiameter, a.nominalWT, a.depthPercent, a.lengthMm, a.maop, a.smys, DEFAULT_DF);
      return calc.isSafe;
    }).length;

    let yPos = 120;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(11, 34, 57);
    doc.text('RESUMEN EJECUTIVO', margin, yPos);
    yPos += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(50, 50, 50);
    doc.text(`• Anomalías críticas (depth >= 40% WT): ${criticalCount}`, margin + 5, yPos); yPos += 7;
    doc.text(`• Anomalías con ERF > ${ERF_URGENT_THRESHOLD} (reparación urgente): ${urgentCount}`, margin + 5, yPos); yPos += 7;
    doc.text(`• Anomalías con P_safe >= MAOP: ${safeCount}`, margin + 5, yPos); yPos += 7;
    doc.text(`• Velocidad de corrosión promedio estimada: 0.22 mm/año`, margin + 5, yPos); yPos += 7;
    doc.text(`• Normativa aplicable: ASME B31G / RSTRENG / API 1163 / API 579`, margin + 5, yPos);

    // Listado de anomalías
    yPos += 15;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(11, 34, 57);
    doc.text('LISTADO DE ANOMALÍAS', margin, yPos);
    yPos += 8;

    // Tabla
    const tableHeaders = ['ID', 'KP (km)', 'Depth %', 'P_safe', 'ERF', 'Status'];
    const colWidths = [22, 16, 16, 20, 12, 30];
    let xPos = margin;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.setFillColor(11, 34, 57);
    for (let i = 0; i < tableHeaders.length; i++) {
      doc.rect(xPos, yPos, colWidths[i], 7, 'F');
      doc.text(tableHeaders[i], xPos + 2, yPos + 5);
      xPos += colWidths[i];
    }
    yPos += 7;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    for (const a of anomalies) {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      xPos = margin;
      const rowColor: [number, number, number] = a.depthPercent >= 40 ? [254, 226, 226] : [255, 255, 255];
      doc.setFillColor(rowColor[0], rowColor[1], rowColor[2]);
      doc.rect(xPos, yPos, colWidths.reduce((a, b) => a + b, 0), 6, 'F');

      const rowData = [a.id, a.kp.toFixed(3), `${a.depthPercent}%`, `${a.pSafe} psi`, a.erf.toFixed(3), a.status];
      for (let i = 0; i < rowData.length; i++) {
        doc.text(rowData[i], xPos + 2, yPos + 4.5);
        xPos += colWidths[i];
      }
      yPos += 6.5;
    }

    doc.save(`ILI_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  }, [anomalies, currentProject]);

  // ─── HANDLERS ───────────────────────────────────────────────────────

  const handleSelectAnomaly = (anomaly: Anomaly) => {
    setSelectedAnomaly(anomaly);
    setDigSheetAnomaly(anomaly);
  };

  // ─── RENDER ─────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ─── HEADER ─── */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider mb-1">
            <Database size={16} /> Módulo Prioritario 3 · ROSEN ROSOFT Level · ASME B31G / RSTRENG / API 1163 / API 579 / API 653 / API 570 / API 581 RBI
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Integridad Mecánica & Corridas ILI Pigging</h1>
          <p className="text-slate-400 text-sm mt-1">
            Evaluación de anomalías de pared, cálculo P_safe (Folias + RSTRENG), ERF, Dig Sheets, matriz de riesgo RBI y API 581 para ductos y tanques.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Botón Importar POF */}
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className={`flex items-center gap-2 ${importing ? 'bg-slate-700' : 'bg-emerald-600 hover:bg-emerald-700'} text-white font-bold px-4 py-2 rounded-xl text-sm transition-all shadow-md`}
          >
            <Upload size={16} />
            {importing ? 'Procesando...' : 'Importar Corrida ILI (POF)'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls,.txt"
            onChange={handlePOFUpload}
            className="hidden"
          />
          
          {/* Botón Exportar Excel */}
          <button 
            onClick={exportToExcel}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-2 rounded-xl text-xs transition-all shadow-md"
          >
            <Sheet size={14} /> Excel
          </button>
          
          {/* Botón Exportar PDF */}
          <button 
            onClick={exportIntegrityReportPDF}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-2 rounded-xl text-xs transition-all shadow-md"
          >
            <Printer size={14} /> Reporte PDF
          </button>

          {/* Sync indicator */}
          {syncing && (
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <RefreshCw size={12} className="animate-spin" /> Sincronizando...
            </div>
          )}
          {lastSync && !syncing && (
            <div className="text-[10px] text-slate-500">Última sinc: {lastSync}</div>
          )}
        </div>
      </div>

      {/* ─── IMPORT PREVIEW MODAL ─── */}
      {importPreview && importPreview.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-300 p-5 rounded-2xl shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCog size={20} className="text-amber-600" />
              <h3 className="font-bold text-amber-900">Previsualización de Importación POF</h3>
              <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-mono">
                {importFileName} · {importPreview.length} anomalías detectadas
              </span>
            </div>
            <button onClick={cancelImport} className="text-amber-700 hover:text-amber-900">
              <X size={18} />
            </button>
          </div>

          <div className="max-h-40 overflow-y-auto bg-white rounded-xl border border-amber-200 text-xs">
            <table className="w-full">
              <thead>
                <tr className="bg-amber-100 text-amber-900">
                  <th className="p-2 text-left font-bold">ID</th>
                  <th className="p-2 text-left font-bold">KP (km)</th>
                  <th className="p-2 text-left font-bold">Clock</th>
                  <th className="p-2 text-left font-bold">Depth%</th>
                  <th className="p-2 text-left font-bold">L (mm)</th>
                  <th className="p-2 text-left font-bold">Tipo</th>
                  <th className="p-2 text-left font-bold">ERF</th>
                </tr>
              </thead>
              <tbody>
                {importPreview.map((a, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-amber-50/50'}>
                    <td className="p-2 font-mono font-bold">{a.id}</td>
                    <td className="p-2 font-mono">{a.kp.toFixed(3)}</td>
                    <td className="p-2 font-mono">{a.clockPosition}</td>
                    <td className="p-2">
                      <span className={`px-1.5 py-0.5 rounded ${a.depthPercent >= 50 ? 'bg-red-100 text-red-700' : a.depthPercent >= 30 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                        {a.depthPercent}%
                      </span>
                    </td>
                    <td className="p-2 font-mono">{a.lengthMm}</td>
                    <td className="p-2">{a.type}</td>
                    <td className="p-2 font-mono">
                      <span className={`${a.erf >= ERF_URGENT_THRESHOLD ? 'text-red-600 font-bold' : 'text-green-600'}`}>
                        {a.erf.toFixed(3)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-3">
            <button onClick={cancelImport} className="px-4 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-100 rounded-xl transition-colors">
              Cancelar
            </button>
            <button onClick={confirmImport} className="px-6 py-2 text-sm font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition-colors shadow-md">
              Confirmar Importación ({importPreview.length} anomalías)
            </button>
          </div>
        </div>
      )}

      {/* ─── NAVIGATION TABS ─── */}
      <div className="flex border-b border-gray-200 bg-white rounded-xl p-1 shadow-sm overflow-x-auto">
        {[
          { id: 'ili' as const, icon: Activity, label: 'Visor ILI & Mapa 2D' },
          { id: 'calculator' as const, icon: Calculator, label: 'B31G / RSTRENG' },
          { id: 'digsheets' as const, icon: FileText, label: 'Dig Sheets (PDF)' },
          { id: 'rbi' as const, icon: BarChart3, label: 'RBI API 581' },
          { id: 'api653' as const, icon: Compass, label: 'Tanques API 653' },
          { id: 'api570' as const, icon: Wrench, label: 'Proceso API 570' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
              activeTab === tab.id ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: VISOR DE TUBERÍA & ILI CON MAPA 2D                         */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {activeTab === 'ili' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de Anomalías */}
          <div className="lg:col-span-1 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">Anomalías Registradas (PIG ROSEN MFL)</h2>
              <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-700 font-mono font-bold">
                {filteredAnomalies.length} Anom.
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por ID o KP..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs"
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white"
              >
                <option value="all">Todas</option>
                <option value="critical">Críticas (&gt;40%)</option>
                <option value="urgent">ERF &gt;{ERF_URGENT_THRESHOLD}</option>
              </select>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {filteredAnomalies.map((item) => {
                const isSelected = selectedAnomaly?.id === item.id;
                const isCritical = item.depthPercent >= 40;
                const isUrgent = item.erf >= ERF_URGENT_THRESHOLD;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectAnomaly(item)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-400/20'
                        : 'border-gray-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-800">{item.id}</span>
                      <div className="flex items-center gap-1">
                        {isUrgent && <AlertTriangle size={10} className="text-red-500" />}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          isUrgent ? 'bg-red-100 text-red-700' : isCritical ? 'bg-yellow-100 text-yellow-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          KP {item.kp} km
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-400 text-[10px] uppercase block">Profundidad</span>
                        <span className={`font-bold ${isCritical ? 'text-red-600' : 'text-gray-800'}`}>
                          {item.depthPercent}% WT ({((item.depthPercent / 100) * item.nominalWT).toFixed(2)} mm)
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 text-[10px] uppercase block">ERF</span>
                        <span className={`font-bold font-mono ${isUrgent ? 'text-red-600' : 'text-gray-800'}`}>
                          {item.erf.toFixed(3)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-1 flex items-center gap-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        item.remediationType === 'Replace' ? 'bg-red-100 text-red-700' :
                        item.remediationType === 'Sleeve' ? 'bg-orange-100 text-orange-700' :
                        item.remediationType === 'Composite' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {item.remediationType}
                      </span>
                      {item.repairs.length > 0 && (
                        <span className="text-[10px] text-blue-600 font-mono">
                          ({item.repairs.length} {item.repairs.length === 1 ? 'reparación' : 'reparaciones'})
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Panel de Visualización */}
          <div className="lg:col-span-2 space-y-6">
            {selectedAnomaly ? (
              <>
                {/* Mapa 2D de Tubería (Canvas) */}
                <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <MapIcon size={16} /> Mapa 2D de Anomalías — KP vs Carátula de Reloj
                    </h3>
                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                      <Eye size={10} /> Hover para tooltip
                    </span>
                  </div>
                  <div className="relative">
                    <canvas
                      ref={canvasRef}
                      className="w-full h-72 rounded-xl cursor-crosshair"
                      onMouseMove={handleCanvasMouseMove}
                      onMouseLeave={() => setHoveredAnomaly(null)}
                    />
                    {/* Tooltip del canvas */}
                    {hoveredAnomaly && (
                      <div
                        className="absolute z-10 bg-slate-900 text-white p-2.5 rounded-xl shadow-xl text-xs pointer-events-none border border-slate-700"
                        style={{
                          left: Math.min(canvasTooltipPos.x + 12, 400),
                          top: Math.max(canvasTooltipPos.y - 50, 10)
                        }}
                      >
                        <p className="font-mono font-bold text-emerald-400">{hoveredAnomaly.id}</p>
                        <p>KP: <span className="font-mono">{hoveredAnomaly.kp} km</span></p>
                        <p>Depth: <span className="font-mono">{hoveredAnomaly.depthPercent}% WT</span></p>
                        <p>ERF: <span className="font-mono">{hoveredAnomaly.erf.toFixed(3)}</span></p>
                        <span className={`inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded ${
                          hoveredAnomaly.depthPercent >= DEPTH_CRITICAL ? 'bg-red-600 text-white' :
                          hoveredAnomaly.depthPercent >= DEPTH_WARNING ? 'bg-yellow-500 text-black' :
                          'bg-green-600 text-white'
                        }`}>
                          {hoveredAnomaly.depthPercent >= DEPTH_CRITICAL ? 'Severa' :
                           hoveredAnomaly.depthPercent >= DEPTH_WARNING ? 'Moderada' : 'Leve'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Detalle de Anomalía Seleccionada */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-4 border-b border-gray-100 gap-2">
                    <div>
                      <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
                        ANOMALÍA SELECCIONADA: {selectedAnomaly.id}
                      </span>
                      <h3 className="text-xl font-bold text-gray-900 mt-1">
                        {selectedAnomaly.type} {selectedAnomaly.internalExternal} en KP {selectedAnomaly.kp} km
                      </h3>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => generateDigSheetPDF(selectedAnomaly)}
                        className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 rounded-xl text-xs font-semibold"
                      >
                        <FileText size={14} />
                        Dig Sheet PDF
                      </button>
                      <button 
                        onClick={() => { setShowRepairForm(!showRepairForm); }}
                        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl text-xs font-semibold"
                      >
                        <Hammer size={14} />
                        {showRepairForm ? 'Cerrar' : 'Nueva Reparación'}
                      </button>
                    </div>
                  </div>

                  {/* Pipeline Diagram / Clock */}
                  <div className="bg-slate-950 p-6 rounded-xl text-white space-y-4">
                    <div className="flex justify-between items-center text-xs text-slate-400 border-b border-slate-800 pb-2">
                      <span>SECCIÓN DE TUBERÍA O.D. {selectedAnomaly.pipeDiameter}" X52 Sch 40</span>
                      <span className="text-emerald-400 font-mono font-bold">KILOMETRAJE KP {selectedAnomaly.kp} KM</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                      {/* Clock Diagram */}
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <span className="text-xs text-slate-300 font-mono">Carátula de Reloj (Orientación)</span>
                        <div className="relative w-40 h-40 rounded-full border-4 border-slate-700 bg-slate-900 flex items-center justify-center">
                          <span className="absolute top-2 text-[10px] text-slate-400 font-mono">12:00</span>
                          <span className="absolute right-2 text-[10px] text-slate-400 font-mono">03:00</span>
                          <span className="absolute bottom-2 text-[10px] text-slate-400 font-mono">06:00</span>
                          <span className="absolute left-2 text-[10px] text-slate-400 font-mono">09:00</span>
                          
                          {/* Center pipe cross section */}
                          <div className="w-28 h-28 rounded-full border-2 border-slate-500 bg-slate-800 flex items-center justify-center relative">
                            <span className="text-[10px] text-emerald-400 font-mono font-bold">WT {selectedAnomaly.nominalWT}mm</span>
                            
                            {/* Anomaly Indicator Dot */}
                            <div 
                              className="absolute w-4 h-4 rounded-full bg-red-500 animate-pulse border-2 border-white"
                              style={{
                                top: selectedAnomaly.clockPosition.startsWith('04') ? '70%' : 
                                     selectedAnomaly.clockPosition.startsWith('01') ? '25%' :
                                     selectedAnomaly.clockPosition.startsWith('06') ? '80%' :
                                     selectedAnomaly.clockPosition.startsWith('11') ? '20%' : '50%',
                                left: selectedAnomaly.clockPosition.startsWith('04') ? '70%' : 
                                      selectedAnomaly.clockPosition.startsWith('01') ? '75%' :
                                      selectedAnomaly.clockPosition.startsWith('06') ? '50%' :
                                      selectedAnomaly.clockPosition.startsWith('11') ? '25%' : '50%',
                              }}
                              title={`Anomalía en ${selectedAnomaly.clockPosition}`}
                            />
                          </div>
                        </div>
                        <span className="text-xs font-mono text-emerald-400 bg-slate-800 px-3 py-1 rounded-full">
                          Posición: {selectedAnomaly.clockPosition} o'clock ({selectedAnomaly.internalExternal})
                        </span>
                      </div>

                      {/* Resultados de Cálculo */}
                      <div className="space-y-3 text-xs">
                        <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                          <span className="text-slate-400 block text-[10px] uppercase">Profundidad Muesca</span>
                          <p className="text-lg font-bold text-red-400 font-mono">
                            {selectedAnomaly.depthPercent}% WT ({((selectedAnomaly.depthPercent / 100) * selectedAnomaly.nominalWT).toFixed(2)} mm)
                          </p>
                        </div>

                        <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 grid grid-cols-2 gap-2 font-mono">
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase">Longitud (L)</span>
                            <span className="text-slate-200 font-bold">{selectedAnomaly.lengthMm} mm</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase">Ancho (W)</span>
                            <span className="text-slate-200 font-bold">{selectedAnomaly.widthMm} mm</span>
                          </div>
                        </div>

                        {/* B31G Results Side-by-Side */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                            <span className="text-slate-400 block text-[10px] uppercase">P_safe Folias</span>
                            <span className="text-base font-bold text-emerald-400 font-mono">{selectedAnomaly.pSafe} psi</span>
                          </div>
                          <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                            <span className="text-slate-400 block text-[10px] uppercase">P_safe RSTRENG</span>
                            <span className="text-base font-bold text-blue-400 font-mono">{selectedAnomaly.pSafeRSTRENG} psi</span>
                          </div>
                        </div>

                        <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 text-[10px] uppercase">ERF (MAOP / P_safe)</span>
                            <span className={`font-mono font-bold text-lg ${selectedAnomaly.erf >= ERF_URGENT_THRESHOLD ? 'text-red-400' : 'text-emerald-400'}`}>
                              {selectedAnomaly.erf.toFixed(3)}
                            </span>
                          </div>
                          {selectedAnomaly.erf >= ERF_URGENT_THRESHOLD && (
                            <p className="text-[10px] text-red-300 mt-1 flex items-center gap-1">
                              <AlertTriangle size={10} /> REQUIERE REPARACIÓN URGENTE (ERF &gt; {ERF_URGENT_THRESHOLD})
                            </p>
                          )}
                        </div>

                        <div className={`p-3 rounded-lg border ${
                          selectedAnomaly.erf >= ERF_URGENT_THRESHOLD ? 'bg-red-950/60 border-red-800' : 'bg-slate-900 border-slate-800'
                        }`}>
                          <span className="text-slate-400 block text-[10px] uppercase">Diagnóstico y Reparación</span>
                          <p className="text-xs mt-1 font-sans text-slate-200">
                            {selectedAnomaly.remediationType === 'Replace' ? '🔴 REEMPLAZO REQUERIDO — La profundidad supera el 80% WT o ERF supera 1.5. Se requiere reemplazo de segmento de tubería.' :
                             selectedAnomaly.remediationType === 'Sleeve' ? '🟠 ENCAMISADO TIPO B — Profundidad entre 60-80% WT. Se recomienda camisa de acero Tipo B según API 1104.' :
                             selectedAnomaly.remediationType === 'Composite' ? '🟡 ENVOLVENTE COMPUESTA — Profundidad entre 40-60% WT. Reparación con fibra de carbono según ASME PCC-2.' :
                             '🟢 MONITOREO — Condición aceptable bajo MAOP actual. Verificar en próxima corrida ILI programada.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Métricas adicionales */}
                  <div className="grid grid-cols-4 gap-3 text-center">
                    <div className="p-3 bg-slate-50 rounded-xl border border-gray-200">
                      <span className="text-[10px] font-bold text-gray-500 uppercase block">MAOP</span>
                      <span className="text-sm font-bold text-gray-900 font-mono">{selectedAnomaly.maop} psi</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-gray-200">
                      <span className="text-[10px] font-bold text-gray-500 uppercase block">P_safe</span>
                      <span className="text-sm font-bold text-emerald-600 font-mono">{selectedAnomaly.pSafe} psi</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-gray-200">
                      <span className="text-[10px] font-bold text-gray-500 uppercase block">Material</span>
                      <span className="text-sm font-bold text-gray-900 font-mono">X52</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-gray-200">
                      <span className="text-[10px] font-bold text-gray-500 uppercase block">Factor DF</span>
                      <span className="text-sm font-bold text-gray-900 font-mono">0.72</span>
                    </div>
                  </div>

                  {/* ─── REPAIR HISTORY ─── */}
                  <div className="border-t border-gray-100 pt-4">
                    <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <Hammer size={14} /> Historial de Reparaciones
                      {selectedAnomaly.repairs.length > 0 && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-mono">
                          {selectedAnomaly.repairs.length}
                        </span>
                      )}
                    </h3>

                    {showRepairForm && (
                      <div className="mb-4 p-4 bg-slate-50 rounded-xl border border-gray-200 space-y-3">
                        <h4 className="text-xs font-bold text-slate-800 uppercase">Nueva Reparación</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-600 mb-1">Tipo</label>
                            <select
                              value={newRepair.type}
                              onChange={(e) => setNewRepair(p => ({ ...p, type: e.target.value as RemediationType }))}
                              className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs"
                            >
                              <option value="Sleeve">Sleeve</option>
                              <option value="Composite">Composite</option>
                              <option value="Grind">Grind</option>
                              <option value="Replace">Replace</option>
                              <option value="Monitor">Monitor</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-600 mb-1">Fecha</label>
                            <input
                              type="date"
                              value={newRepair.date}
                              onChange={(e) => setNewRepair(p => ({ ...p, date: e.target.value }))}
                              className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-600 mb-1">Responsable *</label>
                            <input
                              type="text"
                              placeholder="Ing. Apellido"
                              value={newRepair.responsible}
                              onChange={(e) => setNewRepair(p => ({ ...p, responsible: e.target.value }))}
                              className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-600 mb-1">Inspector *</label>
                            <input
                              type="text"
                              placeholder="Inspector"
                              value={newRepair.inspector}
                              onChange={(e) => setNewRepair(p => ({ ...p, inspector: e.target.value }))}
                              className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-600 mb-1">Notas</label>
                          <textarea
                            value={newRepair.notes}
                            onChange={(e) => setNewRepair(p => ({ ...p, notes: e.target.value }))}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs"
                            rows={2}
                            placeholder="Detalles de la reparación..."
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setShowRepairForm(false)} className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-200 rounded-lg">
                            Cancelar
                          </button>
                          <button onClick={addRepair} className="px-4 py-1.5 text-xs font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-1">
                            <Save size={12} /> Guardar Reparación
                          </button>
                        </div>
                      </div>
                    )}

                    {selectedAnomaly.repairs.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">Sin reparaciones registradas para esta anomalía.</p>
                    ) : (
                      <div className="space-y-2">
                        {selectedAnomaly.repairs.map((repair, idx) => (
                          <div key={repair.id} className="p-3 bg-white border border-gray-200 rounded-xl text-xs flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                                repair.type === 'Sleeve' ? 'bg-orange-100 text-orange-700' :
                                repair.type === 'Composite' ? 'bg-yellow-100 text-yellow-700' :
                                repair.type === 'Replace' ? 'bg-red-100 text-red-700' :
                                repair.type === 'Grind' ? 'bg-purple-100 text-purple-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {repair.type}
                              </span>
                              <span className="text-gray-500">{repair.date}</span>
                              <span className="font-semibold text-gray-700">{repair.responsible}</span>
                              <span className="text-gray-400">| Inspector: {repair.inspector}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <select
                                value={repair.status}
                                onChange={(e) => updateRepairStatus(selectedAnomaly.id, repair.id, e.target.value as RepairStatus)}
                                className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${
                                  repair.status === 'Cerrada' ? 'bg-green-100 text-green-700 border-green-300' :
                                  repair.status === 'Verificada' ? 'bg-blue-100 text-blue-700 border-blue-300' :
                                  repair.status === 'Ejecutada' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                                  'bg-gray-100 text-gray-700 border-gray-300'
                                }`}
                              >
                                <option value="Planificada">Planificada</option>
                                <option value="Ejecutada">Ejecutada</option>
                                <option value="Verificada">Verificada</option>
                                <option value="Cerrada">Cerrada</option>
                              </select>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white p-12 text-center rounded-2xl border border-gray-200 text-gray-500">
                Selecciona una anomalía de la lista para inspeccionar la tubería.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: CALCULADORA ASME B31G / RSTRENG                           */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {activeTab === 'calculator' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-lg font-bold text-gray-900">Calculadora de Presión Segura (P_safe) — ASME B31G Modificado + RSTRENG</h2>
            <p className="text-xs text-gray-500 mt-1">
              Determina la resistencia remanente de tuberías corroídas bajo dos métodos: Folias estándar (ASME B31G) y RSTRENG (Modified B31G).
              Incluye cálculo de ERF (Estimated Repair Factor) según API 1163.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input form */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Parámetros Geométricos y Operativos</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Diámetro Exterior (pulg)</label>
                  <input
                    type="number"
                    value={calcDiameter}
                    onChange={(e) => setCalcDiameter(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Espesor Nominal WT (mm)</label>
                  <input
                    type="number"
                    value={calcWT}
                    onChange={(e) => setCalcWT(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Profundidad Pérdida (% WT)</label>
                  <input
                    type="number"
                    value={calcDepth}
                    onChange={(e) => setCalcDepth(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Longitud Pérdida L (mm)</label>
                  <input
                    type="number"
                    value={calcLength}
                    onChange={(e) => setCalcLength(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">MAOP Actual (psi)</label>
                  <input
                    type="number"
                    value={calcMAOP}
                    onChange={(e) => setCalcMAOP(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">SMYS Acero (psi)</label>
                  <input
                    type="number"
                    value={calcSMYS}
                    onChange={(e) => setCalcSMYS(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-gray-200">
                <span className="text-[10px] text-gray-500 font-semibold uppercase">Factor de Diseño (DF)</span>
                <select
                  value={calcFolias}
                  onChange={(e) => setCalcFolias(Number(e.target.value))}
                  className="ml-2 px-2 py-1 border border-gray-300 rounded text-xs bg-white"
                >
                  <option value={0.72}>0.72 — Clase 1 (ASME B31.4)</option>
                  <option value={0.60}>0.60 — Clase 2 (ASME B31.4)</option>
                  <option value={0.50}>0.50 — Clase 3 (ASME B31.4)</option>
                  <option value={0.40}>0.40 — Clase 4 (ASME B31.4)</option>
                </select>
              </div>

              {/* Parámetros adicionales del cálculo */}
              <div className="bg-slate-50 p-3 rounded-xl border border-gray-200 space-y-1">
                <p className="text-[10px] text-gray-600 font-mono">
                  Z (Folias) = {currentB31G.z.toFixed(2)} · M = {currentB31G.mFolias.toFixed(4)} · d = {currentB31G.dMm} mm
                </p>
              </div>
            </div>

            {/* Results — Side by Side */}
            <div className="space-y-4">
              {/* Folias Result */}
              <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-xs text-emerald-400 font-mono font-bold uppercase">ASME B31G MODIFICADO (FOLIAS)</span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="text-xs text-slate-400">Presión de Diseño (P_design)</span>
                    <span className="text-base font-mono font-bold">{currentB31G.pDesign} psi</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="text-xs text-slate-400">Presión Segura (P_safe)</span>
                    <span className="text-xl font-mono font-bold text-emerald-400">{currentB31G.pSafeFolias} psi</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="text-xs text-slate-400">Relación P_safe / MAOP</span>
                    <span className={`text-lg font-mono font-bold ${currentB31G.safeRatioFolias >= 1 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {currentB31G.safeRatioFolias.toFixed(3)}
                    </span>
                  </div>
                </div>
              </div>

              {/* RSTRENG Result */}
              <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-xs text-blue-400 font-mono font-bold uppercase">RSTRENG (MODIFIED B31G)</span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="text-xs text-slate-400">Presión Segura (P_safe)</span>
                    <span className="text-xl font-mono font-bold text-blue-400">{currentB31G.pSafeRSTRENG} psi</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="text-xs text-slate-400">Relación P_safe / MAOP</span>
                    <span className={`text-lg font-mono font-bold ${currentB31G.safeRatioRSTRENG >= 1 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {currentB31G.safeRatioRSTRENG.toFixed(3)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="text-xs text-slate-400">Diferencia vs Folias</span>
                    <span className={`text-lg font-mono font-bold ${currentB31G.pSafeRSTRENG >= currentB31G.pSafeFolias ? 'text-emerald-400' : 'text-red-400'}`}>
                      {((currentB31G.pSafeRSTRENG / currentB31G.pSafeFolias - 1) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* ERF Result */}
              <div className={`p-4 rounded-xl border ${
                currentB31G.erf >= ERF_URGENT_THRESHOLD 
                  ? 'bg-red-950/60 border-red-800 text-red-200' 
                  : currentB31G.erf >= 1.0
                    ? 'bg-yellow-950/60 border-yellow-800 text-yellow-200'
                    : 'bg-emerald-950/60 border-emerald-800 text-emerald-200'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    {currentB31G.erf >= ERF_URGENT_THRESHOLD ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
                    ERF = {currentB31G.erf.toFixed(3)} (MAOP / P_safe)
                  </div>
                  <span className="text-xs font-mono opacity-80">
                    {currentB31G.erf >= ERF_URGENT_THRESHOLD ? '🔴 REPARACIÓN URGENTE' :
                     currentB31G.erf >= 1.0 ? '🟡 REQUIERE EVALUACIÓN' :
                     '🟢 OPERACIÓN SEGURA'}
                  </span>
                </div>
                <p className="text-xs opacity-90 mt-1">
                  {currentB31G.erf >= ERF_URGENT_THRESHOLD 
                    ? `ERF > ${ERF_URGENT_THRESHOLD}: La presión segura es insuficiente para el MAOP actual. Se requiere intervención inmediata.`
                    : currentB31G.erf >= 1.0
                      ? 'ERF entre 1.0 y 1.1: Condición límite. Se recomienda monitoreo frecuente y evaluación detallada RSTRENG.'
                      : 'ERF < 1.0: La presión máxima segura excede la presión MAOP. El ducto califica para operación continuada.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* TAB 3: GENERADOR DE DIG SHEETS (PDF con jsPDF)                  */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {activeTab === 'digsheets' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Generador de Dig Sheets de Excavación y Verificación</h2>
              <p className="text-xs text-gray-500">Seleccione una anomalía para generar su ficha de campo en formato PDF con cálculos de ingeniería.</p>
            </div>
          </div>

          {/* Selección de anomalía para Dig Sheet */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-800">Seleccionar Anomalía</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {anomalies.map(a => (
                  <div
                    key={a.id}
                    onClick={() => setDigSheetAnomaly(a)}
                    className={`p-3 rounded-xl border cursor-pointer text-xs transition-all ${
                      digSheetAnomaly?.id === a.id
                        ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-400/20'
                        : 'border-gray-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold">{a.id}</span>
                      <span className="text-[10px] text-gray-500 font-mono">KP {a.kp} km</span>
                    </div>
                    <div className="mt-1 text-gray-600">
                      {a.type} · {a.depthPercent}% WT · {a.remediationType}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Vista previa y acción */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-gray-200 flex flex-col items-center justify-center space-y-4">
              {digSheetAnomaly ? (
                <>
                  <div className="text-center">
                    <FileText size={48} className="text-slate-400 mx-auto mb-2" />
                    <h3 className="font-bold text-slate-800">{digSheetAnomaly.id}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      KP {digSheetAnomaly.kp} km · {digSheetAnomaly.type} · {digSheetAnomaly.depthPercent}% WT
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      P_safe: {digSheetAnomaly.pSafe} psi · ERF: {digSheetAnomaly.erf.toFixed(3)} · Reparación: {digSheetAnomaly.remediationType}
                    </p>
                  </div>
                  <button
                    onClick={() => generateDigSheetPDF(digSheetAnomaly)}
                    className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-md transition-all"
                  >
                    <Download size={16} />
                    Generar y Descargar Dig Sheet PDF
                  </button>
                </>
              ) : (
                <p className="text-gray-400 text-sm">Seleccione una anomalía de la lista para generar su Dig Sheet.</p>
              )}
            </div>
          </div>

          {/* Template preview */}
          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">Vista previa del contenido del Dig Sheet</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-gray-200 space-y-2">
                <h4 className="font-bold text-slate-800 text-sm">1. Datos de la Anomalía</h4>
                <p><strong className="text-gray-700">ID:</strong> {digSheetAnomaly?.id || '—'}</p>
                <p><strong className="text-gray-700">KP:</strong> {digSheetAnomaly?.kp || '—'} km</p>
                <p><strong className="text-gray-700">Orientación:</strong> {digSheetAnomaly?.clockPosition || '—'} o'clock</p>
                <p><strong className="text-gray-700">Profundidad:</strong> {digSheetAnomaly?.depthPercent || '—'}% WT</p>
                <p><strong className="text-gray-700">Tipo:</strong> {digSheetAnomaly?.type || '—'}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-gray-200 space-y-2">
                <h4 className="font-bold text-slate-800 text-sm">2. Recomendación de Reparación</h4>
                <p><strong className="text-gray-700">Envolvente Sugerida:</strong> {digSheetAnomaly?.remediationType || '—'}</p>
                <p><strong className="text-gray-700">P_safe (Folias):</strong> {digSheetAnomaly?.pSafe || '—'} psi</p>
                <p><strong className="text-gray-700">P_safe (RSTRENG):</strong> {digSheetAnomaly?.pSafeRSTRENG || '—'} psi</p>
                <p><strong className="text-gray-700">ERF:</strong> {digSheetAnomaly?.erf.toFixed(3) || '—'}</p>
                <p><strong className="text-gray-700">Status:</strong> {digSheetAnomaly?.status || '—'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* TAB 4: RBI — PLAN DE INSPECCIÓN API 581                          */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {activeTab === 'rbi' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-lg font-bold text-gray-900">Risk-Based Inspection (RBI) — API 581</h2>
            <p className="text-xs text-gray-500 mt-1">
              Evaluación semicuantitativa de riesgo mediante matriz de Probabilidad × Consecuencia 5×5. 
              Determina frecuencia de inspección según nivel de riesgo.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Inputs */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Parámetros del Equipo</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Diámetro (pulg)</label>
                  <input
                    type="number"
                    value={rbiParams.diameter}
                    onChange={(e) => setRbiParams(p => ({ ...p, diameter: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Esp. Nominal (mm)</label>
                  <input
                    type="number"
                    value={rbiParams.wallThickness}
                    onChange={(e) => setRbiParams(p => ({ ...p, wallThickness: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Fluido</label>
                  <input
                    type="text"
                    value={rbiParams.fluid}
                    onChange={(e) => setRbiParams(p => ({ ...p, fluid: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="Crudo, Gas, Agua..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Tipo de Fluido</label>
                  <select
                    value={rbiParams.fluidType}
                    onChange={(e) => setRbiParams(p => ({ ...p, fluidType: e.target.value as RBIParams['fluidType'] }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                  >
                    <option value="Oil">Petróleo / Crudo</option>
                    <option value="Gas">Gas</option>
                    <option value="Water">Agua</option>
                    <option value="Chemical">Químico</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Presión (psi)</label>
                  <input
                    type="number"
                    value={rbiParams.pressure}
                    onChange={(e) => setRbiParams(p => ({ ...p, pressure: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Temperatura (°C)</label>
                  <input
                    type="number"
                    value={rbiParams.temperature}
                    onChange={(e) => setRbiParams(p => ({ ...p, temperature: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                  />
                </div>
              </div>

              <button
                onClick={() => {
                  const result = calculateRBI(rbiParams);
                  alert(`Riesgo: ${result.riskLevel}\nFrecuencia de Inspección: ${result.inspectionFreqYears} años\nCategoría Probabilidad: ${result.probabilityCategory}/5\nCategoría Consecuencia: ${result.consequenceCategory}/5`);
                }}
                className="w-full px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors"
              >
                Calcular Riesgo RBI
              </button>
            </div>

            {/* Matriz 5×5 */}
            <div>
              {(() => {
                const rbiResult = calculateRBI(rbiParams);
                const riskLabels: Record<string, { color: string; text: string }> = {
                  'Low': { color: 'bg-green-500', text: 'Low' },
                  'Medium': { color: 'bg-yellow-500', text: 'Medium' },
                  'Medium-High': { color: 'bg-orange-500', text: 'M-High' },
                  'High': { color: 'bg-red-500', text: 'High' },
                };
                const probLabels = ['1 (Raro)', '2 (Improbable)', '3 (Posible)', '4 (Probable)', '5 (Frecuente)'];
                const consLabels = ['1 (Menor)', '2 (Moderado)', '3 (Significativo)', '4 (Severo)', '5 (Catastrófico)'];

                return (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Matriz de Riesgo 5×5</h3>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr>
                            <th className="p-1 text-[10px] text-gray-500 font-semibold w-16">Prob ↓ / Consec →</th>
                            {consLabels.map((l, i) => (
                              <th key={i} className="p-1 text-[10px] text-gray-600 font-semibold text-center w-14">{l}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {rbiResult.riskMatrix.map((row, pi) => (
                            <tr key={pi}>
                              <td className="p-1 text-[10px] text-gray-500 font-semibold">{probLabels[pi]}</td>
                              {row.map((score, ci) => {
                                const level: RBIResult['riskLevel'] = 
                                  score >= 15 ? 'High' : score >= 10 ? 'Medium-High' : score >= 5 ? 'Medium' : 'Low';
                                const isActive = pi === rbiResult.probabilityCategory - 1 && ci === rbiResult.consequenceCategory - 1;
                                const colors: Record<string, string> = {
                                  'Low': 'bg-green-100 text-green-800',
                                  'Medium': 'bg-yellow-100 text-yellow-800',
                                  'Medium-High': 'bg-orange-100 text-orange-800',
                                  'High': 'bg-red-100 text-red-800'
                                };
                                return (
                                  <td
                                    key={ci}
                                    className={`p-2 text-center font-bold border border-gray-200 ${colors[level]} ${
                                      isActive ? 'ring-2 ring-slate-900 scale-105' : ''
                                    }`}
                                  >
                                    {isActive ? '◉' : score}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Resultado */}
                    <div className={`p-4 rounded-xl border ${
                      rbiResult.riskLevel === 'High' ? 'bg-red-50 border-red-200' :
                      rbiResult.riskLevel === 'Medium-High' ? 'bg-orange-50 border-orange-200' :
                      rbiResult.riskLevel === 'Medium' ? 'bg-yellow-50 border-yellow-200' :
                      'bg-green-50 border-green-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className={`text-xs font-bold uppercase ${
                            rbiResult.riskLevel === 'High' ? 'text-red-700' :
                            rbiResult.riskLevel === 'Medium-High' ? 'text-orange-700' :
                            rbiResult.riskLevel === 'Medium' ? 'text-yellow-700' :
                            'text-green-700'
                          }`}>
                            Nivel de Riesgo: {rbiResult.riskLevel}
                          </span>
                          <p className="text-sm font-bold text-slate-800 mt-1">
                            Probabilidad: {rbiResult.probabilityCategory}/5 · Consecuencia: {rbiResult.consequenceCategory}/5
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-gray-500 block">Frecuencia Inspección</span>
                          <span className="text-lg font-bold font-mono text-slate-900">{rbiResult.inspectionFreqYears} años</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mt-2">
                        {rbiResult.inspectionFreqYears <= 2 
                          ? 'Riesgo alto: Se requiere inspección frecuente con métodos NDT avanzados (AUT, phased array, MFL).'
                          : rbiResult.inspectionFreqYears <= 5
                            ? 'Riesgo medio: Inspección periódica con UT convencional y evaluación de espesores.'
                            : 'Riesgo bajo: Inspección rutinaria dentro del programa de integridad existente.'}
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* TAB 5: TANQUES API 653                                             */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {activeTab === 'api653' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-gray-900">Inspección y Cálculo de Vida Remanente Tanques (API 653)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-slate-50 rounded-xl border border-gray-200 space-y-3">
              <span className="text-xs font-bold text-gray-500 uppercase">Tanque de Almacenamiento</span>
              <p className="text-sm font-bold text-slate-900">TK-102 (Patios de Almacenamiento Anaco)</p>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Espesor Mínimo Fondo (mm)</label>
                <input
                  type="number"
                  value={3.2}
                  onChange={() => {}}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs font-mono"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-gray-200 space-y-3">
              <span className="text-xs font-bold text-gray-500 uppercase">Velocidad de Corrosión</span>
              <p className="text-lg font-bold font-mono text-emerald-700">0.22 mm/año</p>
              <p className="text-xs text-gray-500">Estimado con historial de ultrasonido de fondo (UT MFL).</p>
            </div>

            <div className="p-4 bg-slate-900 text-white rounded-xl space-y-3">
              <span className="text-xs font-bold text-emerald-400 uppercase">Intervalo Máximo Próxima Inspección</span>
              <p className="text-2xl font-bold font-mono">4.5 Años</p>
              <p className="text-[11px] text-slate-300">Cumple con criterio de inspección interna API 653 Secc. 6.4.</p>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* TAB 6: TUBERÍAS DE PROCESO API 570                                */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {activeTab === 'api570' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Tuberías de Proceso y Puntos CML (API 570)</h2>
          <p className="text-xs text-gray-500">
            Monitoreo de espesores por corrosión en codos, reducciones e inyecciones químicas.
          </p>
          <div className="p-4 bg-slate-50 rounded-xl border border-gray-200 text-xs text-gray-600">
            Puntos CML verificados en la última parada de planta: 100% conformes con espesor t_min requerido.
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white border border-gray-200 rounded-xl">
              <span className="text-[10px] font-bold text-gray-500 uppercase">CML-01 :: Línea de Crudo</span>
              <p className="text-sm font-bold mt-1">6.35 mm t_min · 7.82 mm medido</p>
              <p className="text-[10px] text-green-600 mt-1">✅ Aprobado</p>
            </div>
            <div className="p-4 bg-white border border-gray-200 rounded-xl">
              <span className="text-[10px] font-bold text-gray-500 uppercase">CML-02 :: Línea de Gas</span>
              <p className="text-sm font-bold mt-1">4.78 mm t_min · 5.12 mm medido</p>
              <p className="text-[10px] text-green-600 mt-1">✅ Aprobado</p>
            </div>
            <div className="p-4 bg-white border border-gray-200 rounded-xl">
              <span className="text-[10px] font-bold text-gray-500 uppercase">CML-03 :: Inyección Química</span>
              <p className="text-sm font-bold mt-1">3.96 mm t_min · 4.01 mm medido</p>
              <p className="text-[10px] text-yellow-600 mt-1">⚠️ Monitorear</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
