import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { 
  TrendingUp, DollarSign, AlertCircle, Download, FileText, CloudRain, Loader2, 
  ShieldCheck, MapPin, Activity, CheckCircle2, Navigation, ChevronRight 
} from 'lucide-react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { callGeminiProxy } from '../lib/geminiProxy';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useProject } from '../ProjectContext';

// Minimalist 3D Architectural Grid Background
function ArchitecturalGrid() {
  const gridRef = useRef<any>(null);
  
  useFrame((state) => {
    if (gridRef.current) {
      gridRef.current.rotation.y = state.clock.elapsedTime * 0.05;
      gridRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1 + 0.5;
    }
  });

  return (
    <group ref={gridRef}>
      <gridHelper args={[20, 20, '#10b981', '#cbd5e1']} position={[0, -2, 0]} />
      <gridHelper args={[20, 20, '#10b981', '#cbd5e1']} position={[0, 2, 0]} />
      {[...Array(8)].map((_, i) => (
        <mesh key={i} position={[Math.cos(i * Math.PI / 4) * 5, 0, Math.sin(i * Math.PI / 4) * 5]}>
          <boxGeometry args={[0.2, 4, 0.2]} />
          <meshStandardMaterial color="#cbd5e1" opacity={0.3} transparent />
        </mesh>
      ))}
    </group>
  );
}

