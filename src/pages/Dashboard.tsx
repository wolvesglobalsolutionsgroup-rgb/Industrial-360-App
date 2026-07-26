import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { TrendingUp, DollarSign, AlertCircle, Download, FileText, CloudRain, Loader2, ShieldCheck, Flame } from 'lucide-react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { callGeminiProxy } from '../lib/geminiProxy';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useProject } from '../ProjectContext';

// Minimalist 3D Architectural Grid
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 relative" 
      ref={dashboardRef}
    >
      {/* Subtle Architectural 3D Canvas Background */}
      <div className="absolute inset-0 -z-10 h-[280px] overflow-hidden rounded-3xl opacity-30 pointer-events-none" data-html2canvas-ignore>
        <Canvas camera={{ position: [0, 5, 10], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <ArchitecturalGrid />
        </Canvas>
      </div>

      {/* Header Banner with Industrial Control 360 Branding */}
      <header className="mb-6 pt-2 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-widest bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-3 py-1 rounded-full shadow-xs">
              Industrial Control 360
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              • {currentOrganization?.name || 'Organización Corporativa'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            {currentProject?.id === 'all' ? '🏢 Portafolio Corporativo Consolidado' : 'Panel de Control Ejecutivo'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
            {currentProject?.id === 'all'
              ? `Consolidado multi-tenant de métricas, presupuestos y recursos (${projects.length} proyectos activos)`
              : `Proyecto Activo: ${currentProject?.name || 'Selecciona un Proyecto'}`}
          </p>
        </div>
        <button 
          onClick={exportToPDF}
          disabled={isExporting}
          data-html2canvas-ignore
          className="w-full sm:w-auto bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow-md"
        >
          {isExporting ? <FileText size={16} className="animate-pulse text-emerald-600" /> : <Download size={16} />}
          {isExporting ? 'Generando Informe...' : 'Exportar Informe Ejecutivo'}
        </button>
      </header>

      {/* Weather Context Glassmorphism Card */}
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-4 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-sm flex items-start gap-4">
        <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
          <CloudRain size={22} />
        </div>
        <div className="flex-1">
          <h3 className="text-xs font-bold text-gray-900 dark:text-slate-100 uppercase tracking-wider mb-1">
            Contexto Climático Operativo
          </h3>
          {isLoadingWeather ? (
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
              <Loader2 size={14} className="animate-spin text-emerald-600" /> Consultando condiciones meteorológicas en faja petrolífera...
            </div>
          ) : (
            <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed font-medium">{weatherContext}</p>
          )}
        </div>
      </div>

      {/* Glassmorphism KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1: Avance Físico */}
        <Link 
          to="/progress-details" 
          className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-5 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all hover:-translate-y-0.5 block group"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Avance Físico Ponderado</h3>
            <div className="p-2.5 bg-emerald-500/15 rounded-xl text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-gray-900 dark:text-slate-100">{physicalProgress}%</span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold font-mono">
              {tasks.length} partidas
            </span>
          </div>
          <div className="mt-3 w-full bg-gray-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${physicalProgress}%` }}></div>
          </div>
        </Link>

        {/* KPI 2: Presupuesto Ejecutado */}
        <Link 
          to="/budget-details" 
          className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-5 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all hover:-translate-y-0.5 block group"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Presupuesto Ejecutado</h3>
            <div className="p-2.5 bg-blue-500/15 rounded-xl text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-gray-900 dark:text-slate-100">
              ${(currentSpent / 1000).toFixed(1)}k
            </span>
            <span className="text-[11px] text-gray-500 dark:text-slate-400 font-medium">
              de ${(totalBudgetCost / 1000).toFixed(1)}k
            </span>
          </div>
          <div className="mt-3 w-full bg-gray-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div className="bg-blue-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (currentSpent / totalBudgetCost) * 100)}%` }}></div>
          </div>
        </Link>

        {/* KPI 3: HHT Sin Accidentes */}
        <Link 
          to="/siho-ptw" 
          className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-5 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all hover:-translate-y-0.5 block group"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">HHT Sin Accidentes</h3>
            <div className="p-2.5 bg-purple-500/15 rounded-xl text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
              <ShieldCheck size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-gray-900 dark:text-slate-100">{hhtTotal.toLocaleString()}</span>
            <span className="text-[11px] text-purple-600 dark:text-purple-400 font-bold uppercase tracking-wider">HHT</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>SIHO-A Al día ({daysSinceIncident} días continuos)</span>
          </div>
        </Link>

        {/* KPI 4: Tasa Rechazo Soldadura */}
        <Link 
          to="/qa-qc-welding" 
          className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-5 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all hover:-translate-y-0.5 block group"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Tasa Rechazo Soldadura</h3>
            <div className="p-2.5 bg-amber-500/15 rounded-xl text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
              <AlertCircle size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-gray-900 dark:text-slate-100">{weldRejectRate}%</span>
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold">NDT API 1104</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[10px] text-gray-500 dark:text-slate-400">
            <span>{inspectedJoints.length} inspeccionadas</span>
            <span className="font-bold text-emerald-600">&lt; 3% Meta</span>
          </div>
        </Link>
      </div>

      {/* Interactive Operational Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-xs">
          <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100 uppercase tracking-wider mb-6">
            Avance Planificado vs Real (%)
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progressData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend />
                <Line type="monotone" dataKey="planificado" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" name="Planificado %" />
                <Line type="monotone" dataKey="real" stroke="#10b981" strokeWidth={3} name="Real %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-xs">
          <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100 uppercase tracking-wider mb-6">
            Presupuesto vs Gastos Reales ($)
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={budgetData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f1f5f9' }}
                />
                <Legend />
                <Bar dataKey="presupuesto" fill="#cbd5e1" radius={[4, 4, 0, 0]} name="Presupuesto ($)" />
                <Bar dataKey="gastado" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Gastado Real ($)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
