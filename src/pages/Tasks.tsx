import { useState, useEffect, useRef } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, doc, deleteDoc, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Plus, CheckCircle2, Circle, Upload, LayoutList, CalendarDays, Edit2, Trash2, Activity, AlertTriangle, Sparkles, X, Loader2 } from 'lucide-react';
import { XMLParser } from 'fast-xml-parser';
import { motion } from 'motion/react';
import { GoogleGenAI } from '@google/genai';
import { useProject } from '../ProjectContext';

export default function Tasks() {
  const { currentProject } = useProject();
  const [tasks, setTasks] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [budgetThreshold, setBudgetThreshold] = useState(90);
  
  const [newTask, setNewTask] = useState({ name: '', unit: 'm2', plannedQuantity: '', unitCost: '' });
  const [editingTask, setEditingTask] = useState<any>(null);
  const [progressTask, setProgressTask] = useState<any>(null);
  
  // Progress computation state
  const [compLength, setCompLength] = useState<number>(0);
  const [compWidth, setCompWidth] = useState<number>(0);
  const [compHeight, setCompHeight] = useState<number>(0);
  const [compQuantity, setCompQuantity] = useState<number>(0);

  const [viewMode, setViewMode] = useState<'list' | 'gantt'>('list');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

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

  const handleAskAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;
    
    setIsAiLoading(true);
    setAiResponse('');
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      // Prepare context
      const tasksContext = tasks.map(t => 
        `- ${t.name}: Planificado ${t.plannedQuantity} ${t.unit}, Ejecutado ${t.executedQuantity.toFixed(2)} ${t.unit}, Costo Unitario $${t.unitCost}, Inicio: ${t.startDate}, Fin: ${t.endDate}`
      ).join('\n');
      
      const prompt = `Eres un asistente experto en gestión de proyectos de construcción e ingeniería civil. 
Aquí están los datos actuales de las partidas (tareas) del proyecto:
${tasksContext}

Responde a la siguiente pregunta del usuario basándote en los datos del proyecto proporcionados. 
Si la pregunta requiere información técnica especializada, normativas de construcción, o mejores prácticas, utiliza la herramienta de búsqueda en internet, pero asegúrate de basarte solo en fuentes fiables y especializadas.

Pregunta del usuario: ${aiQuery}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });
      
      setAiResponse(response.text || 'No se pudo generar una respuesta.');
    } catch (error) {
      console.error("Error asking AI:", error);
      setAiResponse("Hubo un error al consultar al asistente. Por favor, intenta de nuevo.");
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
      await addDoc(collection(db, 'tasks'), {
        projectId: currentProject.id,
        name: newTask.name,
        unit: newTask.unit,
        plannedQuantity: Number(newTask.plannedQuantity),
        executedQuantity: 0,
        unitCost: Number(newTask.unitCost),
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
      setIsModalOpen(false);
      setNewTask({ name: '', unit: 'm2', plannedQuantity: '', unitCost: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'tasks');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    try {
      await updateDoc(doc(db, 'tasks', editingTask.id), {
        name: editingTask.name,
        unit: editingTask.unit,
        plannedQuantity: Number(editingTask.plannedQuantity),
        unitCost: Number(editingTask.unitCost),
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
      await updateDoc(doc(db, 'tasks', progressTask.id), {
        executedQuantity: newExecuted
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

        for (const t of tasksArray) {
          if (t.Name && t.Name !== 'Project Summary Task') {
            await addDoc(collection(db, 'tasks'), {
              projectId: 'default-project',
              name: t.Name,
              unit: 'glb',
              plannedQuantity: 1,
              executedQuantity: t.PercentComplete ? Number(t.PercentComplete) / 100 : 0,
              unitCost: 0,
              startDate: t.Start ? t.Start.split('T')[0] : new Date().toISOString().split('T')[0],
              endDate: t.Finish ? t.Finish.split('T')[0] : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            });
          }
        }
        alert('Tareas importadas exitosamente');
      } catch (error) {
        console.error("Error parsing MS Project XML:", error);
        alert('Error al procesar el archivo. Asegúrate de que sea un XML exportado de MS Project.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Control de Partidas</h1>
          <p className="text-gray-500 mt-1">Cómputos métricos, cronograma y control de avance</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button 
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-2 text-sm font-medium transition-colors ${viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <LayoutList size={16} /> Lista
            </button>
            <button 
              onClick={() => setViewMode('gantt')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-2 text-sm font-medium transition-colors ${viewMode === 'gantt' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <CalendarDays size={16} /> Gantt
            </button>
          </div>
          <input 
            type="file" 
            accept=".xml" 
            ref={fileInputRef} 
            onChange={handleImportMSProject} 
            className="hidden" 
          />
          <button 
            onClick={() => setIsAiModalOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
          >
            <Sparkles size={20} />
            Asistente IA
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
          >
            <Upload size={20} />
            Importar MS Project
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus size={20} />
            Nueva Partida
          </button>
        </div>
      </header>

      {viewMode === 'list' ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-sm">
                  <th className="p-4 font-medium">Partida</th>
                  <th className="p-4 font-medium">Unidad</th>
                  <th className="p-4 font-medium">Planificado</th>
                  <th className="p-4 font-medium">Ejecutado</th>
                  <th className="p-4 font-medium">Avance</th>
                  <th className="p-4 font-medium">Costo Unit.</th>
                  <th className="p-4 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tasks.map(task => {
                  const progress = task.plannedQuantity > 0 ? (task.executedQuantity / task.plannedQuantity) * 100 : 0;
                  const isComplete = progress >= 100;
                  const isWarning = progress >= budgetThreshold && progress < 100;
                  
                  return (
                    <tr key={task.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {isComplete ? (
                            <CheckCircle2 className="text-emerald-500 shrink-0" size={20} />
                          ) : isWarning ? (
                            <AlertTriangle className="text-amber-500 shrink-0" size={20} />
                          ) : (
                            <Circle className="text-gray-300 shrink-0" size={20} />
                          )}
                          <span className="font-medium text-gray-900 line-clamp-2">{task.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-gray-500">{task.unit}</td>
                      <td className="p-4 text-gray-900">{task.plannedQuantity}</td>
                      <td className="p-4 text-emerald-600 font-medium">{task.executedQuantity.toFixed(2)}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-gray-200 rounded-full h-2 min-w-[60px] max-w-[100px]">
                            <div 
                              className={`h-2 rounded-full ${progress > 100 ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            ></div>
                          </div>
                          <span className={`text-sm ${progress > 100 ? 'text-red-600 font-bold' : isWarning ? 'text-amber-600 font-bold' : 'text-gray-500'}`}>
                            {progress.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-gray-500">${task.unitCost}</td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => openProgressModal(task)}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Registrar Avance"
                          >
                            <Activity size={18} />
                          </button>
                          <button 
                            onClick={() => { setEditingTask(task); setIsEditModalOpen(true); }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar Partida"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete(task.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar Partida"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {tasks.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      No hay partidas registradas. Crea una nueva o importa desde MS Project.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="grid grid-cols-12 gap-4 border-b border-gray-100 pb-4 mb-4 text-sm font-medium text-gray-500">
              <div className="col-span-3">Partida</div>
              <div className="col-span-9 flex justify-between">
                <span>Inicio</span>
                <span>Progreso</span>
                <span>Fin</span>
              </div>
            </div>
            <div className="space-y-4">
              {tasks.map(task => {
                const progress = task.plannedQuantity > 0 ? (task.executedQuantity / task.plannedQuantity) * 100 : 0;
                const isWarning = progress >= budgetThreshold && progress < 100;
                return (
                  <div key={task.id} className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-3 text-sm font-medium text-gray-900 truncate" title={task.name}>
                      {task.name}
                    </div>
                    <div className="col-span-9 relative h-8 bg-gray-50 rounded-lg overflow-hidden flex items-center px-2 text-xs text-gray-500">
                      <div 
                        className={`absolute left-0 top-0 bottom-0 border-l-4 transition-all ${isWarning ? 'bg-amber-100 border-amber-500' : 'bg-emerald-100 border-emerald-500'}`}
                        style={{ width: `${Math.max(10, Math.min(progress, 100))}%` }}
                      >
                        <div className={`h-full w-full ${progress > 100 ? 'bg-red-500/20' : isWarning ? 'bg-amber-500/20' : 'bg-emerald-500/20'}`} style={{ width: `${Math.min(progress, 100)}%` }}></div>
                      </div>
                      <span className="relative z-10 w-full flex justify-between px-2">
                        <span>{task.startDate || 'N/A'}</span>
                        <span className={`font-bold ${progress > 100 ? 'text-red-700' : isWarning ? 'text-amber-700' : 'text-emerald-700'}`}>{progress.toFixed(0)}%</span>
                        <span>{task.endDate || 'N/A'}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Nueva Partida</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción de la Partida</label>
                <input required type="text" value={newTask.name} onChange={e => setNewTask({...newTask, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unidad</label>
                  <select value={newTask.unit} onChange={e => setNewTask({...newTask, unit: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
                    <option value="m2">m² (Área)</option>
                    <option value="m3">m³ (Volumen)</option>
                    <option value="ml">ml (Longitud)</option>
                    <option value="kg">kg (Peso)</option>
                    <option value="und">und (Unidad)</option>
                    <option value="glb">glb (Global)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cant. Planificada</label>
                  <input required type="number" step="0.01" value={newTask.plannedQuantity} onChange={e => setNewTask({...newTask, plannedQuantity: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Costo Unitario ($)</label>
                <input required type="number" step="0.01" value={newTask.unitCost} onChange={e => setNewTask({...newTask, unitCost: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">Guardar Partida</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && editingTask && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Editar Partida</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción de la Partida</label>
                <input required type="text" value={editingTask.name} onChange={e => setEditingTask({...editingTask, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unidad</label>
                  <select value={editingTask.unit} onChange={e => setEditingTask({...editingTask, unit: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
                    <option value="m2">m² (Área)</option>
                    <option value="m3">m³ (Volumen)</option>
                    <option value="ml">ml (Longitud)</option>
                    <option value="kg">kg (Peso)</option>
                    <option value="und">und (Unidad)</option>
                    <option value="glb">glb (Global)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cant. Planificada</label>
                  <input required type="number" step="0.01" value={editingTask.plannedQuantity} onChange={e => setEditingTask({...editingTask, plannedQuantity: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Costo Unitario ($)</label>
                <input required type="number" step="0.01" value={editingTask.unitCost} onChange={e => setEditingTask({...editingTask, unitCost: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => { setIsEditModalOpen(false); setEditingTask(null); }} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Actualizar Partida</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Progress Control Modal */}
      {isProgressModalOpen && progressTask && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                <Activity size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Control de Avance</h2>
                <p className="text-sm text-gray-500 truncate max-w-[250px]">{progressTask.name}</p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl mb-6 border border-gray-100 flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500">Planificado</p>
                <p className="font-semibold text-gray-900">{progressTask.plannedQuantity} {progressTask.unit}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Ejecutado Actual</p>
                <p className="font-semibold text-emerald-600">{progressTask.executedQuantity.toFixed(2)} {progressTask.unit}</p>
              </div>
            </div>

            <form onSubmit={handleSaveProgress} className="space-y-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Ingresa los cómputos de la jornada:</p>
              
              {progressTask.unit === 'm3' && (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Largo (m)</label>
                    <input required type="number" step="0.01" value={compLength || ''} onChange={e => setCompLength(Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Ancho (m)</label>
                    <input required type="number" step="0.01" value={compWidth || ''} onChange={e => setCompWidth(Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Alto/Esp. (m)</label>
                    <input required type="number" step="0.01" value={compHeight || ''} onChange={e => setCompHeight(Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
                  </div>
                </div>
              )}

              {progressTask.unit === 'm2' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Largo (m)</label>
                    <input required type="number" step="0.01" value={compLength || ''} onChange={e => setCompLength(Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Ancho/Alto (m)</label>
                    <input required type="number" step="0.01" value={compWidth || ''} onChange={e => setCompWidth(Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
                  </div>
                </div>
              )}

              {progressTask.unit === 'ml' && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Longitud (m)</label>
                  <input required type="number" step="0.01" value={compLength || ''} onChange={e => setCompLength(Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
              )}

              {['kg', 'und', 'glb'].includes(progressTask.unit) && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Cantidad a registrar ({progressTask.unit})</label>
                  <input required type="number" step="0.01" value={compQuantity || ''} onChange={e => setCompQuantity(Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
              )}

              <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 mt-4 flex justify-between items-center">
                <span className="text-sm font-medium text-emerald-800">Total a sumar:</span>
                <span className="text-lg font-bold text-emerald-600">{calculateProgressQuantity().toFixed(2)} {progressTask.unit}</span>
              </div>

              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => { setIsProgressModalOpen(false); setProgressTask(null); }} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">Validar y Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* AI Assistant Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Asistente IA de Partidas</h2>
                  <p className="text-sm text-gray-500">Consulta sobre el estado, retrasos o prioridades</p>
                </div>
              </div>
              <button onClick={() => setIsAiModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto mb-4 p-4 bg-gray-50 rounded-xl border border-gray-100 min-h-[200px]">
              {aiResponse ? (
                <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                  {aiResponse}
                </div>
              ) : isAiLoading ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-3">
                  <Loader2 size={32} className="animate-spin text-purple-600" />
                  <p>Analizando datos del proyecto y buscando información...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3 text-center">
                  <Sparkles size={48} className="opacity-20" />
                  <p>Pregúntame sobre las partidas críticas, retrasos, o recomendaciones técnicas.</p>
                  <div className="flex flex-wrap gap-2 justify-center mt-4">
                    <button onClick={() => setAiQuery('¿Cuáles son las partidas críticas para esta semana?')} className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-full hover:bg-purple-50 hover:text-purple-700 transition-colors">¿Partidas críticas esta semana?</button>
                    <button onClick={() => setAiQuery('¿Qué partidas están atrasadas según el plan?')} className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-full hover:bg-purple-50 hover:text-purple-700 transition-colors">¿Partidas atrasadas?</button>
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
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                disabled={isAiLoading}
              />
              <button 
                type="submit" 
                disabled={isAiLoading || !aiQuery.trim()}
                className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 font-medium"
              >
                Preguntar
              </button>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
}

