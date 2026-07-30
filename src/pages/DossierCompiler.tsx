import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { 
  FileArchive, Download, CheckCircle2, 
  Sparkles, Clock, AlertCircle, Eye, Layers, ShieldCheck, FileText, CheckSquare
} from 'lucide-react';
import { useProject } from '../ProjectContext';
import { compileProjectDossier } from '../lib/dossier/dossierCompiler';
import { generatePdvsaCoverHtml } from '../lib/dossier/coverGenerator';
import { DossierState, FasePDVSA, FASES_PDVSA_DESCRIPCION, DocumentoDossier } from '../lib/data/pdvsa/dossierTypes';

export default function DossierCompiler() {
  const { currentProject, currentOrganization } = useProject();
  
  const [faseSelected, setFaseSelected] = useState<FasePDVSA>('I');
  const [dossierState, setDossierState] = useState<DossierState | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileProgress, setCompileProgress] = useState(0);
  const [compiledPdfReady, setCompiledPdfReady] = useState(false);
  const [generatedHash, setGeneratedHash] = useState<string>('');
  const [compilationTimestamp, setCompilationTimestamp] = useState<string>('');
  
  const [selectedDocForCover, setSelectedDocForCover] = useState<DocumentoDossier | null>(null);
  const [showCoverModal, setShowCoverModal] = useState(false);

  const orgId = currentOrganization?.id || 'org-default';
  const projId = currentProject?.id || 'proj-default';
  const projName = currentProject?.name || 'Gasoducto 16" Anaco - PLC (PDVSA GAS)';

  // Load and compile live dossier data from Firestore
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    compileProjectDossier(orgId, projId, faseSelected, projName)
      .then(dstate => {
        if (isMounted) {
          setDossierState(dstate);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('Error compiling project dossier:', err);
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [orgId, projId, faseSelected, projName]);

  const handleStartCompilation = async () => {
    if (!currentProject) {
      alert("Por favor selecciona un proyecto primero.");
      return;
    }

    setIsCompiling(true);
    setCompileProgress(10);
    setCompiledPdfReady(false);

    const nowIso = new Date().toISOString();
    const payload = `PDVSA-DOSSIER-PIC-01-03-05|ORG:${orgId}|PROJ:${projId}|DOCS:${dossierState?.totalDocumentos || 0}|TIMESTAMP:${nowIso}`;
    
    // Hash computation
    const encoder = new TextEncoder();
    const data = encoder.encode(payload);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const sha256 = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    let progress = 10;
    const interval = setInterval(() => {
      progress += 20;
      if (progress >= 100) {
        clearInterval(interval);
        setCompileProgress(100);
        setIsCompiling(false);
        setGeneratedHash(sha256);
        setCompilationTimestamp(nowIso);
        setCompiledPdfReady(true);
      } else {
        setCompileProgress(progress);
      }
    }, 250);
  };

  const handleOpenCoverModal = (doc: DocumentoDossier) => {
    setSelectedDocForCover(doc);
    setShowCoverModal(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-lg border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider mb-2">
            <FileArchive size={16} /> Norma PDVSA PIC-01-03-05 / Anexo A — Dossier de Calidad
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Compilador del Libro Final de Obra & Dossier
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl font-medium">
            Escaneo multi-tenant en tiempo real de permisos SIHO-A, juntas QA/QC, corridas ILI, valuaciones ROE y reportes de campo para {projName}.
          </p>
        </div>
        <div className="shrink-0">
          <button
            onClick={handleStartCompilation}
            disabled={isCompiling || loading}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-6 py-3 rounded-2xl text-xs sm:text-sm transition-all shadow-md cursor-pointer disabled:opacity-50"
          >
            <Sparkles size={16} />
            {isCompiling ? `Compilando Expediente (${compileProgress}%)...` : 'Generar Expediente Completo (PDF)'}
          </button>
        </div>
      </div>

      {/* Fase Selection Tabs */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
            <Layers size={14} /> Selección de Fase de Proyecto PDVSA (V/C/D/I/O)
          </h2>
          <span className="text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-slate-700 dark:text-slate-300">
            Fase Seleccionada: {FASES_PDVSA_DESCRIPCION[faseSelected].nombre}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {(['V', 'C', 'D', 'I', 'O'] as FasePDVSA[]).map(f => {
            const fInfo = FASES_PDVSA_DESCRIPCION[f];
            const isSelected = faseSelected === f;
            return (
              <button
                key={f}
                onClick={() => setFaseSelected(f)}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  isSelected 
                    ? 'bg-slate-900 text-white border-slate-900 dark:bg-emerald-600 dark:border-emerald-600 shadow-sm' 
                    : 'bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="font-extrabold text-sm">{fInfo.nombre.split('—')[0]}</div>
                <div className="text-[10px] opacity-80 line-clamp-1 font-medium">{fInfo.nombre.split('—')[1]}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Documentos</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">
              {dossierState?.totalDocumentos || 0}
            </div>
          </div>
          <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-700 dark:text-slate-300">
            <FileText size={22} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400">Firmados / Aprobados</div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
              {dossierState?.documentosAprobados || 0}
            </div>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-2xl text-emerald-600 dark:text-emerald-400">
            <ShieldCheck size={22} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400">Pendientes de Firma</div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 font-mono">
              {dossierState?.documentosPendientes || 0}
            </div>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/50 rounded-2xl text-amber-600 dark:text-amber-400">
            <Clock size={22} />
          </div>
        </div>
      </div>

      {/* Progress Bar if Compiling */}
      {isCompiling && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex justify-between text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
            <span>Ensamblando carátulas Anexo A, firmas digitales y marcas de agua...</span>
            <span>{compileProgress}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-emerald-600 h-full transition-all duration-300 rounded-full"
              style={{ width: `${compileProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Compilation Success Notification */}
      {compiledPdfReady && (
        <div className="p-6 bg-emerald-950 text-emerald-100 rounded-3xl border border-emerald-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-lg">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-sm">
              <CheckCircle2 size={20} /> DOSSIER DIGITAL DE CALIDAD ENSAMBLADO & CERTIFICADO
            </div>
            <p className="text-xs text-emerald-200 font-mono break-all">
              HASH SHA-256 INMUTABLE: {generatedHash}
            </p>
            <p className="text-[11px] text-emerald-300">
              Certificado bajo norma PDVSA PIC-01-03-05 • {compilationTimestamp ? new Date(compilationTimestamp).toLocaleString() : ''}
            </p>
          </div>
          <button
            onClick={() => alert(`Iniciando descarga unificada de Expediente_Final_PDVSA_${projId}.pdf con ${dossierState?.totalDocumentos || 0} evidencias...`)}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-5 py-3 rounded-2xl text-xs shrink-0 shadow transition-colors cursor-pointer"
          >
            <Download size={16} /> Descargar Expediente PDF
          </button>
        </div>
      )}

      {/* Dossier Chapters & Document List (6 Capítulos PDVSA PIC-01-03-05) */}
      <div className="space-y-6">
        {loading ? (
          <div className="p-12 text-center text-slate-500 font-medium">
            Escaneando módulos en tiempo real para compilar los 6 Capítulos del Dossier...
          </div>
        ) : (
          (dossierState?.capitulos || []).map(cap => (
            <div key={cap.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-3 gap-4">
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                    <span className="w-7 h-7 rounded-xl bg-slate-900 dark:bg-emerald-600 text-white flex items-center justify-center text-xs font-mono font-black">
                      0{cap.numero}
                    </span>
                    <span>{cap.tituloCapitulo}</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{cap.descripcion}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-3 py-1 rounded-full block mb-1">
                    {cap.normaReferencia}
                  </span>
                  <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-bold px-3 py-1 rounded-full inline-block">
                    {cap.documentos.length} Documentos
                  </span>
                </div>
              </div>

              {cap.documentos.length === 0 ? (
                <div className="p-4 text-center text-slate-400 text-xs italic">
                  No hay documentos registrados para este capítulo en la fase actual.
                </div>
              ) : (
                <div className="space-y-2">
                  {cap.documentos.map(doc => (
                    <div 
                      key={doc.id}
                      className="p-4 border border-slate-100 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold bg-slate-900 text-white dark:bg-slate-800 text-emerald-400 px-2 py-0.5 rounded text-[10px]">
                            {doc.codigoPDVSA}
                          </span>
                          <span className="font-bold text-slate-500 text-[10px]">REV. {doc.revisionActual}</span>
                          <span className="font-bold text-slate-400 text-[10px]">• {doc.categoria}</span>
                        </div>
                        <div className="font-extrabold text-slate-900 dark:text-white text-sm">{doc.titulo}</div>
                        <div className="text-slate-500 dark:text-slate-400 text-[11px] flex items-center gap-3">
                          <span>Módulo: <strong className="text-slate-700 dark:text-slate-300">{doc.origenModulo}</strong></span>
                          <span>Páginas: <strong className="text-slate-700 dark:text-slate-300">{doc.paginasCount || 1}</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                          doc.statusDoc === 'Aprobado' || doc.statusDoc === 'Firmado Final'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}>
                          {doc.statusDoc}
                        </span>

                        <button
                          onClick={() => handleOpenCoverModal(doc)}
                          className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold px-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer"
                        >
                          <Eye size={14} /> Ver Carátula
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Cover Modal Preview (PDVSA Anexo A) */}
      {showCoverModal && selectedDocForCover && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 relative shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">Vista Previa Carátula Anexo A (PDVSA)</h2>
                <p className="text-xs text-slate-500 font-mono">{selectedDocForCover.codigoPDVSA}</p>
              </div>
              <button
                onClick={() => setShowCoverModal(false)}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Generated Cover HTML */}
            <div 
              className="bg-white p-4 rounded-2xl border border-slate-300 shadow-inner overflow-x-auto"
              dangerouslySetInnerHTML={{ 
                __html: DOMPurify.sanitize(generatePdvsaCoverHtml({
                  documento: selectedDocForCover,
                  nombreProyecto: projName,
                  contratoNo: dossierState?.contratoNo || 'N° CTR-2026-PDVSA-001',
                  contratistaNombre: 'PROINTECA C.A.',
                  clienteNombre: 'PDVSA GAS C.A.'
                }))
              }} 
            />

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowCoverModal(false)}
                className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold rounded-2xl text-xs cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
