import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, query, onSnapshot, addDoc, updateDoc, doc, deleteDoc, where 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, getAuthUser } from '../firebase';
import { 
  Plus, CheckCircle2, ClipboardList, HardHat, AlertTriangle, Sparkles, X, 
  KanbanSquare, Table2, Calendar, Search, Filter, ShieldAlert, Layers, Activity,
  Users, Edit2, Trash2, CalendarDays, Upload, FileCode, Check, RefreshCw, ChevronRight, AlertOctagon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useProject } from '../ProjectContext';
import { callGeminiStructured } from '../lib/geminiProxy';
import { parseXerFile, parseBc3File, syncImportedTasksToFirestore } from '../lib/parsers';

// DND-KIT Imports
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragStartEvent,
  DragEndEvent,
  useDroppable
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';

// Import UI Primitives
import { 
  Button, 
  Card, 
  CardContent, 
  CardHeader, 
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
  Skeleton,
} from '../components/ui';

export interface Task {
  id: string;
  projectId: string;
  // WBS
  wbsCode: string;          // "WBS 1.2.4"
  name: string;
  description?: string;
  unit: string;             // "m", "m2", "m3", "kg", "unid", "glb"
  plannedQuantity: number;
  executedQuantity: number;
  unitCost: number;
  // Estado
  status: 'planificada' | 'en_campo' | 'bloqueada' | 'terminada';
  priority: 'baja' | 'media' | 'alta' | 'critica';
  progressPercent: number;  // 0-100
  // Asignación
  assigneeId?: string;
  assigneeName?: string;
  crewName?: string;
  frontName?: string;       // Frente de trabajo
  // Fechas
  startDate?: string;
  dueDate?: string;
  completedAt?: string;
  // Referencias
  hasActivePtw: boolean;
  ptwId?: string;
  restrictionNote?: string;
  parentTaskId?: string;    // Para subtareas
  dependencies?: string[];   // IDs de tareas de las que depende
  // Posición Kanban
  columnId?: string;
  position?: number;         // Para drag & drop
  metadata?: {
    ndtRequired?: boolean;
    ndtStatus?: 'pending' | 'passed' | 'failed';
    hasNcr?: boolean;
    ncrId?: string;
  };
}

