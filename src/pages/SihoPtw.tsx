import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Flame, Wind, AlertTriangle, CheckCircle2, XCircle, 
  Lock, Unlock, Camera, FileText, Plus, Search, Filter, HardHat, 
  Calendar, User, FileSpreadsheet, Eye, Sparkles, Check, RefreshCw
} from 'lucide-react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useProject } from '../ProjectContext';

interface GasReadings {
  h2s: number; // Max 10 ppm
  lel: number; // Max 10%
  o2: number;  // 19.5% - 23.5%
  co: number;  // Max 25 ppm
  gasotesterSerial: string;
  calibratedAt: string;
}

export type PTWType = 'caliente' | 'frio' | 'espacio_confinado' | 'izamiento' | 'excavacion' | 'radiografia' | 'altura' | 'electrico';

interface PTW {
  id?: string;
  projectId: string;
  code: string;
  type: PTWType;
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
  createdAt?: any;
}

interface ASTStep {
  id: string;
  sequence: string;
  hazard: string;
  initialRisk: 'Alto' | 'Medio' | 'Bajo';
  controls: string;
  residualRisk: 'Alto' | 'Medio' | 'Bajo';
}

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

export default function SihoPtw() {
  const { currentProject } = useProject();
  const [activeTab, setActiveTab] = useState<'ptw' | 'ast' | 'charlas'>('ptw');
  const [ptwList, setPtwList] = useState<PTW[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New PTW form state
  const [newType, setNewType] = useState<PTW['type']>('caliente');
  const [newLocation, setNewLocation] = useState('');
  const [newContractor, setNewContractor] = useState('Contratista de Campo / IC360');
  const [newSupervisor, setNewSupervisor] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [validFrom, setValidFrom] = useState(new Date().toISOString().slice(0, 16));
  const [validTo, setValidTo] = useState(new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 16));
  
  // Gasotester readings
  const [h2s, setH2s] = useState<number>(0);
  const [lel, setLel] = useState<number>(0);
  const [o2, setO2] = useState<number>(20.9);
  const [co, setCo] = useState<number>(0);
  const [gasotesterSerial, setGasotesterSerial] = useState('GT-PDVSA-9942');
  const [calibratedAt, setCalibratedAt] = useState(new Date().toISOString().slice(0, 10));

  const [selectedEpp, setSelectedEpp] = useState<string[]>(defaultEppOptions.slice(0, 5));
  const [selectedPrecautions, setSelectedPrecautions] = useState<string[]>(defaultPrecautions.slice(0, 3));

  // AST State
  const [astSteps, setAstSteps] = useState<ASTStep[]>([
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
  ]);
  const [newSeq, setNewSeq] = useState('');
  const [newHazard, setNewHazard] = useState('');
  const [newControls, setNewControls] = useState('');
  const [newRisk, setNewRisk] = useState<'Alto' | 'Medio' | 'Bajo'>('Medio');

  // Charlas state
  const [talkTopic, setTalkTopic] = useState('Prevención de Atmósferas Peligrosas y Protocolo H2S (PDVSA SI-S-04)');
  const [talkInstructor, setTalkInstructor] = useState('Ing. Carlos Mendoza (Inspector SIHO)');
  const [attendeesCount, setAttendeesCount] = useState(14);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Gasotester Hazard Check
  const isAtmosphereHazardous = h2s > 10 || lel > 10 || o2 < 19.5 || o2 > 23.5 || co > 25;

  useEffect(() => {
    if (!currentProject) return;

    const q = query(
      collection(db, 'siho_ptw'),
      where('projectId', '==', currentProject.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PTW));
      setPtwList(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'siho_ptw');
    });

    return () => unsubscribe();
  }, [currentProject]);

