import React, { useState } from 'react';
import { Layers, CheckCircle2, Clock, AlertCircle, ArrowRight, FileText, ChevronRight } from 'lucide-react';
import { FasePDVSA, FASES_PDVSA_DESCRIPCION } from '../../lib/data/pdvsa/dossierTypes';

export interface PhaseManagerProps {
  currentPhase: FasePDVSA;
  onPhaseChange?: (newPhase: FasePDVSA) => void;
  projectName?: string;
}

export function PhaseManager({ currentPhase = 'I', onPhaseChange, projectName }: PhaseManagerProps) {
  const [activePhase, setActivePhase] = useState<FasePDVSA>(currentPhase);

  const handleSelectPhase = (fase: FasePDVSA) => {
    setActivePhase(fase);
    if (onPhaseChange) {
      onPhaseChange(fase);
    }
  };

  const activePhaseInfo = FASES_PDVSA_DESCRIPCION[activePhase];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <span className="text-[10px] font-mono font-bold text-amber-500 uppercase tracking-wider block">
            FEL / Guía de Gerencia de Proyectos de Inversión (GPG)
          </span>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers size={18} className="text-amber-500" /> Gestión de Fases del Proyecto (PAMS / PDVSA)
          </h3>
        </div>
        <span className="text-xs font-mono font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-3 py-1 rounded-full">
          Fase Actual: {activePhase}
        </span>
      </div>

      {/* Phase Timeline Stepper */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {(['V', 'C', 'D', 'I', 'O'] as FasePDVSA[]).map((fase) => {
          const isCurrent = activePhase === fase;
          const info = FASES_PDVSA_DESCRIPCION[fase];

          return (
            <button
              key={fase}
              onClick={() => handleSelectPhase(fase)}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative ${
                isCurrent
                  ? 'bg-amber-500 text-slate-950 border-amber-500 font-extrabold shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black font-mono">Fase {fase}</span>
                {isCurrent && <CheckCircle2 size={16} className="text-slate-950" />}
              </div>
              <p className="text-[11px] font-bold mt-1 line-clamp-1">{info.nombre.split('—')[1]?.trim()}</p>
            </button>
          );
        })}
      </div>

      {/* Active Phase Details */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase font-mono">
            {activePhaseInfo.nombre}
          </h4>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
          {activePhaseInfo.descripcion}
        </p>

        <div className="pt-2">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1.5 uppercase font-mono">
            Documentos & Entregables Clave de la Fase:
          </span>
          <div className="flex flex-wrap gap-2">
            {activePhaseInfo.docsClave.map((docName, idx) => (
              <span key={idx} className="text-[10px] font-bold bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg flex items-center gap-1">
                <FileText size={12} className="text-amber-500" /> {docName}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
