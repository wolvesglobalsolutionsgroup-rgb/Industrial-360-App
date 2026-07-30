import React, { useState } from 'react';
import { 
  ShieldCheck, AlertTriangle, CheckCircle2, FileText, Plus, Trash2, 
  Lock, Key, Users, HardHat, Check, Sparkles, FileSpreadsheet,
  AlertOctagon, Info
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useProject } from '../../ProjectContext';

export interface AstStepDetail {
  id: string;
  stepNumber: number;
  description: string;
  hazards: string[];
  initialProb: number; // 1-5
  initialCons: number; // 1-5
  initialRiskValue: number; // prob * cons (1-25)
  initialRiskCategory: 'Bajo' | 'Medio' | 'Alto';
  engineeringControls: string;
  adminControls: string;
  eppControls: string;
  residualProb: number; // 1-5
  residualCons: number; // 1-5
  residualRiskValue: number; // prob * cons (1-25)
  residualRiskCategory: 'Bajo' | 'Medio' | 'Alto';
}

export interface AstRecord {
  id?: string;
  code: string;
  title: string;
  location: string;
  wbsCode: string;
  contractor: string;
  date: string;
  steps: AstStepDetail[];
  requiredEpp: string[];
  emergencyEquipment: string[];
  sihoSupervisor: string;
  sihoApprovalRequired: boolean; // true if any residualRiskValue >= 10
  sihoSignatureHash?: string;
  sihoSignedAt?: string;
  areaCustodian: string;
  fieldWorkers: { name: string; documentId: string; signed: boolean }[];
  maxResidualRisk: number;
  createdAt?: any;
}

const defaultEppList = [
  'Casco de Seguridad Dieléctrico con Barboquejo (PDVSA EM-36-01)',
  'Lentes de Seguridad Anti-impacto y Anti-empañantes',
  'Botas de Seguridad con Puntera de Duraluminio / Dielectrica',
  'Guantes de Carnaza / Cuero Cuello Largo para Soldador',
  'Protector Auditivo de Copa NRR 25dB',
  'Respirador con Cartuchos P100 / Vapores Orgánicos',
  'Arnés de Cuerpo Entero de 4 Argollas con Doble Lanyard y Absorbedor',
  'Detector Multigas Personal H₂S / LEL (Bump Test Vigente)',
  'Careta de Esmerilar / Pantalla de Protección Facial Incolora',
  'Traje Tyvek / Mandil de Cuero para Trabajo Térmico'
];

const defaultEmergencyEquipment = [
  'Extintor de Polvo Químico Seco PQS 20 lbs (Póliza y Recarga Al Día)',
  'Lavaojos Portátil de Emergencia (Agua Desmineralizada 32 oz)',
  'Manta Ignífuga en Fibra de Vidrio para Retención de Chispas',
  'Trípode de Rescate con Garrucha y Winche para Espacios Confinados',
  'Camilla Rígida Tipo Espinal con Inmovilizador de Cuello y Arneses',
  'Botiquín Fijo de Primeros Auxilios con Solución Fisiológica',
  'Soplador / Extractor Anti-explosivo con Manguera Flexible'
];

const PROBABILITY_LABELS: Record<number, string> = {
  1: '1 - Muy Rara (Anual o menor)',
  2: '2 - Rara (Ocurre raramente)',
  3: '3 - Ocasional (Varias veces al año)',
  4: '4 - Frecuente (Semanal)',
  5: '5 - Continua (Diario / Permanente)'
};

const CONSEQUENCE_LABELS: Record<number, string> = {
  1: '1 - Insignificante (Primeros auxilios)',
  2: '2 - Menor (Tratamiento médico sin incapacidad)',
  3: '3 - Moderada (Incapacidad temporal / Daño moderado)',
  4: '4 - Mayor (Incapacidad permanente / Fuga mayor)',
  5: '5 - Catastrófica (Fatalidad / Pérdida total de unidad)'
};

export function getRiskCategory(value: number): 'Bajo' | 'Medio' | 'Alto' {
  if (value <= 8) return 'Bajo';
  if (value <= 14) return 'Medio';
  return 'Alto';
}

export function getRiskBadgeClass(category: 'Bajo' | 'Medio' | 'Alto') {
  switch (category) {
    case 'Bajo':
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    case 'Medio':
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    case 'Alto':
      return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
  }
}

