import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export interface PendingOfflineOperation {
  id: string;
  collectionName: string;
  operationType: 'create' | 'update' | 'delete';
  docId?: string;
  payload: Record<string, any>;
  timestamp: number;
  retries: number;
  status: 'pending' | 'syncing' | 'failed';
  errorMessage?: string;
}

const DB_NAME = 'SEMAX_FIELD_OFFLINE_DB';
const DB_VERSION = 1;
const STORE_NAME = 'pending_field_operations';

// Open or initialize IndexedDB
function openOfflineDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Queue an offline operation (e.g. Field Report, PTW Permit, Inspection, Weld Log)
export async function queueOfflineOperation(
  collectionName: string,
  operationType: 'create' | 'update' | 'delete',
  payload: Record<string, any>,
  docId?: string
): Promise<PendingOfflineOperation> {
  const id = `off_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const item: PendingOfflineOperation = {
    id,
    collectionName,
    operationType,
    docId,
    payload: {
      ...payload,
      _offlineCapturedAt: new Date().toISOString(),
      _isOfflineRecord: true,
    },
    timestamp: Date.now(),
    retries: 0,
    status: 'pending',
  };

  const db = await openOfflineDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.add(item);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });

  // Trigger service worker background sync if registered
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    try {
      const reg = await navigator.serviceWorker.ready;
      // @ts-ignore
      await reg.sync.register('sync-field-reports');
    } catch (err) {
      console.warn('Background Sync registration skipped:', err);
    }
  }

  // Attempt immediate flush if currently online
  if (navigator.onLine) {
    flushOfflineQueue().catch(console.error);
  }

  // Dispatch custom event so components can refresh offline queue counts
  window.dispatchEvent(new CustomEvent('semax-offline-queue-changed'));

  return item;
}

// Fetch all pending operations in queue
export async function getPendingOfflineOperations(): Promise<PendingOfflineOperation[]> {
  try {
    const db = await openOfflineDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to read offline store:', err);
    return [];
  }
}

// Remove operation from queue
export async function removePendingOperation(id: string): Promise<void> {
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// Flush/Sync all pending offline operations to Firestore
export async function flushOfflineQueue(): Promise<{ synced: number; failed: number }> {
  const pending = await getPendingOfflineOperations();
  if (pending.length === 0) return { synced: 0, failed: 0 };

  let syncedCount = 0;
  let failedCount = 0;

  for (const item of pending) {
    try {
      if (item.operationType === 'create') {
        await addDoc(collection(db, item.collectionName), {
          ...item.payload,
          _syncedAt: serverTimestamp(),
          _isOfflineRecord: false,
        });
      } else if (item.operationType === 'update' && item.docId) {
        await updateDoc(doc(db, item.collectionName, item.docId), {
          ...item.payload,
          _syncedAt: serverTimestamp(),
          _isOfflineRecord: false,
        });
      }
      await removePendingOperation(item.id);
      syncedCount++;
    } catch (error) {
      console.error(`Error syncing offline item ${item.id}:`, error);
      failedCount++;
    }
  }

  window.dispatchEvent(new CustomEvent('semax-offline-queue-changed'));
  return { synced: syncedCount, failed: failedCount };
}

// Setup global auto-sync listeners
export function initOfflineAutoSync() {
  if (typeof window === 'undefined') return;

  // Auto-sync when coming back online
  window.addEventListener('online', () => {
    console.log('[SEMAX Offline Service] Network connection restored. Flushing queue...');
    flushOfflineQueue().catch(console.error);
  });

  // Listen for background sync trigger from Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'SEMAX_TRIGGER_SYNC') {
        console.log('[SEMAX Service Worker] Background sync message received.');
        flushOfflineQueue().catch(console.error);
      }
    });
  }
}
