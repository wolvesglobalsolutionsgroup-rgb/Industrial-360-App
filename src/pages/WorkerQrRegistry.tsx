import React, { useState, useEffect } from 'react';
import { 
  QrCode, UserCheck, ShieldCheck, AlertTriangle, CheckCircle2, XCircle, 
  Search, Download, Plus, Clock, Users, HardHat, FileSpreadsheet, 
  Calendar, Award, Camera, RefreshCw, Printer, ShieldAlert, Sparkles, Filter
} from 'lucide-react';
import { collection, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useProject } from '../ProjectContext';
import { queueOfflineOperation } from '../lib/offlineSync';

export interface FieldWorker {
  id: string;
  nationalId: string; // Cédula e.g. V-18.492.102
  fullName: string;
  role: string; // e.g. Soldador SMAW/GTAW 6G ASME IX
  contractor: string; // e.g. Consorcio Vial & Tubos C.A.
  welderStamp?: string; // e.g. W-402
  bloodType: string; // e.g. O+
  photoUrl?: string;
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
    medicalCheckValidUntil: '2026-01-15', // Vencido for demo alert
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
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('todos');

  // Scanner Simulator
  const [scanInput, setScanInput] = useState('');
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

  // Fetch Workers & Attendance from Firestore
  useEffect(() => {
    if (!currentProject || currentProject.id === 'all') return;

    const workersPath = `organizations/${orgId}/projects/${currentProject.id}/workers`;
    const attendancePath = `organizations/${orgId}/projects/${currentProject.id}/worker_attendance`;

    const unsubWorkers = onSnapshot(collection(db, workersPath), (snapshot) => {
      if (!snapshot.empty) {
        const loaded: FieldWorker[] = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        } as FieldWorker));
        setWorkers(loaded);
        if (loaded.length > 0 && !selectedWorker) {
          setSelectedWorker(loaded[0]);
        }
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, workersPath);
    });

    const unsubAttendance = onSnapshot(collection(db, attendancePath), (snapshot) => {
      if (!snapshot.empty) {
        const loaded: AttendanceRecord[] = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        } as AttendanceRecord));
        setAttendanceLogs(loaded);
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, attendancePath);
    });

    return () => {
      unsubWorkers();
      unsubAttendance();
    };
  }, [currentProject, orgId]);

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
      reasons.push(`Aptitud Médica registrada como ${worker.fitStatus}`);
    }

    const isGreen = isMedicalValid && isSihoValid && isFit;

    return {
      status: isGreen ? ('Verde' as const) : ('Rojo' as const),
      reasons
    };
  };

  // Handle QR Scan / Lookup
  const handleScanWorker = (worker: FieldWorker) => {
    const res = verifyWorkerAccess(worker);
    setScanResult({
      worker,
      status: res.status,
      reasons: res.reasons
    });

    // Record check-in automatically
    recordCheckIn(worker, res.status, res.reasons.join(' | '));
  };

  // Record Check-in to Firestore / Offline Store
  const recordCheckIn = async (worker: FieldWorker, status: 'Verde' | 'Rojo', denialReason?: string) => {
    const today = new Date().toISOString().split('T')[0];
    const newRecord: Partial<AttendanceRecord> = {
      workerId: worker.id,
      workerName: worker.fullName,
      nationalId: worker.nationalId,
      role: worker.role,
      contractor: worker.contractor,
      checkInTime: new Date().toISOString(),
      hoursWorked: status === 'Verde' ? 8 : 0,
      gateLocation: 'Portón Principal Refinería PLC - Control HHT',
      accessStatus: status === 'Verde' ? 'Verde - Autorizado' : 'Rojo - Denegado',
      denialReason: denialReason || undefined,
      date: today
    };

    if (currentProject && currentProject.id !== 'all') {
      const attendancePath = `organizations/${orgId}/projects/${currentProject.id}/worker_attendance`;
      try {
        await addDoc(collection(db, attendancePath), {
          ...newRecord,
          createdAt: serverTimestamp()
        });
      } catch (err) {
        // Fallback to offline store
        await queueOfflineOperation(attendancePath, 'create', newRecord);
      }
    }

    // Local state append
    setAttendanceLogs(prev => [{ id: `att_${Date.now()}`, ...newRecord } as AttendanceRecord, ...prev]);
  };

  // Add Worker Handler
  const handleCreateWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName || !newNationalId) return;

    const today = new Date();
    const nextYear = new Date(today.setFullYear(today.getFullYear() + 1)).toISOString().split('T')[0];

    const workerObj: Omit<FieldWorker, 'id'> = {
      nationalId: newNationalId,
      fullName: newFullName,
      role: newRole,
      contractor: newContractor,
      welderStamp: newWelderStamp || undefined,
      bloodType: newBloodType,
      medicalCheckValidUntil: nextYear,
      sihoInductionValidUntil: nextYear,
      wpqCertValidUntil: nextYear,
      fitStatus: 'Apto',
      totalHhtAccumulated: 0
    };

    if (currentProject && currentProject.id !== 'all') {
      const workersPath = `organizations/${orgId}/projects/${currentProject.id}/workers`;
      try {
        const docRef = await addDoc(collection(db, workersPath), {
          ...workerObj,
          createdAt: serverTimestamp()
        });
        setWorkers(prev => [...prev, { id: docRef.id, ...workerObj }]);
      } catch (err) {
        await queueOfflineOperation(workersPath, 'create', workerObj);
        setWorkers(prev => [...prev, { id: `w_off_${Date.now()}`, ...workerObj }]);
      }
    } else {
      setWorkers(prev => [...prev, { id: `w_local_${Date.now()}`, ...workerObj }]);
    }

    setShowAddModal(false);
    setNewFullName('');
    setNewNationalId('');
    setNewWelderStamp('');
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
              Carnet QR Inteligente & Control HHT en Sitio
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              IC360-019
            </span>
          </div>
          <p className="text-xs text-ink-soft mt-1">
            Validación automatizada en portón de obra (PDVSA SI-S-04), semáforo de acceso y cálculo de Horas Hombre Trabajadas.
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

      {/* MAIN CONTENT GRID: GATE SCANNER & CARNET PREVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* GATE SCANNER VERIFICATION PANEL (LEFT COLUMN) */}
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

            {/* Simulated QR Camera / Quick Selector */}
            <div className="mt-4 space-y-3">
              <label className="block text-xs font-semibold text-ink-soft">
                Escanear Código QR de Casco o Seleccionar Trabajador:
              </label>

              <div className="grid grid-cols-1 gap-2">
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

          {/* SCAN RESULT TRAFFIC LIGHT BANNER */}
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

        {/* VIRTUAL SMART CARNET BADGE (MIDDLE COLUMN) */}
        <div className="bg-surface rounded-2xl border border-line p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <h2 className="text-sm font-bold text-ink flex items-center gap-2">
              <Award size={18} className="text-brand-500" />
              Carnet Digital Inteligente SIHO-A
            </h2>
            <button
              onClick={() => window.print()}
              className="p-1.5 rounded-lg border border-line text-xs font-bold text-ink-soft hover:bg-surface-2 cursor-pointer flex items-center gap-1"
            >
              <Printer size={14} />
              Imprimir
            </button>
          </div>

          {/* VIRTUAL BADGE PREVIEW */}
          {selectedWorker && (
            <div className="relative w-full max-w-sm mx-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white rounded-3xl p-6 shadow-2xl border border-slate-700 space-y-4 font-sans">
              
              {/* Header Badge Strip */}
              <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl brand-gradient flex items-center justify-center font-black text-xs text-white shadow-md">
                    IC
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-100 font-display">INDUSTRIAL CONTROL 360</h4>
                    <p className="text-[9px] text-slate-400 font-mono">PDVSA SI-S-04 COMPLIANT</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                  APTO OBRA
                </span>
              </div>

              {/* Worker Main Details */}
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 rounded-2xl bg-slate-800 border-2 border-brand-500 overflow-hidden flex items-center justify-center font-bold text-2xl text-slate-400 shadow-inner">
                  {selectedWorker.fullName.charAt(0)}
                  <div className="absolute bottom-0 inset-x-0 bg-brand-600/90 text-[8px] text-center font-mono py-0.5 text-white font-bold">
                    {selectedWorker.welderStamp || 'OPERATIVO'}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-black text-white truncate font-display">{selectedWorker.fullName}</h3>
                  <p className="text-xs text-brand-400 font-mono font-bold">{selectedWorker.nationalId}</p>
                  <p className="text-[11px] text-slate-300 line-clamp-1 mt-0.5">{selectedWorker.role}</p>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">{selectedWorker.contractor}</p>
                </div>
              </div>

              {/* Compliance Badges Grid */}
              <div className="grid grid-cols-2 gap-2 text-[10px] pt-1 border-t border-slate-700/80">
                <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700">
                  <span className="text-slate-400 block">Examen Médico:</span>
                  <span className="font-bold text-emerald-400 font-mono">{selectedWorker.medicalCheckValidUntil}</span>
                </div>

                <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700">
                  <span className="text-slate-400 block">Inducción SIHO-A:</span>
                  <span className="font-bold text-emerald-400 font-mono">{selectedWorker.sihoInductionValidUntil}</span>
                </div>

                <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700">
                  <span className="text-slate-400 block">Tipo Sangre:</span>
                  <span className="font-bold text-white font-mono">{selectedWorker.bloodType}</span>
                </div>

                <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700">
                  <span className="text-slate-400 block">Certificación WPQ:</span>
                  <span className="font-bold text-brand-300 font-mono">{selectedWorker.wpqCertValidUntil || 'N/A'}</span>
                </div>
              </div>

              {/* QR Vector Graphic */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-700/80">
                <div className="text-[9px] text-slate-400 font-mono space-y-0.5">
                  <p>HHT Acum: <strong className="text-white font-bold">{selectedWorker.totalHhtAccumulated} hrs</strong></p>
                  <p>ID: <span className="text-slate-300">{selectedWorker.id}</span></p>
                </div>

                {/* SVG Mock QR Vector */}
                <div className="w-14 h-14 bg-white p-1 rounded-xl shadow-md flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-full h-full fill-slate-950">
                    <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm10-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm12 0h2v2h-2v-2zm2 2h2v2h-2v-2zm-2 2h2v2h-2v-2zm4-4h2v2h-2v-2zm0 4h2v2h-2v-2z" />
                  </svg>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* WORKER DIRECTORY (RIGHT COLUMN) */}
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

          {/* Search Input */}
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

          {/* Worker List */}
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
                <div>
                  <p className="text-xs font-bold text-ink">{w.fullName}</p>
                  <p className="text-[11px] text-ink-soft font-mono">{w.nationalId} • {w.role}</p>
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

      {/* ATTENDANCE & HHT DAILY LOGS TABLE */}
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink-soft mb-1">Estampa Soldador (Opcional)</label>
                  <input
                    type="text"
                    value={newWelderStamp}
                    onChange={(e) => setNewWelderStamp(e.target.value)}
                    placeholder="Ej. W-501"
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
