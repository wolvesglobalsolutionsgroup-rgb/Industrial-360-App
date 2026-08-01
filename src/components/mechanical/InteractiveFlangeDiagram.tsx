import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight, CheckCircle, Disc, Wrench, ShieldAlert } from 'lucide-react';
import { FlangeSpec } from '../../lib/norms/asme/asmeB165';
import { generateStarSequence, PCC1_PASSES } from '../../lib/data/mechanical/tightening';

interface Props {
  flangeSpec: FlangeSpec;
  rating: string;
  activePassIndex: number;
}

export const InteractiveFlangeDiagram: React.FC<Props> = ({
  flangeSpec,
  rating,
  activePassIndex
}) => {
  const holesCount = flangeSpec.holesCount;
  const starSequence = generateStarSequence(holesCount);
  const activePass = PCC1_PASSES[activePassIndex];

  // Interactive sequence state
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // Reset sequence when flange size or pass changes
  useEffect(() => {
    setCurrentStepIndex(0);
    setIsPlaying(false);
    setCompletedSteps(new Set());
  }, [flangeSpec.nps, rating, activePassIndex]);

  // Animation timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentStepIndex((prev) => {
          const next = prev + 1;
          if (next >= starSequence.length) {
            setIsPlaying(false);
            return prev;
          }
          setCompletedSteps((old) => new Set(old).add(starSequence[prev]));
          return next;
        });
      }, 1200);
    }
    return () => clearInterval(timer);
  }, [isPlaying, starSequence]);

  const activeBoltNumber = starSequence[currentStepIndex] || starSequence[0];
  const targetTorqueFtLb = Math.round(flangeSpec.torqueFtLb * (activePass.percent / 100));
  const targetTorqueNm = Math.round(flangeSpec.torqueNm * (activePass.percent / 100));

  const handleNextStep = () => {
    if (currentStepIndex < starSequence.length - 1) {
      setCompletedSteps((prev) => new Set(prev).add(activeBoltNumber));
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStepIndex(0);
    setCompletedSteps(new Set());
  };

  // Helper to calculate bolt coordinates
  const getBoltCoords = (boltIndex: number) => {
    const angleRad = (boltIndex * (360 / holesCount) - 90) * (Math.PI / 180);
    const cx = 200 + 130 * Math.cos(angleRad);
    const cy = 200 + 130 * Math.sin(angleRad);
    return { cx, cy };
  };

  return (
    <div className="space-y-4">
      {/* Interactive Controls Bar */}
      <div className="p-3.5 rounded-2xl bg-surface-2 border border-line flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
              isPlaying
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-amber-500/20 text-amber-500 hover:bg-amber-500/30'
            }`}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            <span>{isPlaying ? 'Pausar Animación' : 'Reproducir Secuencia'}</span>
          </button>

          <button
            onClick={handlePrevStep}
            disabled={currentStepIndex === 0}
            className="p-1.5 rounded-lg bg-surface border border-line text-ink hover:bg-surface-2 disabled:opacity-40"
            title="Paso Anterior"
          >
            <ChevronLeft size={16} />
          </button>

          <button
            onClick={handleNextStep}
            disabled={currentStepIndex >= starSequence.length - 1}
            className="p-1.5 rounded-lg bg-surface border border-line text-ink hover:bg-surface-2 disabled:opacity-40"
            title="Siguiente Paso"
          >
            <ChevronRight size={16} />
          </button>

          <button
            onClick={handleReset}
            className="p-1.5 rounded-lg bg-surface border border-line text-ink-soft hover:text-ink hover:bg-surface-2"
            title="Reiniciar Secuencia"
          >
            <RotateCcw size={16} />
          </button>
        </div>

        {/* Step Indicator Badge */}
        <div className="flex items-center gap-3 text-xs">
          <span className="font-mono font-bold text-ink">
            Paso <span className="text-amber-500 text-sm font-black">{currentStepIndex + 1}</span> de {holesCount}
          </span>
          <span className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-600 border border-amber-500/30 font-bold font-mono">
            Perno Actual: #{activeBoltNumber}
          </span>
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div className="relative w-full aspect-square max-w-[380px] mx-auto bg-slate-950 rounded-2xl p-4 flex items-center justify-center border border-slate-800 shadow-2xl overflow-hidden">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

        {/* SVG Flange Circle */}
        <svg viewBox="0 0 400 400" className="w-full h-full relative z-10">
          <defs>
            <radialGradient id="flangeGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0F172A" />
              <stop offset="100%" stopColor="#020617" />
            </radialGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Flange Outer Circle */}
          <circle cx="200" cy="200" r="185" fill="url(#flangeGrad)" stroke="#334155" strokeWidth="4" />
          
          {/* Bolt Circle Diameter (BCD) Line */}
          <circle cx="200" cy="200" r="130" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6" />

          {/* Sequence Vector Lines (Draw line connecting bolts in star sequence up to current step) */}
          {starSequence.map((boltNum, idx) => {
            if (idx > currentStepIndex) return null;
            const prevBolt = idx === 0 ? null : starSequence[idx - 1];
            if (!prevBolt) return null;

            const fromCoords = getBoltCoords(prevBolt - 1);
            const toCoords = getBoltCoords(boltNum - 1);

            return (
              <line
                key={`line-${idx}`}
                x1={fromCoords.cx}
                y1={fromCoords.cy}
                x2={toCoords.cx}
                y2={toCoords.cy}
                stroke="#f59e0b"
                strokeWidth="2.5"
                strokeDasharray="6 3"
                opacity={idx === currentStepIndex ? 1 : 0.4}
                filter={idx === currentStepIndex ? "url(#glow)" : undefined}
              />
            );
          })}

          {/* Inner Pipe Bore Circle */}
          <circle cx="200" cy="200" r="72" fill="#020617" stroke="#475569" strokeWidth="3" />
          
          {/* Pipe Spec Label */}
          <text x="200" y="190" textAnchor="middle" fill="#64748b" fontSize="11" fontWeight="bold" letterSpacing="1">
            NPS & CLASE
          </text>
          <text x="200" y="210" textAnchor="middle" fill="#f59e0b" fontSize="15" fontWeight="900" fontFamily="mono">
            {flangeSpec.nps} - {rating}
          </text>
          <text x="200" y="226" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="bold">
            {flangeSpec.holesCount} Pernos {flangeSpec.boltDiamInches}
          </text>

          {/* Render Bolt Holes */}
          {Array.from({ length: holesCount }).map((_, holeIdx) => {
            const boltNumber = holeIdx + 1;
            const { cx, cy } = getBoltCoords(holeIdx);

            const stepOrder = starSequence.indexOf(boltNumber) + 1;
            const isActive = boltNumber === activeBoltNumber;
            const isCompleted = completedSteps.has(boltNumber) || stepOrder <= currentStepIndex;

            return (
              <g
                key={holeIdx}
                onClick={() => {
                  const stepIdx = starSequence.indexOf(boltNumber);
                  if (stepIdx !== -1) {
                    setCurrentStepIndex(stepIdx);
                  }
                }}
                className="cursor-pointer group transition-all"
              >
                {/* Active Bolt Outer Glowing Ring */}
                {isActive && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r="24"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="3"
                    className="animate-ping opacity-75"
                  />
                )}

                {/* Bolt Hole Outer Ring */}
                <circle
                  cx={cx}
                  cy={cy}
                  r="19"
                  fill={isActive ? "#f59e0b" : isCompleted ? "#065f46" : "#1e293b"}
                  stroke={isActive ? "#fbbf24" : isCompleted ? "#10b981" : "#475569"}
                  strokeWidth={isActive ? "3" : "2"}
                  filter={isActive ? "url(#glow)" : undefined}
                />

                {/* Bolt Center Hole */}
                <circle cx={cx} cy={cy} r="14" fill="#020617" />

                {/* Bolt Number (Top) */}
                <text
                  x={cx}
                  y={cy - 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={isActive ? "#f59e0b" : isCompleted ? "#34d399" : "#ffffff"}
                  fontSize="11"
                  fontWeight="bold"
                >
                  #{boltNumber}
                </text>

                {/* Step Order Badge (Bottom) */}
                <text
                  x={cx}
                  y={cy + 8}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={isActive ? "#ffffff" : isCompleted ? "#10b981" : "#94a3b8"}
                  fontSize="9"
                  fontWeight="black"
                >
                  P{stepOrder}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected Bolt Info Card - Placed safely outside the SVG canvas box */}
      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-between text-xs font-mono shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Wrench size={18} />
          </div>
          <div>
            <span className="text-white font-bold block text-sm">Perno #{activeBoltNumber} <span className="text-amber-500 font-extrabold text-xs ml-1">(Paso {currentStepIndex + 1})</span></span>
            <span className="text-slate-400 text-[11px]">Copa / Dado Requerido: <span className="text-slate-200 font-bold">{flangeSpec.socketInches}</span> ({flangeSpec.socketMm} mm)</span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-amber-400 font-black block text-base">{targetTorqueFtLb} ft-lb</span>
          <span className="text-slate-300 text-[11px] font-bold">({targetTorqueNm} N·m — {activePass.percent}% Torque)</span>
        </div>
      </div>

      {/* Sequence Steps Grid */}
      <div className="p-4 rounded-xl bg-surface-2 border border-line space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-ink uppercase flex items-center gap-1.5">
            <Disc size={14} className="text-amber-500" />
            <span>Secuencia Numérica de Apriete (Haz clic en un perno)</span>
          </h4>
          <span className="text-amber-500 font-mono font-bold text-xs">{holesCount} Pernos</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-1.5 text-xs font-mono">
          {starSequence.map((boltNum, stepIdx) => {
            const isCurrent = stepIdx === currentStepIndex;
            const isDone = stepIdx < currentStepIndex || completedSteps.has(boltNum);

            return (
              <button
                key={stepIdx}
                onClick={() => setCurrentStepIndex(stepIdx)}
                className={`p-2 rounded-lg border text-left transition-all ${
                  isCurrent
                    ? 'bg-amber-500 text-slate-950 font-black border-amber-400 shadow-md ring-2 ring-amber-500/50 scale-105'
                    : isDone
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold'
                    : 'bg-surface border-line text-ink hover:border-amber-500/40'
                }`}
              >
                <div className="text-[10px] opacity-80 uppercase">Paso {stepIdx + 1}</div>
                <div className="text-xs font-extrabold flex items-center justify-between">
                  <span>Perno #{boltNum}</span>
                  {isDone && <CheckCircle size={12} className="text-emerald-500" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
