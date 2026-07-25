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
      <header>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Inteligencia y RAG (Mod 7)</h1>
        <p className="text-gray-500 mt-1">Conecta bases de conocimiento exportadas desde NotebookLM</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
                  <Settings2 size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Configuración y Sincronización</h2>
                  <p className="text-sm text-gray-500">Carga conocimiento (.json) desde tu CLI local</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={fetchNotebooks}
                  disabled={connecting}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded-lg font-medium transition-all"
                >
                  <Zap size={18} /> {connecting ? 'Conectando...' : 'Conectar Servidor Local'}
                </button>
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg font-medium transition-all"
                >
                  <Save size={18} /> {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Link2 size={16} className="text-gray-400" /> Seleccionar Notebook Conectado
                </label>
                <select 
                  value={config.notebookId}
                  onChange={(e) => setConfig({...config, notebookId: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">-- Selecciona un Notebook --</option>
                  {notebooks.map(nb => <option key={nb.id} value={nb.id}>{nb.name}</option>)}
                </select>
              </div>
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <BookOpen size={16} className="text-gray-400" /> Normativa Activa
                </label>
                <select value={config.activeStandard} onChange={(e) => setConfig({...config, activeStandard: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500">
                  <option value="PDVSA A-211">PDVSA A-211</option>
                  <option value="PDVSA L-STC-001">PDVSA L-STC-001</option>
                </select>
              </div>
            </div>
          </motion.div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
              <Database size={20} className="text-blue-600" /> Fuentes de Conocimiento Conectadas
            </h2>
            <div className="space-y-3 p-4 bg-gray-50 rounded-xl text-center text-sm text-gray-500">
              No hay fuentes importadas. Importa un archivo JSON de NotebookLM configurado.
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-emerald-900 rounded-2xl p-6 text-white shadow-lg relative">
            <Sparkles className="absolute -top-4 -right-4 w-24 h-24 text-white/10 rotate-12" />
            <h3 className="text-lg font-bold mb-2">Estado del Cerebro</h3>
            <p className="text-sm text-emerald-100 opacity-80">El motor RAG está configurado para este proyecto.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
