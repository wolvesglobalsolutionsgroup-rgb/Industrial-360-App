import React, { useState, useEffect, useRef } from 'react';
import { 
  Database, AlertTriangle, ShieldCheck, FileSpreadsheet, Activity, 
  MapPin, Clock, Search, Download, Plus, CheckCircle2, ChevronRight, 
  Layers, Settings, Calculator, FileText, ArrowRight, Compass, Wrench,
  Upload, Printer, Zap, Sparkles, Filter, RefreshCw, BarChart2
} from 'lucide-react';
import { useProject } from '../ProjectContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { 
  ComposedChart, LineChart, Line, Scatter, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceLine, Legend 
} from 'recharts';
import * as XLSX from 'xlsx';
import { ASMEB31GCalculator } from '../lib/norms/asme/asmeB31g';

export interface Anomaly {
  id: string;
  kp: number; // Kilometraje / KP in km
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
  upstreamWeldNo?: string; // JJ_NO
  upstreamWeldDistMm?: number; // JJ_DIST in mm
  easting?: number;
  northing?: number;
  cpPotentialMv?: number; // Cathodic Protection potential in -mV at this KP
}

export interface IliRun {
  id: string;
  runDate: string;
  lineTag: string;
  vendor: string;
  toolType: string;
  totalLengthKm: number;
  totalAnomalies: number;
  criticalAnomalies: number;
  status: 'Completado' | 'En Procesamiento' | 'Programado';
}

export interface CpSurveyPoint {
  kp: number;
  potentialMv: number;
  isDeficient: boolean;
  hasExternalDefect: boolean;
  anomalyId?: string;
}

const b31gCalc = new ASMEB31GCalculator();

