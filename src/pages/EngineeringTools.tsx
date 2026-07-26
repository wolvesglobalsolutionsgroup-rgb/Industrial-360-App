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
  formatPDVSACode, 
  parsePDVSACode, 
  PDVSA_FASES, 
  PDVSA_DISCIPLINAS, 
  PDVSA_TIPOS_DOC, 
  PDVSA_NEGOCIOS 
} from '../lib/data/pdvsa/codificacion';

import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';

export default function EngineeringTools() {
  const [activeTab, setActiveTab] = useState<'norms' | 'pdvsa_coder' | 'field_tools'>('norms');

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
  const [pdvsaParams, setPdvsaParams] = useState({
    filial: 'WGS',
    negocio: 'EP',
    proyecto: 'JUS',
    fase: 'D',
    disciplina: 'M',
    tipoDoc: 'MEM',
    correlativo: 1,
    revision: '0'
  });

  const [copiedCode, setCopiedCode] = useState(false);
  const [pasteCodeInput, setPasteCodeInput] = useState('');
  const [parsedCodeResult, setParsedCodeResult] = useState<any>(null);

  const generatedPDVSACode = useMemo(() => {
    return formatPDVSACode(pdvsaParams);
  }, [pdvsaParams]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedPDVSACode);
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
  const [weldJointCount, setWeldJointCount] = useState<number>(10);

  const weldResults = useMemo(() => {
    const OD = weldNpsInches * 25.4;
    const t = weldWallThicknessMm;
    const meanDiam = OD - t;
    const meanCirc = Math.PI * meanDiam;
    const areaSqMm = (t * t * Math.tan((37.5 * Math.PI) / 180)) + (2.0 * t);
    const volNetCuMm = areaSqMm * meanCirc * weldJointCount;
    const netKg = (volNetCuMm * 7.85) / 1000000;
    
    let eff = 0.60;
    if (weldProcess === 'GTAW') eff = 0.90;
    if (weldProcess === 'GMAW') eff = 0.92;
    if (weldProcess === 'FCAW') eff = 0.85;

    const grossKg = netKg / eff;
    const boxes5kg = Math.ceil(grossKg / 5);

    return { netKg, grossKg, boxes5kg, eff: eff * 100 };
  }, [weldNpsInches, weldWallThicknessMm, weldProcess, weldJointCount]);

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
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80 shrink-0">
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
      {/* TAB 2: PDVSA DOCUMENT CODER (PIC-01-03-05)                                */}
      {/* ========================================================================= */}
      {activeTab === 'pdvsa_coder' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Code Generator Controls */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 uppercase">
                Norma Técnica PDVSA PIC-01-03-05
              </span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                Generador de Codificación de Documentos y Planos
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Estructura estandarizada para proyectos de ingeniería de exploración, producción, refinación y gas.
              </p>
            </div>

            {/* Generated Code Live Display Box */}
            <div className="p-5 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-3 font-mono">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>CÓDIGO GENERADO DE DOCUMENTO</span>
                <StatusBadge variant="info" customText="PIC-01-03-05 OK" size="sm" />
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xl sm:text-2xl font-black text-amber-400 tracking-wider text-center break-all">
                {generatedPDVSACode}
              </div>

              <div className="flex justify-end">
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

            {/* Form Fields for PDVSA Code */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Filial / Contratista
                </label>
                <input
                  type="text"
                  value={pdvsaParams.filial}
                  onChange={(e) => setPdvsaParams(p => ({ ...p, filial: e.target.value.toUpperCase() }))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: WGS / PDVSA"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Negocio
                </label>
                <select
                  value={pdvsaParams.negocio}
                  onChange={(e) => setPdvsaParams(p => ({ ...p, negocio: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {PDVSA_NEGOCIOS.map(n => (
                    <option key={n.value} value={n.value}>{n.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Acrónimo de Proyecto / Instalación
                </label>
                <input
                  type="text"
                  value={pdvsaParams.proyecto}
                  onChange={(e) => setPdvsaParams(p => ({ ...p, proyecto: e.target.value.toUpperCase() }))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: JUS, BCN, LUN"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Fase del Proyecto
                </label>
                <select
                  value={pdvsaParams.fase}
                  onChange={(e) => setPdvsaParams(p => ({ ...p, fase: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {PDVSA_FASES.map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Disciplina Técnica
                </label>
                <select
                  value={pdvsaParams.disciplina}
                  onChange={(e) => setPdvsaParams(p => ({ ...p, disciplina: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {PDVSA_DISCIPLINAS.map(d => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Tipo de Documento
                </label>
                <select
                  value={pdvsaParams.tipoDoc}
                  onChange={(e) => setPdvsaParams(p => ({ ...p, tipoDoc: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {PDVSA_TIPOS_DOC.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Correlativo (1 - 9999)
                </label>
                <input
                  type="number"
                  min={1}
                  max={9999}
                  value={pdvsaParams.correlativo}
                  onChange={(e) => setPdvsaParams(p => ({ ...p, correlativo: Number(e.target.value) }))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Revisión (A, B, 0, 1)
                </label>
                <input
                  type="text"
                  value={pdvsaParams.revision}
                  onChange={(e) => setPdvsaParams(p => ({ ...p, revision: e.target.value.toUpperCase() }))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: A, B, 0"
                />
              </div>
            </div>
          </div>

          {/* Right: Code Parser & Decoder */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase flex items-center gap-2">
                <FileCode size={18} className="text-blue-500" />
                <span>Descodificador de Código Existente</span>
              </h3>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pegue un código completo de documento PDVSA para analizar su filial, proyecto, disciplina y tipo.
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={pasteCodeInput}
                  onChange={(e) => setPasteCodeInput(e.target.value)}
                  placeholder="Ej: WGS-EP-JUS-DM-MEM-0001-REV0"
                  className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button onClick={handleParseCode} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold">
                  Analizar
                </Button>
              </div>

              {parsedCodeResult && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono space-y-2">
                  <span className="text-[10px] font-bold text-blue-500 uppercase block">Componentes Desglosados:</span>
                  <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
                    <div>Filial: <strong className="text-slate-900 dark:text-white">{parsedCodeResult.filial}</strong></div>
                    <div>Negocio: <strong className="text-slate-900 dark:text-white">{parsedCodeResult.negocio}</strong></div>
                    <div>Proyecto: <strong className="text-slate-900 dark:text-white">{parsedCodeResult.proyecto}</strong></div>
                    <div>Fase: <strong className="text-slate-900 dark:text-white">{parsedCodeResult.fase}</strong></div>
                    <div>Disciplina: <strong className="text-slate-900 dark:text-white">{parsedCodeResult.disciplina}</strong></div>
                    <div>Tipo Doc: <strong className="text-slate-900 dark:text-white">{parsedCodeResult.tipoDoc}</strong></div>
                    <div>Correlativo: <strong className="text-slate-900 dark:text-white">{parsedCodeResult.correlativo}</strong></div>
                    <div>Revisión: <strong className="text-slate-900 dark:text-white">{parsedCodeResult.revision}</strong></div>
                  </div>
                </div>
              )}
            </div>
          </div>
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

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Proceso Soldadura</label>
                <select
                  value={weldProcess}
                  onChange={(e) => setWeldProcess(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                >
                  <option value="SMAW">SMAW (Electrodo Revestido)</option>
                  <option value="GTAW">GTAW (TIG)</option>
                  <option value="GMAW">GMAW (MIG)</option>
                  <option value="FCAW">FCAW (Tubular)</option>
                </select>
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
            </div>

            <div className="p-4 bg-slate-900 text-white rounded-xl border border-slate-800 font-mono text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Metal Neta Depositado:</span>
                <span className="font-bold">{weldResults.netKg.toFixed(2)} kg</span>
              </div>
              <div className="flex justify-between text-amber-400 font-bold">
                <span>Consumo Bruto Requerido:</span>
                <span>{weldResults.grossKg.toFixed(2)} kg</span>
              </div>
              <div className="flex justify-between text-emerald-400 font-bold border-t border-slate-800 pt-1.5">
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
