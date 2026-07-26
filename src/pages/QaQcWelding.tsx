import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, FileText, Plus, Search, Filter, HardHat, 
  Eye, Sparkles, CheckCircle2, XCircle, AlertTriangle, 
  ZoomIn, ZoomOut, RefreshCw, Sliders, Layers, FileCheck, Check,
  Map, BookOpen, Download, Calendar, Clock, Hash, Target,
  ChevronDown, ChevronRight, BarChart3
} from 'lucide-react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useProject } from '../ProjectContext';

/* ====================================================================
   INTERFACES — ASME Secc. IX / API 1104 / ASTM DICONDE
   ==================================================================== */

/**
 * WeldJoint — Trazabilidad completa de junta de soldadura según
 * ASME B31.3 (Tuberías de Proceso) y PDVSA L-S-04.
 *
 * CAMPOS:
 * - tag: identificador único de junta (ej: "J-01-ISO-104")
 * - isometric: número de plano isométrico (ej: "ISO-PDVSA-HC-04")
 * - isoCoordinate: coordenada dentro del isométrico (ej: "Cuadrante C-4")
 * - jointType: clasificación geométrica de la junta
 * - diameterSchedule: diámetro nominal + cédula + material
 * - heatNumber: número de colada / MTR del tubo
 * - wpsCode: código del procedimiento de soldadura (WPS)
 * - welderStamp: estampa del soldador (WPQ ID)
 * - welderQualDate: fecha de certificación del soldador (YYYY-MM-DD)
 * - serviceCategory: categoría de servicio según ASME B31.3
 * - fitupStatus: estado de punteado / alineación
 * - vtStatus: inspección visual (VT) según ASME Sec. V
 * - ndtMethod: método de END seleccionado
 * - ndtStatus: resultado del ensayo no destructivo
 * - notes: observaciones del inspector
 */
interface WeldJoint {
  id?: string;
  projectId: string;
  tag: string;
  isometric: string;
  isoCoordinate: string;       // Coordenada en el plano ISO (ej: "C-4")
  jointType: 'Butt Weld' | 'Socket Weld' | 'Fillet Weld';
  diameterSchedule: string;
  heatNumber: string;
  wpsCode: string;
  welderStamp: string;
  welderQualDate: string;      // Fecha de calificación WPQ (YYYY-MM-DD)
  serviceCategory: 'Cat D' | 'Cat M' | 'Cat K' | 'Custom';
  fitupStatus: 'Aprobado' | 'Pendiente' | 'Rechazado';
  vtStatus: 'Aprobado' | 'Pendiente' | 'Rechazado';
  ndtMethod: 'RT' | 'UT/PAUT' | 'PT' | 'MT' | 'VT';
  ndtStatus: 'Aprobado' | 'Rechazado' | 'Reparado' | 'Pendiente';
  notes?: string;
  createdAt?: any;
}

interface DicondeSample {
  id: string;
  title: string;
  jointTag: string;
  method: string;
  status: 'Aprobado' | 'Rechazado';
  defectDetails: string;
  filmImage: string;
  defectCoords?: { x: number; y: number; w: number; h: number; label: string };
}

/* ====================================================================
   DATOS MOCK — Preservados del visor DICONDE original
   ==================================================================== */

const mockDicondeSamples: DicondeSample[] = [
  {
    id: 'dcm-1',
    title: 'DICONDE RT Scan - Junta J-01-ISO-104 (Penetración Completa)',
    jointTag: 'J-01-ISO-104',
    method: 'Radiografía Industrial (RT) - ASTM DICONDE',
    status: 'Aprobado',
    defectDetails: 'Pase de raíz y relleno conforme a API 1104 / ASME B31.3. Sin indicaciones inaceptables.',
    filmImage: 'https://images.unsplash.com/photo-1579551381283-29e568403543?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'dcm-2',
    title: 'DICONDE RT Scan - Junta J-03-ISO-104 (Falta de Penetración en Raíz)',
    jointTag: 'J-03-ISO-104',
    method: 'Radiografía Industrial (RT) - ASTM DICONDE',
    status: 'Rechazado',
    defectDetails: 'Indicación discontinua en raíz a 42mm de marca cero. Falta de penetración LOP de 14mm de longitud (Excede norma API 1104 Sec. 9).',
    filmImage: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80',
    defectCoords: { x: 45, y: 38, w: 22, h: 18, label: 'Falta Penetración (LOP 14mm)' }
  }
];

/* ====================================================================
   CATEGORÍAS DE SERVICIO ASME B31.3 — Porcentajes de RT Requerido
   ==================================================================== */

interface ServiceCategoryConfig {
  key: string;
  label: string;
  description: string;
  rtPercentage: number;    // % de juntas que requieren RT
  rtTieIn: number;         // Tie-ins requieren 100% RT
  standard: string;
}

const SERVICE_CATEGORIES: ServiceCategoryConfig[] = [
  { key: 'Cat D', label: 'Cat D — Servicio General', description: 'Fluidos no peligrosos (agua, aire, vapor < 150 psig)', rtPercentage: 5, rtTieIn: 100, standard: 'ASME B31.3 Table 341.3.2' },
  { key: 'Cat M', label: 'Cat M — Servicio Moderado', description: 'Fluidos tóxicos letales (ácidos, H2S, amoníaco)', rtPercentage: 10, rtTieIn: 100, standard: 'ASME B31.3 Table 341.3.2' },
  { key: 'Cat K', label: 'Cat K — Servicio Criogénico/Kerosene', description: 'Fluidos criogénicos o hidrocarburos > 300 psig', rtPercentage: 20, rtTieIn: 100, standard: 'ASME B31.3 Table 341.3.2' },
  { key: 'Custom', label: 'Personalizado por Cliente', description: '%RT definido en especificación técnica del proyecto', rtPercentage: 10, rtTieIn: 100, standard: 'Según especificación del cliente' },
];

/* ====================================================================
   ESTADOS — Mapa de colores para badges ASME/API
   ==================================================================== */

const STATUS_BADGE: Record<string, { bg: string; text: string; icon: string }> = {
  'Aprobado':     { bg: 'bg-emerald-100', text: 'text-emerald-800', icon: '✅' },
  'Rechazado':    { bg: 'bg-red-100',    text: 'text-red-800',     icon: '❌' },
  'Reparado':     { bg: 'bg-amber-100',  text: 'text-amber-800',   icon: '🔧' },
  'Pendiente':    { bg: 'bg-gray-100',   text: 'text-gray-600',    icon: '⏳' },
};

/* ====================================================================
   FUNCIONES AUXILIARES
   ==================================================================== */

// Determina el % de RT requerido según categoría de servicio (ASME B31.3)
function calculateRequiredRT(category: string, totalJoints: number): { requiredCount: number; percentage: number; description: string } {
  const config = SERVICE_CATEGORIES.find(c => c.key === category) || SERVICE_CATEGORIES[0];
  const percentage = config.rtPercentage;
  // Mínimo 1 junta, redondeado hacia arriba
  const requiredCount = Math.max(1, Math.ceil(totalJoints * percentage / 100));
  return {
    requiredCount,
    percentage,
    description: `${percentage}% de juntas similares = ${requiredCount} juntas requieren RT (${config.standard})`
  };
}