const KANBAN_COLUMNS = [
  { id: 'planificada', title: 'Planificadas', color: 'info' as const, icon: ClipboardList, badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800' },
  { id: 'en_campo', title: 'En Campo', color: 'warning' as const, icon: HardHat, badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800' },
  { id: 'bloqueada', title: 'Bloqueadas', color: 'error' as const, icon: AlertTriangle, badgeColor: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800' },
  { id: 'terminada', title: 'Terminadas / NDT', color: 'success' as const, icon: CheckCircle2, badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' },
];

// Sortable Task Card Item
function SortableTaskCard({ 
  task, 
  onEdit, 
  onDelete, 
  onProgress, 
  onAiSubtasks 
}: { 
  task: Task; 
  onEdit: (t: Task) => void; 
  onDelete: (id: string) => void; 
  onProgress: (t: Task) => void;
  onAiSubtasks: (t: Task) => void;
}) {
  const { setNodeRef, attributes, listeners, transform, isDragging } = useSortable({ id: task.id });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const progress = task.progressPercent ?? (
    task.plannedQuantity > 0 
      ? Math.min(100, (task.executedQuantity / task.plannedQuantity) * 100) 
      : 0
  );

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        ...style,
        borderLeft: task.status === 'bloqueada' ? '4px solid var(--color-error)' : undefined
      }}
      className={`card p-4 space-y-3 cursor-grab active:cursor-grabbing hover:-translate-y-0.5 hover:shadow-lift transition-all duration-200 bg-surface border border-line ${
        isDragging ? 'opacity-40 shadow-lift rotate-2 border-brand-500' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-extrabold text-ink-soft tabular font-mono">
          {task.wbsCode || 'WBS N/A'}
        </span>
        <StatusBadge 
          status={task.priority === 'critica' ? 'Crítica' : task.priority === 'alta' ? 'Alta' : task.priority === 'media' ? 'Media' : 'Baja'}
          variant={task.priority === 'critica' ? 'error' : task.priority === 'alta' ? 'warning' : 'info'} 
          size="sm" 
        />
      </div>

      <div>
        <p className="text-xs sm:text-sm font-bold text-ink leading-tight font-display">
          {task.name}
        </p>
        {task.frontName && (
          <span className="inline-block text-[10px] font-bold text-ink-faint mt-1">
            📍 {task.frontName}
          </span>
        )}
      </div>

      {/* Notice for blocked status */}
      {task.status === 'bloqueada' && (task.restrictionNote || task.description) && (
        <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-[11px] text-red-600 dark:text-red-400 font-bold flex items-start gap-1.5">
          <AlertOctagon size={14} className="shrink-0 mt-0.5" />
          <span className="line-clamp-2">{task.restrictionNote || task.description}</span>
        </div>
      )}

      {/* Barra de progreso */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px] tabular">
          <span className="text-ink-faint font-medium">
            {task.executedQuantity} / {task.plannedQuantity} {task.unit}
          </span>
          <span className="font-bold text-ink">
            {progress.toFixed(0)}%
          </span>
        </div>
        <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all ${
              progress >= 100 ? 'bg-emerald-500' : task.status === 'bloqueada' ? 'bg-error' : 'bg-brand-500'
            }`} 
            style={{ width: `${Math.min(progress, 100)}%` }} 
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-ink-soft pt-2 border-t border-line">
        <div className="flex items-center gap-1.5">
          {task.assigneeName ? (
            <span className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-500 text-[10px] font-extrabold flex items-center justify-center">
              {task.assigneeName.charAt(0).toUpperCase()}
            </span>
          ) : (
            <Users size={14} className="text-ink-faint" />
          )}
          <span className="truncate max-w-[110px] font-medium">
            {task.crewName || task.assigneeName || 'Sin asignar'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {task.hasActivePtw && <StatusBadge status="PTW" variant="warning" size="sm" />}
          {task.metadata?.ndtRequired && <StatusBadge status="NDT" variant="info" size="sm" />}
        </div>
      </div>

      {/* Acciones de tarjeta */}
      <div className="flex items-center justify-between pt-1 text-xs">
        <span className="text-[10px] font-mono font-bold text-ink-faint tabular">
          ${((task.executedQuantity || 0) * (task.unitCost || 0)).toLocaleString('en-US')}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onAiSubtasks(task); }}
            className="p-1 text-brand-500 hover:bg-surface-2 rounded cursor-pointer"
            title="Desglosar subtareas con IA"
          >
            <Sparkles size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onProgress(task); }}
            className="p-1 text-emerald-600 hover:bg-surface-2 rounded cursor-pointer"
            title="Registrar avance"
          >
            <Activity size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(task); }}
            className="p-1 text-ink-soft hover:text-ink hover:bg-surface-2 rounded cursor-pointer"
            title="Editar partida"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
            className="p-1 text-red-500 hover:bg-surface-2 rounded cursor-pointer"
            title="Eliminar partida"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

