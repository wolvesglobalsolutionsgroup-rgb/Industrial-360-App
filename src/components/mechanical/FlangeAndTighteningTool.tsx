import React, { useState } from 'react';
import { FLANGE_DATA, FlangeSpec } from '../../lib/norms/asme/asmeB165';
import { VALVE_CATALOG, VALVE_FACE_TO_FACE_ASME_B1610 } from '../../lib/data/mechanical/valves';
import { GASKET_CATALOG } from '../../lib/data/mechanical/gaskets';
import { PIPE_SCHEDULE_CATALOG } from '../../lib/data/mechanical/pipeSchedules';
import { PCC1_PASSES, TIGHTENING_GUIDELINES } from '../../lib/data/mechanical/tightening';
import { Disc, Shield, Wrench, Layers, CheckCircle2, Info, ChevronRight, Activity } from 'lucide-react';

import { InteractiveFlangeDiagram } from './InteractiveFlangeDiagram';
import { ValveVisualizer } from './ValveVisualizer';
import { GasketVisualizer } from './GasketVisualizer';

export const FlangeAndTighteningTool: React.FC = () => {
  const [subTab, setSubTab] = useState<'flanges_tightening' | 'valves' | 'gaskets' | 'pipe_schedules'>('flanges_tightening');

  // Flange & Tightening State
  const [selectedRating, setSelectedRating] = useState<string>('150#');
  const [selectedNps, setSelectedNps] = useState<string>('4"');
  const [activePassIndex, setActivePassIndex] = useState<number>(2); // Default 100% Pass 3

  // Valve State
  const [selectedValveIndex, setSelectedValveIndex] = useState<number>(0);

  // Pipe Schedule State
  const [selectedPipeNps, setSelectedPipeNps] = useState<string>('4"');

  const ratingOptions = Object.keys(FLANGE_DATA);
  const npsOptions = Object.keys(FLANGE_DATA[selectedRating] || {});
  const currentFlangeSpec: FlangeSpec | undefined = FLANGE_DATA[selectedRating]?.[selectedNps];

  const activePass = PCC1_PASSES[activePassIndex];

  // Helper to calculate torque for current pass
  const passTorqueFtLb = currentFlangeSpec ? Math.round(currentFlangeSpec.torqueFtLb * (activePass.percent / 100)) : 0;
  const passTorqueNm = currentFlangeSpec ? Math.round(currentFlangeSpec.torqueNm * (activePass.percent / 100)) : 0;

  return (
    <div className="space-y-6">
      {/* Sub Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line pb-3">
        <button
          onClick={() => setSubTab('flanges_tightening')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            subTab === 'flanges_tightening'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'bg-surface text-ink-soft hover:text-ink hover:bg-surface-2'
          }`}
        >
          <Disc size={16} />
          <span>Bridas B16.5 & Secuencia de Apriete (PCC-1)</span>
        </button>

        <button
          onClick={() => setSubTab('valves')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            subTab === 'valves'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'bg-surface text-ink-soft hover:text-ink hover:bg-surface-2'
          }`}
        >
          <Shield size={16} />
          <span>Válvulas Industriales (API 600/602/6D)</span>
        </button>

        <button
          onClick={() => setSubTab('gaskets')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            subTab === 'gaskets'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'bg-surface text-ink-soft hover:text-ink hover:bg-surface-2'
          }`}
        >
          <Wrench size={16} />
          <span>Empacaduras (B16.20 / B16.21)</span>
        </button>

        <button
          onClick={() => setSubTab('pipe_schedules')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            subTab === 'pipe_schedules'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'bg-surface text-ink-soft hover:text-ink hover:bg-surface-2'
          }`}
        >
          <Layers size={16} />
          <span>Cédulas de Tubería (B36.10 / B36.19)</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUBTAB 1: BRIDAS B16.5 & SECUENCIA DE APRIETE PCC-1 */}
      {/* ========================================================================= */}
      {subTab === 'flanges_tightening' && (
        <div className="space-y-6">
          {/* Controls Header */}
          <div className="p-4 rounded-2xl bg-surface border border-line grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-center">
            <div>
              <label className="block text-xs font-bold text-ink-soft uppercase mb-1">Clase de Presión (Rating)</label>
              <select
                value={selectedRating}
                onChange={(e) => {
                  const r = e.target.value;
                  setSelectedRating(r);
                  const newNpsOpts = Object.keys(FLANGE_DATA[r] || {});
                  if (!newNpsOpts.includes(selectedNps)) {
                    setSelectedNps(newNpsOpts[0] || '4"');
                  }
                }}
                className="w-full bg-surface-2 border border-line rounded-xl px-3 py-2 text-sm font-bold text-ink focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {ratingOptions.map(r => (
                  <option key={r} value={r}>Clase {r}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink-soft uppercase mb-1">Diámetro Nominal (NPS)</label>
              <select
                value={selectedNps}
                onChange={(e) => setSelectedNps(e.target.value)}
                className="w-full bg-surface-2 border border-line rounded-xl px-3 py-2 text-sm font-bold text-ink focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {npsOptions.map(n => (
                  <option key={n} value={n}>NPS {n}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink-soft uppercase mb-1">Pasada de Apriete (ASME PCC-1)</label>
              <div className="grid grid-cols-4 gap-1 bg-surface-2 p-1 rounded-xl border border-line">
                {PCC1_PASSES.map((p, idx) => (
                  <button
                    key={p.passNumber}
                    onClick={() => setActivePassIndex(idx)}
                    className={`py-1 text-xs font-black rounded-lg transition-all ${
                      activePassIndex === idx
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : 'text-ink-soft hover:text-ink'
                    }`}
                  >
                    P{p.passNumber} ({p.percent}%)
                  </button>
                ))}
              </div>
            </div>
          </div>

          {currentFlangeSpec ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Flange Dimensions Card */}
              <div className="lg:col-span-5 space-y-4">
                <div className="p-5 rounded-2xl bg-surface border border-line space-y-4">
                  <div className="flex items-center justify-between border-b border-line pb-3">
                    <div>
                      <h3 className="text-base font-black text-ink font-display">
                        Brida {currentFlangeSpec.nps} Clase {selectedRating}
                      </h3>
                      <p className="text-xs text-ink-soft">Especificaciones mecánicas ASME B16.5</p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500/10 text-amber-600 border border-amber-500/30">
                      {currentFlangeSpec.holesCount} Pernos
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-surface-2 border border-line">
                      <span className="text-ink-soft block font-medium">Diámetro Exterior (OD)</span>
                      <span className="text-sm font-black text-ink font-mono">{currentFlangeSpec.odMm} mm</span>
                    </div>

                    <div className="p-3 rounded-xl bg-surface-2 border border-line">
                      <span className="text-ink-soft block font-medium">Espesor Brida (t)</span>
                      <span className="text-sm font-black text-ink font-mono">{currentFlangeSpec.thicknessMm} mm</span>
                    </div>

                    <div className="p-3 rounded-xl bg-surface-2 border border-line">
                      <span className="text-ink-soft block font-medium">Círculo Pernos (BCD)</span>
                      <span className="text-sm font-black text-ink font-mono">{currentFlangeSpec.bcdMm} mm</span>
                    </div>

                    <div className="p-3 rounded-xl bg-surface-2 border border-line">
                      <span className="text-ink-soft block font-medium">Diámetro de Orificio</span>
                      <span className="text-sm font-black text-ink font-mono">{currentFlangeSpec.holeDiamInches}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-surface-2 border border-line">
                      <span className="text-ink-soft block font-medium">Diámetro Perno / Rosca</span>
                      <span className="text-sm font-black text-ink font-mono">{currentFlangeSpec.boltDiamInches} ({currentFlangeSpec.boltThread})</span>
                    </div>

                    <div className="p-3 rounded-xl bg-surface-2 border border-line">
                      <span className="text-ink-soft block font-medium">Copa Hexagonal (Dado)</span>
                      <span className="text-sm font-black text-ink font-mono">{currentFlangeSpec.socketInches} ({currentFlangeSpec.socketMm} mm)</span>
                    </div>
                  </div>

                  {/* Target Torque Display */}
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase">
                        Torque Pasada {activePass.passNumber} ({activePass.percent}%)
                      </span>
                      <span className="text-xs font-extrabold text-amber-600 bg-amber-500/20 px-2 py-0.5 rounded">
                        Target 100%: {currentFlangeSpec.torqueFtLb} ft-lb
                      </span>
                    </div>
                    <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
                      {passTorqueFtLb} ft-lb <span className="text-base font-bold text-ink-soft">({passTorqueNm} N·m)</span>
                    </div>
                    <p className="text-xs text-ink-soft pt-1">{activePass.description}</p>
                  </div>
                </div>

                {/* Guidelines */}
                <div className="p-4 rounded-2xl bg-surface border border-line space-y-2">
                  <h4 className="text-xs font-bold text-ink uppercase flex items-center gap-1.5">
                    <Info size={14} className="text-amber-500" />
                    <span>Procedimiento de Instalación ASME PCC-1</span>
                  </h4>
                  <ul className="text-xs text-ink-soft space-y-1.5 pl-4 list-disc">
                    {TIGHTENING_GUIDELINES.slice(0, 4).map((g, idx) => (
                      <li key={idx}>{g}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Flange Tightening Visualizer Interactive SVG Diagram */}
              <div className="lg:col-span-7 p-5 rounded-2xl bg-surface border border-line space-y-4">
                <div className="flex items-center justify-between border-b border-line pb-3">
                  <div>
                    <h3 className="text-base font-black text-ink font-display flex items-center gap-2">
                      <Disc size={20} className="text-amber-500" />
                      <span>Mapa Interactivo de Secuencia de Apriete (Star Pattern)</span>
                    </h3>
                    <p className="text-xs text-ink-soft">Haz clic en reproducir o selecciona un perno para ver su torque y copa requerida</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/30 font-mono">
                    ASME PCC-1
                  </span>
                </div>

                <InteractiveFlangeDiagram
                  flangeSpec={currentFlangeSpec}
                  rating={selectedRating}
                  activePassIndex={activePassIndex}
                />
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-ink-soft bg-surface rounded-2xl border border-line">
              No hay datos de brida disponibles para esta combinación.
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 2: VÁLVULAS INDUSTRIALES */}
      {/* ========================================================================= */}
      {subTab === 'valves' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Valve Types Navigation List */}
          <div className="lg:col-span-4 space-y-2">
            <h3 className="text-xs font-bold text-ink-soft uppercase px-1">Catálogo de Válvulas Industriales</h3>
            {VALVE_CATALOG.map((valve, idx) => (
              <button
                key={valve.type}
                onClick={() => setSelectedValveIndex(idx)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                  selectedValveIndex === idx
                    ? 'bg-amber-500/10 border-amber-500/40 text-ink shadow-xs'
                    : 'bg-surface border-line text-ink-soft hover:bg-surface-2 hover:text-ink'
                }`}
              >
                <div>
                  <span className="font-extrabold text-sm block text-ink">{valve.typeName}</span>
                  <span className="text-xs text-ink-soft">{valve.normStandard.split('/')[0]}</span>
                </div>
                <ChevronRight size={18} className={selectedValveIndex === idx ? 'text-amber-500' : 'opacity-40'} />
              </button>
            ))}
          </div>

          {/* Selected Valve Specs Panel */}
          <div className="lg:col-span-8 p-6 rounded-2xl bg-surface border border-line space-y-5">
            {(() => {
              const valve = VALVE_CATALOG[selectedValveIndex];
              return (
                <>
                  <div className="border-b border-line pb-4 flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-black text-ink font-display">{valve.typeName}</h2>
                      <p className="text-xs text-amber-600 dark:text-amber-400 font-bold mt-1">Normas: {valve.normStandard}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">
                      API / ASME Certified
                    </span>
                  </div>

                  {/* SVG Technical Cross Section Diagram for Valve */}
                  <ValveVisualizer valve={valve} />

                  <p className="text-sm text-ink-soft leading-relaxed">{valve.description}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 rounded-xl bg-surface-2 border border-line space-y-2">
                      <h4 className="font-bold text-ink uppercase">Clases de Presión Disponibles</h4>
                      <div className="flex flex-wrap gap-1">
                        {valve.classes.map(c => (
                          <span key={c} className="px-2 py-0.5 rounded bg-surface border border-line font-mono font-bold text-ink">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-surface-2 border border-line space-y-2">
                      <h4 className="font-bold text-ink uppercase">Extremos de Conexión</h4>
                      <ul className="list-disc pl-4 space-y-1 text-ink-soft">
                        {valve.endConnections.map((ec, i) => (
                          <li key={i}>{ec}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Trims */}
                  <div className="p-4 rounded-xl bg-surface-2 border border-line space-y-2">
                    <h4 className="text-xs font-bold text-ink uppercase">Interiores / Trims de Válvula (API 600)</h4>
                    <div className="flex flex-wrap gap-2 text-xs font-mono">
                      {valve.trimTypes.map((t, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-lg bg-surface border border-line text-ink font-bold">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* ASME B16.10 Face-to-Face Table if applicable */}
                  {valve.type === 'gate' && (
                    <div className="p-4 rounded-xl bg-surface-2 border border-line space-y-3">
                      <h4 className="text-xs font-bold text-ink uppercase">
                        Dimensiones Cara a Cara (Face-to-Face) ASME B16.10 (mm)
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left border-collapse">
                          <thead>
                            <tr className="border-b border-line text-ink-soft">
                              <th className="py-2 px-2">Clase / NPS</th>
                              <th className="py-2 px-2">2"</th>
                              <th className="py-2 px-2">3"</th>
                              <th className="py-2 px-2">4"</th>
                              <th className="py-2 px-2">6"</th>
                              <th className="py-2 px-2">8"</th>
                              <th className="py-2 px-2">10"</th>
                              <th className="py-2 px-2">12"</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-line font-mono">
                            {Object.entries(VALVE_FACE_TO_FACE_ASME_B1610).map(([rating, sizes]) => (
                              <tr key={rating}>
                                <td className="py-2 px-2 font-bold text-amber-500">{rating}</td>
                                <td className="py-2 px-2">{sizes['2"']} mm</td>
                                <td className="py-2 px-2">{sizes['3"']} mm</td>
                                <td className="py-2 px-2">{sizes['4"']} mm</td>
                                <td className="py-2 px-2">{sizes['6"']} mm</td>
                                <td className="py-2 px-2">{sizes['8"']} mm</td>
                                <td className="py-2 px-2">{sizes['10"']} mm</td>
                                <td className="py-2 px-2">{sizes['12"']} mm</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 3: EMPACADURAS B16.20 / B16.21 */}
      {/* ========================================================================= */}
      {subTab === 'gaskets' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {GASKET_CATALOG.map((gasket) => (
              <div key={gasket.typeId} className="p-5 rounded-2xl bg-surface border border-line space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 border-b border-line pb-2 mb-3">
                    <h3 className="text-sm font-black text-ink font-display">{gasket.name}</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/30 whitespace-nowrap">
                      {gasket.normStandard}
                    </span>
                  </div>

                  {/* SVG Technical Construction Diagram for Gasket */}
                  <GasketVisualizer gasket={gasket} />

                  <p className="text-xs text-ink-soft leading-relaxed pt-2">{gasket.description}</p>
                </div>

                <div className="space-y-3 pt-3 border-t border-line">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-surface-2 border border-line">
                      <span className="text-[10px] text-ink-soft block font-bold uppercase">Rango Temp.</span>
                      <span className="font-mono font-bold text-ink">{gasket.tempRangeMinC}°C a {gasket.tempRangeMaxC}°C</span>
                    </div>

                    <div className="p-2 rounded-lg bg-surface-2 border border-line">
                      <span className="text-[10px] text-ink-soft block font-bold uppercase">Presión Máx.</span>
                      <span className="font-mono font-bold text-ink">{gasket.maxPressureBar} bar</span>
                    </div>
                  </div>

                  <div className="text-xs">
                    <span className="text-[10px] text-ink-soft font-bold uppercase block mb-1">Compatibilidad de Bridas</span>
                    <div className="flex flex-wrap gap-1">
                      {gasket.flangeCompatibility.map((fc, i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded bg-surface-2 text-[10px] text-ink font-medium">
                          {fc}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 4: CÉDULAS DE TUBERÍA ASME B36.10 / B36.19 */}
      {/* ========================================================================= */}
      {subTab === 'pipe_schedules' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-surface border border-line flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-ink font-display">
                Tabla de Cédulas y Espesores de Tubería
              </h3>
              <p className="text-xs text-ink-soft">ASME B36.10M (Acero al Carbono) & ASME B36.19M (Inoxidable)</p>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-ink-soft uppercase">Seleccionar NPS:</label>
              <select
                value={selectedPipeNps}
                onChange={(e) => setSelectedPipeNps(e.target.value)}
                className="bg-surface-2 border border-line rounded-xl px-3 py-1.5 text-sm font-bold text-ink focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {Object.keys(PIPE_SCHEDULE_CATALOG).map(nps => (
                  <option key={nps} value={nps}>NPS {nps}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Pipe Schedule Table */}
          <div className="p-5 rounded-2xl bg-surface border border-line space-y-4">
            <h4 className="text-sm font-bold text-ink uppercase flex items-center gap-2">
              <span>Especificaciones para NPS {selectedPipeNps}</span>
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-line text-ink-soft bg-surface-2">
                    <th className="py-3 px-3">Cédula (Schedule)</th>
                    <th className="py-3 px-3">OD Real (mm)</th>
                    <th className="py-3 px-3">Espesor Pared (mm)</th>
                    <th className="py-3 px-3">Diámetro Interior ID (mm)</th>
                    <th className="py-3 px-3">Peso Lineal (kg/m)</th>
                    <th className="py-3 px-3">Capacidad Volumétrica (L/m)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line font-mono">
                  {Object.entries(PIPE_SCHEDULE_CATALOG[selectedPipeNps] || {}).map(([schedKey, spec]) => (
                    <tr key={schedKey} className="hover:bg-surface-2/50 transition-colors">
                      <td className="py-3 px-3 font-bold text-amber-500">{spec.schedule}</td>
                      <td className="py-3 px-3 font-black text-ink">{spec.odMm} mm</td>
                      <td className="py-3 px-3 font-black text-emerald-600 dark:text-emerald-400">{spec.wallMm} mm</td>
                      <td className="py-3 px-3 text-ink">{spec.idMm} mm</td>
                      <td className="py-3 px-3 text-ink">{spec.weightKgM} kg/m</td>
                      <td className="py-3 px-3 text-ink">{spec.volumeLitersM} L/m</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
