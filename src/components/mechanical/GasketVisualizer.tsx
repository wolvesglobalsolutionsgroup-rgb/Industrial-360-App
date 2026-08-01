import React from 'react';
import { GasketSpec } from '../../lib/data/mechanical/gaskets';

interface Props {
  gasket: GasketSpec;
}

export const GasketVisualizer: React.FC<Props> = ({ gasket }) => {
  const typeId = gasket.typeId.toLowerCase();

  const isSpiralWound = typeId.includes('spiral') || typeId.includes('cgi');
  const isRtj = typeId.includes('rtj') || typeId.includes('ring');
  const isGraphite = typeId.includes('graphite') || typeId.includes('tanged');
  const isPtfe = typeId.includes('ptfe') || typeId.includes('expanded');
  const isCompressed = typeId.includes('compressed') || typeId.includes('fiber') || typeId.includes('cnaf');
  const isKammprofile = typeId.includes('kammprofile') || typeId.includes('camprofile');

  return (
    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
      <div className="flex items-center justify-between text-[11px] font-mono border-b border-slate-800 pb-1.5">
        <span className="text-amber-400 font-bold uppercase flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          Esquema Técnico de Construcción
        </span>
        <span className="text-slate-400 font-bold">{gasket.normStandard}</span>
      </div>

      <div className="relative w-full aspect-[2.2/1] max-h-[150px] bg-slate-900 rounded-lg p-2 flex items-center justify-center border border-slate-800 overflow-hidden">
        <svg viewBox="0 0 320 160" className="w-full h-full">
          <defs>
            <pattern id="graphitePattern" width="8" height="8" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="8" y2="8" stroke="#334155" strokeWidth="1.5" />
              <line x1="8" y1="0" x2="0" y2="8" stroke="#334155" strokeWidth="1" />
            </pattern>
            <pattern id="meshPattern" width="10" height="10" patternUnits="userSpaceOnUse">
              <circle cx="5" cy="5" r="2" fill="#f59e0b" opacity="0.7" />
            </pattern>
          </defs>

          {/* SPIRAL WOUND CGI */}
          {isSpiralWound && (
            <g>
              {/* Outer Centering Ring (Carbon Steel) */}
              <circle cx="160" cy="80" r="70" fill="none" stroke="#64748b" strokeWidth="14" />
              {/* Sealing Element (Winding Strip V-shape + Graphite) */}
              <circle cx="160" cy="80" r="54" fill="none" stroke="#f59e0b" strokeWidth="18" strokeDasharray="3 2" />
              {/* Inner Retaining Ring (316SS) */}
              <circle cx="160" cy="80" r="38" fill="none" stroke="#cbd5e1" strokeWidth="10" />
              {/* Inner Bore */}
              <circle cx="160" cy="80" r="33" fill="#020617" />

              {/* Component Callouts */}
              <text x="160" y="83" textAnchor="middle" fill="#f59e0b" fontSize="9" fontWeight="bold">BORE</text>
              <text x="248" y="83" fill="#94a3b8" fontSize="8" fontWeight="bold">Anillo Ext.</text>
              <text x="218" y="42" fill="#f59e0b" fontSize="8" fontWeight="bold">Espiral V</text>
              <text x="100" y="125" fill="#cbd5e1" fontSize="8" fontWeight="bold">Anillo Int. 316</text>
            </g>
          )}

          {/* RTJ RING JOINT */}
          {isRtj && (
            <g>
              {/* Metal Ring Octagonal Cross Section */}
              <circle cx="160" cy="80" r="58" fill="none" stroke="#334155" strokeWidth="26" />
              <circle cx="160" cy="80" r="58" fill="none" stroke="#f59e0b" strokeWidth="22" />
              <circle cx="160" cy="80" r="58" fill="none" stroke="#e2e8f0" strokeWidth="16" />
              <circle cx="160" cy="80" r="44" fill="#020617" />

              {/* Machined Octagonal Bevel Lines */}
              <circle cx="160" cy="80" r="66" fill="none" stroke="#d97706" strokeWidth="1.5" />
              <circle cx="160" cy="80" r="50" fill="none" stroke="#d97706" strokeWidth="1.5" />

              <text x="160" y="83" textAnchor="middle" fill="#020617" fontSize="10" fontWeight="black">RTJ OCTAGONAL</text>
              <text x="235" y="80" fill="#f59e0b" fontSize="8" fontWeight="bold">Forjado Macizo</text>
            </g>
          )}

          {/* FLEXIBLE GRAPHITE WITH TANG MESH */}
          {isGraphite && (
            <g>
              {/* Graphite Ring Body */}
              <circle cx="160" cy="80" r="68" fill="url(#graphitePattern)" stroke="#475569" strokeWidth="2" />
              <circle cx="160" cy="80" r="68" fill="url(#meshPattern)" opacity="0.6" />
              <circle cx="160" cy="80" r="35" fill="#020617" />

              {/* Bolt Hole Pattern Sample */}
              <circle cx="105" cy="80" r="7" fill="#020617" stroke="#f59e0b" strokeWidth="2" />
              <circle cx="215" cy="80" r="7" fill="#020617" stroke="#f59e0b" strokeWidth="2" />

              <text x="160" y="83" textAnchor="middle" fill="#f59e0b" fontSize="9" fontWeight="extrabold">Grafito Pure + Malla 316</text>
            </g>
          )}

          {/* EXPANDED PTFE */}
          {isPtfe && (
            <g>
              <circle cx="160" cy="80" r="68" fill="#f8fafc" stroke="#38bdf8" strokeWidth="3" />
              <circle cx="160" cy="80" r="62" fill="none" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="3 3" />
              <circle cx="160" cy="80" r="35" fill="#020617" />

              {/* Bolt Holes */}
              <circle cx="105" cy="80" r="7" fill="#020617" stroke="#0284c7" strokeWidth="2" />
              <circle cx="215" cy="80" r="7" fill="#020617" stroke="#0284c7" strokeWidth="2" />

              <text x="160" y="83" textAnchor="middle" fill="#0284c7" fontSize="10" fontWeight="black">100% PTFE Fibrilado ePTFE</text>
            </g>
          )}

          {/* COMPRESSED FIBER CNAF */}
          {isCompressed && (
            <g>
              <circle cx="160" cy="80" r="68" fill="#15803d" stroke="#22c55e" strokeWidth="3" />
              <circle cx="160" cy="80" r="35" fill="#020617" />

              {/* Bolt Cutouts */}
              <circle cx="105" cy="80" r="7" fill="#020617" stroke="#86efac" strokeWidth="2" />
              <circle cx="215" cy="80" r="7" fill="#020617" stroke="#86efac" strokeWidth="2" />

              <text x="160" y="83" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="black">CNAF Sin Asbesto (NBR)</text>
            </g>
          )}

          {/* KAMMPROFILE */}
          {isKammprofile && (
            <g>
              {/* Grooved Serrated Core */}
              <circle cx="160" cy="80" r="68" fill="none" stroke="#f59e0b" strokeWidth="22" strokeDasharray="2 1" />
              <circle cx="160" cy="80" r="68" fill="none" stroke="#475569" strokeWidth="18" opacity="0.8" />
              <circle cx="160" cy="80" r="35" fill="#020617" />

              <text x="160" y="83" textAnchor="middle" fill="#fbbf24" fontSize="10" fontWeight="black">Kammprofile Dentada</text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};

