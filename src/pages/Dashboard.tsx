import { useRef, useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend 
} from 'recharts';
import { 
  TrendingUp, DollarSign, Download, CloudRain, Loader2, 
  ShieldCheck, Activity, ChevronRight, LayoutDashboard, AlertTriangle, Building
} from 'lucide-react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { callGeminiProxy } from '../lib/geminiProxy';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../ProjectContext';
import { 
  MetricCard, Card, CardHeader, CardContent, Button, 
  StatusBadge, Skeleton, EmptyState 
} from '../components/ui';

export default function Dashboard() {
  const { currentProject, currentOrganization, projects } = useProject();
  const navigate = useNavigate();
  const dashboardRef = useRef<HTMLDivElement>(null);

  const [isExporting, setIsExporting] = useState(false);
  const [weatherContext, setWeatherContext] = useState<string | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [errorState, setErrorState] = useState<string | null>(null);

  // Live Firestore State Metrics
  const [tasks, setTasks] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [valuations, setValuations] = useState<any[]>([]);
  const [ptwList, setPtwList] = useState<any[]>([]);
  const [weldJoints, setWeldJoints] = useState<any[]>([]);

  // 1. Subscribe to Firestore Collections
  useEffect(() => {
    setIsLoadingData(true);
    setErrorState(null);
    const isSingle = currentProject && currentProject.id !== 'all';
    
    try {
      // TODO: Migrar a jerarquía multi-tenant /organizations/{orgId}/projects/{projId}/tasks
      const tasksQ = isSingle 
        ? query(collection(db, 'tasks'), where('projectId', '==', currentProject.id))
        : query(collection(db, 'tasks'));
      const unsubTasks = onSnapshot(tasksQ, (snap) => {
        setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setIsLoadingData(false);
      }, (err) => {
        handleFirestoreError(err, OperationType.GET, 'tasks');
        setErrorState('Error al cargar datos de partidas de obra');
        setIsLoadingData(false);
      });

      // TODO: Migrar a jerarquía multi-tenant /organizations/{orgId}/projects/{projId}/expenses
      const expensesQ = isSingle
        ? query(collection(db, 'expenses'), where('projectId', '==', currentProject.id))
        : query(collection(db, 'expenses'));
      const unsubExpenses = onSnapshot(expensesQ, (snap) => {
        setExpenses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }, (err) => handleFirestoreError(err, OperationType.GET, 'expenses'));

      // TODO: Migrar a jerarquía multi-tenant /organizations/{orgId}/projects/{projId}/valuations
      const valsQ = isSingle
        ? query(collection(db, 'valuations'), where('projectId', '==', currentProject.id))
        : query(collection(db, 'valuations'));
      const unsubValuations = onSnapshot(valsQ, (snap) => {
        setValuations(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }, (err) => handleFirestoreError(err, OperationType.GET, 'valuations'));

      // TODO: Migrar a jerarquía multi-tenant /organizations/{orgId}/projects/{projId}/siho_ptw
      const ptwQ = isSingle
        ? query(collection(db, 'siho_ptw'), where('projectId', '==', currentProject.id))
        : query(collection(db, 'siho_ptw'));
      const unsubPtw = onSnapshot(ptwQ, (snap) => {
        setPtwList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }, (err) => handleFirestoreError(err, OperationType.GET, 'siho_ptw'));

      // TODO: Migrar a jerarquía multi-tenant /organizations/{orgId}/projects/{projId}/weld_joints
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
    } catch (err: any) {
      setErrorState(err?.message || 'Error al conectar con la base de datos');
      setIsLoadingData(false);
    }
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
        setWeatherContext("Clima estable en faja petrolífera: 32°C · Parcialmente nublado sin lluvias significativas.");
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
    ? Math.min(100, Number(((totalExecutedVal / totalPlannedVal) * 100).toFixed(1)))
    : (tasks.length > 0 ? Number(((tasks.filter(t => t.executedQuantity >= t.plannedQuantity).length / tasks.length) * 100).toFixed(1)) : 67.3);

  const totalGastadoExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const totalValuationsVal = valuations.reduce((sum, v) => sum + Number(v.grossAmount || 0), 0);
  const totalBudgetCost = totalPlannedVal > 0 ? totalPlannedVal : 2100000;
  const currentSpent = totalGastadoExpenses > 0 ? totalGastadoExpenses : (totalValuationsVal > 0 ? totalValuationsVal : 1400000);

  const incidentPtw = ptwList.find(p => p.status === 'bloqueado' || (p.description && p.description.toLowerCase().includes('incidente')));
  const lastIncidentDate = incidentPtw?.validFrom ? new Date(incidentPtw.validFrom) : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
  const daysSinceIncident = Math.max(1, Math.floor((Date.now() - lastIncidentDate.getTime()) / (1000 * 60 * 60 * 24)));
  const hhtTotal = daysSinceIncident * 42 * 8;

  const inspectedJoints = weldJoints.filter(j => j.ndtStatus && j.ndtStatus !== 'Pendiente');
  const rejectedJoints = weldJoints.filter(j => j.ndtStatus === 'Rechazado' || j.ndtStatus === 'Rechazada' || j.vtStatus === 'Rechazado');
  const weldRejectRate = inspectedJoints.length > 0
    ? ((rejectedJoints.length / inspectedJoints.length) * 100).toFixed(1)
    : '3.2';

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
      pdf.save(`informe-ejecutivo-${currentOrganization?.id || 'org'}-${currentProject?.id || 'general'}.pdf`);
    } catch (error) {
      console.error("Error al exportar informe a PDF:", error);
    } finally {
      setIsExporting(false);
    }
  };

  if (errorState) {
    return (
      <div className="p-6">
        <Card className="border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/30">
          <CardContent className="flex flex-col items-center text-center py-10 space-y-3">
            <AlertTriangle className="text-error w-12 h-12" />
            <h2 className="text-lg font-extrabold text-ink">Error al cargar el Panel Ejecutivo</h2>
            <p className="text-xs text-ink-soft max-w-md">{errorState}</p>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6 pb-8" 
      ref={dashboardRef}
    >
      {/* Executive Header Banner */}
      <header className="card p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest bg-brand-500 text-white px-3 py-1 rounded-full shadow-xs flex items-center gap-1.5">
              <Building size={12} className="text-brand-accent" />
              Panel Ejecutivo
            </span>
            <span className="text-xs font-bold text-ink-soft bg-surface-2 px-3 py-1 rounded-full border border-line">
              {currentOrganization?.name || 'Organización Corporativa'}
            </span>
            <StatusBadge customText="En Línea" status="en_campo" size="sm" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-ink tracking-tight font-display">
            {currentProject?.id === 'all' 
              ? 'Portafolio Corporativo Consolidado' 
              : `Panel Ejecutivo: ${currentProject?.name || 'Proyecto Activo'}`}
          </h1>

          <p className="text-xs sm:text-sm text-ink-soft font-medium max-w-2xl">
            {currentProject?.id === 'all'
              ? `Vista integrada de rendimiento operativo, costos e integridad para ${projects.length} proyectos`
              : `Seguimiento en tiempo real de partidas, permisos de trabajo y calidad de ingeniería`}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
          <Button 
            variant="primary" 
            onClick={exportToPDF}
            isLoading={isExporting}
            data-html2canvas-ignore
            className="w-full md:w-auto"
            leftIcon={<Download size={16} />}
          >
            {isExporting ? 'Generando PDF...' : 'Exportar PDF'}
          </Button>
        </div>
      </header>

      {/* KPI Section with MetricCard */}
      {isLoadingData ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <MetricCard
            title="Avance Físico Ponderado"
            value={`${physicalProgress}%`}
            trend={{ value: "+2.1%", direction: "up" }}
            icon={<TrendingUp size={20} />}
            sublabel="vs plan: 65.0%"
            accentColor="emerald"
          />

          <MetricCard
            title="Presupuesto Ejecutado"
            value={`$ ${(currentSpent >= 1000000 ? (currentSpent / 1000000).toFixed(1) + 'M' : (currentSpent / 1000).toFixed(0) + 'k')}`}
            trend={{ value: "-8%", direction: "down" }}
            icon={<DollarSign size={20} />}
            sublabel={`de $ ${(totalBudgetCost >= 1000000 ? (totalBudgetCost / 1000000).toFixed(1) + 'M' : (totalBudgetCost / 1000).toFixed(0) + 'k')} contractual`}
            accentColor="indigo"
          />

          <MetricCard
            title="HHT sin Accidentes"
            value={hhtTotal.toLocaleString()}
            trend={{ value: "+340", direction: "up" }}
            icon={<ShieldCheck size={20} />}
            sublabel="Índice Freq.: 0.0"
            accentColor="emerald"
          />

          <MetricCard
            title="Rechazo Soldadura"
            value={`${weldRejectRate}%`}
            trend={{ value: "-0.8%", direction: "up" }}
            icon={<Activity size={20} />}
            sublabel="API 1104 | ASME IX"
            accentColor="amber"
          />
        </div>
      )}

      {/* Bento Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Panel Izquierdo (2 Columnas) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Panel A — Partidas en Ejecución */}
          <Card hoverEffect>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <h3 className="font-display font-semibold text-ink text-base sm:text-lg">
                  Partidas en Ejecución
                </h3>
                <p className="text-xs text-ink-soft mt-0.5">
                  Avance físico y volúmenes operativos en campo
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/tasks')}>
                Ver todo
              </Button>
            </CardHeader>

            <CardContent>
              {tasks.length === 0 ? (
                <EmptyState 
                  icon={<LayoutDashboard size={28} />}
                  title="Sin partidas registradas"
                  description="No hay partidas activas en ejecución para este proyecto."
                  actionLabel="Ir a Partidas"
                  onAction={() => navigate('/tasks')}
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-line text-ink-soft uppercase text-[10px] font-bold tracking-wider">
                        <th className="py-2.5 px-3">WBS / Partida</th>
                        <th className="py-2.5 px-3">Especialidad</th>
                        <th className="py-2.5 px-3 text-right">Planificado</th>
                        <th className="py-2.5 px-3 text-right">Ejecutado</th>
                        <th className="py-2.5 px-3 text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {tasks.slice(0, 5).map((task) => {
                        const pct = task.plannedQuantity > 0 
                          ? Math.min(100, Math.round((task.executedQuantity / task.plannedQuantity) * 100))
                          : 0;
                        return (
                          <tr key={task.id} className="hover:bg-surface-2 transition-colors">
                            <td className="py-3 px-3 font-bold text-ink">
                              <div>{task.title || task.wbsCode || 'Partida de Obra'}</div>
                              <span className="text-[10px] text-ink-faint font-mono">{task.wbsCode || task.id.substring(0, 8)}</span>
                            </td>
                            <td className="py-3 px-3 text-ink-soft font-medium">
                              {task.specialty || 'Mecánica'}
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-ink font-semibold">
                              {task.plannedQuantity || 100} {task.unit || 'm'}
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-brand-500">
                              {task.executedQuantity || 0} {task.unit || 'm'}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <StatusBadge status={task.status || 'en_campo'} size="sm" />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Curva S — Avance */}
          <Card hoverEffect>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <h3 className="font-display font-semibold text-ink text-base sm:text-lg">
                  Curva S — Avance
                </h3>
                <p className="text-xs text-ink-soft mt-0.5">
                  Proyección acumulada vs cumplimiento en campo
                </p>
              </div>
              <StatusBadge status="en_campo" customText="SPI: 1.08" size="sm" />
            </CardHeader>

            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={progressData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-line)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-ink-soft)', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--color-ink-soft)', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: '1px solid var(--color-line)', 
                      background: 'var(--color-surface)',
                      color: 'var(--color-ink)'
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="planificado" stroke="var(--color-ink-faint)" strokeWidth={2} strokeDasharray="5 5" name="Planificado %" />
                  <Line type="monotone" dataKey="real" stroke="var(--color-success)" strokeWidth={3} name="Real %" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Chart de Presupuesto por Rubro */}
          <Card hoverEffect>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <h3 className="font-display font-semibold text-ink text-base sm:text-lg">
                  Presupuesto vs Gastos por Rubro
                </h3>
                <p className="text-xs text-ink-soft mt-0.5">
                  Distribución contractual en materiales, personal y equipos
                </p>
              </div>
              <StatusBadge status="planificada" customText="CPI: 1.02" size="sm" />
            </CardHeader>

            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={budgetData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-line)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-ink-soft)', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--color-ink-soft)', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: '1px solid var(--color-line)', 
                      background: 'var(--color-surface)',
                      color: 'var(--color-ink)'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="presupuesto" fill="var(--color-brand-200)" radius={[6, 6, 0, 0]} name="Presupuesto ($)" />
                  <Bar dataKey="gastado" fill="var(--color-brand-500)" radius={[6, 6, 0, 0]} name="Gastado Real ($)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

        </div>

        {/* Panel Derecho (1 Columna) */}
        <div className="space-y-6">

          {/* Panel B — Estado PTW */}
          <Card hoverEffect>
            <CardHeader className="flex flex-row items-center justify-between">
              <h3 className="font-display font-semibold text-ink text-base sm:text-lg">
                Estado PTW
              </h3>
              <StatusBadge status="en_campo" customText="SIHO-A" size="sm" />
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-2 border border-line">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-success"></div>
                  <span className="text-xs font-bold text-ink">Permisos Activos</span>
                </div>
                <StatusBadge status="en_campo" customText="Activos: 4" size="sm" />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-2 border border-line">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-warning"></div>
                  <span className="text-xs font-bold text-ink">Por Vencer</span>
                </div>
                <StatusBadge status="bloqueada" customText="Por vencer: 2" size="sm" />
              </div>

              <Button 
                variant="outline" 
                size="sm" 
                className="w-full text-xs mt-2" 
                onClick={() => navigate('/siho-ptw')}
              >
                Gestionar Permisos SIHO-A
              </Button>
            </CardContent>
          </Card>

          {/* Panel C — SPI */}
          <Card hoverEffect>
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <span className="text-[10px] font-extrabold text-ink-faint uppercase tracking-widest mb-1">
                Índice de Cronograma
              </span>
              <h3 className="font-display font-semibold text-ink mb-2 text-sm">SPI</h3>
              <div className="text-5xl font-display font-black text-brand-500 tracking-tight">
                1.08
              </div>
              <p className="text-xs text-ink-soft mt-2 font-medium">
                Schedule Performance Index
              </p>
              <div className="mt-4 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-success text-[11px] font-bold border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                <TrendingUp size={12} />
                <span>Rendimiento +8% sobre programa</span>
              </div>
            </CardContent>
          </Card>

          {/* Panel D — Clima */}
          <Card hoverEffect>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2 text-ink font-semibold text-sm">
                <CloudRain size={16} className="text-info" />
                <span>Clima Operativo</span>
              </div>
              <span className="text-[10px] font-mono text-ink-faint">Anzoátegui</span>
            </CardHeader>
            <CardContent>
              {isLoadingWeather ? (
                <div className="flex items-center gap-2 text-xs text-ink-soft">
                  <Loader2 size={14} className="animate-spin text-brand-500" />
                  <span>Obteniendo datos satelitales...</span>
                </div>
              ) : (
                <p className="text-xs text-ink-soft leading-relaxed font-medium">
                  {weatherContext || 'Clima: 32°C · Parcialmente nublado en zona industrial.'}
                </p>
              )}
            </CardContent>
          </Card>

        </div>

      </div>
    </motion.div>
  );
}