export default function IntegrityIli() {
  const { currentProject, currentOrganization } = useProject();
  const orgName = currentOrganization?.name || 'CONTRATISTA OPERATIVA C.A.';

  const [activeTab, setActiveTab] = useState<'ili' | 'b31g' | 'cp' | 'api653' | 'runs' | 'digsheets'>('ili');
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // B31G Calculator Form Inputs
  const [calcDiameter, setCalcDiameter] = useState<number>(16);
  const [calcWTInches, setCalcWTInches] = useState<number>(0.500); // inches
  const [calcDepthInches, setCalcDepthInches] = useState<number>(0.210); // inches
  const [calcLengthInches, setCalcLengthInches] = useState<number>(5.5); // inches
  const [calcSMYS, setCalcSMYS] = useState<string>('52000'); // psi
  const [calcClassF, setCalcClassF] = useState<string>('0.72');
  const [calcPOper, setCalcPOper] = useState<number>(650); // psi

  // API 653 Tank Remaining Life State
  const [tankTag, setTankTag] = useState('TK-102 (Patios Anaco)');
  const [tankOriginalWT, setTankOriginalWT] = useState(6.35); // mm
  const [tankCurrentWT, setTankCurrentWT] = useState(3.40); // mm
  const [tankMinWT, setTankMinWT] = useState(2.54); // mm
  const [tankServiceYears, setTankServiceYears] = useState(12); // years

  // Default ILI Runs
  const [iliRuns, setIliRuns] = useState<IliRun[]>([
    {
      id: 'RUN-ROSEN-2024-01',
      runDate: '2024-02-15',
      lineTag: 'Gasoducto 16" Anaco - Puerto La Cruz',
      vendor: 'ROSEN Group',
      toolType: 'RoCorr MFL-A + EMAT (High Resolution)',
      totalLengthKm: 42.5,
      totalAnomalies: 128,
      criticalAnomalies: 4,
      status: 'Completado'
    },
    {
      id: 'RUN-TDW-2022-01',
      runDate: '2022-06-10',
      lineTag: 'Oleoducto 20" San Tomé - Jose',
      vendor: 'T.D. Williamson',
      toolType: 'MFL Ultra + CALIPER',
      totalLengthKm: 85.0,
      totalAnomalies: 240,
      criticalAnomalies: 9,
      status: 'Completado'
    }
  ]);

  // Initial Anomalies List
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
        status: 'Atención Prioritaria',
        upstreamWeldNo: 'JJ-0342',
        upstreamWeldDistMm: 1850,
        easting: 382104.88,
        northing: 984231.42,
        cpPotentialMv: -780
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
        status: 'Inconclusa',
        upstreamWeldNo: 'JJ-1045',
        upstreamWeldDistMm: 3200,
        easting: 388920.12,
        northing: 981150.30,
        cpPotentialMv: -920
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
        status: 'Dig Sheet Generado',
        upstreamWeldNo: 'JJ-2210',
        upstreamWeldDistMm: 410,
        easting: 395400.00,
        northing: 978100.50,
        cpPotentialMv: -710
      }
    ];

    setAnomalies(defaultAnomalies);
    setSelectedAnomaly(defaultAnomalies[0]);
  }, [currentProject]);

  // Compute CP survey data for chart alignment
  const cpSurveyData: CpSurveyPoint[] = Array.from({ length: 40 }, (_, i) => {
    const kp = parseFloat((i * 1.0).toFixed(1));
    let potentialMv = -980 + Math.sin(i * 0.4) * 120;
    
    if (Math.abs(kp - 4.2) < 0.8) potentialMv = -780;
    if (Math.abs(kp - 28.6) < 0.8) potentialMv = -710;

    const isDeficient = potentialMv > -850;
    const extAnomaly = anomalies.find(a => Math.abs(a.kp - kp) < 0.6 && a.internalExternal === 'External');

    return {
      kp,
      potentialMv: Math.round(potentialMv),
      isDeficient,
      hasExternalDefect: !!extAnomaly,
      anomalyId: extAnomaly?.id
    };
  });

  // Calculate clock needle position for 360 view
  const getClockNeedlePosition = (clockStr: string) => {
    if (!clockStr) return { topPct: '25%', leftPct: '50%' };
    const parts = clockStr.split(':').map(p => parseInt(p, 10));
    const h = parts[0] || 12;
    const m = parts[1] || 0;
    const totalHours = (h % 12) + m / 60;
    const angleRad = (totalHours * 30 - 90) * (Math.PI / 180);
    const r = 36;
    const top = 50 + r * Math.sin(angleRad);
    const left = 50 + r * Math.cos(angleRad);
    return { topPct: `${top.toFixed(1)}%`, leftPct: `${left.toFixed(1)}%` };
  };

  // Parser for ROSEN ILI Reports (.xlsx, .csv)
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadMessage('Procesando corrida de inspección ILI ROSEN...');
    const fileName = file.name.toLowerCase();

    const processRowObjects = (rows: Record<string, any>[]) => {
      const getVal = (row: Record<string, any>, possibleKeys: string[], defaultVal: any = '') => {
        const rowKeys = Object.keys(row);
        for (const pKey of possibleKeys) {
          const match = rowKeys.find(rk => rk.trim().toUpperCase() === pKey.toUpperCase());
          if (match !== undefined && row[match] !== '' && row[match] !== null) {
            return row[match];
          }
        }
        return defaultVal;
      };

      const parsedAnomalies: Anomaly[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const distRaw = getVal(row, ['DIST', 'KP', 'DISTANCE', 'DIST_KM', 'KM'], null);
        if (distRaw === null || String(distRaw).trim().toUpperCase() === 'DIST') continue;

        const typeVal = String(getVal(row, ['TYPE', 'ANOMALY_TYPE', 'CLASSIFICATION', 'TIPO'], 'Metal Loss')).trim();
        const wlRaw = getVal(row, ['WL', 'WL %', 'WL (%)', 'WL%', 'DEPTH_%', 'DEPTH_PCT', 'SEVERITY', 'PROFUNDIDAD'], null);
        const wlVal = wlRaw !== null ? Math.abs(parseFloat(String(wlRaw)) || 0) : 0;

        if (wlVal === 0 && !typeVal.toUpperCase().includes('DENT')) continue;

        const intExtRaw = String(getVal(row, ['INTERNAL', 'INT_EXT', 'INTERNAL/EXTERNAL', 'ORIENTATION', 'UBICACIÓN'], 'External')).toUpperCase();
        const isInternal = intExtRaw === 'Y' || intExtRaw.includes('INT');
        const cpRaw = getVal(row, ['CRITERIO PC (-MV)', 'CP', 'POTENCIAL_PC', 'PC_MV', 'CP_MV'], null);

        const dist = Math.abs(parseFloat(String(distRaw)) || Number(((i + 1) * 1.5).toFixed(3)));

        parsedAnomalies.push({
          id: `ANO-IMP-${100 + parsedAnomalies.length}`,
          kp: dist,
          clockPosition: String(getVal(row, ['O_CLOCK', 'CLOCK', 'POSITION', 'HORA'], '12:00')).trim(),
          depthPercent: wlVal || 25,
          lengthMm: parseFloat(String(getVal(row, ['LEN', 'LENGTH_MM', 'L_MM', 'LENGTH'], 120))) || 120,
          widthMm: parseFloat(String(getVal(row, ['WID', 'WIDTH_MM', 'W_MM', 'WIDTH'], 50))) || 50,
          type: typeVal.toUpperCase().includes('DENT') ? 'Dent' : 'Metal Loss',
          internalExternal: isInternal ? 'Internal' : 'External',
          nominalWT: 12.7,
          pipeDiameter: 16,
          smys: 52000,
          maop: 1100,
          status: (wlVal || 25) >= 40 ? 'Atención Prioritaria' : 'Inconclusa',
          easting: parseFloat(String(getVal(row, ['EASTING', 'UTM_E', 'X'], 381300 + parsedAnomalies.length * 120))),
          northing: parseFloat(String(getVal(row, ['NORTHING', 'UTM_N', 'Y'], 979350 - parsedAnomalies.length * 90))),
          cpPotentialMv: cpRaw !== null ? -Math.abs(parseFloat(String(cpRaw))) : -940,
          upstreamWeldNo: String(getVal(row, ['JJ_NO', 'WELD_NO', 'JUNTA'], `JJ-${100 + parsedAnomalies.length}`)),
          upstreamWeldDistMm: parseFloat(String(getVal(row, ['JJ_DIST', 'WELD_DIST'], 1200))) || 1200
        });
      }

      parsedAnomalies.sort((a, b) => b.depthPercent - a.depthPercent);

      if (parsedAnomalies.length > 0) {
        setAnomalies(parsedAnomalies);
        setSelectedAnomaly(parsedAnomalies[0]);
        setUploadMessage(`¡Éxito! Importadas ${parsedAnomalies.length} anomalías de ${file.name}.`);
      } else {
        setUploadMessage('No se encontraron registros de anomalías válidos.');
      }
    };

    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const jsonRows: Record<string, any>[] = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: '' });
          processRowObjects(jsonRows);
        } catch (err) {
          setUploadMessage('Error al procesar el archivo Excel ROSEN.');
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  // Run official ASME B31G Calculator
  const b31gResults = b31gCalc.calculate({
    D: calcDiameter,
    t: calcWTInches,
    d: calcDepthInches,
    L: calcLengthInches,
    smys: calcSMYS,
    F: calcClassF,
    P_oper: calcPOper
  });

  const b31gRes = b31gResults[0] || { passed: false, value: 0, margin: 0, recommendations: [], severity: 'error', details: {} };

  // Calculate Tank API 653 Remaining Life
  const tankCorrosionRate = tankServiceYears > 0 ? (tankOriginalWT - tankCurrentWT) / tankServiceYears : 0.1;
  const tankRemainingThickness = Math.max(0, tankCurrentWT - tankMinWT);
  const tankRemainingLifeYears = tankCorrosionRate > 0 ? tankRemainingThickness / tankCorrosionRate : 99;
  const tankNextInspectionYears = Math.min(10, tankRemainingLifeYears / 2);

  const filteredAnomalies = anomalies.filter(a => {
    const matchesSearch = a.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          a.kp.toString().includes(searchTerm) ||
                          (a.upstreamWeldNo && a.upstreamWeldNo.toLowerCase().includes(searchTerm.toLowerCase()));
    if (filterType === 'all') return matchesSearch;
    if (filterType === 'critical') return matchesSearch && a.depthPercent >= 40;
    if (filterType === 'external') return matchesSearch && a.internalExternal === 'External';
    return matchesSearch;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="backdrop-blur-xl bg-white/75 dark:bg-slate-900/75 p-6 sm:p-8 rounded-3xl border border-white/80 dark:border-slate-800/80 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-mono font-bold uppercase tracking-wider mb-2">
            <Database size={16} /> ASME B31G / RSTRENG / NACE SP0169 / API 653 / API 570
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Gestión de Integridad de Ductos & Corridas ILI Pigging
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl font-medium">
            Alineamiento de catódica vs anomalías MFL, evaluación estructural ASME B31G y generación de Dig Sheets para {orgName}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input 
            type="file" 
            id="ili-file-input"
            ref={fileInputRef} 
            onChange={handleFileImport} 
            accept=".xlsx,.xls,.csv,.txt" 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-[#0B2239] hover:bg-slate-800 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 font-extrabold px-5 py-3 rounded-2xl text-xs sm:text-sm transition-all shadow-sm cursor-pointer"
          >
            <Upload size={16} />
            <span>Importar Corrida ROSEN (.xlsx)</span>
          </button>
        </div>
      </div>

      {uploadMessage && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 border border-amber-200 rounded-2xl text-xs font-bold flex items-center justify-between">
          <span>{uploadMessage}</span>
          <button onClick={() => setUploadMessage(null)} className="text-slate-400 hover:text-slate-900">×</button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border border-white/80 dark:border-slate-800 bg-white/75 dark:bg-slate-900 backdrop-blur-xl rounded-3xl p-1.5 shadow-xs overflow-x-auto gap-1">
        <button
          onClick={() => setActiveTab('ili')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'ili' 
              ? 'bg-[#0B2239] text-white dark:bg-emerald-600 shadow-sm' 
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Activity size={16} /> Visor de Anomalías ILI
        </button>
        <button
          onClick={() => setActiveTab('b31g')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'b31g' 
              ? 'bg-[#0B2239] text-white dark:bg-emerald-600 shadow-sm' 
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Calculator size={16} /> Motor ASME B31G
        </button>
        <button
          onClick={() => setActiveTab('cp')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'cp' 
              ? 'bg-[#0B2239] text-white dark:bg-emerald-600 shadow-sm' 
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Zap size={16} /> Catódica vs ILI (NACE)
        </button>
        <button
          onClick={() => setActiveTab('api653')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'api653' 
              ? 'bg-[#0B2239] text-white dark:bg-emerald-600 shadow-sm' 
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Compass size={16} /> Tanques API 653 (Vida Remanente)
        </button>
        <button
          onClick={() => setActiveTab('runs')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'runs' 
              ? 'bg-[#0B2239] text-white dark:bg-emerald-600 shadow-sm' 
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BarChart2 size={16} /> Historico de Corridas ILI
        </button>
        <button
          onClick={() => setActiveTab('digsheets')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'digsheets' 
              ? 'bg-[#0B2239] text-white dark:bg-emerald-600 shadow-sm' 
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileText size={16} /> Dig Sheets de Campo
        </button>
      </div>

      {/* TAB 1: VISOR DE TUBERÍA & ILI */}
      {activeTab === 'ili' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">Anomalías Detectadas</h2>
              <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-full font-mono font-bold">
                {filteredAnomalies.length} Registros
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar KP o Junta..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs outline-none text-slate-900 dark:text-slate-100 font-medium"
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs bg-slate-50 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-200"
              >
                <option value="all">Todas</option>
                <option value="critical">Críticas (&gt;40%)</option>
                <option value="external">Solo Externas</option>
              </select>
            </div>

            <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
              {filteredAnomalies.map((item) => {
                const isSelected = selectedAnomaly?.id === item.id;
                const isCritical = item.depthPercent >= 40;

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedAnomaly(item)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#0B2239] dark:border-emerald-500 bg-slate-900 text-white shadow-md'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-black">{item.id}</span>
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                        isCritical 
                          ? (isSelected ? 'bg-red-500 text-white' : 'bg-red-100 text-red-700') 
                          : (isSelected ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-700')
                      }`}>
                        KP {item.kp} km
                      </span>
                    </div>

                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">Profundidad</span>
                        <span className={`font-black ${isCritical ? 'text-red-400' : ''}`}>
                          {item.depthPercent}% WT ({((item.depthPercent / 100) * item.nominalWT).toFixed(2)} mm)
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">Orientación</span>
                        <span className="font-bold font-mono">{item.clockPosition} h • {item.upstreamWeldNo || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {selectedAnomaly ? (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-200 dark:border-slate-800 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
                  <div>
                    <span className="text-xs font-mono font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 px-3 py-1 rounded-full border border-emerald-200">
                      ANOMALÍA SELECCIONADA: {selectedAnomaly.id}
                    </span>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mt-2">
                      {selectedAnomaly.type} ({selectedAnomaly.internalExternal}) en KP {selectedAnomaly.kp} km
                    </h3>
                  </div>
                  <button 
                    onClick={() => setActiveTab('digsheets')}
                    className="flex items-center gap-2 bg-[#0B2239] hover:bg-slate-800 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <FileText size={14} />
                    <span>Ver Dig Sheet</span>
                  </button>
                </div>

                <div className="bg-slate-950 p-6 rounded-2xl text-white space-y-5">
                  <div className="flex justify-between items-center text-xs text-slate-400 border-b border-slate-800 pb-2">
                    <span>SECCIÓN TUBERÍA O.D. {selectedAnomaly.pipeDiameter}" API 5L Gr. X52</span>
                    <span className="text-emerald-400 font-mono font-bold">KILOMETRAJE KP {selectedAnomaly.kp} KM</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <span className="text-xs text-slate-300 font-mono">Orientación Carátula Reloj</span>
                      <div className="relative w-44 h-44 rounded-full border-4 border-slate-700 bg-slate-900 flex items-center justify-center">
                        <span className="absolute top-2 text-[10px] text-slate-400 font-mono">12:00</span>
                        <span className="absolute right-2 text-[10px] text-slate-400 font-mono">03:00</span>
                        <span className="absolute bottom-2 text-[10px] text-slate-400 font-mono">06:00</span>
                        <span className="absolute left-2 text-[10px] text-slate-400 font-mono">09:00</span>
                        
                        <div className="w-32 h-32 rounded-full border-2 border-slate-500 bg-slate-800 flex items-center justify-center relative">
                          <span className="text-[11px] text-emerald-400 font-mono font-bold">WT {selectedAnomaly.nominalWT}mm</span>
                          
                          {(() => {
                            const pos = getClockNeedlePosition(selectedAnomaly.clockPosition);
                            return (
                              <div 
                                className="absolute w-4 h-4 rounded-full bg-red-500 animate-pulse border-2 border-white shadow-lg"
                                style={{ top: pos.topPct, left: pos.leftPct, transform: 'translate(-50%, -50%)' }}
                              />
                            );
                          })()}
                        </div>
                      </div>
                      <span className="text-xs font-mono text-emerald-400 bg-slate-900 border border-slate-800 px-3.5 py-1 rounded-full">
                        Posición: {selectedAnomaly.clockPosition} o'clock ({selectedAnomaly.internalExternal})
                      </span>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Profundidad Pérdida (d)</span>
                        <p className="text-xl font-bold text-red-400 font-mono mt-0.5">
                          {selectedAnomaly.depthPercent}% WT ({((selectedAnomaly.depthPercent / 100) * selectedAnomaly.nominalWT).toFixed(2)} mm)
                        </p>
                      </div>

                      <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 grid grid-cols-2 gap-2 font-mono">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Longitud L</span>
                          <span className="text-slate-200 font-bold">{selectedAnomaly.lengthMm} mm</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Ancho W</span>
                          <span className="text-slate-200 font-bold">{selectedAnomaly.widthMm} mm</span>
                        </div>
                      </div>

                      <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Junta Referencia</span>
                        <p className="text-xs text-amber-400 font-mono mt-0.5">
                          {selectedAnomaly.upstreamWeldNo || 'JJ-101'} @ {selectedAnomaly.upstreamWeldDistMm || 1200} mm
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* TAB 2: MOTOR DE CÁLCULO ASME B31G (USANDO CLASE B31GCALCULATOR) */}
      {activeTab === 'b31g' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 space-y-6">
          <div className="border-b border-gray-100 dark:border-slate-800 pb-4">
            <span className="text-xs font-mono font-bold text-emerald-600 uppercase">ASME B31G Engine §3.2</span>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mt-1">Evaluación Oficial de Resistencia Remanente (ASME B31G 2021)</h2>
            <p className="text-xs text-gray-500 mt-1">
              Evaluación de Presión Máxima Segura Operativa (MAOP_safe) y Factor de Folias M en tuberías corroídas.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-[#0B2239] dark:text-emerald-400 uppercase tracking-wider">Parámetros de Entrada ASME B31G</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Diámetro OD (pulgadas)</label>
                  <input
                    type="number"
                    value={calcDiameter}
                    onChange={(e) => setCalcDiameter(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 rounded-xl text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Espesor Nominal t (pulgadas)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={calcWTInches}
                    onChange={(e) => setCalcWTInches(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 rounded-xl text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Profundidad Pérdida d (pulgadas)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={calcDepthInches}
                    onChange={(e) => setCalcDepthInches(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 rounded-xl text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Longitud Axial L (pulgadas)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={calcLengthInches}
                    onChange={(e) => setCalcLengthInches(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 rounded-xl text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Especificación Acero (SMYS)</label>
                  <select
                    value={calcSMYS}
                    onChange={(e) => setCalcSMYS(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 rounded-xl text-sm font-medium"
                  >
                    <option value="35000">API 5L Gr. B (35,000 psi)</option>
                    <option value="42000">API 5L X42 (42,000 psi)</option>
                    <option value="52000">API 5L X52 (52,000 psi)</option>
                    <option value="60000">API 5L X60 (60,000 psi)</option>
                    <option value="65000">API 5L X65 (65,000 psi)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Presión Operación Actual (psi)</label>
                  <input
                    type="number"
                    value={calcPOper}
                    onChange={(e) => setCalcPOper(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 rounded-xl text-sm font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-900 text-white p-6 rounded-2xl flex flex-col justify-between space-y-6">
              <div>
                <span className="text-xs text-amber-400 font-mono font-bold uppercase block mb-1">
                  DICTAMEN TÉCNICO MEMORIA DE CÁLCULO
                </span>
                <h3 className="text-2xl font-black">
                  {b31gRes.passed ? '✅ APTO PARA CONTINUAR OPERACIÓN' : '❌ DESRATE O REPARACIÓN REQUERIDA'}
                </h3>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Presión Máxima Segura (P_safe):</span>
                  <span className="text-lg font-black text-emerald-400">{b31gRes.value} psi</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Presión de Operación (P_oper):</span>
                  <span className="font-bold">{calcPOper} psi</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Margen de Seguridad:</span>
                  <span className="font-bold text-amber-400">{b31gRes.margin}%</span>
                </div>

                {b31gRes.details && (
                  <div className="pt-2 text-[11px] text-slate-300 space-y-1 bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <p>Profundidad d/t: <strong>{b31gRes.details['Profundidad d/t']}</strong></p>
                    <p>Factor Folias (M): <strong>{b31gRes.details['Factor Folias (M)']}</strong></p>
                    <p>Presión de Falla Pf: <strong>{b31gRes.details['Presión Estimada de Falla (Pf)']}</strong></p>
                  </div>
                )}
              </div>

              <div className="space-y-1 text-xs text-slate-300 bg-slate-800/80 p-3 rounded-xl">
                {b31gRes.recommendations.map((rec, idx) => (
                  <p key={idx} className="leading-tight">• {rec}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CATÓDICA VS ILI (RECHARTS) */}
      {activeTab === 'cp' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 space-y-6">
          <div className="border-b border-gray-100 dark:border-slate-800 pb-3 flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Zap size={18} className="text-amber-500" />
                <span>Alineamiento de Protección Catódica (-mV) vs Pérdida de Metal ILI</span>
              </h2>
              <p className="text-xs text-gray-500">Evaluación de potencial tubo-suelo (Criterio NACE SP0169 ≤ -850 mV).</p>
            </div>
          </div>

          <div className="h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={cpSurveyData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="kp" label={{ value: 'Kilometraje KP (km)', position: 'insideBottom', offset: -5 }} />
                <YAxis domain={[-1200, -600]} label={{ value: 'Potencial CP (-mV)', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <ReferenceLine y={-850} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Límite NACE -850 mV', fill: '#ef4444', fontSize: 11 }} />
                <Line type="monotone" dataKey="potentialMv" stroke="#0B2239" strokeWidth={2.5} name="Potencial CP (-mV)" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* TAB 4: TANQUES API 653 (VIDA REMANENTE) */}
      {activeTab === 'api653' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 space-y-6">
          <div className="border-b border-gray-100 dark:border-slate-800 pb-4">
            <span className="text-xs font-mono font-bold text-indigo-600 uppercase">API 653 §4.4 / §6.4</span>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mt-1">Evaluación de Vida Remanente e Inspección de Tanques API 653</h2>
            <p className="text-xs text-gray-500 mt-1">
              Cálculo de velocidad de corrosión en fondo/pared de tanques y fecha de próxima inspección interna requerida.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-gray-700 dark:text-slate-300 uppercase">Datos del Tanque y Medición UT</h3>
              <div>
                <label className="block text-xs font-semibold mb-1">Identificación del Tanque Tag</label>
                <input
                  type="text"
                  value={tankTag}
                  onChange={(e) => setTankTag(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Espesor Original (mm)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={tankOriginalWT}
                    onChange={(e) => setTankOriginalWT(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 rounded-xl text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Espesor Actual UT (mm)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={tankCurrentWT}
                    onChange={(e) => setTankCurrentWT(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 rounded-xl text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Espesor Mínimo Admisible t_min (mm)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={tankMinWT}
                    onChange={(e) => setTankMinWT(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 rounded-xl text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Años en Servicio</label>
                  <input
                    type="number"
                    value={tankServiceYears}
                    onChange={(e) => setTankServiceYears(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 rounded-xl text-sm font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-900 text-white p-6 rounded-2xl space-y-6 flex flex-col justify-between">
              <div>
                <span className="text-xs text-amber-400 font-mono font-bold uppercase block mb-1">
                  DICTAMEN API 653 §6.4.2
                </span>
                <h3 className="text-2xl font-black">
                  Vida Remanente: {tankRemainingLifeYears.toFixed(1)} Años
                </h3>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Tasa de Corrosión Calculada:</span>
                  <span className="font-bold text-amber-400">{tankCorrosionRate.toFixed(3)} mm/año</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Próxima Inspección Interna Requerida:</span>
                  <span className="font-bold text-emerald-400">En {tankNextInspectionYears.toFixed(1)} Años</span>
                </div>
              </div>

              <div className="bg-slate-800 p-3 rounded-xl text-xs text-slate-300 leading-relaxed">
                Según API 653 §6.4.2, el intervalo de inspección interna no debe exceder la mitad de la vida remanente calculada o un máximo de 10 años.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: HISTÓRICO DE CORRIDAS ILI */}
      {activeTab === 'runs' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 space-y-6">
          <div className="flex justify-between items-center border-b border-gray-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Registro Histórico de Inspecciones con Herramientas Inteligentes (ILI)</h3>
            <span className="text-xs font-mono font-bold text-emerald-600">{iliRuns.length} Corridas Registradas</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {iliRuns.map((run) => (
              <div key={run.id} className="border border-gray-200 dark:border-slate-800 p-5 rounded-2xl bg-gray-50/50 dark:bg-slate-800/50 space-y-3">
                <div className="flex justify-between items-start border-b border-gray-200 dark:border-slate-700 pb-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-emerald-600">{run.id}</span>
                    <h4 className="text-sm font-black text-gray-900 dark:text-white">{run.lineTag}</h4>
                  </div>
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                    {run.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-gray-700 dark:text-slate-300">
                  <p><strong>Vendor:</strong> {run.vendor}</p>
                  <p><strong>Fecha Corrida:</strong> {run.runDate}</p>
                  <p><strong>Herramienta:</strong> {run.toolType}</p>
                  <p><strong>Longitud Línea:</strong> {run.totalLengthKm} km</p>
                  <p><strong>Total Anomalías:</strong> {run.totalAnomalies}</p>
                  <p><strong>Anomalías Críticas:</strong> <span className="text-red-600 font-bold">{run.criticalAnomalies}</span></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: DIG SHEETS DE CAMPO */}
      {activeTab === 'digsheets' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 space-y-6">
          <div className="flex justify-between items-center border-b border-gray-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Generador de Dig Sheets de Exhumación de Campo</h3>
              <p className="text-xs text-gray-500">Hoja de excavación y verificación directa de anomalías ILI en tubería.</p>
            </div>
            <button 
              onClick={() => window.print()}
              className="bg-[#0B2239] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer"
            >
              <Printer size={14} /> Imprimir Dig Sheet PDF
            </button>
          </div>

          {selectedAnomaly ? (
            <div className="max-w-3xl mx-auto border-2 border-gray-900 p-8 rounded-xl bg-white text-gray-900 space-y-6 shadow-xl">
              <div className="border-b-2 border-gray-900 pb-4 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-black uppercase">HOJA DE EXCAVACIÓN Y DIG SHEET NDT</h2>
                  <p className="text-xs font-bold text-gray-600">Verificación Directa de Campo — Inspección ILI</p>
                </div>
                <div className="text-right font-mono text-xs">
                  <p className="font-bold">DIG-{selectedAnomaly.id}</p>
                  <p className="text-gray-500">KP: {selectedAnomaly.kp} km</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                <div className="bg-gray-50 p-3 rounded border border-gray-300 space-y-1">
                  <p><strong>Coordenada Este:</strong> {selectedAnomaly.easting || 382104.88} m E</p>
                  <p><strong>Coordenada Norte:</strong> {selectedAnomaly.northing || 984231.42} m N</p>
                  <p><strong>Junta Referencia:</strong> {selectedAnomaly.upstreamWeldNo || 'JJ-0342'}</p>
                  <p><strong>Dist. a Junta:</strong> {selectedAnomaly.upstreamWeldDistMm || 1850} mm</p>
                </div>
                <div className="bg-gray-50 p-3 rounded border border-gray-300 space-y-1">
                  <p><strong>Orientación:</strong> {selectedAnomaly.clockPosition} o'clock</p>
                  <p><strong>Profundidad Pérdida:</strong> {selectedAnomaly.depthPercent}% WT</p>
                  <p><strong>Dimensiones L x W:</strong> {selectedAnomaly.lengthMm} x {selectedAnomaly.widthMm} mm</p>
                  <p><strong>Ubicación:</strong> {selectedAnomaly.internalExternal}</p>
                </div>
              </div>

              <div className="border border-gray-300 p-4 rounded text-xs space-y-2">
                <p className="font-bold uppercase text-gray-700">Protocolo de Exhumación y Preparación de Superficie:</p>
                <p>1. Excavación manual cuidadosa a 0.5m del lomo de la tubería para evitar daños mecánicos.</p>
                <p>2. Limpieza con chorro de arena (Abrasive Blasting) o cepillo motorizado según grado SSPC-SP 10.</p>
                <p>3. Verificación de profundidad con medidor de profundidades dial / Ultrasonido Phased Array.</p>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-gray-500">
              Selecciona una anomalía del visor para generar su Dig Sheet correspondiente.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