// Droppable Column Component
function KanbanColumnDroppable({ 
  column, 
  tasks, 
  onEdit, 
  onDelete, 
  onProgress,
  onAiSubtasks
}: { 
  column: typeof KANBAN_COLUMNS[0]; 
  tasks: Task[]; 
  onEdit: (t: Task) => void; 
  onDelete: (id: string) => void; 
  onProgress: (t: Task) => void;
  onAiSubtasks: (t: Task) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const ColumnIcon = column.icon;
  const columnTotalValuation = tasks.reduce((sum, t) => sum + (t.executedQuantity * t.unitCost), 0);

  return (
    <Card className={`flex flex-col h-full border transition-all ${isOver ? 'ring-2 ring-brand-500 bg-surface-2' : ''}`}>
      <CardHeader className="pb-3 border-b border-line">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`p-1.5 rounded-lg border ${column.badgeColor}`}>
              <ColumnIcon size={16} />
            </span>
            <h3 className="font-display font-semibold text-ink text-sm sm:text-base">{column.title}</h3>
          </div>
          <StatusBadge status={`${tasks.length}`} variant={column.color} size="sm" />
        </div>
        <div className="flex items-center justify-between mt-2 text-xs tabular font-bold text-ink-soft">
          <span>Ejecutado:</span>
          <span>${columnTotalValuation.toLocaleString('en-US', { minimumFractionDigits: 0 })}</span>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-3">
        <div 
          ref={setNodeRef} 
          className="h-full min-h-[300px] overflow-y-auto space-y-3"
        >
          <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
            {tasks.map(task => (
              <SortableTaskCard 
                key={task.id} 
                task={task} 
                onEdit={onEdit} 
                onDelete={onDelete} 
                onProgress={onProgress}
                onAiSubtasks={onAiSubtasks}
              />
            ))}
          </SortableContext>
          {tasks.length === 0 && (
            <div className="h-40 border border-dashed border-line rounded-2xl flex items-center justify-center text-xs text-ink-faint">
              Arrastra una partida aquí
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Tasks() {
  const { currentProject } = useProject();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'kanban' | 'table' | 'calendar'>('kanban');

  // Filter & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterFront, setFilterFront] = useState<string>('all');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [isAiSubtasksModalOpen, setIsAiSubtasksModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<Task>>({
    wbsCode: 'WBS 1.1',
    name: '',
    description: '',
    unit: 'm2',
    plannedQuantity: 100,
    unitCost: 150,
    status: 'planificada',
    priority: 'media',
    frontName: 'Frente 1 - Estructura',
    crewName: 'Cuadrilla Alfa',
    hasActivePtw: false,
    metadata: { ndtRequired: false }
  });

  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [progressTask, setProgressTask] = useState<Task | null>(null);
  const [progressAdd, setProgressAdd] = useState<number>(0);

  // AI Subtasks Modal State
  const [aiTaskTarget, setAiTaskTarget] = useState<Task | null>(null);
  const [aiSubtasksLoading, setAiSubtasksLoading] = useState(false);
  const [aiSubtasksResult, setAiSubtasksResult] = useState<Array<{ name: string; description: string; estimatedDays: number; resources?: string }> | null>(null);

  // Active Drag
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

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
      const tsks = snapshot.docs.map(docSnap => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          projectId: d.projectId,
          wbsCode: d.wbsCode || d.code || 'WBS 1.0',
          name: d.name || 'Partida sin nombre',
          description: d.description || '',
          unit: d.unit || 'm2',
          plannedQuantity: Number(d.plannedQuantity || 1),
          executedQuantity: Number(d.executedQuantity || 0),
          unitCost: Number(d.unitCost || 0),
          status: (d.status as Task['status']) || 'planificada',
          priority: (d.priority as Task['priority']) || 'media',
          progressPercent: d.plannedQuantity > 0 ? (Number(d.executedQuantity || 0) / Number(d.plannedQuantity)) * 100 : 0,
          assigneeName: d.assignedTo || d.assigneeName || '',
          crewName: d.crewName || 'Cuadrilla Principal',
          frontName: d.frente || d.frontName || 'Frente A',
          hasActivePtw: Boolean(d.hasActivePtw),
          restrictionNote: d.blockedReason || d.restrictionNote || '',
          startDate: d.startDate,
          dueDate: d.endDate || d.dueDate,
          metadata: d.metadata || { ndtRequired: false }
        } as Task;
      });

      setTasks(tsks);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'tasks');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentProject]);

  const handleDragStart = (event: DragStartEvent) => {
    const t = tasks.find(item => item.id === event.active.id);
    if (t) setActiveTask(t);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // Check if dropped over a column
    let targetStatus: Task['status'] | null = null;
    if (['planificada', 'en_campo', 'bloqueada', 'terminada'].includes(overId)) {
      targetStatus = overId as Task['status'];
    } else {
      // Find task over which it was dropped
      const overTask = tasks.find(t => t.id === overId);
      if (overTask) targetStatus = overTask.status;
    }

    if (targetStatus) {
      const activeTaskItem = tasks.find(t => t.id === activeId);
      if (activeTaskItem && activeTaskItem.status !== targetStatus) {
        try {
          await updateDoc(doc(db, 'tasks', activeId), {
            status: targetStatus,
            updatedAt: new Date().toISOString()
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `tasks/${activeId}`);
        }
      }
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject) return;

    try {
      const user = getAuthUser();
      await addDoc(collection(db, 'tasks'), {
        projectId: currentProject.id,
        wbsCode: formData.wbsCode,
        code: formData.wbsCode,
        name: formData.name,
        description: formData.description || '',
        unit: formData.unit,
        plannedQuantity: Number(formData.plannedQuantity),
        executedQuantity: 0,
        unitCost: Number(formData.unitCost),
        status: formData.status,
        priority: formData.priority,
        frente: formData.frontName,
        assignedTo: user?.displayName || 'Supervisor',
        crewName: formData.crewName,
        hasActivePtw: formData.hasActivePtw,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        metadata: formData.metadata || { ndtRequired: false }
      });

      setIsModalOpen(false);
      setFormData({
        wbsCode: 'WBS 1.1',
        name: '',
        description: '',
        unit: 'm2',
        plannedQuantity: 100,
        unitCost: 150,
        status: 'planificada',
        priority: 'media',
        frontName: 'Frente 1 - Estructura',
        crewName: 'Cuadrilla Alfa',
        hasActivePtw: false,
        metadata: { ndtRequired: false }
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'tasks');
    }
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;

    try {
      await updateDoc(doc(db, 'tasks', editingTask.id), {
        wbsCode: editingTask.wbsCode,
        code: editingTask.wbsCode,
        name: editingTask.name,
        description: editingTask.description || '',
        unit: editingTask.unit,
        plannedQuantity: Number(editingTask.plannedQuantity),
        unitCost: Number(editingTask.unitCost),
        status: editingTask.status,
        priority: editingTask.priority,
        frente: editingTask.frontName,
        crewName: editingTask.crewName,
        hasActivePtw: editingTask.hasActivePtw,
        blockedReason: editingTask.restrictionNote || ''
      });

      setIsEditModalOpen(false);
      setEditingTask(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tasks/${editingTask.id}`);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar esta partida de la WBS?')) {
      try {
        await deleteDoc(doc(db, 'tasks', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `tasks/${id}`);
      }
    }
  };

  const handleSaveProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!progressTask) return;

    const newExecuted = Number(progressTask.executedQuantity || 0) + Number(progressAdd);
    const isCompleted = newExecuted >= progressTask.plannedQuantity;

    try {
      await updateDoc(doc(db, 'tasks', progressTask.id), {
        executedQuantity: newExecuted,
        status: isCompleted ? 'terminada' : progressTask.status === 'planificada' ? 'en_campo' : progressTask.status,
        updatedAt: new Date().toISOString()
      });

      setIsProgressModalOpen(false);
      setProgressTask(null);
      setProgressAdd(0);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tasks/${progressTask.id}`);
    }
  };

  const handleGenerateAiSubtasks = async (task: Task) => {
    setAiTaskTarget(task);
    setIsAiSubtasksModalOpen(true);
    setAiSubtasksLoading(true);
    setAiSubtasksResult(null);

    const subtaskSchema = {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          name: { type: 'STRING' },
          description: { type: 'STRING' },
          estimatedDays: { type: 'NUMBER' },
          resources: { type: 'STRING' }
        },
        required: ['name', 'description', 'estimatedDays']
      }
    };

    const result = await callGeminiStructured<Array<{ name: string; description: string; estimatedDays: number; resources?: string }>>(
      `Desglosa esta partida de obra en subtareas operativas secuenciales: ${task.name} (Código: ${task.wbsCode}). Descripción: ${task.description || 'General'}. Cómputo: ${task.plannedQuantity} ${task.unit}.`,
      subtaskSchema,
      'Eres un planificador experto de obra industrial e ingeniería EPC.'
    );

    setAiSubtasksResult(result);
    setAiSubtasksLoading(false);
  };

  // Import files
  const handleImportXer = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentProject) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const parsed = parseXerFile(evt.target?.result as string);
        if (parsed.length === 0) {
          alert('No se encontraron actividades válidas en Primavera P6 (.xer)');
          return;
        }
        const { successCount } = await syncImportedTasksToFirestore(
          parsed,
          currentProject.id,
          'default_org',
          'Primavera P6'
        );
        alert(`Sincronizadas ${successCount} partidas desde Primavera P6 (.xer)`);
      } catch (err) {
        alert('Error al procesar el archivo .xer');
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
        const parsed = parseBc3File(evt.target?.result as string);
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
        alert(`Sincronizadas ${successCount} partidas desde Presupuesto BC3`);
      } catch (err) {
        alert('Error al procesar el archivo .bc3');
      }
    };
    reader.readAsText(file);
    if (bc3FileInputRef.current) bc3FileInputRef.current.value = '';
  };

  // Filter tasks
  const filteredTasks = tasks.filter(t => {
    const matchesSearch = 
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.wbsCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.frontName && t.frontName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesPriority = filterPriority === 'all' || t.priority === filterPriority;
    const matchesFront = filterFront === 'all' || t.frontName === filterFront;

    return matchesSearch && matchesPriority && matchesFront;
  });

  const uniqueFronts = Array.from(new Set(tasks.map(t => t.frontName).filter(Boolean)));

  // Metrics
  const totalTasks = tasks.length;
  const totalPlannedValuation = tasks.reduce((sum, t) => sum + (t.plannedQuantity * t.unitCost), 0);
  const totalExecutedValuation = tasks.reduce((sum, t) => sum + (t.executedQuantity * t.unitCost), 0);
  const totalProgress = totalPlannedValuation > 0 ? (totalExecutedValuation / totalPlannedValuation) * 100 : 0;
  const blockedCount = tasks.filter(t => t.status === 'bloqueada').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Hidden File Inputs */}
      <input type="file" accept=".xer" ref={xerFileInputRef} onChange={handleImportXer} className="hidden" />
      <input type="file" accept=".bc3" ref={bc3FileInputRef} onChange={handleImportBc3} className="hidden" />

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-line">
        <div>
          <h1 className="text-2xl font-black text-ink tracking-tight font-display">
            Control de Partidas WBS & Kanban de Obra
          </h1>
          <p className="text-xs sm:text-sm text-ink-soft mt-1">
            Gestión de partidas, planificación contractual y ejecución en campo
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => xerFileInputRef.current?.click()} leftIcon={<FileCode size={16} />}>
            P6 (.xer)
          </Button>
          <Button variant="outline" size="sm" onClick={() => bc3FileInputRef.current?.click()} leftIcon={<Upload size={16} />}>
            BC3 (.bc3)
          </Button>
          <Button variant="primary" leftIcon={<Plus size={18} />} onClick={() => setIsModalOpen(true)}>
            Nueva Partida
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Partidas WBS Totales"
          value={totalTasks}
          sublabel="En catálogo de proyecto"
          icon={<ClipboardList size={22} />}
          accentColor="indigo"
        />
        <MetricCard
          title="Avance Físico-Financiero"
          value={`${totalProgress.toFixed(1)}%`}
          sublabel={`$${totalExecutedValuation.toLocaleString('en-US')} / $${totalPlannedValuation.toLocaleString('en-US')}`}
          icon={<Activity size={22} />}
          accentColor="emerald"
        />
        <MetricCard
          title="Partidas Bloqueadas"
          value={blockedCount}
          sublabel="Con restricciones de obra"
          icon={<AlertTriangle size={22} />}
          accentColor={blockedCount > 0 ? "error" : "slate"}
        />
        <MetricCard
          title="Frentes Activos"
          value={uniqueFronts.length || 1}
          sublabel="Despliegue operativo"
          icon={<HardHat size={22} />}
          accentColor="amber"
        />
      </div>

      {/* Control Bar & View Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-surface p-3 rounded-2xl border border-line">
        {/* Selector de vistas */}
        <div className="flex gap-1 bg-surface-2 p-1 rounded-xl w-fit">
          {[
            { id: 'kanban', label: 'Kanban', icon: KanbanSquare },
            { id: 'table', label: 'WBS / Tabla', icon: Table2 },
            { id: 'calendar', label: 'Calendario', icon: Calendar },
          ].map(v => (
            <button 
              key={v.id} 
              onClick={() => setView(v.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                view === v.id ? 'bg-surface text-ink shadow-card' : 'text-ink-soft hover:text-ink'
              }`}
            >
              <v.icon size={16} /> {v.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              type="text"
              placeholder="Buscar partida o WBS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-surface-2 border border-line rounded-xl text-xs font-medium text-ink outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-1.5 bg-surface-2 border border-line rounded-xl text-xs font-bold text-ink outline-none"
          >
            <option value="all">Todas las prioridades</option>
            <option value="critica">Crítica</option>
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="baja">Baja</option>
          </select>

          {uniqueFronts.length > 0 && (
            <select
              value={filterFront}
              onChange={(e) => setFilterFront(e.target.value)}
              className="px-3 py-1.5 bg-surface-2 border border-line rounded-xl text-xs font-bold text-ink outline-none"
            >
              <option value="all">Todos los frentes</option>
              {uniqueFronts.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Main Views */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={40} className="text-brand-500" />}
          title="No hay partidas registradas"
          description="Crea tu primera partida WBS o importa la estructura de control directamente desde Primavera P6 o FIEBDC-3."
          actionLabel="Crear Partida WBS"
          onAction={() => setIsModalOpen(true)}
        />
      ) : view === 'kanban' ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
            {KANBAN_COLUMNS.map(col => {
              const colTasks = filteredTasks.filter(t => t.status === col.id);
              return (
                <KanbanColumnDroppable
                  key={col.id}
                  column={col}
                  tasks={colTasks}
                  onEdit={(t) => { setEditingTask(t); setIsEditModalOpen(true); }}
                  onDelete={handleDeleteTask}
                  onProgress={(t) => { setProgressTask(t); setIsProgressModalOpen(true); }}
                  onAiSubtasks={handleGenerateAiSubtasks}
                />
              );
            })}
          </div>

          <DragOverlay>
            {activeTask ? (
              <div className="card p-4 space-y-2 opacity-90 shadow-lift rotate-2 border-brand-500 bg-surface">
                <span className="text-[11px] font-extrabold text-ink-soft tabular">{activeTask.wbsCode}</span>
                <p className="text-sm font-bold text-ink">{activeTask.name}</p>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : view === 'table' ? (
        <Card>
          <Table>
            <TableHeader>
              <TableHead>Código WBS</TableHead>
              <TableHead>Partida / Descripción</TableHead>
              <TableHead>Frente</TableHead>
              <TableHead>Prioridad</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Planned</TableHead>
              <TableHead className="text-right">Executed</TableHead>
              <TableHead className="text-right">Avance</TableHead>
              <TableHead className="text-right">P.U. ($)</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableHeader>
            <TableBody>
              {filteredTasks.map(t => {
                const prog = t.plannedQuantity > 0 ? (t.executedQuantity / t.plannedQuantity) * 100 : 0;
                return (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono font-bold text-brand-500">{t.wbsCode}</TableCell>
                    <TableCell>
                      <div>
                        <span className="font-bold text-ink block">{t.name}</span>
                        {t.restrictionNote && <span className="text-[10px] text-red-500 font-semibold block">⚠️ {t.restrictionNote}</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-medium text-ink-soft">{t.frontName || 'N/A'}</TableCell>
                    <TableCell>
                      <StatusBadge 
                        status={t.priority} 
                        variant={t.priority === 'critica' ? 'error' : t.priority === 'alta' ? 'warning' : 'info'} 
                        size="sm" 
                      />
                    </TableCell>
                    <TableCell>
                      <StatusBadge 
                        status={t.status} 
                        variant={t.status === 'terminada' ? 'success' : t.status === 'bloqueada' ? 'error' : t.status === 'en_campo' ? 'warning' : 'info'} 
                        size="sm" 
                      />
                    </TableCell>
                    <TableCell className="text-right font-mono tabular">{t.plannedQuantity} {t.unit}</TableCell>
                    <TableCell className="text-right font-mono tabular text-emerald-600 font-bold">{t.executedQuantity} {t.unit}</TableCell>
                    <TableCell className="text-right font-mono font-bold tabular">{prog.toFixed(1)}%</TableCell>
                    <TableCell className="text-right font-mono tabular">${t.unitCost}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleGenerateAiSubtasks(t)} className="p-1.5 text-brand-500 hover:bg-surface-2 rounded cursor-pointer" title="Subtareas IA">
                          <Sparkles size={16} />
                        </button>
                        <button onClick={() => { setProgressTask(t); setIsProgressModalOpen(true); }} className="p-1.5 text-emerald-600 hover:bg-surface-2 rounded cursor-pointer" title="Registrar avance">
                          <Activity size={16} />
                        </button>
                        <button onClick={() => { setEditingTask(t); setIsEditModalOpen(true); }} className="p-1.5 text-ink-soft hover:bg-surface-2 rounded cursor-pointer" title="Editar">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDeleteTask(t.id)} className="p-1.5 text-red-500 hover:bg-surface-2 rounded cursor-pointer" title="Eliminar">
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
        /* Calendar View */
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-ink">Cronograma de Ejecución</h3>
            <span className="text-xs text-ink-soft">Línea de tiempo de frentes</span>
          </div>
          <div className="space-y-3">
            {filteredTasks.map(t => (
              <div key={t.id} className="p-4 rounded-xl bg-surface-2 border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-brand-500">{t.wbsCode}</span>
                  <div>
                    <h4 className="text-sm font-bold text-ink">{t.name}</h4>
                    <span className="text-xs text-ink-faint">Frente: {t.frontName} • {t.crewName}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono">
                  <span>Inicia: {t.startDate || 'Hoy'}</span>
                  <span>Fin: {t.dueDate || '+14 días'}</span>
                  <StatusBadge status={t.status} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* MODAL CREAR PARTIDA */}
      <Dialog isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nueva Partida WBS">
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input 
              label="Código WBS" 
              value={formData.wbsCode} 
              onChange={(e) => setFormData({ ...formData, wbsCode: e.target.value })} 
              required 
            />
            <Input 
              label="Frente de Trabajo" 
              value={formData.frontName} 
              onChange={(e) => setFormData({ ...formData, frontName: e.target.value })} 
              required 
            />
          </div>

          <Input 
            label="Nombre de la Partida" 
            value={formData.name} 
            onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
            required 
            placeholder="ej. Excavación de zanja para tubería 12in"
          />

          <div className="grid grid-cols-3 gap-3">
            <Input 
              label="Unidad" 
              value={formData.unit} 
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })} 
              required 
            />
            <Input 
              label="Cómputo Planificado" 
              type="number" 
              value={formData.plannedQuantity} 
              onChange={(e) => setFormData({ ...formData, plannedQuantity: Number(e.target.value) })} 
              required 
            />
            <Input 
              label="Precio Unitario ($)" 
              type="number" 
              value={formData.unitCost} 
              onChange={(e) => setFormData({ ...formData, unitCost: Number(e.target.value) })} 
              required 
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-ink block mb-1">Prioridad</label>
              <select 
                value={formData.priority} 
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="w-full p-2.5 bg-surface border border-line rounded-xl text-xs font-bold text-ink"
              >
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
                <option value="critica">Crítica</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-ink block mb-1">Cuadrilla Responsable</label>
              <Input 
                value={formData.crewName} 
                onChange={(e) => setFormData({ ...formData, crewName: e.target.value })} 
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input 
              type="checkbox" 
              id="ptwCheck"
              checked={formData.hasActivePtw} 
              onChange={(e) => setFormData({ ...formData, hasActivePtw: e.target.checked })}
              className="w-4 h-4 text-brand-500 rounded"
            />
            <label htmlFor="ptwCheck" className="text-xs font-bold text-ink cursor-pointer">
              Requiere Permiso de Trabajo (PTW / SIHO-A)
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-line">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button variant="primary" type="submit">Guardar Partida WBS</Button>
          </div>
        </form>
      </Dialog>

      {/* MODAL EDITAR PARTIDA */}
      <Dialog isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Editar Partida WBS">
        {editingTask && (
          <form onSubmit={handleUpdateTask} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input 
                label="Código WBS" 
                value={editingTask.wbsCode} 
                onChange={(e) => setEditingTask({ ...editingTask, wbsCode: e.target.value })} 
                required 
              />
              <Input 
                label="Frente de Trabajo" 
                value={editingTask.frontName || ''} 
                onChange={(e) => setEditingTask({ ...editingTask, frontName: e.target.value })} 
              />
            </div>

            <Input 
              label="Nombre de Partida" 
              value={editingTask.name} 
              onChange={(e) => setEditingTask({ ...editingTask, name: e.target.value })} 
              required 
            />

            <div className="grid grid-cols-3 gap-3">
              <Input 
                label="Unidad" 
                value={editingTask.unit} 
                onChange={(e) => setEditingTask({ ...editingTask, unit: e.target.value })} 
              />
              <Input 
                label="Cantidad Planificada" 
                type="number" 
                value={editingTask.plannedQuantity} 
                onChange={(e) => setEditingTask({ ...editingTask, plannedQuantity: Number(e.target.value) })} 
              />
              <Input 
                label="Precio Unitario ($)" 
                type="number" 
                value={editingTask.unitCost} 
                onChange={(e) => setEditingTask({ ...editingTask, unitCost: Number(e.target.value) })} 
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-ink block mb-1">Estado</label>
                <select 
                  value={editingTask.status} 
                  onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value as any })}
                  className="w-full p-2.5 bg-surface border border-line rounded-xl text-xs font-bold text-ink"
                >
                  <option value="planificada">Planificada</option>
                  <option value="en_campo">En Campo</option>
                  <option value="bloqueada">Bloqueada</option>
                  <option value="terminada">Terminada / NDT</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-ink block mb-1">Prioridad</label>
                <select 
                  value={editingTask.priority} 
                  onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value as any })}
                  className="w-full p-2.5 bg-surface border border-line rounded-xl text-xs font-bold text-ink"
                >
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                  <option value="critica">Crítica</option>
                </select>
              </div>
            </div>

            {editingTask.status === 'bloqueada' && (
              <Input 
                label="Nota de Restricción / Bloqueo" 
                value={editingTask.restrictionNote || ''} 
                onChange={(e) => setEditingTask({ ...editingTask, restrictionNote: e.target.value })} 
                placeholder="ej. Falta de suministro de tubería de 8in por transporte"
              />
            )}

            <div className="flex justify-end gap-2 pt-4 border-t border-line">
              <Button variant="outline" type="button" onClick={() => setIsEditModalOpen(false)}>Cancelar</Button>
              <Button variant="primary" type="submit">Actualizar Partida</Button>
            </div>
          </form>
        )}
      </Dialog>

      {/* MODAL REGISTRAR AVANCE */}
      <Dialog isOpen={isProgressModalOpen} onClose={() => setIsProgressModalOpen(false)} title="Registrar Avance Diario">
        {progressTask && (
          <form onSubmit={handleSaveProgress} className="space-y-4">
            <div className="p-3 bg-surface-2 rounded-xl text-xs space-y-1">
              <p className="font-bold text-ink">{progressTask.wbsCode} - {progressTask.name}</p>
              <p className="text-ink-soft">Avance Actual: {progressTask.executedQuantity} / {progressTask.plannedQuantity} {progressTask.unit}</p>
            </div>

            <Input 
              label={`Cómputo a Adicionar (${progressTask.unit})`} 
              type="number" 
              value={progressAdd} 
              onChange={(e) => setProgressAdd(Number(e.target.value))} 
              required 
              autoFocus
            />

            <div className="flex justify-end gap-2 pt-4 border-t border-line">
              <Button variant="outline" type="button" onClick={() => setIsProgressModalOpen(false)}>Cancelar</Button>
              <Button variant="primary" type="submit">Registrar Avance</Button>
            </div>
          </form>
        )}
      </Dialog>

      {/* MODAL SUBTAREAS IA */}
      <Dialog isOpen={isAiSubtasksModalOpen} onClose={() => setIsAiSubtasksModalOpen(false)} title="Sugerencia de Subtareas con IA">
        <div className="space-y-4">
          {aiTaskTarget && (
            <div className="p-3 bg-brand-500/10 border border-brand-500/20 rounded-xl text-xs">
              <p className="font-bold text-ink">{aiTaskTarget.wbsCode} — {aiTaskTarget.name}</p>
              <p className="text-ink-soft mt-0.5">Analizando secuencia técnica y desglose de trabajo...</p>
            </div>
          )}

          {aiSubtasksLoading ? (
            <div className="p-8 text-center space-y-2">
              <RefreshCw className="animate-spin text-brand-500 mx-auto" size={24} />
              <p className="text-xs font-bold text-ink">Generando subtareas estructuradas con Gemini AI...</p>
            </div>
          ) : aiSubtasksResult ? (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-ink uppercase tracking-wider">Subtareas Recomendadas:</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {aiSubtasksResult.map((sub, i) => (
                  <div key={i} className="p-3 bg-surface-2 rounded-xl border border-line space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-ink">{i + 1}. {sub.name}</span>
                      <span className="text-[10px] font-bold text-brand-500 bg-brand-500/10 px-2 py-0.5 rounded-full">{sub.estimatedDays} días</span>
                    </div>
                    <p className="text-xs text-ink-soft">{sub.description}</p>
                    {sub.resources && <p className="text-[10px] text-ink-faint">Recursos: {sub.resources}</p>}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-ink-faint text-center py-4">No se pudieron generar subtareas en este momento.</p>
          )}

          <div className="flex justify-end pt-4 border-t border-line">
            <Button variant="primary" onClick={() => setIsAiSubtasksModalOpen(false)}>Cerrar</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
