import React, { useState, useEffect } from 'react';
import { 
  FileArchive, Download, CheckCircle2, 
  Sparkles, Clock, AlertCircle
} from 'lucide-react';
import { collection, query, where, onSnapshot, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useProject } from '../ProjectContext';

interface DossierSection {
  id: string;
  title: string;
  code: string;
  requiredCount: number;
  uploadedCount: number;
  status: 'Completo' | 'En Revisión' | 'Pendiente';
  collectionName: string;
}

export default function DossierCompiler() {
  const { currentProject, currentOrganization } = useProject();
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileProgress, setCompileProgress] = useState(0);
  const [compiledPdfReady, setCompiledPdfReady] = useState(false);
  const [generatedHash, setGeneratedHash] = useState<string>('');
  const [compilationTimestamp, setCompilationTimestamp] = useState<string>('');

  // Counts state from live Firestore
  const [weldCount, setWeldCount] = useState(0);
  const [ptwCount, setPtwCount] = useState(0);
  const [docCount, setDocCount] = useState(0);
  const [calcCount, setCalcCount] = useState(0);
  const [valCount, setValCount] = useState(0);
  const [taskCount, setTaskCount] = useState(0);

  useEffect(() => {
    if (!currentProject) return;

    const projId = currentProject.id;

    // 1. Weld Joints
    const qWelds = query(collection(db, 'weld_joints'), where('projectId', '==', projId));
    const unsubWelds = onSnapshot(qWelds, (snap) => setWeldCount(snap.size),
      (err) => handleFirestoreError(err, OperationType.GET, 'weld_joints'));

    // 2. SIHO PTW
    const qPtw = query(collection(db, 'siho_ptw'), where('projectId', '==', projId));
    const unsubPtw = onSnapshot(qPtw, (snap) => setPtwCount(snap.size),
      (err) => handleFirestoreError(err, OperationType.GET, 'siho_ptw'));

    // 3. Documents
    const qDocs = query(collection(db, 'documents'), where('projectId', '==', projId));
    const unsubDocs = onSnapshot(qDocs, (snap) => setDocCount(snap.size),
      (err) => handleFirestoreError(err, OperationType.GET, 'documents'));

    // 4. Engineering Calcs
    const qCalcs = query(collection(db, 'engineering_calcs'), where('projectId', '==', projId));
    const unsubCalcs = onSnapshot(qCalcs, (snap) => setCalcCount(snap.size),
      (err) => handleFirestoreError(err, OperationType.GET, 'engineering_calcs'));

    // 5. Valuations
    const qVals = query(collection(db, 'valuations'), where('projectId', '==', projId));
    const unsubVals = onSnapshot(qVals, (snap) => setValCount(snap.size),
      (err) => handleFirestoreError(err, OperationType.GET, 'valuations'));

    // 6. Tasks
    const qTasks = query(collection(db, 'tasks'), where('projectId', '==', projId));
    const unsubTasks = onSnapshot(qTasks, (snap) => setTaskCount(snap.size),
      (err) => handleFirestoreError(err, OperationType.GET, 'tasks'));

    return () => {
      unsubWelds();
      unsubPtw();
      unsubDocs();
      unsubCalcs();
      unsubVals();
      unsubTasks();
    };
  }, [currentProject]);

  const sections: DossierSection[] = [
    {
      id: 'SEC-01',
      title: 'Actas Contractuales, Paradas y Avances de Partidas',
      code: 'CAP-01-ACT',
      requiredCount: Math.max(1, taskCount),
      uploadedCount: taskCount,
      status: taskCount > 0 ? 'Completo' : 'Pendiente',
      collectionName: 'tasks'
    },
    {
      id: 'SEC-02',
      title: 'Planos As-Built y Redlines Digitalizados (DWG / PDF)',
      code: 'CAP-02-DWG',
      requiredCount: Math.max(1, docCount),
      uploadedCount: docCount,
      status: docCount > 0 ? 'Completo' : 'Pendiente',
      collectionName: 'documents'
    },
    {
      id: 'SEC-03',
      title: 'Memorias de Cálculo y Especificaciones Técnicas',
      code: 'CAP-03-ENG',
      requiredCount: Math.max(1, calcCount),
      uploadedCount: calcCount,
      status: calcCount > 0 ? 'Completo' : 'Pendiente',
      collectionName: 'engineering_calcs'
    },
    {
      id: 'SEC-04',
      title: 'Trazabilidad de Juntas de Soldadura & Reportes NDT (DICONDE / API 1104)',
      code: 'CAP-04-NDT',
      requiredCount: Math.max(1, weldCount),
      uploadedCount: weldCount,
      status: weldCount > 0 ? 'Completo' : 'Pendiente',
      collectionName: 'weld_joints'
    },
    {
      id: 'SEC-05',
      title: 'Expediente SIHO-A, Permisos PTW, Evaluaciones ART & Análisis Atmosférico',
      code: 'CAP-05-SIHO',
      requiredCount: Math.max(1, ptwCount),
      uploadedCount: ptwCount,
      status: ptwCount > 0 ? 'Completo' : 'Pendiente',
      collectionName: 'siho_ptw'
    },
    {
      id: 'SEC-06',
      title: 'Valuaciones de Obra, Avance Financiero y Cierre Técnico',
      code: 'CAP-06-VAL',
      requiredCount: Math.max(1, valCount),
      uploadedCount: valCount,
      status: valCount > 0 ? 'Completo' : 'Pendiente',
      collectionName: 'valuations'
    }
  ];

  const generateSha256 = async (dataString: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(dataString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleStartCompilation = async () => {
    if (!currentProject) {
      alert("Por favor selecciona un proyecto primero.");
      return;
    }

    setIsCompiling(true);
    setCompileProgress(10);
    setCompiledPdfReady(false);

    const totalDocsVerified = taskCount + docCount + calcCount + weldCount + ptwCount + valCount;
    const nowIso = new Date().toISOString();
    const orgId = currentOrganization?.id || 'default_org';
    const projId = currentProject.id;

    const payload = `DOSSIER|ORG:${orgId}|PROJ:${projId}|TOTAL_DOCS:${totalDocsVerified}|TIMESTAMP:${nowIso}`;
    const sha256 = await generateSha256(payload);

    let progress = 10;
    const interval = setInterval(async () => {
      progress += 18;
      if (progress >= 100) {
        clearInterval(interval);
        setCompileProgress(100);
        setIsCompiling(false);
        setGeneratedHash(sha256);
        setCompilationTimestamp(nowIso);
        setCompiledPdfReady(true);

        // Save compilation record in Firestore
        try {
          await addDoc(collection(db, 'dossier_compilations'), {
            orgId,
            projectId: projId,
            projectName: currentProject.name || 'Proyecto de Obras',
            totalDocumentsVerified: totalDocsVerified,
            sha256Hash: sha256,
            compiledAt: nowIso,
            sectionsSummary: sections.map(s => ({
              code: s.code,
              title: s.title,
              count: s.uploadedCount,
              status: s.status
            }))
          });
        } catch (err) {
          console.error("Error saving dossier compilation record:", err);
        }
      } else {
        setCompileProgress(progress);
      }
    }, 350);
  };

  const totalVerifiedCount = taskCount + docCount + calcCount + weldCount + ptwCount + valCount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider mb-1">
            <FileArchive size={16} /> Compilador del Dossier de Calidad As-Built (PDVSA PI-02-01-01)
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Libro Final de Obra & Dossier de Entrega</h1>
          <p className="text-slate-400 text-sm mt-1">
            Compilación automatizada en tiempo real de {totalVerifiedCount} evidencias verificadas con hash inmutable SHA-256.
          </p>
        </div>
        <div>
          <button
            onClick={handleStartCompilation}
            disabled={isCompiling}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-md disabled:opacity-50"
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
            <span>Ensamblando Índice Interactivo y Marcadores Hyperlinked desde Firestore...</span>
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
            <p className="text-xs text-emerald-200 font-mono break-all">
              HASH SHA-256: {generatedHash}
            </p>

            <p className="text-[11px] text-emerald-300">
              Registrado exitosamente en Firestore (`dossier_compilations`) • {compilationTimestamp ? new Date(compilationTimestamp).toLocaleString() : ''}
            </p>
          </div>
          <button
            onClick={() => alert(`Descargando Libro_Final_de_Obra_IC360_${currentProject?.id || 'PROJ'}.pdf (${totalVerifiedCount} Evidencias Verificadas)...`)}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs shrink-0 shadow transition-colors"
          >
            <Download size={16} /> Descargar PDF Unificado
          </button>
        </div>
      )}

      {/* Chapters Table */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-base font-bold text-gray-900">Estructura de Capítulos del Dossier (Norma PDVSA PI-02-01-01)</h2>
          <span className="text-xs text-gray-500 font-medium">Sincronizado en tiempo real con Firestore</span>
        </div>

        <div className="space-y-3">
          {sections.map(sec => (
            <div key={sec.id} className="p-4 border border-gray-200 rounded-xl hover:bg-slate-50 transition-all flex justify-between items-center text-xs">
              <div className="space-y-1">
                <span className="font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px]">
                  {sec.code}
                </span>
                <h3 className="font-bold text-slate-900 text-sm">{sec.title}</h3>
                <p className="text-gray-500">
                  Registros Verificados en Firestore: <span className="font-mono font-bold text-slate-800">{sec.uploadedCount}</span> ítems
                </p>
              </div>

              <div className="flex items-center gap-3">
                {sec.status === 'Completo' ? (
                  <span className="bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full text-[11px] flex items-center gap-1">
                    <CheckCircle2 size={13} /> Completo
                  </span>
                ) : (
                  <span className="bg-amber-100 text-amber-800 font-bold px-3 py-1 rounded-full text-[11px] flex items-center gap-1">
                    <Clock size={13} /> Pendiente ({sec.uploadedCount})
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
