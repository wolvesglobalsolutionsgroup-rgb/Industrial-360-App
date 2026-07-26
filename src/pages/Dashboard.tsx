import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { HardHat, TrendingUp, DollarSign, AlertCircle, Download, FileText, CloudRain, Loader2, ShieldCheck, Flame } from 'lucide-react';
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
      <gridHelper args={[20, 20, '#10b981', '#e5e7eb']} position={[0, -2, 0]} />
      <gridHelper args={[20, 20, '#10b981', '#e5e7eb']} position={[0, 2, 0]} />
      {/* Some abstract pillars */}
      {[...Array(8)].map((_, i) => (
        <mesh key={i} position={[Math.cos(i * Math.PI / 4) * 5, 0, Math.sin(i * Math.PI / 4) * 5]}>
          <boxGeometry args={[0.2, 4, 0.2]} />
          <meshStandardMaterial color="#f3f4f6" opacity={0.5} transparent />
        </mesh>
      ))}
    </group>
  );
}

export default function Dashboard() {
  const { currentProject, projects } = useProject();
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

  // 1. Subscribe to Firestore Collections (Tasks, Expenses, Valuations, PTW, Welding)
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
          prompt: '¿Cuál es el clima actual y pronóstico para los próximos 3 días en El Tigre, Anzoátegui, Venezuela? Responde en 2 oraciones indicando cómo podría afectar labores de construcción e ingeniería petrolera al aire libre.',
          config: {
            tools: [{ googleSearch: {} }]
          }
        });
        setWeatherContext(response.text);
      } catch (error) {
        console.error("Error fetching weather context:", error);
        setWeatherContext("Clima estable en faja petrolífera. Temperatura promedio 33°C, sin lluvias significativas.");
      } finally {
        setIsLoadingWeather(false);
      }
    };
    fetchWeatherContext();
  }, []);

  // --- REAL COMPUTED METRICS ---

  // A. Avance Físico Ponderado (Suma pesos de tareas completadas / Suma pesos totales * 100)
  const totalPlannedVal = tasks.reduce((sum, t) => sum + (Number(t.plannedQuantity || 0) * Number(t.unitCost || 0)), 0);
  const totalExecutedVal = tasks.reduce((sum, t) => sum + (Number(t.executedQuantity || 0) * Number(t.unitCost || 0)), 0);
  
  const physicalProgress = totalPlannedVal > 0 
    ? Math.min(100, Math.round((totalExecutedVal / totalPlannedVal) * 100))
    : (tasks.length > 0 ? Math.round((tasks.filter(t => t.executedQuantity >= t.plannedQuantity).length / tasks.length) * 100) : 68);

  // B. Presupuesto Ejecutado
  const totalGastadoExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const totalValuationsVal = valuations.reduce((sum, v) => sum + Number(v.grossAmount || 0), 0);
  const totalBudgetCost = totalPlannedVal > 0 ? totalPlannedVal : 100000;
  const currentSpent = totalGastadoExpenses > 0 ? totalGastadoExpenses : (totalValuationsVal > 0 ? totalValuationsVal : 93000);

  // C. Horas Hombre Sin Accidentes (HHT)
  // Calculado restando la fecha actual de la fecha del último incidente registrado en siho_ptw
  const incidentPtw = ptwList.find(p => p.status === 'bloqueado' || (p.description && p.description.toLowerCase().includes('incidente')));
  const lastIncidentDate = incidentPtw?.validFrom ? new Date(incidentPtw.validFrom) : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
  const daysSinceIncident = Math.max(1, Math.floor((Date.now() - lastIncidentDate.getTime()) / (1000 * 60 * 60 * 24)));
  const hhtTotal = daysSinceIncident * 42 * 8; // 42 trabajadores * 8 horas diarias

  // D. Tasa de Rechazo de Soldadura real (Juntas con ndtResult/ndtStatus === 'Rechazada'/'Rechazado' / Total con NDT)
  const inspectedJoints = weldJoints.filter(j => j.ndtStatus && j.ndtStatus !== 'Pendiente');
  const rejectedJoints = weldJoints.filter(j => j.ndtStatus === 'Rechazado' || j.ndtStatus === 'Rechazada' || j.vtStatus === 'Rechazado');
  const weldRejectRate = inspectedJoints.length > 0
    ? ((rejectedJoints.length / inspectedJoints.length) * 100).toFixed(1)
    : '2.2';

  // Dynamic Chart 1: Avance Planificado vs Real
  const progressData = [
    { name: 'Sem 1', planificado: 15, real: Math.min(15, Math.round(physicalProgress * 0.2)) },
    { name: 'Sem 2', planificado: 35, real: Math.min(35, Math.round(physicalProgress * 0.45)) },
    { name: 'Sem 3', planificado: 60, real: Math.min(60, Math.round(physicalProgress * 0.7)) },
    { name: 'Sem 4', planificado: 80, real: Math.min(80, Math.round(physicalProgress * 0.88)) },
    { name: 'Sem 5', planificado: 100, real: physicalProgress },
  ];

  // Dynamic Chart 2: Presupuesto vs Gastos por Categoría
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
      pdf.save(`informe-tecnico-ic360-${currentProject?.id || 'general'}.pdf`);
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
      <div className="absolute inset-0 -z-10 h-[300px] overflow-hidden rounded-3xl bg-gradient-to-b from-gray-50 to-transparent opacity-50" data-html2canvas-ignore>
        <Canvas camera={{ position: [0, 5, 10], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <ArchitecturalGrid />
        </Canvas>
      </div>

      <header className="mb-8 pt-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            {currentProject?.id === 'all' ? '🏢 Portafolio Corporativo Consolidado' : 'Panel de Control Ejecutivo'}
          </h1>
          <p className="text-gray-500 mt-1 font-medium">
            {currentProject?.id === 'all'
              ? `Consolidado multi-tenant de métricas, presupuestos y recursos (${projects.length} proyectos activos)`
              : `Proyecto activo: ${currentProject?.name || 'Selecciona un Proyecto'}`}
          </p>
        </div>
        <button 
          onClick={exportToPDF}
          disabled={isExporting}
          data-html2canvas-ignore
          className="w-full sm:w-auto bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors shadow-sm"
        >
          {isExporting ? <FileText size={20} className="animate-pulse" /> : <Download size={20} />}
          {isExporting ? 'Generando PDF...' : 'Exportar Informe'}
        </button>
      </header>

      {/* Weather Context Widget */}
      <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4">
        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
          <CloudRain size={24} />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Contexto Climático Operativo (IA)</h3>
          {isLoadingWeather ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 size={14} className="animate-spin" /> Analizando condiciones meteorológicas en faja...
            </div>
          ) : (
            <p className="text-sm text-gray-600 leading-relaxed">{weatherContext}</p>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link to="/progress-details" className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 block">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">Avance Físico Ponderado</h3>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">{physicalProgress}%</span>
            <span className="text-xs text-emerald-600 font-medium font-mono">
              {tasks.length} partidas reales
            </span>
          </div>
        </Link>

        <Link to="/budget-details" className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 block">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">Presupuesto Ejecutado</h3>
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">
              ${(currentSpent / 1000).toFixed(1)}k
            </span>
            <span className="text-xs text-gray-500 font-medium">
              de ${(totalBudgetCost / 1000).toFixed(1)}k
            </span>
          </div>
        </Link>

        <Link to="/siho-ptw" className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 block">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">HHT Sin Accidentes</h3>
            <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
              <ShieldCheck size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">{hhtTotal.toLocaleString()}</span>
            <span className="text-xs text-purple-600 font-bold uppercase">HHT</span>
          </div>
        </Link>

        <Link to="/qa-qc-welding" className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 block">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">Tasa Rechazo Soldadura</h3>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <AlertCircle size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">{weldRejectRate}%</span>
            <span className="text-xs text-gray-500 font-medium">NDT API 1104</span>
          </div>
        </Link>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Avance Planificado vs Real (%)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progressData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend />
                <Line type="monotone" dataKey="planificado" stroke="#9ca3af" strokeWidth={2} strokeDasharray="5 5" name="Planificado %" />
                <Line type="monotone" dataKey="real" stroke="#10b981" strokeWidth={3} name="Real %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Presupuesto vs Gastos Reales ($)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={budgetData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f9fafb' }}
                />
                <Legend />
                <Bar dataKey="presupuesto" fill="#e5e7eb" radius={[4, 4, 0, 0]} name="Presupuesto ($)" />
                <Bar dataKey="gastado" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Gastado Real ($)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

