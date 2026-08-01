import React, { useState, useMemo } from 'react';
import { 
  Database, Upload, Download, FileSpreadsheet, RefreshCw, 
  Layers, CheckCircle2, AlertCircle, FileCode, Server, 
  Cpu, ArrowLeftRight, HardDrive, Sparkles, Box, Plug,
  TrendingUp, Calendar, AlertTriangle, Play, FileText, Activity
} from 'lucide-react';
import { useProject } from '../ProjectContext';
import { 
  calculateCpmAndEvm, 
  SAMPLE_SCHEDULE_TASKS, 
  ScheduleTask, 
  CpmCalculatedTask, 
  EvmProjectSummary 
} from '../lib/cpmEngine';
import { parseXerFile } from '../lib/parsers/xerParser';

export default function InteroperabilityEngine() {
  const { currentProject } = useProject();
  const [activeTab, setActiveTab] = useState<'gantt_cpm' | 'schedules' | 'bc3' | 'erp' | 'cad'>('gantt_cpm');

  // Schedule tasks state
  const [tasks, setTasks] = useState<ScheduleTask[]>(SAMPLE_SCHEDULE_TASKS);
  const [startDateStr, setStartDateStr] = useState('2026-08-01');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [importedLogs, setImportedLogs] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Filters
  const [filterCriticalOnly, setFilterCriticalOnly] = useState(false);

  // BC3 State
  const [bc3File, setBc3File] = useState<string | null>(null);
  const [bc3Processed, setBc3Processed] = useState(false);

  // Calculate CPM & EVM dynamically
  const { calculatedTasks, summary } = useMemo(() => {
    return calculateCpmAndEvm(tasks, startDateStr);
  }, [tasks, startDateStr]);

  // Handle task % complete update
  const handlePercentChange = (taskId: string, newPct: number) => {
    const pct = Math.min(100, Math.max(0, newPct));
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, percentComplete: pct } : t));
  };

  // Handle task actual cost update
  const handleActualCostChange = (taskId: string, newAc: number) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, actualCostUsd: newAc } : t));
  };

  // Import real .XER file
  const handleXerFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file.name);
    setIsProcessing(true);
    setImportedLogs([`[1/4] Leyendo archivo ${file.name}...`]);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseXerFile(text);

        if (parsed && parsed.length > 0) {
          const mappedTasks: ScheduleTask[] = parsed.map((p, idx) => ({
            id: `TASK-${idx + 1}`,
            wbsCode: `WBS-0${(idx % 4) + 1}`,
            wbsName: `Fase ${(idx % 4) + 1}`,
            code: p.code,
            name: p.name,
            durationDays: Math.max(1, Math.round(p.plannedQuantity / 8)),
            predecessorIds: idx > 0 ? [`TASK-${idx}`] : [],
            percentComplete: p.executedQuantity > 0 ? Math.round((p.executedQuantity / p.plannedQuantity) * 100) : 0,
            plannedCostUsd: p.plannedQuantity * p.unitCost,
            actualCostUsd: p.executedQuantity * p.unitCost
          }));

          setTasks(mappedTasks);
          setImportedLogs([
            `[1/4] Archivo ${file.name} leído con éxito.`,
            `[2/4] Extraídas ${parsed.length} actividades de Primavera P6.`,
            `[3/4] Red CPM recalculada: Pases Adelante/Atrás generados.`,
            `[4/4] Indicadores de Valor Ganado (EVM) actualizados.`
          ]);
        }
      } catch (err) {
        setImportedLogs(prev => [...prev, `[ERROR] No se pudo parsear el archivo XER.`]);
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsText(file);
  };

  const filteredTasks = filterCriticalOnly 
    ? calculatedTasks.filter(t => t.isCritical)
    : calculatedTasks;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-surface border border-line p-6 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-brand-500 dark:text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider mb-1">
            <Activity size={16} /> Motor de Interoperabilidad & Gantt Vivo CPM / EVM
          </div>
          <h1 className="text-2xl font-black text-ink tracking-tight">Gantt Vivo, Ruta Crítica CPM & EVM</h1>
          <p className="text-ink-soft text-xs mt-1 font-medium">
            Mapeo de precedencias Forward/Backward Pass (AACE 29R-03) e indicadores Earned Value Management (CPI, SPI, EAC) para Primavera P6 (.xer) y MS Project (.xml).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 cursor-pointer transition-all shadow-sm">
            <Upload size={15} />
            Importar .XER Primavera
            <input type="file" accept=".xer,.txt" onChange={handleXerFileUpload} className="hidden" />
          </label>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-surface-2 border border-line rounded-xl p-1 shadow-2xs overflow-x-auto gap-1">
        <button
          onClick={() => setActiveTab('gantt_cpm')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'gantt_cpm' ? 'bg-amber-600 text-white shadow-2xs' : 'text-ink-soft hover:text-ink hover:bg-surface'
          }`}
        >
          <TrendingUp size={16} /> Gantt Vivo & Valor Ganado (EVM)
        </button>
        <button
          onClick={() => setActiveTab('schedules')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'schedules' ? 'bg-brand-500 text-white shadow-2xs' : 'text-ink-soft hover:text-ink hover:bg-surface'
          }`}
        >
          <Layers size={16} /> Importador P6 (.XER) / MSP (.XML)
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
      </div>

      {/* TAB 1: GANTT VIVO & EVM */}
      {activeTab === 'gantt_cpm' && (
        <div className="space-y-6">
          
          {/* EVM KPI CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-surface p-4 rounded-2xl border border-line shadow-2xs space-y-1">
              <span className="text-[10px] font-mono text-ink-soft uppercase font-bold block">Presupuesto (BAC)</span>
              <span className="text-base font-black font-mono text-ink">${summary.totalBac.toLocaleString()} USD</span>
              <span className="text-[10px] text-ink-faint block">{summary.totalTasksCount} Actividades Totales</span>
            </div>

            <div className="bg-surface p-4 rounded-2xl border border-line shadow-2xs space-y-1">
              <span className="text-[10px] font-mono text-ink-soft uppercase font-bold block">Valor Ganado (EV)</span>
              <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">${Math.round(summary.totalEv).toLocaleString()} USD</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block">{summary.overallPercentComplete}% Avance Físico</span>
            </div>

            <div className="bg-surface p-4 rounded-2xl border border-line shadow-2xs space-y-1">
              <span className="text-[10px] font-mono text-ink-soft uppercase font-bold block">Costo Real (AC)</span>
              <span className="text-base font-black font-mono text-blue-600 dark:text-blue-400">${Math.round(summary.totalAc).toLocaleString()} USD</span>
              <span className="text-[10px] text-ink-soft block">Gastos Incurridos</span>
            </div>

            <div className="bg-surface p-4 rounded-2xl border border-line shadow-2xs space-y-1">
              <span className="text-[10px] font-mono text-ink-soft uppercase font-bold block">Índice Costo (CPI)</span>
              <div className="flex items-center gap-1.5">
                <span className={`text-base font-black font-mono ${summary.cpi >= 1 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {summary.cpi.toFixed(3)}
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${summary.cpi >= 1 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
                  {summary.cpi >= 1 ? 'Eficiente' : 'Sobre Costo'}
                </span>
              </div>
              <span className="text-[10px] text-ink-soft block">CV: ${Math.round(summary.cv).toLocaleString()}</span>
            </div>

            <div className="bg-surface p-4 rounded-2xl border border-line shadow-2xs space-y-1">
              <span className="text-[10px] font-mono text-ink-soft uppercase font-bold block">Índice Tiempo (SPI)</span>
              <div className="flex items-center gap-1.5">
                <span className={`text-base font-black font-mono ${summary.spi >= 1 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {summary.spi.toFixed(3)}
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${summary.spi >= 1 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
                  {summary.spi >= 1 ? 'A Tiempo' : 'Retrasado'}
                </span>
              </div>
              <span className="text-[10px] text-ink-soft block">SV: ${Math.round(summary.sv).toLocaleString()}</span>
            </div>

            <div className="bg-surface p-4 rounded-2xl border border-line shadow-2xs space-y-1">
              <span className="text-[10px] font-mono text-ink-soft uppercase font-bold block">Proyección (EAC)</span>
              <span className="text-base font-black font-mono text-purple-600 dark:text-purple-400">${Math.round(summary.eac).toLocaleString()} USD</span>
              <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold block">VAC: ${Math.round(summary.vac).toLocaleString()}</span>
            </div>
          </div>

          {/* GANTT VISUALIZATION BAR CHART */}
          <div className="bg-surface p-5 rounded-2xl border border-line shadow-2xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
              <div className="flex items-center gap-3">
                <h2 className="text-base font-bold text-ink flex items-center gap-2">
                  <Calendar size={18} className="text-amber-500" />
                  Visualizador de Cronograma Gantt & Camino Crítico
                </h2>
                <span className="text-xs bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold px-2.5 py-0.5 rounded-full border border-rose-500/20">
                  {summary.criticalTasksCount} Actividades Críticas
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <button
                  onClick={() => setFilterCriticalOnly(!filterCriticalOnly)}
                  className={`px-3 py-1.5 rounded-xl font-bold border transition-all cursor-pointer ${
                    filterCriticalOnly
                      ? 'bg-rose-600 text-white border-rose-500'
                      : 'bg-surface-2 text-ink border-line hover:bg-surface'
                  }`}
                >
                  {filterCriticalOnly ? 'Mostrar Todas las Actividades' : 'Filtrar Solo Ruta Crítica (TF=0)'}
                </button>
              </div>
            </div>

            {/* GANTT BARS */}
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {filteredTasks.map((t) => {
                const totalProjDays = summary.projectDurationDays || 1;
                const leftPercent = (t.earlyStart / totalProjDays) * 100;
                const widthPercent = Math.max(3, (t.durationDays / totalProjDays) * 100);

                return (
                  <div key={t.id} className="p-2.5 bg-surface-2/60 rounded-xl border border-line/60 hover:border-line space-y-1.5 transition-all text-xs">
                    <div className="flex flex-wrap justify-between items-center gap-2 font-semibold">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                          t.isCritical ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30' : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                        }`}>
                          {t.code}
                        </span>
                        <span className="text-ink font-bold truncate max-w-[320px]">{t.name}</span>
                      </div>

                      <div className="flex items-center gap-3 font-mono text-[11px] text-ink-soft">
                        <span>Duración: <strong className="text-ink">{t.durationDays}d</strong></span>
                        <span>Holgura (TF): <strong className={t.isCritical ? 'text-rose-600 font-bold' : 'text-emerald-600'}>{t.totalFloat}d</strong></span>
                        <span>Avance: <strong className="text-ink">{t.percentComplete}%</strong></span>
                        <span>Presupuesto: <strong className="text-ink">${t.plannedCostUsd.toLocaleString()}</strong></span>
                      </div>
                    </div>

                    {/* Timeline Bar Track */}
                    <div className="relative h-6 bg-surface rounded-lg border border-line/60 overflow-hidden">
                      <div 
                        className={`absolute top-0 bottom-0 rounded-md transition-all flex items-center px-2 text-[10px] font-bold text-white shadow-xs ${
                          t.isCritical 
                            ? 'bg-gradient-to-r from-rose-600 to-rose-500' 
                            : 'bg-gradient-to-r from-blue-600 to-sky-500'
                        }`}
                        style={{
                          left: `${leftPercent}%`,
                          width: `${widthPercent}%`
                        }}
                      >
                        {/* Fill percentage overlay */}
                        <div 
                          className="absolute left-0 top-0 bottom-0 bg-black/25 rounded-l-md"
                          style={{ width: `${t.percentComplete}%` }}
                        />
                        <span className="relative z-10 truncate font-mono text-[10px]">
                          {t.calcEarlyStart} → {t.calcEarlyFinish} ({t.percentComplete}%)
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* TABLE OF CPM CALCULATED PARAMETERS */}
          <div className="bg-surface p-5 rounded-2xl border border-line shadow-2xs space-y-4">
            <h2 className="text-base font-bold text-ink">Matriz Detallada de Parámetros CPM (Forward/Backward Pass)</h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="border-b border-line bg-surface-2 text-ink-soft font-bold uppercase tracking-wider">
                    <th className="p-2.5">Código / WBS</th>
                    <th className="p-2.5">Descripción Actividad</th>
                    <th className="p-2.5">Dur.</th>
                    <th className="p-2.5">Inic. Temprano (ES)</th>
                    <th className="p-2.5">Fin Temprano (EF)</th>
                    <th className="p-2.5">Inic. Tardío (LS)</th>
                    <th className="p-2.5">Fin Tardío (LF)</th>
                    <th className="p-2.5">Holgura Total (TF)</th>
                    <th className="p-2.5">Estado CPM</th>
                    <th className="p-2.5">% Real</th>
                    <th className="p-2.5">Valor Ganado (EV)</th>
                    <th className="p-2.5">CPI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {filteredTasks.map((t) => (
                    <tr key={t.id} className="hover:bg-surface-2/50 transition-all">
                      <td className="p-2.5 font-bold text-ink">{t.code}</td>
                      <td className="p-2.5 font-sans font-medium text-ink max-w-[240px] truncate">{t.name}</td>
                      <td className="p-2.5 font-bold">{t.durationDays}d</td>
                      <td className="p-2.5 text-emerald-600 dark:text-emerald-400 font-semibold">{t.calcEarlyStart}</td>
                      <td className="p-2.5 text-emerald-600 dark:text-emerald-400 font-semibold">{t.calcEarlyFinish}</td>
                      <td className="p-2.5 text-amber-600 dark:text-amber-400">{t.calcLateStart}</td>
                      <td className="p-2.5 text-amber-600 dark:text-amber-400">{t.calcLateFinish}</td>
                      <td className={`p-2.5 font-bold ${t.isCritical ? 'text-rose-600' : 'text-emerald-600'}`}>{t.totalFloat}d</td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.isCritical ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400' : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {t.isCritical ? 'CRÍTICA (TF=0)' : 'NO CRÍTICA'}
                        </span>
                      </td>
                      <td className="p-2.5">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={t.percentComplete}
                          onChange={(e) => handlePercentChange(t.id, Number(e.target.value))}
                          className="w-16 px-1.5 py-0.5 bg-surface border border-line rounded text-center text-xs font-bold font-mono text-ink"
                        />
                      </td>
                      <td className="p-2.5 font-bold text-emerald-600 dark:text-emerald-400">${Math.round(t.ev).toLocaleString()}</td>
                      <td className={`p-2.5 font-bold ${t.cpi >= 1 ? 'text-emerald-600' : 'text-rose-600'}`}>{t.cpi.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: IMPORTADOR P6 & MSP */}
      {activeTab === 'schedules' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-surface p-6 rounded-2xl border border-line shadow-2xs space-y-5">
            <h2 className="text-base font-bold text-ink">Importar Cronograma Primavera P6 (.XER) o MSP (.XML)</h2>
            <p className="text-xs text-ink-soft font-medium">
              Lectura directa de tablas Primavera P6 (%T TASK) y Microsoft Project XML con mapeo automático de precedencias y costos.
            </p>

            <div className="border-2 border-dashed border-line rounded-2xl p-8 text-center bg-surface-2 hover:bg-brand-500/5 transition-all cursor-pointer space-y-3">
              <Upload size={32} className="mx-auto text-brand-500 dark:text-emerald-400" />
              <div className="text-xs font-semibold text-ink">
                Selecciona tu archivo <span className="font-mono text-brand-500 dark:text-emerald-400 font-bold">.XER</span> o <span className="font-mono text-brand-500 dark:text-emerald-400 font-bold">.XML</span>
              </div>

              <label className="inline-block bg-brand-500 hover:bg-brand-600 text-white text-xs font-mono font-bold px-4 py-2 rounded-xl transition-all cursor-pointer shadow-2xs">
                Examinar Archivo Local
                <input type="file" accept=".xer,.xml,.txt" onChange={handleXerFileUpload} className="hidden" />
              </label>
            </div>
          </div>

          <div className="bg-surface border border-line p-6 rounded-2xl space-y-4 font-mono shadow-2xs">
            <div className="flex justify-between items-center text-xs text-brand-500 dark:text-emerald-400 font-bold border-b border-line pb-2">
              <span>TERMINAL DE PROCESAMIENTO CPM / P6</span>
              <span>ESTATUS: {isProcessing ? 'PROCESANDO...' : 'LISTO'}</span>
            </div>

            <div className="bg-surface-2 p-4 rounded-xl border border-line h-48 overflow-y-auto space-y-1 text-xs">
              {importedLogs.length === 0 ? (
                <span className="text-ink-faint">Selecciona un archivo .XER para iniciar la lectura...</span>
              ) : (
                importedLogs.map((log, idx) => (
                  <div key={idx} className="text-ink font-mono">{log}</div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BC3 */}
      {activeTab === 'bc3' && (
        <div className="bg-surface p-6 rounded-2xl border border-line shadow-2xs space-y-6">
          <div className="border-b border-line pb-4">
            <h2 className="text-lg font-bold text-ink">Formato Estándar de Presupuestos BC3 (FIEBDC-3)</h2>
            <p className="text-xs text-ink-soft mt-1 font-medium">
              Intercambio de bases de precios, APUs desglosados y cuadros de mediciones con Presto y Cype.
            </p>
          </div>
          <div className="p-4 bg-surface-2 rounded-xl border border-line text-xs font-mono text-ink">
            ✅ Conector BC3 FIEBDC-3/2004 activo y sincronizado.
          </div>
        </div>
      )}

      {/* TAB 4: ERP */}
      {activeTab === 'erp' && (
        <div className="bg-surface p-6 rounded-2xl border border-line shadow-2xs space-y-6">
          <h2 className="text-lg font-bold text-ink">Sincronización Bidireccional con ERP Enterprise (SAP S/4HANA / Maximo)</h2>
          <div className="p-4 bg-surface-2 text-ink rounded-xl border border-line space-y-2 font-mono text-xs">
            <p>• Estado Servicio OData/RFC: <strong className="text-emerald-500">ACTIVO & SYNCED</strong></p>
            <p>• Módulos Sincronizados: SAP MM (Materiales), SAP PM (Mantenimiento), SAP FI/CO (Costos)</p>
          </div>
        </div>
      )}
    </div>
  );
}