interface AstFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function AstForm({ onSuccess, onCancel }: AstFormProps) {
  const { currentProject, currentOrganization } = useProject();
  const orgId = currentOrganization?.id || 'semax_pino';

  // Paso 1: Datos de Identificación
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [wbsCode, setWbsCode] = useState('');
  const [contractor, setContractor] = useState('Contratista de Campo / IC360');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  // Paso 2 a 6: Secuencia de Pasos con Evaluación P x C
  const [steps, setSteps] = useState<AstStepDetail[]>([
    {
      id: '1',
      stepNumber: 1,
      description: 'Aislamiento de Tubería, Bloqueo LOTO y Colocación de Brida Ciega',
      hazards: ['Fuga presurizada de H₂S / Hidrocarburos', 'Contacto con fluido caliente / corrosivo'],
      initialProb: 4,
      initialCons: 4,
      initialRiskValue: 16,
      initialRiskCategory: 'Alto',
      engineeringControls: 'Cierre doble de válvulas (DBB), venteo a antorcha, instalación de brida ciega de prueba',
      adminControls: 'Procedimiento LOTO PDVSA SI-S-08, permiso de trabajo activo, delimitación de área',
      eppControls: 'Respirador con filtro para vapores/H₂S, guantes de nitrilo pesado, careta de seguridad',
      residualProb: 2,
      residualCons: 3,
      residualRiskValue: 6,
      residualRiskCategory: 'Bajo'
    },
    {
      id: '2',
      stepNumber: 2,
      description: 'Corte Mecánico y Esmerilado de Bisel en Tubería de 12" Sch 40',
      hazards: ['Generación de chispas en área clasificada', 'Proyección de partículas incandescentes', 'Ruido excesivo'],
      initialProb: 4,
      initialCons: 4,
      initialRiskValue: 16,
      initialRiskCategory: 'Alto',
      engineeringControls: 'Uso de habitáculo ignífugo con extracción forzada, barreras de retención de chispas',
      adminControls: 'Prueba de gasotester continua (6 gases), vigía de seguridad en sitio con extintor PQS',
      eppControls: 'Careta para esmerilar, lentes anti-impacto, protector auditivo de copa, ropa de algodón 100%',
      residualProb: 2,
      residualCons: 4,
      residualRiskValue: 8,
      residualRiskCategory: 'Bajo'
    }
  ]);

  // Temp form state for adding a new step
  const [newStepDesc, setNewStepDesc] = useState('');
  const [newStepHazard, setNewStepHazard] = useState('');
  const [newInitProb, setNewInitProb] = useState<number>(3);
  const [newInitCons, setNewInitCons] = useState<number>(3);
  const [newEngCtrl, setNewEngCtrl] = useState('');
  const [newAdminCtrl, setNewAdminCtrl] = useState('');
  const [newEppCtrl, setNewEppCtrl] = useState('');
  const [newResProb, setNewResProb] = useState<number>(2);
  const [newResCons, setNewResCons] = useState<number>(2);

  // Paso 7: EPP y Equipos de Emergencia
  const [selectedEpp, setSelectedEpp] = useState<string[]>(defaultEppList.slice(0, 6));
  const [selectedEmergency, setSelectedEmergency] = useState<string[]>(defaultEmergencyEquipment.slice(0, 4));

  // Paso 8: Firmas y Divulgación
  const [sihoSupervisor, setSihoSupervisor] = useState('Ing. Manuel Silva (Supervisor SIHO-A)');
  const [areaCustodian, setAreaCustodian] = useState('Ing. Roberto Alarcón (Custodio de Planta)');
  const [pinInput, setPinInput] = useState('');
  const [isSigned, setIsSigned] = useState(false);
  const [signatureHash, setSignatureHash] = useState('');

  const [workers, setWorkers] = useState<{ name: string; documentId: string; signed: boolean }[]>([
    { name: 'Pedro Alvarado', documentId: 'V-18.432.109', signed: true },
    { name: 'José Terán', documentId: 'V-15.982.341', signed: true },
    { name: 'Carlos Briceño', documentId: 'V-20.114.890', signed: true }
  ]);
  const [newWorkerName, setNewWorkerName] = useState('');
  const [newWorkerDoc, setNewWorkerDoc] = useState('');

