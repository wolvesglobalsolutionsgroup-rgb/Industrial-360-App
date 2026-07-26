import { useState, useEffect, useRef } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, doc, deleteDoc, where } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { 
  Plus, CheckCircle2, Circle, Upload, LayoutList, CalendarDays, Edit2, 
  Trash2, Activity, AlertTriangle, Sparkles, X, Loader2, FileCode,
  Clock, AlertCircle, RefreshCw, MessageSquare, History, Paperclip, Send, Shield, Users, Layers, Tag
} from 'lucide-react';
import { XMLParser } from 'fast-xml-parser';
import { motion, AnimatePresence } from 'motion/react';
import { callGeminiProxy } from '../lib/geminiProxy';
import { useProject } from '../ProjectContext';
import { parseXerFile, parseBc3File, syncImportedTasksToFirestore } from '../lib/parsers';

// Primitivas de UI
import { Button } from '../components/ui/Button';
import { IconButton } from '../components/ui/IconButton';
import { Card } from '../components/ui/Card';
import { MetricCard } from '../components/ui/MetricCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Dialog } from '../components/ui/Dialog';
import { Input, Select } from '../components/ui/Input';
import { Table, TableRow, TableCell } from '../components/ui/Table';
import { Skeleton, SkeletonCard } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';

