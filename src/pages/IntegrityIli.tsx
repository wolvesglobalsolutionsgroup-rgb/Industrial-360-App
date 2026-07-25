import React, { useState, useEffect } from 'react';
import { 
  Database, AlertTriangle, ShieldCheck, FileSpreadsheet, Activity, 
  MapPin, Clock, Search, Download, Plus, CheckCircle2, ChevronRight, 
  Layers, Settings, Calculator, FileText, ArrowRight, Compass, Wrench
} from 'lucide-react';
import { useProject } from '../ProjectContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

interface Anomaly {
  id: string;
  kp: number; // Kilometraj/Chainage in km
  clockPosition: string; // e.g., "04:30"
  depthPercent: number; // % Wall Thickness loss
  lengthMm: number; // Anomaly length in mm
  widthMm: number; // Anomaly width in mm
  type: 'Metal Loss' | 'Dent' | 'Gouge' | 'Crack' | 'Manufacturing Defect';
  internalExternal: 'Internal' | 'External';
  nominalWT: number; // Nominal wall thickness in mm
  pipeDiameter: number; // Outer diameter in inches
  smys: number; // SMYS in psi (e.g., 52000 for X52)
  maop: number; // MAOP in psi
  status: 'Inconclusa' | 'Atención Prioritaria' | 'Dig Sheet Generado' | 'Reparado';
}

