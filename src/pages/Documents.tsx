import { useState, useEffect, useRef } from 'react';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, where } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage, auth, handleFirestoreError, OperationType } from '../firebase';
import { FolderOpen, Upload, FileText, File, Image as ImageIcon, Trash2, Search, Filter, Loader2, Download as DownloadIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { useProject } from '../ProjectContext';

export default function Documents() {
  const { currentProject, currentOrganization } = useProject();
  const [documents, setDocuments] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('Todas');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!currentProject) {
      setDocuments([]);
      return;
    }

    const q = query(
      collection(db, 'documents'),
      where('projectId', '==', currentProject.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDocuments(docs);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'documents');
    });
    return () => unsubscribe();
  }, [currentProject]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !currentProject) return;

    const file = files[0];
    setIsUploading(true);
    setUploadProgress(0);

    try {
      let category = 'Otros';
      const nameLower = file.name.toLowerCase();
      if (nameLower.includes('plano') || nameLower.endsWith('.dwg') || nameLower.endsWith('.dxf')) category = 'Planos';
      else if (nameLower.includes('especificacion') || nameLower.includes('norma') || nameLower.includes('wps')) category = 'Especificaciones';
      else if (nameLower.includes('computo') || nameLower.endsWith('.xlsx') || nameLower.endsWith('.bc3')) category = 'Cómputos';
      else if (nameLower.includes('contrato') || nameLower.includes('fianza') || nameLower.includes('legal')) category = 'Legal';

      const fileUuid = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36);
      const storagePath = `organizations/${currentOrganization?.id || 'semax-pino'}/projects/${currentProject.id}/docs/${fileUuid}_${file.name}`;
      const storageRef = ref(storage, storagePath);

      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(Math.round(progress));
        },
        (error) => {
          console.error("Error uploadBytesResumable:", error);
          alert(`Error al subir el archivo a Storage: ${error.message}`);
          setIsUploading(false);
          setUploadProgress(null);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

          await addDoc(collection(db, 'documents'), {
            projectId: currentProject.id,
            orgId: currentOrganization?.id || 'semax-pino',
            name: file.name,
            size: file.size,
            type: file.type || 'application/octet-stream',
            category: category,
            uploadDate: new Date().toISOString(),
            uploadedBy: auth.currentUser?.displayName || auth.currentUser?.email || 'Inspector de Campo',
            url: downloadURL,
            storagePath: storagePath
          });

          setIsUploading(false);
          setUploadProgress(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      );
    } catch (error) {
      console.error("Error uploading document:", error);
      alert('Error en el proceso de subida del documento.');
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este documento del repositorio?')) {
      try {
        await deleteDoc(doc(db, 'documents', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `documents/${id}`);
      }
    }
  };

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'Todas' || doc.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const getFileIcon = (type: string, name: string) => {
    if (type.includes('pdf') || name.endsWith('.pdf')) return <FileText className="text-red-500 shrink-0" />;
    if (type.includes('image') || name.endsWith('.jpg') || name.endsWith('.png')) return <ImageIcon className="text-blue-500 shrink-0" />;
    if (type.includes('excel') || type.includes('spreadsheet') || name.endsWith('.xlsx')) return <File className="text-emerald-500 shrink-0" />;
    return <File className="text-gray-500 shrink-0" />;
  };

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 Bytes';
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
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Biblioteca & Repositorio Digital</h1>
          <p className="text-gray-500 mt-1">
            Gestión documental en Firebase Storage (Planos DWG/PDF, Especificaciones, Cómputos)
          </p>
        </div>
        <div>
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
          >
            {isUploading ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
            {isUploading ? `Subiendo (${uploadProgress}%)...` : 'Subir Documento'}
          </button>
        </div>
      </header>

      {/* Upload Progress Bar */}
      {isUploading && uploadProgress !== null && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl space-y-2">
          <div className="flex justify-between text-xs font-bold text-emerald-800">
            <span>Subiendo a Firebase Storage...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-emerald-200 h-2.5 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-600 h-full transition-all duration-300" 
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Buscar por código o nombre de plano/documento..." 
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
                <th className="p-4 font-medium">Subido Por</th>
                <th className="p-4 font-medium">Fecha</th>
                <th className="p-4 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDocs.map(doc => (
                <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {getFileIcon(doc.type, doc.name)}
                      <span className="font-medium text-gray-900 truncate max-w-xs">{doc.name}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-medium">
                      {doc.category}
                    </span>
                  </td>
                  <td className="p-4 text-gray-500 text-sm font-mono">{formatBytes(doc.size)}</td>
                  <td className="p-4 text-gray-600 text-sm">{doc.uploadedBy || 'Inspector de Campo'}</td>
                  <td className="p-4 text-gray-500 text-sm">{new Date(doc.uploadDate).toLocaleDateString()}</td>
                  <td className="p-4 text-right flex items-center justify-end gap-1">
                    {doc.url && doc.url !== '#' && (
                      <a 
                        href={doc.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Descargar de Firebase Storage"
                      >
                        <DownloadIcon size={18} />
                      </a>
                    )}
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
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <FolderOpen size={48} className="text-gray-300" />
                      <p>No se encontraron documentos en Firebase Storage para este proyecto.</p>
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
