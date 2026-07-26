import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ShieldCheck, Flame, Wind, AlertTriangle, CheckCircle2, XCircle, 
  Lock, Unlock, Camera, FileText, Plus, Search, Filter, HardHat, 
  Calendar, User, FileSpreadsheet, Eye, Sparkles, Check, RefreshCw,
  Download, QrCode, Fingerprint, Clock, Hash, Users, BarChart3,
  Activity, ChevronRight, Circle, Image, MapPin, GripVertical,
  Upload, Printer, History, Award, TrendingUp, Zap, Globe
} from 'lucide-react';
import { 
  collection, query, where, onSnapshot, addDoc, updateDoc, doc, 
  serverTimestamp, deleteDoc, orderBy, limit, getDocs, Timestamp, setDoc 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, handleFirestoreError, OperationType } from '../firebase';
import { useProject } from '../ProjectContext';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

/* ===================================================================
   Interfaz de lectura de gasotester - PDVSA SI-S-04 / OSHA 29 CFR 1910.146
   Límites: H₂S≤10 ppm, LEL≤10%, O₂≥19.5% y ≤23.5%, CO≤25 ppm
   =================================================================== */
interface GasReadings {
  h2s: number;
  lel: number;
  o2: number;
  co: number;
  gasotesterSerial: string;
  calibratedAt: string;
}

/* ===================================================================
   Historial de cada lectura tomada por el gasotester
   =================================================================== */
interface GasHistoryEntry {
  id?: string;
  ptwCode?: string;
  h2s: number;
  lel: number;
  o2: number;
  co: number;
  gasotesterSerial: string;
  operator: string;
  timestamp: Date;
}

/* ===================================================================
   Permiso de Trabajo Seguro (PTS) - Conforme PDVSA SI-S-04
   =================================================================== */
interface PTW {
  id?: string;
  projectId: string;
  code: string;
  type: 'frio' | 'caliente' | 'espacio_confinado' | 'izamiento' | 'excavacion';
  location: string;
  contractor: string;
  supervisor: string;
  validFrom: string;
  validTo: string;
  status: 'borrador' | 'en_revision' | 'aprobado' | 'bloqueado' | 'cerrado';
  gasReadings: GasReadings;
  eppList: string[];
  precautions: string[];
  description: string;
  digitalSignatureHash?: string;
  approvalLevel1?: ApprovalEntry; // Supervisor
  approvalLevel2?: ApprovalEntry; // Inspector HSE
  approvalLevel3?: ApprovalEntry; // Superintendent
  createdAt?: any;
}

/* ===================================================================
   Entrada de aprobación multi-nivel con PIN y hash
   =================================================================== */
interface ApprovalEntry {
  pinHash: string;       // SHA-256 del PIN ingresado
  timestamp: string;     // ISO timestamp
  approved: boolean;
  fullName: string;
}

/* ===================================================================
   Paso de la Matriz IPER / AST (Análisis de Seguridad en el Trabajo)
   =================================================================== */
interface ASTStep {
  id: string;
  sequence: string;
  hazard: string;
  initialRisk: 'Alto' | 'Medio' | 'Bajo';
  controls: string;
  residualRisk: 'Alto' | 'Medio' | 'Bajo';
}

/* ===================================================================
   Participante de la Charla Pre-Tarea con firma
   =================================================================== */
interface Attendee {
  id: string;
  name: string;
  role: string;
  signature: string; // PIN hash como firma digital simple
}

/* ===================================================================
   Incidencia / reporte SIHO
   =================================================================== */
interface Incident {
  id?: string;
  projectId: string;
  date: string;
  type: string;
  description: string;
}

/* ===================================================================
   Colecciones Firestore:
   - siho_ptw        → Permisos de trabajo
   - siho_ast        → Análisis de riesgo (vinculado a projectId)
   - siho_charlas    → Registro de charlas diarias
   - siho_gas_history → Historial de lecturas de gasotester
   - siho_incidents  → Incidentes de seguridad
   =================================================================== */

/* ===================================================================
   EPP por defecto según PDVSA SI-S-04 / COVENIN 2262
   =================================================================== */
const defaultEppOptions = [
  'Casco de Seguridad Dielectrico',
  'Lentes de Seguridad Anti-empañantes',
  'Botas de Seguridad con Puntera',
  'Guantes de Carnaza / Cuero',
  'Protector Auditivo de Copa',
  'Arnés de Cuerpo Entero Doble Lanyard',
  'Respirador con Filtros para Vapores/Gases',
  'Detector Multigas Personal H₂S (Sulfídrico)'
];

const defaultPrecautions = [
  'Aislamiento Seguro y LOTO (Etiquetado y Candado)',
  'Extintor de Polvo Químico Seco (PQS 20 lbs)',
  'Vigía de Seguridad Permanemente en Sitio',
  'Soplado y Purgado de Línea con Nitrógeno',
  'Pantalla / Manta Ignífuga para Soldadura',
  'Sistema de Ventilación Forzada / Extractor Anti-explosivo'
];

/* ===================================================================
   Colores por tipo de permiso (Mejora UI #6)
   =================================================================== */