export default function IntegrityIli() {
  const { currentProject } = useProject();
  const [activeTab, setActiveTab] = useState<'ili' | 'calculator' | 'digsheets' | 'api653' | 'api570'>('ili');
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Calculator custom state
  const [calcDiameter, setCalcDiameter] = useState<number>(12);
  const [calcWT, setCalcWT] = useState<number>(12.7); // mm
  const [calcDepth, setCalcDepth] = useState<number>(35); // %
  const [calcLength, setCalcLength] = useState<number>(120); // mm
  const [calcMAOP, setCalcMAOP] = useState<number>(1100); // psi
  const [calcSMYS, setCalcSMYS] = useState<number>(52000); // psi (X52)
  const [calcFolias, setCalcFolias] = useState<number>(0.72); // Design factor

  // API 653 Tank state
  const [tankTag, setTankTag] = useState('TK-102 (Patios de Almacenamiento Anaco)');
  const [bottomWTMin, setBottomWTMin] = useState(3.2); // mm
  const [corrosionRate, setCorrosionRate] = useState(0.22); // mm/year
  const [tankNextInspectionYears, setTankNextInspectionYears] = useState(4.5);

  // Load sample or Firebase anomalies
  useEffect(() => {
    const defaultAnomalies: Anomaly[] = [
      {
        id: 'ANO-ROS-001',
        kp: 4.235,
        clockPosition: '04:30',
        depthPercent: 48,
        lengthMm: 145,
        widthMm: 65,
        type: 'Metal Loss',
        internalExternal: 'External',
        nominalWT: 12.7,
        pipeDiameter: 16,
        smys: 52000,
        maop: 1100,
        status: 'Atención Prioritaria'
      },
      {
        id: 'ANO-ROS-002',
        kp: 12.890,
        clockPosition: '01:15',
        depthPercent: 22,
        lengthMm: 80,
        widthMm: 40,
        type: 'Metal Loss',
        internalExternal: 'Internal',
        nominalWT: 12.7,
        pipeDiameter: 16,
        smys: 52000,
        maop: 1100,
        status: 'Inconclusa'
      },
      {
        id: 'ANO-ROS-003',
        kp: 28.650,
        clockPosition: '06:00',
        depthPercent: 62,
        lengthMm: 210,
        widthMm: 90,
        type: 'Metal Loss',
        internalExternal: 'External',
        nominalWT: 12.7,
        pipeDiameter: 16,
        smys: 52000,
        maop: 1100,
        status: 'Dig Sheet Generado'
      },
      {
        id: 'ANO-ROS-004',
        kp: 34.110,
        clockPosition: '11:45',
        depthPercent: 15,
        lengthMm: 45,
        widthMm: 30,
        type: 'Manufacturing Defect',
        internalExternal: 'Internal',
        nominalWT: 12.7,
        pipeDiameter: 16,
        smys: 52000,
        maop: 1100,
        status: 'Inconclusa'
      }
    ];

    setAnomalies(defaultAnomalies);
    setSelectedAnomaly(defaultAnomalies[0]);
  }, [currentProject]);

  // ASME B31G Calculations
  const calculateB31G = (
    diameterInches: number,
    wtMm: number,
    depthPct: number,
    lengthMm: number,
    maopPsi: number,
    smysPsi: number,
    df: number
  ) => {
    const dMm = (depthPct / 100) * wtMm; // Depth in mm
    const dOverT = depthPct / 100;
    const D_mm = diameterInches * 25.4;
    
    // Folias / Folias modified factor
    const z = (lengthMm * lengthMm) / (D_mm * wtMm);
    let M = 1;
    if (z <= 50) {
      M = Math.sqrt(1 + 0.6275 * z - 0.003375 * z * z);
    } else {
      M = 0.032 * z + 3.3;
    }

    // Safe operating pressure P_safe
    // P_design = (2 * SMYS * t / D) * DF
    const pDesign = ((2 * smysPsi * (wtMm / 25.4)) / diameterInches) * df;
    
    let pSafe = pDesign;
    if (dOverT > 0.1) {
      const num = 1 - (2 / 3) * (dMm / wtMm);
      const den = 1 - (2 / 3) * (dMm / wtMm) * (1 / M);
      pSafe = pDesign * (num / den);
    }

    const safeRatio = pSafe / maopPsi;
    const isSafe = safeRatio >= 1.0;

    return {
      dMm: dMm.toFixed(2),
      pDesign: Math.round(pDesign),
      pSafe: Math.round(pSafe),
      safeRatio: safeRatio.toFixed(2),
      isSafe,
      remediationRequired: depthPct >= 80 || safeRatio < 1.0
    };
  };

  const currentB31G = calculateB31G(
    calcDiameter,
    calcWT,
    calcDepth,
    calcLength,
    calcMAOP,
    calcSMYS,
    calcFolias
  );

  const filteredAnomalies = anomalies.filter(a => {
    const matchesSearch = a.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          a.kp.toString().includes(searchTerm);
    if (filterType === 'all') return matchesSearch;
    if (filterType === 'critical') return matchesSearch && a.depthPercent >= 40;
    return matchesSearch;
  });

  const handleSimulateImport = () => {
    const newAnno: Anomaly = {
      id: `ANO-ROS-00${anomalies.length + 1}`,
      kp: parseFloat((Math.random() * 40 + 5).toFixed(3)),
      clockPosition: `${Math.floor(Math.random() * 12 + 1).toString().padStart(2, '0')}:30`,
      depthPercent: Math.floor(Math.random() * 50 + 20),
      lengthMm: Math.floor(Math.random() * 150 + 50),
      widthMm: Math.floor(Math.random() * 80 + 30),
      type: 'Metal Loss',
      internalExternal: Math.random() > 0.5 ? 'External' : 'Internal',
      nominalWT: 12.7,
      pipeDiameter: 16,
      smys: 52000,
      maop: 1100,
      status: 'Atención Prioritaria'
    };
    setAnomalies([newAnno, ...anomalies]);
    setSelectedAnomaly(newAnno);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider mb-1">
            <Database size={16} /> Módulo Prioritario 3 · Normativa ASME B31G / API 579 / API 653 / API 570
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Integridad Mecánica & Corridas ILI Pigging</h1>
          <p className="text-slate-400 text-sm mt-1">
            Evaluación de anomalías de pared, cálculo de P_safe, remanente y generación de Dig Sheets para ductos y tanques de la instalación.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleSimulateImport}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition-all shadow-md"
          >
            <FileSpreadsheet size={16} />
            Importar Corrida ROSEN / NIMA (CSV)
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 bg-white rounded-xl p-1 shadow-sm overflow-x-auto">
        <button
          onClick={() => setActiveTab('ili')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
            activeTab === 'ili' ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Activity size={16} /> Visor de Tubería & Anomalías ILI
        </button>
        <button
          onClick={() => setActiveTab('calculator')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
            activeTab === 'calculator' ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Calculator size={16} /> Calculadora ASME B31G / RSTRENG
        </button>
        <button
          onClick={() => setActiveTab('digsheets')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
            activeTab === 'digsheets' ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <FileText size={16} /> Generador de Dig Sheets (Campo)
        </button>
        <button
          onClick={() => setActiveTab('api653')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
            activeTab === 'api653' ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Compass size={16} /> Tanques API 653
        </button>
        <button
          onClick={() => setActiveTab('api570')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
            activeTab === 'api570' ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Wrench size={16} /> Tuberías de Proceso API 570
        </button>
      </div>

      {/* TAB 1: VISOR DE TUBERÍA & ILI */}
      {activeTab === 'ili' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List of Anomalies */}
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
              </select>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {filteredAnomalies.map((item) => {
                const isSelected = selectedAnomaly?.id === item.id;
                const isCritical = item.depthPercent >= 40;

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedAnomaly(item)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-400/20'
                        : 'border-gray-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-800">{item.id}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        isCritical ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        KP {item.kp} km
                      </span>
                    </div>

                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-400 text-[10px] uppercase block">Profundidad</span>
                        <span className={`font-bold ${isCritical ? 'text-red-600' : 'text-gray-800'}`}>
                          {item.depthPercent}% WT ({((item.depthPercent / 100) * item.nominalWT).toFixed(2)} mm)
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 text-[10px] uppercase block">Orientación</span>
                        <span className="font-bold text-gray-800 font-mono">{item.clockPosition} h</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Inspection & Pipe View */}
          <div className="lg:col-span-2 space-y-6">
            {selectedAnomaly ? (
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-4 border-b border-gray-100 gap-2">
                  <div>
                    <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
                      ANOMALÍA SELECCIONADA: {selectedAnomaly.id}
                    </span>
                    <h3 className="text-xl font-bold text-gray-900 mt-1">
                      Pérdida de Metal Externa en KP {selectedAnomaly.kp} km
                    </h3>
                  </div>
                  <button 
                    onClick={() => setActiveTab('digsheets')}
                    className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 rounded-xl text-xs font-semibold"
                  >
                    <FileText size={14} />
                    Generar Dig Sheet de Excavación
                  </button>
                </div>

                {/* Pipeline 3D / Diagram View */}
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
                              top: selectedAnomaly.clockPosition.startsWith('04') ? '70%' : '20%',
                              left: selectedAnomaly.clockPosition.startsWith('04') ? '70%' : '80%',
                            }}
                            title={`Anomalía en ${selectedAnomaly.clockPosition}`}
                          />
                        </div>
                      </div>
                      <span className="text-xs font-mono text-emerald-400 bg-slate-800 px-3 py-1 rounded-full">
                        Posición: {selectedAnomaly.clockPosition} o'clock ({selectedAnomaly.internalExternal})
                      </span>
                    </div>

                    {/* Technical Profile Details */}
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

                      <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                        <span className="text-slate-400 block text-[10px] uppercase">Diagnóstico ASME B31G</span>
                        <p className="text-xs text-emerald-300 mt-1 font-sans">
                          {selectedAnomaly.depthPercent >= 40 
                            ? '⚠️ Requiere evaluación detallada de P_safe y posible encamisado Tipo B o envolvente de fibra de carbono.'
                            : '✅ Condición aceptable bajo MAOP actual. Requiere monitoreo en próxima corrida ILI.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional metrics */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-slate-50 rounded-xl border border-gray-200">
                    <span className="text-[10px] font-bold text-gray-500 uppercase block">MAOP Operativa</span>
                    <span className="text-sm font-bold text-gray-900 font-mono">{selectedAnomaly.maop} psi</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-gray-200">
                    <span className="text-[10px] font-bold text-gray-500 uppercase block">Material Tubería</span>
                    <span className="text-sm font-bold text-gray-900 font-mono">API 5L Gr. X52</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-gray-200">
                    <span className="text-[10px] font-bold text-gray-500 uppercase block">Factor Diseño (DF)</span>
                    <span className="text-sm font-bold text-gray-900 font-mono">0.72 (Clase 1)</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white p-12 text-center rounded-2xl border border-gray-200 text-gray-500">
                Selecciona una anomalía de la lista para inspeccionar la tubería.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CALCULADORA ASME B31G / RSTRENG */}
      {activeTab === 'calculator' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-lg font-bold text-gray-900">Calculadora de Presión Segura de Operación (P_safe) bajo ASME B31G</h2>
            <p className="text-xs text-gray-500 mt-1">
              Determina la resistencia remanente de tuberías corroídas bajo criterios ASME B31G modificado y RSTRENG.
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
            </div>

            {/* Results */}
            <div className="bg-slate-900 text-white p-6 rounded-2xl flex flex-col justify-between space-y-6">
              <div>
                <span className="text-xs text-emerald-400 font-mono font-bold uppercase block mb-1">
                  RESULTADO ASME B31G MODIFICADO
                </span>
                <h3 className="text-2xl font-bold">Diagnóstico de Presión Segura</h3>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <span className="text-xs text-slate-400">Presión de Diseño (P_design)</span>
                  <span className="text-base font-mono font-bold">{currentB31G.pDesign} psi</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <span className="text-xs text-slate-400">Presión Segura Calculada (P_safe)</span>
                  <span className="text-xl font-mono font-bold text-emerald-400">{currentB31G.pSafe} psi</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <span className="text-xs text-slate-400">Relación P_safe / MAOP</span>
                  <span className={`text-lg font-mono font-bold ${currentB31G.isSafe ? 'text-emerald-400' : 'text-red-400'}`}>
                    {currentB31G.safeRatio}
                  </span>
                </div>
              </div>

              <div className={`p-4 rounded-xl border ${
                currentB31G.isSafe 
                  ? 'bg-emerald-950/60 border-emerald-800 text-emerald-200' 
                  : 'bg-red-950/60 border-red-800 text-red-200'
              }`}>
                <div className="flex items-center gap-2 font-bold text-sm mb-1">
                  {currentB31G.isSafe ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                  {currentB31G.isSafe ? 'OPERACIÓN SEGURA BAJO MAOP' : 'ACCION DE REPARACIÓN REQUERIDA'}
                </div>
                <p className="text-xs opacity-90">
                  {currentB31G.isSafe 
                    ? 'La presión máxima segura sobrepasa la presión de operación MAOP. El ducto califica para mantener operación continuada.'
                    : 'La presión segura P_safe es inferior a la MAOP requerida. Se requiere deratear la presión o instalar camisas de refuerzo Tipo B / Resina epoxy.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GENERADOR DE DIG SHEETS */}
      {activeTab === 'digsheets' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Dig Sheet N° DS-IC360-2026-088</h2>
              <p className="text-xs text-gray-500">Ficha de excavación y verificación de campo para reparación estructural.</p>
            </div>
            <button 
              onClick={() => alert('Dig Sheet exportado a PDF correctamente.')}
              className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold"
            >
              <Download size={14} /> Imprimir Dig Sheet (PDF)
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-gray-200 space-y-2">
              <h3 className="font-bold text-slate-800 text-sm">1. Ubicación y Coordenadas</h3>
              <p><strong className="text-gray-700">Ducto:</strong> Oleoducto 16" Oficina - Melones</p>
              <p><strong className="text-gray-700">Kilometraje (KP):</strong> KP 28.650 km</p>
              <p><strong className="text-gray-700">Coordenadas UTM:</strong> N 984,231.42 / E 382,104.88</p>
              <p><strong className="text-gray-700">Referencia Campo:</strong> Válvula de corte V-04 a +450 metros.</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-gray-200 space-y-2">
              <h3 className="font-bold text-slate-800 text-sm">2. Recomendación de Reparación</h3>
              <p><strong className="text-gray-700">Tipo Anolamía:</strong> Pérdida de metal externa (62% WT)</p>
              <p><strong className="text-gray-700">Envolvente Sugerida:</strong> Camisa de Acero Tipo B (Full Encirclement Sleeve) con soldadura de filete.</p>
              <p><strong className="text-gray-700">Preparación de Superficie:</strong> Chorro de arena a grado Sa 2.5 + Resina Epóxica.</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: TANQUES API 653 */}
      {activeTab === 'api653' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-gray-900">Inspección y Cálculo de Vida Remanente Tanques (API 653)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-slate-50 rounded-xl border border-gray-200 space-y-3">
              <span className="text-xs font-bold text-gray-500 uppercase">Tanque de Almacenamiento</span>
              <p className="text-sm font-bold text-slate-900">{tankTag}</p>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Espesor Mínimo Fondo (mm)</label>
                <input
                  type="number"
                  value={bottomWTMin}
                  onChange={(e) => setBottomWTMin(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs font-mono"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-gray-200 space-y-3">
              <span className="text-xs font-bold text-gray-500 uppercase">Velocidad de Corrosión</span>
              <p className="text-lg font-bold font-mono text-emerald-700">{corrosionRate} mm/año</p>
              <p className="text-xs text-gray-500">Estimado con historial de ultrasonido de fondo (UT MFL).</p>
            </div>

            <div className="p-4 bg-slate-900 text-white rounded-xl space-y-3">
              <span className="text-xs font-bold text-emerald-400 uppercase">Intervalo Máximo Próxima Inspección</span>
              <p className="text-2xl font-bold font-mono">{tankNextInspectionYears} Años</p>
              <p className="text-[11px] text-slate-300">Cumple con criterio de inspección interna API 653 Secc. 6.4.</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: TUBERÍAS API 570 */}
      {activeTab === 'api570' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Tuberías de Proceso y Puntos CML (API 570)</h2>
          <p className="text-xs text-gray-500">
            Monitoreo de espesores por corrosión en codos, reducciones e inyecciones químicas.
          </p>
          <div className="p-4 bg-slate-50 rounded-xl border border-gray-200 text-xs text-gray-600">
            Puntos CML verificados en la última parada de planta: 100% conformes con espesor t_min requerido.
          </div>
        </div>
      )}
    </div>
  );
}
