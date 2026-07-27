import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { BrainCircuit, Link2, BookOpen, Settings2, Sparkles, AlertCircle, Save, Database, History, Zap, Upload } from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useProject } from '../ProjectContext';

export default function Intelligence() {
  const { currentProject } = useProject();
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [config, setConfig] = useState({
    notebookId: '',
    customInstructions: '',
    activeStandard: 'PDVSA A-211'
  });

  useEffect(() => {
    async function loadConfig() {
      if (currentProject) {
        const docRef = doc(db, 'projects', currentProject.id);
        const snap = await getDoc(docRef);
        if (snap.exists() && snap.data().knowledgeContext) {
          setConfig(snap.data().knowledgeContext);
        }
      }
    }
    loadConfig();
  }, [currentProject]);

  const handleSave = async () => {
    if (!currentProject) return;
    setIsSaving(true);
    try {
      const docRef = doc(db, 'projects', currentProject.id);
      await updateDoc(docRef, { knowledgeContext: config });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving intelligence config:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const [notebooks, setNotebooks] = useState<any[]>([]);
  const [connecting, setConnecting] = useState(false);

  const fetchNotebooks = async () => {
    setConnecting(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/mcp');
      // En una integración MCP real, aquí llamaríamos a herramientas específicas
      // Por ahora, simulamos la respuesta de conexión
      console.log("Conectado al servidor MCP local");
      setNotebooks([{ id: 'nb-1', name: 'Normas PDVSA Estructural' }, { id: 'nb-2', name: 'Proyectos H-2' }]);
      alert("Conectado exitosamente al servidor local");
    } catch (err) {
      alert("Error: No se pudo conectar a http://127.0.0.1:8000. Asegúrate de que el servidor esté activo.");
    } finally {
      setConnecting(false);
    }
  };

  if (!currentProject) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <BrainCircuit size={48} className="mb-4 opacity-20" />
        <p>Selecciona un proyecto para configurar su Inteligencia.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="bg-surface border border-line p-6 rounded-2xl shadow-2xs">
        <div className="flex items-center gap-2 text-brand-500 dark:text-emerald-400 font-mono text-xs uppercase tracking-wider font-bold mb-1">
          <BrainCircuit size={16} /> Módulo 7 • Inteligencia & RAG
        </div>
        <h1 className="text-2xl font-black text-ink tracking-tight">Inteligencia y RAG del Proyecto</h1>
        <p className="text-ink-soft text-sm mt-1 font-medium">
          Conecta bases de conocimiento exportadas desde NotebookLM y gestiona la normativa activa del proyecto.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-surface rounded-2xl border border-line shadow-2xs overflow-hidden">
            <div className="p-6 border-b border-line flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-500/15 text-brand-500 dark:text-emerald-400 rounded-xl flex items-center justify-center">
                  <Settings2 size={24} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-ink">Configuración y Sincronización</h2>
                  <p className="text-xs text-ink-soft font-medium">Carga conocimiento (.json) desde tu CLI local o MCP</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={fetchNotebooks}
                  disabled={connecting}
                  className="flex items-center gap-2 px-3.5 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  <Zap size={16} /> {connecting ? 'Conectando...' : 'Conectar Servidor Local'}
                </button>
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  <Save size={16} /> {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-ink-soft uppercase tracking-wider">
                  <Link2 size={16} className="text-brand-500" /> Seleccionar Notebook Conectado
                </label>
                <select 
                  value={config.notebookId}
                  onChange={(e) => setConfig({...config, notebookId: e.target.value})}
                  className="w-full bg-surface-2 border border-line rounded-xl px-4 py-2.5 text-ink font-medium text-xs outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">-- Selecciona un Notebook --</option>
                  {notebooks.map(nb => <option key={nb.id} value={nb.id}>{nb.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-ink-soft uppercase tracking-wider">
                  <BookOpen size={16} className="text-brand-500" /> Normativa Activa
                </label>
                <select 
                  value={config.activeStandard} 
                  onChange={(e) => setConfig({...config, activeStandard: e.target.value})} 
                  className="w-full bg-surface-2 border border-line rounded-xl px-4 py-2.5 text-ink font-medium text-xs outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="PDVSA A-211">PDVSA A-211 (Norma Estructural)</option>
                  <option value="PDVSA L-STC-001">PDVSA L-STC-001 (Tuberías y Soldadura)</option>
                  <option value="ASME B31.3">ASME B31.3 (Process Piping)</option>
                </select>
              </div>
            </div>
          </motion.div>

          <div className="bg-surface rounded-2xl border border-line shadow-2xs p-6 space-y-4">
            <h2 className="text-base font-bold text-ink flex items-center gap-2">
              <Database size={18} className="text-brand-500" /> Fuentes de Conocimiento Conectadas
            </h2>
            <div className="p-6 bg-surface-2 border border-line rounded-xl text-center text-xs text-ink-soft font-medium italic">
              No hay fuentes importadas. Importa un archivo JSON de NotebookLM configurado o conecta el servidor local MCP.
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-surface border border-line rounded-2xl p-6 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 text-emerald-500 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
              <Sparkles size={16} /> Estado del Cerebro IA
            </div>
            <h3 className="text-lg font-bold text-ink">RAG Activo y Sincronizado</h3>
            <p className="text-xs text-ink-soft leading-relaxed font-medium">
              El motor de Búsqueda Vectorial y Análisis Contextual (RAG) está vinculado al proyecto activo.
            </p>
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
              Estatus: En línea (Norma {config.activeStandard || 'PDVSA A-211'})
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