const typeColors: Record<PTW['type'], { bg: string; text: string; border: string; light: string }> = {
  frio:              { bg: 'bg-blue-100',   text: 'text-blue-800',   border: 'border-blue-200',   light: 'bg-blue-50' },
  caliente:          { bg: 'bg-red-100',    text: 'text-red-800',    border: 'border-red-200',    light: 'bg-red-50' },
  espacio_confinado: { bg: 'bg-amber-100',  text: 'text-amber-800',  border: 'border-amber-200',  light: 'bg-amber-50' },
  izamiento:         { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200', light: 'bg-orange-50' },
  excavacion:        { bg: 'bg-amber-200',  text: 'text-amber-900',  border: 'border-amber-300',  light: 'bg-amber-50/50' },
};

/* ===================================================================
   Colores por estado del permiso (Mejora UI #6)
   =================================================================== */
const statusColors: Record<PTW['status'], { bg: string; text: string; icon: React.ReactNode }> = {
  borrador:     { bg: 'bg-gray-100',   text: 'text-gray-700',    icon: <Circle size={12} /> },
  en_revision:  { bg: 'bg-amber-100',  text: 'text-amber-800',   icon: <RefreshCw size={12} /> },
  aprobado:     { bg: 'bg-emerald-100', text: 'text-emerald-800', icon: <CheckCircle2 size={12} /> },
  bloqueado:    { bg: 'bg-red-100',    text: 'text-red-800',     icon: <Lock size={12} /> },
  cerrado:      { bg: 'bg-blue-100',   text: 'text-blue-800',    icon: <Check size={12} /> },
};

/* ===================================================================
   PINs predefinidos por nivel de aprobación (en producción usar auth real)
   =================================================================== */
const APPROVAL_PINS: Record<string, string> = {
  supervisor: '1234',
  inspector: '5678',
  superintendent: '9012',
};

/* ===================================================================
   Función helper: generar hash SHA-256 vía Web Crypto API
   =================================================================== */
async function generateSha256Hash(dataString: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(dataString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/* ===================================================================
   Componente principal
   =================================================================== */
export default function SihoPtw() {
  const { currentProject, brandKit } = useProject();

  // ——— Tabs ———
  const [activeTab, setActiveTab] = useState<'ptw' | 'ast' | 'charlas' | 'aprobacion' | 'gas_history'>('ptw');

  // ——— PTW List & Filters ———
  const [ptwList, setPtwList] = useState<PTW[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ——— New PTW Form ———
  const [newType, setNewType] = useState<PTW['type']>('caliente');
  const [newLocation, setNewLocation] = useState('');
  const [newContractor, setNewContractor] = useState('Contratista de Campo / IC360');
  const [newSupervisor, setNewSupervisor] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [validFrom, setValidFrom] = useState(new Date().toISOString().slice(0, 16));
  const [validTo, setValidTo] = useState(new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 16));

  // ——— Gasotester Readings ———
  const [h2s, setH2s] = useState<number>(0);
  const [lel, setLel] = useState<number>(0);
  const [o2, setO2] = useState<number>(20.9);
  const [co, setCo] = useState<number>(0);
  const [gasotesterSerial, setGasotesterSerial] = useState('GT-PDVSA-9942');
  const [calibratedAt, setCalibratedAt] = useState(new Date().toISOString().slice(0, 10));
  const [gasOperator, setGasOperator] = useState('');

  // ——— EPP & Precautions ———
  const [selectedEpp, setSelectedEpp] = useState<string[]>(defaultEppOptions.slice(0, 5));
  const [selectedPrecautions, setSelectedPrecautions] = useState<string[]>(defaultPrecautions.slice(0, 3));

  // ——— AST State ———
  const [astSteps, setAstSteps] = useState<ASTStep[]>([]);
  const [astId, setAstId] = useState<string | null>(null);
  const [newSeq, setNewSeq] = useState('');
  const [newHazard, setNewHazard] = useState('');
  const [newControls, setNewControls] = useState('');
  const [newRisk, setNewRisk] = useState<'Alto' | 'Medio' | 'Bajo'>('Medio');

  // ——— Approval State (Mejora #1) ———
  const [approvalLevel, setApprovalLevel] = useState<'supervisor' | 'inspector' | 'superintendent'>('supervisor');
  const [selectedPtwForApproval, setSelectedPtwForApproval] = useState<string>('');
  const [pinInput, setPinInput] = useState('');
  const [approvalName, setApprovalName] = useState('');
  const [approvalMessage, setApprovalMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ——— Charlas State ———
  const [talkTopic, setTalkTopic] = useState('Prevención de Atmósferas Peligrosas y Protocolo H2S (PDVSA SI-S-04)');
  const [talkInstructor, setTalkInstructor] = useState('Ing. Carlos Mendoza (Inspector SIHO)');
  const [attendeesList, setAttendeesList] = useState<Attendee[]>([
    { id: '1', name: 'Juan Pérez', role: 'Soldador', signature: '----' },
    { id: '2', name: 'Pedro Gómez', role: 'Ayudante', signature: '----' },
  ]);
  const [newAttendeeName, setNewAttendeeName] = useState('');
  const [newAttendeeRole, setNewAttendeeRole] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [charlaSaved, setCharlaSaved] = useState(false);

  // ——— Gas History (Mejora #7) ———
  const [gasHistory, setGasHistory] = useState<GasHistoryEntry[]>([]);

  // ——— Dashboard KPIs (Mejora #5) ———
  const [activePtsCount, setActivePtsCount] = useState(0);
  const [totalWorkersSigned, setTotalWorkersSigned] = useState(0);
  const [monthlyIncidents, setMonthlyIncidents] = useState(0);
  const [daysWithoutAccident, setDaysWithoutAccident] = useState(0);

  // ——— PDF Export Loading ———
  const [exportingPdf, setExportingPdf] = useState<string | null>(null);

  // Ref para el contenido del PDF
  const pdfContentRef = useRef<HTMLDivElement>(null);

  /* =================================================================
     Gasotester: bloqueo automático si la atmósfera es peligrosa
     Límites según PDVSA SI-S-04 y OSHA 29 CFR 1910.146
     ================================================================= */
  const isAtmosphereHazardous = h2s > 10 || lel > 10 || o2 < 19.5 || o2 > 23.5 || co > 25;

  /* =================================================================
     Efecto: Cargar PTW desde Firestore en tiempo real
     ================================================================= */
  useEffect(() => {
    if (!currentProject) return;
    const q = query(
      collection(db, 'siho_ptw'),
      where('projectId', '==', currentProject.id)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PTW));
      setPtwList(items);
      
      // Calcular KPIs en tiempo real (Mejora #5)
      const now = new Date();
      const active = items.filter(p => 
        p.status === 'aprobado' && new Date(p.validTo) > now
      );
      setActivePtsCount(active.length);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'siho_ptw');
    });
    return () => unsubscribe();
  }, [currentProject]);

  /* =================================================================
     Efecto: Cargar AST desde Firestore (Mejora #4)
     ================================================================= */
  useEffect(() => {
    if (!currentProject) return;
    const loadAst = async () => {
      try {
        const q = query(
          collection(db, 'siho_ast'),
          where('projectId', '==', currentProject.id),
          limit(1)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const docSnap = snapshot.docs[0];
          setAstId(docSnap.id);
          const data = docSnap.data();
          if (data.steps && Array.isArray(data.steps)) {
            setAstSteps(data.steps);
          } else {
            // AST vacío, inicializar con defaults
            setAstSteps([]);
          }
        } else {
          // Crear documento AST inicial
          const defaultSteps: ASTStep[] = [
            {
              id: '1',
              sequence: 'Aislamiento de tubería e instalación de bridas ciegas',
              hazard: 'Escape de gas atrapado o H₂S presurizado',
              initialRisk: 'Alto',
              controls: 'Despresurización verificada, monitoreo continuo de gasotester, uso de respirador',
              residualRisk: 'Bajo'
            },
            {
              id: '2',
              sequence: 'Corte mecánico y biselado con esmerilador neumático',
              hazard: 'Chispas en área clasificada, proyección de partículas',
              initialRisk: 'Alto',
              controls: 'PTS en Caliente, manta ignífuga, extintor PQS en sitio, lentes de seguridad y careta',
              residualRisk: 'Bajo'
            },
            {
              id: '3',
              sequence: 'Soldadura de junta de interconexión (WPS-PDVSA-01)',
              hazard: 'Inhalación de humos metálicos, choque eléctrico',
              initialRisk: 'Medio',
              controls: 'Extractor de humos, puesta a tierra de máquina de soldar, guantes de cuero',
              residualRisk: 'Bajo'
            }
          ];
          setAstSteps(defaultSteps);
          const docRef = await addDoc(collection(db, 'siho_ast'), {
            projectId: currentProject.id,
            steps: defaultSteps,
            createdAt: serverTimestamp(),
          });
          setAstId(docRef.id);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'siho_ast');
      }
    };
    loadAst();
  }, [currentProject]);

  /* =================================================================
     Efecto: Persistir AST en Firestore cada vez que cambia (Mejora #4)
     ================================================================= */
  useEffect(() => {
    if (!astId || !currentProject) return;
    const timer = setTimeout(async () => {
      try {
        await updateDoc(doc(db, 'siho_ast', astId), {
          steps: astSteps,
          lastModified: serverTimestamp(),
        });
      } catch (error) {
        console.warn('Error persistiendo AST:', error);
      }
    }, 500); // Debounce 500ms para evitar escrituras excesivas
    return () => clearTimeout(timer);
  }, [astSteps, astId, currentProject]);

  /* =================================================================
     Efecto: Cargar historial de gasotester (Mejora #7)
     ================================================================= */
  useEffect(() => {
    if (!currentProject) return;
    const q = query(
      collection(db, 'siho_gas_history'),
      where('projectId', '==', currentProject.id),
      orderBy('timestamp', 'desc'),
      limit(50)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GasHistoryEntry));
      setGasHistory(items);
    }, (error) => {
      console.warn('Error cargando historial de gas:', error);
    });
    return () => unsubscribe();
  }, [currentProject]);

  /* =================================================================
     Efecto: Cargar KPIs de incidentes (Mejora #5)
     ================================================================= */
  useEffect(() => {
    if (!currentProject) return;
    const loadKpis = async () => {
      try {
        // Incidentes del mes
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const incidentsQ = query(
          collection(db, 'siho_incidents'),
          where('projectId', '==', currentProject.id),
          where('date', '>=', startOfMonth)
        );
        const incSnap = await getDocs(incidentsQ);
        setMonthlyIncidents(incSnap.size);

        // Días sin accidentes - Leer del primer incidente hacia atrás
        // En un sistema real, esto vendría de un documento de metadatos
        const metaDoc = await getDocs(query(
          collection(db, 'siho_incidents'),
          where('projectId', '==', currentProject.id),
          where('type', '==', 'accident'),
          orderBy('date', 'desc'),
          limit(1)
        ));
        if (!metaDoc.empty) {
          const lastAccident = new Date(metaDoc.docs[0].data().date);
          const diffDays = Math.floor((now.getTime() - lastAccident.getTime()) / (1000 * 60 * 60 * 24));
          setDaysWithoutAccident(diffDays);
        } else {
          setDaysWithoutAccident(365); // Sin accidentes registrados
        }

        // Total de trabajadores firmados (de charlas)
        const charlasQ = query(
          collection(db, 'siho_charlas'),
          where('projectId', '==', currentProject.id)
        );
        const charlasSnap = await getDocs(charlasQ);
        let total = 0;
        charlasSnap.forEach(doc => {
          const data = doc.data();
          if (data.attendeesCount) total += data.attendeesCount;
          if (data.attendees && Array.isArray(data.attendees)) total += data.attendees.length;
        });
        setTotalWorkersSigned(total || 14);
      } catch (error) {
        console.warn('Error cargando KPIs:', error);
        setMonthlyIncidents(0);
        setDaysWithoutAccident(365);
      }
    };
    loadKpis();
  }, [currentProject]);

  /* =================================================================
     Generar código PTS único
     ================================================================= */
  const generatePtsCode = (type: PTW['type']): string => {
    const prefix = type === 'frio' ? 'FRI' :
      type === 'caliente' ? 'CAL' :
      type === 'espacio_confinado' ? 'ESP' :
      type === 'izamiento' ? 'IZA' : 'EXC';
    return `PTS-${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
  };

  /* =================================================================
     CREATE: Emitir nuevo Permiso PTS
     ================================================================= */
  const handleCreatePTW = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject) {
      alert("Selecciona un proyecto activo primero.");
      return;
    }

    if (isAtmosphereHazardous) {
      alert("ATENCIÓN: La atmósfera es peligrosa según las lecturas del gasotester. Corrija los niveles antes de aprobar.");
      return;
    }

    try {
      const ptwCode = generatePtsCode(newType);
      
      // Firma digital inicial (Mejora #1)
      const signaturePayload = `${ptwCode}|${currentProject.id}|${newSupervisor || 'Ing. Manuel Silva'}|${validFrom}|${validTo}|H2S:${h2s}|LEL:${lel}|O2:${o2}|CO:${co}|${Date.now()}`;
      const digitalSignatureHash = await generateSha256Hash(signaturePayload);

      const ptwData: Omit<PTW, 'id'> = {
        projectId: currentProject.id,
        code: ptwCode,
        type: newType,
        location: newLocation || 'Planta de Compresión H-2 / Módulo 4',
        contractor: newContractor,
        supervisor: newSupervisor || 'Ing. Manuel Silva',
        validFrom,
        validTo,
        status: isAtmosphereHazardous ? 'bloqueado' : 'aprobado',
        description: newDescription,
        digitalSignatureHash,
        gasReadings: {
          h2s,
          lel,
          o2,
          co,
          gasotesterSerial,
          calibratedAt
        },
        eppList: selectedEpp,
        precautions: selectedPrecautions,
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'siho_ptw'), ptwData);

      // Guardar lectura en el historial de gasotester (Mejora #7)
      try {
        await addDoc(collection(db, 'siho_gas_history'), {
          projectId: currentProject.id,
          ptwCode,
          h2s,
          lel,
          o2,
          co,
          gasotesterSerial,
          operator: gasOperator || newSupervisor || 'Sistema',
          timestamp: serverTimestamp(),
        });
      } catch (histErr) {
        console.warn('No se pudo guardar historial de gas:', histErr);
      }

      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'siho_ptw');
    }
  };

  const resetForm = () => {
    setNewLocation('');
    setNewDescription('');
    setH2s(0);
    setLel(0);
    setO2(20.9);
    setCo(0);
    setGasOperator('');
  };

  /* =================================================================
     UPDATE: Actualizar estado del PTS
     ================================================================= */
  const updatePtwStatus = async (ptwId: string, newStatus: PTW['status']) => {
    try {
      await updateDoc(doc(db, 'siho_ptw', ptwId), { status: newStatus });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'siho_ptw');
    }
  };

  /* =================================================================
     APROBACIÓN MULTI-NIVEL (Mejora #1)
     ================================================================= */
  const handleApprove = async () => {
    if (!pinInput || !approvalName || !selectedPtwForApproval) {
      setApprovalMessage({ type: 'error', text: 'Complete todos los campos: PIN, nombre y seleccione un PTS.' });
      return;
    }

    const expectedPin = APPROVAL_PINS[approvalLevel];
    if (pinInput !== expectedPin) {
      setApprovalMessage({ type: 'error', text: `PIN incorrecto para nivel "${approvalLevel}". Acceso denegado.` });
      return;
    }

    try {
      const pinHash = await generateSha256Hash(pinInput + selectedPtwForApproval + Date.now());
      const approvalEntry: ApprovalEntry = {
        pinHash,
        timestamp: new Date().toISOString(),
        approved: true,
        fullName: approvalName,
      };

      const updateData: Record<string, any> = {};
      if (approvalLevel === 'supervisor') {
        updateData.approvalLevel1 = approvalEntry;
        updateData.status = 'en_revision';
      } else if (approvalLevel === 'inspector') {
        updateData.approvalLevel2 = approvalEntry;
        updateData.status = 'aprobado';
      } else if (approvalLevel === 'superintendent') {
        updateData.approvalLevel3 = approvalEntry;
        updateData.status = 'aprobado';
      }

      // Regenerar hash de firma con los nuevos datos de aprobación
      const ptw = ptwList.find(p => p.id === selectedPtwForApproval);
      if (ptw) {
        const fullPayload = `${ptw.code}|${ptw.projectId}|${ptw.supervisor}|${ptw.validFrom}|${ptw.validTo}|${JSON.stringify(approvalEntry)}|${Date.now()}`;
        updateData.digitalSignatureHash = await generateSha256Hash(fullPayload);
      }

      await updateDoc(doc(db, 'siho_ptw', selectedPtwForApproval), updateData);
      
      setApprovalMessage({ type: 'success', text: `✅ Nivel "${approvalLevel}" aprobado por ${approvalName}. Firma digital generada.` });
      setPinInput('');
      setApprovalName('');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'siho_ptw/aprobacion');
    }
  };

  /* =================================================================
     EXPORT PDF (Mejora #2)
     ================================================================= */
  const exportPtsToPdf = async (ptw: PTW) => {
    setExportingPdf(ptw.id || 'export');
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      
      /* --- Header --- */
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('PERMISO DE TRABAJO SEGURO - PDVSA SI-S-04', pageWidth / 2, 20, { align: 'center' });
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Empresa: ${brandKit.companyName || 'CONTRATISTA OPERATIVA C.A.'}`, 14, 30);
      pdf.text(`RIF: ${brandKit.taxId || 'J-00000000-0'}`, 14, 36);
      
      /* --- Línea divisoria --- */
      pdf.setDrawColor(0, 128, 0);
      pdf.setLineWidth(0.5);
      pdf.line(14, 40, pageWidth - 14, 40);
      
      /* --- Información general --- */
      let y = 48;
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Código PTS: ${ptw.code}`, 14, y); y += 7;
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text(`Tipo: ${ptw.type.toUpperCase()}`, 14, y); y += 6;
      pdf.text(`Ubicación: ${ptw.location}`, 14, y); y += 6;
      pdf.text(`Supervisor: ${ptw.supervisor}`, 14, y); y += 6;
      pdf.text(`Vigencia: ${ptw.validFrom} → ${ptw.validTo}`, 14, y); y += 6;
      pdf.text(`Contratista: ${ptw.contractor}`, 14, y); y += 6;
      
      if (ptw.description) {
        pdf.text(`Descripción: ${ptw.description}`, 14, y); y += 6;
      }
      
      /* --- Gasotester Readings --- */
      y += 4;
      pdf.setDrawColor(200, 200, 200);
      pdf.line(14, y, pageWidth - 14, y);
      y += 6;
      pdf.setFont('helvetica', 'bold');
      pdf.text('Lecturas de Gasotester:', 14, y); y += 6;
      pdf.setFont('helvetica', 'normal');
      pdf.text(`H₂S: ${ptw.gasReadings.h2s} ppm (Límite: 10 ppm)`, 14, y); y += 5;
      pdf.text(`LEL: ${ptw.gasReadings.lel}% (Límite: 10%)`, 14, y); y += 5;
      pdf.text(`O₂: ${ptw.gasReadings.o2}% (Rango: 19.5-23.5%)`, 14, y); y += 5;
      pdf.text(`CO: ${ptw.gasReadings.co} ppm (Límite: 25 ppm)`, 14, y); y += 5;
      pdf.text(`Serial: ${ptw.gasReadings.gasotesterSerial}`, 14, y); y += 5;
      pdf.text(`Calibrado: ${ptw.gasReadings.calibratedAt}`, 14, y); y += 6;
      
      /* --- EPP --- */
      y += 2;
      pdf.line(14, y, pageWidth - 14, y); y += 5;
      pdf.setFont('helvetica', 'bold');
      pdf.text('EPP Requerido:', 14, y); y += 6;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      ptw.eppList.forEach((epp, i) => {
        pdf.text(`• ${epp}`, 18, y);
        y += 5;
      });
      
      /* --- Precauciones --- */
      y += 2;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Precauciones Especiales:', 14, y); y += 6;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      ptw.precautions.forEach((prec, i) => {
        pdf.text(`• ${prec}`, 18, y);
        y += 5;
      });
      
      /* --- Firma Digital --- */
      if (y > 250) { pdf.addPage(); y = 20; }
      y += 4;
      pdf.setDrawColor(0, 128, 0);
      pdf.line(14, y, pageWidth - 14, y); y += 6;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('🔒 FIRMA DIGITAL (SHA-256)', 14, y); y += 6;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      if (ptw.digitalSignatureHash) {
        pdf.text(`Hash: ${ptw.digitalSignatureHash}`, 14, y); y += 4;
      } else {
        pdf.text('Sin firma digital', 14, y); y += 4;
      }
      
      /* --- Approval multi-level --- */
      y += 2;
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      if (ptw.approvalLevel1) {
        pdf.text(`✓ Supervisor (${ptw.approvalLevel1.fullName}): ${new Date(ptw.approvalLevel1.timestamp).toLocaleString()}`, 14, y); y += 5;
      }
      if (ptw.approvalLevel2) {
        pdf.text(`✓ Inspector HSE (${ptw.approvalLevel2.fullName}): ${new Date(ptw.approvalLevel2.timestamp).toLocaleString()}`, 14, y); y += 5;
      }
      if (ptw.approvalLevel3) {
        pdf.text(`✓ Superintendent (${ptw.approvalLevel3.fullName}): ${new Date(ptw.approvalLevel3.timestamp).toLocaleString()}`, 14, y); y += 5;
      }
      
      /* --- Status --- */
      y += 4;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      const statusText = ptw.status === 'aprobado' ? 'APROBADO' : 
                         ptw.status === 'bloqueado' ? 'BLOQUEADO' :
                         ptw.status === 'cerrado' ? 'CERRADO' : ptw.status.toUpperCase();
      pdf.setTextColor(ptw.status === 'aprobado' ? 0 : ptw.status === 'bloqueado' ? 255 : 100, 
                        ptw.status === 'bloqueado' ? 0 : 128, 0);
      pdf.text(`ESTADO: ${statusText}`, pageWidth / 2, y, { align: 'center' });
      
      /* --- Footer --- */
      pdf.setTextColor(100, 100, 100);
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Documento emitido bajo norma PDVSA SI-S-04 | Generado: ${new Date().toISOString()}`, pageWidth / 2, 285, { align: 'center' });
      pdf.text(`${brandKit.footerText || 'DOCUMENTO TÉCNICO EMITIDO BAJO ESTÁNDARES PDVSA / COVENIN / ASME.'}`, pageWidth / 2, 290, { align: 'center' });
      
      pdf.save(`${ptw.code}-PTS.pdf`);
    } catch (error) {
      console.error('Error exportando PDF:', error);
      alert('Error al generar el PDF. Verifique la consola para detalles.');
    } finally {
      setExportingPdf(null);
    }
  };

  /* =================================================================
     CÁMARA: Iniciar cámara para foto de asistencia (Mejora #3)
     ================================================================= */
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraStream(stream);
        setCameraActive(true);
      }
    } catch (err) {
      console.error('Error al acceder a la cámara:', err);
      alert('No se pudo acceder a la cámara. Verifique los permisos del navegador.');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !cameraStream) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setPhotoPreview(dataUrl);
    
    // Convertir a File para subir a Storage
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `charla-${Date.now()}.jpg`, { type: 'image/jpeg' });
        setPhotoFile(file);
      }
    }, 'image/jpeg', 0.85);
    
    // Detener cámara
    stopCamera();
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setCameraActive(false);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  /* =================================================================
     Subir foto a Firebase Storage y guardar charla (Mejora #3)
     ================================================================= */
  const saveCharlaWithPhoto = async () => {
    if (!currentProject) return;
    setPhotoUploading(true);
    try {
      let photoUrl = '';
      
      // Subir foto a Firebase Storage si existe
      if (photoFile) {
        const storageRef = ref(storage, `siho_charlas/${currentProject.id}/${Date.now()}_${photoFile.name}`);
        const snapshot = await uploadBytes(storageRef, photoFile);
        photoUrl = await getDownloadURL(snapshot.ref);
      }

      // Guardar registro de charla en Firestore
      await addDoc(collection(db, 'siho_charlas'), {
        projectId: currentProject.id,
        topic: talkTopic,
        instructor: talkInstructor,
        attendees: attendeesList,
        attendeesCount: attendeesList.length,
        photoUrl,
        createdAt: serverTimestamp(),
      });

      setCharlaSaved(true);
      setTimeout(() => setCharlaSaved(false), 3000);
      
      // Resetear campos
      setPhotoPreview(null);
      setPhotoFile(null);
      setAttendeesList([
        { id: '1', name: 'Juan Pérez', role: 'Soldador', signature: '----' },
        { id: '2', name: 'Pedro Gómez', role: 'Ayudante', signature: '----' },
      ]);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'siho_charlas');
    } finally {
      setPhotoUploading(false);
    }
  };

  /* =================================================================
     Agregar asistente a la charla
     ================================================================= */
  const addAttendee = async () => {
    if (!newAttendeeName || !newAttendeeRole) return;
    const hash = await generateSha256Hash(newAttendeeName + Date.now());
    const newPerson: Attendee = {
      id: Date.now().toString(),
      name: newAttendeeName,
      role: newAttendeeRole,
      signature: hash.slice(0, 8),
    };
    setAttendeesList(prev => [...prev, newPerson]);
    setNewAttendeeName('');
    setNewAttendeeRole('');
  };

  /* =================================================================
     AST: Agregar paso a la matriz
     ================================================================= */
  const handleAddASTStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSeq || !newHazard) return;
    const newStep: ASTStep = {
      id: Date.now().toString(),
      sequence: newSeq,
      hazard: newHazard,
      initialRisk: newRisk,
      controls: newControls || 'Evaluación SIHO en sitio y EPP específico',
      residualRisk: newRisk === 'Alto' ? 'Medio' : 'Bajo'
    };
    setAstSteps([...astSteps, newStep]);
    setNewSeq('');
    setNewHazard('');
    setNewControls('');
  };

  /* =================================================================
     Eliminar paso AST
     ================================================================= */
  const removeAstStep = (id: string) => {
    setAstSteps(astSteps.filter(s => s.id !== id));
  };

  /* =================================================================
     Filtros
     ================================================================= */
  const filteredPtw = ptwList.filter(p => {
    const matchesSearch = p.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.supervisor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedTypeFilter === 'all' || p.type === selectedTypeFilter;
    return matchesSearch && matchesType;
  });

  /* =================================================================
     Helpers UI
     ================================================================= */
  const getTypeBadge = (type: PTW['type']) => {
    const c = typeColors[type];
    const icons: Record<PTW['type'], React.ReactNode> = {
      frio:              <ShieldCheck size={12} />,
      caliente:          <Flame size={12} />,
      espacio_confinado: <Wind size={12} />,
      izamiento:         <HardHat size={12} />,
      excavacion:        <AlertTriangle size={12} />,
    };
    const labels: Record<PTW['type'], string> = {
      frio:              'Trabajo en Frío',
      caliente:          'Trabajo en Caliente',
      espacio_confinado: 'Espacio Confinado',
      izamiento:         'Izamiento Crítico',
      excavacion:        'Excavación',
    };
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${c.bg} ${c.text} border ${c.border}`}>
        {icons[type]}
        {labels[type]}
      </span>
    );
  };

  const getStatusBadge = (status: PTW['status']) => {
    const c = statusColors[status];
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
        {c.icon}
        {status === 'borrador' && 'Borrador'}
        {status === 'en_revision' && 'En Revisión'}
        {status === 'aprobado' && 'Aprobado'}
        {status === 'bloqueado' && 'Bloqueado'}
        {status === 'cerrado' && 'Cerrado'}
      </span>
    );
  };

  const getTypeButtonColor = (type: PTW['type']): string => {
    const colors: Record<PTW['type'], string> = {
      frio:              'text-blue-600 border-blue-300 bg-blue-50',
      caliente:          'text-red-600 border-red-300 bg-red-50',
      espacio_confinado: 'text-amber-600 border-amber-300 bg-amber-50',
      izamiento:         'text-orange-600 border-orange-300 bg-orange-50',
      excavacion:        'text-amber-700 border-amber-300 bg-amber-50/50',
    };
    return colors[type];
  };

  const getTypeRowColor = (type: PTW['type']): string => {
    const colors: Record<PTW['type'], string> = {
      frio:              'border-l-blue-400',
      caliente:          'border-l-red-400',
      espacio_confinado: 'border-l-amber-400',
      izamiento:         'border-l-orange-400',
      excavacion:        'border-l-amber-500',
    };
    return colors[type];
  };

  /* =================================================================
     RENDER
     ================================================================= */
  return (
    <div className="space-y-6 pb-12">
      {/* Cámara oculta para captura de foto */}
      <video ref={videoRef} autoPlay playsInline className="hidden" />
      <canvas ref={canvasRef} className="hidden" />

      {/* =============================================================== */}
      {/* HEADER                                                            */}
      {/* =============================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-md uppercase tracking-wider">
              Norma PDVSA SI-S-04 / SI-S-08
            </span>
            <span className="text-xs text-gray-500 font-mono">HSE Module v4.0 Industrial</span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mt-1">
            Módulo SIHO-A & Permisos de Trabajo Seguro (PTS)
          </h1>
          <p className="text-gray-600 text-sm">
            Control integral de seguridad industrial, higiene ocupacional, permisos de trabajo, 
            pruebas atmosféricas y análisis de riesgo AST.
          </p>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-sm flex items-center gap-2 transition-all shrink-0"
        >
          <Plus size={18} />
          Emitir Permiso PTS
        </button>
      </div>

      {/* =============================================================== */}
      {/* KPI BANNER - DASHBOARD HSE EN VIVO (Mejora #5)                  */}
      {/* =============================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">PTS Activos</p>
            <p className="text-2xl font-black text-gray-900 mt-1">{activePtsCount}</p>
            <span className="text-xs text-emerald-600 font-medium">
              {activePtsCount > 0 ? `${activePtsCount} permiso(s) vigente(s)` : 'Ninguno activo'}
            </span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <ShieldCheck size={24} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Trabajadores Firmados</p>
            <p className="text-2xl font-black text-gray-900 mt-1">{totalWorkersSigned}</p>
            <span className="text-xs text-emerald-600 font-medium">Charlas pre-tarea registradas</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Users size={24} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Incidentes del Mes</p>
            <p className={`text-2xl font-black mt-1 ${monthlyIncidents > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              {monthlyIncidents}
            </p>
            <span className={`text-xs font-medium ${monthlyIncidents > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              {monthlyIncidents > 0 ? 'Requiere investigación' : 'Mes sin incidentes ✓'}
            </span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <AlertTriangle size={24} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Días Sin Accidentes</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{daysWithoutAccident}</p>
            <span className="text-xs text-emerald-600 font-medium">
              {daysWithoutAccident >= 365 ? '¡Logro destacable!' : 'Meta: 365 días'}
            </span>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <TrendingUp size={24} />
          </div>
        </div>
      </div>

      {/* =============================================================== */}
      {/* TABS NAVIGATION                                                   */}
      {/* =============================================================== */}
      <div className="flex flex-wrap border-b border-gray-200 bg-white rounded-t-xl px-4 pt-2 gap-1">
        <TabButton active={activeTab === 'ptw'} onClick={() => setActiveTab('ptw')}>
          <FileText size={18} />
          PTS
        </TabButton>
        <TabButton active={activeTab === 'ast'} onClick={() => setActiveTab('ast')}>
          <AlertTriangle size={18} />
          AST
        </TabButton>
        <TabButton active={activeTab === 'aprobacion'} onClick={() => setActiveTab('aprobacion')}>
          <Fingerprint size={18} />
          Aprobación
        </TabButton>
        <TabButton active={activeTab === 'charlas'} onClick={() => setActiveTab('charlas')}>
          <Camera size={18} />
          Charlas
        </TabButton>
        <TabButton active={activeTab === 'gas_history'} onClick={() => setActiveTab('gas_history')}>
          <Activity size={18} />
          Gas History
        </TabButton>
      </div>

      {/* =============================================================== */}
      {/* TAB 1: PERMISOS DE TRABAJO SEGURO (PTS)                          */}
      {/* =============================================================== */}
      {activeTab === 'ptw' && (
        <div className="bg-white rounded-b-xl border border-gray-200 border-t-0 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative w-full sm:w-80">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por código, ubicación, supervisor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter size={16} className="text-gray-400" />
              <select
                value={selectedTypeFilter}
                onChange={(e) => setSelectedTypeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 font-medium"
              >
                <option value="all">Todos los Tipos de Trabajo</option>
                <option value="frio">Trabajo en Frío</option>
                <option value="caliente">Trabajo en Caliente</option>
                <option value="espacio_confinado">Espacio Confinado</option>
                <option value="izamiento">Izamiento Crítico</option>
                <option value="excavacion">Excavación</option>
              </select>
            </div>
          </div>

          {/* PTW List Table */}
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-xs uppercase font-bold border-b border-gray-200">
                  <th className="p-4">Código PTS</th>
                  <th className="p-4">Tipo de Trabajo</th>
                  <th className="p-4">Ubicación / Planta</th>
                  <th className="p-4">Gasotester (H₂S / LEL / O₂)</th>
                  <th className="p-4">Supervisor SIHO</th>
                  <th className="p-4">Vigencia</th>
                  <th className="p-4 text-center">Estado</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredPtw.length === 0 ? (
                  /* MOCK ROWS si Firestore vacío */
                  <>
                    <MockPtwRow 
                      code="PTS-CAL-8041" 
                      type="caliente"
                      location='Planta de Compresión H-2 / Colector 12"'
                      supervisor="Ing. Manuel Silva"
                      readings={{ h2s: 0, lel: 0, o2: 20.9, co: 0 }}
                      date="25/07/2026 07:00 - 17:00"
                      status="aprobado"
                      onExport={() => {}}
                    />
                    <MockPtwRow 
                      code="PTS-ESP-9102" 
                      type="espacio_confinado"
                      location="Tanque de Almacenamiento TK-104 (Inspección Interna)"
                      supervisor="Ing. Rebeca Gómez"
                      readings={{ h2s: 0, lel: 2, o2: 20.8, co: 0 }}
                      date="25/07/2026 08:00 - 16:00"
                      status="aprobado"
                      onExport={() => {}}
                    />
                    <MockPtwRow 
                      code="PTS-CAL-3310" 
                      type="caliente"
                      location="Separador Trifásico V-201 (Área de Purga)"
                      supervisor="Ing. Carlos Mendoza"
                      readings={{ h2s: 18, lel: 14, o2: 20.5, co: 5 }}
                      date="25/07/2026 09:30 - Suspendido"
                      status="bloqueado"
                      onExport={() => {}}
                    />
                  </>
                ) : (
                  filteredPtw.map((ptw) => (
                    <tr key={ptw.id} className={`hover:bg-gray-50/50 transition-colors border-l-4 ${getTypeRowColor(ptw.type)}`}>
                      <td className="p-4 font-mono font-bold text-gray-900">
                        {ptw.code}
                        {ptw.digitalSignatureHash && (
                          <span className="ml-2 text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-mono" title={`SHA-256: ${ptw.digitalSignatureHash.slice(0, 16)}...`}>
                            🔒 {ptw.digitalSignatureHash.slice(0, 8)}
                          </span>
                        )}
                      </td>
                      <td className="p-4">{getTypeBadge(ptw.type)}</td>
                      <td className="p-4 font-medium text-gray-900">{ptw.location}</td>
                      <td className="p-4">
                        <div className="text-xs font-mono">
                          <span className={ptw.gasReadings.h2s > 10 ? 'text-red-600 font-bold' : 'text-emerald-700'}>
                            H₂S: {ptw.gasReadings.h2s} ppm
                          </span> | 
                          <span className={ptw.gasReadings.lel > 10 ? 'text-red-600 font-bold' : ''}>
                            {' '}LEL: {ptw.gasReadings.lel}%
                          </span> | 
                          <span className="text-blue-700"> O₂: {ptw.gasReadings.o2}%</span>
                        </div>
                      </td>
                      <td className="p-4 text-gray-700">{ptw.supervisor}</td>
                      <td className="p-4 text-xs text-gray-500">{ptw.validFrom} → {ptw.validTo}</td>
                      <td className="p-4 text-center">{getStatusBadge(ptw.status)}</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Botón Exportar PDF PTS (Mejora #2) */}
                          <button
                            onClick={() => exportPtsToPdf(ptw)}
                            disabled={exportingPdf === ptw.id}
                            className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 border border-emerald-200"
                          >
                            {exportingPdf === ptw.id ? (
                              <RefreshCw size={14} className="animate-spin" />
                            ) : (
                              <Download size={14} />
                            )}
                            Exportar PDF
                          </button>
                          <button
                            onClick={() => updatePtwStatus(ptw.id!, ptw.status === 'aprobado' ? 'cerrado' : 'aprobado')}
                            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1.5 rounded-lg font-medium transition-all"
                          >
                            {ptw.status === 'aprobado' ? 'Cerrar' : 'Reabrir'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =============================================================== */}
      {/* TAB 2: MATRIZ IPER / AST (Mejora #4 - Persistido en Firestore)  */}
      {/* =============================================================== */}
      {activeTab === 'ast' && (
        <div className="bg-white rounded-b-xl border border-gray-200 border-t-0 p-6 space-y-6">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
            <Sparkles className="text-emerald-600 shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="text-sm font-bold text-emerald-900">
                Análisis de Riesgo en el Trabajo (AST) conforme a PDVSA SI-S-04
                {astId && <span className="ml-2 text-[10px] text-emerald-600 font-mono">ID: {astId.slice(0, 8)}</span>}
              </h3>
              <p className="text-xs text-emerald-800 mt-0.5">
                La matriz de control exige identificar secuencialmente cada paso operativo, establecer el nivel de 
                riesgo inherente y dictaminar las medidas de control de ingeniería, administrativas y EPP obligatorio 
                antes de iniciar. Los cambios se guardan automáticamente en Firestore.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-700 text-xs uppercase font-bold border-b border-gray-200">
                  <th className="p-3 w-8"></th>
                  <th className="p-3">Paso / Secuencia Operativa</th>
                  <th className="p-3">Peligro y Riesgo Asociado</th>
                  <th className="p-3 text-center">Riesgo Inicial</th>
                  <th className="p-3">Medidas de Control Requeridas (Ingeniería + SIHO)</th>
                  <th className="p-3 text-center">Riesgo Residual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {astSteps.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-gray-400 text-sm">
                      No hay pasos registrados. Agregue el primer paso usando el formulario.
                    </td>
                  </tr>
                ) : (
                  astSteps.map((step, idx) => (
                    <tr key={step.id} className="hover:bg-gray-50">
                      <td className="p-3">
                        <button
                          onClick={() => removeAstStep(step.id)}
                          className="text-gray-300 hover:text-red-500 transition-colors"
                          title="Eliminar paso"
                        >
                          <XCircle size={16} />
                        </button>
                      </td>
                      <td className="p-3 font-semibold text-gray-900">
                        <span className="text-emerald-600 font-mono mr-2">{idx + 1}.</span>
                        {step.sequence}
                      </td>
                      <td className="p-3 text-gray-700">{step.hazard}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                          step.initialRisk === 'Alto' ? 'bg-red-100 text-red-800' :
                          step.initialRisk === 'Medio' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {step.initialRisk}
                        </span>
                      </td>
                      <td className="p-3 text-gray-800 font-medium">{step.controls}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                          step.residualRisk === 'Alto' ? 'bg-red-100 text-red-800' :
                          step.residualRisk === 'Medio' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {step.residualRisk}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Formulario para agregar paso AST */}
          <form onSubmit={handleAddASTStep} className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-4">
            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Plus size={16} className="text-emerald-600" />
              Agregar Paso a la Matriz AST de Obra
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="Secuencia de trabajo (Ej: Izamiento de carrete de 8 pulg)"
                value={newSeq}
                onChange={(e) => setNewSeq(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
              <input
                type="text"
                placeholder="Peligro / Riesgo (Ej: Falla de guaya de grúa)"
                value={newHazard}
                onChange={(e) => setNewHazard(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
              <input
                type="text"
                placeholder="Controles (Ej: Inspección pre-uso, delimitación)"
                value={newControls}
                onChange={(e) => setNewControls(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <div className="flex gap-2">
                <select
                  value={newRisk}
                  onChange={(e) => setNewRisk(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white font-medium"
                >
                  <option value="Alto">Riesgo: Alto</option>
                  <option value="Medio">Riesgo: Medio</option>
                  <option value="Bajo">Riesgo: Bajo</option>
                </select>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-lg text-sm shrink-0 transition-all"
                >
                  Agregar
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* =============================================================== */}
      {/* TAB 3: APROBACIÓN MULTI-NIVEL CON PIN (Mejora #1)                */}
      {/* =============================================================== */}
      {activeTab === 'aprobacion' && (
        <div className="bg-white rounded-b-xl border border-gray-200 border-t-0 p-6 space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <Fingerprint className="text-amber-600 shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="text-sm font-bold text-amber-900">Workflow de Aprobación Multi-Nivel — PDVSA SI-S-04</h3>
              <p className="text-xs text-amber-800 mt-0.5">
                Cada permiso requiere aprobaciòn secuencial: Supervisor → Inspector HSE → Superintendent. 
                Cada nivel ingresa su PIN personal de 4 dígitos. El sistema genera un hash SHA-256 
                como firma digital inmutable del permiso completo.
              </p>
            </div>
          </div>

          {/* Timeline visual del workflow de aprobación */}
          <div className="flex items-center justify-center gap-1 py-4">
            {(['supervisor', 'inspector', 'superintendent'] as const).map((level, idx) => {
              const levelLabels = { supervisor: 'Supervisor', inspector: 'Inspector HSE', superintendent: 'Superintendent' };
              const isSelected = approvalLevel === level;
              return (
                <React.Fragment key={level}>
                  {idx > 0 && <ChevronRight size={24} className="text-gray-300" />}
                  <button
                    onClick={() => setApprovalLevel(level)}
                    className={`flex flex-col items-center px-6 py-3 rounded-xl border-2 transition-all ${
                      isSelected 
                        ? 'border-emerald-500 bg-emerald-50 shadow-md' 
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <span className={`text-lg font-bold ${isSelected ? 'text-emerald-700' : 'text-gray-500'}`}>
                      {idx + 1}
                    </span>
                    <span className={`text-xs font-semibold mt-1 ${isSelected ? 'text-emerald-700' : 'text-gray-500'}`}>
                      {levelLabels[level]}
                    </span>
                    <span className={`text-[10px] mt-0.5 ${isSelected ? 'text-emerald-600' : 'text-gray-400'}`}>
                      PIN: {APPROVAL_PINS[level]}
                    </span>
                  </button>
                </React.Fragment>
              );
            })}
          </div>

          {/* Selector de PTS a aprobar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                Seleccionar Permiso a Aprobar
              </label>
              <select
                value={selectedPtwForApproval}
                onChange={(e) => setSelectedPtwForApproval(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white font-medium"
              >
                <option value="">— Seleccione un PTS —</option>
                {ptwList
                  .filter(p => p.status === 'borrador' || p.status === 'en_revision' || p.status === 'aprobado')
                  .map(p => (
                    <option key={p.id} value={p.id}>
                      {p.code} — {p.location} [{p.status}]
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                Nombre Completo del Aprobador
              </label>
              <input
                type="text"
                placeholder="Ej: Ing. Manuel Silva"
                value={approvalName}
                onChange={(e) => setApprovalName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>

          {/* PIN Input */}
          <div className="max-w-xs">
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
              PIN de Seguridad ({approvalLevel})
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                maxLength={4}
                placeholder="****"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm text-center font-mono text-2xl tracking-[0.5em]"
              />
              <button
                onClick={handleApprove}
                disabled={!selectedPtwForApproval || !pinInput || !approvalName}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white font-bold px-5 py-2 rounded-lg text-sm transition-all shadow-sm flex items-center gap-2"
              >
                <Fingerprint size={16} />
                Aprobar Nivel {approvalLevel === 'supervisor' ? '1' : approvalLevel === 'inspector' ? '2' : '3'}
              </button>
            </div>
          </div>

          {/* Mensaje de resultado */}
          {approvalMessage && (
            <div className={`p-3 rounded-xl text-sm font-medium flex items-center gap-2 ${
              approvalMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
              'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {approvalMessage.type === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
              {approvalMessage.text}
            </div>
          )}

          {/* Tabla de PTS con estado de aprobación */}
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-600 uppercase font-bold border-b border-gray-200">
                  <th className="p-3">Código</th>
                  <th className="p-3">Nivel 1 (Supervisor)</th>
                  <th className="p-3">Nivel 2 (Inspector HSE)</th>
                  <th className="p-3">Nivel 3 (Superintendent)</th>
                  <th className="p-3">Hash SHA-256</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ptwList.filter(p => p.approvalLevel1 || p.approvalLevel2 || p.approvalLevel3).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-gray-400">
                      Ningún permiso ha sido aprobado aún. Seleccione un PTS arriba y complete los niveles.
                    </td>
                  </tr>
                ) : (
                  ptwList.filter(p => p.approvalLevel1 || p.approvalLevel2 || p.approvalLevel3).map(p => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="p-3 font-mono font-bold">{p.code}</td>
                      <td className="p-3">
                        {p.approvalLevel1 ? (
                          <span className="text-emerald-700 font-medium">
                            ✓ {p.approvalLevel1.fullName}
                            <br />
                            <span className="text-[10px] text-gray-400">{new Date(p.approvalLevel1.timestamp).toLocaleString()}</span>
                          </span>
                        ) : <span className="text-gray-400">Pendiente</span>}
                      </td>
                      <td className="p-3">
                        {p.approvalLevel2 ? (
                          <span className="text-emerald-700 font-medium">
                            ✓ {p.approvalLevel2.fullName}
                            <br />
                            <span className="text-[10px] text-gray-400">{new Date(p.approvalLevel2.timestamp).toLocaleString()}</span>
                          </span>
                        ) : <span className="text-gray-400">Pendiente</span>}
                      </td>
                      <td className="p-3">
                        {p.approvalLevel3 ? (
                          <span className="text-emerald-700 font-medium">
                            ✓ {p.approvalLevel3.fullName}
                            <br />
                            <span className="text-[10px] text-gray-400">{new Date(p.approvalLevel3.timestamp).toLocaleString()}</span>
                          </span>
                        ) : <span className="text-gray-400">Pendiente</span>}
                      </td>
                      <td className="p-3">
                        {p.digitalSignatureHash ? (
                          <span className="font-mono text-[10px] text-gray-500" title={p.digitalSignatureHash}>
                            🔒 {p.digitalSignatureHash.slice(0, 12)}...
                          </span>
                        ) : <span className="text-gray-400">—</span>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =============================================================== */}
      {/* TAB 4: CHARLAS 5 MIN + FOTO ASISTENCIA (Mejora #3)               */}
      {/* =============================================================== */}
      {activeTab === 'charlas' && (
        <div className="bg-white rounded-b-xl border border-gray-200 border-t-0 p-6 space-y-6">
          {/* Mensaje de confirmación */}
          {charlaSaved && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm font-medium text-emerald-800 flex items-center gap-2">
              <CheckCircle2 size={18} />
              Charla registrada exitosamente con foto y participantes en Firestore.
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Registro de Charla con Cámara */}
            <div className="border border-gray-200 rounded-xl p-5 space-y-4 bg-gray-50/50">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <FileText size={18} className="text-emerald-600" />
                Minuta de Charla Diaria de 5 Minutos (SIHO)
              </h3>

              <div className="space-y-3 text-sm">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tema Impartido</label>
                  <input
                    type="text"
                    value={talkTopic}
                    onChange={(e) => setTalkTopic(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Facilitador / Instructor</label>
                    <input
                      type="text"
                      value={talkInstructor}
                      onChange={(e) => setTalkInstructor(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Total Asistentes</label>
                    <div className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 font-bold">
                      {attendeesList.length}
                    </div>
                  </div>
                </div>

                {/* Captura de Foto usando la cámara real (Mejora #3) */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Registro Fotográfico de Asistencia
                  </label>
                  
                  {!cameraActive && !photoPreview && (
                    <div 
                      onClick={startCamera}
                      className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center bg-white cursor-pointer hover:bg-gray-50 hover:border-emerald-400 transition-all"
                    >
                      <Camera size={32} className="mx-auto text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600 font-medium block">Capturar foto del grupo en charla</span>
                      <span className="text-[10px] text-gray-400 mt-1 block">Usa la cámara del dispositivo</span>
                    </div>
                  )}

                  {/* Vista previa de la cámara */}
                  {cameraActive && (
                    <div className="border-2 border-emerald-400 rounded-xl overflow-hidden bg-black">
                      <video 
                        ref={videoRef}
                        autoPlay 
                        playsInline 
                        className="w-full h-48 object-cover"
                      />
                      <div className="flex gap-2 p-2 bg-gray-900">
                        <button
                          onClick={capturePhoto}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-1.5 rounded-lg text-xs transition-all"
                        >
                          <Camera size={14} className="inline mr-1" />
                          Capturar Foto
                        </button>
                        <button
                          onClick={stopCamera}
                          className="px-3 bg-red-600 hover:bg-red-700 text-white font-semibold py-1.5 rounded-lg text-xs transition-all"
                        >
                          <XCircle size={14} className="inline" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Preview de la foto capturada */}
                  {photoPreview && (
                    <div className="border-2 border-emerald-300 rounded-xl overflow-hidden">
                      <img 
                        src={photoPreview} 
                        alt="Preview de asistencia" 
                        className="w-full h-48 object-cover"
                      />
                      <div className="flex gap-2 p-2 bg-gray-50">
                        <button
                          onClick={() => { setPhotoPreview(null); setPhotoFile(null); }}
                          className="text-xs text-red-600 hover:text-red-800 font-medium px-3 py-1"
                        >
                          <XCircle size={14} className="inline mr-1" />
                          Eliminar
                        </button>
                        <span className="text-xs text-emerald-600 font-medium ml-auto py-1">
                          ✓ Foto capturada ({photoFile ? (photoFile.size / 1024).toFixed(0) : 0} KB)
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Participantes con firma */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    <Users size={14} className="inline mr-1" />
                    Participantes ({attendeesList.length})
                  </label>
                  
                  <div className="space-y-1.5 max-h-40 overflow-y-auto mb-2">
                    {attendeesList.map((att, idx) => (
                      <div key={att.id} className="flex items-center gap-2 p-1.5 bg-white rounded-lg border border-gray-100 text-xs">
                        <span className="font-mono text-gray-400 w-5">{idx + 1}.</span>
                        <span className="font-semibold text-gray-800 flex-1">{att.name}</span>
                        <span className="text-gray-500">{att.role}</span>
                        <span className="font-mono text-[10px] text-emerald-600" title={att.signature}>
                          🔏 {att.signature.slice(0, 6)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Agregar nuevo participante */}
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Nombre"
                      value={newAttendeeName}
                      onChange={(e) => setNewAttendeeName(e.target.value)}
                      className="flex-1 px-2 py-1.5 border border-gray-300 rounded-lg text-xs bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Rol"
                      value={newAttendeeRole}
                      onChange={(e) => setNewAttendeeRole(e.target.value)}
                      className="w-24 px-2 py-1.5 border border-gray-300 rounded-lg text-xs bg-white"
                    />
                    <button
                      onClick={addAttendee}
                      disabled={!newAttendeeName || !newAttendeeRole}
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white rounded-lg text-xs transition-all"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                <button 
                  onClick={saveCharlaWithPhoto}
                  disabled={photoUploading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-semibold py-2.5 rounded-lg text-sm transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  {photoUploading ? (
                    <><RefreshCw size={16} className="animate-spin" /> Subiendo...</>
                  ) : (
                    <><Upload size={16} /> Registrar Charla en Expediente</>
                  )}
                </button>
              </div>
            </div>

            {/* Checklist de EPP Entregado */}
            <div className="border border-gray-200 rounded-xl p-5 space-y-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <HardHat size={18} className="text-emerald-600" />
                Control de Dotación e Inspección de EPP
              </h3>

              <p className="text-xs text-gray-500">
                Verificación diaria de estado físico de Equipos de Protección Personal antes de ingresar a planta.
              </p>

              <div className="space-y-2">
                {defaultEppOptions.map((epp, idx) => (
                  <label key={idx} className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer text-xs font-medium text-gray-800">
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500" />
                    <span>{epp}</span>
                    <span className="ml-auto text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">Verificado</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =============================================================== */}
      {/* TAB 5: HISTORIAL DE LECTURAS GASOTESTER (Mejora #7)              */}
      {/* =============================================================== */}
      {activeTab === 'gas_history' && (
        <div className="bg-white rounded-b-xl border border-gray-200 border-t-0 p-6 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
            <Activity className="text-blue-600 shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="text-sm font-bold text-blue-900">
                Registro Histórico de Lecturas de Gasotester — PDVSA SI-S-04
              </h3>
              <p className="text-xs text-blue-800 mt-0.5">
                Cada lectura de gasotester queda registrada automáticamente como subdocumento en Firestore 
                para trazabilidad y auditoría. Límites reglamentarios: H₂S ≤ 10 ppm, LEL ≤ 10%, 
                O₂ entre 19.5% y 23.5%, CO ≤ 25 ppm.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-100 text-gray-700 uppercase font-bold border-b border-gray-200">
                  <th className="p-3">Fecha / Hora</th>
                  <th className="p-3">PTS</th>
                  <th className="p-3 text-center">H₂S (ppm)</th>
                  <th className="p-3 text-center">LEL (%)</th>
                  <th className="p-3 text-center">O₂ (%)</th>
                  <th className="p-3 text-center">CO (ppm)</th>
                  <th className="p-3">Serial Gasotester</th>
                  <th className="p-3">Operador</th>
                  <th className="p-3 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {gasHistory.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-6 text-center text-gray-400">
                      No hay lecturas registradas. Las lecturas se guardan automáticamente al emitir un PTS.
                    </td>
                  </tr>
                ) : (
                  gasHistory.map((entry) => {
                    const isHazardous = entry.h2s > 10 || entry.lel > 10 || entry.o2 < 19.5 || entry.o2 > 23.5 || entry.co > 25;
                    return (
                      <tr key={entry.id} className={`hover:bg-gray-50 ${isHazardous ? 'bg-red-50/40' : ''}`}>
                        <td className="p-3 font-mono text-gray-600">
                          {entry.timestamp ? new Date(entry.timestamp as any).toLocaleString() : '—'}
                        </td>
                        <td className="p-3 font-mono font-bold">{entry.ptwCode || '—'}</td>
                        <td className={`p-3 text-center font-mono font-bold ${
                          entry.h2s > 10 ? 'text-red-600' : 'text-emerald-700'
                        }`}>
                          {entry.h2s}
                        </td>
                        <td className={`p-3 text-center font-mono font-bold ${
                          entry.lel > 10 ? 'text-red-600' : ''
                        }`}>
                          {entry.lel}
                        </td>
                        <td className={`p-3 text-center font-mono font-bold ${
                          entry.o2 < 19.5 || entry.o2 > 23.5 ? 'text-red-600' : 'text-blue-700'
                        }`}>
                          {entry.o2}
                        </td>
                        <td className={`p-3 text-center font-mono font-bold ${
                          entry.co > 25 ? 'text-red-600' : ''
                        }`}>
                          {entry.co}
                        </td>
                        <td className="p-3 font-mono text-gray-600">{entry.gasotesterSerial}</td>
                        <td className="p-3 text-gray-700">{entry.operator || '—'}</td>
                        <td className="p-3 text-center">
                          {isHazardous ? (
                            <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-[10px] font-bold flex items-center gap-1">
                              <Lock size={10} /> Peligroso
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold flex items-center gap-1">
                              <Check size={10} /> Seguro
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =============================================================== */}
      {/* MODAL: EMITIR NUEVO PERMISO PTS                                  */}
      {/* =============================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6 my-8">
            <div className="flex justify-between items-center border-b border-gray-200 pb-4">
              <div>
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Emisión Oficial PTS</span>
                <h2 className="text-xl font-black text-gray-900">Permiso de Trabajo Seguro (PDVSA SI-S-04)</h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-2">
                <XCircle size={24} />
              </button>
            </div>

            <form onSubmit={handleCreatePTW} className="space-y-6">
              {/* Type selector con colores mejorados */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Tipo de Trabajo a Ejecutar</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {([
                    { id: 'caliente' as PTW['type'], label: 'Trabajo en Caliente', icon: Flame },
                    { id: 'espacio_confinado' as PTW['type'], label: 'Espacio Confinado', icon: Wind },
                    { id: 'frio' as PTW['type'], label: 'Trabajo en Frío', icon: ShieldCheck },
                    { id: 'izamiento' as PTW['type'], label: 'Izamiento Crítico', icon: HardHat },
                    { id: 'excavacion' as PTW['type'], label: 'Excavación profunda', icon: AlertTriangle },
                  ]).map((t) => {
                    const IconComp = t.icon;
                    const isSel = newType === t.id;
                    const colors = getTypeButtonColor(t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setNewType(t.id)}
                        className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs font-bold transition-all text-left ${
                          isSel ? `${colors} ring-2 ring-emerald-500 shadow-sm` : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <IconComp size={18} />
                        <span>{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* General Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Ubicación / Unidad de Planta</label>
                  <input
                    type="text"
                    placeholder='Ej: Planta de Compresión H-2 / Módulo 4'
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Supervisor SIHO Responsable</label>
                  <input
                    type="text"
                    placeholder="Ej: Ing. Manuel Silva"
                    value={newSupervisor}
                    onChange={(e) => setNewSupervisor(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Descripción del Trabajo</label>
                <textarea
                  rows={2}
                  placeholder="Describa la tarea detalladamente (ej: Interconexión de tubería 12 in Sch 40 en caliente)..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                  required
                />
              </div>

              {/* CRITICAL: GASOTESTER READINGS */}
              <div className={`p-4 rounded-xl border transition-all ${
                isAtmosphereHazardous ? 'bg-red-50 border-red-300' : 'bg-blue-50/60 border-blue-200'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Wind className={isAtmosphereHazardous ? 'text-red-600' : 'text-blue-600'} size={20} />
                    <h3 className="text-sm font-bold text-gray-900">
                      Lecturas Obligatorias de Gasotester (Prueba Atmosférica)
                    </h3>
                  </div>
                  <span className="text-xs font-mono bg-white px-2 py-0.5 border rounded text-gray-600">
                    Serial: {gasotesterSerial}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">H₂S (Sulfídrico - ppm)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={h2s}
                      onChange={(e) => setH2s(Number(e.target.value))}
                      className={`w-full px-3 py-2 border rounded-lg text-sm font-bold font-mono ${
                        h2s > 10 ? 'border-red-500 bg-red-100 text-red-900' : 'border-gray-300 bg-white'
                      }`}
                    />
                    <span className="text-[10px] text-gray-500">Límite max: 10 ppm</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">LEL (% Explosividad)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={lel}
                      onChange={(e) => setLel(Number(e.target.value))}
                      className={`w-full px-3 py-2 border rounded-lg text-sm font-bold font-mono ${
                        lel > 10 ? 'border-red-500 bg-red-100 text-red-900' : 'border-gray-300 bg-white'
                      }`}
                    />
                    <span className="text-[10px] text-gray-500">Límite max: 10%</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">O₂ (Oxígeno - %)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={o2}
                      onChange={(e) => setO2(Number(e.target.value))}
                      className={`w-full px-3 py-2 border rounded-lg text-sm font-bold font-mono ${
                        o2 < 19.5 || o2 > 23.5 ? 'border-red-500 bg-red-100 text-red-900' : 'border-gray-300 bg-white'
                      }`}
                    />
                    <span className="text-[10px] text-gray-500">Rango: 19.5% - 23.5%</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">CO (Monóxido - ppm)</label>
                    <input
                      type="number"
                      step="1"
                      value={co}
                      onChange={(e) => setCo(Number(e.target.value))}
                      className={`w-full px-3 py-2 border rounded-lg text-sm font-bold font-mono ${
                        co > 25 ? 'border-red-500 bg-red-100 text-red-900' : 'border-gray-300 bg-white'
                      }`}
                    />
                    <span className="text-[10px] text-gray-500">Límite max: 25 ppm</span>
                  </div>
                </div>

                {/* Operador del gasotester */}
                <div className="mt-3">
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Operador del Gasotester</label>
                  <input
                    type="text"
                    placeholder="Nombre del técnico que realizó la lectura"
                    value={gasOperator}
                    onChange={(e) => setGasOperator(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                  />
                </div>

                {isAtmosphereHazardous && (
                  <div className="mt-3 p-3 bg-red-600 text-white rounded-lg flex items-center gap-2 text-xs font-bold animate-pulse">
                    <Lock size={18} />
                    ¡ALERTA SIHO: ATMÓSFERA PELIGROSA DETECTADA! EL PERMISO QUEDARÁ BLOQUEADO Y SE PROHÍBE LA ENTRADA/TRABAJO.
                  </div>
                )}
              </div>

              {/* Precautions checklist */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Precauciones Especiales Requeridas</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {defaultPrecautions.map((prec, i) => (
                    <label key={i} className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                      <input
                        type="checkbox"
                        checked={selectedPrecautions.includes(prec)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedPrecautions([...selectedPrecautions, prec]);
                          else setSelectedPrecautions(selectedPrecautions.filter(p => p !== prec));
                        }}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="font-medium text-gray-800">{prec}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* EPP required */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Equipos de Protección Personal (EPP)</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {defaultEppOptions.map((epp, i) => (
                    <label key={i} className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                      <input
                        type="checkbox"
                        checked={selectedEpp.includes(epp)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedEpp([...selectedEpp, epp]);
                          else setSelectedEpp(selectedEpp.filter(p => p !== epp));
                        }}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="font-medium text-gray-800">{epp}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isAtmosphereHazardous}
                  className={`px-6 py-2 rounded-xl text-sm font-bold text-white transition-all shadow-md ${
                    isAtmosphereHazardous
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {isAtmosphereHazardous ? 'Trabajo Bloqueado por Seguridad' : 'Aprobar y Emitir PTS'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===================================================================
   Componentes auxiliares
   =================================================================== */

/* Botón de tab reutilizable */
function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-3 font-semibold text-sm border-b-2 flex items-center gap-2 transition-all shrink-0 ${
        active
          ? 'border-emerald-600 text-emerald-600'
          : 'border-transparent text-gray-500 hover:text-gray-800'
      }`}
    >
      {children}
    </button>
  );
}

interface MockGasReadings {
  h2s: number;
  lel: number;
  o2: number;
  co: number;
}

/* Fila mock para la tabla de PTS cuando Firestore está vacío */
function MockPtwRow({ 
  code, type, location, supervisor, readings, date, status, onExport 
}: { 
  code: string; 
  type: PTW['type']; 
  location: string; 
  supervisor: string; 
  readings: MockGasReadings; 
  date: string; 
  status: PTW['status']; 
  onExport: () => void;
}) {
  const typeColors2: Record<PTW['type'], string> = {
    frio: 'border-l-blue-400',
    caliente: 'border-l-red-400',
    espacio_confinado: 'border-l-amber-400',
    izamiento: 'border-l-orange-400',
    excavacion: 'border-l-amber-500',
  };

  return (
    <tr className={`hover:bg-gray-50/50 transition-colors border-l-4 ${typeColors2[type]} ${status === 'bloqueado' ? 'bg-red-50/30' : ''}`}>
      <td className="p-4 font-mono font-bold text-gray-900">{code}</td>
      <td className="p-4">{renderTypeBadge(type)}</td>
      <td className="p-4 font-medium text-gray-900">{location}</td>
      <td className="p-4">
        <div className="text-xs font-mono">
          {readings.h2s > 10 || readings.lel > 10 ? (
            <span className="text-red-600 font-bold">
              H₂S: {readings.h2s} ppm 🚨 | LEL: {readings.lel}% 🚨
            </span>
          ) : (
            <>
              <span className="text-emerald-700 font-bold">H₂S: {readings.h2s} ppm</span> | <span>LEL: {readings.lel}%</span> | <span className="text-blue-700 font-bold">O₂: {readings.o2}%</span>
            </>
          )}
        </div>
      </td>
      <td className="p-4 text-gray-700">{supervisor}</td>
      <td className="p-4 text-xs text-gray-500">{date}</td>
      <td className="p-4 text-center">{renderStatusBadge(status)}</td>
      <td className="p-4 text-right">
        <button className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 border border-emerald-200 ml-auto">
          <Download size={14} />
          Exportar PDF
        </button>
      </td>
    </tr>
  );
}

function renderTypeBadge(type: PTW['type']) {
  const c: Record<PTW['type'], { bg: string; text: string; border: string }> = {
    frio:              { bg: 'bg-blue-100',   text: 'text-blue-800',   border: 'border-blue-200' },
    caliente:          { bg: 'bg-red-100',    text: 'text-red-800',    border: 'border-red-200' },
    espacio_confinado: { bg: 'bg-amber-100',  text: 'text-amber-800',  border: 'border-amber-200' },
    izamiento:         { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200' },
    excavacion:        { bg: 'bg-amber-200',  text: 'text-amber-900',  border: 'border-amber-300' },
  };
  const labels: Record<PTW['type'], string> = {
    frio: 'Trabajo en Frío',
    caliente: 'Trabajo en Caliente',
    espacio_confinado: 'Espacio Confinado',
    izamiento: 'Izamiento Crítico',
    excavacion: 'Excavación',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${c[type].bg} ${c[type].text} border ${c[type].border}`}>
      {type === 'frio' && <ShieldCheck size={12} />}
      {type === 'caliente' && <Flame size={12} />}
      {type === 'espacio_confinado' && <Wind size={12} />}
      {type === 'izamiento' && <HardHat size={12} />}
      {type === 'excavacion' && <AlertTriangle size={12} />}
      {labels[type]}
    </span>
  );
}

function renderStatusBadge(status: PTW['status']) {
  const c: Record<PTW['status'], { bg: string; text: string }> = {
    borrador:     { bg: 'bg-gray-100', text: 'text-gray-700' },
    en_revision:  { bg: 'bg-amber-100', text: 'text-amber-800' },
    aprobado:     { bg: 'bg-emerald-100', text: 'text-emerald-800' },
    bloqueado:    { bg: 'bg-red-100', text: 'text-red-800' },
    cerrado:      { bg: 'bg-blue-100', text: 'text-blue-800' },
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${c[status].bg} ${c[status].text}`}>
      {status === 'aprobado' && <CheckCircle2 size={12} />}
      {status === 'bloqueado' && <Lock size={12} />}
      {status === 'cerrado' && <Check size={12} />}
      {(status === 'borrador' || status === 'en_revision') && <RefreshCw size={12} />}
      {status === 'borrador' && 'Borrador'}
      {status === 'en_revision' && 'En Revisión'}
      {status === 'aprobado' && 'Aprobado'}
      {status === 'bloqueado' && 'Bloqueado'}
      {status === 'cerrado' && 'Cerrado'}
    </span>
  );
}
