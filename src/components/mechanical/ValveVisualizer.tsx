import React from 'react';
import { ValveSpec } from '../../lib/data/mechanical/valves';

interface Props {
  valve: ValveSpec;
}

export const ValveVisualizer: React.FC<Props> = ({ valve }) => {
  const valveType = valve.type;

  return (
    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
      <div className="flex items-center justify-between text-xs font-mono border-b border-slate-800 pb-2">
        <span className="text-amber-400 font-bold uppercase flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          Diagrama Técnico en Corte Transversal (ASME B16.34 / API)
        </span>
        <span className="text-slate-400">{valve.typeName}</span>
      </div>

      <div className="relative w-full aspect-[16/9] max-h-[260px] bg-slate-900 rounded-xl p-3 flex items-center justify-center border border-slate-800 overflow-hidden">
        <svg viewBox="0 0 500 280" className="w-full h-full">
          <defs>
            <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            <linearGradient id="brassGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
            <linearGradient id="fluidGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {/* ================= GATE VALVE ================= */}
          {valveType === 'gate' && (
            <g>
              {/* Pipe Flow Path Background */}
              <rect x="40" y="110" width="420" height="60" fill="url(#fluidGrad)" rx="4" />
              <path d="M 50 140 L 90 140 M 80 130 L 90 140 L 80 150" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              <path d="M 410 140 L 450 140 M 440 130 L 450 140 L 440 150" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" fill="none" />

              {/* Flanges Left & Right */}
              <rect x="40" y="80" width="24" height="120" fill="#334155" stroke="#f59e0b" strokeWidth="2" rx="3" />
              <rect x="436" y="80" width="24" height="120" fill="#334155" stroke="#f59e0b" strokeWidth="2" rx="3" />

              {/* Valve Body */}
              <path d="M 64 100 L 200 100 L 200 60 L 300 60 L 300 100 L 436 100 L 436 180 L 300 180 L 300 230 L 200 230 L 200 180 L 64 180 Z" fill="url(#bodyGrad)" stroke="#475569" strokeWidth="3" />

              {/* Wedge Seats */}
              <polygon points="220,105 280,105 270,175 230,175" fill="#f59e0b" opacity="0.9" stroke="#fbbf24" strokeWidth="2" />
              <line x1="250" y1="105" x2="250" y2="25" stroke="#e2e8f0" strokeWidth="6" />

              {/* Handwheel */}
              <ellipse cx="250" cy="20" rx="50" ry="12" fill="#ef4444" stroke="#dc2626" strokeWidth="3" />
              <circle cx="250" cy="20" r="8" fill="#1e293b" />

              {/* Labels */}
              <text x="250" y="260" textAnchor="middle" fill="#94a3b8" fontSize="12" fontWeight="bold">Compuerta Flexible Taper Wedge (API 600)</text>
              <text x="80" y="70" fill="#f59e0b" fontSize="10" fontWeight="bold">Brida RF / RTJ</text>
              <text x="350" y="70" fill="#f59e0b" fontSize="10" fontWeight="bold">Brida RF / RTJ</text>
            </g>
          )}

          {/* ================= GLOBE VALVE ================= */}
          {valveType === 'globe' && (
            <g>
              {/* Fluid Flow S-Curve Path */}
              <path d="M 40 140 L 190 140 Q 220 140 220 170 Q 220 190 250 190 Q 280 190 280 140 L 460 140" fill="none" stroke="url(#fluidGrad)" strokeWidth="40" />

              {/* Flanges */}
              <rect x="40" y="80" width="24" height="120" fill="#334155" stroke="#f59e0b" strokeWidth="2" rx="3" />
              <rect x="436" y="80" width="24" height="120" fill="#334155" stroke="#f59e0b" strokeWidth="2" rx="3" />

              {/* Globe Outer Body */}
              <path d="M 64 100 L 180 100 L 180 60 L 320 60 L 320 100 L 436 100 Q 460 140 436 180 L 320 180 Q 250 230 180 180 L 64 180 Z" fill="url(#bodyGrad)" stroke="#475569" strokeWidth="3" />

              {/* Disc Plug & Seat */}
              <rect x="210" y="140" width="80" height="20" fill="#f59e0b" rx="4" stroke="#fbbf24" strokeWidth="2" />
              <line x1="250" y1="140" x2="250" y2="25" stroke="#e2e8f0" strokeWidth="6" />

              {/* Handwheel */}
              <ellipse cx="250" cy="20" rx="50" ry="12" fill="#ef4444" stroke="#dc2626" strokeWidth="3" />

              {/* Flow direction arrow */}
              <path d="M 120 140 L 160 140 M 150 132 L 160 140 L 150 148" stroke="#ffffff" strokeWidth="3" fill="none" />

              {/* Label */}
              <text x="250" y="260" textAnchor="middle" fill="#94a3b8" fontSize="12" fontWeight="bold">Asiento Regulador en Z (API 623 / BS 1873)</text>
            </g>
          )}

          {/* ================= CHECK VALVE ================= */}
          {valveType === 'check' && (
            <g>
              {/* Fluid Path */}
              <rect x="40" y="100" width="420" height="80" fill="url(#fluidGrad)" rx="4" />

              {/* Flanges */}
              <rect x="40" y="70" width="24" height="140" fill="#334155" stroke="#f59e0b" strokeWidth="2" rx="3" />
              <rect x="436" y="70" width="24" height="140" fill="#334155" stroke="#f59e0b" strokeWidth="2" rx="3" />

              {/* Body */}
              <rect x="64" y="85" width="372" height="110" fill="url(#bodyGrad)" stroke="#475569" strokeWidth="3" rx="8" />

              {/* Hinge Pin & Swing Clapper Disc */}
              <circle cx="210" cy="100" r="8" fill="#f59e0b" />
              <path d="M 210 100 L 260 150" stroke="#f59e0b" strokeWidth="8" strokeLinecap="round" />
              <ellipse cx="270" cy="155" rx="12" ry="30" fill="#fbbf24" stroke="#d97706" strokeWidth="2" transform="rotate(-25 270 155)" />

              {/* Seat Ring */}
              <rect x="195" y="100" width="12" height="80" fill="#334155" stroke="#f59e0b" strokeWidth="1.5" />

              {/* Flow Arrow */}
              <path d="M 100 140 L 170 140 M 160 130 L 170 140 L 160 150" stroke="#ffffff" strokeWidth="3" fill="none" />

              <text x="250" y="260" textAnchor="middle" fill="#94a3b8" fontSize="12" fontWeight="bold">Disco Basculante (Swing Check API 594 / API 6D)</text>
            </g>
          )}

          {/* ================= BALL VALVE ================= */}
          {valveType === 'ball' && (
            <g>
              {/* Fluid Bore Path */}
              <rect x="40" y="110" width="420" height="60" fill="url(#fluidGrad)" rx="4" />

              {/* Body */}
              <rect x="64" y="80" width="372" height="120" fill="url(#bodyGrad)" stroke="#475569" strokeWidth="3" rx="12" />

              {/* Ball Spherical Core */}
              <circle cx="250" cy="140" r="55" fill="#f59e0b" stroke="#fbbf24" strokeWidth="3" />
              {/* Ball Internal Through Hole */}
              <rect x="195" y="110" width="110" height="60" fill="#0284c7" opacity="0.9" rx="2" />

              {/* Seats (PEEK / PTFE) */}
              <rect x="175" y="100" width="18" height="80" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2" rx="2" />
              <rect x="307" y="100" width="18" height="80" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2" rx="2" />

              {/* Stem & Lever */}
              <rect x="244" y="35" width="12" height="50" fill="#cbd5e1" />
              <rect x="230" y="25" width="120" height="15" fill="#ef4444" rx="4" />

              <text x="250" y="260" textAnchor="middle" fill="#94a3b8" fontSize="12" fontWeight="bold">Esfera Trunnion / Flotante Paso Completo (API 6D)</text>
            </g>
          )}

          {/* ================= BUTTERFLY VALVE ================= */}
          {valveType === 'butterfly' && (
            <g>
              {/* Fluid Path */}
              <rect x="40" y="100" width="420" height="80" fill="url(#fluidGrad)" rx="4" />

              {/* Wafer Body */}
              <rect x="200" y="60" width="100" height="160" fill="url(#bodyGrad)" stroke="#475569" strokeWidth="3" rx="10" />

              {/* Rubber Seat Liner */}
              <rect x="215" y="70" width="70" height="140" fill="#1e293b" stroke="#f59e0b" strokeWidth="2" rx="4" />

              {/* Central Shaft */}
              <line x1="250" y1="20" x2="250" y2="230" stroke="#e2e8f0" strokeWidth="8" />

              {/* Disc (Open Profile) */}
              <ellipse cx="250" cy="140" rx="8" ry="60" fill="#f59e0b" stroke="#fbbf24" strokeWidth="2" />

              {/* Lever Handle */}
              <rect x="240" y="15" width="110" height="12" fill="#ef4444" rx="3" />

              <text x="250" y="260" textAnchor="middle" fill="#94a3b8" fontSize="12" fontWeight="bold">Disco Mariposa Tipo Wafer / Lug (API 609)</text>
            </g>
          )}

          {/* ================= PLUG VALVE ================= */}
          {valveType === 'plug' && (
            <g>
              <rect x="40" y="110" width="420" height="60" fill="url(#fluidGrad)" rx="4" />

              <rect x="64" y="80" width="372" height="120" fill="url(#bodyGrad)" stroke="#475569" strokeWidth="3" rx="12" />

              {/* Tapered Plug */}
              <polygon points="210,90 290,90 275,190 225,190" fill="#f59e0b" stroke="#fbbf24" strokeWidth="3" />
              <rect x="225" y="110" width="50" height="60" fill="#0284c7" opacity="0.9" />

              {/* Lubricant Injector Fitting */}
              <rect x="245" y="45" width="10" height="45" fill="#e2e8f0" />
              <circle cx="250" cy="40" r="8" fill="#10b981" />

              <text x="250" y="260" textAnchor="middle" fill="#94a3b8" fontSize="12" fontWeight="bold">Macho Cónico Lubricado (API 6D / ASME B16.34)</text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};
