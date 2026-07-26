import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Calculator, 
  FileCode, 
  Wrench, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Download, 
  Layers, 
  ShieldCheck, 
  Ruler, 
  Gauge, 
  Flame, 
  Disc, 
  Cpu, 
  Database, 
  Zap, 
  Paintbrush, 
  Copy, 
  Check,
  ChevronRight,
  Info
} from 'lucide-react';

import { normRegistry, NormCalculator, NormResult } from '../lib/norms';
import { generateNormCalculationPDF } from '../lib/norms/pdfReport';
import { 
  formatPDVSACodeStandard, 
  formatPDVSACodeShort, 
  parsePDVSACode, 
  PDVSA_FILIALES_C, 
  PDVSA_ACES_C, 
  PDVSA_AREAS_GEOGRAFICAS_C, 
  PDVSA_INSTALACIONES_D, 
  PDVSA_FASES_H, 
  PDVSA_ACTIVIDADES_I, 
  PDVSA_DISCIPLINAS_J, 
  PDVSA_TIPOS_K, 
  PDVSA_PRODUCTOS_LL,
  PDVSACodeStandardParams
} from '../lib/data/pdvsa/codificacion';

import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { FlangeAndTighteningTool } from '../components/mechanical/FlangeAndTighteningTool';

export default function EngineeringTools() {
  const [activeTab, setActiveTab] = useState<'norms' | 'mechanical' | 'pdvsa_coder' | 'field_tools'>('mechanical');

  // =========================================================================
  // STATE FOR TAB 1: NORMATIVE CALCULATORS
  // =========================================================================
  const allCalculators = useMemo(() => normRegistry.getAll(), []);
  const [selectedCalcId, setSelectedCalcId] = useState<string>('asme_b31g');
  const selectedCalculator = useMemo(
    () => normRegistry.get(selectedCalcId) || allCalculators[0],
    [selectedCalcId, allCalculators]
  );

  // Dynamic inputs state for current calculator
  const [inputs, setInputs] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    const fields = (normRegistry.get('asme_b31g') || allCalculators[0]).getFields();
    fields.forEach(f => {
      initial[f.id] = f.defaultValue;
    });
    return initial;
  });

  // Handle calculator selection change
  const handleCalculatorChange = (calcId: string) => {
    setSelectedCalcId(calcId);
    const calc = normRegistry.get(calcId);
    if (calc) {
      const initial: Record<string, any> = {};
      calc.getFields().forEach(f => {
        initial[f.id] = f.defaultValue;
      });
      setInputs(initial);
    }
  };

  const handleInputChange = (fieldId: string, val: any) => {
    setInputs(prev => ({ ...prev, [fieldId]: val }));
  };

  // Run calculation
  const normResults: NormResult[] = useMemo(() => {
    if (!selectedCalculator) return [];
    return selectedCalculator.calculate(inputs);
  }, [selectedCalculator, inputs]);

  // PDF Export
  const handleExportPDF = () => {
    if (!selectedCalculator || normResults.length === 0) return;
    generateNormCalculationPDF(selectedCalculator, inputs, normResults);
  };

  // =========================================================================
  // STATE FOR TAB 2: PDVSA DOCUMENT CODER (PIC-01-03-05)
  // =========================================================================
  const [pdvsaStdParams, setPdvsaStdParams] = useState<PDVSACodeStandardParams>({
    filialAA: 'A1',
    aceBB: 'A0',
    areaGeograficaCC: '01',
    anioDD: '26',
    consecutivoEE: '01',

    instalacionFF: 'CW',
    subproyectoG: 0,
    faseH: 'D',
    actividadI: '3',

    disciplinaJ: 'M',
    tipoDocK: 'D',
    productoLL: '01',
    correlativoMMM: 1,
    revision: '0'
  });

  const [activeAnnexTab, setActiveAnnexTab] = useState<'coder' | 'annex_ab' | 'annex_c' | 'annex_d' | 'annex_ef'>('coder');
  const [codeFormatView, setCodeFormatView] = useState<'standard' | 'short'>('standard');
  const [copiedCode, setCopiedCode] = useState(false);
  const [pasteCodeInput, setPasteCodeInput] = useState('');
  const [parsedCodeResult, setParsedCodeResult] = useState<any>(null);

  const generatedPDVSACodeStandard = useMemo(() => {
    return formatPDVSACodeStandard(pdvsaStdParams);
  }, [pdvsaStdParams]);

  const generatedPDVSACodeShort = useMemo(() => {
    return formatPDVSACodeShort({
      ...pdvsaStdParams,
      filialShort: 'WGS',
      aceShort: 'EP',
      proyShort: 'JUS',
      tipoDocShort: 'MEM'
    });
  }, [pdvsaStdParams]);

  const activeGeneratedCode = codeFormatView === 'standard' ? generatedPDVSACodeStandard : generatedPDVSACodeShort;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeGeneratedCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleParseCode = () => {
    if (!pasteCodeInput.trim()) return;
    const res = parsePDVSACode(pasteCodeInput.trim());
    setParsedCodeResult(res);
  };

  // =========================================================================
  // STATE FOR TAB 3: FIELD & AUXILIARY TOOLS
  // =========================================================================
  // 1. Consumo de Soldadura
  const [weldNpsInches, setWeldNpsInches] = useState<number>(8);
  const [weldWallThicknessMm, setWeldWallThicknessMm] = useState<number>(8.18);
  const [weldProcess, setWeldProcess] = useState<'SMAW' | 'GTAW' | 'GMAW' | 'FCAW'>('SMAW');
  const [weldElectrodeId, setWeldElectrodeId] = useState<string>('E7018');
  const [weldJointCount, setWeldJointCount] = useState<number>(10);
  const [customEfficiency, setCustomEfficiency] = useState<number | null>(null);

  // AWS Electrodes Catalog with technical deposition efficiency yields
  const ELECTRODE_CATALOG = [
    { id: 'E6010', name: 'AWS E6010 (Celulósico Raíz)', process: 'SMAW', yieldPct: 58, stubLossPct: 42, note: 'Ideal para pases de raíz en tuberías de acero al carbono (API 5L Gr. B/X52).' },
    { id: 'E7018', name: 'AWS E7018-1 (Bajo Hidrógeno)', process: 'SMAW', yieldPct: 68, stubLossPct: 32, note: 'Polvo de hierro en revestimiento. Pases de relleno y presentación ASME B31.3.' },
    { id: 'E8018-B2', name: 'AWS E8018-B2 (Cr-Mo Alloy)', process: 'SMAW', yieldPct: 66, stubLossPct: 34, note: 'Acero aleado Cromo-Molibdeno para líneas de vapor y alta temperatura.' },
    { id: 'E308L-16', name: 'AWS E308L-16 (Inoxidable 304/316)', process: 'SMAW', yieldPct: 62, stubLossPct: 38, note: 'Electrodo rutilo-básico para aceros inoxidables austeníticos.' },
    { id: 'ER70S-6_TIG', name: 'AWS ER70S-6 (Varilla TIG 36")', process: 'GTAW', yieldPct: 95, stubLossPct: 5, note: 'Varilla sólida con desoxidantes Si/Mn. Pase de raíz 100% radiografiado.' },
    { id: 'ER70S-6_MIG', name: 'AWS ER70S-6 (Alambre Sólido MIG)', process: 'GMAW', yieldPct: 92, stubLossPct: 8, note: 'Alambre continuo para alta productividad en taller de prefabricación.' },
    { id: 'E71T-1M', name: 'AWS E71T-1M / E71T-8 (Tubular FCAW)', process: 'FCAW', yieldPct: 86, stubLossPct: 14, note: 'Alambre tubular con escoria para alta tasa de deposición en campo.' },
    { id: 'ERNiCrMo-3', name: 'AWS ERNiCrMo-3 (Inconel 625)', process: 'GTAW', yieldPct: 96, stubLossPct: 4, note: 'Aleación Níquel-Cromo-Molibdeno para revestimientos y servicio amargo H2S.' },
  ];

  const currentElectrode = ELECTRODE_CATALOG.find(e => e.id === weldElectrodeId) || ELECTRODE_CATALOG[1];

  const weldResults = useMemo(() => {
    const OD = weldNpsInches * 25.4;
    const t = weldWallThicknessMm;
    const meanDiam = OD - t;
    const meanCirc = Math.PI * meanDiam;
    // Standard 75 degree included V-bevel angle + 2mm root gap estimation
    const areaSqMm = (t * t * Math.tan((37.5 * Math.PI) / 180)) + (2.0 * t);
    const volNetCuMm = areaSqMm * meanCirc * weldJointCount;
    const netKg = (volNetCuMm * 7.85) / 1000000; // Steel density 7.85 g/cm3
    
    const effDecimal = (customEfficiency !== null ? customEfficiency : currentElectrode.yieldPct) / 100;
    const grossKg = netKg / Math.max(effDecimal, 0.1);
    const boxes5kg = Math.ceil(grossKg / 5);
    const wasteKg = grossKg - netKg;

    return { 
      netKg, 
      grossKg, 
      boxes5kg, 
      wasteKg,
      effPct: effDecimal * 100,
      electrodeName: currentElectrode.name,
      electrodeNote: currentElectrode.note
    };
  }, [weldNpsInches, weldWallThicknessMm, currentElectrode, customEfficiency, weldJointCount]);

  // 2. Support Span MSS SP-69
  const [spanNps, setSpanNps] = useState<number>(4);
  const [spanFluid, setSpanFluid] = useState<'water' | 'gas' | 'heavy_oil'>('water');

  const spanResultM = useMemo(() => {
    let baseSpan = 4.3; // 4" water default
    if (spanNps === 2) baseSpan = 3.0;
    else if (spanNps === 3) baseSpan = 3.7;
    else if (spanNps === 4) baseSpan = 4.3;
    else if (spanNps === 6) baseSpan = 5.2;
    else if (spanNps === 8) baseSpan = 5.8;
    else if (spanNps === 10) baseSpan = 6.7;
    else if (spanNps === 12) baseSpan = 7.0;
    else if (spanNps >= 16) baseSpan = 8.2;

    if (spanFluid === 'gas') baseSpan *= 1.15;
    if (spanFluid === 'heavy_oil') baseSpan *= 0.90;

    return baseSpan;
  }, [spanNps, spanFluid]);

  // 3. Area de Pintura Tubería
  const [paintNps, setPaintNps] = useState<number>(6);
  const [paintMeters, setPaintMeters] = useState<number>(100);

  const paintAreaSqM = useMemo(() => {
    const OD = paintNps * 0.0254; // meters
    const area = Math.PI * OD * paintMeters;
    return area;
  }, [paintNps, paintMeters]);

  return (
    <div className="space-y-6 pb-12 text-slate-800 dark:text-slate-100">
      {/* PAGE HEADER */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-extrabold text-xs uppercase tracking-wider mb-1">
              <ShieldCheck size={16} />
              <span>Cálculos & Normas de Ingeniería O&G</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Herramientas de Ingeniería
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              Calculadoras normativas certificadas (ASME/API/PDVSA), codificador de documentos PIC-01-03-05 y memorias de cálculo en PDF.
            </p>
          </div>

          {/* Quick Nav Tabs */}
          <div className="flex flex-wrap items-center bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80 shrink-0 gap-1">
            <button
              onClick={() => setActiveTab('mechanical')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'mechanical'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Disc size={15} className="text-amber-500" />
              <span>Mecánica & Torques B16.5</span>
            </button>

            <button
              onClick={() => setActiveTab('norms')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'norms'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Calculator size={15} className="text-amber-500" />
              <span>Normas Técnicas</span>
            </button>

            <button
              onClick={() => setActiveTab('pdvsa_coder')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'pdvsa_coder'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileCode size={15} className="text-blue-500" />
              <span>Codificador PDVSA</span>
            </button>

            <button
              onClick={() => setActiveTab('field_tools')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'field_tools'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Wrench size={15} className="text-emerald-500" />
              <span>Auxiliares Campo</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB: MECHANICAL COMPONENT CATALOG & TIGHTENING TOOL                        */}
      {/* ========================================================================= */}
      {activeTab === 'mechanical' && (
        <FlangeAndTighteningTool />
      )}

      {/* ========================================================================= */}
      {/* TAB 1: NORMATIVE CALCULATORS                                               */}
      {/* ========================================================================= */}
      {activeTab === 'norms' && (
        <div className="space-y-6">
          {/* Calculator Selector Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {allCalculators.map(calc => {
              const isSelected = calc.id === selectedCalcId;
              return (
                <button
                  key={calc.id}
                  onClick={() => handleCalculatorChange(calc.id)}
                  className={`p-3.5 rounded-2xl text-left border transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-slate-900 text-white border-amber-500/80 shadow-md ring-2 ring-amber-500/20'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-mono font-extrabold uppercase px-2 py-0.5 rounded-full ${
                      isSelected ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}>
                      {calc.standard.split('/')[0]}
                    </span>
                    {isSelected && <CheckCircle2 size={14} className="text-amber-400" />}
                  </div>

                  <h3 className="font-extrabold text-xs leading-snug line-clamp-2">
                    {calc.name.split('—')[1] || calc.name}
                  </h3>

                  <span className={`text-[10px] mt-2 block ${isSelected ? 'text-slate-400' : 'text-slate-400'}`}>
                    Categoría: {calc.category}
                  </span>
                </button>
              );
            })}
          </div>

          {/* MAIN TWO-PANEL WORKSPACE */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT PANEL: Dynamic Form Controls */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-5">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 uppercase">
                    Parámetros de Entrada
                  </span>
                  <span className="text-[11px] font-medium text-slate-400">
                    {selectedCalculator.standard}
                  </span>
                </div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                  {selectedCalculator.name}
                </h2>
              </div>

              {/* Dynamic Inputs Form */}
              <div className="space-y-4">
                {selectedCalculator.getFields().map(field => (
                  <div key={field.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                      <label htmlFor={field.id}>{field.label}</label>
                      {field.unit && (
                        <span className="text-[10px] text-slate-400 font-mono">[{field.unit}]</span>
                      )}
                    </div>

                    {field.type === 'select' ? (
                      <select
                        id={field.id}
                        value={inputs[field.id] !== undefined ? inputs[field.id] : field.defaultValue}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
                      >
                        {field.options?.map(opt => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        id={field.id}
                        step={field.step || 'any'}
                        min={field.min}
                        max={field.max}
                        value={inputs[field.id] !== undefined ? inputs[field.id] : field.defaultValue}
                        onChange={(e) => handleInputChange(field.id, field.type === 'number' ? Number(e.target.value) : e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
                      />
                    )}

                    {field.description && (
                      <p className="text-[10px] text-slate-400 flex items-start gap-1">
                        <Info size={11} className="shrink-0 mt-0.5 text-slate-400" />
                        <span>{field.description}</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT PANEL: Calculations & Results */}
            <div className="lg:col-span-7 space-y-5">
              {normResults.map((result, idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-5"
                >
                  {/* Status Banner */}
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <StatusBadge
                        variant={result.passed ? 'success' : 'error'}
                        customText={result.passed ? 'CUMPLE CON NORMA' : 'NO CUMPLE / ACCIÓN REQUERIDA'}
                      />
                      <span className="text-xs font-mono text-slate-400">
                        {result.codeReference}
                      </span>
                    </div>

                    <Button
                      onClick={handleExportPDF}
                      size="sm"
                      className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:bg-slate-800"
                    >
                      <Download size={14} className="mr-1.5" />
                      Exportar PDF
                    </Button>
                  </div>

                  {/* Main Metric Display */}
                  <div className="p-4 bg-slate-900 text-white rounded-xl border border-slate-800 font-mono space-y-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      {result.label}
                    </span>

                    <div className="flex items-baseline justify-between">
                      <span className="text-2xl sm:text-3xl font-black text-amber-400">
                        {result.value} {result.unit}
                      </span>

                      {result.margin !== undefined && (
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block">Margen de Seguridad</span>
                          <span className={`text-sm font-bold ${result.margin >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {result.margin >= 0 ? `+${result.margin}%` : `${result.margin}%`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Calculation Details Breakdown Table */}
                  {result.details && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Desglose de Ecuaciones y Parámetros
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                        {Object.entries(result.details).map(([key, val]) => (
                          <div
                            key={key}
                            className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/60 flex justify-between items-center"
                          >
                            <span className="text-slate-500 dark:text-slate-400 text-[11px]">{key}:</span>
                            <span className="font-bold text-slate-900 dark:text-white">{String(val)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Technical Recommendations */}
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-2 text-xs">
                    <span className="font-bold text-amber-800 dark:text-amber-300 uppercase flex items-center gap-1.5">
                      <AlertTriangle size={15} />
                      <span>Recomendaciones Técnicas e Dictamen de Campo</span>
                    </span>

                    <ul className="space-y-1.5 text-slate-700 dark:text-slate-300">
                      {result.recommendations.map((rec, rIdx) => (
                        <li key={rIdx} className="flex items-start gap-2">
                          <span className="text-amber-500 font-bold">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PDVSA DOCUMENT CODER & ANNEX EXPLORER (PIC-01-03-05)              */}
      {/* ========================================================================= */}
      {activeTab === 'pdvsa_coder' && (
        <div className="space-y-6">
          {/* Sub-navigation for PDVSA Section */}
          <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <button
              onClick={() => setActiveAnnexTab('coder')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeAnnexTab === 'coder'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Generador & Descodificador
            </button>
            <button
              onClick={() => setActiveAnnexTab('annex_ab')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeAnnexTab === 'annex_ab'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Anexos A y B (Revisiones)
            </button>
            <button
              onClick={() => setActiveAnnexTab('annex_c')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeAnnexTab === 'annex_c'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Anexo C (Filial, ACE & Geo)
            </button>
            <button
              onClick={() => setActiveAnnexTab('annex_d')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeAnnexTab === 'annex_d'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Anexo D (Instalaciones)
            </button>
            <button
              onClick={() => setActiveAnnexTab('annex_ef')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeAnnexTab === 'annex_ef'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Anexos E y F (Productos)
            </button>
          </div>

          {/* VIEW 1: CODER WORKSPACE */}
          {activeAnnexTab === 'coder' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Generator Inputs */}
              <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-6">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 uppercase">
                      Norma PDVSA PIC-01-03-05
                    </span>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                      Generador Oficial de Codificación
                    </h2>
                  </div>

                  {/* Format Toggle */}
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-[11px] font-bold">
                    <button
                      onClick={() => setCodeFormatView('standard')}
                      className={`px-3 py-1 rounded-lg transition-all ${
                        codeFormatView === 'standard' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
                      }`}
                    >
                      Estándar (21-Char)
                    </button>
                    <button
                      onClick={() => setCodeFormatView('short')}
                      className={`px-3 py-1 rounded-lg transition-all ${
                        codeFormatView === 'short' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
                      }`}
                    >
                      Campo (Corto)
                    </button>
                  </div>
                </div>

                {/* Live Generated Box */}
                <div className="p-5 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-3 font-mono">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{codeFormatView === 'standard' ? 'CÓDIGO NORMATIVO PIC-01-03-05' : 'CÓDIGO SIMPLIFICADO DE CAMPO'}</span>
                    <StatusBadge variant="info" customText="PIC-01-03-05 VALIDO" size="sm" />
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xl sm:text-2xl font-black text-amber-400 tracking-wider text-center break-all">
                    {activeGeneratedCode}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-400">
                      {codeFormatView === 'standard' 
                        ? 'Grupo 1 (Proyecto) - Grupo 2 (Actividad) - Grupo 3 (Documento)'
                        : 'Filial - Negocio - Proyecto - Fase/Disc - Tipo - Correlativo - Rev'}
                    </span>
                    <Button
                      onClick={handleCopyCode}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                    >
                      {copiedCode ? <Check size={14} className="mr-1.5" /> : <Copy size={14} className="mr-1.5" />}
                      {copiedCode ? '¡Copiado!' : 'Copiar Código'}
                    </Button>
                  </div>
                </div>

                {/* Input Fields Organized by Groups */}
                <div className="space-y-5 text-xs">
                  {/* GRUPO 1 */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-3">
                    <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center justify-between">
                      <span>Grupo 1: Identificación del Proyecto (AABBCCDDEE)</span>
                      <span className="font-mono text-blue-500">
                        {pdvsaStdParams.filialAA}{pdvsaStdParams.aceBB}{pdvsaStdParams.areaGeograficaCC}{pdvsaStdParams.anioDD}{pdvsaStdParams.consecutivoEE}
                      </span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Filial / Negocio (AA)</label>
                        <select
                          value={pdvsaStdParams.filialAA}
                          onChange={(e) => setPdvsaStdParams(p => ({ ...p, filialAA: e.target.value }))}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-bold"
                        >
                          {PDVSA_FILIALES_C.map(f => (
                            <option key={f.code} value={f.code}>{f.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Área Corp / ACE (BB)</label>
                        <select
                          value={pdvsaStdParams.aceBB}
                          onChange={(e) => setPdvsaStdParams(p => ({ ...p, aceBB: e.target.value }))}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-bold"
                        >
                          {PDVSA_ACES_C.map(a => (
                            <option key={a.code} value={a.code}>{a.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Área Geográfica (CC)</label>
                        <select
                          value={pdvsaStdParams.areaGeograficaCC}
                          onChange={(e) => setPdvsaStdParams(p => ({ ...p, areaGeograficaCC: e.target.value }))}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-bold"
                        >
                          {PDVSA_AREAS_GEOGRAFICAS_C.map(g => (
                            <option key={g.code} value={g.code}>{g.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Año (DD)</label>
                        <input
                          type="text"
                          maxLength={2}
                          value={pdvsaStdParams.anioDD}
                          onChange={(e) => setPdvsaStdParams(p => ({ ...p, anioDD: e.target.value }))}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-bold font-mono"
                          placeholder="26"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Consecutivo Proy (EE)</label>
                        <input
                          type="text"
                          maxLength={2}
                          value={pdvsaStdParams.consecutivoEE}
                          onChange={(e) => setPdvsaStdParams(p => ({ ...p, consecutivoEE: e.target.value.toUpperCase() }))}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-bold font-mono"
                          placeholder="01"
                        />
                      </div>
                    </div>
                  </div>

                  {/* GRUPO 2 */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-3">
                    <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center justify-between">
                      <span>Grupo 2: Identificación de Actividad (FFGHI)</span>
                      <span className="font-mono text-blue-500">
                        {pdvsaStdParams.instalacionFF}{pdvsaStdParams.subproyectoG}{pdvsaStdParams.faseH}{pdvsaStdParams.actividadI}
                      </span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Instalación (FF)</label>
                        <select
                          value={pdvsaStdParams.instalacionFF}
                          onChange={(e) => setPdvsaStdParams(p => ({ ...p, instalacionFF: e.target.value }))}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-bold"
                        >
                          {PDVSA_INSTALACIONES_D.map(i => (
                            <option key={i.code} value={i.code}>{i.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Subproyecto (G)</label>
                        <input
                          type="number"
                          min={0}
                          max={9}
                          value={pdvsaStdParams.subproyectoG}
                          onChange={(e) => setPdvsaStdParams(p => ({ ...p, subproyectoG: Number(e.target.value) }))}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-bold font-mono"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Fase FEL (H)</label>
                        <select
                          value={pdvsaStdParams.faseH}
                          onChange={(e) => setPdvsaStdParams(p => ({ ...p, faseH: e.target.value }))}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-bold"
                        >
                          {PDVSA_FASES_H.map(f => (
                            <option key={f.code} value={f.code}>{f.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Actividad (I)</label>
                        <select
                          value={pdvsaStdParams.actividadI}
                          onChange={(e) => setPdvsaStdParams(p => ({ ...p, actividadI: e.target.value }))}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-bold"
                        >
                          {PDVSA_ACTIVIDADES_I.map(a => (
                            <option key={a.code} value={a.code}>{a.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* GRUPO 3 */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-3">
                    <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center justify-between">
                      <span>Grupo 3: Identificación del Documento (JKLLMMM)</span>
                      <span className="font-mono text-blue-500">
                        {pdvsaStdParams.disciplinaJ}{pdvsaStdParams.tipoDocK}{pdvsaStdParams.productoLL}{String(pdvsaStdParams.correlativoMMM).padStart(3, '0')}
                      </span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Disciplina (J)</label>
                        <select
                          value={pdvsaStdParams.disciplinaJ}
                          onChange={(e) => setPdvsaStdParams(p => ({ ...p, disciplinaJ: e.target.value }))}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-bold"
                        >
                          {PDVSA_DISCIPLINAS_J.map(d => (
                            <option key={d.code} value={d.code}>{d.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tipo (K)</label>
                        <select
                          value={pdvsaStdParams.tipoDocK}
                          onChange={(e) => setPdvsaStdParams(p => ({ ...p, tipoDocK: e.target.value }))}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-bold"
                        >
                          {PDVSA_TIPOS_K.map(t => (
                            <option key={t.code} value={t.code}>{t.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Producto (LL)</label>
                        <select
                          value={pdvsaStdParams.productoLL}
                          onChange={(e) => setPdvsaStdParams(p => ({ ...p, productoLL: e.target.value }))}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-bold"
                        >
                          {PDVSA_PRODUCTOS_LL.map(pr => (
                            <option key={pr.code} value={pr.code}>{pr.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Correlativo (MMM)</label>
                        <input
                          type="number"
                          min={1}
                          max={999}
                          value={pdvsaStdParams.correlativoMMM}
                          onChange={(e) => setPdvsaStdParams(p => ({ ...p, correlativoMMM: Number(e.target.value) }))}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-bold font-mono"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Revisión (REV)</label>
                        <input
                          type="text"
                          value={pdvsaStdParams.revision}
                          onChange={(e) => setPdvsaStdParams(p => ({ ...p, revision: e.target.value.toUpperCase() }))}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-bold font-mono"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Decoder & Structure Reference */}
              <div className="lg:col-span-5 space-y-6">
                {/* Decoder Tool */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase flex items-center gap-2">
                    <FileCode size={18} className="text-blue-500" />
                    <span>Descodificador de Código Existente</span>
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Pegue cualquier código de documento PDVSA (Estándar PIC-01-03-05 o Simplificado de campo) para descomponerlo:
                  </p>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={pasteCodeInput}
                      onChange={(e) => setPasteCodeInput(e.target.value)}
                      placeholder="Ej: A1A0012601-CW0D3-MD01001-REV0 o WGS-EP-JUS-DM-MEM-0001-REV0"
                      className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Button onClick={handleParseCode} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold">
                      Analizar
                    </Button>
                  </div>

                  {parsedCodeResult && parsedCodeResult.isValid && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                        <span className="text-[10px] font-bold text-blue-500 uppercase">
                          Formato Detectado: {parsedCodeResult.type === 'standard_pic' ? 'Norma PIC-01-03-05 (Estándar)' : 'Abreviado de Campo'}
                        </span>
                        <StatusBadge variant="success" customText="VALIDO" size="sm" />
                      </div>

                      <div className="space-y-1.5 text-slate-700 dark:text-slate-300">
                        {Object.entries(parsedCodeResult.details || {}).map(([lbl, val]) => (
                          <div key={lbl} className="flex justify-between items-center text-[11px]">
                            <span className="text-slate-400">{lbl}:</span>
                            <strong className="text-slate-900 dark:text-white">{String(val)}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {parsedCodeResult && !parsedCodeResult.isValid && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold">
                      ⚠️ El código ingresado no coincide con el formato norma PDVSA PIC-01-03-05 ni con el formato corto de campo.
                    </div>
                  )}
                </div>

                {/* Structure Cheat Sheet */}
                <div className="p-5 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-3 text-xs font-mono">
                  <h4 className="font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Info size={14} />
                    <span>Estructura de Codificación PIC-01-03-05</span>
                  </h4>
                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-center font-bold text-slate-200">
                    AABBCCDDEE - FFGHI - JKLLMMM - REV#
                  </div>
                  <ul className="space-y-1 text-slate-400 text-[11px]">
                    <li>• <strong className="text-slate-200">AABBCCDDEE</strong>: Filial (AA) + ACE (BB) + Area Geo (CC) + Año (DD) + Consecutivo Proy (EE)</li>
                    <li>• <strong className="text-slate-200">FFGHI</strong>: Instalación (FF) + Subproy (G) + Fase FEL (H) + Actividad (I)</li>
                    <li>• <strong className="text-slate-200">JKLLMMM</strong>: Disciplina (J) + Tipo (K) + Producto (LL) + Correlativo Doc (MMM)</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: ANNEX A & B (REVISIONS & COVER PAGE RULES) */}
          {activeAnnexTab === 'annex_ab' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 uppercase">
                  PDVSA PIC-01-03-05 — Anexos A y B
                </span>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                  Ciclo de Revisiones y Modelo de Portada
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                {/* Draft vs Final Revisions */}
                <div className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <h3 className="font-bold text-slate-900 dark:text-white uppercase text-sm text-amber-500">
                    1. Fases de Revisión y Control de Cambios
                  </h3>

                  <div className="space-y-2 text-slate-700 dark:text-slate-300">
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                      <strong className="text-blue-500">Rev. A, B, C... Z — Borradores de Trabajo (Emisión Inicial):</strong>
                      <p className="mt-1 text-slate-500 dark:text-slate-400">
                        Aplica para revisión interna del contratista, incorporación de comentarios de ingeniería y revisión ETT.
                      </p>
                    </div>

                    <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                      <strong className="text-emerald-500">Rev. 0 — Emisión Original Aprobada:</strong>
                      <p className="mt-1 text-slate-500 dark:text-slate-400">
                        Aprobado por el cliente/PDVSA. En fase de Implantación (I) constituye la versión "Aprobado para Construcción".
                      </p>
                    </div>

                    <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                      <strong className="text-purple-500">Rev. 1, 2, 3... n — Revisiones Posteriores Aprobadas:</strong>
                      <p className="mt-1 text-slate-500 dark:text-slate-400">
                        Modificaciones aprobadas durante la construcción, cambios de alcance o planos "Como Construido" (As-Built).
                      </p>
                    </div>
                  </div>
                </div>

                {/* Header & Cover Requirements */}
                <div className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <h3 className="font-bold text-slate-900 dark:text-white uppercase text-sm text-blue-500">
                    2. Requisitos de Encabezado y Pie de Página
                  </h3>

                  <ul className="space-y-2 text-slate-700 dark:text-slate-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={16} className="text-blue-500 shrink-0 mt-0.5" />
                      <span><strong>Logotipo PDVSA:</strong> Esquina superior izquierda en portada y cajetín de planos.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={16} className="text-blue-500 shrink-0 mt-0.5" />
                      <span><strong>Título de Proyecto & Código:</strong> Centrado en fuente mayúscula en bloque visible.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={16} className="text-blue-500 shrink-0 mt-0.5" />
                      <span><strong>Cuadro de Firmas:</strong> Nombre, firma, cédula, C.I.V. del Elaborador, Revisor y Aprobador.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={16} className="text-blue-500 shrink-0 mt-0.5" />
                      <span><strong>Pie de Página Obligatorio:</strong> Declaración de confidencialidad y propiedad técnica PDVSA.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 3: ANNEX C (CATALOG FILIAL / ACE / GEO) */}
          {activeAnnexTab === 'annex_c' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 uppercase">
                  PDVSA PIC-01-03-05 — Anexo C
                </span>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                  Catálogo Completo de Filiales (AA), Áreas Corp (BB) y Áreas Geográficas (CC)
                </h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
                {/* Filiales AA */}
                <div className="space-y-3">
                  <h3 className="font-bold text-slate-900 dark:text-white uppercase text-xs text-amber-500 border-b pb-2">
                    Filial / Negocio (AA) — {PDVSA_FILIALES_C.length} Registros
                  </h3>
                  <div className="max-h-96 overflow-y-auto space-y-1.5 font-mono pr-1">
                    {PDVSA_FILIALES_C.map(f => (
                      <div key={f.code} className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg flex justify-between">
                        <span className="font-bold text-blue-500">{f.code}</span>
                        <span className="text-slate-700 dark:text-slate-300 text-[11px] text-right">{f.label.split('—')[1] || f.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ACE BB */}
                <div className="space-y-3">
                  <h3 className="font-bold text-slate-900 dark:text-white uppercase text-xs text-blue-500 border-b pb-2">
                    Área Corporativa Específica ACE (BB)
                  </h3>
                  <div className="max-h-96 overflow-y-auto space-y-1.5 font-mono pr-1">
                    {PDVSA_ACES_C.map(a => (
                      <div key={a.code} className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg flex justify-between">
                        <span className="font-bold text-blue-500">{a.code}</span>
                        <span className="text-slate-700 dark:text-slate-300 text-[11px] text-right">{a.label.split('—')[1] || a.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Geo CC */}
                <div className="space-y-3">
                  <h3 className="font-bold text-slate-900 dark:text-white uppercase text-xs text-emerald-500 border-b pb-2">
                    Áreas Geográficas (CC) — {PDVSA_AREAS_GEOGRAFICAS_C.length} Registros
                  </h3>
                  <div className="max-h-96 overflow-y-auto space-y-1.5 font-mono pr-1">
                    {PDVSA_AREAS_GEOGRAFICAS_C.map(g => (
                      <div key={g.code} className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg flex justify-between">
                        <span className="font-bold text-emerald-500">{g.code}</span>
                        <span className="text-slate-700 dark:text-slate-300 text-[11px] text-right">{g.label.split('—')[1] || g.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 4: ANNEX D (INSTALACIONES FF) */}
          {activeAnnexTab === 'annex_d' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-center">
                <div>
                  <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 uppercase">
                    PDVSA PIC-01-03-05 — Anexo D
                  </span>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                    Catálogo Oficial de Tipos de Instalaciones y Facilidades (FF)
                  </h2>
                </div>
                <span className="text-xs font-mono font-bold text-slate-400">
                  {PDVSA_INSTALACIONES_D.length} Tipos Registrados
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs font-mono">
                {PDVSA_INSTALACIONES_D.map(inst => (
                  <div key={inst.code} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                    <span className="text-base font-black text-amber-500 w-10">{inst.code}</span>
                    <span className="text-slate-800 dark:text-slate-200 font-bold text-right text-[11px]">
                      {inst.label.split('—')[1] || inst.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW 5: ANNEX E & F (ENGINEERING PRODUCTS) */}
          {activeAnnexTab === 'annex_ef' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 uppercase">
                  PDVSA PIC-01-03-05 — Anexos E y F
                </span>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                  Catálogo de Productos de Ingeniería (LL) por Disciplina
                </h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
                {/* Disciplines J */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <h3 className="font-bold text-slate-900 dark:text-white uppercase text-xs text-blue-500 border-b pb-2">
                    Disciplinas Técnicas (J)
                  </h3>
                  <div className="space-y-1.5 font-mono">
                    {PDVSA_DISCIPLINAS_J.map(d => (
                      <div key={d.code} className="p-2 bg-white dark:bg-slate-900 rounded-lg flex justify-between items-center">
                        <span className="font-black text-blue-500 text-sm">{d.code}</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{d.label.split('—')[1] || d.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Products LL */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <h3 className="font-bold text-slate-900 dark:text-white uppercase text-xs text-emerald-500 border-b pb-2">
                    Productos de Ingeniería Estándar (LL)
                  </h3>
                  <div className="max-h-96 overflow-y-auto space-y-1.5 font-mono pr-1">
                    {PDVSA_PRODUCTOS_LL.map(pr => (
                      <div key={pr.code} className="p-2 bg-white dark:bg-slate-900 rounded-lg flex justify-between items-center">
                        <span className="font-bold text-emerald-500">{pr.code}</span>
                        <span className="text-slate-700 dark:text-slate-300 text-[11px] text-right">{pr.label.split('—')[1] || pr.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: FIELD AUXILIARY CALCULATORS                                         */}
      {/* ========================================================================= */}
      {activeTab === 'field_tools' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 1. Consumo de Soldadura */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-5">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Flame size={20} className="text-amber-500 shrink-0" />
                <span>Estimador de Consumo de Soldadura</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Cálculo de masa neta de metal depositado y requerimiento bruto de electrodos (cajas 5kg).
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">NPS (Pulgadas)</label>
                <select
                  value={weldNpsInches}
                  onChange={(e) => setWeldNpsInches(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                >
                  <option value={2}>2" NPS</option>
                  <option value={4}>4" NPS</option>
                  <option value={6}>6" NPS</option>
                  <option value={8}>8" NPS</option>
                  <option value={10}>10" NPS</option>
                  <option value={12}>12" NPS</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Espesor Pared (mm)</label>
                <input
                  type="number"
                  step="0.1"
                  value={weldWallThicknessMm}
                  onChange={(e) => setWeldWallThicknessMm(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                />
              </div>

              <div className="col-span-2">
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span>Tipo de Electrodo / Varilla AWS</span>
                  <span className="text-[10px] text-amber-500 font-mono">Rendimiento Técnico: {currentElectrode.yieldPct}%</span>
                </label>
                <select
                  value={weldElectrodeId}
                  onChange={(e) => {
                    const el = ELECTRODE_CATALOG.find(x => x.id === e.target.value);
                    if (el) {
                      setWeldElectrodeId(el.id);
                      setWeldProcess(el.process as any);
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
                >
                  {ELECTRODE_CATALOG.map(el => (
                    <option key={el.id} value={el.id}>
                      [{el.process}] {el.name} — Rendimiento {el.yieldPct}%
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1 italic">{currentElectrode.note}</p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Cantidad de Juntas</label>
                <input
                  type="number"
                  min={1}
                  value={weldJointCount}
                  onChange={(e) => setWeldJointCount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Ajuste Rendimiento (%)</label>
                <input
                  type="number"
                  placeholder={`Std ${currentElectrode.yieldPct}%`}
                  value={customEfficiency ?? ''}
                  onChange={(e) => setCustomEfficiency(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-bold placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-900 text-white rounded-xl border border-slate-800 font-mono text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Metal Neta Depositado:</span>
                <span className="font-bold">{weldResults.netKg.toFixed(2)} kg</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Rendimiento Técnico de Deposición:</span>
                <span className="font-bold text-amber-400">{weldResults.effPct.toFixed(0)}%</span>
              </div>
              <div className="flex justify-between text-amber-400 font-bold">
                <span>Consumo Bruto Requerido:</span>
                <span>{weldResults.grossKg.toFixed(2)} kg</span>
              </div>
              <div className="flex justify-between text-slate-400 text-[10px]">
                <span>Pérdidas por Colilla y Salpicadura:</span>
                <span>{weldResults.wasteKg.toFixed(2)} kg</span>
              </div>
              <div className="flex justify-between text-emerald-400 font-bold border-t border-slate-800 pt-1.5 text-sm">
                <span>Cajas de Electrodo (5 kg):</span>
                <span>{weldResults.boxes5kg} Cajas</span>
              </div>
            </div>
          </div>

          {/* 2. Espaciamiento de Soportes MSS SP-69 */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-5">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Ruler size={20} className="text-emerald-500 shrink-0" />
                <span>Espaciamiento Máximo de Soportes (MSS SP-69)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Luz libre horizontal máxima para evitar deflexión excesiva en líneas de tubería.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">NPS (Pulgadas)</label>
                <select
                  value={spanNps}
                  onChange={(e) => setSpanNps(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                >
                  <option value={2}>2" NPS</option>
                  <option value={3}>3" NPS</option>
                  <option value={4}>4" NPS</option>
                  <option value={6}>6" NPS</option>
                  <option value={8}>8" NPS</option>
                  <option value={10}>10" NPS</option>
                  <option value={12}>12" NPS</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tipo de Fluido</label>
                <select
                  value={spanFluid}
                  onChange={(e) => setSpanFluid(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                >
                  <option value="water">Agua / Líquidos</option>
                  <option value="gas">Gas / Vapor</option>
                  <option value="heavy_oil">Crudo Pesado</option>
                </select>
              </div>
            </div>

            <div className="p-4 bg-slate-900 text-white rounded-xl border border-slate-800 font-mono text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Luz Libre Máxima Recomendada:</span>
                <span className="text-xl font-black text-emerald-400">{spanResultM.toFixed(2)} metros</span>
              </div>
              <p className="text-[10px] text-slate-400 border-t border-slate-800 pt-1.5">
                ✓ Garantiza deflexión &le; 2.5 mm según norma MSS SP-69 / ASME B31.3.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
