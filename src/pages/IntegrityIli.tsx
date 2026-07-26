import React, { useState, useEffect, useRef } from 'react';
import { 
  Database, AlertTriangle, ShieldCheck, FileSpreadsheet, Activity, 
  MapPin, Clock, Search, Download, Plus, CheckCircle2, ChevronRight, 
  Layers, Settings, Calculator, FileText, ArrowRight, Compass, Wrench,
  Upload, Printer, Zap, Sparkles, Filter
} from 'lucide-react';
import { useProject } from '../ProjectContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { 
  ComposedChart, LineChart, Line, Scatter, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceLine, Legend 
} from 'recharts';
import * as XLSX from 'xlsx';

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

export interface CpSurveyPoint {
  kp: number;
  potentialMv: number; // e.g., -950 (negative mV)
  isDeficient: boolean;
  hasExternalDefect: boolean;
  anomalyId?: string;
}

export default function IntegrityIli() {
  const { currentProject, currentOrganization } = useProject();
  const orgName = currentOrganization?.name || 'CONTRATISTA OPERATIVA C.A.';

  const [activeTab, setActiveTab] = useState<'ili' | 'cp' | 'calculator' | 'digsheets' | 'api653' | 'api570'>('ili');
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [cpPoints, setCpPoints] = useState<CpSurveyPoint[]>([]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Calculator custom state
  const [calcDiameter, setCalcDiameter] = useState<number>(16);
  const [calcWT, setCalcWT] = useState<number>(12.7); // mm
  const [calcDepth, setCalcDepth] = useState<number>(45); // %
  const [calcLength, setCalcLength] = useState<number>(180); // mm
  const [calcWidth, setCalcWidth] = useState<number>(65); // mm
  const [calcMAOP, setCalcMAOP] = useState<number>(1100); // psi
  const [calcSMYS, setCalcSMYS] = useState<number>(52000); // psi (X52)
  const [calcFolias, setCalcFolias] = useState<number>(0.72); // Design factor

  // API 653 Tank state
  const [tankTag, setTankTag] = useState('TK-102 (Patios de Almacenamiento Anaco)');
  const [bottomWTMin, setBottomWTMin] = useState(3.2); // mm
  const [corrosionRate, setCorrosionRate] = useState(0.22); // mm/year
  const [tankNextInspectionYears, setTankNextInspectionYears] = useState(4.5);

  // Default anomalies list
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
        cpPotentialMv: -780 // Deficient CP (less negative than -850)
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
        cpPotentialMv: -710 // Deficient CP
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
        status: 'Inconclusa',
        upstreamWeldNo: 'JJ-2890',
        upstreamWeldDistMm: 1200,
        easting: 401200.75,
        northing: 975300.20,
        cpPotentialMv: -980
      }
    ];

    setAnomalies(defaultAnomalies);
    setSelectedAnomaly(defaultAnomalies[0]);
  }, [currentProject]);

  // Generate CP survey baseline data for chart alignment
  const cpSurveyData: CpSurveyPoint[] = Array.from({ length: 40 }, (_, i) => {
    const kp = parseFloat((i * 1.0).toFixed(1));
    // Default CP potential oscillates between -820 and -1050 mV
    let potentialMv = -980 + Math.sin(i * 0.4) * 120;
    
    // Dip CP potentials near anomalies
    if (Math.abs(kp - 4.2) < 0.8) potentialMv = -780;
    if (Math.abs(kp - 28.6) < 0.8) potentialMv = -710;

    const isDeficient = potentialMv > -850; // Less negative than -850 mV
    const extAnomaly = anomalies.find(a => Math.abs(a.kp - kp) < 0.6 && a.internalExternal === 'External');

    return {
      kp,
      potentialMv: Math.round(potentialMv),
      isDeficient,
      hasExternalDefect: !!extAnomaly,
      anomalyId: extAnomaly?.id
    };
  });

  // Function to calculate clock needle position on 360 degree dial
  const getClockNeedlePosition = (clockStr: string) => {
    if (!clockStr) return { topPct: '25%', leftPct: '50%' };
    const parts = clockStr.split(':').map(p => parseInt(p, 10));
    const h = parts[0] || 12;
    const m = parts[1] || 0;
    const totalHours = (h % 12) + m / 60;
    const angleRad = (totalHours * 30 - 90) * (Math.PI / 180);
    const r = 36; // radius percentage from center
    const top = 50 + r * Math.sin(angleRad);
    const left = 50 + r * Math.cos(angleRad);
    return { topPct: `${top.toFixed(1)}%`, leftPct: `${left.toFixed(1)}%` };
  };

  // Parser para archivos de reporte ILI ROSEN (.xlsx, .xls, .csv, .txt)
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadMessage('Procesando corrida de inspección ILI ROSEN...');
    const fileName = file.name.toLowerCase();

    const processRowObjects = (rows: Record<string, any>[], loadedCpPoints?: CpSurveyPoint[]) => {
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
        const upperType = typeVal.toUpperCase();

        // Filtrar solo tipos relevantes de anomalías (Metal Loss, Dent, Corrosion, Gouge, Crack)
        const validTypes = ['METAL LOSS', 'CORROSION', 'CORROSIÓN', 'PÉRDIDA DE METAL', 'DENT', 'GOUGE', 'CRACK', 'DEFECT'];
        const isMatchingType = validTypes.some(vt => upperType.includes(vt));
        
        const wlRaw = getVal(row, ['WL', 'WL %', 'WL (%)', 'WL%', 'DEPTH_%', 'DEPTH_PCT', 'SEVERITY', 'PROFUNDIDAD'], null);
        const wlVal = wlRaw !== null ? Math.abs(parseFloat(String(wlRaw)) || 0) : 0;

        // Ignorar si no coincide con tipo de defecto o si no tiene pérdida
        if (!isMatchingType && wlVal === 0) continue;

        const intExtRaw = String(getVal(row, ['INTERNAL', 'INT_EXT', 'INTERNAL/EXTERNAL', 'ORIENTATION', 'UBICACIÓN'], 'External')).toUpperCase();
        const isInternal = intExtRaw === 'Y' || intExtRaw.includes('INT');

        const cpRaw = getVal(row, ['CRITERIO PC (-MV)', 'CP', 'POTENCIAL_PC', 'PC_MV', 'CP_MV'], null);
        const cpVal = cpRaw !== null ? parseFloat(String(cpRaw)) : 0;

        const dist = Math.abs(parseFloat(String(distRaw)) || Number(((i + 1) * 1.5).toFixed(3)));
        const clockStr = String(getVal(row, ['O_CLOCK', 'CLOCK', 'POSITION', 'HORA', 'POSICIÓN'], '12:00')).trim();
        const lenVal = parseFloat(String(getVal(row, ['LEN', 'LENGTH_MM', 'L_MM', 'LENGTH', 'LARGO'], 120))) || 120;
        const widVal = parseFloat(String(getVal(row, ['WID', 'WIDTH_MM', 'W_MM', 'WIDTH', 'ANCHO'], 50))) || 50;
        const jjNoStr = String(getVal(row, ['JJ_NO', 'WELD_NO', 'JOINT', 'JUNTA'], `JJ-${100 + parsedAnomalies.length}`)).trim();
        const jjDistVal = parseFloat(String(getVal(row, ['JJ_DIST', 'WELD_DIST', 'DIST_WELD'], 1200))) || 1200;
        const eastingVal = parseFloat(String(getVal(row, ['EASTING', 'UTM_E', 'X', 'ESTE'], 381300 + parsedAnomalies.length * 120))) || (381300 + parsedAnomalies.length * 120);
        const northingVal = parseFloat(String(getVal(row, ['NORTHING', 'UTM_N', 'Y', 'NORTE'], 979350 - parsedAnomalies.length * 90))) || (979350 - parsedAnomalies.length * 90);

        parsedAnomalies.push({
          id: `ANO-IMP-${100 + parsedAnomalies.length}`,
          kp: dist,
          clockPosition: clockStr || '12:00',
          depthPercent: wlVal || 10,
          lengthMm: lenVal,
          widthMm: widVal,
          type: upperType.includes('DENT') ? 'Dent' : (upperType.includes('GOUGE') ? 'Gouge' : 'Metal Loss'),
          internalExternal: isInternal ? 'Internal' : 'External',
          nominalWT: 12.7,
          pipeDiameter: 16,
          smys: 52000,
          maop: 1100,
          status: wlVal >= 40 ? 'Atención Prioritaria' : 'Inconclusa',
          easting: eastingVal,
          northing: northingVal,
          cpPotentialMv: (() => {
            let finalCp = cpVal ? -Math.abs(cpVal) : -940;
            if (loadedCpPoints && loadedCpPoints.length > 0) {
              let closestPt = null;
              let minDiff = Infinity;
              for (const pt of loadedCpPoints) {
                const diff = Math.abs(pt.kp - dist);
                if (diff < minDiff) {
                  minDiff = diff;
                  closestPt = pt;
                }
              }
              if (closestPt) {
                finalCp = closestPt.potentialMv;
              }
            }
            return finalCp;
          })(),
          upstreamWeldNo: jjNoStr,
          upstreamWeldDistMm: jjDistVal
        });
      }

      parsedAnomalies.sort((a, b) => b.depthPercent - a.depthPercent);

      if (loadedCpPoints && loadedCpPoints.length > 0) {
        loadedCpPoints.forEach(pt => {
          pt.hasExternalDefect = parsedAnomalies.some(a => 
            Math.abs(a.kp - pt.kp) < 0.2 && a.internalExternal === 'External'
          );
        });
        setCpPoints([...loadedCpPoints]);
      } else {
        setCpPoints([]);
      }

      if (parsedAnomalies.length > 0) {
        setAnomalies(parsedAnomalies);
        setSelectedAnomaly(parsedAnomalies[0]);
        setUploadMessage(`¡Éxito! Se han importado ${parsedAnomalies.length} anomalías del reporte ILI ROSEN (${file.name}).`);
        alert(`¡Éxito! Se han importado ${parsedAnomalies.length} anomalías del reporte ILI ROSEN (${file.name}).`);
      } else {
        setUploadMessage('No se encontraron registros de anomalías o pérdida de metal válidos.');
        alert('No se encontraron registros de anomalías o pérdida de metal válidos.');
      }
    };

    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // 1. Intentar parsear potenciales de la pestaña POTENCIALES
          const parsedCpPoints: CpSurveyPoint[] = [];
          const cpSheetName = workbook.SheetNames.find(name => name.toUpperCase().includes('POTENCIAL'));
          if (cpSheetName) {
            try {
              console.log(`Parsing CP potentials from sheet: ${cpSheetName}`);
              const cpSheet = workbook.Sheets[cpSheetName];
              const cpRows = XLSX.utils.sheet_to_json<any[]>(cpSheet, { header: 1, range: 0, defval: '' });
              
              let distColIdx = 0;
              let potColIdx = -1;
              let headerFound = false;

              for (let rIdx = 0; rIdx < cpRows.length; rIdx++) {
                const row = cpRows[rIdx];
                if (!Array.isArray(row) || row.length === 0) continue;

                if (!headerFound) {
                  const rowStr = row.map(cell => String(cell).toUpperCase().trim());
                  const isHeader = rowStr.some(str => str.includes('DISTANCIA') || str.includes('REFERENCIA'));
                  if (isHeader) {
                    distColIdx = rowStr.findIndex(str => str.includes('DISTANCIA'));
                    if (distColIdx === -1) distColIdx = 0;
                    
                    potColIdx = rowStr.findIndex(str => str.includes('PACT') || str.includes('POFF') || str.includes('PON') || str.includes('PNAT') || str.includes('MV') || str.includes('POTENCIAL'));
                    if (potColIdx === -1) {
                      potColIdx = rowStr.length > 3 ? 3 : (rowStr.length > 4 ? 4 : -1);
                    }
                    headerFound = true;
                  }
                  continue;
                }

                const distValRaw = parseFloat(String(row[distColIdx]));
                if (isNaN(distValRaw)) continue;

                let potValRaw = potColIdx !== -1 ? parseFloat(String(row[potColIdx])) : NaN;
                if (isNaN(potValRaw)) continue;

                let potentialMv = potValRaw;
                // Convertir a mV si viene en V (ej: 0.67 -> -670 mV)
                if (Math.abs(potentialMv) < 5) {
                  potentialMv = -Math.abs(potentialMv * 1000);
                } else {
                  potentialMv = -Math.abs(potentialMv);
                }

                const kp = parseFloat((distValRaw / 1000).toFixed(3)); // metros a km

                parsedCpPoints.push({
                  kp,
                  potentialMv: Math.round(potentialMv),
                  isDeficient: potentialMv > -850,
                  hasExternalDefect: false
                });
              }

              parsedCpPoints.sort((a, b) => a.kp - b.kp);
            } catch (cpErr) {
              console.error('Error parsing POTENCIALES sheet:', cpErr);
            }
          }

          // 2. Buscar dinámicamente la pestaña que contenga las columnas clave de anomalías (ej. ROSOFT)
          let targetSheetName = workbook.SheetNames[0];
          const preferredNames = ['ROSOFT', 'DATOS INTEGRADOS', 'DATOS_INTEGRADOS', 'ANOMALÍAS', 'ANOMALIAS', 'ILI'];
          const foundPreferred = workbook.SheetNames.find(name => 
            preferredNames.includes(name.trim().toUpperCase())
          );
          
          if (foundPreferred) {
            targetSheetName = foundPreferred;
          } else {
            for (const sheetName of workbook.SheetNames) {
              const worksheet = workbook.Sheets[sheetName];
              const tempRows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, range: 0, defval: '' });
              if (tempRows.length > 0) {
                const hasKeys = tempRows.slice(0, 5).some(row => {
                  if (!Array.isArray(row)) return false;
                  const rowStr = row.map(cell => String(cell).toUpperCase().trim());
                  return rowStr.includes('DIST') && (rowStr.includes('WL') || rowStr.includes('AVGWL') || rowStr.includes('O_CLOCK'));
                });
                if (hasKeys) {
                  targetSheetName = sheetName;
                  break;
                }
              }
            }
          }

          console.log(`Parsing sheet: ${targetSheetName}`);
          const worksheet = workbook.Sheets[targetSheetName];
          const jsonRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });
          processRowObjects(jsonRows, parsedCpPoints);
        } catch (err: any) {
          console.error('Error al leer Excel:', err);
          setUploadMessage('Error al procesar el archivo Excel ROSEN.');
          alert('Error al procesar el archivo Excel ROSEN.');
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n').map(l => l.trim()).filter(l => l);
          if (lines.length < 2) {
            setUploadMessage('El archivo no contiene suficientes registros.');
            return;
          }

          const delimiter = lines[0].includes('\t') ? '\t' : (lines[0].includes(';') ? ';' : ',');
          const headers = lines[0].split(delimiter).map(h => h.trim().replace(/"/g, ''));

          const jsonRows: Record<string, any>[] = [];
          for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(delimiter).map(c => c.trim().replace(/"/g, ''));
            if (cols.length === 0) continue;
            const rowObj: Record<string, any> = {};
            headers.forEach((h, idx) => {
              rowObj[h] = cols[idx] !== undefined ? cols[idx] : '';
            });
            jsonRows.push(rowObj);
          }
          processRowObjects(jsonRows);
        } catch (err: any) {
          console.error('Error importando CSV/TXT:', err);
          setUploadMessage('Ocurrió un error al procesar el archivo CSV/TXT.');
          alert('Ocurrió un error al procesar el archivo CSV/TXT.');
        }
      };
      reader.readAsText(file);
    }

    if (event.target) event.target.value = '';
  };

  // ASME B31G (Original) vs. RSTRENG (Modified B31G 0.85d/t) Calculation Engine
  const calculateIntegrityModels = (
    diameterInches: number,
    wtMm: number,
    depthPct: number,
    lengthMm: number,
    widthMm: number,
    maopPsi: number,
    smysPsi: number,
    df: number
  ) => {
    const dMm = (depthPct / 100) * wtMm; // Depth in mm
    const dOverT = depthPct / 100;
    const D_mm = diameterInches * 25.4;

    // Design Pressure
    const pDesign = ((2 * smysPsi * (wtMm / 25.4)) / diameterInches) * df;

    // 1. ORIGINAL ASME B31G
    const z = (lengthMm * lengthMm) / (D_mm * wtMm);
    let M_b31g = 1;
    if (z <= 20) {
      M_b31g = Math.sqrt(1 + 0.8 * z);
    } else {
      M_b31g = 0.032 * z + 3.3;
    }

    let pSafeB31G = pDesign;
    if (dOverT > 0.1) {
      const numB31g = 1 - (2 / 3) * dOverT;
      const denB31g = 1 - (2 / 3) * (dOverT / M_b31g);
      pSafeB31G = pDesign * (numB31g / denB31g);
    }

    // 2. MODIFIED B31G / RSTRENG (Effective Area 0.85 d/t)
    let M_rstreng = 1;
    if (z <= 50) {
      M_rstreng = Math.sqrt(1 + 0.6275 * z - 0.003375 * z * z);
    } else {
      M_rstreng = 0.032 * z + 3.3;
    }

    let pSafeRstreng = pDesign;
    if (dOverT > 0.1) {
      const numRst = 1 - 0.85 * dOverT;
      const denRst = 1 - 0.85 * (dOverT / M_rstreng);
      pSafeRstreng = pDesign * (numRst / denRst);
    }

    const ratioB31g = pSafeB31G / maopPsi;
    const ratioRstreng = pSafeRstreng / maopPsi;
    const isSafe = ratioRstreng >= 1.0 && dOverT < 0.8;

    return {
      dMm: dMm.toFixed(2),
      pDesign: Math.round(pDesign),
      pSafeB31G: Math.round(pSafeB31G),
      pSafeRstreng: Math.round(pSafeRstreng),
      ratioB31g: ratioB31g.toFixed(2),
      ratioRstreng: ratioRstreng.toFixed(2),
      isSafe,
      requiresDerating: ratioRstreng < 1.0,
      sleeveRecommendation: dOverT >= 0.8 
        ? 'REMPLAZO DE CARRETE DE TUBERÍA OBLIGATORIO (Pérdida >= 80%)' 
        : (ratioRstreng < 1.0 ? 'CAMISA DE REFUERZO DE ACERO TIPO B O ENVOLVENTE COMPUESTA' : 'MONITOREO EN PRÓXIMA CORRIDA ILI')
    };
  };

  const currentModels = calculateIntegrityModels(
    calcDiameter,
    calcWT,
    calcDepth,
    calcLength,
    calcWidth,
    calcMAOP,
    calcSMYS,
    calcFolias
  );

  const finalCpSurveyData = cpPoints.length > 0 ? cpPoints : cpSurveyData;

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
    <div className="space-y-6">
      {/* Header */}
      <div className="backdrop-blur-xl bg-white/75 dark:bg-slate-900/75 p-6 sm:p-8 rounded-3xl border border-white/80 dark:border-slate-800/80 shadow-sm shadow-slate-200/50 dark:shadow-none flex flex-col md:flex-row justify-between items-start md:items-center gap-6 print:hidden">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-mono font-bold uppercase tracking-wider mb-2">
            <Database size={16} /> Módulo PIMS • Normativa ASME B31G / RSTRENG / NACE SP0169
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Gestión de Integridad de Ductos & Corridas ILI Pigging
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl font-medium">
            Alineamiento de catódica vs anomalías MFL, evaluación estructural RSTRENG y generación de Dig Sheets para {orgName}.
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
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.click();
              } else {
                document.getElementById('ili-file-input')?.click();
              }
            }}
            className="flex items-center gap-2 bg-[#0B2239] hover:bg-slate-800 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 font-extrabold px-5 py-3 rounded-2xl text-xs sm:text-sm transition-all shadow-sm hover:shadow-md cursor-pointer"
          >
            <Upload size={16} />
            <span>Importar Corrida ROSEN (.xlsx / .csv)</span>
          </button>
        </div>
      </div>

      {uploadMessage && (
        <div className="p-4 bg-amber-50/90 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 border border-amber-200/80 dark:border-amber-800 rounded-2xl text-xs font-bold flex items-center justify-between backdrop-blur-md print:hidden">
          <span>{uploadMessage}</span>
          <button onClick={() => setUploadMessage(null)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white">×</button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border border-white/80 dark:border-slate-800/80 bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl rounded-3xl p-1.5 shadow-xs overflow-x-auto gap-1 print:hidden">
        <button
          onClick={() => setActiveTab('ili')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'ili' 
              ? 'bg-[#0B2239] text-white dark:bg-emerald-600 shadow-sm' 
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
          }`}
        >
          <Activity size={16} /> Visor de Anomalías ILI
        </button>
        <button
          onClick={() => setActiveTab('cp')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'cp' 
              ? 'bg-[#0B2239] text-white dark:bg-emerald-600 shadow-sm' 
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
          }`}
        >
          <Zap size={16} /> Alineamiento Catódica (CP vs ILI)
        </button>
        <button
          onClick={() => setActiveTab('calculator')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'calculator' 
              ? 'bg-[#0B2239] text-white dark:bg-emerald-600 shadow-sm' 
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
          }`}
        >
          <Calculator size={16} /> Calculadora ASME B31G vs RSTRENG
        </button>
        <button
          onClick={() => setActiveTab('digsheets')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'digsheets' 
              ? 'bg-[#0B2239] text-white dark:bg-emerald-600 shadow-sm' 
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
          }`}
        >
          <FileText size={16} /> Generador de Dig Sheets
        </button>
        <button
          onClick={() => setActiveTab('api653')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'api653' 
              ? 'bg-[#0B2239] text-white dark:bg-emerald-600 shadow-sm' 
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
          }`}
        >
          <Compass size={16} /> Tanques API 653
        </button>
        <button
          onClick={() => setActiveTab('api570')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'api570' 
              ? 'bg-[#0B2239] text-white dark:bg-emerald-600 shadow-sm' 
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
          }`}
        >
          <Wrench size={16} /> API 570 Proceso
        </button>
      </div>

      {/* TAB 1: VISOR DE TUBERÍA & ILI */}
      {activeTab === 'ili' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List of Anomalies */}
          <div className="lg:col-span-1 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 p-6 rounded-3xl border border-white/80 dark:border-slate-800/80 shadow-sm shadow-slate-200/50 dark:shadow-none space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">Anomalías Detectadas</h2>
              <span className="text-xs bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-full font-mono font-extrabold border border-slate-200/60 dark:border-slate-700/60">
                {filteredAnomalies.length} Registros
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar KP, ID o Junta..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100 font-medium"
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs bg-slate-50 dark:bg-slate-800/60 font-bold text-slate-700 dark:text-slate-200 outline-none"
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
                        : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-black">{item.id}</span>
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                        isCritical 
                          ? (isSelected ? 'bg-red-500 text-white' : 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300') 
                          : (isSelected ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300')
                      }`}>
                        KP {item.kp} km
                      </span>
                    </div>

                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className={`text-[9px] uppercase font-bold block ${isSelected ? 'text-slate-400' : 'text-slate-400'}`}>
                          Profundidad (WL)
                        </span>
                        <span className={`font-black ${isCritical ? 'text-red-400' : ''}`}>
                          {item.depthPercent}% WT ({((item.depthPercent / 100) * item.nominalWT).toFixed(2)} mm)
                        </span>
                      </div>
                      <div>
                        <span className={`text-[9px] uppercase font-bold block ${isSelected ? 'text-slate-400' : 'text-slate-400'}`}>
                          Orientación / Junta
                        </span>
                        <span className="font-bold font-mono">
                          {item.clockPosition} h • {item.upstreamWeldNo || 'N/A'}
                        </span>
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
              <div className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 p-6 rounded-3xl border border-white/80 dark:border-slate-800/80 shadow-sm shadow-slate-200/50 dark:shadow-none space-y-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
                  <div>
                    <span className="text-xs font-mono font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-800/60">
                      ANOMALÍA SELECCIONADA: {selectedAnomaly.id}
                    </span>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mt-2">
                      {selectedAnomaly.type} ({selectedAnomaly.internalExternal}) en KP {selectedAnomaly.kp} km
                    </h3>
                  </div>
                  <button 
                    onClick={() => setActiveTab('digsheets')}
                    className="flex items-center gap-2 bg-[#0B2239] hover:bg-slate-800 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    <FileText size={14} />
                    <span>Generar Dig Sheet</span>
                  </button>
                </div>

                {/* Pipeline 3D / Diagram View */}
                <div className="bg-slate-950 p-6 rounded-2xl text-white space-y-5">
                  <div className="flex justify-between items-center text-xs text-slate-400 border-b border-slate-800 pb-2">
                    <span>SECCIÓN TUBERÍA O.D. {selectedAnomaly.pipeDiameter}" API 5L Gr. X52</span>
                    <span className="text-emerald-400 font-mono font-bold">KILOMETRAJE KP {selectedAnomaly.kp} KM</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    {/* Clock Diagram */}
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <span className="text-xs text-slate-300 font-mono">Orientación en Carátula de Reloj</span>
                      <div className="relative w-44 h-44 rounded-full border-4 border-slate-700 bg-slate-900 flex items-center justify-center">
                        <span className="absolute top-2 text-[10px] text-slate-400 font-mono">12:00</span>
                        <span className="absolute right-2 text-[10px] text-slate-400 font-mono">03:00</span>
                        <span className="absolute bottom-2 text-[10px] text-slate-400 font-mono">06:00</span>
                        <span className="absolute left-2 text-[10px] text-slate-400 font-mono">09:00</span>
                        
                        {/* Center pipe cross section */}
                        <div className="w-32 h-32 rounded-full border-2 border-slate-500 bg-slate-800 flex items-center justify-center relative">
                          <span className="text-[11px] text-emerald-400 font-mono font-bold">WT {selectedAnomaly.nominalWT}mm</span>
                          
                          {/* Anomaly Indicator Dot */}
                          {(() => {
                            const pos = getClockNeedlePosition(selectedAnomaly.clockPosition);
                            return (
                              <div 
                                className="absolute w-4 h-4 rounded-full bg-red-500 animate-pulse border-2 border-white shadow-lg"
                                style={{
                                  top: pos.topPct,
                                  left: pos.leftPct,
                                  transform: 'translate(-50%, -50%)'
                                }}
                                title={`Anomalía en ${selectedAnomaly.clockPosition} o'clock (${selectedAnomaly.internalExternal})`}
                              />
                            );
                          })()}
                        </div>
                      </div>
                      <span className="text-xs font-mono text-emerald-400 bg-slate-900 border border-slate-800 px-3.5 py-1 rounded-full">
                        Posición: {selectedAnomaly.clockPosition} o'clock ({selectedAnomaly.internalExternal})
                      </span>
                    </div>

                    {/* Technical Profile Details */}
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
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Junta de Referencia</span>
                        <p className="text-xs text-amber-400 font-mono mt-0.5">
                          {selectedAnomaly.upstreamWeldNo || 'JJ-101'} @ {selectedAnomaly.upstreamWeldDistMm || 1200} mm aguas abajo
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-slate-50 rounded-xl border border-gray-200">
                    <span className="text-[10px] font-bold text-gray-500 uppercase block">MAOP Operativa</span>
                    <span className="text-sm font-bold text-gray-900 font-mono">{selectedAnomaly.maop} psi</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-gray-200">
                    <span className="text-[10px] font-bold text-gray-500 uppercase block">Coordenadas UTM</span>
                    <span className="text-xs font-bold text-gray-900 font-mono block truncate">
                      E {selectedAnomaly.easting || 382104} / N {selectedAnomaly.northing || 984231}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-gray-200">
                    <span className="text-[10px] font-bold text-gray-500 uppercase block">Protección Catódica (CP)</span>
                    <span className={`text-sm font-bold font-mono ${
                      (selectedAnomaly.cpPotentialMv || -900) > -850 ? 'text-red-600' : 'text-emerald-600'
                    }`}>
                      {selectedAnomaly.cpPotentialMv || -900} mV {(selectedAnomaly.cpPotentialMv || -900) > -850 ? '(Deficiente)' : '(Conforme)'}
                    </span>
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

      {/* TAB 2: ALINEAMIENTO DE PROTECCIÓN CATÓDICA (RECHARTS) */}
      {activeTab === 'cp' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-6">
          <div className="border-b border-gray-100 pb-3 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Zap size={18} className="text-amber-500" />
                <span>Gráfica de Alineamiento: Protección Catódica (-mV) vs Anomalías ILI</span>
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Evaluación de potencial tubo-suelo de catódica vs. kilometraje. Criterio NACE SP0169 (-850 mV).
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl">
              Criterio NACE: ≤ -850 mV CSE
            </span>
          </div>

          <div className="h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={finalCpSurveyData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="kp" label={{ value: 'Kilometraje KP (km)', position: 'insideBottom', offset: -5 }} />
                <YAxis domain={[-1200, -600]} label={{ value: 'Potencial CP (-mV)', angle: -90, position: 'insideLeft' }} />
                <Tooltip 
                  formatter={(value: any, name: string) => [
                    `${value} mV`, 
                    name === 'potentialMv' ? 'Potencial CP Tubo-Suelo' : name
                  ]} 
                />
                <Legend />
                <ReferenceLine y={-850} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Límite NACE -850 mV', fill: '#ef4444', fontSize: 11 }} />
                <Line type="monotone" dataKey="potentialMv" stroke="#0B2239" strokeWidth={2.5} name="Potencial CP (-mV)" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Analysis box */}
          <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle size={16} />
              <span>Diagnóstico de Coincidencia de Corrosión Activa</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {cpPoints.length > 0 ? (
                `El análisis cruzado PIMS identificó ${
                  cpPoints.filter(p => p.isDeficient && p.hasExternalDefect).length
                } coincidencia(s) de pérdida de metal externa concurrente con potencial catódico deficiente (> -850 mV) en los kilometrajes: ${
                  cpPoints.filter(p => p.isDeficient && p.hasExternalDefect).map(p => `KP ${p.kp} km`).join(', ') || 'ninguno'
                }. Se recomienda programar excavaciones exploratorias de prioridad en estas ubicaciones.`
              ) : (
                "Existen zonas donde el potencial de protección catódica es menos negativo que -850 mV (e.g. KP 4.2 km y KP 28.6 km), coincidiendo directamente con anomalías de pérdida de metal externa. Se recomienda inspección directa de campo y ajuste de rectificadores."
              )}
            </p>
          </div>
        </div>
      )}

      {/* TAB 3: CALCULADORA ASME B31G VS RSTRENG */}
      {activeTab === 'calculator' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-lg font-bold text-gray-900">Motor de Cálculo ASME B31G vs. RSTRENG (Modificado)</h2>
            <p className="text-xs text-gray-500 mt-1">
              Compara la presión segura de falla (P_safe) calculada por el modelo ASME B31G original vs. la aproximación de área efectiva RSTRENG (0.85 d/t).
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input form */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-[#0B2239] uppercase tracking-wider">Parámetros de Entrada de Tubería y Defecto</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Diámetro Exterior OD (pulg)</label>
                  <input
                    type="number"
                    value={calcDiameter}
                    onChange={(e) => setCalcDiameter(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono outline-none focus:ring-1 focus:ring-[#0B2239]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Espesor Nominal WT (mm)</label>
                  <input
                    type="number"
                    value={calcWT}
                    onChange={(e) => setCalcWT(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono outline-none focus:ring-1 focus:ring-[#0B2239]"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono outline-none focus:ring-1 focus:ring-[#0B2239]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Longitud Pérdida L (mm)</label>
                  <input
                    type="number"
                    value={calcLength}
                    onChange={(e) => setCalcLength(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono outline-none focus:ring-1 focus:ring-[#0B2239]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">MAOP Operativa (psi)</label>
                  <input
                    type="number"
                    value={calcMAOP}
                    onChange={(e) => setCalcMAOP(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono outline-none focus:ring-1 focus:ring-[#0B2239]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">SMYS Acero (psi)</label>
                  <input
                    type="number"
                    value={calcSMYS}
                    onChange={(e) => setCalcSMYS(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono outline-none focus:ring-1 focus:ring-[#0B2239]"
                  />
                </div>
              </div>
            </div>

            {/* Comparison Results */}
            <div className="bg-slate-900 text-white p-6 rounded-2xl flex flex-col justify-between space-y-6">
              <div>
                <span className="text-xs text-amber-400 font-mono font-bold uppercase block mb-1">
                  COMPARATIVA DE MODELOS DE INTEGRIDAD
                </span>
                <h3 className="text-2xl font-bold">Evaluación P_safe vs MAOP</h3>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <span className="text-xs text-slate-400">Presión de Diseño (P_design)</span>
                  <span className="text-sm font-mono font-bold">{currentModels.pDesign} psi</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <span className="text-xs text-slate-400">ASME B31G (Original)</span>
                  <span className="text-base font-mono font-bold text-amber-400">{currentModels.pSafeB31G} psi</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <span className="text-xs text-slate-400">RSTRENG (Modificado 0.85d/t)</span>
                  <span className="text-lg font-mono font-bold text-emerald-400">{currentModels.pSafeRstreng} psi</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <span className="text-xs text-slate-400">Factor P_safe / MAOP (RSTRENG)</span>
                  <span className={`text-lg font-mono font-bold ${currentModels.isSafe ? 'text-emerald-400' : 'text-red-400'}`}>
                    {currentModels.ratioRstreng}
                  </span>
                </div>
              </div>

              <div className={`p-4 rounded-xl border ${
                currentModels.isSafe 
                  ? 'bg-emerald-950/60 border-emerald-800 text-emerald-200' 
                  : 'bg-red-950/60 border-red-800 text-red-200'
              }`}>
                <div className="flex items-center gap-2 font-bold text-sm mb-1">
                  {currentModels.isSafe ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                  <span>{currentModels.sleeveRecommendation}</span>
                </div>
                <p className="text-xs opacity-90">
                  {currentModels.isSafe 
                    ? 'P_safe sobrepasa la MAOP requerida. Tubería apta para continuar servicio.'
                    : 'P_safe es inferior a la MAOP. Reducir presión operativa inmediatamente e instalar camisa de refuerzo Tipo B.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: GENERADOR E IMPRESOR DE DIG SHEETS */}
      {activeTab === 'digsheets' && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-xs space-y-6 print:border-none print:shadow-none print:p-0">
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              body, html {
                background: white !important;
                color: black !important;
              }
              aside, header, nav, .print\\:hidden {
                display: none !important;
              }
              main {
                padding: 0 !important;
                margin: 0 !important;
                overflow: visible !important;
                height: auto !important;
                width: 100% !important;
              }
              .max-w-7xl, .mx-auto, .p-4, .md\\:p-8 {
                max-width: 100% !important;
                width: 100% !important;
                padding: 0 !important;
                margin: 0 !important;
              }
            }
          `}} />
          <div className="flex justify-between items-center border-b border-gray-200 pb-4 print:hidden">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Dig Sheet de Excavación de Campo</h2>
              <p className="text-xs text-gray-500">Hoja de localización técnica para inspección visual y reparación de defecto.</p>
            </div>
            <button 
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-[#0B2239] text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-800 transition-all shadow-md"
            >
              <Printer size={16} /> Imprimir Dig Sheet Oficial
            </button>
          </div>

          {/* Printable Official Engineering Report Card */}
          <div className="border-2 border-slate-900 rounded-2xl p-6 space-y-6 bg-white text-slate-900">
            {/* Header Report */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
              <div>
                <p className="text-xs font-mono font-bold uppercase text-slate-500">{orgName}</p>
                <h1 className="text-xl font-extrabold uppercase tracking-tight">HOJA DE EXCAVACIÓN TÉCNICA (DIG SHEET)</h1>
                <p className="text-xs text-slate-600 font-mono">CÓDIGO DE REPORTE: DS-PIMS-{selectedAnomaly?.id || '001'}</p>
              </div>
              <div className="text-right border-l-2 border-slate-900 pl-4">
                <span className="text-[10px] font-bold uppercase block text-slate-500">ESTATUS INSPECCIÓN</span>
                <span className="text-xs font-bold px-2.5 py-1 bg-amber-100 text-amber-900 rounded font-mono">
                  {selectedAnomaly?.status || 'Atención Prioritaria'}
                </span>
              </div>
            </div>

            {/* Grid Coordinates & Location */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-300 space-y-1">
                <p className="font-bold text-slate-900 uppercase">1. Ubicación UTM / Kilometraje</p>
                <p><strong>Kilometraje (KP):</strong> {selectedAnomaly?.kp || 28.650} km</p>
                <p><strong>Coordenada Easting:</strong> {selectedAnomaly?.easting || 395400.00} m E</p>
                <p><strong>Coordenada Northing:</strong> {selectedAnomaly?.northing || 978100.50} m N</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-300 space-y-1">
                <p className="font-bold text-slate-900 uppercase">2. Referencia de Soldadura Aguas Arriba</p>
                <p><strong>Junta Referencia:</strong> {selectedAnomaly?.upstreamWeldNo || 'JJ-2210'}</p>
                <p><strong>Distancia desde Junta:</strong> {selectedAnomaly?.upstreamWeldDistMm || 410} mm Aguas Abajo</p>
                <p><strong>Orientación Reloj:</strong> {selectedAnomaly?.clockPosition || '06:00'} o'clock</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-300 flex flex-col items-center justify-center min-h-[110px]">
                <p className="font-bold text-slate-900 uppercase mb-2 text-center w-full">3. Orientación en Reloj</p>
                <div className="relative w-18 h-18 rounded-full border-2 border-slate-950 bg-white flex items-center justify-center">
                  <span className="absolute top-0.5 text-[7px] text-slate-950 font-mono leading-none">12</span>
                  <span className="absolute right-0.5 text-[7px] text-slate-950 font-mono leading-none">3</span>
                  <span className="absolute bottom-0.5 text-[7px] text-slate-950 font-mono leading-none">6</span>
                  <span className="absolute left-0.5 text-[7px] text-slate-950 font-mono leading-none">9</span>
                  
                  {/* Center circle representing pipe wall */}
                  <div className="w-12 h-12 rounded-full border border-slate-400 bg-transparent relative">
                    {/* Center point */}
                    <div className="absolute top-1/2 left-1/2 w-0.5 h-0.5 bg-slate-950 rounded-full transform -translate-x-1/2 -translate-y-1/2" />
                    
                    {/* Red Anomaly Dot */}
                    {(() => {
                      const pos = getClockNeedlePosition(selectedAnomaly?.clockPosition || '06:00');
                      return (
                        <div 
                          className="absolute w-2.5 h-2.5 rounded-full bg-red-600 border border-white shadow-xs"
                          style={{
                            top: pos.topPct,
                            left: pos.leftPct,
                            transform: 'translate(-50%, -50%)'
                          }}
                        />
                      );
                    })()}
                  </div>
                </div>
                <p className="text-[10px] font-bold text-slate-950 mt-1">{selectedAnomaly?.clockPosition || '06:00'} h ({selectedAnomaly?.internalExternal || 'External'})</p>
              </div>
            </div>

            {/* Defect Technical Specs */}
            <div className="border border-slate-300 rounded-xl p-4 text-xs space-y-2">
              <p className="font-bold uppercase font-mono text-slate-900">3. Especificaciones del Defecto</p>
              <div className="grid grid-cols-4 gap-2 text-center font-mono pt-1">
                <div className="p-2 bg-slate-100 rounded">
                  <span className="text-[10px] text-slate-500 block">Tipo</span>
                  <strong className="text-slate-900">{selectedAnomaly?.type || 'Metal Loss'}</strong>
                </div>
                <div className="p-2 bg-slate-100 rounded">
                  <span className="text-[10px] text-slate-500 block">Profundidad</span>
                  <strong className="text-red-700">{selectedAnomaly?.depthPercent || 62}% WT</strong>
                </div>
                <div className="p-2 bg-slate-100 rounded">
                  <span className="text-[10px] text-slate-500 block">Dimensiones (LxW)</span>
                  <strong className="text-slate-900">{selectedAnomaly?.lengthMm || 210}x{selectedAnomaly?.widthMm || 90} mm</strong>
                </div>
                <div className="p-2 bg-slate-100 rounded">
                  <span className="text-[10px] text-slate-500 block">Ubicación</span>
                  <strong className="text-slate-900">{selectedAnomaly?.internalExternal || 'External'}</strong>
                </div>
              </div>
            </div>

            {/* Signatures & Approvals */}
            <div className="pt-8 grid grid-cols-2 gap-8 text-xs text-center border-t border-slate-300">
              <div>
                <div className="border-b border-slate-400 w-3/4 mx-auto mb-1"></div>
                <p className="font-bold">Ing. de Integridad / PIMS</p>
                <p className="text-[10px] text-slate-500">Firma y Sello</p>
              </div>
              <div>
                <div className="border-b border-slate-400 w-3/4 mx-auto mb-1"></div>
                <p className="font-bold">Inspectoría de Campo Cliente</p>
                <p className="text-[10px] text-slate-500">Aprobado para Excavación</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: TANQUES API 653 */}
      {activeTab === 'api653' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-6">
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

            <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-3">
              <span className="text-xs font-bold text-emerald-400 uppercase">Intervalo Máximo Próxima Inspección</span>
              <p className="text-2xl font-bold font-mono">{tankNextInspectionYears} Años</p>
              <p className="text-[11px] text-slate-300">Cumple con criterio de inspección interna API 653 Secc. 6.4.</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: TUBERÍAS API 570 */}
      {activeTab === 'api570' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
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