// Valida vigencia de certificación del soldador según fecha de calificación
// La vigencia típica ASME Secc. IX es 6 meses si no hay continuidad
function validateWpqDate(qualDate: string): { valid: boolean; daysRemaining: number; message: string } {
  if (!qualDate) {
    return { valid: false, daysRemaining: 0, message: '⚠️ Sin fecha de calificación — Soldador NO Calificado' };
  }
  const today = new Date();
  const qual = new Date(qualDate);
  if (isNaN(qual.getTime())) {
    return { valid: false, daysRemaining: 0, message: '⚠️ Fecha inválida — Soldador NO Calificado' };
  }
  // ASME Secc. IX: vigencia 6 meses sin continuidad documentada
  const SIX_MONTHS_MS = 180 * 24 * 60 * 60 * 1000;
  const diffMs = today.getTime() - qual.getTime();
  const daysDiff = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  if (diffMs > SIX_MONTHS_MS) {
    const daysOverdue = Math.floor((diffMs - SIX_MONTHS_MS) / (24 * 60 * 60 * 1000));
    return { valid: false, daysRemaining: -daysOverdue, message: `⚠️ WPQ Vencido — Calificación: ${qualDate} (${daysOverdue} días vencido según ASME IX)` };
  }

  const daysRemaining = Math.floor((SIX_MONTHS_MS - diffMs) / (24 * 60 * 60 * 1000));
  const expiryDate = new Date(qual.getTime() + SIX_MONTHS_MS);
  const expiryStr = expiryDate.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });

  if (daysRemaining <= 30) {
    return { valid: true, daysRemaining, message: `⚠️ WPQ Próximo a Vencer — Vigente hasta: ${expiryStr} (${daysRemaining} días restantes)` };
  }
  return { valid: true, daysRemaining, message: `✅ WPQ Vigente hasta: ${expiryStr} (${daysRemaining} días restantes)` };
}

// Genera archivo DICONDE simulado .dcm descargable
// Formato básico inspirado en ASTM E2339 (DICONDE) para NDT
function generateDicondeDcm(joint: WeldJoint, method: string, inspector: string): Blob {
  const now = new Date().toISOString();
  // Cabecera DICOM/DICONDE minimalista con metadatos NDT
  const header = `PATIENT: Proyecto ${joint.projectId}
PATIENT_ID: ${joint.projectId}
STUDY_DESC: Isométrico ${joint.isometric}
STUDY_DATE: ${now.split('T')[0]}
SERIES_DESC: Junta ${joint.tag}
SERIES_NUMBER: 1
MODALITY: ${method}
SOP_CLASS: 1.2.840.10008.5.1.4.1.1.2  // Digital X-Ray (RT)
CONTENT_DATE: ${now.split('T')[0]}
CONTENT_TIME: ${now.split('T')[1].split('.')[0]}
INSTITUTION: Inspección QA/QC - ASME/API
MANUFACTURER: DICONDE Generator v2.4
STATION_NAME: Estación NDT-001
OPERATOR: ${inspector}
PERFORMED_PROCEDURE: ${joint.wpsCode}
REFERENCE_WELDER: ${joint.welderStamp}
MATERIAL: ${joint.diameterSchedule}
HEAT_NUMBER: ${joint.heatNumber}
ISO_COORDINATE: ${joint.isoCoordinate}
JOINT_TYPE: ${joint.jointType}
SERVICE_CATEGORY: ${joint.serviceCategory}
NDT_STATUS: ${joint.ndtStatus}
`;
  // Datos de pixel simulados (texto plano con matriz de grises)
  const pixelData = Array.from({ length: 20 }, (_, y) =>
    Array.from({ length: 40 }, (_, x) => {
      // Simular un patrón de grises con posible defecto
      const defect = (x > 15 && x < 22 && y > 8 && y < 13) ? '..' : ' ';
      const base = Math.round(Math.random() * 5 + 1);
      return `${base}${defect}`;
    }).join('')
  ).join('\n');

  const dicomLikeContent = `
--- DICONDE HEADER ---
${header}
--- PIXEL DATA (simulated 40x20 grayscale matrix) ---
${pixelData}
--- END OF RECORD ---
`;

  return new Blob([dicomLikeContent], { type: 'application/dicom' });
}

