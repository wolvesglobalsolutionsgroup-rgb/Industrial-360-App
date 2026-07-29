import React, { useState, useEffect } from 'react';
import { 
  QrCode, UserCheck, ShieldCheck, AlertTriangle, CheckCircle2, XCircle, 
  Search, Download, Plus, Clock, Users, HardHat, FileSpreadsheet, 
  Calendar, Award, Camera, RefreshCw, Printer, ShieldAlert, Sparkles, Filter,
  Upload, Image as ImageIcon, HeartPulse, RotateCw
} from 'lucide-react';
import { collection, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useProject } from '../ProjectContext';
import { queueOfflineOperation } from '../lib/offlineSync';
import jsPDF from 'jspdf';

export interface FieldWorker {
  id: string;
  nationalId: string; // Cédula e.g. V-18.492.102
  fullName: string;
  role: string; // e.g. Soldador SMAW/GTAW 6G ASME IX
  contractor: string; // e.g. Consorcio Vial & Tubos C.A.
  welderStamp?: string; // e.g. W-402
  bloodType: string; // e.g. O+
  allergies?: string; // e.g. Penicilina / Ninguna
  photoUrl?: string; // Base64 or Image URL
  medicalCheckValidUntil: string; // YYYY-MM-DD
  sihoInductionValidUntil: string; // YYYY-MM-DD (PDVSA SI-S-04)
  wpqCertValidUntil?: string; // YYYY-MM-DD (ASME IX / API 1104)
  fitStatus: 'Apto' | 'Apto con Restricciones' | 'No Apto';
  activePermitId?: string;
  totalHhtAccumulated: number;
}

export interface AttendanceRecord {
  id: string;
  workerId: string;
  workerName: string;
  nationalId: string;
  role: string;
  contractor: string;
  checkInTime: string; // ISO string
  checkOutTime?: string; // ISO string
  hoursWorked: number;
  gateLocation: string; // e.g. Portón Principal Refinería PLC
  accessStatus: 'Verde - Autorizado' | 'Rojo - Denegado';
  denialReason?: string;
  date: string; // YYYY-MM-DD
}

const SAMPLE_WORKERS: FieldWorker[] = [
  {
    id: 'w_101',
    nationalId: 'V-18.492.102',
    fullName: 'José Manuel Pérez',
    role: 'Soldador ASME IX 6G (GTAW/SMAW)',
    contractor: 'Consorcio O&G Campo Sur',
    welderStamp: 'W-402',
    bloodType: 'O+',
    allergies: 'Ninguna',
    medicalCheckValidUntil: '2026-11-15',
    sihoInductionValidUntil: '2026-10-30',
    wpqCertValidUntil: '2026-12-01',
    fitStatus: 'Apto',
    totalHhtAccumulated: 1240,
  },
  {
    id: 'w_102',
    nationalId: 'V-15.829.301',
    fullName: 'Carlos Alberto Rodríguez',
    role: 'Capataz Pipefitter / Tubero Especializado',
    contractor: 'Consorcio O&G Campo Sur',
    bloodType: 'A+',
    allergies: 'Penicilina',
    medicalCheckValidUntil: '2026-09-20',
    sihoInductionValidUntil: '2026-08-10',
    fitStatus: 'Apto',
    totalHhtAccumulated: 2100,
  },
  {
    id: 'w_103',
    nationalId: 'V-22.104.982',
    fullName: 'Marcos Silva',
    role: 'Inspector NDT / ASNT Nivel II (PAUT/RT)',
    contractor: 'SGS Inspecciones Industriales',
    bloodType: 'O-',
    allergies: 'Polvo / Humos',
    medicalCheckValidUntil: '2026-12-31',
    sihoInductionValidUntil: '2026-11-20',
    fitStatus: 'Apto',
    totalHhtAccumulated: 980,
  },
  {
    id: 'w_104',
    nationalId: 'V-19.401.229',
    fullName: 'Jesús Eduardo Blanco',
    role: 'Ayudante de Tubero / Rigger',
    contractor: 'Servicios Industriales Monagas',
    bloodType: 'B+',
    allergies: 'Aspirina',
    medicalCheckValidUntil: '2026-01-15',
    sihoInductionValidUntil: '2026-02-01',
    fitStatus: 'No Apto',
    totalHhtAccumulated: 620,
  },
];

