import React, { useState } from 'react';
import { 
  Network, Activity, Zap, Server, ShieldCheck, AlertTriangle, Radio, RefreshCw, Info, ArrowUpRight
} from 'lucide-react';

export interface NetworkNode {
  id: string;
  name: string;
  type: 'ESTACIÓN_BOMBEO' | 'PLANTA_COMPRESIÓN' | 'REFINERÍA' | 'PATIO_TANQUES' | 'POZO_CABECERA';
  status: 'Operativo' | 'Alerta' | 'Mantenimiento';
  capacityMmsfdOrBpd: string;
  pressurePsi: number;
  temperatureF: number;
  x: number;
  y: number;
}

export interface NetworkPipelineLink {
  id: string;
  from: string;
  to: string;
  diameterInch: number;
  lengthKm: number;
  flowRateBpd: number;
  status: 'Normal' | 'Restringido' | 'Detenido';
}

const INITIAL_NODES: NetworkNode[] = [
  { id: 'node-1', name: 'Planta San Tomé', type: 'PLANTA_COMPRESIÓN', status: 'Operativo', capacityMmsfdOrBpd: '450 MMSCFD', pressurePsi: 1120, temperatureF: 118, x: 120, y: 150 },
  { id: 'node-2', name: 'Patio Tanques Anaco (PTA)', type: 'PATIO_TANQUES', status: 'Operativo', capacityMmsfdOrBpd: '320,000 BPD', pressurePsi: 850, temperatureF: 102, x: 340, y: 100 },
  { id: 'node-3', name: 'Estación Balsa', type: 'ESTACIÓN_BOMBEO', status: 'Alerta', capacityMmsfdOrBpd: '180,000 BPD', pressurePsi: 640, temperatureF: 135, x: 380, y: 280 },
  { id: 'node-4', name: 'Refinería Puerto La Cruz', type: 'REFINERÍA', status: 'Operativo', capacityMmsfdOrBpd: '190,000 BPD', pressurePsi: 450, temperatureF: 98, x: 650, y: 120 },
  { id: 'node-5', name: 'Macolla Bare-12', type: 'POZO_CABECERA', status: 'Operativo', capacityMmsfdOrBpd: '45,000 BPD', pressurePsi: 1280, temperatureF: 142, x: 140, y: 320 },
];

const INITIAL_LINKS: NetworkPipelineLink[] = [
  { id: 'link-1', from: 'node-1', to: 'node-2', diameterInch: 26, lengthKm: 42.5, flowRateBpd: 210000, status: 'Normal' },
  { id: 'link-2', from: 'node-5', to: 'node-3', diameterInch: 16, lengthKm: 18.2, flowRateBpd: 42000, status: 'Normal' },
  { id: 'link-3', from: 'node-3', to: 'node-2', diameterInch: 20, lengthKm: 34.0, flowRateBpd: 115000, status: 'Restringido' },
  { id: 'link-4', from: 'node-2', to: 'node-4', diameterInch: 30, lengthKm: 88.6, flowRateBpd: 185000, status: 'Normal' },
];

export default function PortfolioNetwork() {
  const [nodes, setNodes] = useState<NetworkNode[]>(INITIAL_NODES);
  const [links] = useState<NetworkPipelineLink[]>(INITIAL_LINKS);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(INITIAL_NODES[0]);

  return (
    <div className="space-y-6">
      {/* Network Overview Bar */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-lg">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold uppercase tracking-wider mb-1">
            <Network size={16} /> Red Interconectada de Poliductos & Estaciones (PAMS)
          </div>
          <h2 className="text-xl font-extrabold tracking-tight">Grafo de Flujo y Capacidad de Transporte</h2>
        </div>
        <div className="flex gap-2">
          <span className="text-xs font-mono bg-cyan-500/20 text-cyan-300 px-3 py-1.5 rounded-full border border-cyan-500/30 flex items-center gap-1">
            <Radio size={14} className="animate-pulse" /> Telemetría SCADA en Vivo
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive SVG Network Graph */}
        <div className="lg:col-span-2 bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="w-full h-96 bg-slate-900/90 rounded-2xl border border-slate-800 relative flex items-center justify-center">
            <svg viewBox="0 0 800 450" className="w-full h-full">
              {/* Draw Pipeline Links */}
              {links.map(link => {
                const sourceNode = nodes.find(n => n.id === link.from);
                const targetNode = nodes.find(n => n.id === link.to);
                if (!sourceNode || !targetNode) return null;

                const isAlert = link.status === 'Restringido';

                return (
                  <g key={link.id}>
                    <line 
                      x1={sourceNode.x} 
                      y1={sourceNode.y} 
                      x2={targetNode.x} 
                      y2={targetNode.y} 
                      stroke={isAlert ? '#f59e0b' : '#06b6d4'} 
                      strokeWidth={Math.max(link.diameterInch / 6, 3)} 
                      strokeDasharray={isAlert ? '6,4' : 'none'}
                      opacity="0.8"
                    />
                    {/* Flow Label */}
                    <text 
                      x={(sourceNode.x + targetNode.x) / 2} 
                      y={(sourceNode.y + targetNode.y) / 2 - 8} 
                      fill="#94a3b8" 
                      fontSize="10" 
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {link.diameterInch}" • {link.lengthKm} km
                    </text>
                  </g>
                );
              })}

              {/* Draw Nodes */}
              {nodes.map(node => {
                const isSelected = selectedNode?.id === node.id;
                const nodeColor = node.status === 'Operativo' ? '#10b981' : '#f59e0b';

                return (
                  <g 
                    key={node.id} 
                    transform={`translate(${node.x}, ${node.y})`}
                    onClick={() => setSelectedNode(node)}
                    className="cursor-pointer group"
                  >
                    <circle 
                      r={isSelected ? "22" : "16"} 
                      fill="#0f172a" 
                      stroke={nodeColor} 
                      strokeWidth={isSelected ? "4" : "2"} 
                      className="transition-all duration-300"
                    />
                    <circle r="6" fill={nodeColor} />
                    <text 
                      y="32" 
                      fill="#f8fafc" 
                      fontSize="11" 
                      fontWeight="bold" 
                      textAnchor="middle"
                      className="drop-shadow-md font-sans"
                    >
                      {node.name}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Selected Node Technical Telemetry */}
        {selectedNode && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-mono font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider block">
                  {selectedNode.type}
                </span>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{selectedNode.name}</h3>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                selectedNode.status === 'Operativo'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
              }`}>
                {selectedNode.status}
              </span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl flex justify-between items-center">
                <span className="text-slate-500 font-bold">Capacidad Total</span>
                <span className="font-extrabold text-slate-900 dark:text-white">{selectedNode.capacityMmsfdOrBpd}</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl flex justify-between items-center">
                <span className="text-slate-500 font-bold">Presión Cabecera</span>
                <span className="font-extrabold text-cyan-600 dark:text-cyan-400">{selectedNode.pressurePsi} PSI</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl flex justify-between items-center">
                <span className="text-slate-500 font-bold">Temperatura Operación</span>
                <span className="font-extrabold text-slate-900 dark:text-white">{selectedNode.temperatureF} °F</span>
              </div>
            </div>

            <div className="p-4 bg-cyan-50 dark:bg-cyan-950/40 rounded-2xl border border-cyan-200 dark:border-cyan-900/50 text-xs text-cyan-900 dark:text-cyan-200">
              <div className="font-bold flex items-center gap-1.5 mb-1">
                <Activity size={16} /> Estado Telemetría SCADA
              </div>
              <p className="text-[11px]">Sincronizado con PLC local. Presión de succión estable dentro de banda operativa.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
