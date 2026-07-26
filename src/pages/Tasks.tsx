import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, query, onSnapshot, addDoc, updateDoc, doc, deleteDoc, where 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { 
  Plus, CheckCircle2, Circle, Upload, LayoutList, CalendarDays, Edit2, Trash2, 
  Activity, AlertTriangle, Sparkles, X, Loader2, FileCode, Kanban as KanbanIcon, 
  Search, Filter, ShieldAlert, ArrowRight, Layers, UserCheck, HardHat, Check, Clock, ChevronRight
} from 'lucide-react';
import { XMLParser } from 'fast-xml-parser';
import { motion, AnimatePresence } from 'motion/react';
import { callGeminiProxy } from '../lib/geminiProxy';
import { useProject } from '../ProjectContext';
import { parseXerFile, parseBc3File, syncImportedTasksToFirestore } from '../lib/parsers';

// Import UI Primitives
import { 
  Button, 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  MetricCard, 
  StatusBadge, 
  Dialog, 
  Input, 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell, 
  EmptyState, 
  Skeleton 
} from '../components/ui';

export type TaskStatus = 'planificada' | 'en_campo' | 'en_revision' | 'bloqueada' | 'terminada';
export type TaskPriority = 'critica' | 'alta' | 'media' | 'baja';

export interface TaskItem {
  id: string;
  projectId: string;
  code: string;
  name: string;
  unit: string;
  plannedQuantity: number;
  executedQuantity: number;
  unitCost: number;
  status: TaskStatus;
  priority: TaskPriority;
  frente?: string;
  assignedTo?: string;
  startDate?: string;
  endDate?: string;
  blockedReason?: string;
  updatedAt?: string;
}

const KANBAN_COLUMNS: { id: TaskStatus; title: string; subtitle: string; icon: any; color: string; border: string }[] = [
  { 
    id: 'planificada', 
    title: 'Planificadas', 
    subtitle: 'Partidas listadas en WBS', 
    icon: Circle, 
    color: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300', 
    border: 'border-slate-300 dark:border-slate-700' 
  },
  { 
    id: 'en_campo', 
    title: 'En Campo / Ejecución', 
    subtitle: 'Cuadrilla activa en sitio', 
    icon: HardHat, 
    color: 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300', 
    border: 'border-indigo-400 dark:border-indigo-700' 
  },
  { 
    id: 'en_revision', 
    title: 'En Revisión / QA-QC', 
    subtitle: 'Liberación e inspección', 
    icon: Activity, 
    color: 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300', 
    border: 'border-purple-400 dark:border-purple-700' 
  },
  { 
    id: 'bloqueada', 
    title: 'Bloqueada / Restricción', 
    subtitle: 'Permisos, clima o materiales', 
    icon: ShieldAlert, 
    color: 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300', 
    border: 'border-red-400 dark:border-red-700' 
  },
  { 
    id: 'terminada', 
    title: 'Terminadas', 
    subtitle: 'Cómputo 100% verificado', 
    icon: CheckCircle2, 
    color: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300', 
    border: 'border-emerald-400 dark:border-emerald-700' 
  }
];