export default function WorkerQrRegistry() {
  const { currentProject, currentOrganization } = useProject();
  const orgId = currentOrganization?.id || 'semax_pino';
  const projId = currentProject?.id || 'all';

  const [workers, setWorkers] = useState<FieldWorker[]>(SAMPLE_WORKERS);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceRecord[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<FieldWorker>(SAMPLE_WORKERS[0]);
  const [cardSide, setCardSide] = useState<'front' | 'back'>('front');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('todos');

  // Scanner Simulator
  const [scanResult, setScanResult] = useState<{
    worker?: FieldWorker;
    status: 'Verde' | 'Rojo';
    reasons: string[];
  } | null>(null);

  // New Worker Form Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newNationalId, setNewNationalId] = useState('');
  const [newRole, setNewRole] = useState('Soldador ASME IX 6G');
  const [newContractor, setNewContractor] = useState('Consorcio O&G Campo Sur');
  const [newWelderStamp, setNewWelderStamp] = useState('');
  const [newBloodType, setNewBloodType] = useState('O+');
  const [newAllergies, setNewAllergies] = useState('Ninguna');
  const [newPhotoUrl, setNewPhotoUrl] = useState<string>('');

  // Fetch Workers & Attendance from Firestore
  useEffect(() => {
    if (!currentProject || currentProject.id === 'all') return;

    const workersPath = `organizations/${orgId}/projects/${currentProject.id}/workers`;
    const attendancePath = `organizations/${orgId}/projects/${currentProject.id}/worker_attendance`;

    const unsubWorkers = onSnapshot(collection(db, workersPath), (snapshot) => {
      const loaded: FieldWorker[] = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      } as FieldWorker));
      setWorkers(loaded); // Automatically turns off mock data when Firestore returns documents
      if (loaded.length > 0) {
        setSelectedWorker(loaded[0]);
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, workersPath);
    });

    const unsubAttendance = onSnapshot(collection(db, attendancePath), (snapshot) => {
      const loaded: AttendanceRecord[] = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      } as AttendanceRecord));
      setAttendanceLogs(loaded);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, attendancePath);
    });

    return () => {
      unsubWorkers();
      unsubAttendance();
    };
  }, [currentProject, orgId]);

  // Handle Photo Upload (Base64)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, targetWorkerId?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (targetWorkerId) {
        setWorkers(prev => prev.map(w => w.id === targetWorkerId ? { ...w, photoUrl: base64String } : w));
        if (selectedWorker?.id === targetWorkerId) {
          setSelectedWorker(prev => ({ ...prev, photoUrl: base64String }));
        }
        if (currentProject && currentProject.id !== 'all') {
          const workerDocPath = `organizations/${orgId}/projects/${currentProject.id}/workers/${targetWorkerId}`;
          updateDoc(doc(db, workerDocPath), { photoUrl: base64String }).catch(() => {
            queueOfflineOperation(`organizations/${orgId}/projects/${currentProject.id}/workers`, 'update', { photoUrl: base64String }, targetWorkerId);
          });
        }
      } else {
        setNewPhotoUrl(base64String);
      }
    };
    reader.readAsDataURL(file);
  };

  // Gate Scanner Verification Engine
  const verifyWorkerAccess = (worker: FieldWorker) => {
    const today = new Date().toISOString().split('T')[0];
    const reasons: string[] = [];

    const isMedicalValid = worker.medicalCheckValidUntil >= today;
    const isSihoValid = worker.sihoInductionValidUntil >= today;
    const isFit = worker.fitStatus !== 'No Apto';

    if (!isMedicalValid) {
      reasons.push(`Examen Médico Vencido (${worker.medicalCheckValidUntil})`);
    }
    if (!isSihoValid) {
      reasons.push(`Inducción SIHO-A PDVSA SI-S-04 Vencida (${worker.sihoInductionValidUntil})`);
    }
    if (!isFit) {
      reasons.push(`Estatus Médico de Inaptitud (${worker.fitStatus})`);
    }

    const status: 'Verde' | 'Rojo' = reasons.length === 0 ? 'Verde' : 'Rojo';
    setScanResult({ worker, status, reasons });

    // Record check-in automatically
    recordCheckIn(worker, status, reasons.join(' | '));
  };

  const handleScanWorker = (worker: FieldWorker) => {
    setSelectedWorker(worker);
    verifyWorkerAccess(worker);
  };

  // Record Check-in to Firestore / Offline Store
  const recordCheckIn = async (worker: FieldWorker, status: 'Verde' | 'Rojo', denialReason?: string) => {
    const today = new Date().toISOString().split('T')[0];
    const newRecord: Record<string, any> = {
      workerId: worker.id,
      workerName: worker.fullName,
      nationalId: worker.nationalId,
      role: worker.role,
      contractor: worker.contractor,
      checkInTime: new Date().toISOString(),
      hoursWorked: status === 'Verde' ? 8 : 0,
      gateLocation: 'Portón Principal Refinería PLC - Control HHT',
      accessStatus: status === 'Verde' ? 'Verde - Autorizado' : 'Rojo - Denegado',
      date: today
    };
    if (denialReason) {
      newRecord.denialReason = denialReason;
    }

    if (currentProject && currentProject.id !== 'all') {
      const attendancePath = `organizations/${orgId}/projects/${currentProject.id}/worker_attendance`;
      try {
        const docRef = await addDoc(collection(db, attendancePath), {
          ...newRecord,
          orgId,
          projectId: currentProject.id,
          createdAt: serverTimestamp()
        });
        setAttendanceLogs(prev => [{ id: docRef.id, ...newRecord } as AttendanceRecord, ...prev]);
      } catch (err) {
        await queueOfflineOperation('worker_attendance', 'create', { ...newRecord, orgId, projectId: currentProject.id });
        setAttendanceLogs(prev => [{ id: `att_off_${Date.now()}`, ...newRecord } as AttendanceRecord, ...prev]);
      }
    } else {
      setAttendanceLogs(prev => [{ id: `att_local_${Date.now()}`, ...newRecord } as AttendanceRecord, ...prev]);
    }
  };

  // Create Worker
  const handleCreateWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    const today = new Date();
    const nextYear = new Date(today.setFullYear(today.getFullYear() + 1)).toISOString().split('T')[0];

    const workerObj: Record<string, any> = {
      nationalId: newNationalId,
      fullName: newFullName,
      role: newRole,
      contractor: newContractor,
      bloodType: newBloodType,
      allergies: newAllergies || 'Ninguna',
      photoUrl: newPhotoUrl || undefined,
      medicalCheckValidUntil: nextYear,
      sihoInductionValidUntil: nextYear,
      fitStatus: 'Apto',
      totalHhtAccumulated: 0
    };
    if (newWelderStamp) {
      workerObj.welderStamp = newWelderStamp;
    }

    const newWorkerItem = { id: '', ...workerObj } as FieldWorker;

    if (currentProject && currentProject.id !== 'all') {
      const workersPath = `organizations/${orgId}/projects/${currentProject.id}/workers`;
      try {
        const docRef = await addDoc(collection(db, workersPath), {
          ...workerObj,
          orgId,
          projectId: currentProject.id,
          createdAt: serverTimestamp()
        });
        setWorkers(prev => [...prev, { ...newWorkerItem, id: docRef.id }]);
      } catch (err) {
        await queueOfflineOperation('workers', 'create', { ...workerObj, orgId, projectId: currentProject.id });
        setWorkers(prev => [...prev, { ...newWorkerItem, id: `w_off_${Date.now()}` }]);
      }
    } else {
      setWorkers(prev => [...prev, { ...newWorkerItem, id: `w_local_${Date.now()}` }]);
    }

    setShowAddModal(false);
    setNewFullName('');
    setNewNationalId('');
    setNewWelderStamp('');
    setNewPhotoUrl('');
  };

  // Generate PVC ID Card PDF
  const printWorkerCardPdf = (worker: FieldWorker) => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [85.6, 54] // Standard PVC ID card format (CR80)
    });

    // FRONT SIDE
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 85.6, 54, 'F');

    // Header Band
    doc.setFillColor(13, 148, 136); // brand teal
    doc.rect(0, 0, 85.6, 9, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('INDUSTRIAL CONTROL 360', 4, 6);
    doc.setFontSize(5);
    doc.text('PDVSA SI-S-04 COMPLIANT', 52, 6);

    // Photo Box
    doc.setFillColor(30, 41, 59);
    doc.rect(4, 12, 22, 26, 'F');
    doc.setDrawColor(13, 148, 136);
    doc.rect(4, 12, 22, 26, 'S');

    if (worker.photoUrl) {
      try {
        doc.addImage(worker.photoUrl, 'JPEG', 4.5, 12.5, 21, 25);
      } catch {
        doc.setTextColor(148, 163, 184);
        doc.setFontSize(12);
        doc.text(worker.fullName.charAt(0), 12, 27);
      }
    } else {
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(12);
      doc.text(worker.fullName.charAt(0), 12, 27);
    }

    // Details
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text(worker.fullName.substring(0, 24), 29, 15);

    doc.setTextColor(45, 212, 191);
    doc.setFontSize(7.5);
    doc.text(`C.I.: ${worker.nationalId}`, 29, 20);

    doc.setTextColor(203, 213, 225);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.text(`Cargo: ${worker.role.substring(0, 26)}`, 29, 25);
    doc.text(`Empresa: ${worker.contractor.substring(0, 26)}`, 29, 29);
    if (worker.welderStamp) {
      doc.text(`Estampa: ${worker.welderStamp}`, 29, 33);
    }

    // SIHO Traffic Light Badge
    const isApto = worker.fitStatus === 'Apto';
    doc.setFillColor(isApto ? 16 : 220, isApto ? 185 : 38, isApto ? 129 : 38);
    doc.rect(29, 35, 28, 5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.text(isApto ? '🟢 SIHO: APTO OBRA' : '🔴 SIHO: NO APTO', 31, 38.5);

    // Footer Info
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 43, 85.6, 11, 'F');
    doc.setFontSize(5.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`Med: ${worker.medicalCheckValidUntil}`, 4, 47);
    doc.text(`SIHO: ${worker.sihoInductionValidUntil}`, 28, 47);
    doc.text(`Sangre: ${worker.bloodType}`, 52, 47);
    doc.text(`Alergias: ${worker.allergies || 'Ninguna'}`, 4, 51);

    // BACK SIDE (Page 2)
    doc.addPage([85.6, 54], 'landscape');
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 85.6, 54, 'F');

    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, 85.6, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('REVERSO - CONTROL DE ACCESO EN PORTÓN', 4, 5.5);

    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225);
    doc.text('1. Portar en lugar visible en casco o chaleco.', 4, 14);
    doc.text('2. Sujeto a validación QR biimétrica en portón.', 4, 18);
    doc.text('3. Cumple norma PDVSA SI-S-04 y COVENIN 2260.', 4, 22);
    doc.text(`4. Certificación WPQ: ${worker.wpqCertValidUntil || 'N/A'}`, 4, 26);
    doc.text(`5. HHT Acumuladas: ${worker.totalHhtAccumulated} Horas Hombre`, 4, 30);
    doc.text(`6. Emergencias: 0800-PDVSA-911`, 4, 34);

    // QR Box
    doc.setFillColor(255, 255, 255);
    doc.rect(58, 12, 22, 22, 'F');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(5);
    doc.setFont('helvetica', 'bold');
    doc.text('SCAN QR', 63, 23);

    doc.setFillColor(13, 148, 136);
    doc.rect(0, 48, 85.6, 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(5);
    doc.text('Propiedad de Consorcio O&G - Devolución obligatoria al culminar obra', 4, 52);

    doc.save(`Carnet_PVC_${worker.nationalId.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
  };

  // CSV Export for Attendance & HHT
  const exportHhtCsv = () => {
    const headers = ['Cédula', 'Trabajador', 'Especialidad', 'Contratista', 'Fecha', 'Hora Entrada', 'HHT', 'Acceso'];
    const rows = attendanceLogs.map(log => [
      log.nationalId,
      `"${log.workerName}"`,
      `"${log.role}"`,
      `"${log.contractor}"`,
      log.date,
      new Date(log.checkInTime).toLocaleTimeString('es-VE'),
      log.hoursWorked,
      log.accessStatus
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Reporte_Asistencia_HHT_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered Workers
  const filteredWorkers = workers.filter(w => {
    const matchSearch = w.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        w.nationalId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        w.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = filterRole === 'todos' || w.role.toLowerCase().includes(filterRole.toLowerCase());
    return matchSearch && matchRole;
  });

  // Calculate HHT Totals
  const totalHhtAllTime = workers.reduce((acc, w) => acc + w.totalHhtAccumulated, 0) + 
                          attendanceLogs.reduce((acc, a) => acc + a.hoursWorked, 0);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-5 rounded-2xl border border-line shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
              <QrCode size={22} />
            </span>
            <h1 className="text-xl font-extrabold text-ink font-display">
              Carnet QR Inteligente, Impresión PVC & Control HHT
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              IC360-020
            </span>
          </div>
          <p className="text-xs text-ink-soft mt-1">
            Gestión de perfil con fotografía, carnet físico PVC frontal/reverso, semáforo de acceso SIHO-A y cálculo de Horas Hombre.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={exportHhtCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-line rounded-xl text-xs font-bold text-ink hover:bg-surface-2 transition-all cursor-pointer shadow-2xs"
          >
            <FileSpreadsheet size={16} className="text-emerald-600" />
            Exportar HHT (CSV)
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
          >
            <Plus size={16} />
            Registrar Personal
          </button>
        </div>
      </div>

      {/* KPI METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface p-4 rounded-2xl border border-line shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-ink-soft font-semibold">Personal Registrado</p>
            <h3 className="text-2xl font-black text-ink font-mono mt-1">{workers.length}</h3>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">Activos en proyecto</p>
          </div>
          <div className="p-3 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
            <Users size={24} />
          </div>
        </div>

        <div className="bg-surface p-4 rounded-2xl border border-line shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-ink-soft font-semibold">HHT Acumuladas</p>
            <h3 className="text-2xl font-black text-ink font-mono mt-1">{totalHhtAllTime.toLocaleString()} hrs</h3>
            <p className="text-[11px] text-brand-600 dark:text-brand-400 font-medium mt-0.5">Horas Hombre Trabajadas</p>
          </div>
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Clock size={24} />
          </div>
        </div>

        <div className="bg-surface p-4 rounded-2xl border border-line shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-ink-soft font-semibold">Índice LTI (Accidentes)</p>
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">0.00</h3>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">Cero días perdidos</p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck size={24} />
          </div>
        </div>

        <div className="bg-surface p-4 rounded-2xl border border-line shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-ink-soft font-semibold">Ingresos Hoy</p>
            <h3 className="text-2xl font-black text-ink font-mono mt-1">{attendanceLogs.length}</h3>
            <p className="text-[11px] text-ink-soft font-medium mt-0.5">Verificados en portón</p>
          </div>
          <div className="p-3 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
            <UserCheck size={24} />
          </div>
        </div>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* GATE SCANNER PANEL */}
        <div className="bg-surface rounded-2xl border border-line p-5 shadow-xs space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h2 className="text-sm font-bold text-ink flex items-center gap-2">
                <Camera size={18} className="text-brand-500" />
                Escáner en Portón de Obra
              </h2>
              <span className="text-[10px] font-mono font-bold bg-brand-500/10 text-brand-600 dark:text-brand-400 px-2 py-0.5 rounded-full border border-brand-500/20">
                Online / PWA
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <label className="block text-xs font-semibold text-ink-soft">
                Escanear Código QR de Casco o Seleccionar Trabajador:
              </label>

              <div className="grid grid-cols-1 gap-2 max-h-[280px] overflow-y-auto pr-1">
                {workers.map(w => (
                  <button
                    key={w.id}
                    onClick={() => handleScanWorker(w)}
                    className="p-3 rounded-xl border border-line bg-surface-2 hover:bg-surface hover:border-brand-500 text-left transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-ink">{w.fullName}</p>
                      <p className="text-[11px] text-ink-soft font-mono">{w.nationalId} | {w.role}</p>
                    </div>
                    <QrCode size={18} className="text-brand-500" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* TRAFFIC LIGHT BANNER */}
          {scanResult ? (
            <div className={`p-4 rounded-2xl border ${
              scanResult.status === 'Verde' 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                : 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300'
            } animate-in fade-in duration-200`}>
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-full ${scanResult.status === 'Verde' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                  {scanResult.status === 'Verde' ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                </div>
                <div>
                  <h3 className="text-base font-black uppercase tracking-wider font-display">
                    {scanResult.status === 'Verde' ? '🟢 ACCESO AUTORIZADO' : '🔴 ACCESO DENEGADO'}
                  </h3>
                  <p className="text-xs font-medium mt-0.5">
                    {scanResult.worker?.fullName} ({scanResult.worker?.nationalId})
                  </p>
                </div>
              </div>

              {scanResult.reasons.length > 0 && (
                <div className="mt-3 pt-2 border-t border-red-500/20 text-xs space-y-1">
                  <p className="font-bold">Observaciones de Seguridad:</p>
                  {scanResult.reasons.map((r, i) => (
                    <p key={i} className="flex items-center gap-1.5 font-mono text-[11px]">
                      • {r}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-surface-2 border border-line text-center text-xs text-ink-soft">
              Presione sobre un trabajador arriba para simular la lectura QR en puerta.
            </div>
          )}
        </div>

        {/* PHYSICAL PVC CARNET BADGE PREVIEW */}
        <div className="bg-surface rounded-2xl border border-line p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <h2 className="text-sm font-bold text-ink flex items-center gap-2">
              <Award size={18} className="text-brand-500" />
              Carnet Físico PVC / Casco
            </h2>
            
            <div className="flex items-center gap-1 bg-surface-2 p-1 rounded-xl border border-line">
              <button
                onClick={() => setCardSide('front')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  cardSide === 'front' ? 'bg-brand-600 text-white' : 'text-ink-soft hover:text-ink'
                }`}
              >
                Frontal
              </button>
              <button
                onClick={() => setCardSide('back')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  cardSide === 'back' ? 'bg-brand-600 text-white' : 'text-ink-soft hover:text-ink'
                }`}
              >
                Reverso
              </button>
            </div>
          </div>

          {selectedWorker && (
            <div className="space-y-4">
              
              {/* PVC CARD PREVIEW BOX */}
              {cardSide === 'front' ? (
                <div className="relative w-full max-w-sm mx-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white rounded-3xl p-5 shadow-2xl border border-slate-700 space-y-3 font-sans">
                  
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg brand-gradient flex items-center justify-center font-black text-xs text-white shadow-md">
                        IC
                      </div>
                      <div>
                        <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-100 font-display">INDUSTRIAL CONTROL 360</h4>
                        <p className="text-[8px] text-slate-400 font-mono">PDVSA SI-S-04 COMPLIANT</p>
                      </div>
                    </div>
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                      selectedWorker.fitStatus === 'Apto' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'
                    }`}>
                      {selectedWorker.fitStatus === 'Apto' ? '🟢 APTO OBRA' : '🔴 NO APTO'}
                    </span>
                  </div>

                  {/* Worker Main Details & Photo */}
                  <div className="flex items-center gap-3">
                    <div className="relative group w-20 h-24 rounded-xl bg-slate-800 border-2 border-brand-500 overflow-hidden flex flex-col items-center justify-center text-slate-400 shadow-inner">
                      {selectedWorker.photoUrl ? (
                        <img src={selectedWorker.photoUrl} alt={selectedWorker.fullName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-bold text-2xl text-slate-300">{selectedWorker.fullName.charAt(0)}</span>
                      )}

                      <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-[9px] font-bold text-white cursor-pointer p-1 text-center">
                        <Upload size={14} />
                        <span>Subir Foto</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handlePhotoUpload(e, selectedWorker.id)}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <div className="flex-1 min-w-0 space-y-0.5">
                      <h3 className="text-sm font-black text-white truncate font-display">{selectedWorker.fullName}</h3>
                      <p className="text-xs text-brand-400 font-mono font-bold">{selectedWorker.nationalId}</p>
                      <p className="text-[11px] text-slate-300 line-clamp-1">{selectedWorker.role}</p>
                      <p className="text-[10px] text-slate-400 truncate">{selectedWorker.contractor}</p>
                      {selectedWorker.welderStamp && (
                        <span className="inline-block px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 font-mono text-[9px] font-bold">
                          Estampa: {selectedWorker.welderStamp}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Medical & Allergies */}
                  <div className="grid grid-cols-2 gap-2 text-[10px] pt-1 border-t border-slate-700/80">
                    <div className="bg-slate-800/80 p-1.5 rounded-lg border border-slate-700">
                      <span className="text-slate-400 block">Examen Médico:</span>
                      <span className="font-bold text-emerald-400 font-mono">{selectedWorker.medicalCheckValidUntil}</span>
                    </div>

                    <div className="bg-slate-800/80 p-1.5 rounded-lg border border-slate-700">
                      <span className="text-slate-400 block">Inducción SIHO-A:</span>
                      <span className="font-bold text-emerald-400 font-mono">{selectedWorker.sihoInductionValidUntil}</span>
                    </div>

                    <div className="bg-slate-800/80 p-1.5 rounded-lg border border-slate-700">
                      <span className="text-slate-400 block">Grupo Sanguíneo:</span>
                      <span className="font-bold text-white font-mono">{selectedWorker.bloodType}</span>
                    </div>

                    <div className="bg-slate-800/80 p-1.5 rounded-lg border border-slate-700">
                      <span className="text-slate-400 block">Alergias / Restricciones:</span>
                      <span className="font-bold text-amber-300 truncate block">{selectedWorker.allergies || 'Ninguna'}</span>
                    </div>
                  </div>

                  {/* QR Vector */}
                  <div className="pt-2 flex items-center justify-between border-t border-slate-700/80">
                    <div className="text-[9px] text-slate-400 font-mono">
                      <p>HHT Acum: <strong className="text-white font-bold">{selectedWorker.totalHhtAccumulated} hrs</strong></p>
                      <p>ID: <span className="text-slate-300">{selectedWorker.id}</span></p>
                    </div>

                    <div className="w-12 h-12 bg-white p-1 rounded-lg shadow-md flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="w-full h-full fill-slate-950">
                        <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm10-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm12 0h2v2h-2v-2zm2 2h2v2h-2v-2zm-2 2h2v2h-2v-2zm4-4h2v2h-2v-2zm0 4h2v2h-2v-2z" />
                      </svg>
                    </div>
                  </div>

                </div>
              ) : (
                /* REVERSO CARNET */
                <div className="relative w-full max-w-sm mx-auto bg-slate-950 text-white rounded-3xl p-5 shadow-2xl border border-slate-700 space-y-3 font-sans text-[10px]">
                  <div className="border-b border-slate-800 pb-2">
                    <h4 className="text-xs font-bold text-brand-400">REVERSO - CARNET DE ACCESO EN PORTÓN</h4>
                    <p className="text-[8px] text-slate-400 font-mono">NORMAS PDVSA SI-S-04 Y COVENIN 2260</p>
                  </div>

                  <ul className="space-y-1.5 text-slate-300 text-[10px]">
                    <li>• Portar de forma visible en el casco o chaleco de seguridad.</li>
                    <li>• La lectura QR en portón valida estatus médico y SIHO.</li>
                    <li>• Certificación WPQ: <strong className="text-white font-mono">{selectedWorker.wpqCertValidUntil || 'No aplica'}</strong></li>
                    <li>• Contacto Emergencias O&G: <strong className="text-emerald-400">0800-PDVSA-911</strong></li>
                  </ul>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="text-[8px] text-slate-400">Código de Barras ID</p>
                      <div className="h-6 w-28 bg-white/90 p-1 flex items-center justify-between gap-0.5 rounded">
                        {[...Array(18)].map((_, i) => (
                          <div key={i} className={`h-full bg-black ${i % 2 === 0 ? 'w-1' : 'w-0.5'}`} />
                        ))}
                      </div>
                    </div>

                    <div className="text-right text-[8px] text-slate-400">
                      <p>Consorcio Vial O&G</p>
                      <p className="text-white font-bold">Refinería PLC</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ACTION BUTTONS FOR CARNET */}
              <div className="flex items-center justify-between gap-2 pt-2">
                <label className="flex items-center gap-1.5 px-3 py-1.5 border border-line rounded-xl text-xs font-bold text-ink hover:bg-surface-2 cursor-pointer">
                  <Upload size={14} className="text-brand-500" />
                  <span>Subir / Cambiar Foto</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePhotoUpload(e, selectedWorker.id)}
                    className="hidden"
                  />
                </label>

                <button
                  onClick={() => printWorkerCardPdf(selectedWorker)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  <Printer size={14} />
                  Imprimir Carnet PVC (PDF)
                </button>
              </div>

            </div>
          )}
        </div>

        {/* WORKER DIRECTORY */}
        <div className="bg-surface rounded-2xl border border-line p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <h2 className="text-sm font-bold text-ink flex items-center gap-2">
              <Users size={18} className="text-brand-500" />
              Directorio de Cuadrillas
            </h2>
            <span className="text-xs text-ink-soft font-mono font-bold">
              {filteredWorkers.length} registros
            </span>
          </div>

          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              type="text"
              placeholder="Buscar por cédula, nombre o estampa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-surface-2 border border-line rounded-xl text-xs text-ink outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {filteredWorkers.map(w => (
              <div
                key={w.id}
                onClick={() => setSelectedWorker(w)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  selectedWorker?.id === w.id 
                    ? 'bg-brand-500/10 border-brand-500 shadow-2xs' 
                    : 'bg-surface border-line hover:bg-surface-2'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-surface-2 border border-line overflow-hidden shrink-0 flex items-center justify-center font-bold text-xs text-ink-soft">
                    {w.photoUrl ? <img src={w.photoUrl} alt="" className="w-full h-full object-cover" /> : w.fullName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-ink">{w.fullName}</p>
                    <p className="text-[11px] text-ink-soft font-mono">{w.nationalId} • {w.role}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  w.fitStatus === 'Apto' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'
                }`}>
                  {w.fitStatus}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ATTENDANCE & HHT LOGS TABLE */}
      <div className="bg-surface rounded-2xl border border-line p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-brand-500" />
            <h2 className="text-sm font-bold text-ink">
              Bitácora de Asistencia y Control HHT en Sitio
            </h2>
          </div>
          <span className="text-xs text-ink-soft font-mono">
            Mostrando {attendanceLogs.length} marcajes de hoy
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-surface-2 text-ink-soft font-bold border-b border-line uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3">Trabajador / Cédula</th>
                <th className="p-3">Especialidad</th>
                <th className="p-3">Contratista</th>
                <th className="p-3">Hora Ingreso</th>
                <th className="p-3 text-center">HHT</th>
                <th className="p-3">Estatus Permiso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line font-medium text-ink">
              {attendanceLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-ink-soft italic">
                    Sin registros de marcaje en esta jornada. Utilice el escáner para registrar accesos.
                  </td>
                </tr>
              ) : (
                attendanceLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-2/50 transition-colors">
                    <td className="p-3">
                      <p className="font-bold text-ink">{log.workerName}</p>
                      <p className="text-[11px] font-mono text-ink-soft">{log.nationalId}</p>
                    </td>
                    <td className="p-3 text-ink-soft">{log.role}</td>
                    <td className="p-3 text-ink-soft">{log.contractor}</td>
                    <td className="p-3 font-mono">{new Date(log.checkInTime).toLocaleTimeString('es-VE')}</td>
                    <td className="p-3 text-center font-mono font-bold text-brand-600 dark:text-brand-400">{log.hoursWorked} hrs</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        log.accessStatus.includes('Verde') ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'
                      }`}>
                        {log.accessStatus}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* NEW WORKER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-surface border border-line rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-base font-bold text-ink flex items-center gap-2">
                <UserCheck size={18} className="text-brand-500" />
                Registrar Nuevo Trabajador en Sistema
              </h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-ink-soft hover:bg-surface-2 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateWorker} className="space-y-4">
              {/* Photo Upload Input */}
              <div className="flex items-center gap-4 p-3 rounded-2xl bg-surface-2 border border-line">
                <div className="w-14 h-14 rounded-xl bg-surface border border-line overflow-hidden flex items-center justify-center font-bold text-xl text-ink-soft shrink-0">
                  {newPhotoUrl ? <img src={newPhotoUrl} alt="" className="w-full h-full object-cover" /> : <ImageIcon size={22} />}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Foto de Perfil / Cédula</label>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-line hover:bg-surface-2 text-ink rounded-xl text-xs font-bold cursor-pointer transition-all">
                    <Upload size={14} className="text-brand-500" />
                    Cargar Imagen
                    <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e)} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink-soft mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    placeholder="Ej. Pedro Infante"
                    className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-xs text-ink outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-soft mb-1">Cédula / Pasaporte *</label>
                  <input
                    type="text"
                    required
                    value={newNationalId}
                    onChange={(e) => setNewNationalId(e.target.value)}
                    placeholder="Ej. V-19.402.102"
                    className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-xs text-ink font-mono outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink-soft mb-1">Especialidad / Rol *</label>
                  <input
                    type="text"
                    required
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-xs text-ink outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-soft mb-1">Contratista / Empresa *</label>
                  <input
                    type="text"
                    required
                    value={newContractor}
                    onChange={(e) => setNewContractor(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-xs text-ink outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink-soft mb-1">Estampa (Opcional)</label>
                  <input
                    type="text"
                    value={newWelderStamp}
                    onChange={(e) => setNewWelderStamp(e.target.value)}
                    placeholder="W-501"
                    className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-xs text-ink font-mono outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-soft mb-1">Grupo Sanguíneo</label>
                  <select
                    value={newBloodType}
                    onChange={(e) => setNewBloodType(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-xs text-ink font-mono outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="O+">O+</option>
                    <option value="A+">A+</option>
                    <option value="B+">B+</option>
                    <option value="AB+">AB+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-soft mb-1">Alergias</label>
                  <input
                    type="text"
                    value={newAllergies}
                    onChange={(e) => setNewAllergies(e.target.value)}
                    placeholder="Ninguna"
                    className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-xs text-ink outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-line rounded-xl text-xs font-semibold text-ink-soft hover:bg-surface cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Guardar Trabajador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
