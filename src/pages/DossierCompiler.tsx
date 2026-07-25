import React, { useState } from 'react';
import { 
  FileArchive, Download, FileCheck, CheckCircle2, ShieldCheck, 
  Layers, Lock, Sparkles, BookOpen, ChevronRight, FileText, Printer, Search
} from 'lucide-react';
import { useProject } from '../ProjectContext';

interface DossierSection {
  id: string;
  title: string;
  code: string;
  requiredDocs: number;
  uploadedDocs: number;
  status: 'Completo' | 'En Revisión' | 'Pendiente';
}

export default function DossierCompiler() {
  const { currentProject } = useProject();
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileProgress, setCompileProgress] = useState(0);
  const [compiledPdfReady, setCompiledPdfReady] = useState(false);

  const sections: DossierSection[] = [
    {
      id: 'SEC-01',
      title: 'Actas Contractuales y Administrativas (Inicio, Paradas, Reinicios, AAD)',
      code: 'CAP-01-ACT',
      requiredDocs: 6,
      uploadedDocs: 6,
      status: 'Completo'
    },
    {
      id: 'SEC-02',
      title: 'Planos As-Built y Redlines Digitalizados (DWG / PDF)',
      code: 'CAP-02-DWG',
      requiredDocs: 14,
      uploadedDocs: 14,
      status: 'Completo'
    },
    {
      id: 'SEC-03',
      title: 'Certificados de Calidad de Materiales (Mill Test Reports - MTRs)',
      code: 'CAP-03-MTR',
      requiredDocs: 22,
      uploadedDocs: 22,
      status: 'Completo'
    },
    {
      id: 'SEC-04',
      title: 'Trazabilidad de Juntas de Soldadura & Reportes NDT (DICONDE)',
      code: 'CAP-04-NDT',
      requiredDocs: 18,
      uploadedDocs: 18,
      status: 'Completo'
    },
    {
      id: 'SEC-05',
      title: 'Pruebas Hidrostáticas, Registros Barton Chart & Certificados de Calibración',
      code: 'CAP-05-HYD',
      requiredDocs: 8,
      uploadedDocs: 8,
      status: 'Completo'
    },
    {
      id: 'SEC-06',
      title: 'Expediente SIHO-A, Permisos PTW, Evaluaciones de Riesgo ART & Gasotester',
      code: 'CAP-06-SIHO',
      requiredDocs: 35,
      uploadedDocs: 35,
      status: 'Completo'
    },
    {
      id: 'SEC-07',
      title: 'Solvencias Laborales, Finiquito IVSS/INCES y Cierre de Punch-Lists',
      code: 'CAP-07-LGL',
      requiredDocs: 5,
      uploadedDocs: 5,
      status: 'Completo'
    }
  ];

  const handleStartCompilation = () => {
    setIsCompiling(true);
    setCompileProgress(10);
    setCompiledPdfReady(false);

    const interval = setInterval(() => {
      setCompileProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsCompiling(false);
          setCompiledPdfReady(true);
          return 100;
        }
        return prev + 18;
      });
    }, 400);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider mb-1">
            <FileArchive size={16} /> Compilador del Dossier de Calidad As-Built
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Libro Final de Obra & Dossier de Entrega</h1>
          <p className="text-slate-400 text-sm mt-1">
            Compilación en 1-clic del PDF único indexado con hipervínculos, sello de inmutabilidad y firma digital.
          </p>
        </div>
        <div>
          <button
            onClick={handleStartCompilation}
            disabled={isCompiling}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-md"
          >
            <Sparkles size={16} />
            {isCompiling ? `Compilando PDF (${compileProgress}%)...` : 'Compilar Dossier Completo (PDF Indexado)'}
          </button>
        </div>
      </div>

      {/* Progress Bar if Compiling */}
      {isCompiling && (
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-2">
          <div className="flex justify-between text-xs font-mono font-bold text-slate-700">
            <span>Ensamblando Índice Interactivo y Marcadores Hyperlinked...</span>
            <span>{compileProgress}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-emerald-600 h-full transition-all duration-300 rounded-full"
              style={{ width: `${compileProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Compilation Ready Alert */}
      {compiledPdfReady && (
        <div className="p-5 bg-emerald-950 text-emerald-100 rounded-2xl border border-emerald-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-lg">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <CheckCircle2 size={20} /> DOSSIER DE CALIDAD DIGITALIZADO & SELLADO
            </div>
            <p className="text-xs text-emerald-200 font-mono">
              HASH SHA-256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
            </p>
          </div>
          <button
            onClick={() => alert('Descargando Libro_Final_de_Obra_IC360_2026.pdf (108 Pag)...')}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs shrink-0 shadow"
          >
            <Download size={14} /> Descargar PDF Unificado (108 Págs)
          </button>
        </div>
      )}

      {/* Chapters Table */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-gray-900">Estructura de Capítulos del Dossier (Norma PDVSA PI-02-01-01)</h2>

        <div className="space-y-3">
          {sections.map(sec => (
            <div key={sec.id} className="p-4 border border-gray-200 rounded-xl hover:bg-slate-50 transition-all flex justify-between items-center text-xs">
              <div className="space-y-1">
                <span className="font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px]">
                  {sec.code}
                </span>
                <h3 className="font-bold text-slate-900 text-sm">{sec.title}</h3>
                <p className="text-gray-500">Documentos Verificados: {sec.uploadedDocs} de {sec.requiredDocs} cargados</p>
              </div>

              <div className="flex items-center gap-3">
                <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full text-[11px] flex items-center gap-1">
                  <CheckCircle2 size={12} /> {sec.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
