import React from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, AlertTriangle, Database } from 'lucide-react';
import { useOfflineStatus } from '../../lib/offlineStore';

export const OfflineBanner: React.FC = () => {
  const { isOnline, pendingCount, isSyncing, lastSyncResult, triggerSync } = useOfflineStatus();

  if (isOnline && pendingCount === 0 && !lastSyncResult) {
    return null; // Clean state, render nothing
  }

  return (
    <div className={`w-full px-4 py-2 text-xs font-semibold flex items-center justify-between transition-all ${
      !isOnline
        ? 'bg-amber-500/15 border-b border-amber-500/30 text-amber-700 dark:text-amber-300'
        : pendingCount > 0
        ? 'bg-sky-500/15 border-b border-sky-500/30 text-sky-700 dark:text-sky-300'
        : 'bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
    }`}>
      
      <div className="flex items-center gap-2">
        {!isOnline ? (
          <>
            <WifiOff size={16} className="text-amber-500 animate-pulse shrink-0" />
            <span>
              <strong>Modo Offline Activo:</strong> Sin señal en sitio. Los reportes, PTW, Isométricos y HHT se guardan localmente en IndexedDB.
            </span>
          </>
        ) : pendingCount > 0 ? (
          <>
            <Database size={16} className="text-sky-500 shrink-0" />
            <span>
              Conexión restablecida. Tiene <strong>{pendingCount} registros pendientes</strong> por sincronizar con Firestore.
            </span>
          </>
        ) : (
          <>
            <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
            <span>
              Sincronización completada ({lastSyncResult?.synced} registros actualizados en la nube).
            </span>
          </>
        )}
      </div>

      {isOnline && pendingCount > 0 && (
        <button
          onClick={triggerSync}
          disabled={isSyncing}
          className="flex items-center gap-1.5 px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer transition-all disabled:opacity-50 shrink-0"
        >
          <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
          {isSyncing ? 'Sincronizando...' : 'Sincronizar Ahora'}
        </button>
      )}

    </div>
  );
};

export default OfflineBanner;
