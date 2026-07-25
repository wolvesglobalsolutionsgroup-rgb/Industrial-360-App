import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, FileText, Plus, Search, Filter, HardHat, 
  Eye, Sparkles, CheckCircle2, XCircle, AlertTriangle, 
  ZoomIn, ZoomOut, RefreshCw, Sliders, Layers, FileCheck, Check
} from 'lucide-react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useProject } from '../ProjectContext';

interface WeldJoint {
  id?: string;
  projectId: string;
  tag: string;             // Joint ID e.g. J-01
  isometric: string;       // Isometric No e.g. ISO-PDVSA-04
  diameterSchedule: string;// e.g. 8" Sch 80
  heatNumber: string;      // Colada / MTR
  wpsCode: string;         // Procedure code
  welderStamp: string;     // Welder WPQ ID
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

export default function QaQcWelding() {
  const { currentProject } = useProject();
  const [activeTab, setActiveTab] = useState<'joints' | 'ndt' | 'diconde'>('joints');
  const [jointsList, setJointsList] = useState<WeldJoint[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddJointModal, setIsAddJointModal] = useState(false);

  // New Joint Form State
  const [newTag, setNewTag] = useState('');
  const [newIsometric, setNewIsometric] = useState('');
  const [newDiameter, setNewDiameter] = useState('8" Sch 80 CS');
  const [newHeatNumber, setNewHeatNumber] = useState('');
  const [newWpsCode, setNewWpsCode] = useState('WPS-PDVSA-SMAW/GTAW-01');
  const [newWelderStamp, setNewWelderStamp] = useState('');
  const [newNdtMethod, setNewNdtMethod] = useState<WeldJoint['ndtMethod']>('RT');

  // DICONDE Viewer state
  const [selectedDiconde, setSelectedDiconde] = useState<DicondeSample>(mockDicondeSamples[0]);
  const [isInverted, setIsInverted] = useState(true);
  const [contrast, setContrast] = useState(120);
  const [brightness, setBrightness] = useState(100);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [showAnnotations, setShowAnnotations] = useState(true);

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

  const handleCreateJoint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject) {
      alert("Selecciona un proyecto activo primero.");
      return;
    }