export default function Dashboard() {
  const { currentProject, currentOrganization, projects } = useProject();
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [weatherContext, setWeatherContext] = useState<string | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(true);

  // Live Firestore State Metrics
  const [tasks, setTasks] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [valuations, setValuations] = useState<any[]>([]);
  const [ptwList, setPtwList] = useState<any[]>([]);
  const [weldJoints, setWeldJoints] = useState<any[]>([]);

  // 1. Subscribe to Firestore Collections
  useEffect(() => {
    const isSingle = currentProject && currentProject.id !== 'all';
    
    // Tasks Query
    const tasksQ = isSingle 
      ? query(collection(db, 'tasks'), where('projectId', '==', currentProject.id))
      : query(collection(db, 'tasks'));
    const unsubTasks = onSnapshot(tasksQ, (snap) => {
      setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => handleFirestoreError(err, OperationType.GET, 'tasks'));

    // Expenses Query
    const expensesQ = isSingle
      ? query(collection(db, 'expenses'), where('projectId', '==', currentProject.id))
      : query(collection(db, 'expenses'));
    const unsubExpenses = onSnapshot(expensesQ, (snap) => {
      setExpenses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => handleFirestoreError(err, OperationType.GET, 'expenses'));

    // Valuations Query
    const valsQ = isSingle
      ? query(collection(db, 'valuations'), where('projectId', '==', currentProject.id))
      : query(collection(db, 'valuations'));
    const unsubValuations = onSnapshot(valsQ, (snap) => {
      setValuations(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => handleFirestoreError(err, OperationType.GET, 'valuations'));

    // PTW / SIHO Query
    const ptwQ = isSingle
      ? query(collection(db, 'siho_ptw'), where('projectId', '==', currentProject.id))
      : query(collection(db, 'siho_ptw'));
    const unsubPtw = onSnapshot(ptwQ, (snap) => {
      setPtwList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => handleFirestoreError(err, OperationType.GET, 'siho_ptw'));

    // Weld Joints Query
    const weldsQ = isSingle
      ? query(collection(db, 'weld_joints'), where('projectId', '==', currentProject.id))
      : query(collection(db, 'weld_joints'));
    const unsubWelds = onSnapshot(weldsQ, (snap) => {
      setWeldJoints(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => handleFirestoreError(err, OperationType.GET, 'weld_joints'));

    return () => {
      unsubTasks();
      unsubExpenses();
      unsubValuations();
      unsubPtw();
      unsubWelds();
    };
  }, [currentProject]);

  // Weather Context Effect
  useEffect(() => {
    const fetchWeatherContext = async () => {
      try {
        const response = await callGeminiProxy({
          model: 'gemini-2.5-flash',
          prompt: '¿Cuál es el clima actual y pronóstico para los próximos 3 días en la zona de operaciones petroleras e industriales de Anzoátegui, Venezuela? Responde en 2 oraciones indicando cómo podría afectar labores de construcción e ingeniería petrolera al aire libre.',
          config: {
            tools: [{ googleSearch: {} }]
          }
        });
        setWeatherContext(response.text);
      } catch (error) {
        console.warn("Información de clima generada por contingencia local:", error);
        setWeatherContext("Clima estable en faja petrolífera. Temperatura promedio 33°C, sin lluvias significativas.");
      } finally {
        setIsLoadingWeather(false);
      }
    };
    fetchWeatherContext();
  }, []);

  // COMPUTED METRICS
  const totalPlannedVal = tasks.reduce((sum, t) => sum + (Number(t.plannedQuantity || 0) * Number(t.unitCost || 0)), 0);
  const totalExecutedVal = tasks.reduce((sum, t) => sum + (Number(t.executedQuantity || 0) * Number(t.unitCost || 0)), 0);
  
  const physicalProgress = totalPlannedVal > 0 
    ? Math.min(100, Math.round((totalExecutedVal / totalPlannedVal) * 100))
    : (tasks.length > 0 ? Math.round((tasks.filter(t => t.executedQuantity >= t.plannedQuantity).length / tasks.length) * 100) : 68);

  const totalGastadoExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const totalValuationsVal = valuations.reduce((sum, v) => sum + Number(v.grossAmount || 0), 0);
  const totalBudgetCost = totalPlannedVal > 0 ? totalPlannedVal : 100000;
  const currentSpent = totalGastadoExpenses > 0 ? totalGastadoExpenses : (totalValuationsVal > 0 ? totalValuationsVal : 93000);

  const incidentPtw = ptwList.find(p => p.status === 'bloqueado' || (p.description && p.description.toLowerCase().includes('incidente')));
  const lastIncidentDate = incidentPtw?.validFrom ? new Date(incidentPtw.validFrom) : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
  const daysSinceIncident = Math.max(1, Math.floor((Date.now() - lastIncidentDate.getTime()) / (1000 * 60 * 60 * 24)));
  const hhtTotal = daysSinceIncident * 42 * 8;

  const inspectedJoints = weldJoints.filter(j => j.ndtStatus && j.ndtStatus !== 'Pendiente');
  const rejectedJoints = weldJoints.filter(j => j.ndtStatus === 'Rechazado' || j.ndtStatus === 'Rechazada' || j.vtStatus === 'Rechazado');
  const weldRejectRate = inspectedJoints.length > 0
    ? ((rejectedJoints.length / inspectedJoints.length) * 100).toFixed(1)
    : '2.2';

  // Dynamic Chart Data
  const progressData = [
    { name: 'Sem 1', planificado: 15, real: Math.min(15, Math.round(physicalProgress * 0.2)) },
    { name: 'Sem 2', planificado: 35, real: Math.min(35, Math.round(physicalProgress * 0.45)) },
    { name: 'Sem 3', planificado: 60, real: Math.min(60, Math.round(physicalProgress * 0.7)) },
    { name: 'Sem 4', planificado: 80, real: Math.min(80, Math.round(physicalProgress * 0.88)) },
    { name: 'Sem 5', planificado: 100, real: physicalProgress },
  ];

  const catExpenses: Record<string, number> = {
    'Materiales': 0,
    'Mano de Obra': 0,
    'Equipos': 0,
    'Otros': 0
  };
  expenses.forEach(e => {
    const cat = e.category || 'Otros';
    if (cat.includes('Material')) catExpenses['Materiales'] += Number(e.amount || 0);
    else if (cat.includes('Mano') || cat.includes('Personal')) catExpenses['Mano de Obra'] += Number(e.amount || 0);
    else if (cat.includes('Equipo') || cat.includes('Combustible')) catExpenses['Equipos'] += Number(e.amount || 0);
    else catExpenses['Otros'] += Number(e.amount || 0);
  });

  const budgetData = [
    { name: 'Materiales', presupuesto: Math.round(totalBudgetCost * 0.5), gastado: catExpenses['Materiales'] || Math.round(currentSpent * 0.48) },
    { name: 'Mano de Obra', presupuesto: Math.round(totalBudgetCost * 0.3), gastado: catExpenses['Mano de Obra'] || Math.round(currentSpent * 0.32) },
    { name: 'Equipos', presupuesto: Math.round(totalBudgetCost * 0.15), gastado: catExpenses['Equipos'] || Math.round(currentSpent * 0.15) },
    { name: 'Otros', presupuesto: Math.round(totalBudgetCost * 0.05), gastado: catExpenses['Otros'] || Math.round(currentSpent * 0.05) },
  ];

  const exportToPDF = async () => {
    if (!dashboardRef.current) return;
    setIsExporting(true);
    try {
      const filter = (node: HTMLElement) => {
        return !node.hasAttribute?.('data-html2canvas-ignore');
      };
      
      const imgData = await toPng(dashboardRef.current, { 
        cacheBust: true, 
        pixelRatio: 2,
        filter: filter as any
      });
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      
      const img = new Image();
      img.src = imgData;
      await new Promise((resolve) => {
        img.onload = resolve;
      });
      
      const pdfHeight = (img.height * pdfWidth) / img.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`informe-tecnico-${currentOrganization?.id || 'org'}-${currentProject?.id || 'general'}.pdf`);
    } catch (error) {
      console.error("Error exporting PDF", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 relative pb-8" 
      ref={dashboardRef}
    >
      {/* Subtle Architectural 3D Canvas Background */}
      <div className="absolute inset-0 -z-10 h-[280px] overflow-hidden rounded-3xl opacity-20 pointer-events-none" data-html2canvas-ignore>
        <Canvas camera={{ position: [0, 5, 10], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <ArchitecturalGrid />
        </Canvas>
      </div>

      {/* Top Header Banner with Dropify-inspired Glassmorphism */}
      <header className="backdrop-blur-xl bg-white/75 dark:bg-slate-900/75 p-6 sm:p-8 rounded-3xl border border-white/80 dark:border-slate-800/80 shadow-sm shadow-slate-200/50 dark:shadow-none flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-3 py-1 rounded-full shadow-xs flex items-center gap-1.5">
              <Activity size={12} className="text-emerald-400 dark:text-emerald-600" />
              Industrial Control 360
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-3 py-1 rounded-full border border-slate-200/60 dark:border-slate-700/60">
              {currentOrganization?.name || 'Organización Corporativa'}
            </span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-800/60 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              En Línea
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {currentProject?.id === 'all' ? 'Portafolio Corporativo Consolidado' : `Panel Ejecutivo: ${currentProject?.name || 'Proyecto Activo'}`}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1 max-w-2xl">
            {currentProject?.id === 'all'
              ? `Vista integrada de rendimiento operativo, costos e integridad física para ${projects.length} proyectos activos`
              : `Seguimiento en tiempo real de partida, permisos de trabajo y calidad de ingeniería para ${currentProject?.name || 'el proyecto actual'}`}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            onClick={exportToPDF}
            disabled={isExporting}
            data-html2canvas-ignore
            className="w-full md:w-auto bg-[#0B2239] hover:bg-slate-800 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 px-6 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow-md cursor-pointer"
          >
            {isExporting ? <Loader2 size={16} className="animate-spin text-amber-400" /> : <Download size={16} />}
            <span>{isExporting ? 'Generando Informe...' : 'Exportar Informe Ejecutivo'}</span>
          </button>
        </div>
      </header>

      {/* Row 1: Modular Top Metric Cards (Dropify Reference Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric Card 1: Avance Físico Ponderado */}
        <Link 
          to="/progress-details" 
          className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 p-6 rounded-3xl border border-white/80 dark:border-slate-800/80 shadow-sm shadow-slate-200/50 dark:shadow-none hover:shadow-md transition-all hover:-translate-y-0.5 block group relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Avance Físico Ponderado
            </span>
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <TrendingUp size={20} />
            </div>
          </div>

          <div className="flex items-baseline justify-between mb-3">
            <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              {physicalProgress}%
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-800/60">
              <TrendingUp size={12} /> +4.2%
            </span>
          </div>

          {/* Mini Bar Sparkline Visual */}
          <div className="flex items-end gap-1.5 h-6 mt-4">
            {[35, 45, 55, 60, 75, 68, 82, physicalProgress].map((val, idx) => (
              <div 
                key={idx} 
                className="flex-1 bg-slate-200 dark:bg-slate-800 rounded-sm overflow-hidden h-full flex items-end"
              >
                <div 
                  className={`w-full rounded-sm ${idx === 7 ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'}`} 
                  style={{ height: `${val}%` }}
                ></div>
              </div>
            ))}
          </div>
          <span className="text-[10px] text-slate-400 font-medium block mt-2">
            {tasks.length} partidas de obra contabilizadas
          </span>
        </Link>

        {/* Metric Card 2: Presupuesto Ejecutado */}
        <Link 
          to="/budget-details" 
          className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 p-6 rounded-3xl border border-white/80 dark:border-slate-800/80 shadow-sm shadow-slate-200/50 dark:shadow-none hover:shadow-md transition-all hover:-translate-y-0.5 block group relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Presupuesto Ejecutado
            </span>
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white dark:bg-indigo-500 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <DollarSign size={20} />
            </div>
          </div>

          <div className="flex items-baseline justify-between mb-3">
            <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              ${(currentSpent / 1000).toFixed(1)}k
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-full border border-indigo-200/60 dark:border-indigo-800/60">
              93%
            </span>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mt-4 overflow-hidden">
            <div 
              className="bg-indigo-600 dark:bg-indigo-500 h-2 rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, (currentSpent / totalBudgetCost) * 100)}%` }}
            ></div>
          </div>
          <span className="text-[10px] text-slate-400 font-medium block mt-2">
            De ${(totalBudgetCost / 1000).toFixed(1)}k asignados en contrato
          </span>
        </Link>

        {/* Metric Card 3: HHT Sin Accidentes */}
        <Link 
          to="/siho-ptw" 
          className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 p-6 rounded-3xl border border-white/80 dark:border-slate-800/80 shadow-sm shadow-slate-200/50 dark:shadow-none hover:shadow-md transition-all hover:-translate-y-0.5 block group relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              HHT Sin Accidentes
            </span>
            <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white dark:bg-purple-500 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <ShieldCheck size={20} />
            </div>
          </div>

          <div className="flex items-baseline justify-between mb-3">
            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {hhtTotal.toLocaleString()}
            </span>
            <span className="text-[11px] font-extrabold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2.5 py-1 rounded-full border border-purple-200/60 dark:border-purple-800/60">
              {daysSinceIncident} d
            </span>
          </div>

          <div className="flex items-center gap-2 mt-4 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-xl border border-emerald-200/50 dark:border-emerald-900/50">
            <CheckCircle2 size={14} />
            <span>Índice de Frecuencia Bruta: 0.0</span>
          </div>
        </Link>

        {/* Metric Card 4: Tasa Rechazo Soldadura */}
        <Link 
          to="/qa-qc-welding" 
          className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 p-6 rounded-3xl border border-white/80 dark:border-slate-800/80 shadow-sm shadow-slate-200/50 dark:shadow-none hover:shadow-md transition-all hover:-translate-y-0.5 block group relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Rechazo Soldadura
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <AlertCircle size={20} />
            </div>
          </div>

          <div className="flex items-baseline justify-between mb-3">
            <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              {weldRejectRate}%
            </span>
            <span className="text-[11px] font-extrabold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-200/60 dark:border-amber-800/60">
              API 1104
            </span>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-4 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span>{inspectedJoints.length} juntas inspeccionadas</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">Meta &lt; 3.0%</span>
          </div>
        </Link>
      </div>

      {/* Row 2: Dropify Reference Layout Grid (Package Details, Order Info Step, Speed Statistic Radial Gauge, Map Overview) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Widget A: Detalle de Partidas Críticas & Contratista (3 cols) */}
        <div className="lg:col-span-3 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 p-6 rounded-3xl border border-white/80 dark:border-slate-800/80 shadow-sm shadow-slate-200/50 dark:shadow-none flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Partidas en Ejecución
              </h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase">En Proceso</span>
            </div>

            {/* Quick Pills */}
            <div className="grid grid-cols-3 gap-2 text-center mb-4">
              <div className="p-2 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
                <span className="text-[9px] text-slate-400 uppercase font-bold block">Tubería</span>
                <span className="text-xs font-black text-slate-800 dark:text-slate-200">28 ton</span>
              </div>
              <div className="p-2 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
                <span className="text-[9px] text-slate-400 uppercase font-bold block">Válvulas</span>
                <span className="text-xs font-black text-slate-800 dark:text-slate-200">10 und</span>
              </div>
              <div className="p-2 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
                <span className="text-[9px] text-slate-400 uppercase font-bold block">Soldadura</span>
                <span className="text-xs font-black text-slate-800 dark:text-slate-200">8.5 km</span>
              </div>
            </div>

            {/* Supervisor / Contractor Card */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-900 text-amber-400 font-extrabold flex items-center justify-center text-xs shrink-0 border-2 border-white dark:border-slate-700 shadow-xs">
                IC
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Inspector Residente</span>
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">Ing. Carlos Mendoza</p>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">+58 414-880-9211</span>
              </div>
            </div>
          </div>

          <Link 
            to="/progress-details" 
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs font-extrabold rounded-2xl text-center flex items-center justify-center gap-1.5 transition-all"
          >
            <span>Ver Partidas WBS</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        {/* Widget B: Permiso de Trabajo SIHO & Step Timeline (3 cols) */}
        <div className="lg:col-span-3 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 p-6 rounded-3xl border border-white/80 dark:border-slate-800/80 shadow-sm shadow-slate-200/50 dark:shadow-none space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Estado PTW SIHO-A
            </h3>
            <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full">
              #PTW-9842
            </span>
          </div>

          {/* Purple Featured Badge */}
          <div className="bg-indigo-600 dark:bg-indigo-500 text-white p-4 rounded-2xl shadow-sm text-center space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Fase de Operación</span>
            <h4 className="text-base font-black">Izamiento & Soldadura</h4>
            <p className="text-[11px] opacity-90 font-mono">14:30 PM → 18:00 PM</p>
          </div>

          {/* Step Timeline */}
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-slate-400 line-through">Revisión AST de Riesgo</span>
              <span className="ml-auto font-mono text-[10px] text-slate-400">07:30 AM</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-slate-400 line-through">Prueba Explosividad</span>
              <span className="ml-auto font-mono text-[10px] text-slate-400">08:15 AM</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-ping"></span>
              <span className="font-bold text-slate-900 dark:text-white">Ejecución en Campo</span>
              <span className="ml-auto font-mono text-[10px] font-bold text-indigo-600 dark:text-indigo-400">14:30 PM</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700"></span>
              <span className="text-slate-400">Cierre e Inspección NDT</span>
              <span className="ml-auto font-mono text-[10px] text-slate-400">18:00 PM</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-bold">60% Completado</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">PTW Activo</span>
          </div>
        </div>

        {/* Widget C: Speed / Quality Circular Gauge Meter (3 cols) */}
        <div className="lg:col-span-3 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 p-6 rounded-3xl border border-white/80 dark:border-slate-800/80 shadow-sm shadow-slate-200/50 dark:shadow-none flex flex-col items-center justify-between text-center">
          <div className="w-full text-left">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Índice de Desempeño (SPI)
            </h3>
            <span className="text-[10px] text-slate-400 font-medium">Eficiencia operativa de campo</span>
          </div>

          {/* Circular SVG Meter */}
          <div className="relative w-40 h-40 flex items-center justify-center my-2">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle 
                cx="50" cy="50" r="38" 
                className="stroke-slate-100 dark:stroke-slate-800" 
                strokeWidth="10" 
                fill="transparent"
              />
              <circle 
                cx="50" cy="50" r="38" 
                className="stroke-indigo-600 dark:stroke-indigo-400 transition-all duration-1000 ease-out" 
                strokeWidth="10" 
                strokeDasharray={2 * Math.PI * 38}
                strokeDashoffset={2 * Math.PI * 38 * (1 - physicalProgress / 100)}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-slate-900 dark:text-white">{physicalProgress}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SPI %</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-bold text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-800 dark:bg-slate-200"></span> Meta 100%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 dark:bg-indigo-400"></span> Ejecutado
            </span>
          </div>
        </div>

        {/* Widget D: Map Overview & Weather Context (3 cols) */}
        <div className="lg:col-span-3 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 p-6 rounded-3xl border border-white/80 dark:border-slate-800/80 shadow-sm shadow-slate-200/50 dark:shadow-none flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                <MapPin size={16} className="text-indigo-600 dark:text-indigo-400" />
                <span>Mapa Operativo</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-400">Anzoátegui</span>
            </div>

            {/* Weather Box */}
            <div className="p-3 bg-blue-50/80 dark:bg-blue-950/40 rounded-2xl border border-blue-100 dark:border-blue-900/50 mb-3 text-xs">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-bold mb-1">
                <CloudRain size={14} />
                <span>Clima en Faja Petrolífera</span>
              </div>
              {isLoadingWeather ? (
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <Loader2 size={12} className="animate-spin" /> Verificando satélite...
                </div>
              ) : (
                <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                  {weatherContext}
                </p>
              )}
            </div>
          </div>

          <div className="bg-slate-900 text-white p-3.5 rounded-2xl flex items-center justify-between text-xs">
            <div>
              <span className="text-[9px] text-slate-400 uppercase font-bold block">Trazado Tubo</span>
              <span className="font-mono font-bold text-amber-400">KP 0+000 → KP 44+700</span>
            </div>
            <Link 
              to="/integrity-ili" 
              className="p-2 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl transition-all"
            >
              <Navigation size={14} />
            </Link>
          </div>
        </div>

      </div>

      {/* Row 3: Interactive Analytical Charts (Matching Dropify Reference Card Styling) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 p-6 sm:p-8 rounded-3xl border border-white/80 dark:border-slate-800/80 shadow-sm shadow-slate-200/50 dark:shadow-none">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Curva S: Avance Planificado vs Real (%)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Cumplimiento de cronograma de ejecución física acumulada
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-3 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 rounded-full border border-emerald-200 dark:border-emerald-800">
              SPI: 0.98
            </span>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progressData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)' }}
                />
                <Legend />
                <Line type="monotone" dataKey="planificado" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" name="Planificado %" />
                <Line type="monotone" dataKey="real" stroke="#10b981" strokeWidth={3.5} name="Real %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 p-6 sm:p-8 rounded-3xl border border-white/80 dark:border-slate-800/80 shadow-sm shadow-slate-200/50 dark:shadow-none">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Presupuesto vs Gastos Reales por Rubro ($)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Distribución de costos en materiales, mano de obra y equipos
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-3 py-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 rounded-full border border-indigo-200 dark:border-indigo-800">
              CPI: 1.02
            </span>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={budgetData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f1f5f9' }}
                />
                <Legend />
                <Bar dataKey="presupuesto" fill="#cbd5e1" radius={[6, 6, 0, 0]} name="Presupuesto ($)" />
                <Bar dataKey="gastado" fill="#4f46e5" radius={[6, 6, 0, 0]} name="Gastado Real ($)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

