import React from 'react';
import { DEMO_AUTH_ENABLED } from '../../config';
import { useAppAuthState } from '../../firebase';
import { AlertTriangle } from 'lucide-react';

export const DemoBanner: React.FC = () => {
  const [user] = useAppAuthState();

  if (!DEMO_AUTH_ENABLED || !user) {
    return null;
  }

  const isDemoUser =
    user.isAnonymous ||
    user.isLocal ||
    user.uid?.startsWith('demo') ||
    user.uid?.startsWith('local-') ||
    user.email === 'demo@industrial360.app';

  if (!isDemoUser) {
    return null;
  }

  return (
    <div className="bg-amber-500 text-slate-950 font-bold px-4 py-2 text-center text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm z-40 shrink-0 select-none">
      <AlertTriangle size={16} className="text-slate-950 shrink-0" />
      <span>MODO DEMOSTRACIÓN — los datos no son reales.</span>
    </div>
  );
};

export default DemoBanner;
