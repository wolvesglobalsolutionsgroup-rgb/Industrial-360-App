import { useState, useEffect, useCallback } from 'react';
import { 
  getPendingOfflineOperations, 
  flushOfflineQueue, 
  queueOfflineOperation, 
  PendingOfflineOperation 
} from './offlineSync';

// IndexedDB database name and version
const OFFLINE_CACHE_DB = 'IC360_PWA_CACHE_DB';
const DB_VERSION = 1;

export interface LocalOfflineDraft {
  id: string;
  category: 'ptw' | 'ast' | 'takeoff' | 'isometric' | 'hht_attendance';
  title: string;
  data: Record<string, any>;
  updatedAt: string;
}

// Open or initialize IndexedDB cache store for drafts
function openOfflineCacheDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(OFFLINE_CACHE_DB, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('local_drafts')) {
        const store = db.createObjectStore('local_drafts', { keyPath: 'id' });
        store.createIndex('category', 'category', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Save a local draft into IndexedDB
export async function saveLocalDraft(
  category: LocalOfflineDraft['category'],
  id: string,
  title: string,
  data: Record<string, any>
): Promise<void> {
  const db = await openOfflineCacheDB();
  const item: LocalOfflineDraft = {
    id,
    category,
    title,
    data,
    updatedAt: new Date().toISOString()
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction('local_drafts', 'readwrite');
    const store = tx.objectStore('local_drafts');
    const req = store.put(item);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// Get all local drafts for a category
export async function getLocalDrafts(category?: LocalOfflineDraft['category']): Promise<LocalOfflineDraft[]> {
  try {
    const db = await openOfflineCacheDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('local_drafts', 'readonly');
      const store = tx.objectStore('local_drafts');
      const req = store.getAll();
      req.onsuccess = () => {
        const results: LocalOfflineDraft[] = req.result || [];
        if (category) {
          resolve(results.filter(r => r.category === category));
        } else {
          resolve(results);
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to load local drafts from IndexedDB:', err);
    return [];
  }
}

// Delete local draft
export async function deleteLocalDraft(id: string): Promise<void> {
  const db = await openOfflineCacheDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('local_drafts', 'readwrite');
    const store = tx.objectStore('local_drafts');
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// Clear all local drafts from IndexedDB
export async function clearLocalDrafts(): Promise<void> {
  try {
    const db = await openOfflineCacheDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('local_drafts', 'readwrite');
      const store = tx.objectStore('local_drafts');
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to clear local drafts:', err);
  }
}

/**
 * Custom React Hook: useOfflineStatus
 * Monitors connection status, pending sync operations in IndexedDB,
 * and handles background auto-sync flush to Firestore upon reconnection.
 */
export function useOfflineStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [pendingOps, setPendingOps] = useState<PendingOfflineOperation[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncResult, setLastSyncResult] = useState<{ synced: number; failed: number } | null>(null);

  // Refresh pending count from IndexedDB queue
  const refreshPendingQueue = useCallback(async () => {
    const pending = await getPendingOfflineOperations();
    setPendingOps(pending);
  }, []);

  // Trigger manual or automatic queue sync
  const triggerSync = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;
    setIsSyncing(true);
    try {
      const res = await flushOfflineQueue();
      setLastSyncResult(res);
      await refreshPendingQueue();
      if (res.failed === 0) {
        await clearLocalDrafts();
      }
    } catch (err) {
      console.error('Error flushing offline sync queue:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, refreshPendingQueue]);

  useEffect(() => {
    refreshPendingQueue();

    const handleOnline = () => {
      setIsOnline(true);
      console.log('[IC360 PWA] Restablecida conexión de red. Sincronizando datos...');
      triggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('[IC360 PWA] Dispositivo en Modo Offline. Captura guardada en IndexedDB.');
    };

    const handleQueueChanged = () => {
      refreshPendingQueue();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('ic360-offline-queue-changed', handleQueueChanged);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('ic360-offline-queue-changed', handleQueueChanged);
    };
  }, [refreshPendingQueue, triggerSync]);

  return {
    isOnline,
    pendingCount: pendingOps.length,
    pendingOps,
    isSyncing,
    lastSyncResult,
    triggerSync,
    refreshPendingQueue
  };
}

export { queueOfflineOperation, flushOfflineQueue as syncOfflineStoreToFirestore };