// Estados del Kanban
const KANBAN_LANES = [
  { id: 'planning', label: 'Planificación', color: 'border-slate-200 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-900/10 text-slate-500' },
  { id: 'ready', label: 'Lista para Iniciar', color: 'border-sky-200 dark:border-sky-900/50 bg-sky-50/10 dark:bg-sky-950/10 text-sky-500' },
  { id: 'field', label: 'En Campo / Ejecución', color: 'border-amber-200 dark:border-amber-900/50 bg-amber-50/10 dark:bg-amber-950/10 text-amber-500' },
  { id: 'review', label: 'En Revisión / NDT', color: 'border-purple-200 dark:border-purple-900/50 bg-purple-50/10 dark:bg-purple-950/10 text-purple-500' },
  { id: 'blocked', label: 'Bloqueada', color: 'border-red-200 dark:border-red-900/50 bg-red-50/10 dark:bg-red-950/10 text-red-500' },
  { id: 'completed', label: 'Terminada', color: 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/10 dark:bg-emerald-950/10 text-emerald-500' },
];

export default function Tasks() {
  const { currentProject } = useProject();
  const [tasks, setTasks] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [budgetThreshold, setBudgetThreshold] = useState(90);
  
  const [newTask, setNewTask] = useState({ code: '', name: '', unit: 'm2', plannedQuantity: '', unitCost: '' });
  const [editingTask, setEditingTask] = useState<any>(null);
  const [progressTask, setProgressTask] = useState<any>(null);
  
  // Progress computation state
  const [compLength, setCompLength] = useState<number>(0);
  const [compWidth, setCompWidth] = useState<number>(0);
  const [compHeight, setCompHeight] = useState<number>(0);
  const [compQuantity, setCompQuantity] = useState<number>(0);

  const [viewMode, setViewMode] = useState<'list' | 'gantt' | 'kanban'>('list');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const xerFileInputRef = useRef<HTMLInputElement>(null);
  const bc3FileInputRef = useRef<HTMLInputElement>(null);

  // AI State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Drawer / Task Details State
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'general' | 'comments' | 'evidence' | 'history'>('general');
  const [newComment, setNewComment] = useState('');
  const [commentsList, setCommentsList] = useState<any[]>([]);
  const [isCommentsLoading, setIsCommentsLoading] = useState(false);

  useEffect(() => {
    if (!currentProject) {
      setTasks([]);
      return;
    }

    const q = query(
      collection(db, 'tasks'),
      where('projectId', '==', currentProject.id)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tsks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTasks(tsks);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'tasks');
    });
    
    const unsubSettings = onSnapshot(doc(db, 'settings', 'general'), (docSnap) => {
      if (docSnap.exists() && docSnap.data().budgetThreshold) {
        setBudgetThreshold(docSnap.data().budgetThreshold);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/general');
    });

    return () => {
      unsubscribe();
      unsubSettings();
    };
  }, [currentProject]);

  // Read Comments in Real-time
  useEffect(() => {
    if (!selectedTask || !selectedTask.id) {
      setCommentsList([]);
      return;
    }
    
    setIsCommentsLoading(true);
    const q = query(collection(db, 'tasks', selectedTask.id, 'comments'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort chronologically
      list.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      setCommentsList(list);
      setIsCommentsLoading(false);
    }, (err) => {
      console.error("Error loading comments:", err);
      setIsCommentsLoading(false);
    });

    return () => unsubscribe();
  }, [selectedTask]);

  const handleAskAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;
    
    setIsAiLoading(true);
    setAiResponse('');
    
    try {
      const tasksContext = tasks.map(t => 
        `- ${t.name} (${t.code || 'S/C'}): Planificado ${t.plannedQuantity} ${t.unit}, Ejecutado ${t.executedQuantity.toFixed(2)} ${t.unit}, Costo Unitario $${t.unitCost}, Estado: ${t.status || 'planning'}, Inicio: ${t.startDate}, Fin: ${t.endDate}`
      ).join('\n');
      
      const prompt = `Eres un asistente experto en gestión de proyectos de construcción e ingeniería civil. 
Aquí están los datos actuales de las partidas (tareas) del proyecto:
${tasksContext}

Responde a la siguiente pregunta del usuario basándote en los datos del proyecto proporcionados. 
Si la pregunta requiere información técnica especializada, normativas de construcción, o mejores prácticas, utiliza la herramienta de búsqueda en internet, pero asegúrate de basarte solo en fuentes fiables y especializadas.

Pregunta del usuario: ${aiQuery}`;

      const response = await callGeminiProxy({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });
      
      const textResp = typeof response === 'string' ? response : (response?.text || 'No se obtuvo respuesta.');
      setAiResponse(textResp);
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      setAiResponse('Ocurrió un error al consultar al Asistente IA.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject) {
      alert("Por favor, selecciona un proyecto primero.");
      return;
    }
    try {
      const initialHistory = [{
        action: 'Partida creada',
        user: auth.currentUser?.displayName || auth.currentUser?.email || 'Usuario',
        timestamp: new Date().toISOString()
      }];

      await addDoc(collection(db, 'tasks'), {
        projectId: currentProject.id,
        code: newTask.code,
        name: newTask.name,
        unit: newTask.unit,
        plannedQuantity: Number(newTask.plannedQuantity),
        executedQuantity: 0,
        unitCost: Number(newTask.unitCost),
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'planning',
        history: initialHistory,
        responsible: '',
        crew: '',
        front: '',
        dependencies: '',
        restrictions: ''
      });
      setIsModalOpen(false);
      setNewTask({ code: '', name: '', unit: 'm2', plannedQuantity: '', unitCost: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'tasks');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    try {
      const updateHistoryEntry = {
        action: 'Detalles editados mediante formulario',
        user: auth.currentUser?.displayName || auth.currentUser?.email || 'Usuario',
        timestamp: new Date().toISOString()
      };

      const updatedHistory = editingTask.history ? [...editingTask.history, updateHistoryEntry] : [updateHistoryEntry];

      await updateDoc(doc(db, 'tasks', editingTask.id), {
        code: editingTask.code,
        name: editingTask.name,
        unit: editingTask.unit,
        plannedQuantity: Number(editingTask.plannedQuantity),
        unitCost: Number(editingTask.unitCost),
        history: updatedHistory
      });
      setIsEditModalOpen(false);
      setEditingTask(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tasks/${editingTask.id}`);
    }
  };

  const handleDelete = async (taskId: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta partida?')) {
      try {
        await deleteDoc(doc(db, 'tasks', taskId));
        if (selectedTask?.id === taskId) {
          setIsDrawerOpen(false);
          setSelectedTask(null);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `tasks/${taskId}`);
      }
    }
  };

  const openProgressModal = (task: any) => {
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

    const addedQuantity = calculateProgressQuantity();
    const newExecuted = progressTask.executedQuantity + addedQuantity;
    const newProgress = progressTask.plannedQuantity > 0 ? (newExecuted / progressTask.plannedQuantity) * 100 : 0;
    const oldProgress = progressTask.plannedQuantity > 0 ? (progressTask.executedQuantity / progressTask.plannedQuantity) * 100 : 0;

    if (newExecuted > progressTask.plannedQuantity) {
      if (!window.confirm(`¡Advertencia Crítica! La cantidad ejecutada (${newExecuted.toFixed(2)}) superará la planificada (${progressTask.plannedQuantity}). ¿Deseas continuar?`)) {
        return;
      }
    } else if (newProgress >= budgetThreshold && oldProgress < budgetThreshold) {
      if (!window.confirm(`¡Alerta de Presupuesto! El avance alcanzará el ${newProgress.toFixed(1)}%, superando el umbral de alerta del ${budgetThreshold}%. ¿Deseas registrar este avance?`)) {
        return;
      }
    }

    try {
      const progressHistoryEntry = {
        action: `Avance registrado: +${addedQuantity.toFixed(2)} ${progressTask.unit} (Total: ${newExecuted.toFixed(2)})`,
        user: auth.currentUser?.displayName || auth.currentUser?.email || 'Usuario',
        timestamp: new Date().toISOString()
      };

      const updatedHistory = progressTask.history ? [...progressTask.history, progressHistoryEntry] : [progressHistoryEntry];

      await updateDoc(doc(db, 'tasks', progressTask.id), {
        executedQuantity: newExecuted,
        history: updatedHistory
      });
      setIsProgressModalOpen(false);
      setProgressTask(null);
    } catch (error) {
      console.error("Error updating progress:", error);
    }
  };

  const handleImportMSProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const xmlData = event.target?.result as string;
        const parser = new XMLParser({ ignoreAttributes: false });
        const result = parser.parse(xmlData);
        
        const projectTasks = result.Project?.Tasks?.Task || [];
        const tasksArray = Array.isArray(projectTasks) ? projectTasks : [projectTasks];

        const targetProjId = currentProject ? currentProject.id : 'default-project';

        for (const t of tasksArray) {
          if (t.Name && t.Name !== 'Project Summary Task') {
            await addDoc(collection(db, 'tasks'), {
              projectId: targetProjId,
              code: `MSP-${Math.floor(100 + Math.random() * 900)}`,
              name: t.Name,
              unit: 'glb',
              plannedQuantity: 1,
              executedQuantity: t.PercentComplete ? Number(t.PercentComplete) / 100 : 0,
              unitCost: 1000,
              startDate: t.Start ? t.Start.split('T')[0] : new Date().toISOString().split('T')[0],
              endDate: t.Finish ? t.Finish.split('T')[0] : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              status: 'planning',
              history: [{
                action: 'Partida importada desde MS Project',
                user: auth.currentUser?.displayName || auth.currentUser?.email || 'Sistema',
                timestamp: new Date().toISOString()
              }]
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
    if (!file) return;

    if (!currentProject) {
      alert("Por favor selecciona un proyecto primero.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const xerContent = event.target?.result as string;
        const parsedTasks = parseXerFile(xerContent);

        if (parsedTasks.length === 0) {
          alert('No se encontraron actividades válidas en el archivo .xer de Primavera P6.');
          return;
        }

        const { successCount } = await syncImportedTasksToFirestore(
          parsedTasks,
          currentProject.id,
          'default_org',
          'Primavera P6 (.xer)'
        );

        alert(`¡Éxito! Se sincronizaron automáticamente ${successCount} actividades desde Primavera P6 (.xer) a la base de datos de tareas y presupuestos.`);
      } catch (error) {
        console.error("Error parsing XER file:", error);
        alert('Ocurrió un error al procesar el archivo .xer de Primavera P6.');
      }
    };
    reader.readAsText(file);
    if (xerFileInputRef.current) xerFileInputRef.current.value = '';
  };

  const handleImportBc3 = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!currentProject) {
      alert("Por favor selecciona un proyecto primero.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const bc3Content = event.target?.result as string;
        const parsedTasks = parseBc3File(bc3Content);

        if (parsedTasks.length === 0) {
          alert('No se encontraron partidas válidas en el archivo .bc3 FIEBDC-3.');
          return;
        }

        const { successCount } = await syncImportedTasksToFirestore(
          parsedTasks,
          currentProject.id,
          'default_org',
          'Presupuesto BC3 (FIEBDC-3)'
        );

        alert(`¡Éxito! Se sincronizaron automáticamente ${successCount} partidas de presupuesto desde FIEBDC-3 (.bc3) con el cronograma del proyecto.`);
      } catch (error) {
        console.error("Error parsing BC3 file:", error);
        alert('Ocurrió un error al procesar el archivo .bc3.');
      }
    };
    reader.readAsText(file);
    if (bc3FileInputRef.current) bc3FileInputRef.current.value = '';
  };

  // Drag and Drop Logic
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, laneId: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;
    
    const taskToUpdate = tasks.find(t => t.id === taskId);
    if (!taskToUpdate) return;
    
    const oldStatus = taskToUpdate.status || 'planning';
    if (oldStatus === laneId) return;

    try {
      const getLaneLabel = (id: string) => KANBAN_LANES.find(l => l.id === id)?.label || id;
      const historyEntry = {
        action: `Arrastrado de "${getLaneLabel(oldStatus)}" a "${getLaneLabel(laneId)}"`,
        user: auth.currentUser?.displayName || auth.currentUser?.email || 'Usuario',
        timestamp: new Date().toISOString()
      };
      
      const updatedHistory = taskToUpdate.history ? [...taskToUpdate.history, historyEntry] : [historyEntry];

      await updateDoc(doc(db, 'tasks', taskId), {
        status: laneId,
        history: updatedHistory
      });

      // Update selectedTask state in case the drawer is open for this task
      if (selectedTask?.id === taskId) {
        setSelectedTask(prev => ({ ...prev, status: laneId, history: updatedHistory }));
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `tasks/${taskId}`);
    }
  };

  const handleOpenDrawer = (task: any) => {
    setSelectedTask(task);
    setDrawerTab('general');
    setIsDrawerOpen(true);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !newComment.trim()) return;

    try {
      const commentData = {
        text: newComment,
        user: auth.currentUser?.displayName || auth.currentUser?.email || 'Usuario',
        userPhoto: auth.currentUser?.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${auth.currentUser?.displayName || 'User'}`,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'tasks', selectedTask.id, 'comments'), commentData);
      
      // Log in history
      const historyEntry = {
        action: 'Comentario agregado',
        user: auth.currentUser?.displayName || auth.currentUser?.email || 'Usuario',
        timestamp: new Date().toISOString()
      };
      const updatedHistory = selectedTask.history ? [...selectedTask.history, historyEntry] : [historyEntry];
      
      await updateDoc(doc(db, 'tasks', selectedTask.id), {
        history: updatedHistory
      });

      setSelectedTask(prev => ({ ...prev, history: updatedHistory }));
      setNewComment('');
    } catch (err) {
      console.error("Error adding comment:", err);
    }
  };

  const handleUpdateDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    try {
      const historyEntry = {
        action: 'Metadatos generales actualizados en el panel lateral',
        user: auth.currentUser?.displayName || auth.currentUser?.email || 'Usuario',
        timestamp: new Date().toISOString()
      };

      const updatedHistory = selectedTask.history ? [...selectedTask.history, historyEntry] : [historyEntry];

      const updateData = {
        code: selectedTask.code || '',
        name: selectedTask.name || '',
        unit: selectedTask.unit || 'm2',
        plannedQuantity: Number(selectedTask.plannedQuantity) || 0,
        executedQuantity: Number(selectedTask.executedQuantity) || 0,
        unitCost: Number(selectedTask.unitCost) || 0,
        startDate: selectedTask.startDate || '',
        endDate: selectedTask.endDate || '',
        responsible: selectedTask.responsible || '',
        crew: selectedTask.crew || '',
        front: selectedTask.front || '',
        dependencies: selectedTask.dependencies || '',
        restrictions: selectedTask.restrictions || '',
        status: selectedTask.status || 'planning',
        history: updatedHistory
      };

      await updateDoc(doc(db, 'tasks', selectedTask.id), updateData);
      setSelectedTask(prev => ({ ...prev, ...updateData }));
      alert("Información guardada.");
    } catch (err) {
      console.error("Error saving task details:", err);
      alert("Error al guardar.");
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Control de Partidas (WBS)</h1>
          <p className="text-slate-500 mt-1 font-medium">Cómputos métricos, cronograma y tablero Kanban interactivo</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0">
            <button 
              onClick={() => setViewMode('list')}
              className={`px-3.5 py-2 rounded-lg flex items-center gap-2 text-xs font-bold transition-all cursor-pointer ${viewMode === 'list' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
            >
              <LayoutList size={14} /> Lista
            </button>
            <button 
              onClick={() => setViewMode('kanban')}
              className={`px-3.5 py-2 rounded-lg flex items-center gap-2 text-xs font-bold transition-all cursor-pointer ${viewMode === 'kanban' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
            >
              <Layers size={14} /> Kanban
            </button>
            <button 
              onClick={() => setViewMode('gantt')}
              className={`px-3.5 py-2 rounded-lg flex items-center gap-2 text-xs font-bold transition-all cursor-pointer ${viewMode === 'gantt' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
            >
              <CalendarDays size={14} /> Gantt
            </button>
          </div>

          <input 
            type="file" 
            accept=".xml" 
            ref={fileInputRef} 
            onChange={handleImportMSProject} 
            className="hidden" 
          />
          <input 
            type="file" 
            accept=".xer" 
            ref={xerFileInputRef} 
            onChange={handleImportXer} 
            className="hidden" 
          />
          <input 
            type="file" 
            accept=".bc3" 
            ref={bc3FileInputRef} 
            onChange={handleImportBc3} 
            className="hidden" 
          />

          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm"
              icon={<Sparkles size={16} className="text-purple-500" />}
              onClick={() => setIsAiModalOpen(true)}
              className="border-purple-200 hover:border-purple-300 dark:border-purple-900 dark:hover:border-purple-800"
            >
              Asistente IA
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              icon={<FileCode size={16} className="text-sky-500" />}
              onClick={() => xerFileInputRef.current?.click()}
            >
              P6 (.xer)
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              icon={<FileCode size={16} className="text-amber-500" />}
              onClick={() => bc3FileInputRef.current?.click()}
            >
              BC3 (.bc3)
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              icon={<Upload size={16} />}
              onClick={() => fileInputRef.current?.click()}
            >
              MS Project
            </Button>
            <Button 
              variant="primary" 
              size="sm"
              icon={<Plus size={16} />}
              onClick={() => setIsModalOpen(true)}
            >
              Nueva Partida
            </Button>
          </div>
        </div>
      </header>

      {/* VISTA 1: LISTA */}
      {viewMode === 'list' && (
        <Card className="p-0 overflow-hidden">
          <Table headers={['Código', 'Partida', 'Unidad', 'Planificado', 'Ejecutado', 'Avance', 'Costo Unit.', 'Acciones']}>
            {tasks.map(task => {
              const progress = task.plannedQuantity > 0 ? (task.executedQuantity / task.plannedQuantity) * 100 : 0;
              const isComplete = progress >= 100;
              const isWarning = progress >= budgetThreshold && progress < 100;
              
              return (
                <TableRow key={task.id} className="cursor-pointer" onClick={() => handleOpenDrawer(task)}>
                  <TableCell className="font-mono text-xs text-blue-600 bg-blue-55/30 dark:bg-blue-950/10 truncate max-w-[80px]" onClick={e => e.stopPropagation()}>
                    {task.code || 'S/C'}
                  </TableCell>
                  <TableCell className="font-bold text-slate-800 dark:text-slate-100">
                    <div className="flex items-center gap-3">
                      {isComplete ? (
                        <CheckCircle2 className="text-emerald-500 shrink-0" size={18} />
                      ) : isWarning ? (
                        <AlertTriangle className="text-amber-500 shrink-0" size={18} />
                      ) : (
                        <Circle className="text-slate-350 dark:text-slate-700 shrink-0" size={18} />
                      )}
                      <span className="line-clamp-1">{task.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-500 font-bold">{task.unit}</TableCell>
                  <TableCell className="font-mono text-slate-800 dark:text-slate-200 text-center">{task.plannedQuantity}</TableCell>
                  <TableCell className="font-mono text-emerald-600 dark:text-emerald-400 font-bold text-center">{task.executedQuantity.toFixed(2)}</TableCell>
                  <TableCell onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-slate-100 dark:bg-slate-850 rounded-full h-2 w-20 shrink-0">
                        <div 
                          className={`h-2 rounded-full ${progress > 100 ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                      <span className={`text-xs font-black font-mono shrink-0 ${progress > 100 ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-slate-500'}`}>
                        {progress.toFixed(0)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-slate-550">${task.unitCost}</TableCell>
                  <TableCell onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <IconButton 
                        variant="ghost" 
                        size="sm"
                        icon={<Activity size={16} className="text-emerald-600" />}
                        onClick={() => openProgressModal(task)}
                        title="Registrar Avance"
                      />
                      <IconButton 
                        variant="ghost" 
                        size="sm"
                        icon={<Edit2 size={16} className="text-blue-600" />}
                        onClick={() => { setEditingTask(task); setIsEditModalOpen(true); }}
                        title="Editar Partida"
                      />
                      <IconButton 
                        variant="ghost" 
                        size="sm"
                        icon={<Trash2 size={16} className="text-red-550" />}
                        onClick={() => handleDelete(task.id)}
                        title="Eliminar Partida"
                      />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {tasks.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="p-0">
                  <EmptyState 
                    icon={<Layers size={40} />} 
                    title="No hay partidas" 
                    description="Crea una partida manual o importa documentos de MS Project, Primavera P6 o BC3."
                    actionText="Crear Partida"
                    onAction={() => setIsModalOpen(true)}
                  />
                </TableCell>
              </TableRow>
            )}
          </Table>
        </Card>
      )}

      {/* VISTA 2: GANTT */}
      {viewMode === 'gantt' && (
        <Card className="p-6 overflow-x-auto">
          <div className="min-w-[800px] space-y-4">
            <div className="grid grid-cols-12 gap-4 border-b border-slate-100 dark:border-slate-800 pb-3 text-xs font-bold text-slate-500 uppercase tracking-wide">
              <div className="col-span-3">Partida</div>
              <div className="col-span-9 flex justify-between px-2">
                <span>Inicio</span>
                <span>Cronograma y Avance</span>
                <span>Fin</span>
              </div>
            </div>
            <div className="space-y-3">
              {tasks.map(task => {
                const progress = task.plannedQuantity > 0 ? (task.executedQuantity / task.plannedQuantity) * 100 : 0;
                const isWarning = progress >= budgetThreshold && progress < 100;
                return (
                  <div key={task.id} className="grid grid-cols-12 gap-4 items-center cursor-pointer hover:bg-slate-50/20 dark:hover:bg-slate-900/10 p-1.5 rounded-xl transition-all" onClick={() => handleOpenDrawer(task)}>
                    <div className="col-span-3 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 truncate" title={task.name}>
                      <span className="font-mono text-blue-550 mr-2 text-xs">{task.code || 'S/C'}</span>
                      {task.name}
                    </div>
                    <div className="col-span-9 relative h-8 bg-slate-50 dark:bg-slate-950 rounded-xl overflow-hidden flex items-center px-4 text-xs font-semibold text-slate-500 border border-slate-100 dark:border-slate-850">
                      <div 
                        className={`absolute left-0 top-0 bottom-0 border-l-4 transition-all ${isWarning ? 'bg-amber-100/50 border-amber-500' : 'bg-emerald-100/50 border-emerald-500'}`}
                        style={{ width: `${Math.max(10, Math.min(progress, 100))}%` }}
                      >
                        <div className={`h-full w-full ${progress > 100 ? 'bg-red-500/25' : isWarning ? 'bg-amber-500/25' : 'bg-emerald-500/25'}`} style={{ width: `${Math.min(progress, 100)}%` }}></div>
                      </div>
                      <span className="relative z-10 w-full flex justify-between px-2 text-[10px] font-mono">
                        <span className="font-bold">{task.startDate || 'N/A'}</span>
                        <span className={`font-black text-xs ${progress > 100 ? 'text-red-700 dark:text-red-400' : isWarning ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}`}>{progress.toFixed(0)}%</span>
                        <span className="font-bold">{task.endDate || 'N/A'}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
              {tasks.length === 0 && (
                <EmptyState 
                  icon={<Layers size={40} />} 
                  title="No hay tareas" 
                  description="Crea una partida manual o importa documentos para ver el diagrama de Gantt."
                />
              )}
            </div>
          </div>
        </Card>
      )}

      {/* VISTA 3: KANBAN BOARD */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4 min-h-[600px] overflow-x-auto pb-4 select-none">
          {KANBAN_LANES.map(lane => {
            const laneTasks = tasks.filter(t => {
              const currentStatus = t.status || 'planning';
              return currentStatus === lane.id;
            });

            return (
              <div 
                key={lane.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, lane.id)}
                className={`flex flex-col rounded-3xl p-4 border-2 border-dashed ${lane.color} transition-all duration-300 min-h-[500px]`}
              >
                {/* Column Header */}
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-200/50 dark:border-slate-800/50">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">{lane.label}</span>
                  </div>
                  <span className="text-xs font-mono font-black px-2 py-0.5 rounded-full bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-350">
                    {laneTasks.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
                  {laneTasks.map(task => {
                    const progress = task.plannedQuantity > 0 ? (task.executedQuantity / task.plannedQuantity) * 100 : 0;
                    const isWarning = progress >= budgetThreshold && progress < 100;
                    const isComplete = progress >= 100;

                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onClick={() => handleOpenDrawer(task)}
                        className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-emerald-500/50 dark:hover:border-emerald-500/30 transition-all cursor-grab active:cursor-grabbing group relative"
                      >
                        {/* WBS Code */}
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50/50 px-2 py-0.5 rounded-md dark:bg-blue-950/20 dark:text-blue-400">
                            {task.code || 'S/C'}
                          </span>
                          {isComplete ? (
                            <StatusBadge status="Listo" variant="success" />
                          ) : isWarning ? (
                            <StatusBadge status="Límite" variant="warning" />
                          ) : task.restrictions ? (
                            <StatusBadge status="Restricción" variant="error" />
                          ) : null}
                        </div>

                        {/* Task Name */}
                        <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white line-clamp-2 mb-3">
                          {task.name}
                        </h4>

                        {/* Progress */}
                        <div className="space-y-1 mt-auto">
                          <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                            <span>Avance</span>
                            <span className={progress > 100 ? 'text-red-650' : 'text-slate-800 dark:text-slate-200'}>
                              {progress.toFixed(0)}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-850 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${progress > 100 ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'}`}
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Footer details */}
                        <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold border-t border-slate-100 dark:border-slate-800/80 mt-3 pt-2">
                          <div className="flex items-center gap-1">
                            <CalendarDays size={10} />
                            <span>{task.endDate?.slice(5)}</span>
                          </div>
                          <span>${(task.plannedQuantity * task.unitCost).toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })}
                  {laneTasks.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400 border border-dashed border-slate-200/40 dark:border-slate-800/30 rounded-2xl">
                      <Layers size={24} className="opacity-20 mb-2" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Lanzar aquí</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PANEL LATERAL INTERACTIVO (DRAWER) DE DETALLES DE LA TAREA */}
      <AnimatePresence>
        {isDrawerOpen && selectedTask && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl h-full flex flex-col z-10"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start gap-4 shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md dark:bg-blue-950/20 dark:text-blue-400">
                      {selectedTask.code || 'S/C'}
                    </span>
                    <select
                      value={selectedTask.status || 'planning'}
                      onChange={async (e) => {
                        const newStatus = e.target.value;
                        const getLaneLabel = (id: string) => KANBAN_LANES.find(l => l.id === id)?.label || id;
                        const historyEntry = {
                          action: `Estado modificado a "${getLaneLabel(newStatus)}"`,
                          user: auth.currentUser?.displayName || auth.currentUser?.email || 'Usuario',
                          timestamp: new Date().toISOString()
                        };
                        const updatedHistory = selectedTask.history ? [...selectedTask.history, historyEntry] : [historyEntry];
                        
                        await updateDoc(doc(db, 'tasks', selectedTask.id), {
                          status: newStatus,
                          history: updatedHistory
                        });

                        setSelectedTask(prev => ({ ...prev, status: newStatus, history: updatedHistory }));
                      }}
                      className="text-xs font-bold border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 bg-white dark:bg-slate-900 outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      {KANBAN_LANES.map(lane => (
                        <option key={lane.id} value={lane.id}>{lane.label}</option>
                      ))}
                    </select>
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-slate-950 dark:text-white leading-tight line-clamp-2">
                    {selectedTask.name}
                  </h2>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white transition-colors cursor-pointer shrink-0"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-slate-100 dark:border-slate-800 px-5 shrink-0 bg-slate-50/20 dark:bg-slate-900/20">
                {(['general', 'comments', 'evidence', 'history'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setDrawerTab(tab)}
                    className={`py-3.5 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                      drawerTab === tab 
                        ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-black' 
                        : 'border-transparent text-slate-405 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                    {tab === 'general' ? 'Información' : tab === 'comments' ? 'Comentarios' : tab === 'evidence' ? 'Evidencias' : 'Auditoría'}
                  </button>
                ))}
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                {drawerTab === 'general' && (
                  <form onSubmit={handleUpdateDetails} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="WBS Código"
                        value={selectedTask.code || ''}
                        onChange={e => setSelectedTask({ ...selectedTask, code: e.target.value })}
                        required
                      />
                      <Input
                        label="Unidad"
                        value={selectedTask.unit || 'm2'}
                        onChange={e => setSelectedTask({ ...selectedTask, unit: e.target.value })}
                        required
                      />
                    </div>
                    <Input
                      label="Partida"
                      value={selectedTask.name || ''}
                      onChange={e => setSelectedTask({ ...selectedTask, name: e.target.value })}
                      required
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Planificado Qty"
                        type="number"
                        step="0.01"
                        value={selectedTask.plannedQuantity || ''}
                        onChange={e => setSelectedTask({ ...selectedTask, plannedQuantity: Number(e.target.value) })}
                        required
                      />
                      <Input
                        label="Ejecutado Qty"
                        type="number"
                        step="0.01"
                        value={selectedTask.executedQuantity || 0}
                        onChange={e => setSelectedTask({ ...selectedTask, executedQuantity: Number(e.target.value) })}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Costo Unitario ($)"
                        type="number"
                        step="0.01"
                        value={selectedTask.unitCost || ''}
                        onChange={e => setSelectedTask({ ...selectedTask, unitCost: Number(e.target.value) })}
                        required
                      />
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-500 uppercase">Presupuesto Total</label>
                        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950/40 rounded-2xl text-sm font-mono font-bold text-slate-850 dark:text-slate-150 border border-slate-100 dark:border-slate-850">
                          ${((selectedTask.plannedQuantity || 0) * (selectedTask.unitCost || 0)).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Fecha Inicio"
                        type="date"
                        value={selectedTask.startDate || ''}
                        onChange={e => setSelectedTask({ ...selectedTask, startDate: e.target.value })}
                      />
                      <Input
                        label="Fecha Fin"
                        type="date"
                        value={selectedTask.endDate || ''}
                        onChange={e => setSelectedTask({ ...selectedTask, endDate: e.target.value })}
                      />
                    </div>

                    <hr className="border-slate-100 dark:border-slate-800" />
                    
                    <div className="space-y-4 pt-2">
                      <Input
                        label="Responsable de Cuadrilla"
                        value={selectedTask.responsible || ''}
                        onChange={e => setSelectedTask({ ...selectedTask, responsible: e.target.value })}
                        icon={<Users size={16} />}
                        placeholder="Ej. Ing. Carlos Pérez"
                      />
                      <Input
                        label="Frente de Trabajo / Ubicación"
                        value={selectedTask.front || ''}
                        onChange={e => setSelectedTask({ ...selectedTask, front: e.target.value })}
                        icon={<Layers size={16} />}
                        placeholder="Ej. Kp 12+500"
                      />
                      <Input
                        label="Restricciones / Bloqueos"
                        value={selectedTask.restrictions || ''}
                        onChange={e => setSelectedTask({ ...selectedTask, restrictions: e.target.value })}
                        icon={<AlertCircle size={16} />}
                        placeholder="Ej. Pendiente de permisos de PDVSA"
                      />
                      <Input
                        label="Partidas de Dependencia"
                        value={selectedTask.dependencies || ''}
                        onChange={e => setSelectedTask({ ...selectedTask, dependencies: e.target.value })}
                        icon={<Tag size={16} />}
                        placeholder="Ej. MSP-102"
                      />
                    </div>

                    <div className="pt-4 flex gap-3">
                      <Button
                        type="submit"
                        variant="primary"
                        className="flex-1 rounded-2xl"
                      >
                        Guardar Cambios
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => handleDelete(selectedTask.id)}
                        className="border border-red-200 hover:bg-red-50 hover:text-red-700 text-red-600 rounded-2xl shrink-0"
                        title="Eliminar partida"
                      >
                        Eliminar
                      </Button>
                    </div>
                  </form>
                )}

                {drawerTab === 'comments' && (
                  <div className="flex flex-col h-full space-y-4">
                    {/* Comments List */}
                    <div className="flex-1 space-y-4 min-h-[300px] max-h-[50vh] overflow-y-auto pr-1">
                      {commentsList.map(comment => (
                        <div key={comment.id} className="flex gap-3 bg-slate-50/50 dark:bg-slate-950/20 p-3.5 rounded-2xl border border-slate-100/50 dark:border-slate-850">
                          <img 
                            src={comment.userPhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${comment.user}`} 
                            alt={comment.user}
                            className="w-8 h-8 rounded-full shrink-0 border border-slate-200/50 dark:border-slate-800"
                          />
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex justify-between items-center gap-2">
                              <span className="text-xs font-black text-slate-800 dark:text-slate-250 truncate">{comment.user}</span>
                              <span className="text-[9px] font-bold text-slate-400 font-mono shrink-0">
                                {new Date(comment.createdAt).toLocaleDateString()} {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-350 leading-relaxed break-words whitespace-pre-wrap">
                              {comment.text}
                            </p>
                          </div>
                        </div>
                      ))}
                      {commentsList.length === 0 && !isCommentsLoading && (
                        <div className="text-center py-12 text-slate-400">
                          <MessageSquare className="mx-auto mb-2 opacity-25" size={32} />
                          <p className="text-xs font-bold uppercase tracking-wider">Cero comentarios</p>
                          <p className="text-[10px] text-slate-400">Comienza la discusión escribiendo abajo.</p>
                        </div>
                      )}
                      {isCommentsLoading && (
                        <div className="flex justify-center items-center py-12">
                          <Loader2 className="animate-spin text-emerald-600" size={24} />
                        </div>
                      )}
                    </div>

                    {/* New Comment Input Form */}
                    <form onSubmit={handleAddComment} className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                      <input
                        type="text"
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                        placeholder="Escribe un comentario..."
                        className="flex-1 px-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-900/50 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs sm:text-sm font-semibold outline-none focus:border-emerald-500 dark:focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                      />
                      <IconButton
                        type="submit"
                        variant="primary"
                        size="md"
                        disabled={!newComment.trim()}
                        icon={<Send size={16} />}
                      />
                    </form>
                  </div>
                )}

                {drawerTab === 'evidence' && (
                  <div className="space-y-4">
                    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-250 dark:border-slate-800 rounded-3xl text-slate-400 text-center">
                      <Paperclip size={36} className="opacity-25 mb-2" />
                      <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-1">Cargar evidencia técnica</h4>
                      <p className="text-xs text-slate-500 max-w-[250px] leading-relaxed mb-4">Fotos de campo, actas de medición o reportes firmados.</p>
                      <Button variant="outline" size="sm" icon={<Upload size={14} />} onClick={() => alert("Sube fotos en Reportes de Campo o asocia documentos.")}>
                        Seleccionar Archivo
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-850 rounded-2xl">
                        <div className="p-2.5 bg-blue-50 dark:bg-blue-950/30 text-blue-600 rounded-xl">
                          <FileCode size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">Acta_Medicion_01_Prointeca.pdf</p>
                          <p className="text-[10px] text-slate-500 font-mono">1.2 MB • Sistema</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {drawerTab === 'history' && (
                  <div className="space-y-4">
                    <div className="relative border-l border-slate-200 dark:border-slate-800 pl-4 ml-2 space-y-5">
                      {selectedTask.history ? (
                        [...selectedTask.history].reverse().map((log: any, idx) => (
                          <div key={idx} className="relative space-y-1">
                            <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
                            <div className="flex justify-between items-center gap-2">
                              <span className="text-[11px] font-black text-slate-850 dark:text-slate-200">{log.user}</span>
                              <span className="text-[9px] font-bold text-slate-400 font-mono shrink-0">
                                {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{log.action}</p>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 text-slate-400">
                          <History className="mx-auto mb-2 opacity-25" size={24} />
                          <p className="text-xs font-bold uppercase tracking-wider">Cero historial</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 1: REGISTRAR AVANCE */}
      {isProgressModalOpen && progressTask && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Registrar Avance</h2>
              <button onClick={() => { setIsProgressModalOpen(false); setProgressTask(null); }} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="mb-4 p-3 bg-gray-50 rounded-xl border border-gray-150 text-xs">
              <p className="font-bold text-gray-700">{progressTask.name}</p>
              <p className="text-gray-500 mt-1">Avance Actual: <span className="font-mono text-emerald-600 font-bold">{progressTask.executedQuantity.toFixed(2)} {progressTask.unit}</span> / Planificado: <span className="font-mono text-gray-700 font-bold">{progressTask.plannedQuantity} {progressTask.unit}</span></p>
            </div>

            <form onSubmit={handleSaveProgress} className="space-y-4">
              {progressTask.unit === 'm2' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Largo (m)</label>
                    <input required type="number" step="0.01" value={compLength || ''} onChange={e => setCompLength(Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Ancho (m)</label>
                    <input required type="number" step="0.01" value={compWidth || ''} onChange={e => setCompWidth(Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
                  </div>
                </div>
              )}

              {progressTask.unit === 'm3' && (
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Largo (m)</label>
                    <input required type="number" step="0.01" value={compLength || ''} onChange={e => setCompLength(Number(e.target.value))} className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Ancho (m)</label>
                    <input required type="number" step="0.01" value={compWidth || ''} onChange={e => setCompWidth(Number(e.target.value))} className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Alto (m)</label>
                    <input required type="number" step="0.01" value={compHeight || ''} onChange={e => setCompHeight(Number(e.target.value))} className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm" />
                  </div>
                </div>
              )}

              {progressTask.unit === 'ml' && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Longitud (m)</label>
                  <input required type="number" step="0.01" value={compLength || ''} onChange={e => setCompLength(Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
              )}

              {progressTask.unit !== 'm2' && progressTask.unit !== 'm3' && progressTask.unit !== 'ml' && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Cantidad a registrar ({progressTask.unit})</label>
                  <input required type="number" step="0.01" value={compQuantity || ''} onChange={e => setCompQuantity(Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
              )}

              <div className="bg-emerald-55 border border-emerald-100 rounded-lg p-3 mt-4 flex justify-between items-center">
                <span className="text-sm font-medium text-emerald-800">Total a sumar:</span>
                <span className="text-lg font-bold text-emerald-600">{calculateProgressQuantity().toFixed(2)} {progressTask.unit}</span>
              </div>

              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => { setIsProgressModalOpen(false); setProgressTask(null); }} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer font-bold">Validar y Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CREAR TAREA */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Nueva Partida</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Código WBS"
                  required
                  value={newTask.code}
                  onChange={e => setNewTask({ ...newTask, code: e.target.value })}
                  placeholder="Ej. AC-100"
                />
                <Select
                  label="Unidad"
                  value={newTask.unit}
                  onChange={e => setNewTask({ ...newTask, unit: e.target.value })}
                  options={[
                    { value: 'm', label: 'Metros Lineales (m)' },
                    { value: 'ml', label: 'Metros Lineales (ml)' },
                    { value: 'm2', label: 'Metros Cuadrados (m2)' },
                    { value: 'm3', label: 'Metros Cúbicos (m3)' },
                    { value: 'kg', label: 'Kilogramos (kg)' },
                    { value: 'ton', label: 'Toneladas (ton)' },
                    { value: 'und', label: 'Unidades (und)' },
                    { value: 'glb', label: 'Global (glb)' }
                  ]}
                />
              </div>

              <Input
                label="Nombre de Partida"
                required
                value={newTask.name}
                onChange={e => setNewTask({ ...newTask, name: e.target.value })}
                placeholder="Ej. Excavación de zanja mecánica en tierra"
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Cantidad Planificada"
                  type="number"
                  step="0.01"
                  required
                  value={newTask.plannedQuantity}
                  onChange={e => setNewTask({ ...newTask, plannedQuantity: e.target.value })}
                  placeholder="0.00"
                />
                <Input
                  label="Costo Unitario ($)"
                  type="number"
                  step="0.01"
                  required
                  value={newTask.unitCost}
                  onChange={e => setNewTask({ ...newTask, unitCost: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="secondary" className="flex-1" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" className="flex-1">
                  Crear Partida
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: EDITAR TAREA (FORMULARIO MANUAL) */}
      {isEditModalOpen && editingTask && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Editar Partida</h2>
              <button onClick={() => { setIsEditModalOpen(false); setEditingTask(null); }} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Código WBS"
                  required
                  value={editingTask.code || ''}
                  onChange={e => setEditingTask({ ...editingTask, code: e.target.value })}
                />
                <Select
                  label="Unidad"
                  value={editingTask.unit}
                  onChange={e => setEditingTask({ ...editingTask, unit: e.target.value })}
                  options={[
                    { value: 'm', label: 'Metros Lineales (m)' },
                    { value: 'ml', label: 'Metros Lineales (ml)' },
                    { value: 'm2', label: 'Metros Cuadrados (m2)' },
                    { value: 'm3', label: 'Metros Cúbicos (m3)' },
                    { value: 'kg', label: 'Kilogramos (kg)' },
                    { value: 'ton', label: 'Toneladas (ton)' },
                    { value: 'und', label: 'Unidades (und)' },
                    { value: 'glb', label: 'Global (glb)' }
                  ]}
                />
              </div>

              <Input
                label="Nombre de Partida"
                required
                value={editingTask.name}
                onChange={e => setEditingTask({ ...editingTask, name: e.target.value })}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Cantidad Planificada"
                  type="number"
                  step="0.01"
                  required
                  value={editingTask.plannedQuantity}
                  onChange={e => setEditingTask({ ...editingTask, plannedQuantity: e.target.value })}
                />
                <Input
                  label="Costo Unitario ($)"
                  type="number"
                  step="0.01;;"
                  required
                  value={editingTask.unitCost}
                  onChange={e => setEditingTask({ ...editingTask, unitCost: e.target.value })}
                />
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="secondary" className="flex-1" onClick={() => { setIsEditModalOpen(false); setEditingTask(null); }}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" className="flex-1">
                  Guardar Cambios
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASISTENTE IA MODAL */}
      {isAiModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 font-black">Asistente IA de Partidas</h2>
                  <p className="text-sm text-gray-500 font-medium">Consulta sobre el estado, retrasos o prioridades</p>
                </div>
              </div>
              <button onClick={() => setIsAiModalOpen(false)} className="text-gray-400 hover:text-gray-600 shrink-0">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto mb-4 p-4 bg-gray-50 rounded-xl border border-gray-100 min-h-[200px]">
              {aiResponse ? (
                <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap font-medium">
                  {aiResponse}
                </div>
              ) : isAiLoading ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-3">
                  <Loader2 size={32} className="animate-spin text-purple-600" />
                  <p className="font-bold">Analizando datos del proyecto y buscando información...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3 text-center">
                  <Sparkles size={48} className="opacity-20" />
                  <p className="font-bold">Pregúntame sobre las partidas críticas, retrasos, o recomendaciones técnicas.</p>
                  <div className="flex flex-wrap gap-2 justify-center mt-4">
                    <button onClick={() => setAiQuery('¿Cuáles son las partidas críticas para esta semana?')} className="text-xs bg-white border border-gray-200 px-3.5 py-1.5 rounded-full hover:bg-purple-50 hover:text-purple-700 transition-colors cursor-pointer font-bold">¿Partidas críticas esta semana?</button>
                    <button onClick={() => setAiQuery('¿Qué partidas están atrasadas según el plan?')} className="text-xs bg-white border border-gray-200 px-3.5 py-1.5 rounded-full hover:bg-purple-50 hover:text-purple-700 transition-colors cursor-pointer font-bold">¿Partidas atrasadas?</button>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleAskAI} className="flex gap-3 mt-auto">
              <input 
                type="text" 
                value={aiQuery} 
                onChange={e => setAiQuery(e.target.value)} 
                placeholder="Escribe tu pregunta aquí..." 
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm font-semibold"
                disabled={isAiLoading}
              />
              <Button 
                type="submit" 
                disabled={isAiLoading || !aiQuery.trim()}
                variant="primary"
                className="bg-purple-600 hover:bg-purple-750 text-white"
              >
                Preguntar
              </Button>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
}
