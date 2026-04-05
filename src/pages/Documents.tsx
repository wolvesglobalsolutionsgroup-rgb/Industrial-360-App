import { useState, useEffect, useRef } from 'react';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { FolderOpen, Upload, FileText, File, Image as ImageIcon, Trash2, Search, Filter } from 'lucide-react';
import { motion } from 'motion/react';

export default function Documents() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('Todas');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'documents'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDocuments(docs);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'documents');
    });
    return () => unsubscribe();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // In a real app, upload to Firebase Storage first.
      // Here we simulate the upload and save metadata to Firestore.
      
      let category = 'Otros';
      if (file.name.toLowerCase().includes('plano') || file.name.toLowerCase().endsWith('.dwg')) category = 'Planos';
      else if (file.name.toLowerCase().includes('especificacion') || file.name.toLowerCase().includes('norma')) category = 'Especificaciones';
      else if (file.name.toLowerCase().includes('computo') || file.name.toLowerCase().endsWith('.xlsx')) category = 'Cómputos';

      await addDoc(collection(db, 'documents'), {
        name: file.name,
        size: file.size,
        type: file.type,
        category: category,
        uploadDate: new Date().toISOString(),
        uploadedBy: 'Usuario Actual', // Replace with real user
        url: '#' // Simulated URL
      });
      
      alert('Documento subido exitosamente');
    } catch (error) {
      console.error("Error uploading document:", error);
      alert('Error al subir el documento');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este documento?')) {
      await deleteDoc(doc(db, 'documents', id));
    }
  };

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'Todas' || doc.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const getFileIcon = (type: string, name: string) => {
    if (type.includes('pdf') || name.endsWith('.pdf')) return <FileText className="text-red-500" />;
    if (type.includes('image') || name.endsWith('.jpg') || name.endsWith('.png')) return <ImageIcon className="text-blue-500" />;
    if (type.includes('excel') || type.includes('spreadsheet') || name.endsWith('.xlsx')) return <File className="text-emerald-500" />;
    return <File className="text-gray-500" />;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Biblioteca de Archivos</h1>
          <p className="text-gray-500 mt-1">Gestión documental del proyecto (Planos, Especificaciones, Cómputos)</p>
        </div>
        <div>
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            multiple
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
          >
            <Upload size={20} />
            {isUploading ? 'Subiendo...' : 'Subir Documento'}
          </button>
        </div>
      </header>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Buscar documentos..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="text-gray-400" size={20} />
            <select 
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
            >
              <option value="Todas">Todas las categorías</option>
              <option value="Planos">Planos</option>
              <option value="Especificaciones">Especificaciones Técnicas</option>
              <option value="Cómputos">Cómputos Métricos</option>
              <option value="Legal">Legal y Contratos</option>
              <option value="Otros">Otros</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-sm">
                <th className="p-4 font-medium">Nombre del Archivo</th>
                <th className="p-4 font-medium">Categoría</th>
                <th className="p-4 font-medium">Tamaño</th>
                <th className="p-4 font-medium">Fecha de Subida</th>
                <th className="p-4 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDocs.map(doc => (
                <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {getFileIcon(doc.type, doc.name)}
                      <span className="font-medium text-gray-900">{doc.name}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-medium">
                      {doc.category}
                    </span>
                  </td>
                  <td className="p-4 text-gray-500 text-sm">{formatBytes(doc.size)}</td>
                  <td className="p-4 text-gray-500 text-sm">{new Date(doc.uploadDate).toLocaleDateString()}</td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => handleDelete(doc.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredDocs.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <FolderOpen size={48} className="text-gray-300" />
                      <p>No se encontraron documentos.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