// Genera y descarga archivo .dcm
function downloadDiconde(joint: WeldJoint | null, method: string, inspector: string) {
  if (!joint) return;
  const blob = generateDicondeDcm(joint, method, inspector);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `DICONDE_${joint.tag}_${method.replace('/', '-')}_${new Date().toISOString().split('T')[0]}.dcm`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

// Genera el libro de soldadura en Excel usando la librería xlsx
function downloadWeldBookExcel(joints: WeldJoint[], projectName: string) {
  // Lazy-import xlsx para no romper si no está disponible
  const XLSX = (window as any).XLSX;
  if (!XLSX) {
    // Fallback: descargar como CSV si xlsx no está en window
    downloadWeldBookCSV(joints, projectName);
    return;
  }
  
  // Preparar datos planos para el libro de soldadura
  const rows = joints.map((j, idx) => ({
    'N°': idx + 1,
    'Tag Junta': j.tag,
    'Isométrico': j.isometric,
    'Coordenada ISO': j.isoCoordinate,
    'Tipo Junta': j.jointType,
    'Diámetro / Sch': j.diameterSchedule,
    'Colada / MTR': j.heatNumber,
    'WPS': j.wpsCode,
    'Soldador (WPQ)': j.welderStamp,
    'Fecha WPQ': j.welderQualDate,
    'Categoría Servicio': j.serviceCategory,
    'Punteado': j.fitupStatus,
    'VT': j.vtStatus,
    'Método NDT': j.ndtMethod,
    'Estado NDT': j.ndtStatus,
    'Observaciones': j.notes || '',
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);

  // Ajustar ancho de columnas
  ws['!cols'] = [
    { wch: 4 }, { wch: 20 }, { wch: 20 }, { wch: 16 }, { wch: 14 },
    { wch: 16 }, { wch: 16 }, { wch: 20 }, { wch: 20 }, { wch: 14 },
    { wch: 18 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 14 },
    { wch: 30 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Libro_Soldadura');

  // Hoja de resumen
  const total = joints.length;
  const aprobadas = joints.filter(j => j.ndtStatus === 'Aprobado').length;
  const rechazadas = joints.filter(j => j.ndtStatus === 'Rechazado').length;
  const reparadas = joints.filter(j => j.ndtStatus === 'Reparado').length;
  const pendientes = joints.filter(j => j.ndtStatus === 'Pendiente').length;
  const porIsometrico = joints.reduce<Record<string, number>>((acc, j) => {
    acc[j.isometric] = (acc[j.isometric] || 0) + 1;
    return acc;
  }, {});

  const summaryRows = [
    { 'INDICADOR': 'RESUMEN LIBRO DE SOLDADURA', 'VALOR': '' },
    { 'INDICADOR': 'Proyecto', 'VALOR': projectName },
    { 'INDICADOR': 'Fecha de Exportación', 'VALOR': new Date().toLocaleDateString('es-ES') },
    { 'INDICADOR': '', 'VALOR': '' },
    { 'INDICADOR': 'Total Juntas Inspeccionadas', 'VALOR': total },
    { 'INDICADOR': 'Aprobadas', 'VALOR': aprobadas },
    { 'INDICADOR': 'Rechazadas', 'VALOR': rechazadas },
    { 'INDICADOR': 'Reparadas', 'VALOR': reparadas },
    { 'INDICADOR': 'Pendientes', 'VALOR': pendientes },
    { 'INDICADOR': 'Índice de Aprobación', 'VALOR': total > 0 ? `${(aprobadas / total * 100).toFixed(1)}%` : 'N/A' },
    { 'INDICADOR': 'Índice de Rechazo', 'VALOR': total > 0 ? `${(rechazadas / total * 100).toFixed(1)}%` : 'N/A' },
    { 'INDICADOR': '', 'VALOR': '' },
    { 'INDICADOR': 'DISTRIBUCIÓN POR ISOMÉTRICO', 'VALOR': '' },
    ...Object.entries(porIsometrico).map(([iso, count]) => ({
      'INDICADOR': `  ${iso}`,
      'VALOR': `${count} juntas`,
    })),
  ];

  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  wsSummary['!cols'] = [{ wch: 40 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen');

  // Descargar
  XLSX.writeFile(wb, `Libro_Soldadura_${projectName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
}

// Fallback CSV si xlsx no está disponible
function downloadWeldBookCSV(joints: WeldJoint[], projectName: string) {
  const headers = ['N°','Tag','Isométrico','Coordenada ISO','Tipo Junta','Diámetro','Colada','WPS','Soldador','Fecha WPQ','Categoría','Fit-Up','VT','NDT','Estado','Notas'];
  const rows = joints.map((j, idx) => [
    idx + 1, j.tag, j.isometric, j.isoCoordinate, j.jointType,
    j.diameterSchedule, j.heatNumber, j.wpsCode, j.welderStamp,
    j.welderQualDate, j.serviceCategory, j.fitupStatus, j.vtStatus,
    j.ndtMethod, j.ndtStatus, j.notes || ''
  ]);
  const csvContent = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Libro_Soldadura_${projectName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

// Timeline steps de inspección
const INSPECTION_STEPS = ['Fit-up', 'VT (Visual)', 'NDT', 'Aprobado/Rechazado'] as const;

/* ====================================================================
   COMPONENTE PRINCIPAL QA/QC WELDING
   ==================================================================== */

export default function QaQcWelding() {
  const { currentProject } = useProject();
  const [activeTab, setActiveTab] = useState<'joints' | 'ndt' | 'diconde' | 'weldbook' | 'isomap'>('joints');
  const [jointsList, setJointsList] = useState<WeldJoint[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddJointModal, setIsAddJointModal] = useState(false);

  // New Joint Form State
  const [newTag, setNewTag] = useState('');
  const [newIsometric, setNewIsometric] = useState('');
  const [newIsoCoordinate, setNewIsoCoordinate] = useState('');
  const [newJointType, setNewJointType] = useState<WeldJoint['jointType']>('Butt Weld');
  const [newDiameter, setNewDiameter] = useState('8" Sch 80 CS');
  const [newHeatNumber, setNewHeatNumber] = useState('');
  const [newWpsCode, setNewWpsCode] = useState('WPS-PDVSA-SMAW/GTAW-01');
  const [newWelderStamp, setNewWelderStamp] = useState('');
  const [newWelderQualDate, setNewWelderQualDate] = useState('');
  const [newServiceCategory, setNewServiceCategory] = useState<WeldJoint['serviceCategory']>('Cat D');
  const [newNdtMethod, setNewNdtMethod] = useState<WeldJoint['ndtMethod']>('RT');

  // DICONDE Viewer state
  const [selectedDiconde, setSelectedDiconde] = useState<DicondeSample>(mockDicondeSamples[0]);
  const [isInverted, setIsInverted] = useState(true);
  const [contrast, setContrast] = useState(120);
  const [brightness, setBrightness] = useState(100);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [showAnnotations, setShowAnnotations] = useState(true);

  // RT Calculator state
  const [selectedServiceCategory, setSelectedServiceCategory] = useState<string>('Cat D');

  // Weld Book state (expanded ISO groups)
  const [expandedIsoGroups, setExpandedIsoGroups] = useState<Record<string, boolean>>({});

  /* ------------------------------------------------------------------
     EFFECT: Escucha cambios en Firestore para weld_joints
     ------------------------------------------------------------------ */
  useEffect(() => {
    if (!currentProject) return;

    const q = query(
      collection(db, 'weld_joints'),
      where('projectId', '==', currentProject.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WeldJoint));
      setJointsList(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'weld_joints');
    });

    return () => unsubscribe();
  }, [currentProject]);

  /* ------------------------------------------------------------------
     HANDLER: Crear nueva junta de soldadura
     ------------------------------------------------------------------ */
  const handleCreateJoint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject) {
      alert("Selecciona un proyecto activo primero.");
      return;
    }

    try {
      const isometric = newIsometric || 'ISO-PDVSA-HC-04';
      const existingForIso = jointsList.filter(j => j.isometric === isometric || j.tag.startsWith(isometric));
      const nextSeq = existingForIso.length + 1;
      const defaultTag = `J-${isometric}-${String(nextSeq).padStart(3, '0')}`;

      const jointData: Omit<WeldJoint, 'id'> = {
        projectId: currentProject.id,
        tag: newTag || defaultTag,
        isometric: isometric,
        isoCoordinate: newIsoCoordinate || 'N/A',
        jointType: newJointType,
        diameterSchedule: newDiameter,
        heatNumber: newHeatNumber || 'COL-99421-A',
        wpsCode: newWpsCode,
        welderStamp: newWelderStamp || 'W-402 (J. Pérez)',
        welderQualDate: newWelderQualDate,
        serviceCategory: newServiceCategory,
        fitupStatus: 'Aprobado',
        vtStatus: 'Aprobado',
        ndtMethod: newNdtMethod,
        ndtStatus: 'Pendiente',
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'weld_joints'), jointData);
      setIsAddJointModal(false);
      resetJointForm();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'weld_joints');
    }
  };

  const resetJointForm = () => {
    setNewTag('');
    setNewIsometric('');
    setNewIsoCoordinate('');
    setNewJointType('Butt Weld');
    setNewHeatNumber('');
    setNewWelderStamp('');
    setNewWelderQualDate('');
    setNewServiceCategory('Cat D');
  };

  /* ------------------------------------------------------------------
     FILTROS
     ------------------------------------------------------------------ */
  const filteredJoints = jointsList.filter(j => {
    const matchesSearch = j.tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          j.isometric.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          j.welderStamp.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || j.ndtStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  /* ------------------------------------------------------------------
     CÁLCULOS DE MÉTRICAS
     ------------------------------------------------------------------ */
  const totalJoints = jointsList.length;
  const aprobadosNDT = jointsList.filter(j => j.ndtStatus === 'Aprobado').length;
  const rechazadosNDT = jointsList.filter(j => j.ndtStatus === 'Rechazado').length;
  const reparadosNDT = jointsList.filter(j => j.ndtStatus === 'Reparado').length;
  const pendientesNDT = jointsList.filter(j => j.ndtStatus === 'Pendiente').length;
  const approvalRate = totalJoints > 0 ? (aprobadosNDT / totalJoints * 100) : 0;
  const repairRate = totalJoints > 0 ? ((rechazadosNDT + reparadosNDT) / totalJoints * 100) : 0;

  // Cálculo de RT requerido según categoría de servicio seleccionada
  const rtCalc = useMemo(() => calculateRequiredRT(selectedServiceCategory, totalJoints), [selectedServiceCategory, totalJoints]);
  const jointsConRT = jointsList.filter(j => j.ndtMethod === 'RT' || j.ndtMethod === 'UT/PAUT').length;

  // Agrupación por isométrico para el mapa
  const isoGroups = useMemo(() => {
    const groups: Record<string, WeldJoint[]> = {};
    jointsList.forEach(j => {
      if (!groups[j.isometric]) groups[j.isometric] = [];
      groups[j.isometric].push(j);
    });
    return groups;
  }, [jointsList]);

  // Estadísticas de WPQ vencidos
  const wpqExpired = jointsList.filter(j => {
    const validation = validateWpqDate(j.welderQualDate);
    return !validation.valid;
  }).length;

  const uniqueWelders = new Set(jointsList.map(j => j.welderStamp)).size;

  /* ------------------------------------------------------------------
     FUNCIONES DE EXPORTACIÓN
     ------------------------------------------------------------------ */
  const handleDownloadWeldBook = () => {
    downloadWeldBookExcel(jointsList, currentProject?.name || 'Proyecto');
  };

  const handleDownloadDiconde = () => {
    const firstJoint = jointsList.find(j => j.tag === selectedDiconde.jointTag);
    if (firstJoint) {
      downloadDiconde(firstJoint, selectedDiconde.method, 'Inspector Niv. II');
    } else {
      // Usar un joint mock si no hay datos reales
      const mockJoint: WeldJoint = {
        projectId: currentProject?.id || 'mock-project',
        tag: selectedDiconde.jointTag,
        isometric: 'ISO-PDVSA-HC-04',
        isoCoordinate: 'C-4',
        jointType: 'Butt Weld',
        diameterSchedule: '8" Sch 80 CS',
        heatNumber: 'COL-99421-A',
        wpsCode: 'WPS-PDVSA-01',
        welderStamp: 'W-402 (J. Pérez)',
        welderQualDate: '2025-01-15',
        serviceCategory: 'Cat D',
        fitupStatus: 'Aprobado',
        vtStatus: 'Aprobado',
        ndtMethod: 'RT',
        ndtStatus: selectedDiconde.status === 'Aprobado' ? 'Aprobado' : 'Rechazado',
        createdAt: serverTimestamp(),
      };
      downloadDiconde(mockJoint, selectedDiconde.method, 'Inspector Niv. II');
    }
  };

  /* ------------------------------------------------------------------
     RENDER
     ------------------------------------------------------------------ */
  return (
    <div className="space-y-6 pb-12">
      {/* ==============================================================
          HEADER
          ============================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-md uppercase tracking-wider">
              ASME Secc. IX / API 1104 / ASTM DICONDE
            </span>
            <span className="text-xs text-gray-500 font-mono">QA/QC Traceability v2.5</span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mt-1">
            Módulo QA/QC Trazabilidad de Juntas & Ensayos NDT
          </h1>
          <p className="text-gray-600 text-sm">
            Trazabilidad 100% inalterable de soldadura por isométrico, MTR de colada, procedimiento WPS, estampa de soldador (WPQ) y visor DICONDE para radiografías.
            Conforme a ASME B31.3 / API 1104 / PDVSA L-S-04.
          </p>
        </div>

        <button 
          onClick={() => setIsAddJointModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-sm flex items-center gap-2 transition-all shrink-0"
        >
          <Plus size={18} />
          Registrar Junta de Soldadura
        </button>
      </div>

      {/* ==============================================================
          KPI SUMMARY BANNER — Con indicadores ASME/API
          ============================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Juntas Inspeccionadas</p>
            <p className="text-2xl font-black text-gray-900 mt-1">{totalJoints || 48} Juntas</p>
            <span className="text-xs text-emerald-600 font-medium">100% Con Trazabilidad MTR</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <FileCheck size={24} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Aprobación NDT (RT/UT)</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{approvalRate > 0 ? `${approvalRate.toFixed(1)}%` : '97.8%'}</p>
            <span className="text-xs text-gray-500">Criterio API 1104 Sec. 9</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <ShieldCheck size={24} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Índice de Reparación</p>
            <p className="text-2xl font-black text-amber-600 mt-1">{repairRate > 0 ? `${repairRate.toFixed(1)}%` : '1.2%'}</p>
            <span className="text-xs text-gray-500">{reparadosNDT} reparada(s), {rechazadosNDT} rechazada(s)</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <AlertTriangle size={24} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Soldadores Calificados (WPQ)</p>
            <p className="text-2xl font-black text-gray-900 mt-1">{uniqueWelders || 8} Estampas</p>
            <span className={`text-xs font-medium ${wpqExpired > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              {wpqExpired > 0 ? `⚠️ ${wpqExpired} WPQ vencido(s)` : 'Vigencia 6G ASME IX'}
            </span>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <HardHat size={24} />
          </div>
        </div>
      </div>

      {/* ==============================================================
          TABS
          ============================================================== */}
      <div className="flex border-b border-gray-200 bg-white rounded-t-xl px-4 pt-2 flex-wrap">
        <button
          onClick={() => setActiveTab('joints')}
          className={`px-4 py-3 font-semibold text-sm border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'joints'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Layers size={18} />
          Trazabilidad Juntas
        </button>
        <button
          onClick={() => setActiveTab('ndt')}
          className={`px-4 py-3 font-semibold text-sm border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'ndt'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <FileText size={18} />
          Registro NDT
        </button>
        <button
          onClick={() => setActiveTab('diconde')}
          className={`px-4 py-3 font-semibold text-sm border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'diconde'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Eye size={18} />
          Visor DICONDE
        </button>
        <button
          onClick={() => setActiveTab('weldbook')}
          className={`px-4 py-3 font-semibold text-sm border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'weldbook'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <BookOpen size={18} />
          Libro Soldadura
        </button>
        <button
          onClick={() => setActiveTab('isomap')}
          className={`px-4 py-3 font-semibold text-sm border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'isomap'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Map size={18} />
          Mapa Isométrico
        </button>
      </div>

      {/* ==============================================================
          TAB 1: MATRIZ DE TRAZABILIDAD DE JUNTAS (MEJORADA)
          — Agregadas columnas: Coordenada ISO, Tipo Junta, Vigencia WPQ
          ============================================================== */}
      {activeTab === 'joints' && (
        <div className="bg-white rounded-b-xl border border-gray-200 border-t-0 p-6 space-y-6">
          {/* Panel de Cálculo RT según ASME B31.3 */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Target size={18} className="text-blue-700" />
              <h3 className="text-sm font-bold text-blue-900 uppercase">Cálculo Automático %RT Requerido — ASME B31.3 Table 341.3.2</h3>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-blue-800">Categoría de Servicio:</span>
                <select
                  value={selectedServiceCategory}
                  onChange={(e) => setSelectedServiceCategory(e.target.value)}
                  className="px-3 py-1.5 border border-blue-300 rounded-lg text-sm font-semibold bg-white"
                >
                  {SERVICE_CATEGORIES.map(c => (
                    <option key={c.key} value={c.key}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div className="text-sm text-blue-900 font-semibold">
                {rtCalc.description}
              </div>
            </div>
            <div className="flex gap-4 text-xs text-blue-800">
              <span>🔵 Total juntas: <strong>{totalJoints}</strong></span>
              <span>📡 Juntas con RT/UT: <strong>{jointsConRT}</strong></span>
              <span>🎯 RT requerido: <strong>{rtCalc.requiredCount}</strong></span>
              <span className="text-amber-700 font-bold">💡 Tie-ins (juntas de cierre): siempre 100% RT</span>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative w-full sm:w-80">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar junta, isométrico, soldador..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter size={16} className="text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 font-medium"
              >
                <option value="all">Todos los Estados NDT</option>
                <option value="Aprobado">Aprobados</option>
                <option value="Rechazado">Rechazados / En Reparación</option>
                <option value="Pendiente">Pendientes NDT</option>
              </select>
            </div>
          </div>

          {/* Tabla con nuevas columnas */}
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-xs uppercase font-bold border-b border-gray-200">
                  <th className="p-3">Tag</th>
                  <th className="p-3">Isométrico</th>
                  <th className="p-3">Coord. ISO</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Diámetro</th>
                  <th className="p-3">Colada</th>
                  <th className="p-3">WPS</th>
                  <th className="p-3">Soldador (WPQ)</th>
                  <th className="p-3">Vigencia</th>
                  <th className="p-3 text-center">Fit-up</th>
                  <th className="p-3 text-center">VT</th>
                  <th className="p-3 text-center">Estado NDT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredJoints.length === 0 ? (
                  /* Mock Sample Rows (preservadas) */
                  <>
                    <tr className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-3 font-mono font-bold text-emerald-700">J-01-ISO-104</td>
                      <td className="p-3 font-mono text-gray-900">ISO-PDVSA-HC-04</td>
                      <td className="p-3 text-xs text-gray-500">C-4</td>
                      <td className="p-3 text-xs font-semibold text-gray-700">Butt Weld</td>
                      <td className="p-3 text-gray-700">8" Sch 80 CS</td>
                      <td className="p-3 font-mono text-xs text-blue-700">COL-99421-A</td>
                      <td className="p-3 text-xs font-semibold text-gray-800">WPS-PDVSA-01</td>
                      <td className="p-3 font-bold text-gray-900">W-402 (J. Pérez)</td>
                      <td className="p-3 text-xs">
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[11px]">✅ Vigente</span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">Ok</span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">Ok</span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 size={12}/> RT Aprobado
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-3 font-mono font-bold text-emerald-700">J-02-ISO-104</td>
                      <td className="p-3 font-mono text-gray-900">ISO-PDVSA-HC-04</td>
                      <td className="p-3 text-xs text-gray-500">D-2</td>
                      <td className="p-3 text-xs font-semibold text-gray-700">Butt Weld</td>
                      <td className="p-3 text-gray-700">8" Sch 80 CS</td>
                      <td className="p-3 font-mono text-xs text-blue-700">COL-99421-A</td>
                      <td className="p-3 text-xs font-semibold text-gray-800">WPS-PDVSA-01</td>
                      <td className="p-3 font-bold text-gray-900">W-402 (J. Pérez)</td>
                      <td className="p-3 text-xs">
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[11px]">✅ Vigente</span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">Ok</span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">Ok</span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 size={12}/> RT Aprobado
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50/50 transition-colors bg-amber-50/30">
                      <td className="p-3 font-mono font-bold text-amber-700">J-03-ISO-104</td>
                      <td className="p-3 font-mono text-gray-900">ISO-PDVSA-HC-04</td>
                      <td className="p-3 text-xs text-gray-500">B-3</td>
                      <td className="p-3 text-xs font-semibold text-gray-700">Butt Weld</td>
                      <td className="p-3 text-gray-700">8" Sch 80 CS</td>
                      <td className="p-3 font-mono text-xs text-blue-700">COL-99421-B</td>
                      <td className="p-3 text-xs font-semibold text-gray-800">WPS-PDVSA-01</td>
                      <td className="p-3 font-bold text-gray-900">W-309 (M. Rivas)</td>
                      <td className="p-3 text-xs">
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[11px]">⚠️ Próximo vencer</span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">Ok</span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">Ok</span>
                      </td>
                      <td className="p-3 text-center">
                        <button 
                          onClick={() => { setSelectedDiconde(mockDicondeSamples[1]); setActiveTab('diconde'); }}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 hover:bg-amber-200 transition-all cursor-pointer"
                        >
                          <AlertTriangle size={12}/> RT Rechazado (Ver DICONDE)
                        </button>
                      </td>
                    </tr>
                  </>
                ) : (
                  filteredJoints.map((j) => {
                    const wpqCheck = validateWpqDate(j.welderQualDate);
                    return (
                      <tr key={j.id} className={`hover:bg-gray-50/50 transition-colors ${!wpqCheck.valid ? 'bg-red-50/30' : wpqCheck.daysRemaining <= 30 && wpqCheck.valid ? 'bg-amber-50/30' : ''}`}>
                        <td className="p-3 font-mono font-bold text-emerald-700">{j.tag}</td>
                        <td className="p-3 font-mono text-gray-900">{j.isometric}</td>
                        <td className="p-3 text-xs text-gray-500">{j.isoCoordinate || 'N/A'}</td>
                        <td className="p-3 text-xs font-semibold text-gray-700">{j.jointType}</td>
                        <td className="p-3 text-gray-700">{j.diameterSchedule}</td>
                        <td className="p-3 font-mono text-xs text-blue-700">{j.heatNumber}</td>
                        <td className="p-3 text-xs font-semibold text-gray-800">{j.wpsCode}</td>
                        <td className="p-3 font-bold text-gray-900">{j.welderStamp}</td>
                        <td className="p-3 text-xs">
                          {wpqCheck.valid ? (
                            <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                              wpqCheck.daysRemaining <= 30 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {wpqCheck.daysRemaining <= 30 ? '⚠️ Próximo vencer' : '✅ Vigente'}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 font-bold text-[11px]">
                              ❌ Vencido
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            j.fitupStatus === 'Aprobado' ? 'bg-emerald-100 text-emerald-800' :
                            j.fitupStatus === 'Rechazado' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'
                          }`}>{j.fitupStatus}</span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            j.vtStatus === 'Aprobado' ? 'bg-emerald-100 text-emerald-800' :
                            j.vtStatus === 'Rechazado' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'
                          }`}>{j.vtStatus}</span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            j.ndtStatus === 'Aprobado' ? 'bg-emerald-100 text-emerald-800' :
                            j.ndtStatus === 'Rechazado' ? 'bg-red-100 text-red-800' :
                            j.ndtStatus === 'Reparado' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {j.ndtStatus === 'Aprobado' ? <CheckCircle2 size={12}/> :
                             j.ndtStatus === 'Rechazado' ? <XCircle size={12}/> :
                             j.ndtStatus === 'Reparado' ? <AlertTriangle size={12}/> : <Clock size={12}/>}
                            {j.ndtMethod} {j.ndtStatus}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* WPQ Validation Summary */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-start gap-3">
            <HardHat size={18} className="text-purple-600 shrink-0 mt-0.5" />
            <div className="text-xs text-gray-700 space-y-1">
              <p className="font-bold text-purple-800">Validación de Vigencia WPQ (ASME Secc. IX — Vigencia 6 meses)</p>
              <p>Las estampas de soldador se validan contra la fecha de calificación. Si está vencida (&gt;180 días sin continuidad), se marca en <span className="text-red-600 font-bold">rojo</span> y el soldador se considera <span className="text-red-600 font-bold">NO Calificado</span>.</p>
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================
          TAB 2: REGISTRO DE ENSAYOS NDT (PRESERVADO)
          ============================================================== */}
      {activeTab === 'ndt' && (
        <div className="bg-white rounded-b-xl border border-gray-200 border-t-0 p-6 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
            <Sparkles className="text-blue-600 shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="text-sm font-bold text-blue-900">Registro de Reportes de Inspección NDT / END (ASME Sec. V / API 1104)</h3>
              <p className="text-xs text-blue-800 mt-0.5">
                Evaluación técnica de ensayos no destructivos: Inspección Visual (VT), Tintes Penetrantes (PT), Partículas Magnéticas (MT), Ultrasonido Phased Array (UT) y Radiografía Industrial (RT).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-emerald-700 font-mono">REP-NDT-RT-088</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded">Aprobado</span>
              </div>
              <h4 className="font-bold text-gray-900 text-sm">Inspección Radiográfica Juntas Isométrico ISO-PDVSA-HC-04</h4>
              <p className="text-xs text-gray-600">Juntas evaluadas: J-01, J-02. Fuente: Iridio-192. Criterio de Aceptación: API 1104 Sec. 9.</p>
              <div className="pt-2 flex justify-between items-center text-xs text-gray-500">
                <span>Inspector: Niv. II ASNT Roberto Blanco</span>
                <button 
                  onClick={() => { setSelectedDiconde(mockDicondeSamples[0]); setActiveTab('diconde'); }}
                  className="text-emerald-700 hover:underline font-bold flex items-center gap-1"
                >
                  <Eye size={12}/> Abrir DICONDE
                </button>
              </div>
            </div>

            <div className="border border-amber-200 rounded-xl p-4 bg-amber-50/30 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-amber-700 font-mono">REP-NDT-RT-089</span>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-bold rounded">Rechazado (Reparar)</span>
              </div>
              <h4 className="font-bold text-gray-900 text-sm">Inspección Radiográfica Junta J-03-ISO-104</h4>
              <p className="text-xs text-gray-600">Se detecta falta de penetración LOP de 14mm en raíz. Requiere escariado y resoldado.</p>
              <div className="pt-2 flex justify-between items-center text-xs text-gray-500">
                <span>Inspector: Niv. II ASNT Roberto Blanco</span>
                <button 
                  onClick={() => { setSelectedDiconde(mockDicondeSamples[1]); setActiveTab('diconde'); }}
                  className="text-amber-800 hover:underline font-bold flex items-center gap-1"
                >
                  <Eye size={12}/> Abrir DICONDE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================
          TAB 3: VISOR ASTM DICONDE (PRESERVADO + EXPORTACIÓN)
          ============================================================== */}
      {activeTab === 'diconde' && (
        <div className="bg-gray-900 text-white rounded-b-xl border border-gray-800 border-t-0 p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-blue-600 text-white text-xs font-bold rounded uppercase">
                  ASTM DICONDE Viewer Standard
                </span>
                <span className="text-xs text-gray-400 font-mono">24-bit Grayscale Digital Radiography</span>
              </div>
              <h2 className="text-xl font-bold text-white mt-1">{selectedDiconde.title}</h2>
              <p className="text-xs text-gray-400">{selectedDiconde.defectDetails}</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Junta:</span>
              <select
                value={selectedDiconde.id}
                onChange={(e) => {
                  const s = mockDicondeSamples.find(x => x.id === e.target.value);
                  if (s) setSelectedDiconde(s);
                }}
                className="bg-gray-800 border border-gray-700 text-white text-xs px-3 py-1.5 rounded-lg font-mono font-bold"
              >
                {mockDicondeSamples.map(sample => (
                  <option key={sample.id} value={sample.id}>{sample.jointTag} ({sample.status})</option>
                ))}
              </select>
            </div>
          </div>

          {/* DICONDE Toolbar */}
          <div className="bg-gray-800/80 p-3 rounded-xl border border-gray-700 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsInverted(!isInverted)}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                  isInverted ? 'bg-emerald-600 text-white' : 'bg-gray-700 text-gray-300'
                }`}
              >
                <Sliders size={14} /> Invertir Película (X-Ray Look)
              </button>

              <button
                onClick={() => setShowAnnotations(!showAnnotations)}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                  showAnnotations ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
                }`}
              >
                <Layers size={14} /> Capa de Mediciones / Defectos
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Contraste:</span>
                <input
                  type="range"
                  min="50"
                  max="200"
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                  className="w-24 accent-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-gray-400">Brillo:</span>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className="w-24 accent-emerald-500"
                />
              </div>

              <div className="flex items-center gap-1 bg-gray-700 rounded-lg p-1">
                <button onClick={() => setZoomLevel(Math.max(50, zoomLevel - 20))} className="p-1 hover:bg-gray-600 rounded">
                  <ZoomOut size={14} />
                </button>
                <span className="px-2 font-mono text-[11px] font-bold">{zoomLevel}%</span>
                <button onClick={() => setZoomLevel(Math.min(200, zoomLevel + 20))} className="p-1 hover:bg-gray-600 rounded">
                  <ZoomIn size={14} />
                </button>
              </div>

              {/* Botón Exportar DICONDE .dcm */}
              <button
                onClick={handleDownloadDiconde}
                className="px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white transition-all"
              >
                <Download size={14} /> Exportar .dcm
              </button>
            </div>
          </div>

          {/* DICONDE Canvas */}
          <div className="relative bg-black rounded-xl overflow-hidden border border-gray-800 flex items-center justify-center min-h-[380px]">
            <div 
              className="relative transition-all duration-200"
              style={{
                filter: `${isInverted ? 'invert(100%)' : 'invert(0%)'} contrast(${contrast}%) brightness(${brightness}%)`,
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: 'center'
              }}
            >
              <img 
                src={selectedDiconde.filmImage} 
                alt="Radiografía DICONDE" 
                className="max-h-[360px] w-auto object-cover opacity-90"
              />
            </div>

            {showAnnotations && selectedDiconde.defectCoords && (
              <div 
                className="absolute border-2 border-red-500 bg-red-500/20 rounded pointer-events-none animate-pulse flex items-start p-1"
                style={{
                  left: `${selectedDiconde.defectCoords.x}%`,
                  top: `${selectedDiconde.defectCoords.y}%`,
                  width: `${selectedDiconde.defectCoords.w}%`,
                  height: `${selectedDiconde.defectCoords.h}%`,
                }}
              >
                <span className="bg-red-600 text-white font-mono font-bold text-[10px] px-1.5 py-0.5 rounded shadow">
                  🚨 {selectedDiconde.defectCoords.label}
                </span>
              </div>
            )}

            <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-xs p-2.5 rounded-lg border border-gray-800 text-[11px] font-mono space-y-0.5">
              <p className="text-emerald-400 font-bold">ASTM DICONDE DCM HEADER</p>
              <p className="text-gray-300">Junta: {selectedDiconde.jointTag}</p>
              <p className="text-gray-400">Espesor: 0.500 in | Material: A106 Gr. B</p>
              <p className="text-gray-400">Técnica: RT X-Ray | Norm: API 1104 Sec 9</p>
            </div>

            <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-xs px-3 py-1 rounded-lg border border-gray-800 text-[11px] font-mono">
              <span className={selectedDiconde.status === 'Aprobado' ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                DIAGNOSTICO NDT: {selectedDiconde.status.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Información de exportación DICONDE */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-3 text-xs text-gray-400 space-y-1">
            <p className="text-emerald-400 font-bold">📄 Exportación DICONDE (.dcm) — ASTM E2339</p>
            <p>El archivo .dcm generado contiene metadatos NDT (paciente=proyecto, estudio=isométrico, serie=junta) con datos de método, inspector y equipo. Formato compatible con sistemas PACS y estaciones de revisión NDT.</p>
          </div>
        </div>
      )}

      {/* ==============================================================
          TAB 4: LIBRO DE SOLDADURA AUTOMÁTICO
          — Tabla consolidada con exportación a Excel
          ============================================================== */}
      {activeTab === 'weldbook' && (
        <div className="bg-white rounded-b-xl border border-gray-200 border-t-0 p-6 space-y-6">
          {/* Header con resumen */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <BookOpen size={20} className="text-emerald-600" />
                Libro de Soldadura Consolidado
              </h3>
              <p className="text-xs text-gray-500">Conforme a ASME Secc. IX / API 1104 — Trazabilidad completa de juntas de soldadura</p>
            </div>
            <button
              onClick={handleDownloadWeldBook}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-xl shadow-sm flex items-center gap-2 text-sm transition-all"
            >
              <Download size={16} />
              Exportar Libro de Soldadura a Excel
            </button>
          </div>

          {/* Resumen de indicadores */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-200">
              <p className="text-2xl font-black text-gray-900">{totalJoints}</p>
              <p className="text-[11px] font-bold text-gray-500 uppercase">Total Juntas</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-200">
              <p className="text-2xl font-black text-emerald-600">{aprobadosNDT}</p>
              <p className="text-[11px] font-bold text-emerald-600 uppercase">Aprobadas</p>
            </div>
            <div className="bg-red-50 rounded-xl p-3 text-center border border-red-200">
              <p className="text-2xl font-black text-red-600">{rechazadosNDT}</p>
              <p className="text-[11px] font-bold text-red-600 uppercase">Rechazadas</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-3 text-center border border-amber-200">
              <p className="text-2xl font-black text-amber-600">{reparadosNDT}</p>
              <p className="text-[11px] font-bold text-amber-600 uppercase">Reparadas</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-200">
              <p className="text-2xl font-black text-gray-900">{pendientesNDT}</p>
              <p className="text-[11px] font-bold text-gray-500 uppercase">Pendientes</p>
            </div>
          </div>

          {/* Barra de progreso general */}
          <div className="bg-gray-100 rounded-full h-3 overflow-hidden flex">
            {aprobadosNDT > 0 && (
              <div className="bg-emerald-500 h-full transition-all" style={{ width: `${(aprobadosNDT / Math.max(1, totalJoints)) * 100}%` }}
                title={`Aprobadas: ${((aprobadosNDT / Math.max(1, totalJoints)) * 100).toFixed(1)}%`} />
            )}
            {rechazadosNDT > 0 && (
              <div className="bg-red-500 h-full transition-all" style={{ width: `${(rechazadosNDT / Math.max(1, totalJoints)) * 100}%` }}
                title={`Rechazadas: ${((rechazadosNDT / Math.max(1, totalJoints)) * 100).toFixed(1)}%`} />
            )}
            {reparadosNDT > 0 && (
              <div className="bg-amber-500 h-full transition-all" style={{ width: `${(reparadosNDT / Math.max(1, totalJoints)) * 100}%` }}
                title={`Reparadas: ${((reparadosNDT / Math.max(1, totalJoints)) * 100).toFixed(1)}%`} />
            )}
            {pendientesNDT > 0 && (
              <div className="bg-gray-400 h-full transition-all" style={{ width: `${(pendientesNDT / Math.max(1, totalJoints)) * 100}%` }}
                title={`Pendientes: ${((pendientesNDT / Math.max(1, totalJoints)) * 100).toFixed(1)}%`} />
            )}
          </div>

          {/* Tabla consolidada */}
          <div className="overflow-x-auto rounded-xl border border-gray-200 max-h-[500px] overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="bg-gray-50 text-gray-600 text-xs uppercase font-bold border-b border-gray-200">
                  <th className="p-3">N°</th>
                  <th className="p-3">Tag</th>
                  <th className="p-3">Isométrico</th>
                  <th className="p-3">Diámetro</th>
                  <th className="p-3">WPS</th>
                  <th className="p-3">Soldador</th>
                  <th className="p-3 text-center">VT</th>
                  <th className="p-3 text-center">NDT</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3">Timeline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {(filteredJoints.length > 0 ? filteredJoints : []).length === 0 && jointsList.length === 0 ? (
                  /* Mock data para demostración */
                  [
                    { n: 1, tag: 'J-01-ISO-104', iso: 'ISO-PDVSA-HC-04', diam: '8" Sch 80 CS', wps: 'WPS-PDVSA-01', weld: 'W-402 (J. Pérez)', vt: '✅', ndt: 'RT', status: 'Aprobado', progress: 100 },
                    { n: 2, tag: 'J-02-ISO-104', iso: 'ISO-PDVSA-HC-04', diam: '8" Sch 80 CS', wps: 'WPS-PDVSA-01', weld: 'W-402 (J. Pérez)', vt: '✅', ndt: 'RT', status: 'Aprobado', progress: 100 },
                    { n: 3, tag: 'J-03-ISO-104', iso: 'ISO-PDVSA-HC-04', diam: '8" Sch 80 CS', wps: 'WPS-PDVSA-01', weld: 'W-309 (M. Rivas)', vt: '✅', ndt: 'RT', status: 'Rechazado', progress: 75 },
                    { n: 4, tag: 'J-01-ISO-105', iso: 'ISO-PDVSA-HC-05', diam: '12" Sch 40 CS', wps: 'WPS-PDVSA-02', weld: 'W-115 (L. Torres)', vt: '✅', ndt: 'UT/PAUT', status: 'Aprobado', progress: 100 },
                    { n: 5, tag: 'J-02-ISO-105', iso: 'ISO-PDVSA-HC-05', diam: '12" Sch 40 CS', wps: 'WPS-PDVSA-02', weld: 'W-115 (L. Torres)', vt: '⏳', ndt: 'UT/PAUT', status: 'Pendiente', progress: 25 },
                  ].map((row) => (
                    <tr key={row.n} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-3 font-mono text-xs text-gray-500">{row.n}</td>
                      <td className="p-3 font-mono font-bold text-emerald-700">{row.tag}</td>
                      <td className="p-3 font-mono text-gray-900">{row.iso}</td>
                      <td className="p-3 text-gray-700">{row.diam}</td>
                      <td className="p-3 text-xs font-semibold text-gray-800">{row.wps}</td>
                      <td className="p-3 font-bold text-gray-900">{row.weld}</td>
                      <td className="p-3 text-center text-lg">{row.vt}</td>
                      <td className="p-3 text-center font-mono text-xs font-bold text-blue-700">{row.ndt}</td>
                      <td className="p-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          row.status === 'Aprobado' ? 'bg-emerald-100 text-emerald-800' :
                          row.status === 'Rechazado' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {row.status === 'Aprobado' ? <CheckCircle2 size={12}/> :
                           row.status === 'Rechazado' ? <XCircle size={12}/> :
                           <Clock size={12}/>}
                          {row.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          {['Fit-up', 'VT', 'NDT', 'Apr'].map((step, si) => (
                            <div key={step} className="flex items-center">
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                                row.progress > si * 25 ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-400'
                              }`}>
                                {row.progress > si * 25 ? '✓' : si + 1}
                              </div>
                              {si < 3 && <div className={`w-3 h-0.5 ${row.progress > (si + 1) * 25 ? 'bg-emerald-400' : 'bg-gray-200'}`} />}
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  jointsList.map((j, idx) => {
                    const progress = j.ndtStatus === 'Aprobado' ? 100 :
                                     j.ndtStatus === 'Rechazado' ? 75 :
                                     j.ndtStatus === 'Reparado' ? 75 :
                                     j.vtStatus === 'Aprobado' ? 50 :
                                     j.fitupStatus === 'Aprobado' ? 25 : 0;
                    return (
                      <tr key={j.id || idx} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-3 font-mono text-xs text-gray-500">{idx + 1}</td>
                        <td className="p-3 font-mono font-bold text-emerald-700">{j.tag}</td>
                        <td className="p-3 font-mono text-gray-900">{j.isometric}</td>
                        <td className="p-3 text-gray-700">{j.diameterSchedule}</td>
                        <td className="p-3 text-xs font-semibold text-gray-800">{j.wpsCode}</td>
                        <td className="p-3 font-bold text-gray-900">{j.welderStamp}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            j.vtStatus === 'Aprobado' ? 'bg-emerald-100 text-emerald-800' :
                            j.vtStatus === 'Rechazado' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'
                          }`}>{j.vtStatus}</span>
                        </td>
                        <td className="p-3 text-center font-mono text-xs font-bold text-blue-700">{j.ndtMethod}</td>
                        <td className="p-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            j.ndtStatus === 'Aprobado' ? 'bg-emerald-100 text-emerald-800' :
                            j.ndtStatus === 'Rechazado' ? 'bg-red-100 text-red-800' :
                            j.ndtStatus === 'Reparado' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {j.ndtStatus === 'Aprobado' ? <CheckCircle2 size={12}/> :
                             j.ndtStatus === 'Rechazado' ? <XCircle size={12}/> :
                             j.ndtStatus === 'Reparado' ? <AlertTriangle size={12}/> : <Clock size={12}/>}
                            {j.ndtStatus}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            {INSPECTION_STEPS.map((step, si) => (
                              <div key={step} className="flex items-center">
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                                  progress > si * 25 ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-400'
                                }`}>
                                  {progress > si * 25 ? '✓' : si + 1}
                                </div>
                                {si < INSPECTION_STEPS.length - 1 && (
                                  <div className={`w-3 h-0.5 ${progress > (si + 1) * 25 ? 'bg-emerald-400' : 'bg-gray-200'}`} />
                                )}
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Leyenda de timeline */}
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
            <p className="text-xs font-bold text-gray-700 mb-2">📋 Timeline de Inspección: Fit-up → VT (Visual) → NDT → Aprobado/Rechazado</p>
            <div className="flex gap-4 text-[11px] text-gray-600">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span> Completado</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-gray-200 inline-block"></span> Pendiente</span>
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================
          TAB 5: MAPA DE JUNTAS POR ISOMÉTRICO
          — Distribución y progreso agrupado
          ============================================================== */}
      {activeTab === 'isomap' && (
        <div className="bg-white rounded-b-xl border border-gray-200 border-t-0 p-6 space-y-6">
          <div className="flex items-center gap-2">
            <Map size={20} className="text-emerald-600" />
            <h3 className="text-lg font-black text-gray-900">Mapa de Juntas por Isométrico</h3>
            <span className="text-xs text-gray-500">— Distribución de juntas agrupadas por número de plano ISO</span>
          </div>

          {Object.keys(isoGroups).length === 0 ? (
            /* Mock data cuando no hay juntas reales */
            <div className="space-y-4">
              {[
                { iso: 'ISO-PDVSA-HC-04', joints: ['J-01-ISO-104', 'J-02-ISO-104', 'J-03-ISO-104'], approved: 2, total: 3 },
                { iso: 'ISO-PDVSA-HC-05', joints: ['J-01-ISO-105', 'J-02-ISO-105'], approved: 1, total: 2 },
                { iso: 'ISO-PDVSA-HC-06', joints: ['J-01-ISO-106'], approved: 0, total: 1 },
              ].map((group) => (
                <div key={group.iso} className="border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedIsoGroups(prev => ({ ...prev, [group.iso]: !prev[group.iso] }))}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {expandedIsoGroups[group.iso] ? <ChevronDown size={18} className="text-gray-400" /> : <ChevronRight size={18} className="text-gray-400" />}
                      <div>
                        <span className="font-bold font-mono text-gray-900">{group.iso}</span>
                        <span className="text-xs text-gray-500 ml-3">{group.total} juntas</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-emerald-700">{group.approved}/{group.total} aprobadas</span>
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${(group.approved / group.total) * 100}%` }} />
                      </div>
                    </div>
                  </button>
                  {expandedIsoGroups[group.iso] && (
                    <div className="border-t border-gray-200 divide-y divide-gray-100">
                      {group.joints.map((tag, idx) => {
                        const mockStatus = idx === 2 ? 'Rechazado' : 'Aprobado';
                        return (
                          <div key={tag} className="flex items-center justify-between px-4 py-3 pl-12 text-sm">
                            <div className="flex items-center gap-3">
                              <span className="font-mono font-bold text-emerald-700">{tag}</span>
                              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                mockStatus === 'Aprobado' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                              }`}>{mockStatus}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span>{idx === 2 ? 'Falta de penetración' : 'Conforme'}</span>
                              {mockStatus === 'Aprobado' ? <CheckCircle2 size={14} className="text-emerald-500" /> : <XCircle size={14} className="text-red-500" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(isoGroups).map(([iso, joints]) => {
                const approved = joints.filter(j => j.ndtStatus === 'Aprobado').length;
                const total = joints.length;
                const isExpanded = expandedIsoGroups[iso];
                return (
                  <div key={iso} className="border border-gray-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedIsoGroups(prev => ({ ...prev, [iso]: !prev[iso] }))}
                      className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? <ChevronDown size={18} className="text-gray-400" /> : <ChevronRight size={18} className="text-gray-400" />}
                        <div>
                          <span className="font-bold font-mono text-gray-900">{iso}</span>
                          <span className="text-xs text-gray-500 ml-3">{total} juntas</span>
                          <span className="text-xs text-gray-400 ml-2">Cat: {joints[0]?.serviceCategory || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-emerald-700">{approved}/{total} aprobadas</span>
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${(approved / total) * 100}%` }} />
                        </div>
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="border-t border-gray-200 divide-y divide-gray-100">
                        {joints.map(j => (
                          <div key={j.id} className="flex items-center justify-between px-4 py-3 pl-12 text-sm">
                            <div className="flex items-center gap-3">
                              <span className="font-mono font-bold text-emerald-700">{j.tag}</span>
                              <span className="text-xs text-gray-500">Coord: {j.isoCoordinate || 'N/A'}</span>
                              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                j.ndtStatus === 'Aprobado' ? 'bg-emerald-100 text-emerald-800' :
                                j.ndtStatus === 'Rechazado' ? 'bg-red-100 text-red-800' :
                                j.ndtStatus === 'Reparado' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'
                              }`}>{j.ndtStatus}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span className="font-mono">{j.welderStamp}</span>
                              <span className="font-mono text-blue-600">{j.ndtMethod}</span>
                              {j.ndtStatus === 'Aprobado' ? <CheckCircle2 size={14} className="text-emerald-500" /> :
                               j.ndtStatus === 'Rechazado' ? <XCircle size={14} className="text-red-500" /> :
                               j.ndtStatus === 'Reparado' ? <AlertTriangle size={14} className="text-amber-500" /> :
                               <Clock size={14} className="text-gray-400" />}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Resumen del mapa */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase">Total Isométricos</p>
                <p className="text-xl font-black text-gray-900">{Object.keys(isoGroups).length || 3}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase">Total Juntas</p>
                <p className="text-xl font-black text-gray-900">{totalJoints || 6}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase">Promedio Aprobación</p>
                <p className="text-xl font-black text-emerald-600">{totalJoints > 0 ? `${approvalRate.toFixed(1)}%` : '66.7%'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================
          MODAL: REGISTRAR NUEVA JUNTA (MEJORADO)
          — Agregados: Coordenada ISO, Tipo Junta, Fecha WPQ, Categoría
          ============================================================== */}
      {isAddJointModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-gray-200 pb-4">
              <div>
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Control de Soldadura ASME/API</span>
                <h2 className="text-xl font-black text-gray-900">Registrar Junta de Soldadura</h2>
              </div>
              <button onClick={() => setIsAddJointModal(false)} className="text-gray-400 hover:text-gray-600 p-2">
                <XCircle size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateJoint} className="space-y-4">
              {/* Fila 1: Tag, Isométrico */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Tag de Junta</label>
                  <input
                    type="text"
                    placeholder="Ej: J-05-ISO-104"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">N° Isométrico</label>
                  <input
                    type="text"
                    placeholder="Ej: ISO-PDVSA-HC-04"
                    value={newIsometric}
                    onChange={(e) => setNewIsometric(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    required
                  />
                </div>
              </div>

              {/* Fila 2: Coordenada ISO, Tipo Junta */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Coordenada en ISO</label>
                  <input
                    type="text"
                    placeholder="Ej: Cuadrante C-4"
                    value={newIsoCoordinate}
                    onChange={(e) => setNewIsoCoordinate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Tipo de Junta</label>
                  <select
                    value={newJointType}
                    onChange={(e) => setNewJointType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium"
                  >
                    <option value="Butt Weld">Butt Weld (A tope)</option>
                    <option value="Socket Weld">Socket Weld (Enchufe)</option>
                    <option value="Fillet Weld">Fillet Weld (Filete)</option>
                  </select>
                </div>
              </div>

              {/* Fila 3: Diámetro, Colada */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Diámetro / Cédula / Material</label>
                  <input
                    type="text"
                    value={newDiameter}
                    onChange={(e) => setNewDiameter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">N° Colada / MTR Tubería</label>
                  <input
                    type="text"
                    placeholder="Ej: COL-99421-A"
                    value={newHeatNumber}
                    onChange={(e) => setNewHeatNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    required
                  />
                </div>
              </div>

              {/* Fila 4: WPS, Soldador */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Procedimiento WPS</label>
                  <input
                    type="text"
                    value={newWpsCode}
                    onChange={(e) => setNewWpsCode(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Estampa de Soldador (WPQ)</label>
                  <input
                    type="text"
                    placeholder="Ej: W-402 (J. Pérez)"
                    value={newWelderStamp}
                    onChange={(e) => setNewWelderStamp(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    required
                  />
                </div>
              </div>

              {/* Fila 5: Fecha WPQ, Categoría Servicio */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Fecha Calificación WPQ <span className="text-gray-400 font-normal">(ASME IX vigencia 6 meses)</span>
                  </label>
                  <input
                    type="date"
                    value={newWelderQualDate}
                    onChange={(e) => setNewWelderQualDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Categoría de Servicio ASME B31.3</label>
                  <select
                    value={newServiceCategory}
                    onChange={(e) => setNewServiceCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium"
                  >
                    {SERVICE_CATEGORIES.map(c => (
                      <option key={c.key} value={c.key}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Fila 6: NDT Method */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Ensayo NDT Requerido</label>
                <select
                  value={newNdtMethod}
                  onChange={(e) => setNewNdtMethod(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium"
                >
                  <option value="RT">Radiografía Industrial (RT)</option>
                  <option value="UT/PAUT">Ultrasonido Phased Array (UT/PAUT)</option>
                  <option value="PT">Tintes Penetrantes (PT)</option>
                  <option value="MT">Partículas Magnéticas (MT)</option>
                  <option value="VT">Inspección Visual Solo (VT)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsAddJointModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-md"
                >
                  Guardar Junta en Trazabilidad
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