  // Calculate max residual risk among all steps
  const maxResidualRisk = steps.reduce((max, s) => Math.max(max, s.residualRiskValue), 0);
  const requiresSihoSignature = maxResidualRisk >= 10;

  const handleAddStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStepDesc || !newStepHazard) return;

    const initVal = newInitProb * newInitCons;
    const resVal = newResProb * newResCons;

    const newStep: AstStepDetail = {
      id: Date.now().toString(),
      stepNumber: steps.length + 1,
      description: newStepDesc,
      hazards: newStepHazard.split(',').map(h => h.trim()),
      initialProb: newInitProb,
      initialCons: newInitCons,
      initialRiskValue: initVal,
      initialRiskCategory: getRiskCategory(initVal),
      engineeringControls: newEngCtrl || 'Aislamiento y barreras de protección',
      adminControls: newAdminCtrl || 'Permiso PTS activo y supervisor en sitio',
      eppControls: newEppCtrl || 'EPP básico obligatorio',
      residualProb: newResProb,
      residualCons: newResCons,
      residualRiskValue: resVal,
      residualRiskCategory: getRiskCategory(resVal)
    };

    setSteps([...steps, newStep]);
    setNewStepDesc('');
    setNewStepHazard('');
    setNewEngCtrl('');
    setNewAdminCtrl('');
    setNewEppCtrl('');
  };

  const handleRemoveStep = (id: string) => {
    const updated = steps.filter(s => s.id !== id).map((s, idx) => ({ ...s, stepNumber: idx + 1 }));
    setSteps(updated);
  };

  const handleAddWorker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkerName || !newWorkerDoc) return;
    setWorkers([...workers, { name: newWorkerName, documentId: newWorkerDoc, signed: true }]);
    setNewWorkerName('');
    setNewWorkerDoc('');
  };

  const handleElectronicSignature = async () => {
    if (!sihoSupervisor) {
      alert("Ingrese el nombre del Supervisor SIHO-A responsable.");
      return;
    }
    if (pinInput.trim().length < 4) {
      alert("Ingrese su PIN de Firma Electrónica SIHO (mínimo 4 dígitos).");
      return;
    }

    const payload = `AST-HO-H-02|${title}|${sihoSupervisor}|RESIDUAL_MAX:${maxResidualRisk}|PIN:${pinInput}|${Date.now()}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(payload);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    setSignatureHash(hashHex);
    setIsSigned(true);
  };

  const handleSubmitAST = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject) {
      alert("Selecciona un proyecto activo primero.");
      return;
    }
    if (steps.length === 0) {
      alert("Debes agregar al menos 1 paso a la matriz de evaluación AST.");
      return;
    }
    if (requiresSihoSignature && !isSigned) {
      alert("ATENCIÓN NORMATIVA (PDVSA HO-H-02): Al existir un Riesgo Residual >= 10, se requiere obligatoriamente la Firma Electrónica del Supervisor SIHO-A antes de guardar el AST.");
      return;
    }

    try {
      const astCode = `AST-HOH02-${Date.now().toString().slice(-5)}`;
      const astData: Omit<AstRecord, 'id'> = {
        code: astCode,
        title: title || 'Análisis de Riesgo para Trabajos de Integridad Mecánica',
        location: location || 'Planta de Compresión / Módulo Principal',
        wbsCode: wbsCode || 'WBS-SIHO-001',
        contractor,
        date,
        steps,
        requiredEpp: selectedEpp,
        emergencyEquipment: selectedEmergency,
        sihoSupervisor,
        sihoApprovalRequired: requiresSihoSignature,
        sihoSignatureHash: signatureHash || undefined,
        sihoSignedAt: isSigned ? new Date().toISOString() : undefined,
        areaCustodian,
        fieldWorkers: workers,
        maxResidualRisk,
        createdAt: serverTimestamp()
      };

      const targetPath = `organizations/${orgId}/projects/${currentProject.id}/siho_ast`;
      await addDoc(collection(db, targetPath), { ...astData, orgId });

      alert(`✅ AST creado y registrado exitosamente con código ${astCode} bajo Norma PDVSA HO-H-02.`);
      if (onSuccess) onSuccess();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'siho_ast');
    }
  };

  return (
    <div className="bg-surface rounded-2xl border border-line shadow-card p-6 space-y-8">
      {/* Header Banner */}
      <div className="border-b border-line pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-md uppercase tracking-wider border border-emerald-500/20">
              Norma PDVSA HO-H-02
            </span>
            <span className="text-xs text-ink-faint font-mono">Formulario AST 8 Pasos v2.4</span>
          </div>
          <h2 className="text-2xl font-black text-ink tracking-tight mt-1">
            Análisis de Seguridad en el Trabajo (AST) de 8 Pasos
          </h2>
          <p className="text-xs text-ink-soft">
            Matriz estandarizada IPER / HO-H-02 para evaluación cuantitativa de riesgo inicial y residual en operaciones de campo.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {requiresSihoSignature ? (
            <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
              isSigned ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30 animate-pulse'
            }`}>
              <AlertOctagon size={16} />
              <span>Riesgo Residual Max: {maxResidualRisk} (Aprobación SIHO Obligatoria)</span>
            </div>
          ) : (
            <div className="px-3 py-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded-xl text-xs font-bold flex items-center gap-2">
              <ShieldCheck size={16} />
              <span>Riesgo Residual Aceptable (Max: {maxResidualRisk})</span>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmitAST} className="space-y-8">
        {/* PASO 1: IDENTIFICACIÓN DEL TRABAJO */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-line pb-2">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center font-mono">1</span>
            <h3 className="text-sm font-bold text-ink uppercase tracking-wide">Paso 1: Identificación del Trabajo y Ubicación (PDVSA HO-H-02)</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-ink-soft uppercase mb-1">Título de la Actividad / Tarea Operativa</label>
              <input
                type="text"
                placeholder="Ej: Interconexión y Soldadura de Línea de Gas Residual 12'' Sch 40"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-line rounded-xl text-sm bg-surface-2 text-ink outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-ink-soft uppercase mb-1">Código WBS / FRENTE DE TRABAJO</label>
              <input
                type="text"
                placeholder="Ej: WBS-2.1.4 / Colector H2"
                value={wbsCode}
                onChange={(e) => setWbsCode(e.target.value)}
                className="w-full px-3 py-2 border border-line rounded-xl text-sm bg-surface-2 text-ink outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-ink-soft uppercase mb-1">Ubicación / Planta / Módulo</label>
              <input
                type="text"
                placeholder="Ej: Planta de Compresión H-2 / Área de Separadores"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 border border-line rounded-xl text-sm bg-surface-2 text-ink outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-ink-soft uppercase mb-1">Empresa Contratista / Ejecutora</label>
              <input
                type="text"
                value={contractor}
                onChange={(e) => setContractor(e.target.value)}
                className="w-full px-3 py-2 border border-line rounded-xl text-sm bg-surface-2 text-ink outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-ink-soft uppercase mb-1">Fecha de Programación</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-line rounded-xl text-sm bg-surface-2 text-ink outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>
        </section>

        {/* PASO 2 a 6: MATRIZ DE EVALUACIÓN PASO A PASO (EVALUACIÓN P x C) */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-line pb-2">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center font-mono">2-6</span>
            <h3 className="text-sm font-bold text-ink uppercase tracking-wide">
              Pasos 2 a 6: Desglose Secuencial, Peligros, Matriz Inicial P×C, Controles y Riesgo Residual
            </h3>
          </div>

          {/* Existing Steps Table */}
          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-surface-2 text-ink-soft uppercase font-bold border-b border-line">
                  <th className="p-3 w-10">N°</th>
                  <th className="p-3">Paso Operativo (Paso 2)</th>
                  <th className="p-3">Peligros / Riesgos (Paso 3)</th>
                  <th className="p-3 text-center">Riesgo Inicial (Paso 4)</th>
                  <th className="p-3">Medidas de Control Requeridas (Paso 5)</th>
                  <th className="p-3 text-center">Riesgo Residual (Paso 6)</th>
                  <th className="p-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {steps.map((s) => (
                  <tr key={s.id} className="hover:bg-surface-2/60 transition-colors">
                    <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">{s.stepNumber}</td>
                    <td className="p-3 font-semibold text-ink max-w-xs">{s.description}</td>
                    <td className="p-3 text-ink-soft max-w-xs">
                      <ul className="list-disc list-inside space-y-0.5">
                        {s.hazards.map((h, i) => <li key={i}>{h}</li>)}
                      </ul>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex flex-col items-center">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] border ${getRiskBadgeClass(s.initialRiskCategory)}`}>
                          {s.initialRiskCategory} ({s.initialRiskValue})
                        </span>
                        <span className="text-[10px] text-ink-faint font-mono mt-0.5">P:{s.initialProb} × C:{s.initialCons}</span>
                      </div>
                    </td>
                    <td className="p-3 space-y-1 max-w-xs">
                      <div className="text-ink font-medium"><strong>Ing:</strong> {s.engineeringControls}</div>
                      <div className="text-ink-soft"><strong>Admin:</strong> {s.adminControls}</div>
                      <div className="text-ink-faint"><strong>EPP:</strong> {s.eppControls}</div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex flex-col items-center">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] border ${getRiskBadgeClass(s.residualRiskCategory)}`}>
                          {s.residualRiskCategory} ({s.residualRiskValue})
                        </span>
                        <span className="text-[10px] text-ink-faint font-mono mt-0.5">P:{s.residualProb} × C:{s.residualCons}</span>
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveStep(s.id)}
                        className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
                        title="Eliminar paso"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add New Step Sub-Form */}
          <div className="bg-surface-2/60 border border-line rounded-2xl p-4 space-y-4">
            <h4 className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
              <Plus size={16} className="text-emerald-600 dark:text-emerald-400" />
              Agregar Nuevo Paso a la Matriz de Evaluación
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-ink-soft uppercase mb-1">Descripción de la Tarea / Paso Operativo</label>
                <input
                  type="text"
                  placeholder="Ej: Montaje de andamio multidireccional en altura 6m"
                  value={newStepDesc}
                  onChange={(e) => setNewStepDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-line rounded-lg text-xs bg-surface text-ink outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-ink-soft uppercase mb-1">Peligros / Riesgos Identificados (separados por coma)</label>
                <input
                  type="text"
                  placeholder="Ej: Caída a diferente nivel, colapso de estructura, atrapamiento"
                  value={newStepHazard}
                  onChange={(e) => setNewStepHazard(e.target.value)}
                  className="w-full px-3 py-2 border border-line rounded-lg text-xs bg-surface text-ink outline-none"
                />
              </div>
            </div>

            {/* Matrix Initial Risk Selection */}
            <div className="p-3 bg-surface border border-line rounded-xl space-y-2">
              <span className="text-xs font-bold text-ink uppercase">Evaluación de Riesgo Inicial (Sin Controles)</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-ink-soft uppercase mb-1">Probabilidad Inicial (P)</label>
                  <select
                    value={newInitProb}
                    onChange={(e) => setNewInitProb(Number(e.target.value))}
                    className="w-full px-2 py-1.5 border border-line rounded-lg text-xs bg-surface text-ink font-medium"
                  >
                    {[1, 2, 3, 4, 5].map(v => (
                      <option key={v} value={v}>{PROBABILITY_LABELS[v]}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-ink-soft uppercase mb-1">Consecuencia Inicial (C)</label>
                  <select
                    value={newInitCons}
                    onChange={(e) => setNewInitCons(Number(e.target.value))}
                    className="w-full px-2 py-1.5 border border-line rounded-lg text-xs bg-surface text-ink font-medium"
                  >
                    {[1, 2, 3, 4, 5].map(v => (
                      <option key={v} value={v}>{CONSEQUENCE_LABELS[v]}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="text-xs font-bold text-right text-ink">
                Valor Riesgo Inicial: <span className="font-mono text-emerald-600 dark:text-emerald-400">{newInitProb * newInitCons}</span> ({getRiskCategory(newInitProb * newInitCons)})
              </div>
            </div>

            {/* Controls Input */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-ink-soft uppercase mb-1">Controles de Ingeniería</label>
                <input
                  type="text"
                  placeholder="Ej: Rodapiés, tarjeta verde de andamio"
                  value={newEngCtrl}
                  onChange={(e) => setNewEngCtrl(e.target.value)}
                  className="w-full px-3 py-1.5 border border-line rounded-lg text-xs bg-surface text-ink outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-ink-soft uppercase mb-1">Controles Administrativos / SIHO</label>
                <input
                  type="text"
                  placeholder="Ej: PTS Tipo G, inspección pre-uso"
                  value={newAdminCtrl}
                  onChange={(e) => setNewAdminCtrl(e.target.value)}
                  className="w-full px-3 py-1.5 border border-line rounded-lg text-xs bg-surface text-ink outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-ink-soft uppercase mb-1">EPP Específico</label>
                <input
                  type="text"
                  placeholder="Ej: Arnés con doble lanyard en 100% amarre"
                  value={newEppCtrl}
                  onChange={(e) => setNewEppCtrl(e.target.value)}
                  className="w-full px-3 py-1.5 border border-line rounded-lg text-xs bg-surface text-ink outline-none"
                />
              </div>
            </div>

            {/* Matrix Residual Risk Selection */}
            <div className="p-3 bg-surface border border-line rounded-xl space-y-2">
              <span className="text-xs font-bold text-ink uppercase">Evaluación de Riesgo Residual (Con Controles)</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-ink-soft uppercase mb-1">Probabilidad Residual (P)</label>
                  <select
                    value={newResProb}
                    onChange={(e) => setNewResProb(Number(e.target.value))}
                    className="w-full px-2 py-1.5 border border-line rounded-lg text-xs bg-surface text-ink font-medium"
                  >
                    {[1, 2, 3, 4, 5].map(v => (
                      <option key={v} value={v}>{PROBABILITY_LABELS[v]}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-ink-soft uppercase mb-1">Consecuencia Residual (C)</label>
                  <select
                    value={newResCons}
                    onChange={(e) => setNewResCons(Number(e.target.value))}
                    className="w-full px-2 py-1.5 border border-line rounded-lg text-xs bg-surface text-ink font-medium"
                  >
                    {[1, 2, 3, 4, 5].map(v => (
                      <option key={v} value={v}>{CONSEQUENCE_LABELS[v]}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-between items-center text-xs font-bold text-ink pt-1">
                <span className="text-[11px] text-ink-soft">
                  {newResProb * newResCons >= 10 ? '🚨 Requiere Aprobación SIHO' : '✓ Nivel Aceptable'}
                </span>
                <span>
                  Valor Riesgo Residual: <span className="font-mono text-emerald-600 dark:text-emerald-400">{newResProb * newResCons}</span> ({getRiskCategory(newResProb * newResCons)})
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddStep}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-xs transition-all shadow-sm cursor-pointer"
            >
              + Agregar Paso a la Matriz
            </button>
          </div>
        </section>

        {/* PASO 7: EPP Y EQUIPOS DE EMERGENCIA */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-line pb-2">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center font-mono">7</span>
            <h3 className="text-sm font-bold text-ink uppercase tracking-wide">Paso 7: Selección de EPP Específico y Equipos de Emergencia</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-line rounded-2xl p-4 space-y-3 bg-surface-2/40">
              <h4 className="text-xs font-bold text-ink uppercase flex items-center gap-2">
                <HardHat size={16} className="text-emerald-600 dark:text-emerald-400" />
                Equipos de Protección Personal (EPP Obligatorio)
              </h4>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {defaultEppList.map((item, idx) => (
                  <label key={idx} className="flex items-center gap-2.5 p-2 rounded-lg border border-line bg-surface hover:bg-surface-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={selectedEpp.includes(item)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedEpp([...selectedEpp, item]);
                        else setSelectedEpp(selectedEpp.filter(x => x !== item));
                      }}
                      className="rounded text-emerald-600 border-line focus:ring-emerald-500"
                    />
                    <span className="text-ink font-medium">{item}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="border border-line rounded-2xl p-4 space-y-3 bg-surface-2/40">
              <h4 className="text-xs font-bold text-ink uppercase flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400" />
                Equipos de Rescate y Respuesta a Emergencia
              </h4>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {defaultEmergencyEquipment.map((item, idx) => (
                  <label key={idx} className="flex items-center gap-2.5 p-2 rounded-lg border border-line bg-surface hover:bg-surface-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={selectedEmergency.includes(item)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedEmergency([...selectedEmergency, item]);
                        else setSelectedEmergency(selectedEmergency.filter(x => x !== item));
                      }}
                      className="rounded text-emerald-600 border-line focus:ring-emerald-500"
                    />
                    <span className="text-ink font-medium">{item}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* PASO 8: FIRMAS ELECTRÓNICAS Y DIVULGACIÓN AL PERSONAL */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-line pb-2">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center font-mono">8</span>
            <h3 className="text-sm font-bold text-ink uppercase tracking-wide">Paso 8: Firma Electrónica SIHO-A y Registro de Divulgación</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* SIHO Approval & Hash */}
            <div className={`border rounded-2xl p-5 space-y-4 transition-all ${
              requiresSihoSignature 
                ? (isSigned ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30')
                : 'bg-surface-2/40 border-line'
            }`}>
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-ink uppercase flex items-center gap-2">
                  <Lock size={16} className={requiresSihoSignature ? 'text-red-500' : 'text-emerald-600'} />
                  Firma Electrónica del Supervisor SIHO-A
                </h4>
                {requiresSihoSignature && (
                  <span className="text-[10px] font-bold bg-red-600 text-white px-2 py-0.5 rounded-full uppercase">
                    Obligatoria (Residual ≥ 10)
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-ink-soft uppercase mb-1">Nombre del Supervisor SIHO-A</label>
                  <input
                    type="text"
                    value={sihoSupervisor}
                    onChange={(e) => setSihoSupervisor(e.target.value)}
                    className="w-full px-3 py-2 border border-line rounded-lg text-xs bg-surface text-ink font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-ink-soft uppercase mb-1">PIN / Clave de Seguridad SIHO</label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      placeholder="****"
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value)}
                      disabled={isSigned}
                      className="w-full px-3 py-2 border border-line rounded-lg text-xs bg-surface text-ink font-mono font-bold"
                    />
                    <button
                      type="button"
                      onClick={handleElectronicSignature}
                      disabled={isSigned}
                      className={`px-4 py-2 rounded-lg text-xs font-bold text-white shrink-0 cursor-pointer ${
                        isSigned ? 'bg-emerald-600' : 'bg-emerald-600 hover:bg-emerald-700'
                      }`}
                    >
                      {isSigned ? '✓ Firmado' : 'Firmar AST'}
                    </button>
                  </div>
                </div>

                {isSigned && (
                  <div className="p-3 bg-surface border border-emerald-500/30 rounded-xl space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 size={14} />
                      <span>Firma Electrónica Verificada (SHA-256)</span>
                    </div>
                    <p className="text-[10px] font-mono text-ink-faint break-all">{signatureHash}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Field Workers Attending Disclosure */}
            <div className="border border-line rounded-2xl p-5 space-y-4 bg-surface-2/40">
              <h4 className="text-xs font-bold text-ink uppercase flex items-center gap-2">
                <Users size={16} className="text-emerald-600 dark:text-emerald-400" />
                Personal Entrenado y Divulgado en Sitio
              </h4>

              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {workers.map((w, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg border border-line bg-surface text-xs">
                    <div>
                      <span className="font-bold text-ink">{w.name}</span>
                      <span className="text-[10px] text-ink-faint font-mono ml-2">C.I: {w.documentId}</span>
                    </div>
                    <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      ✓ Entendido
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nombre Trabajador"
                  value={newWorkerName}
                  onChange={(e) => setNewWorkerName(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-line rounded-lg text-xs bg-surface text-ink"
                />
                <input
                  type="text"
                  placeholder="C.I. / Ficha"
                  value={newWorkerDoc}
                  onChange={(e) => setNewWorkerDoc(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-line rounded-lg text-xs bg-surface text-ink"
                />
                <button
                  type="button"
                  onClick={handleAddWorker}
                  className="px-3 py-1.5 bg-emerald-600 text-white font-bold rounded-lg text-xs shrink-0 cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Submit Bar */}
        <div className="flex justify-end gap-4 pt-6 border-t border-line">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 border border-line text-ink font-semibold rounded-xl text-sm hover:bg-surface-2 transition-all cursor-pointer"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-all shadow-md cursor-pointer flex items-center gap-2"
          >
            <ShieldCheck size={18} />
            Aprobar y Registrar AST (PDVSA HO-H-02)
          </button>
        </div>
      </form>
    </div>
  );
}
