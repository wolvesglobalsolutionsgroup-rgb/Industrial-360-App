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
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider mb-1">
            <ArrowLeftRight size={16} /> Motor de Interoperabilidad Universal
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Integración P6, MSP, BC3 & ERP SAP</h1>
          <p className="text-slate-400 text-sm mt-1">
            Importador y exportador bidireccional nativo para cronogramas Primavera P6 (.xer), presupuestos BC3 y modelos CAD/ISOGEN.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-4 py-2 rounded-xl">
          <Server size={18} className="text-emerald-400 animate-pulse" />
          <div className="text-xs font-mono">
            <span className="text-slate-400 block">Conector SAP OData</span>
            <span className="text-emerald-400 font-bold">ONLINE & SYNCED</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white rounded-xl p-1 shadow-sm overflow-x-auto">
        <button
          onClick={() => setActiveTab('schedules')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
            activeTab === 'schedules' ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Layers size={16} /> Cronogramas (.XER / .MPP)
        </button>
        <button
          onClick={() => setActiveTab('bc3')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
            activeTab === 'bc3' ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <FileCode size={16} /> Presupuestos BC3 (FIEBDC-3)
        </button>
        <button
          onClick={() => setActiveTab('erp')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
            activeTab === 'erp' ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Plug size={16} /> Conectores ERP SAP / Maximo
        </button>
        <button
          onClick={() => setActiveTab('cad')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
            activeTab === 'cad' ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Box size={16} /> ISOGEN (.PCF) & CAD IFC
        </button>
      </div>

      {/* TAB 1: CRONOGRAMAS P6 & MSP */}
      {activeTab === 'schedules' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-5">
            <h2 className="text-base font-bold text-gray-900">Importar Cronograma de Proyecto</h2>
            <p className="text-xs text-gray-500">
              Soporta Primavera P6 (.xer / .xml) y Microsoft Project (.mpp). Mantiene precedencias, holguras y asignación de recursos.
            </p>

            <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center bg-slate-50 hover:bg-emerald-50/30 transition-all cursor-pointer space-y-3">
              <Upload size={32} className="mx-auto text-emerald-600" />
              <div className="text-xs font-semibold text-gray-700">
                Arrastra tu archivo <span className="font-mono text-emerald-700 font-bold">.XER</span> o <span className="font-mono text-emerald-700 font-bold">.MPP</span> aquí
              </div>
              <p className="text-[11px] text-gray-400">O selecciona una simulación rápida a continuación:</p>

              <div className="flex justify-center gap-2 pt-2">
                <button
                  onClick={() => handleSimulateScheduleImport('CRONOGRAMA_OFFSHORE_P6_V2.XER')}
                  className="bg-slate-900 text-white text-xs font-mono font-bold px-3 py-1.5 rounded-lg hover:bg-slate-800"
                >
                  Probar .XER Primavera
                </button>
                <button
                  onClick={() => handleSimulateScheduleImport('PLAN_OBRA_PIPING_2026.MPP')}
                  className="bg-slate-800 text-white text-xs font-mono font-bold px-3 py-1.5 rounded-lg hover:bg-slate-700"
                >
                  Probar .MPP MS Project
                </button>
              </div>
            </div>

            {/* Export Section */}
            <div className="pt-4 border-t border-gray-100 space-y-3">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Exportar Avance Real del Proyecto</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => alert('Exportando cronograma en formato Primavera P6 (.XER)...')}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold px-3 py-2 rounded-xl text-xs font-mono"
                >
                  <Download size={14} /> Exportar .XER
                </button>
                <button
                  onClick={() => alert('Exportando cronograma en formato MS Project (.XML)...')}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold px-3 py-2 rounded-xl text-xs font-mono"
                >
                  <Download size={14} /> Exportar .XML (MSP)
                </button>
              </div>
            </div>
          </div>

          {/* Log / Summary Output */}
          <div className="bg-slate-900 text-white p-6 rounded-2xl space-y-4 font-mono">
            <div className="flex justify-between items-center text-xs text-emerald-400 font-bold border-b border-slate-800 pb-2">
              <span>TERMINAL DE PROCESAMIENTO CPM / P6</span>
              <span>ESTATUS: {isProcessing ? 'PROCESANDO...' : 'LISTO'}</span>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 h-48 overflow-y-auto space-y-1 text-xs">
              {importedLogs.length === 0 ? (
                <span className="text-slate-500">Selecciona un archivo para iniciar la lectura...</span>
              ) : (
                importedLogs.map((log, idx) => (
                  <div key={idx} className="text-slate-300">{log}</div>
                ))
              )}
            </div>

            {scheduleData && (
              <div className="p-4 bg-slate-800 rounded-xl border border-slate-700 space-y-3 text-xs">
                <span className="text-emerald-400 font-bold block">RESUMEN DE CRONOGRAMA IMPORTADO</span>
                <div className="grid grid-cols-2 gap-2 text-slate-200">
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
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-lg font-bold text-gray-900">Formato Estándar de Presupuestos BC3 (FIEBDC-3)</h2>
            <p className="text-xs text-gray-500 mt-1">
              Intercambio de bases de precios, APUs desglosados y cuadros de mediciones con Presto, Cype y pliegos de licitación.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-slate-50 rounded-xl border border-gray-200 space-y-4">
              <h3 className="font-bold text-slate-900 text-sm">Importar Fichero BC3</h3>
              <button
                onClick={handleSimulateBC3Import}
                className="w-full bg-slate-900 text-white font-bold py-2.5 rounded-xl text-xs hover:bg-slate-800"
              >
                Cargar Presupuesto .BC3 de Muestra
              </button>

              {bc3Processed && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold">
                  ✅ Fichero {bc3File} procesado: 42 Partidas de APU cargadas correctamente.
                </div>
              )}
            </div>

            <div className="p-6 bg-slate-50 rounded-xl border border-gray-200 space-y-4">
              <h3 className="font-bold text-slate-900 text-sm">Exportar Presupuesto Actual a BC3</h3>
              <p className="text-xs text-gray-600">Genera la estructura estandarizada de capítulos, subcapítulos y desglose de insumos.</p>
              <button
                onClick={() => alert('Generando fichero BC3 estandarizado FIEBDC-3...')}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs"
              >
                Descargar Archivo Presupuesto.bc3
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CONECTORES ERP SAP */}
      {activeTab === 'erp' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-gray-900">Sincronización Bidireccional con ERP Enterprise (SAP S/4HANA / Maximo)</h2>
          <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2 font-mono text-xs">
            <p>• Estado Servicio OData/RFC: <strong className="text-emerald-400">ACTIVO</strong></p>
            <p>• Módulos Sincronizados: SAP MM (Materiales), SAP PM (Mantenimiento), SAP FI/CO (Costos)</p>
            <p>• ÚLTIMA SINCRONIZACIÓN: {lastSyncTime}</p>
          </div>
        </div>
      )}

      {/* TAB 4: CAD ISOGEN .PCF */}
      {activeTab === 'cad' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Extracción de Materiales desde Isométricos CAD (.PCF / .IFC)</h2>
          <p className="text-xs text-gray-500">Lee archivos de tuberías ISOGEN .pcf para generar listas de juntas y materiales automáticamente.</p>
        </div>
      )}
    </div>
  );
}
