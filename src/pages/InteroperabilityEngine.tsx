import React, { useState } from 'react';
import { 
  Database, Upload, Download, FileSpreadsheet, RefreshCw, 
  Layers, CheckCircle2, AlertCircle, FileCode, Server, 
  Cpu, ArrowLeftRight, HardDrive, Sparkles, Box, Plug
} from 'lucide-react';
import { useProject } from '../ProjectContext';

export default function InteroperabilityEngine() {
  const { currentProject } = useProject();
  const [activeTab, setActiveTab] = useState<'schedules' | 'bc3' | 'erp' | 'cad'>('schedules');

  // Schedule import state
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importedLogs, setImportedLogs] = useState<string[]>([]);
  const [scheduleData, setScheduleData] = useState<{
    tasksCount: number;
    wbsCount: number;
    criticalPathCount: number;
    startDate: string;
    finishDate: string;
  } | null>(null);

  // BC3 State
  const [bc3File, setBc3File] = useState<string | null>(null);
  const [bc3Processed, setBc3Processed] = useState(false);

  // SAP Connector State
  const [sapStatus, setSapStatus] = useState<'connected' | 'syncing' | 'idle'>('connected');
  const [lastSyncTime, setLastSyncTime] = useState('Hace 12 minutos (OData / BAPI Service)');

  const handleSimulateScheduleImport = (fileName: string) => {
    setSelectedFile(fileName);
    setIsProcessing(true);
    setImportedLogs([]);
    setScheduleData(null);

    const logs = [
      `[1/4] Leyendo cabecera de archivo ${fileName}...`,
      `[2/4] Mapeando EDT/WBS y actividades de Primavera P6...`,
      `[3/4] Calculando Red CPM (Camino Crítico) y Holguras Totales...`,
      `[4/4] Sincronización exitosa con Base de Datos de Proyecto IC360.`
    ];

    let delay = 0;
    logs.forEach((log, index) => {
      delay += 500;
      setTimeout(() => {
        setImportedLogs(prev => [...prev, log]);
        if (index === logs.length - 1) {
          setIsProcessing(false);
          setScheduleData({
            tasksCount: 148,
            wbsCount: 12,
            criticalPathCount: 28,
            startDate: '2026-08-01',
            finishDate: '2026-12-15'
          });
        }
      }, delay);
    });
  };

  const handleSimulateBC3Import = () => {
    setBc3File('PRESUPUESTO_OBRA_MECANICA_2026.BC3');
    setBc3Processed(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-surface border border-line p-6 rounded-2xl shadow-2xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-brand-500 dark:text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider mb-1">
            <ArrowLeftRight size={16} /> Motor de Interoperabilidad Universal
          </div>
          <h1 className="text-2xl font-black text-ink tracking-tight">Integración P6, MSP, BC3 & ERP SAP</h1>
          <p className="text-ink-soft text-xs mt-1 font-medium">
            Importador y exportador bidireccional nativo para cronogramas Primavera P6 (.xer), presupuestos BC3 y modelos CAD/ISOGEN.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-surface-2 border border-line px-4 py-2 rounded-xl">
          <Server size={18} className="text-brand-500 dark:text-emerald-400 animate-pulse" />
          <div className="text-xs font-mono">
            <span className="text-ink-soft block">Conector SAP OData</span>
            <span className="text-brand-500 dark:text-emerald-400 font-bold">ONLINE & SYNCED</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-surface-2 border border-line rounded-xl p-1.5 shadow-2xs overflow-x-auto gap-1">
        <button
          onClick={() => setActiveTab('schedules')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'schedules' ? 'bg-brand-500 text-white shadow-2xs' : 'text-ink-soft hover:text-ink hover:bg-surface'
          }`}
        >
          <Layers size={16} /> Cronogramas (.XER / .MPP)
        </button>
        <button
          onClick={() => setActiveTab('bc3')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'bc3' ? 'bg-brand-500 text-white shadow-2xs' : 'text-ink-soft hover:text-ink hover:bg-surface'
          }`}
        >
          <FileCode size={16} /> Presupuestos BC3 (FIEBDC-3)
        </button>
        <button
          onClick={() => setActiveTab('erp')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'erp' ? 'bg-brand-500 text-white shadow-2xs' : 'text-ink-soft hover:text-ink hover:bg-surface'
          }`}
        >
          <Plug size={16} /> Conectores ERP SAP / Maximo
        </button>
        <button
          onClick={() => setActiveTab('cad')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'cad' ? 'bg-brand-500 text-white shadow-2xs' : 'text-ink-soft hover:text-ink hover:bg-surface'
          }`}
        >
          <Box size={16} /> ISOGEN (.PCF) & CAD IFC
        </button>
      </div>

      {/* TAB 1: CRONOGRAMAS P6 & MSP */}
      {activeTab === 'schedules' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload card */}
          <div className="bg-surface p-6 rounded-2xl border border-line shadow-2xs space-y-5">
            <h2 className="text-base font-bold text-ink">Importar Cronograma de Proyecto</h2>
            <p className="text-xs text-ink-soft font-medium">
              Soporta Primavera P6 (.xer / .xml) y Microsoft Project (.mpp). Mantiene precedencias, holguras y asignación de recursos.
            </p>

            <div className="border-2 border-dashed border-line rounded-2xl p-8 text-center bg-surface-2 hover:bg-brand-500/5 transition-all cursor-pointer space-y-3">
              <Upload size={32} className="mx-auto text-brand-500 dark:text-emerald-400" />
              <div className="text-xs font-semibold text-ink">
                Arrastra tu archivo <span className="font-mono text-brand-500 dark:text-emerald-400 font-bold">.XER</span> o <span className="font-mono text-brand-500 dark:text-emerald-400 font-bold">.MPP</span> aquí
              </div>
              <p className="text-[11px] text-ink-soft">O selecciona una simulación rápida a continuación:</p>

              <div className="flex justify-center gap-2 pt-2">
                <button
                  onClick={() => handleSimulateScheduleImport('CRONOGRAMA_OFFSHORE_P6_V2.XER')}
                  className="bg-brand-500 hover:bg-brand-600 text-white text-xs font-mono font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-2xs"
                >
                  Probar .XER Primavera
                </button>
                <button
                  onClick={() => handleSimulateScheduleImport('PLAN_OBRA_PIPING_2026.MPP')}
                  className="bg-surface-2 hover:bg-elevated border border-line text-ink text-xs font-mono font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-2xs"
                >
                  Probar .MPP MS Project
                </button>
              </div>
            </div>

            {/* Export Section */}
            <div className="pt-4 border-t border-line space-y-3">
              <h3 className="text-xs font-bold text-ink-soft uppercase tracking-wider">Exportar Avance Real del Proyecto</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => alert('Exportando cronograma en formato Primavera P6 (.XER)...')}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-surface-2 hover:bg-elevated border border-line text-ink font-bold px-3 py-2 rounded-xl text-xs font-mono cursor-pointer"
                >
                  <Download size={14} /> Exportar .XER
                </button>
                <button
                  onClick={() => alert('Exportando cronograma en formato MS Project (.XML)...')}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-surface-2 hover:bg-elevated border border-line text-ink font-bold px-3 py-2 rounded-xl text-xs font-mono cursor-pointer"
                >
                  <Download size={14} /> Exportar .XML (MSP)
                </button>
              </div>
            </div>
          </div>

          {/* Log / Summary Output */}
          <div className="bg-surface border border-line p-6 rounded-2xl space-y-4 font-mono shadow-2xs">
            <div className="flex justify-between items-center text-xs text-brand-500 dark:text-emerald-400 font-bold border-b border-line pb-2">
              <span>TERMINAL DE PROCESAMIENTO CPM / P6</span>
              <span>ESTATUS: {isProcessing ? 'PROCESANDO...' : 'LISTO'}</span>
            </div>

            <div className="bg-surface-2 p-4 rounded-xl border border-line h-48 overflow-y-auto space-y-1 text-xs">
              {importedLogs.length === 0 ? (
                <span className="text-ink-faint">Selecciona un archivo para iniciar la lectura...</span>
              ) : (
                importedLogs.map((log, idx) => (
                  <div key={idx} className="text-ink font-mono">{log}</div>
                ))
              )}
            </div>

            {scheduleData && (
              <div className="p-4 bg-surface-2 rounded-xl border border-line space-y-3 text-xs">
                <span className="text-brand-500 dark:text-emerald-400 font-bold block">RESUMEN DE CRONOGRAMA IMPORTADO</span>
                <div className="grid grid-cols-2 gap-2 text-ink">
                  <div>• Actividades Totales: <strong>{scheduleData.tasksCount}</strong></div>
                  <div>• Niveles WBS/EDT: <strong>{scheduleData.wbsCount}</strong></div>
                  <div>• Ruta Crítica CPM: <strong>{scheduleData.criticalPathCount} Partidas</strong></div>
                  <div>• Rango: <strong>{scheduleData.startDate} a {scheduleData.finishDate}</strong></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: BC3 FIEBDC-3 */}
      {activeTab === 'bc3' && (
        <div className="bg-surface p-6 rounded-2xl border border-line shadow-2xs space-y-6">
          <div className="border-b border-line pb-4">
            <h2 className="text-lg font-bold text-ink">Formato Estándar de Presupuestos BC3 (FIEBDC-3)</h2>
            <p className="text-xs text-ink-soft mt-1 font-medium">
              Intercambio de bases de precios, APUs desglosados y cuadros de mediciones con Presto, Cype y pliegos de licitación.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-surface-2 rounded-xl border border-line space-y-4">
              <h3 className="font-bold text-ink text-sm">Importar Fichero BC3</h3>
              <button
                onClick={handleSimulateBC3Import}
                className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer shadow-2xs"
              >
                Cargar Presupuesto .BC3 de Muestra
              </button>

              {bc3Processed && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-semibold">
                  ✅ Fichero {bc3File} procesado: 42 Partidas de APU cargadas correctamente.
                </div>
              )}
            </div>

            <div className="p-6 bg-surface-2 rounded-xl border border-line space-y-4">
              <h3 className="font-bold text-ink text-sm">Exportar Presupuesto Actual a BC3</h3>
              <p className="text-xs text-ink-soft font-medium">Genera la estructura estandarizada de capítulos, subcapítulos y desglose de insumos.</p>
              <button
                onClick={() => alert('Generando fichero BC3 estandarizado FIEBDC-3...')}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer shadow-2xs"
              >
                Descargar Archivo Presupuesto.bc3
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CONECTORES ERP SAP */}
      {activeTab === 'erp' && (
        <div className="bg-surface p-6 rounded-2xl border border-line shadow-2xs space-y-6">
          <h2 className="text-lg font-bold text-ink">Sincronización Bidireccional con ERP Enterprise (SAP S/4HANA / Maximo)</h2>
          <div className="p-4 bg-surface-2 text-ink rounded-xl border border-line space-y-2 font-mono text-xs">
            <p>• Estado Servicio OData/RFC: <strong className="text-brand-500 dark:text-emerald-400">ACTIVO</strong></p>
            <p>• Módulos Sincronizados: SAP MM (Materiales), SAP PM (Mantenimiento), SAP FI/CO (Costos)</p>
            <p>• ÚLTIMA SINCRONIZACIÓN: {lastSyncTime}</p>
          </div>
        </div>
      )}

      {/* TAB 4: CAD ISOGEN .PCF */}
      {activeTab === 'cad' && (
        <div className="bg-surface p-6 rounded-2xl border border-line shadow-2xs space-y-4">
          <h2 className="text-lg font-bold text-ink">Extracción de Materiales desde Isométricos CAD (.PCF / .IFC)</h2>
          <p className="text-xs text-ink-soft font-medium">Lee archivos de tuberías ISOGEN .pcf para generar listas de juntas y materiales automáticamente.</p>
        </div>
      )}
    </div>
  );
}
