import { useState, useEffect, useRef } from 'react';
import { collection, query, onSnapshot, addDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { Plus, Building2, Calendar, DollarSign, FileSpreadsheet, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function Projects() {
  const [projects, setProjects] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '', budget: '', startDate: '' });
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'projects'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProjects(projs);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'projects');
    });
    return () => unsubscribe();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    try {
      await addDoc(collection(db, 'projects'), {
        name: newProject.name,
        description: newProject.description,
        budget: Number(newProject.budget),
        startDate: newProject.startDate,
        status: 'planning',
        ownerId: auth.currentUser.uid
      });
      setIsModalOpen(false);
      setNewProject({ name: '', description: '', budget: '', startDate: '' });
    } catch (error) {
      console.error("Error creating project:", error);
      alert("Error al crear el proyecto");
    }
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser) return;

    setIsImporting(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      let importedCount = 0;

      for (const row of jsonData as any[]) {
        // Map Excel columns to project fields. Adjust keys based on expected Excel format.
        const name = row['Nombre'] || row['name'] || row['Proyecto'] || 'Proyecto Importado';
        const description = row['Descripción'] || row['description'] || row['Detalle'] || '';
        const budget = Number(row['Presupuesto'] || row['budget'] || row['Monto'] || 0);
        
        // Handle date parsing if needed, or default to today
        let startDate = new Date().toISOString().split('T')[0];
        if (row['Fecha de Inicio'] || row['startDate'] || row['Fecha']) {
           const rawDate = row['Fecha de Inicio'] || row['startDate'] || row['Fecha'];
           if (typeof rawDate === 'number') {
              // Excel date serial number
              const date = new Date(Math.round((rawDate - 25569) * 86400 * 1000));
              startDate = date.toISOString().split('T')[0];
           } else if (typeof rawDate === 'string') {
              startDate = rawDate;
           }
        }

        await addDoc(collection(db, 'projects'), {
          name,
          description,
          budget,
          startDate,
          status: 'planning',
          ownerId: auth.currentUser.uid
        });
        importedCount++;
      }

      alert(`Se importaron ${importedCount} proyectos exitosamente.`);
    } catch (error) {
      console.error("Error importing Excel:", error);
      alert("Hubo un error al importar el archivo Excel. Verifica el formato.");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Reset input
      }
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Proyectos</h1>
          <p className="text-gray-500 mt-1">Gestiona tus obras activas</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <input 
            type="file" 
            accept=".xlsx, .xls, .csv" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleImportExcel}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="flex-1 sm:flex-none bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {isImporting ? <Loader2 size={20} className="animate-spin" /> : <FileSpreadsheet size={20} className="text-emerald-600" />}
            {isImporting ? 'Importando...' : 'Importar Excel'}
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <Plus size={20} />
            Nuevo Proyecto
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map(project => (
          <div key={project.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 mb-4 group-hover:scale-110 transition-transform">
              <Building2 size={24} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{project.name}</h3>
            <p className="text-gray-500 text-sm mb-4 line-clamp-2">{project.description}</p>
            
            <div className="space-y-2 pt-4 border-t border-gray-50">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <DollarSign size={16} className="text-gray-400" />
                <span>Presupuesto: <strong className="text-gray-900">${project.budget?.toLocaleString()}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar size={16} className="text-gray-400" />
                <span>Inicio: <strong className="text-gray-900">{project.startDate}</strong></span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Nuevo Proyecto</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Obra</label>
                <input required type="text" value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea required value={newProject.description} onChange={e => setNewProject({...newProject, description: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none resize-none h-24" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Presupuesto Estimado ($)</label>
                <input required type="number" value={newProject.budget} onChange={e => setNewProject({...newProject, budget: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Inicio</label>
                <input required type="date" value={newProject.startDate} onChange={e => setNewProject({...newProject, startDate: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">Crear Proyecto</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