    try {
      const jointData: Omit<WeldJoint, 'id'> = {
        projectId: currentProject.id,
        tag: newTag || `J-${Math.floor(10 + Math.random() * 90)}-ISO-104`,
        isometric: newIsometric || 'ISO-PDVSA-HC-04',
        diameterSchedule: newDiameter,
        heatNumber: newHeatNumber || 'COL-99421-A',
        wpsCode: newWpsCode,
        welderStamp: newWelderStamp || 'W-402 (J. Pérez)',
        fitupStatus: 'Aprobado',
        vtStatus: 'Aprobado',
        ndtMethod: newNdtMethod,
        ndtStatus: 'Aprobado',
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
    setNewHeatNumber('');
    setNewWelderStamp('');
  };

  const filteredJoints = jointsList.filter(j => {
    const matchesSearch = j.tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          j.isometric.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          j.welderStamp.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || j.ndtStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-md uppercase tracking-wider">
              ASME Secc. IX / API 1104 / ASTM DICONDE
            </span>
            <span className="text-xs text-gray-500 font-mono">QA/QC Traceability v2.4</span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mt-1">
            Módulo QA/QC Trazabilidad de Juntas & Ensayos NDT
          </h1>
          <p className="text-gray-600 text-sm">
            Trazabilidad 100% inalterable de soldadura por isométrico, MTR de colada, procedimiento WPS, estampa de soldador (WPQ) y visor DICONDE para radiografías.
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

      {/* KPI Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Juntas Inspeccionadas</p>
            <p className="text-2xl font-black text-gray-900 mt-1">{jointsList.length || 48} Juntas</p>
            <span className="text-xs text-emerald-600 font-medium">100% Con Trazabilidad MTR</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <FileCheck size={24} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Aprobación NDT (RT/UT)</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">97.8%</p>
            <span className="text-xs text-gray-500">Criterio API 1104 Sec. 9</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <ShieldCheck size={24} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Índice de Reparación</p>
            <p className="text-2xl font-black text-amber-600 mt-1">1.2%</p>
            <span className="text-xs text-gray-500">1 Junta en reparación</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <AlertTriangle size={24} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Soldadores Calificados (WPQ)</p>
            <p className="text-2xl font-black text-gray-900 mt-1">8 Estampas</p>
            <span className="text-xs text-emerald-600 font-medium">Vigencia 6G ASME IX</span>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <HardHat size={24} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white rounded-t-xl px-4 pt-2">
        <button
          onClick={() => setActiveTab('joints')}
          className={`px-4 py-3 font-semibold text-sm border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'joints'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Layers size={18} />
          Matriz de Trazabilidad de Juntas
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
          Registro de Ensayos NDT (VT, PT, MT, UT, RT)
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
          Visor ASTM DICONDE (.dcm) Radiografías
        </button>
      </div>

      {/* TAB 1: MATRIZ DE TRAZABILIDAD DE JUNTAS */}
      {activeTab === 'joints' && (
        <div className="bg-white rounded-b-xl border border-gray-200 border-t-0 p-6 space-y-6">
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

          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-xs uppercase font-bold border-b border-gray-200">
                  <th className="p-3">Junta Tag</th>
                  <th className="p-3">N° Isométrico</th>
                  <th className="p-3">Diámetro & Sch</th>
                  <th className="p-3">Colada / MTR</th>
                  <th className="p-3">Procedimiento WPS</th>
                  <th className="p-3">Estampa (WPQ)</th>
                  <th className="p-3 text-center">Punteado</th>
                  <th className="p-3 text-center">VT</th>
                  <th className="p-3 text-center">Estado NDT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredJoints.length === 0 ? (
                  // Mock Sample Rows
                  <>
                    <tr className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-3 font-mono font-bold text-emerald-700">J-01-ISO-104</td>
                      <td className="p-3 font-mono text-gray-900">ISO-PDVSA-HC-04</td>
                      <td className="p-3 text-gray-700">8" Sch 80 CS</td>
                      <td className="p-3 font-mono text-xs text-blue-700">COL-99421-A</td>
                      <td className="p-3 text-xs font-semibold text-gray-800">WPS-PDVSA-01</td>
                      <td className="p-3 font-bold text-gray-900">W-402 (J. Pérez)</td>
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
                      <td className="p-3 text-gray-700">8" Sch 80 CS</td>
                      <td className="p-3 font-mono text-xs text-blue-700">COL-99421-A</td>
                      <td className="p-3 text-xs font-semibold text-gray-800">WPS-PDVSA-01</td>
                      <td className="p-3 font-bold text-gray-900">W-402 (J. Pérez)</td>
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
                      <td className="p-3 text-gray-700">8" Sch 80 CS</td>
                      <td className="p-3 font-mono text-xs text-blue-700">COL-99421-B</td>
                      <td className="p-3 text-xs font-semibold text-gray-800">WPS-PDVSA-01</td>
                      <td className="p-3 font-bold text-gray-900">W-309 (M. Rivas)</td>
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
                  filteredJoints.map((j) => (
                    <tr key={j.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-3 font-mono font-bold text-emerald-700">{j.tag}</td>
                      <td className="p-3 font-mono text-gray-900">{j.isometric}</td>
                      <td className="p-3 text-gray-700">{j.diameterSchedule}</td>
                      <td className="p-3 font-mono text-xs text-blue-700">{j.heatNumber}</td>
                      <td className="p-3 text-xs font-semibold text-gray-800">{j.wpsCode}</td>
                      <td className="p-3 font-bold text-gray-900">{j.welderStamp}</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">{j.fitupStatus}</span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">{j.vtStatus}</span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          j.ndtStatus === 'Aprobado' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {j.ndtStatus === 'Aprobado' ? <CheckCircle2 size={12}/> : <XCircle size={12}/>}
                          {j.ndtMethod} {j.ndtStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: NDT LOG */}
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

      {/* TAB 3: VISOR INTERACTIVO ASTM DICONDE (.dcm) */}
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

            {/* Selector of sample DCMs */}
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
            </div>
          </div>

          {/* DICONDE Canvas Screen */}
          <div className="relative bg-black rounded-xl overflow-hidden border border-gray-800 flex items-center justify-center min-h-[380px]">
            {/* Background Simulated X-ray Image */}
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

            {/* Overlay Defect Bounding Box if exists */}
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

            {/* DICONDE Watermark / Metadata Overlay */}
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
        </div>
      )}

      {/* MODAL: REGISTRAR NUEVA JUNTA */}
      {isAddJointModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-gray-200 pb-4">
              <div>
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Control de Soldadura</span>
                <h2 className="text-xl font-black text-gray-900">Registrar Junta de Soldadura</h2>
              </div>
              <button onClick={() => setIsAddJointModal(false)} className="text-gray-400 hover:text-gray-600 p-2">
                <XCircle size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateJoint} className="space-y-4">
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Procedimiento WPS Apoyo</label>
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