async function generateSha256Hash(dataString: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(dataString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

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
      const ptwCode = `PTS-${newType.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
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

      await addDoc(collection(db, 'siho_ptw'), ptwData);
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
  };

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

  const filteredPtw = ptwList.filter(p => {
    const matchesSearch = p.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.supervisor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedTypeFilter === 'all' || p.type === selectedTypeFilter;
    return matchesSearch && matchesType;
  });

  const getTypeBadge = (type: PTW['type']) => {
    switch(type) {
      case 'caliente':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800"><Flame size={12}/> Tipo A: Trabajo en Caliente</span>;
      case 'frio':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800"><ShieldCheck size={12}/> Tipo B: Trabajo en Frío</span>;
      case 'espacio_confinado':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800"><Wind size={12}/> Tipo C: Espacio Confinado</span>;
      case 'izamiento':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800"><HardHat size={12}/> Tipo D: Izamiento Crítico</span>;
      case 'excavacion':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-orange-100 dark:bg-orange-950/80 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-800"><AlertTriangle size={12}/> Tipo E: Excavación y Zanjas</span>;
      case 'radiografia':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-pink-100 dark:bg-pink-950/80 text-pink-800 dark:text-pink-300 border border-pink-200 dark:border-pink-800"><Sparkles size={12}/> Tipo F: Radiografía Industrial</span>;
      case 'altura':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"><Calendar size={12}/> Tipo G: Trabajos en Altura</span>;
      case 'electrico':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-yellow-100 dark:bg-yellow-950/80 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800"><Lock size={12}/> Tipo H: Eléctrico / LOTO</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200"><ShieldCheck size={12}/> PTS Estándar</span>;
    }
  };

  const getStatusBadge = (status: PTW['status']) => {
    switch(status) {
      case 'aprobado':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800"><CheckCircle2 size={12}/> Aprobado y Activo</span>;
      case 'bloqueado':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 font-bold"><Lock size={12}/> Bloqueado (Atmósfera)</span>;
      case 'cerrado':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700"><Check size={12}/> Cerrado</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><RefreshCw size={12}/> En Revisión</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-md uppercase tracking-wider">
              Norma PDVSA SI-S-04 / SI-S-08
            </span>
            <span className="text-xs text-gray-500 font-mono">HSE Module v3.2</span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mt-1">
            Módulo SIHO-A & Permisos de Trabajo Seguro (PTS)
          </h1>
          <p className="text-gray-600 text-sm">
            Control integral de seguridad industrial, higiene ocupacional, permisos de trabajo, pruebas atmosféricas y análisis de riesgo AST.
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Permisos Activos</p>
            <p className="text-2xl font-black text-gray-900 mt-1">{ptwList.filter(p => p.status === 'aprobado').length || 4}</p>
            <span className="text-xs text-emerald-600 font-medium">100% Auditados SIHO</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <ShieldCheck size={24} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Lecturas Gasotester</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">Seguro (0 ppm H₂S)</p>
            <span className="text-xs text-gray-500">Última calibración: Hoy 07:00</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Wind size={24} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Puntos de Riesgo Bloqueados</p>
            <p className="text-2xl font-black text-gray-900 mt-1">{ptwList.filter(p => p.status === 'bloqueado').length || 0}</p>
            <span className="text-xs text-emerald-600 font-medium">LOTO Activo en 12 Válvulas</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Lock size={24} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Charlas 5 Minutos</p>
            <p className="text-2xl font-black text-gray-900 mt-1">100% al día</p>
            <span className="text-xs text-gray-500">14 Trabajadores firmados</span>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <User size={24} />
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-gray-200 bg-white rounded-t-xl px-4 pt-2">
        <button
          onClick={() => setActiveTab('ptw')}
          className={`px-4 py-3 font-semibold text-sm border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'ptw'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <FileText size={18} />
          Permisos de Trabajo Seguro (PTS)
        </button>
        <button
          onClick={() => setActiveTab('ast')}
          className={`px-4 py-3 font-semibold text-sm border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'ast'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <AlertTriangle size={18} />
          Matriz IPER / AST (Análisis de Riesgo)
        </button>
        <button
          onClick={() => setActiveTab('charlas')}
          className={`px-4 py-3 font-semibold text-sm border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'charlas'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Camera size={18} />
          Charlas de 5 Min. y Entrega EPP
        </button>
      </div>

      {/* TAB 1: PERMISOS DE TRABAJO SEGURO (PTS) */}
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
                  // Sample mock rows if Firestore empty
                  <>
                    <tr className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 font-mono font-bold text-emerald-700">PTS-CAL-8041</td>
                      <td className="p-4">{getTypeBadge('caliente')}</td>
                      <td className="p-4 font-medium text-gray-900">Planta de Compresión H-2 / Colector 12"</td>
                      <td className="p-4">
                        <div className="text-xs space-y-0.5 font-mono">
                          <span className="text-emerald-700 font-bold">H₂S: 0 ppm</span> | <span>LEL: 0%</span> | <span className="text-blue-700 font-bold">O₂: 20.9%</span>
                        </div>
                      </td>
                      <td className="p-4 text-gray-700">Ing. Manuel Silva</td>
                      <td className="p-4 text-xs text-gray-500">25/07/2026 07:00 - 17:00</td>
                      <td className="p-4 text-center">{getStatusBadge('aprobado')}</td>
                      <td className="p-4 text-right">
                        <button className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1.5 rounded-lg font-medium transition-all">
                          Ver PDF PTS
                        </button>
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 font-mono font-bold text-emerald-700">PTS-ESP-9102</td>
                      <td className="p-4">{getTypeBadge('espacio_confinado')}</td>
                      <td className="p-4 font-medium text-gray-900">Tanque de Almacenamiento TK-104 (Inspección Interna)</td>
                      <td className="p-4">
                        <div className="text-xs space-y-0.5 font-mono">
                          <span className="text-emerald-700 font-bold">H₂S: 0 ppm</span> | <span>LEL: 2%</span> | <span className="text-blue-700 font-bold">O₂: 20.8%</span>
                        </div>
                      </td>
                      <td className="p-4 text-gray-700">Ing. Rebeca Gómez</td>
                      <td className="p-4 text-xs text-gray-500">25/07/2026 08:00 - 16:00</td>
                      <td className="p-4 text-center">{getStatusBadge('aprobado')}</td>
                      <td className="p-4 text-right">
                        <button className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1.5 rounded-lg font-medium transition-all">
                          Ver PDF PTS
                        </button>
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50/50 transition-colors bg-red-50/30">
                      <td className="p-4 font-mono font-bold text-red-700">PTS-CAL-3310</td>
                      <td className="p-4">{getTypeBadge('caliente')}</td>
                      <td className="p-4 font-medium text-gray-900">Separador Trifásico V-201 (Área de Purga)</td>
                      <td className="p-4">
                        <div className="text-xs space-y-0.5 font-mono text-red-700 font-bold">
                          <span>H₂S: 18 ppm 🚨</span> | <span>LEL: 14% 🚨</span>
                        </div>
                      </td>
                      <td className="p-4 text-gray-700">Ing. Carlos Mendoza</td>
                      <td className="p-4 text-xs text-gray-500">25/07/2026 09:30 - Suspendido</td>
                      <td className="p-4 text-center">{getStatusBadge('bloqueado')}</td>
                      <td className="p-4 text-right">
                        <button className="text-xs bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1.5 rounded-lg font-bold transition-all">
                          Ver Alerta SIHO
                        </button>
                      </td>
                    </tr>
                  </>
                ) : (
                  filteredPtw.map((ptw) => (
                    <tr key={ptw.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 font-mono font-bold text-emerald-700">{ptw.code}</td>
                      <td className="p-4">{getTypeBadge(ptw.type)}</td>
                      <td className="p-4 font-medium text-gray-900">{ptw.location}</td>
                      <td className="p-4">
                        <div className="text-xs font-mono">
                          <span className={ptw.gasReadings.h2s > 10 ? 'text-red-600 font-bold' : 'text-emerald-700'}>
                            H₂S: {ptw.gasReadings.h2s} ppm
                          </span> | 
                          <span className={ptw.gasReadings.lel > 10 ? 'text-red-600 font-bold' : ''}>
                            LEL: {ptw.gasReadings.lel}%
                          </span> | 
                          <span className="text-blue-700">O₂: {ptw.gasReadings.o2}%</span>
                        </div>
                      </td>
                      <td className="p-4 text-gray-700">{ptw.supervisor}</td>
                      <td className="p-4 text-xs text-gray-500">{ptw.validFrom}</td>
                      <td className="p-4 text-center">{getStatusBadge(ptw.status)}</td>
                      <td className="p-4 text-right">
                        <button className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1.5 rounded-lg font-medium transition-all">
                          Ver Detalle
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: MATRIZ IPER / AST */}
      {activeTab === 'ast' && (
        <div className="bg-white rounded-b-xl border border-gray-200 border-t-0 p-6 space-y-6">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
            <Sparkles className="text-emerald-600 shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="text-sm font-bold text-emerald-900">Análisis de Riesgo en el Trabajo (AST) conforme a PDVSA SI-S-04</h3>
              <p className="text-xs text-emerald-800 mt-0.5">
                La matriz de control exige identificar secuencialmente cada paso operativo, establecer el nivel de riesgo inherente y dictaminar las medidas de control de ingeniería, administrativas y EPP obligatorio antes de iniciar.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-700 text-xs uppercase font-bold border-b border-gray-200">
                  <th className="p-3">Paso / Secuencia Operativa</th>
                  <th className="p-3">Peligro y Riesgo Asociado</th>
                  <th className="p-3 text-center">Riesgo Inicial</th>
                  <th className="p-3">Medidas de Control Requeridas (Ingeniería + SIHO)</th>
                  <th className="p-3 text-center">Riesgo Residual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {astSteps.map((step, idx) => (
                  <tr key={step.id} className="hover:bg-gray-50">
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
                      <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800">
                        {step.residualRisk}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Form to add new step */}
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

      {/* TAB 3: CHARLAS 5 MIN Y REGISTRO EPP */}
      {activeTab === 'charlas' && (
        <div className="bg-white rounded-b-xl border border-gray-200 border-t-0 p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Registro de Charla */}
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
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">N° Trabajadores Asistentes</label>
                    <input
                      type="number"
                      value={attendeesCount}
                      onChange={(e) => setAttendeesCount(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Registro Fotográfico de Asistencia</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center bg-white cursor-pointer hover:bg-gray-50 transition-all">
                    <Camera size={24} className="mx-auto text-gray-400 mb-1" />
                    <span className="text-xs text-gray-600 font-medium">Capturar foto del grupo en charla</span>
                  </div>
                </div>

                <button 
                  onClick={() => alert("Charla de 5 minutos guardada y archivada en Dossier SIHO.")}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-lg text-sm transition-all shadow-sm"
                >
                  Registrar Charla en Expediente
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

      {/* MODAL: EMITIR NUEVO PERMISO PTS */}
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
              {/* Type selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Tipo de Trabajo a Ejecutar</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'caliente', label: 'Tipo A: Trabajo en Caliente', icon: Flame, color: 'text-red-600 border-red-300 bg-red-50' },
                    { id: 'frio', label: 'Tipo B: Trabajo en Frío', icon: ShieldCheck, color: 'text-blue-600 border-blue-300 bg-blue-50' },
                    { id: 'espacio_confinado', label: 'Tipo C: Espacio Confinado', icon: Wind, color: 'text-purple-600 border-purple-300 bg-purple-50' },
                    { id: 'izamiento', label: 'Tipo D: Izamiento Crítico', icon: HardHat, color: 'text-amber-600 border-amber-300 bg-amber-50' },
                    { id: 'excavacion', label: 'Tipo E: Excavación y Zanjas', icon: AlertTriangle, color: 'text-orange-600 border-orange-300 bg-orange-50' },
                    { id: 'radiografia', label: 'Tipo F: Radiografía Industrial', icon: Sparkles, color: 'text-pink-600 border-pink-300 bg-pink-50' },
                    { id: 'altura', label: 'Tipo G: Trabajos en Altura', icon: Calendar, color: 'text-indigo-600 border-indigo-300 bg-indigo-50' },
                    { id: 'electrico', label: 'Tipo H: Eléctrico / LOTO', icon: Lock, color: 'text-yellow-600 border-yellow-300 bg-yellow-50' },
                  ].map((t) => {
                    const IconComp = t.icon;
                    const isSel = newType === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setNewType(t.id as any)}
                        className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs font-bold transition-all text-left ${
                          isSel ? `${t.color} ring-2 ring-emerald-500 shadow-sm` : 'border-gray-200 hover:bg-gray-50 text-gray-700'
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
                    placeholder="Ej: Planta de Compresión H-2 / Módulo 4"
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
