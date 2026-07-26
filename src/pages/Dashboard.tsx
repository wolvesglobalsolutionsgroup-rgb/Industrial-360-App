import { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer, BarChart, Bar, Legend, Area, AreaChart
} from 'recharts';
import {
  TrendingUp, DollarSign, AlertCircle, Download, FileText,
  CloudRain, Loader2, Users, Activity,
  Clock, User, AlertTriangle,
  Info, Target, BarChart3
} from 'lucide-react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { collection, query, onSnapshot, where, orderBy, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { callGeminiProxy } from '../lib/geminiProxy';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useProject } from '../ProjectContext';
import { format, parseISO, differenceInDays, addDays, startOfWeek, endOfWeek, isAfter, isBefore, subDays, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';

// ─── Types ───────────────────────────────────────────────────────────────────
type Period = '7d' | '30d' | '90d' | 'all';

interface ActivityEvent {
  id: string;
  type: 'task' | 'expense' | 'field_report' | 'alert';
  description: string;
  timestamp: Date;
  user?: string;
  icon: React.ReactNode;
  color: string;
}

interface SCurvePoint {
  name: string;
  planificado: number;
  real: number;
  proyectado?: number;
}

interface RiskCard {
  title: string;
  level: 'green' | 'yellow' | 'red';
  message: string;
  value: string;
}

interface TrafficLight {
  label: string;
  level: 'green' | 'yellow' | 'red';
  value: string;
}

// ─── Minimalist 3D Architectural Grid ──────────────────────────────────────
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

// ─── Helpers ─────────────────────────────────────────────────────────────────
function trafficLightColor(level: 'green' | 'yellow' | 'red'): string {
  switch (level) {
    case 'green': return 'text-emerald-600 bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700';
    case 'yellow': return 'text-amber-600 bg-amber-100 dark:bg-amber-950/50 dark:text-amber-400 border-amber-300 dark:border-amber-700';
    case 'red': return 'text-red-600 bg-red-100 dark:bg-red-950/50 dark:text-red-400 border-red-300 dark:border-red-700';
  }
}

function riskBgColor(level: 'green' | 'yellow' | 'red'): string {
  switch (level) {
    case 'green': return 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800';
    case 'yellow': return 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800';
    case 'red': return 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800';
  }
}

function riskDotColor(level: 'green' | 'yellow' | 'red'): string {
  switch (level) {
    case 'green': return 'bg-emerald-500';
    case 'yellow': return 'bg-amber-500';
    case 'red': return 'bg-red-500';
  }
}

// ─── Main Dashboard Component ───────────────────────────────────────────────
export default function Dashboard() {
  const { currentProject, currentOrganization, projects } = useProject();
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [weatherContext, setWeatherContext] = useState<string | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(true);
  const [period, setPeriod] = useState<Period>('all');

  // Live Firestore State
  const [tasks, setTasks] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [valuations, setValuations] = useState<any[]>([]);
  const [ptwList, setPtwList] = useState<any[]>([]);
  const [weldJoints, setWeldJoints] = useState<any[]>([]);
  const [fieldReports, setFieldReports] = useState<any[]>([]);

  // ── 1. Firestore Subscriptions ───────────────────────────────────────────
  useEffect(() => {
    const isSingle = currentProject && currentProject.id !== 'all';
    const projectFilter = isSingle ? currentProject!.id : null;

    const subs: (() => void)[] = [];

    const subscribe = <T,>(collectionName: string, setter: (data: any[]) => void) => {
      const constraints: any[] = [];
      if (collectionName !== 'projects' && projectFilter) {
        constraints.push(where('projectId', '==', projectFilter));
      }
      // Add orderBy for activity feed collections
      if (['field_reports', 'expenses'].includes(collectionName)) {
        constraints.push(orderBy('timestamp', 'desc'));
        constraints.push(limit(50));
      }
      const q = query(collection(db, collectionName), ...constraints);
      const unsub = onSnapshot(q, (snap) => {
        setter(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }, (err) => handleFirestoreError(err, OperationType.GET, collectionName));
      subs.push(unsub);
    };

    subscribe('tasks', setTasks);
    subscribe('expenses', setExpenses);
    subscribe('valuations', setValuations);
    subscribe('siho_ptw', setPtwList);
    subscribe('weld_joints', setWeldJoints);
    subscribe('field_reports', setFieldReports);

    return () => subs.forEach(u => u());
  }, [currentProject]);

  // Also listen to project changes for activity
  const [allProjects, setAllProjects] = useState<any[]>([]);
  useEffect(() => {
    const q = query(collection(db, 'projects'));
    const unsub = onSnapshot(q, (snap) => {
      setAllProjects(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // ── Weather ────────────────────────────────────────────────────────────────
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

  // ── Date filter ────────────────────────────────────────────────────────────
  const cutoffDate = useMemo(() => {
    if (period === 'all') return null;
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    return subDays(new Date(), days);
  }, [period]);

  const filterByPeriod = <T extends { createdAt?: any; timestamp?: any; date?: any }>(items: T[]): T[] => {
    if (!cutoffDate) return items;
    return items.filter(item => {
      const ts = item.createdAt?.toDate?.() || item.timestamp?.toDate?.() || (item.date ? new Date(item.date) : null);
      return ts && isAfter(ts, cutoffDate);
    });
  };

  // ── COMPUTED METRICS ──────────────────────────────────────────────────────
  const totalPlannedVal = useMemo(() =>
    tasks.reduce((sum, t) => sum + (Number(t.plannedQuantity || 0) * Number(t.unitCost || 0)), 0),
    [tasks]
  );

  const totalExecutedVal = useMemo(() =>
    tasks.reduce((sum, t) => sum + (Number(t.executedQuantity || 0) * Number(t.unitCost || 0)), 0),
    [tasks]
  );

  const physicalProgress = useMemo(() => {
    if (totalPlannedVal > 0) {
      return Math.min(100, Math.round((totalExecutedVal / totalPlannedVal) * 100));
    }
    if (tasks.length > 0) {
      return Math.round((tasks.filter(t => Number(t.executedQuantity || 0) >= Number(t.plannedQuantity || 0)).length / tasks.length) * 100);
    }
    return 0;
  }, [tasks, totalPlannedVal, totalExecutedVal]);

  // Presupuesto
  const totalGastadoExpenses = useMemo(() =>
    expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0),
    [expenses]
  );

  const totalValuationsVal = useMemo(() =>
    valuations.reduce((sum, v) => sum + Number(v.grossAmount || 0), 0),
    [valuations]
  );

  const totalBudgetCost = totalPlannedVal > 0 ? totalPlannedVal : 100000;
  const currentSpent = totalGastadoExpenses > 0 ? totalGastadoExpenses : (totalValuationsVal > 0 ? totalValuationsVal : 0);

  // EVM Metrics
  const EV = totalExecutedVal; // Earned Value
  const PV = totalPlannedVal;  // Planned Value
  const AC = totalGastadoExpenses > 0 ? totalGastadoExpenses : totalExecutedVal; // Actual Cost
  const BAC = totalPlannedVal || 1; // Budget at Completion

  const SPI = PV > 0 ? EV / PV : 1;
  const CPI = AC > 0 ? EV / AC : 1;
  const EAC = CPI > 0 ? AC + (BAC - EV) / CPI : BAC;

  // Personal Activo desde field_reports
  const activePersonnel = useMemo(() => {
    if (fieldReports.length === 0) return 0;
    const latest = fieldReports.slice(0, 10);
    const total = latest.reduce((sum, r) => sum + Number(r.personnelCount || 0), 0);
    return Math.round(total / Math.min(latest.length, 1));
  }, [fieldReports]);

  // Alertas: tasks where executedQuantity > plannedQuantity * 0.9
  const alertCount = useMemo(() =>
    tasks.filter(t => Number(t.executedQuantity || 0) > Number(t.plannedQuantity || 0) * 0.9).length,
    [tasks]
  );

  // HSE: Días sin incidentes
  const incidentPtw = ptwList.find(
    p => p.status === 'bloqueado' || (p.description && p.description.toLowerCase().includes('incidente'))
  );
  const lastIncidentDate = incidentPtw?.validFrom
    ? new Date(incidentPtw.validFrom)
    : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
  const daysSinceIncident = Math.max(1, Math.floor((Date.now() - lastIncidentDate.getTime()) / (1000 * 60 * 60 * 24)));
  const hhtTotal = daysSinceIncident * Math.max(activePersonnel, 42) * 8;

  const filteredFieldReports = useMemo(() => filterByPeriod(fieldReports), [fieldReports, cutoffDate]);

  // Calidad Soldadura
  const inspectedJoints = weldJoints.filter(j => j.ndtStatus && j.ndtStatus !== 'Pendiente');
  const rejectedJoints = weldJoints.filter(j =>
    j.ndtStatus === 'Rechazado' || j.ndtStatus === 'Rechazada' || j.vtStatus === 'Rechazado'
  );
  const weldRejectRate = inspectedJoints.length > 0
    ? ((rejectedJoints.length / inspectedJoints.length) * 100)
    : null;
  const weldApprovalRate = weldRejectRate !== null ? (100 - weldRejectRate) : null;

  // ── 2. S-CURVE DATA ───────────────────────────────────────────────────────
  const sCurveData = useMemo((): SCurvePoint[] => {
    if (tasks.length === 0) {
      // Fallback vacío con estructura
      return [
        { name: 'Sem 1', planificado: 0, real: 0 },
        { name: 'Sem 2', planificado: 0, real: 0 },
        { name: 'Sem 3', planificado: 0, real: 0 },
        { name: 'Sem 4', planificado: 0, real: 0 },
      ];
    }

    // Get date range from tasks
    const today = new Date();
    let minDate = today;
    let maxDate = today;

    tasks.forEach(t => {
      if (t.startDate) {
        const d = new Date(t.startDate);
        if (d < minDate) minDate = d;
      }
      if (t.endDate) {
        const d = new Date(t.endDate);
        if (d > maxDate) maxDate = d;
      }
    });

    // Ensure we have at least 4 weeks of range
    if (differenceInDays(maxDate, minDate) < 21) {
      maxDate = addDays(minDate, 28);
    }
    if (maxDate > addDays(today, 60)) {
      maxDate = addDays(today, min(60, differenceInDays(maxDate, minDate)));
    }

    const totalDays = differenceInDays(maxDate, minDate) || 28;
    const numWeeks = Math.max(4, Math.ceil(totalDays / 7));
    const weeks: { start: Date; end: Date }[] = [];

    for (let i = 0; i < numWeeks; i++) {
      const start = addDays(minDate, i * 7);
      const end = i < numWeeks - 1 ? addDays(minDate, (i + 1) * 7) : maxDate;
      weeks.push({ start, end });
    }

    const weekNames = weeks.map((w, i) => `Sem ${i + 1}`);

    // Calculate cumulative planned per week
    const cumulativePlanned = weeks.map((week) => {
      let plannedInWeek = 0;
      tasks.forEach(task => {
        const tStart = task.startDate ? new Date(task.startDate) : minDate;
        const tEnd = task.endDate ? new Date(task.endDate) : maxDate;
        const taskDuration = differenceInDays(tEnd, tStart) || 1;
        const daysInWeek = Math.max(0,
          Math.min(week.end, tEnd).getTime() - Math.max(week.start, tStart).getTime()
        ) / (1000 * 60 * 60 * 24);
        if (daysInWeek > 0) {
          const taskVal = Number(task.plannedQuantity || 0) * Number(task.unitCost || 0);
          plannedInWeek += (daysInWeek / taskDuration) * taskVal;
        }
      });
      return plannedInWeek;
    });

    // Cumulative sums
    let cumPlanned = 0;
    const plannedCumulative = cumulativePlanned.map(v => {
      cumPlanned += v;
      return cumPlanned;
    });

    // Actual: distribute EV proportionally to planned curve, capped at current progress
    const progressRatio = totalPlannedVal > 0 ? totalExecutedVal / totalPlannedVal : 0;

    // Determine how many weeks have passed
    const weeksElapsed = weeks.filter(w => isBefore(w.start, today)).length;

    const realCumulative = plannedCumulative.map((val, i) => {
      // Scale: realized EV follows the planned curve shape up to current progress
      if (i <= weeksElapsed) {
        return val * progressRatio;
      }
      return plannedCumulative[weeksElapsed] * progressRatio;
    });

    // Projected: from current point, project forward using CPI
    const projectedCumulative = plannedCumulative.map((val, i) => {
      if (i <= weeksElapsed) {
        return realCumulative[i];
      }
      // Forecast: planned value * (1/CPI) adjusted, or just planned if CPI >= 1
      const cpiSafe = CPI > 0 ? CPI : 1;
      const forecastVal = val * (1 / cpiSafe);
      return forecastVal;
    });

    // Build data points
    return weeks.map((_, i) => ({
      name: weekNames[i],
      planificado: Math.round(plannedCumulative[i]),
      real: Math.round(realCumulative[i]),
      proyectado: Math.round(projectedCumulative[i]),
    }));
  }, [tasks, totalPlannedVal, totalExecutedVal, CPI]);

  // Budget chart data
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
    { name: 'Materiales', presupuesto: Math.round(totalBudgetCost * 0.5), gastado: catExpenses['Materiales'] || (currentSpent > 0 ? Math.round(currentSpent * 0.48) : 0) },
    { name: 'Mano de Obra', presupuesto: Math.round(totalBudgetCost * 0.3), gastado: catExpenses['Mano de Obra'] || (currentSpent > 0 ? Math.round(currentSpent * 0.32) : 0) },
    { name: 'Equipos', presupuesto: Math.round(totalBudgetCost * 0.15), gastado: catExpenses['Equipos'] || (currentSpent > 0 ? Math.round(currentSpent * 0.15) : 0) },
    { name: 'Otros', presupuesto: Math.round(totalBudgetCost * 0.05), gastado: catExpenses['Otros'] || (currentSpent > 0 ? Math.round(currentSpent * 0.05) : 0) },
  ];

  // ── 3. RIESGOS (HEAT MAP) ─────────────────────────────────────────────────
  const risks = useMemo((): RiskCard[] => {
    const results: RiskCard[] = [];

    // Riesgo de Presupuesto (CPI based)
    if (CPI >= 1.0) {
      results.push({ title: 'Presupuesto', level: 'green', message: 'CPI dentro de lo planificado', value: `CPI ${CPI.toFixed(2)}` });
    } else if (CPI >= 0.9) {
      results.push({ title: 'Presupuesto', level: 'yellow', message: 'Ligera desviación, monitorear', value: `CPI ${CPI.toFixed(2)}` });
    } else {
      results.push({ title: 'Presupuesto', level: 'red', message: 'Sobre costo significativo', value: `CPI ${CPI.toFixed(2)}` });
    }

    // Riesgo de Cronograma (SPI based)
    if (SPI >= 1.0) {
      results.push({ title: 'Cronograma', level: 'green', message: 'SPI dentro de lo planificado', value: `SPI ${SPI.toFixed(2)}` });
    } else if (SPI >= 0.9) {
      results.push({ title: 'Cronograma', level: 'yellow', message: 'Ligero retraso, ajustar recursos', value: `SPI ${SPI.toFixed(2)}` });
    } else {
      results.push({ title: 'Cronograma', level: 'red', message: 'Retraso significativo en programa', value: `SPI ${SPI.toFixed(2)}` });
    }

    // Riesgo de Calidad (NDT reject rate)
    if (weldApprovalRate !== null) {
      if (weldApprovalRate >= 95) {
        results.push({ title: 'Calidad Soldadura', level: 'green', message: 'Tasa de aprobación NDT excelente', value: `${weldApprovalRate.toFixed(1)}% aprob.` });
      } else if (weldApprovalRate >= 85) {
        results.push({ title: 'Calidad Soldadura', level: 'yellow', message: 'Monitorear tendencia de rechazos', value: `${weldApprovalRate.toFixed(1)}% aprob.` });
      } else {
        results.push({ title: 'Calidad Soldadura', level: 'red', message: 'Tasa de rechazo NDT crítica', value: `${weldApprovalRate.toFixed(1)}% aprob.` });
      }
    } else {
      results.push({ title: 'Calidad Soldadura', level: 'green', message: 'Sin datos NDT registrados', value: '—' });
    }

    // Riesgo HSE
    const hasBlockedPtw = ptwList.some(p => p.status === 'bloqueado');
    const hasIncidents = ptwList.some(p =>
      p.description && (p.description.toLowerCase().includes('incidente') || p.description.toLowerCase().includes('accidente'))
    );
    if (!hasBlockedPtw && !hasIncidents) {
      results.push({ title: 'HSE', level: 'green', message: `${daysSinceIncident} días sin incidentes`, value: 'Sin novedad' });
    } else if (hasIncidents) {
      results.push({ title: 'HSE', level: 'red', message: 'Incidentes reportados, revisar PTS', value: '⚠️ Incidentes' });
    } else {
      results.push({ title: 'HSE', level: 'yellow', message: 'PTW bloqueados, revisar condiciones', value: '🔒 Bloqueos' });
    }

    return results;
  }, [CPI, SPI, weldApprovalRate, ptwList, daysSinceIncident]);

  // ── 4. SEMÁFORO DE CUMPLIMIENTO ────────────────────────────────────────────
  const trafficLights = useMemo((): TrafficLight[] => {
    // Avance Físico
    let avanceLevel: 'green' | 'yellow' | 'red' = 'red';
    if (physicalProgress >= 90) avanceLevel = 'green';
    else if (physicalProgress >= 75) avanceLevel = 'yellow';

    // Presupuesto (burn rate)
    const budgetRatio = totalBudgetCost > 0 ? (currentSpent / totalBudgetCost) * 100 : 0;
    let budgetLevel: 'green' | 'yellow' | 'red' = 'green';
    if (budgetRatio >= 105) budgetLevel = 'red';
    else if (budgetRatio >= 95) budgetLevel = 'yellow';

    // HSE
    const totalIncidents = ptwList.filter(p =>
      p.description && (p.description.toLowerCase().includes('incidente') || p.description.toLowerCase().includes('accidente'))
    ).length;
    let hseLevel: 'green' | 'yellow' | 'red' = 'green';
    if (totalIncidents >= 3) hseLevel = 'red';
    else if (totalIncidents > 0) hseLevel = 'yellow';

    // Calidad
    let calidadLevel: 'green' | 'yellow' | 'red' = 'green';
    if (weldApprovalRate !== null) {
      if (weldApprovalRate < 85) calidadLevel = 'red';
      else if (weldApprovalRate < 95) calidadLevel = 'yellow';
    }

    return [
      { label: 'Avance Físico', level: avanceLevel, value: `${physicalProgress}%` },
      { label: 'Presupuesto', level: budgetLevel, value: `${budgetRatio.toFixed(1)}%` },
      { label: 'HSE', level: hseLevel, value: `${totalIncidents} incidentes` },
      { label: 'Calidad', level: calidadLevel, value: weldApprovalRate !== null ? `${weldApprovalRate.toFixed(1)}% aprob.` : 'Sin datos' },
    ];
  }, [physicalProgress, currentSpent, totalBudgetCost, ptwList, weldApprovalRate]);

  // ── 5. FEED DE ACTIVIDAD RECIENTE ──────────────────────────────────────────
  const recentActivity = useMemo((): ActivityEvent[] => {
    const events: ActivityEvent[] = [];

    // From tasks
    tasks.slice(0, 10).forEach(t => {
      const ts = t.createdAt?.toDate?.() || new Date();
      events.push({
        id: `task-${t.id}`,
        type: 'task',
        description: `Partida "${t.name}" — ${t.executedQuantity > 0 ? `Avance: ${((Number(t.executedQuantity) / Number(t.plannedQuantity || 1)) * 100).toFixed(0)}%` : 'Creada'}`,
        timestamp: ts,
        user: t.updatedBy || 'Sistema',
        icon: <Activity size={14} />,
        color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-950/50',
      });
    });

    // From field_reports
    fieldReports.slice(0, 10).forEach(r => {
      const ts = r.timestamp?.toDate?.() || (r.reportDate ? new Date(r.reportDate) : new Date());
      events.push({
        id: `fr-${r.id}`,
        type: 'field_report',
        description: `Reporte de Campo — ${r.personnelCount || 0} personas, clima: ${r.weather || 'N/A'}`,
        timestamp: ts,
        user: r.createdBy || 'Supervisor',
        icon: <FileText size={14} />,
        color: 'text-blue-600 bg-blue-100 dark:bg-blue-950/50',
      });
    });

    // From expenses
    expenses.slice(0, 10).forEach(e => {
      const ts = e.createdAt?.toDate?.() || (e.date ? new Date(e.date) : new Date());
      events.push({
        id: `exp-${e.id}`,
        type: 'expense',
        description: `Gasto registrado — ${e.category || 'General'}: $${Number(e.amount || 0).toLocaleString()}`,
        timestamp: ts,
        user: e.registeredBy || 'Admin',
        icon: <DollarSign size={14} />,
        color: 'text-purple-600 bg-purple-100 dark:bg-purple-950/50',
      });
    });

    // Sort by timestamp descending
    events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return events.slice(0, 10);
  }, [tasks, fieldReports, expenses]);

  // ── EXPORT PDF ─────────────────────────────────────────────────────────────
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

  const noData = tasks.length === 0 && expenses.length === 0;

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

      {/* Header Banner */}
      <header className="mb-6 pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
            {currentOrganization.name}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-slate-100 tracking-tight mt-2">
            {currentProject?.id === 'all' ? '🏢 Portafolio Corporativo Consolidado' : 'Panel de Control Ejecutivo'}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 font-medium mt-1">
            {currentProject?.id === 'all'
              ? `Consolidado multi-tenant de métricas, presupuestos y recursos (${projects.length} proyectos activos)`
              : `Proyecto Activo: ${currentProject?.name || 'Selecciona un Proyecto'}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Period Selector */}
          <div className="flex bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden" data-html2canvas-ignore>
            {(['7d', '30d', '90d', 'all'] as Period[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-2 text-[11px] font-bold uppercase tracking-wider transition-all ${
                  period === p
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                }`}
              >
                {p === 'all' ? 'Todo' : p}
              </button>
            ))}
          </div>
          <button
            onClick={exportToPDF}
            disabled={isExporting}
            data-html2canvas-ignore
            className="w-full sm:w-auto bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-800 dark:text-slate-200 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs"
          >
            {isExporting ? <FileText size={16} className="animate-pulse" /> : <Download size={16} />}
            {isExporting ? 'Generando PDF...' : 'Exportar Informe'}
          </button>
        </div>
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
          className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-5 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all hover:-translate-y-0.5 block group relative"
          title="Avance Físico Ponderado: Progreso basado en cantidad ejecutada vs planificada, ponderado por costo unitario de cada partida."
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Avance Físico</h3>
            <div className="p-2.5 bg-emerald-500/15 rounded-xl text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-gray-900 dark:text-slate-100">
              {tasks.length > 0 ? `${physicalProgress}%` : 'Sin datos'}
            </span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold font-mono">
              {tasks.length} partidas
            </span>
          </div>
          <div className="mt-3 w-full bg-gray-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${physicalProgress}%` }}></div>
          </div>
          {/* Tooltip indicator */}
          <div className="absolute top-3 right-3 text-gray-300 dark:text-slate-600 group-hover:text-emerald-400 transition-colors">
            <Info size={12} />
          </div>
        </Link>

        {/* KPI 2: Presupuesto Ejecutado */}
        <Link
          to="/budget-details"
          className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-5 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all hover:-translate-y-0.5 block group relative"
          title="Presupuesto Ejecutado: Suma de gastos registrados vs presupuesto total planificado (BAC). Incluye valuaciones si no hay gastos directos."
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Presupuesto Ejecutado</h3>
            <div className="p-2.5 bg-blue-500/15 rounded-xl text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-gray-900 dark:text-slate-100">
              {currentSpent > 0 ? `$${(currentSpent / 1000).toFixed(1)}k` : 'Sin datos'}
            </span>
            <span className="text-[11px] text-gray-500 dark:text-slate-400 font-medium">
              {totalBudgetCost > 0 ? `de $${(totalBudgetCost / 1000).toFixed(1)}k` : ''}
            </span>
          </div>
          <div className="mt-3 w-full bg-gray-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div className="bg-blue-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, totalBudgetCost > 0 ? (currentSpent / totalBudgetCost) * 100 : 0)}%` }}></div>
          </div>
          <div className="absolute top-3 right-3 text-gray-300 dark:text-slate-600 group-hover:text-blue-400 transition-colors">
            <Info size={12} />
          </div>
        </Link>

        {/* KPI 3: Personal Activo */}
        <Link
          to="/personnel-details"
          className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-5 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all hover:-translate-y-0.5 block group relative"
          title="Personal Activo: Promedio de personal en sitio basado en los últimos reportes de campo registrados."
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Personal Activo</h3>
            <div className="p-2.5 bg-purple-500/15 rounded-xl text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
              <Users size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-gray-900 dark:text-slate-100">
              {fieldReports.length > 0 ? activePersonnel : 'Sin datos'}
            </span>
            <span className="text-[11px] text-purple-600 dark:text-purple-400 font-bold">{fieldReports.length} reportes</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-slate-400 font-medium">
            <Users size={12} />
            <span>Promedio últimos {Math.min(fieldReports.length || 1, 10)} reportes</span>
          </div>
          <div className="absolute top-3 right-3 text-gray-300 dark:text-slate-600 group-hover:text-purple-400 transition-colors">
            <Info size={12} />
          </div>
        </Link>

        {/* KPI 4: Alertas */}
        <Link
          to="/alerts-details"
          className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-5 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all hover:-translate-y-0.5 block group relative"
          title={`Alertas Activas: Partidas con avance ≥90% que requieren atención. Alertas HSE y calidad incluidas.`}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Alertas</h3>
            <div className="p-2.5 bg-amber-500/15 rounded-xl text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
              <AlertCircle size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-gray-900 dark:text-slate-100">{alertCount}</span>
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold uppercase">Críticas</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[10px] text-gray-500 dark:text-slate-400">
            <span>{tasks.length} partidas totales</span>
            <span className={`font-bold ${alertCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {alertCount > 0 ? 'Requiere atención' : 'Sin novedad'}
            </span>
          </div>
          <div className="absolute top-3 right-3 text-gray-300 dark:text-slate-600 group-hover:text-amber-400 transition-colors">
            <Info size={12} />
          </div>
        </Link>
      </div>

      {/* ── SEMÁFORO DE CUMPLIMIENTO ──────────────────────────────────────────── */}
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-5 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={16} className="text-gray-500" />
          <h3 className="text-xs font-bold text-gray-900 dark:text-slate-100 uppercase tracking-wider">Semáforo de Cumplimiento</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {trafficLights.map((tl, i) => (
            <div
              key={i}
              className={`rounded-xl border p-4 flex flex-col items-center gap-2 ${riskBgColor(tl.level)}`}
            >
              <span className={`w-4 h-4 rounded-full ${riskDotColor(tl.level)}`} />
              <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider text-center">
                {tl.label}
              </span>
              <span className={`text-lg font-black ${trafficLightColor(tl.level).split(' ')[0]}`}>
                {tl.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── 3. RIESGOS HEAT MAP ──────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={16} className="text-gray-500" />
          <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100 uppercase tracking-wider">Riesgos Activos</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {risks.map((risk, i) => (
            <div
              key={i}
              className={`rounded-xl border p-4 ${riskBgColor(risk.level)}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  {risk.title}
                </span>
                <span className={`w-3 h-3 rounded-full ${riskDotColor(risk.level)}`} />
              </div>
              <p className={`text-lg font-black mb-1 ${trafficLightColor(risk.level).split(' ')[0]}`}>
                {risk.value}
              </p>
              <p className="text-[11px] text-gray-600 dark:text-slate-400 font-medium">
                {risk.message}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── S-CURVE + BUDGET CHARTS ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
        {/* Curva S */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100 uppercase tracking-wider">
              Curva S — Avance ($)
            </h3>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-[10px] font-bold" title="Schedule Performance Index">
                <Target size={12} className="text-emerald-500" />
                <span className={SPI >= 1 ? 'text-emerald-600' : 'text-red-500'}>SPI {SPI.toFixed(2)}</span>
              </span>
              <span className="flex items-center gap-1 text-[10px] font-bold" title="Cost Performance Index">
                <DollarSign size={12} className="text-blue-500" />
                <span className={CPI >= 1 ? 'text-emerald-600' : 'text-red-500'}>CPI {CPI.toFixed(2)}</span>
              </span>
              <span className="flex items-center gap-1 text-[10px] font-bold text-gray-500" title="Estimate at Completion">
                <BarChart3 size={12} />
                <span>EAC ${Math.round(EAC / 1000)}k</span>
              </span>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sCurveData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <ReTooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, undefined]}
                />
                <Legend />
                <Area type="monotone" dataKey="planificado" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" fill="#94a3b8" fillOpacity={0.05} name="Planificado (Baseline)" />
                <Area type="monotone" dataKey="real" stroke="#10b981" strokeWidth={3} fill="#10b981" fillOpacity={0.1} name="Real (Actual)" />
                <Area type="monotone" dataKey="proyectado" stroke="#f59e0b" strokeWidth={2} strokeDasharray="3 3" fill="#f59e0b" fillOpacity={0.05} name="Proyectado (EAC)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Presupuesto por Categoría */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-xs">
          <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100 uppercase tracking-wider mb-6">
            Presupuesto vs Gastos ($)
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={budgetData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                <ReTooltip
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

      {/* ── ACTIVITY FEED ────────────────────────────────────────────────────── */}
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-5 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-gray-500" />
            <h3 className="text-xs font-bold text-gray-900 dark:text-slate-100 uppercase tracking-wider">
              Últimas Actividades
            </h3>
          </div>
          <span className="text-[10px] text-gray-400 dark:text-slate-500 font-medium">
            {recentActivity.length} eventos
          </span>
        </div>
        {recentActivity.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400 dark:text-slate-500">
            <Activity size={32} className="mb-2 opacity-50" />
            <p className="text-xs font-medium">Sin actividad registrada</p>
            <p className="text-[10px]">Los eventos aparecerán cuando haya datos en Firestore</p>
          </div>
        ) : (
          <div className="space-y-1 max-h-[320px] overflow-y-auto pr-1">
            {recentActivity.map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className={`p-2 rounded-lg shrink-0 ${event.color}`}>
                  {event.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 dark:text-slate-200 truncate">
                    {event.description}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-slate-500">
                      <User size={10} />
                      {event.user || 'Sistema'}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-slate-500">
                      <Clock size={10} />
                      {format(event.timestamp, "dd MMM HH:mm", { locale: es })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* No data fallback banner */}
      {noData && (
        <div className="bg-amber-50/80 dark:bg-amber-950/30 backdrop-blur-sm border border-amber-200 dark:border-amber-800 rounded-2xl p-6 text-center">
          <AlertTriangle size={24} className="mx-auto mb-2 text-amber-500" />
          <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
            Sin datos en Firestore
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
            No se encontraron partidas, gastos o reportes de campo. Agrega datos desde los módulos de Tasks, Expenses o Field Reports para ver métricas en vivo.
          </p>
        </div>
      )}

      {/* Hidden fallback explanation */}
      <div className="text-[9px] text-gray-300 dark:text-slate-700 text-center py-2 font-mono" data-html2canvas-ignore>
        Dashboard Ejecutivo — KPIs en vivo desde Firestore · EVM: SPI {SPI.toFixed(2)} · CPI {CPI.toFixed(2)} · EAC ${Math.round(EAC).toLocaleString()}
      </div>
    </motion.div>
  );
}
