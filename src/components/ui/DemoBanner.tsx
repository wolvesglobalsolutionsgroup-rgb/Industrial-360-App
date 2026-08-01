import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useProject } from '../../ProjectContext';

export const DemoBanner: React.FC = () => {
  const { currentOrganization } = useProject();

  if (currentOrganization?.environment !== 'qa') {
    return null;
  }

  return (
    <div 
      className="bg-amber-500 text-slate-950 font-bold px-4 py-2 text-center text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm z-40 shrink-0 select-none"
      role="status"
    >
      <AlertTriangle size={16} className="text-slate-950 shrink-0" />
      <span>PREVIEW QA — Datos sintéticos — No usar para operación real</span>
    </div>
  );
};

export default DemoBanner;