export default function Tasks() {
  const { currentProject } = useProject();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Views
  const [viewMode, setViewMode] = useState<'kanban' | 'list' | 'gantt'>('kanban');
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [isBlockReasonModalOpen, setIsBlockReasonModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterFrente, setFilterFrente] = useState<string>('all');
  const [onlyBlocked, setOnlyBlocked] = useState(false);

  // Form States
  const [newTask, setNewTask] = useState<{
    code: string;
    name: string;
    unit: string;
    plannedQuantity: string;
    unitCost: string;
    status: TaskStatus;
    priority: TaskPriority;
    frente: string;
    assignedTo: string;
  }>({
    code: '',
    name: '',
    unit: 'm2',
    plannedQuantity: '',
    unitCost: '',
    status: 'planificada',
    priority: 'media',
    frente: 'Frente A - Principal',
    assignedTo: 'Ing. Supervisor'
  });

  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [progressTask, setProgressTask] = useState<TaskItem | null>(null);
  const [pendingBlockTask, setPendingBlockTask] = useState<TaskItem | null>(null);
  const [blockReasonInput, setBlockReasonInput] = useState('');

  // Drag & Drop visual states
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  // Progress computation input
  const [compLength, setCompLength] = useState<number>(0);
  const [compWidth, setCompWidth] = useState<number>(0);
  const [compHeight, setCompHeight] = useState<number>(0);
  const [compQuantity, setCompQuantity] = useState<number>(0);

  // AI State
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const xerFileInputRef = useRef<HTMLInputElement>(null);
  const bc3FileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!currentProject) {
      setTasks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, 'tasks'),
      where('projectId', '==', currentProject.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tsks = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as TaskItem[];
      
      setTasks(tsks);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'tasks');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentProject]);

  // Handle Drag & Drop move status
  const handleMoveStatus = async (taskId: string, targetStatus: TaskStatus, reason?: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // If moving to blocked and no reason given, open modal
    if (targetStatus === 'bloqueada' && !reason && !task.blockedReason) {
      setPendingBlockTask(task);
      setBlockReasonInput('');
      setIsBlockReasonModalOpen(true);
      return;
    }

    try {
      const updateData: Partial<TaskItem> = {
        status: targetStatus,
        updatedAt: new Date().toISOString()
      };

      if (targetStatus === 'bloqueada') {
        updateData.blockedReason = reason || task.blockedReason || 'Restricción de campo reportada por supervisor';
      } else {
        updateData.blockedReason = '';
      }

      await updateDoc(doc(db, 'tasks', taskId), updateData);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tasks/${taskId}`);
    }
  };

  const handleConfirmBlockReason = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingBlockTask) return;
    await handleMoveStatus(pendingBlockTask.id, 'bloqueada', blockReasonInput || 'Sin especificar');
    setIsBlockReasonModalOpen(false);
    setPendingBlockTask(null);
    setBlockReasonInput('');
  };

  // Create Task
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject) return;

    try {
      await addDoc(collection(db, 'tasks'), {
        projectId: currentProject.id,
        code: newTask.code,
        name: newTask.name,
        unit: newTask.unit,
        plannedQuantity: Number(newTask.plannedQuantity),
        executedQuantity: 0,
        unitCost: Number(newTask.unitCost),
        status: newTask.status,
        priority: newTask.priority,
        frente: newTask.frente,
        assignedTo: newTask.assignedTo,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });

      setIsModalOpen(false);
      setNewTask({
        code: '',
        name: '',
        unit: 'm2',
        plannedQuantity: '',
        unitCost: '',
        status: 'planificada',
        priority: 'media',
        frente: 'Frente A - Principal',
        assignedTo: 'Ing. Supervisor'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'tasks');
    }
  };

  // Update Task
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;

    try {
      await updateDoc(doc(db, 'tasks', editingTask.id), {
        code: editingTask.code,
        name: editingTask.name,
        unit: editingTask.unit,
        plannedQuantity: Number(editingTask.plannedQuantity),
        unitCost: Number(editingTask.unitCost),
        status: editingTask.status,
        priority: editingTask.priority,
        frente: editingTask.frente || 'General',
        assignedTo: editingTask.assignedTo || 'Unassigned'
      });
      setIsEditModalOpen(false);
      setEditingTask(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tasks/${editingTask.id}`);
    }
  };

  // Delete Task
  const handleDelete = async (taskId: string) => {
    if (window.confirm('¿Estás seguro de eliminar esta partida de la WBS?')) {
      try {
        await deleteDoc(doc(db, 'tasks', taskId));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `tasks/${taskId}`);
      }
    }
  };

  // Save Progress
  const openProgressModal = (task: TaskItem) => {
    setProgressTask(task);
    setCompLength(0);
    setCompWidth(0);
    setCompHeight(0);
    setCompQuantity(0);
    setIsProgressModalOpen(true);
  };

  const calculateProgressQuantity = () => {
    if (!progressTask) return 0;
    if (progressTask.unit === 'm2') return compLength * compWidth;
    if (progressTask.unit === 'm3') return compLength * compWidth * compHeight;
    if (progressTask.unit === 'ml') return compLength;
    return compQuantity;
  };

  const handleSaveProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!progressTask) return;

    const added = calculateProgressQuantity();
    const newExecuted = (progressTask.executedQuantity || 0) + added;
    const isCompletedNow = newExecuted >= progressTask.plannedQuantity;

    try {
      await updateDoc(doc(db, 'tasks', progressTask.id), {
        executedQuantity: newExecuted,
        status: isCompletedNow ? 'terminada' : progressTask.status === 'planificada' ? 'en_campo' : progressTask.status,
        updatedAt: new Date().toISOString()
      });

      setIsProgressModalOpen(false);
      setProgressTask(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tasks/${progressTask.id}`);
    }
  };

  // Import handlers
  const handleImportMSProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentProject) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const xmlData = evt.target?.result as string;
        const parser = new XMLParser({ ignoreAttributes: false });
        const result = parser.parse(xmlData);

        const projectTasks = result.Project?.Tasks?.Task || [];
        const tasksArray = Array.isArray(projectTasks) ? projectTasks : [projectTasks];

        for (const t of tasksArray) {
          if (t.Name && t.Name !== 'Project Summary Task') {
            await addDoc(collection(db, 'tasks'), {
              projectId: currentProject.id,
              code: `MSP-${Math.floor(100 + Math.random() * 900)}`,
              name: t.Name,
              unit: 'glb',
              plannedQuantity: 1,
              executedQuantity: t.PercentComplete ? Number(t.PercentComplete) / 100 : 0,
              unitCost: 1000,
              status: t.PercentComplete === 100 ? 'terminada' : t.PercentComplete > 0 ? 'en_campo' : 'planificada',
              priority: 'media',
              frente: 'Importado MSP',
              startDate: t.Start ? t.Start.split('T')[0] : new Date().toISOString().split('T')[0],
              endDate: t.Finish ? t.Finish.split('T')[0] : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            });
          }
        }
        alert('Partidas de MS Project importadas exitosamente.');
      } catch (error) {
        console.error("Error parsing MS Project XML:", error);
        alert('Error al procesar el archivo XML de MS Project.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImportXer = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentProject) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const xerContent = evt.target?.result as string;
        const parsed = parseXerFile(xerContent);
        if (parsed.length === 0) {
          alert('No se encontraron actividades válidas en Primavera P6 (.xer).');
          return;
        }

        const { successCount } = await syncImportedTasksToFirestore(
          parsed,
          currentProject.id,
          'default_org',
          'Primavera P6 (.xer)'
        );

        alert(`Sincronizadas ${successCount} partidas desde Primavera P6 (.xer)`);
      } catch (error) {
        console.error("Error XER:", error);
        alert('Error al procesar el archivo Primavera P6 (.xer)');
      }
    };
    reader.readAsText(file);
    if (xerFileInputRef.current) xerFileInputRef.current.value = '';
  };

  const handleImportBc3 = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentProject) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bc3Content = evt.target?.result as string;
        const parsed = parseBc3File(bc3Content);
        if (parsed.length === 0) {
          alert('No se encontraron partidas válidas en .bc3 FIEBDC-3');
          return;
        }

        const { successCount } = await syncImportedTasksToFirestore(
          parsed,
          currentProject.id,
          'default_org',
          'Presupuesto BC3'
        );

        alert(`Sincronizadas ${successCount} partidas de Presupuesto FIEBDC-3 (.bc3)`);
      } catch (error) {
        console.error("Error BC3:", error);
        alert('Error al procesar el archivo .bc3');
      }
    };
    reader.readAsText(file);
    if (bc3FileInputRef.current) bc3FileInputRef.current.value = '';
  };

  // Ask AI Assistant
  const handleAskAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;

    setIsAiLoading(true);
    setAiResponse('');

    try {
      const taskSummary = tasks.map(t => 
        `- [${t.code || 'PARTIDA'}] ${t.name}: Estado: ${t.status}, Prioridad: ${t.priority || 'media'}, Plan: ${t.plannedQuantity} ${t.unit}, Ejecutado: ${t.executedQuantity} ${t.unit}, Frente: ${t.frente || 'N/A'}${t.blockedReason ? `, BLOQUEO: ${t.blockedReason}` : ''}`
      ).join('\n');

      const prompt = `Eres el copiloto experto en dirección de obra e ingeniería de proyectos industriales de Industrial Control 360.
Analiza la siguiente WBS de partidas del proyecto actual:
${taskSummary}

Pregunta del usuario: ${aiQuery}

Genera una respuesta ejecutiva, estructurada con puntos de acción para el gerente de obra. Cita normativas o mejores prácticas si aplica.`;

      const response = await callGeminiProxy({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      setAiResponse(response.text || 'No se pudo generar análisis.');
    } catch (err) {
      console.error(err);
      setAiResponse('Error al comunicarse con el copiloto de IA.');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Filter Tasks
  const filteredTasks = tasks.filter(t => {
    const matchesSearch = 
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.code && t.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.frente && t.frente.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesPriority = filterPriority === 'all' || (t.priority || 'media') === filterPriority;
    const matchesFrente = filterFrente === 'all' || (t.frente || 'General') === filterFrente;
    const matchesBlocked = !onlyBlocked || t.status === 'bloqueada';

    return matchesSearch && matchesPriority && matchesFrente && matchesBlocked;
  });

  // Calculate Metrics
  const totalTasks = tasks.length;
  const blockedTasksCount = tasks.filter(t => t.status === 'bloqueada').length;
  const completedTasksCount = tasks.filter(t => t.status === 'terminada').length;

  const totalPlannedBudget = tasks.reduce((sum, t) => sum + ((t.plannedQuantity || 0) * (t.unitCost || 0)), 0);
  const totalExecutedBudget = tasks.reduce((sum, t) => sum + ((t.executedQuantity || 0) * (t.unitCost || 0)), 0);

  const globalAdvancePercent = totalPlannedBudget > 0 
    ? Math.min(100, (totalExecutedBudget / totalPlannedBudget) * 100) 
    : totalTasks > 0 
    ? (completedTasksCount / totalTasks) * 100 
    : 0;

  // Extract unique frentes
  const uniqueFrentes = Array.from(new Set(tasks.map(t => t.frente || 'General'))).filter(Boolean);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-12"
    >
      {/* Hidden File Inputs */}
      <input type="file" accept=".xml" ref={fileInputRef} onChange={handleImportMSProject} className="hidden" />
      <input type="file" accept=".xer" ref={xerFileInputRef} onChange={handleImportXer} className="hidden" />
      <input type="file" accept=".bc3" ref={bc3FileInputRef} onChange={handleImportBc3} className="hidden" />

      {/* HEADER SECTION */}
      <div className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 p-6 sm:p-8 rounded-3xl border border-white/80 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-mono font-bold uppercase tracking-wider mb-2">
            <KanbanIcon size={16} /> Work Board Operativo • Control de WBS & Campo
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Tablero Colaborativo de Partidas & Avance
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl font-medium">
            Gestión en tiempo real de frentes de obra, liberaciones de calidad, alertas de restricción e importaciones de Primavera P6 y FIEBDC-3.
          </p>
        </div>

        {/* Top Action Bar */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Button
            variant="accent"
            leftIcon={<Sparkles size={16} />}
            onClick={() => setIsAiModalOpen(true)}
          >
            Copiloto IA
          </Button>

          <Button
            variant="outline"
            leftIcon={<FileCode size={16} className="text-blue-600 dark:text-blue-400" />}
            onClick={() => xerFileInputRef.current?.click()}
            title="Importar Primavera P6 (.xer)"
          >
            Primavera (.xer)
          </Button>

          <Button
            variant="outline"
            leftIcon={<FileCode size={16} className="text-amber-600 dark:text-amber-400" />}
            onClick={() => bc3FileInputRef.current?.click()}
            title="Importar Presupuesto BC3"
          >
            FIEBDC-3 (.bc3)
          </Button>

          <Button
            variant="primary"
            leftIcon={<Plus size={18} />}
            onClick={() => setIsModalOpen(true)}
          >
            Nueva Partida
          </Button>
        </div>
      </div>

      {/* METRICS SUMMARY ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Partidas Totales WBS"
          value={totalTasks}
          sublabel={`${completedTasksCount} terminadas (${globalAdvancePercent.toFixed(1)}%)`}
          icon={<Layers size={22} />}
          accentColor="indigo"
        />

        <MetricCard
          title="Avance Físico Global"
          value={`${globalAdvancePercent.toFixed(1)}%`}
          sublabel={`Valorizado en $${totalExecutedBudget.toLocaleString('en-US', { minimumFractionDigits: 0 })}`}
          trend={{ direction: globalAdvancePercent > 50 ? 'up' : 'neutral', value: `${completedTasksCount}/${totalTasks}` }}
          icon={<Activity size={22} />}
          accentColor="emerald"
        />

        <MetricCard
          title="Presupuesto Ejecutado"
          value={`$${totalExecutedBudget.toLocaleString('en-US', { minimumFractionDigits: 0 })}`}
          sublabel={`Total WBS: $${totalPlannedBudget.toLocaleString('en-US', { minimumFractionDigits: 0 })}`}
          icon={<Clock size={22} />}
          accentColor="cyan"
        />

        <MetricCard
          title="Partidas Bloqueadas"
          value={blockedTasksCount}
          sublabel={blockedTasksCount > 0 ? "Requieren atención de campo" : "Sin restricciones de obra"}
          trend={{ direction: blockedTasksCount > 0 ? 'down' : 'neutral', value: `${blockedTasksCount} alertas` }}
          icon={<ShieldAlert size={22} />}
          accentColor={blockedTasksCount > 0 ? "amber" : "slate"}
        />
      </div>

      {/* VIEW SELECTOR & FILTER BAR */}
      <div className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 p-4 rounded-3xl border border-white/80 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        {/* Switch Views */}
        <div className="flex bg-slate-100/80 dark:bg-slate-800/80 p-1.5 rounded-2xl gap-1 overflow-x-auto">
          <button
            onClick={() => setViewMode('kanban')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
              viewMode === 'kanban' 
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <KanbanIcon size={16} /> Work Board (Kanban)
          </button>

          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
              viewMode === 'list' 
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <LayoutList size={16} /> WBS & Cómputos
          </button>

          <button
            onClick={() => setViewMode('gantt')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
              viewMode === 'gantt' 
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <CalendarDays size={16} /> Cronograma Gantt
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative min-w-[200px] flex-1 sm:flex-none">
            <Search size={14} className="absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar código, partida o frente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-medium outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Priority filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 outline-none"
          >
            <option value="all">Todas Prioridades</option>
            <option value="critica">🔴 Crítica</option>
            <option value="alta">🟠 Alta</option>
            <option value="media">🟡 Media</option>
            <option value="baja">🟢 Baja</option>
          </select>

          {/* Frente filter */}
          {uniqueFrentes.length > 0 && (
            <select
              value={filterFrente}
              onChange={(e) => setFilterFrente(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 outline-none"
            >
              <option value="all">Todos los Frentes</option>
              {uniqueFrentes.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          )}

          {/* Toggle Blocked */}
          <button
            onClick={() => setOnlyBlocked(!onlyBlocked)}
            className={`px-3 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
              onlyBlocked 
                ? 'bg-red-600 text-white shadow-xs' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <AlertTriangle size={14} />
            <span>Solo Bloqueadas</span>
          </button>
        </div>
      </div>

      {/* MAIN VIEW CONTENT */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      ) : filteredTasks.length === 0 && tasks.length === 0 ? (
        <EmptyState
          icon={<KanbanIcon size={40} className="text-indigo-500" />}
          title="No hay partidas cargadas en este proyecto"
          description="Inicia agregando una nueva partida a la WBS o importa el cronograma completo directamente desde Primavera P6 (.xer), FIEBDC-3 (.bc3) o MS Project (.xml)."
          actionLabel="Agregar Primera Partida"
          onAction={() => setIsModalOpen(true)}
          secondaryAction={
            <Button variant="outline" onClick={() => xerFileInputRef.current?.click()}>
              Importar Primavera P6
            </Button>
          }
        />
      ) : viewMode === 'kanban' ? (
        /* ================= KANBAN BOARD VIEW ================= */
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start overflow-x-auto pb-4">
          {KANBAN_COLUMNS.map((col) => {
            const ColumnIcon = col.icon;
            const columnTasks = filteredTasks.filter(t => (t.status || 'planificada') === col.id);

            const isOver = dragOverColumn === col.id;

            return (
              <div
                key={col.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                }}
                onDragEnter={() => setDragOverColumn(col.id)}
                onDragLeave={() => setDragOverColumn(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverColumn(null);
                  const taskId = e.dataTransfer.getData('taskId');
                  if (taskId) handleMoveStatus(taskId, col.id);
                }}
                className={`flex flex-col min-h-[500px] rounded-3xl p-3 sm:p-4 border transition-all duration-200 ${
                  isOver 
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 ring-4 ring-emerald-500/10' 
                    : 'bg-slate-100/60 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800'
                }`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800/80 mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className={`p-2 rounded-xl ${col.color} border ${col.border} shadow-2xs`}>
                      <ColumnIcon size={16} />
                    </span>
                    <div>
                      <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white tracking-tight">
                        {col.title}
                      </h3>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                        {col.subtitle}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-black px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {columnTasks.length}
                  </span>
                </div>

                {/* Column Cards Drop Zone */}
                <div className="flex-1 space-y-3">
                  <AnimatePresence>
                    {columnTasks.map((task) => {
                      const isDragging = draggedTaskId === task.id;
                      const progress = task.plannedQuantity > 0 ? (task.executedQuantity / task.plannedQuantity) * 100 : 0;
                      const totalTaskCost = (task.plannedQuantity || 0) * (task.unitCost || 0);

                      return (
                        <motion.div
                          key={task.id}
                          layout
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: isDragging ? 0.4 : 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          draggable
                          onDragStart={(e: any) => {
                            e.dataTransfer?.setData('taskId', task.id);
                            setDraggedTaskId(task.id);
                          }}
                          onDragEnd={() => setDraggedTaskId(null)}
                          className={`group relative p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700/80 shadow-xs hover:shadow-md transition-all cursor-grab active:cursor-grabbing space-y-3 ${
                            task.status === 'bloqueada' ? 'border-l-4 border-l-red-500' : ''
                          }`}
                        >
                          {/* Task Top Badges */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-[11px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-200/60 dark:border-indigo-800/60">
                              {task.code || 'N/A'}
                            </span>
                            <StatusBadge priority={task.priority || 'media'} size="sm" />
                          </div>

                          {/* Task Name */}
                          <div>
                            <h4 className="text-xs font-extrabold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                              {task.name}
                            </h4>
                            {task.frente && (
                              <span className="inline-block text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1">
                                📍 {task.frente}
                              </span>
                            )}
                          </div>

                          {/* Blocked Reason Alert */}
                          {task.status === 'bloqueada' && task.blockedReason && (
                            <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/80 border border-red-200 dark:border-red-800 text-[11px] text-red-900 dark:text-red-200 font-bold flex items-start gap-1.5">
                              <AlertTriangle size={14} className="shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
                              <span className="line-clamp-2">{task.blockedReason}</span>
                            </div>
                          )}

                          {/* Progress Bar */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-bold">
                              <span className="text-slate-500 dark:text-slate-400">
                                {task.executedQuantity.toFixed(1)} / {task.plannedQuantity} {task.unit}
                              </span>
                              <span className={progress >= 100 ? 'text-emerald-600 dark:text-emerald-400 font-black' : 'text-slate-700 dark:text-slate-300 font-black'}>
                                {progress.toFixed(0)}%
                              </span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  progress >= 100 
                                    ? 'bg-emerald-500' 
                                    : task.status === 'bloqueada' 
                                    ? 'bg-red-500' 
                                    : 'bg-indigo-500 dark:bg-emerald-500'
                                }`}
                                style={{ width: `${Math.min(progress, 100)}%` }}
                              />
                            </div>
                          </div>

                          {/* Footer Info & Quick Actions */}
                          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60 text-[11px]">
                            <span className="font-mono font-bold text-slate-500 dark:text-slate-400">
                              ${totalTaskCost.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                            </span>

                            <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => openProgressModal(task)}
                                className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-lg transition-colors cursor-pointer"
                                title="Registrar Avance de Cómputo"
                              >
                                <Activity size={15} />
                              </button>
                              <button
                                onClick={() => { setEditingTask(task); setIsEditModalOpen(true); }}
                                className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-lg transition-colors cursor-pointer"
                                title="Editar Partida"
                              >
                                <Edit2 size={15} />
                              </button>
                              <button
                                onClick={() => handleDelete(task.id)}
                                className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/60 rounded-lg transition-colors cursor-pointer"
                                title="Eliminar Partida"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {columnTasks.length === 0 && (
                    <div className="p-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                      Arrastra una partida aquí
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : viewMode === 'list' ? (
        /* ================= LIST / WBS TABLE VIEW ================= */
        <Card>
          <Table>
            <TableHeader>
              <TableHead>Código</TableHead>
              <TableHead>Descripción de la Partida WBS</TableHead>
              <TableHead>Frente</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-center">Planificado</TableHead>
              <TableHead className="text-center">Ejecutado</TableHead>
              <TableHead>Avance</TableHead>
              <TableHead className="text-right">P.U. ($)</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableHeader>
            <TableBody>
              {filteredTasks.map((task) => {
                const progress = task.plannedQuantity > 0 ? (task.executedQuantity / task.plannedQuantity) * 100 : 0;
                const isComplete = progress >= 100;

                return (
                  <TableRow key={task.id}>
                    <TableCell className="font-mono font-extrabold text-indigo-600 dark:text-indigo-400">
                      {task.code || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block line-clamp-2">
                          {task.name}
                        </span>
                        {task.blockedReason && (
                          <span className="text-[10px] text-red-600 dark:text-red-400 font-bold block mt-0.5">
                            ⚠️ Restricción: {task.blockedReason}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                        {task.frente || 'General'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={task.status} size="sm" />
                    </TableCell>
                    <TableCell className="text-center font-mono font-bold">
                      {task.plannedQuantity} {task.unit}
                    </TableCell>
                    <TableCell className="text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {(task.executedQuantity || 0).toFixed(2)} {task.unit}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 min-w-[120px]">
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${isComplete ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono font-extrabold text-slate-700 dark:text-slate-300">
                          {progress.toFixed(0)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold">
                      ${task.unitCost}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openProgressModal(task)}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-xl transition-colors cursor-pointer"
                          title="Registrar Cómputo"
                        >
                          <Activity size={16} />
                        </button>
                        <button
                          onClick={() => { setEditingTask(task); setIsEditModalOpen(true); }}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-xl transition-colors cursor-pointer"
                          title="Editar Partida"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(task.id)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/60 rounded-xl transition-colors cursor-pointer"
                          title="Eliminar Partida"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      ) : (
        /* ================= GANTT TIMELINE VIEW ================= */
        <Card className="p-6 overflow-x-auto">
          <div className="min-w-[800px] space-y-4">
            <div className="grid grid-cols-12 gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-3 text-xs font-extrabold uppercase text-slate-400 tracking-wider">
              <div className="col-span-4">Partida / WBS</div>
              <div className="col-span-8 flex justify-between">
                <span>Fecha Inicio</span>
                <span>Barra de Cronograma & Avance</span>
                <span>Fecha Fin</span>
              </div>
            </div>

            <div className="space-y-3">
              {filteredTasks.map((task) => {
                const progress = task.plannedQuantity > 0 ? (task.executedQuantity / task.plannedQuantity) * 100 : 0;
                return (
                  <div key={task.id} className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-black text-indigo-600 dark:text-indigo-400">
                          {task.code}
                        </span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate" title={task.name}>
                          {task.name}
                        </span>
                      </div>
                    </div>

                    <div className="col-span-8 relative h-9 bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden flex items-center px-3 text-xs font-bold">
                      <div
                        className={`absolute left-0 top-0 bottom-0 transition-all ${
                          task.status === 'bloqueada' ? 'bg-red-500/20 border-l-4 border-red-500' : 'bg-emerald-500/20 border-l-4 border-emerald-500'
                        }`}
                        style={{ width: `${Math.max(12, Math.min(progress, 100))}%` }}
                      >
                        <div className="h-full bg-emerald-500/30" style={{ width: `${Math.min(progress, 100)}%` }} />
                      </div>
                      <span className="relative z-10 w-full flex justify-between items-center text-slate-700 dark:text-slate-300">
                        <span>{task.startDate || 'Sin fecha'}</span>
                        <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">{progress.toFixed(0)}%</span>
                        <span>{task.endDate || 'Sin fecha'}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {/* CREATE NEW TASK MODAL */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Crear Nueva Partida de Obra (WBS)"
        description="Ingresa los datos técnicos y cómputos planificados para el control de la partida."
        maxWidth="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Código WBS / Norma (ej. PDVSA L-STC-001)"
              required
              value={newTask.code}
              onChange={e => setNewTask({ ...newTask, code: e.target.value })}
              placeholder="Ej: 100.1.1"
            />
            <Input
              label="Frente de Obra"
              required
              value={newTask.frente}
              onChange={e => setNewTask({ ...newTask, frente: e.target.value })}
              placeholder="Ej: Frente A - Soldadura Pipeline"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Descripción de la Partida
            </label>
            <textarea
              required
              rows={2}
              value={newTask.name}
              onChange={e => setNewTask({ ...newTask, name: e.target.value })}
              className="w-full p-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 font-medium outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Ej: Limpieza, sanreado y aplicación de recubrimiento tricapa de 24 pulgadas"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Unidad
              </label>
              <select
                value={newTask.unit}
                onChange={e => setNewTask({ ...newTask, unit: e.target.value })}
                className="w-full py-2.5 px-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 outline-none"
              >
                <option value="m2">m² (Área)</option>
                <option value="m3">m³ (Volumen)</option>
                <option value="ml">ml (Longitud)</option>
                <option value="kg">kg (Peso)</option>
                <option value="und">und (Unidad)</option>
                <option value="glb">glb (Global)</option>
              </select>
            </div>

            <Input
              label="Cant. Planificada"
              type="number"
              step="0.01"
              required
              value={newTask.plannedQuantity}
              onChange={e => setNewTask({ ...newTask, plannedQuantity: e.target.value })}
            />

            <Input
              label="Costo Unitario ($)"
              type="number"
              step="0.01"
              required
              value={newTask.unitCost}
              onChange={e => setNewTask({ ...newTask, unitCost: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Prioridad
              </label>
              <select
                value={newTask.priority}
                onChange={e => setNewTask({ ...newTask, priority: e.target.value as TaskPriority })}
                className="w-full py-2.5 px-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 outline-none"
              >
                <option value="critica">🔴 CRÍTICA</option>
                <option value="alta">🟠 ALTA</option>
                <option value="media">🟡 MEDIA</option>
                <option value="baja">🟢 BAJA</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Estado Inicial
              </label>
              <select
                value={newTask.status}
                onChange={e => setNewTask({ ...newTask, status: e.target.value as TaskStatus })}
                className="w-full py-2.5 px-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 outline-none"
              >
                <option value="planificada">📋 Planificada</option>
                <option value="en_campo">🚜 En Campo</option>
                <option value="en_revision">🔍 En Revisión</option>
                <option value="bloqueada">🛑 Bloqueada</option>
                <option value="terminada">✅ Terminada</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              Guardar Partida
            </Button>
          </div>
        </form>
      </Dialog>

      {/* EDIT TASK MODAL */}
      <Dialog
        isOpen={isEditModalOpen && !!editingTask}
        onClose={() => { setIsEditModalOpen(false); setEditingTask(null); }}
        title="Editar Partida WBS"
        description="Actualiza la información técnica y asignación de la partida."
        maxWidth="lg"
      >
        {editingTask && (
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Código WBS"
                required
                value={editingTask.code}
                onChange={e => setEditingTask({ ...editingTask, code: e.target.value })}
              />
              <Input
                label="Frente de Obra"
                value={editingTask.frente || ''}
                onChange={e => setEditingTask({ ...editingTask, frente: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Descripción de la Partida
              </label>
              <textarea
                required
                rows={2}
                value={editingTask.name}
                onChange={e => setEditingTask({ ...editingTask, name: e.target.value })}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 font-medium outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Unidad
                </label>
                <select
                  value={editingTask.unit}
                  onChange={e => setEditingTask({ ...editingTask, unit: e.target.value })}
                  className="w-full py-2.5 px-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 outline-none"
                >
                  <option value="m2">m² (Área)</option>
                  <option value="m3">m³ (Volumen)</option>
                  <option value="ml">ml (Longitud)</option>
                  <option value="kg">kg (Peso)</option>
                  <option value="und">und (Unidad)</option>
                  <option value="glb">glb (Global)</option>
                </select>
              </div>

              <Input
                label="Cant. Planificada"
                type="number"
                step="0.01"
                required
                value={editingTask.plannedQuantity}
                onChange={e => setEditingTask({ ...editingTask, plannedQuantity: Number(e.target.value) })}
              />

              <Input
                label="Costo Unitario ($)"
                type="number"
                step="0.01"
                required
                value={editingTask.unitCost}
                onChange={e => setEditingTask({ ...editingTask, unitCost: Number(e.target.value) })}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button variant="ghost" onClick={() => { setIsEditModalOpen(false); setEditingTask(null); }}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary">
                Actualizar Partida
              </Button>
            </div>
          </form>
        )}
      </Dialog>

      {/* PROGRESS REGISTRATION MODAL */}
      <Dialog
        isOpen={isProgressModalOpen && !!progressTask}
        onClose={() => { setIsProgressModalOpen(false); setProgressTask(null); }}
        title="Registrar Avance de Cómputos Métricos"
        description={progressTask?.name}
        maxWidth="md"
      >
        {progressTask && (
          <form onSubmit={handleSaveProgress} className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 flex justify-between items-center text-xs">
              <div>
                <p className="text-slate-400 uppercase font-bold text-[10px]">Planificado</p>
                <p className="font-extrabold text-slate-900 dark:text-white text-sm">
                  {progressTask.plannedQuantity} {progressTask.unit}
                </p>
              </div>
              <div className="text-right">
                <p className="text-slate-400 uppercase font-bold text-[10px]">Ejecutado Actual</p>
                <p className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                  {(progressTask.executedQuantity || 0).toFixed(2)} {progressTask.unit}
                </p>
              </div>
            </div>

            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Ingresa los cómputos de la jornada en campo:
            </p>

            {progressTask.unit === 'm3' && (
              <div className="grid grid-cols-3 gap-3">
                <Input label="Largo (m)" type="number" step="0.01" value={compLength || ''} onChange={e => setCompLength(Number(e.target.value))} />
                <Input label="Ancho (m)" type="number" step="0.01" value={compWidth || ''} onChange={e => setCompWidth(Number(e.target.value))} />
                <Input label="Alto (m)" type="number" step="0.01" value={compHeight || ''} onChange={e => setCompHeight(Number(e.target.value))} />
              </div>
            )}

            {progressTask.unit === 'm2' && (
              <div className="grid grid-cols-2 gap-3">
                <Input label="Largo (m)" type="number" step="0.01" value={compLength || ''} onChange={e => setCompLength(Number(e.target.value))} />
                <Input label="Ancho/Alto (m)" type="number" step="0.01" value={compWidth || ''} onChange={e => setCompWidth(Number(e.target.value))} />
              </div>
            )}

            {progressTask.unit === 'ml' && (
              <Input label="Longitud (m)" type="number" step="0.01" value={compLength || ''} onChange={e => setCompLength(Number(e.target.value))} />
            )}

            {['kg', 'und', 'glb'].includes(progressTask.unit) && (
              <Input label={`Cantidad (${progressTask.unit})`} type="number" step="0.01" value={compQuantity || ''} onChange={e => setCompQuantity(Number(e.target.value))} />
            )}

            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex justify-between items-center text-xs sm:text-sm font-bold text-emerald-900 dark:text-emerald-200">
              <span>Cantidad a sumar:</span>
              <span className="font-mono text-base font-black text-emerald-600 dark:text-emerald-400">
                +{calculateProgressQuantity().toFixed(2)} {progressTask.unit}
              </span>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button variant="ghost" onClick={() => { setIsProgressModalOpen(false); setProgressTask(null); }}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary">
                Validar y Guardar Avance
              </Button>
            </div>
          </form>
        )}
      </Dialog>

      {/* BLOCK REASON MODAL */}
      <Dialog
        isOpen={isBlockReasonModalOpen && !!pendingBlockTask}
        onClose={() => { setIsBlockReasonModalOpen(false); setPendingBlockTask(null); }}
        title="Reportar Bloqueo / Restricción de Campo"
        description={pendingBlockTask?.name}
        maxWidth="md"
      >
        <form onSubmit={handleConfirmBlockReason} className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Motivo del Bloqueo u Obstáculo
            </label>
            <textarea
              required
              rows={3}
              value={blockReasonInput}
              onChange={e => setBlockReasonInput(e.target.value)}
              placeholder="Ej: Retraso en permiso de trabajo PTW caliente por alta concentración de gas en fosa / Faltante de electrodos E-7018..."
              className="w-full p-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 font-medium outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="ghost" onClick={() => { setIsBlockReasonModalOpen(false); setPendingBlockTask(null); }}>
              Cancelar
            </Button>
            <Button type="submit" variant="danger">
              Marcar como Bloqueada
            </Button>
          </div>
        </form>
      </Dialog>

      {/* AI ASSISTANT MODAL */}
      <Dialog
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        title="Copiloto IA de Partidas WBS"
        description="Asesoría técnica en tiempo real para optimización de ruta crítica y resolución de restricciones de obra."
        maxWidth="xl"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 min-h-[220px] max-h-[350px] overflow-y-auto">
            {isAiLoading ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3 py-12">
                <Loader2 size={32} className="animate-spin text-indigo-600 dark:text-emerald-400" />
                <p className="text-xs font-bold">Analizando WBS de obra, rendimientos y restricciones...</p>
              </div>
            ) : aiResponse ? (
              <div className="prose prose-sm dark:prose-invert max-w-none text-xs sm:text-sm whitespace-pre-wrap font-medium">
                {aiResponse}
              </div>
            ) : (
              <div className="text-center py-10 space-y-3">
                <Sparkles size={36} className="mx-auto text-amber-500 opacity-80" />
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  ¿Qué deseas consultar sobre el frente de obra?
                </p>
                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setAiQuery('¿Cuáles son las partidas en ruta crítica o bloqueadas que amenazan el hito semanal?')}
                    className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 transition-colors text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    🔍 Analizar Ruta Crítica y Bloqueos
                  </button>
                  <button
                    type="button"
                    onClick={() => setAiQuery('Genera un resumen ejecutivo de avance físico vs presupuestado para la gerencia.')}
                    className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 transition-colors text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    📊 Resumen Ejecutivo de Avance
                  </button>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleAskAI} className="flex gap-2">
            <input
              type="text"
              value={aiQuery}
              onChange={e => setAiQuery(e.target.value)}
              placeholder="Escribe tu consulta sobre la obra..."
              className="flex-1 py-2.5 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <Button type="submit" isLoading={isAiLoading} disabled={!aiQuery.trim()}>
              Preguntar
            </Button>
          </form>
        </div>
      </Dialog>
    </motion.div>
  );
}
