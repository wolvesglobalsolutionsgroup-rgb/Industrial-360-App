import { collection, addDoc, updateDoc, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useState, useEffect, useCallback } from 'react';
import { db } from '../../firebase';
import { offlineDb, PendingReport, PendingValuation, PendingRoute } from './dexieDb';
import { 
  queueOutboxOperation, 
  getPendingOutboxOperations, 
  removeOutboxItem, 
  cleanUndefinedValues,
  generateOperationId,
  clearLocalDrafts 
} from './outbox';
import { evaluateConflictPolicy, determineConflictStrategy } from './conflictPolicy';
import { logger } from '../logger';

export interface SyncStats {
  isOnline: boolean;
  pendingReportsCount: number;
  pendingValuationsCount: number;
  pendingRoutesCount: number;
  outboxPendingCount: number;
  totalPending: number;
  isSyncing: boolean;
  blockedCount: number;
}

type SyncStatusCallback = (stats: SyncStats) => void;
const subscribers: Set<SyncStatusCallback> = new Set();
let isSyncingActive = false;

export function isBrowserOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

export async function getSyncStats(): Promise<SyncStats> {
  const pendingReportsCount = await offlineDb.pendingReports.where('syncStatus').equals('pending').count();
  const pendingValuationsCount = await offlineDb.pendingValuations.where('syncStatus').equals('pending').count();
  const pendingRoutesCount = await offlineDb.pendingRoutes.where('syncStatus').equals('pending').count();
  const outboxPending = await offlineDb.outbox.where('syncStatus').equals('pending').count();
  const blockedCount = await offlineDb.outbox.where('syncStatus').equals('conflict_blocked').count();

  const totalPending = pendingReportsCount + pendingValuationsCount + pendingRoutesCount + outboxPending;

  return {
    isOnline: isBrowserOnline(),
    pendingReportsCount,
    pendingValuationsCount,
    pendingRoutesCount,
    outboxPendingCount: outboxPending,
    totalPending,
    isSyncing: isSyncingActive,
    blockedCount
  };
}

export function subscribeSyncStatus(callback: SyncStatusCallback): () => void {
  subscribers.add(callback);
  getSyncStats().then(callback);

  const handleStatusChange = () => {
    getSyncStats().then(stats => {
      subscribers.forEach(cb => cb(stats));
      if (isBrowserOnline()) {
        flushOutbox();
      }
    });
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);
    window.addEventListener('ic360-offline-queue-changed', handleStatusChange);
  }

  return () => {
    subscribers.delete(callback);
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
      window.removeEventListener('ic360-offline-queue-changed', handleStatusChange);
    }
  };
}

async function notifySubscribers() {
  const stats = await getSyncStats();
  subscribers.forEach(cb => cb(stats));
}

/**
 * Flush Outbox queue to Firestore with operationId Idempotency Check & Conflict Policies
 */
export async function flushOutbox(
  activeOrgId: string = '',
  activeProjectId: string = ''
): Promise<{ synced: number; failed: number; blocked: number; successCount: number; failCount: number }> {
  if (!isBrowserOnline() || isSyncingActive) {
    return { synced: 0, failed: 0, blocked: 0, successCount: 0, failCount: 0 };
  }

  isSyncingActive = true;
  await notifySubscribers();

  let syncedCount = 0;
  let failedCount = 0;
  let blockedCount = 0;

  try {
    const outboxItems = await getPendingOutboxOperations();

    for (const item of outboxItems) {
      if (!item.id) continue;

      try {
        await offlineDb.outbox.update(item.id, { syncStatus: 'syncing' });

        const targetOrgId = item.orgId || activeOrgId;
        const targetProjectId = item.projectId || activeProjectId;

        // 1. Check Idempotency Key in Firestore
        const idempotencyRef = doc(db, 'idempotency_keys', item.operationId);
        const idempotencySnap = await getDoc(idempotencyRef);

        if (idempotencySnap.exists()) {
          logger.info(`[Idempotency Engine] Operación ${item.operationId} ya procesada anteriormente. Omitiendo duplicado.`);
          await offlineDb.syncLog.add({
            operationId: item.operationId,
            action: item.operationType,
            collectionName: item.collectionName,
            recordId: item.docId || 'new_doc',
            timestamp: new Date().toISOString(),
            status: 'idempotent_duplicate',
            details: 'Operación idempotente ya registrada en el servidor.'
          });
          await removeOutboxItem(item.id);
          syncedCount++;
          continue;
        }

        // 2. Resolve Target Collection Path
        const targetCollectionPath = item.collectionName.startsWith('organizations/')
          ? item.collectionName
          : `organizations/${targetOrgId}/projects/${targetProjectId}/${item.collectionName}`;

        let remoteDocData: Record<string, any> | null = null;
        let targetDocRef = item.docId ? doc(db, targetCollectionPath, item.docId) : null;

        if (targetDocRef) {
          const docSnap = await getDoc(targetDocRef);
          if (docSnap.exists()) {
            remoteDocData = docSnap.data();
          }
        }

        // 3. Evaluate Conflict Policy
        const conflictResult = evaluateConflictPolicy(
          item.conflictStrategy,
          item.payload,
          remoteDocData,
          item.operationType
        );

        if (!conflictResult.canSync) {
          // BLOCKING conflict!
          logger.warn(`[SyncEngine] Conflict BLOQUEADO para operación ${item.operationId}: ${conflictResult.reason}`);
          await offlineDb.outbox.update(item.id, {
            syncStatus: 'conflict_blocked',
            errorMessage: conflictResult.reason,
            conflictDetails: conflictResult.reason
          });
          await offlineDb.syncLog.add({
            operationId: item.operationId,
            action: item.operationType,
            collectionName: item.collectionName,
            recordId: item.docId || 'blocked_doc',
            timestamp: new Date().toISOString(),
            status: 'conflict_blocked',
            details: conflictResult.reason
          });
          blockedCount++;
          continue;
        }

        // 4. Perform Firestore Write Operation
        const payloadToWrite = cleanUndefinedValues({
          ...(conflictResult.resolvedPayload || item.payload),
          _operationId: item.operationId,
          _syncedAt: serverTimestamp(),
          _isOfflineRecord: false
        });

        let createdDocId = item.docId;

        if (item.operationType === 'create') {
          if (item.docId) {
            await setDoc(doc(db, targetCollectionPath, item.docId), payloadToWrite, { merge: true });
          } else {
            const added = await addDoc(collection(db, targetCollectionPath), payloadToWrite);
            createdDocId = added.id;
          }
        } else if (item.operationType === 'update' && item.docId) {
          await updateDoc(doc(db, targetCollectionPath, item.docId), payloadToWrite);
        } else if (item.operationType === 'delete' && item.docId) {
          await updateDoc(doc(db, targetCollectionPath, item.docId), { _deleted: true, _deletedAt: serverTimestamp() });
        }

        // 5. Register Idempotency Key in Firestore
        await setDoc(idempotencyRef, {
          operationId: item.operationId,
          collectionName: item.collectionName,
          docId: createdDocId || null,
          orgId: targetOrgId,
          projectId: targetProjectId,
          processedAt: serverTimestamp(),
          clientCapturedAt: item.payload._offlineCapturedAt || new Date().toISOString()
        });

        // 6. Log Success and Clean Local Outbox
        await offlineDb.syncLog.add({
          operationId: item.operationId,
          action: item.operationType,
          collectionName: item.collectionName,
          recordId: createdDocId || 'processed_doc',
          timestamp: new Date().toISOString(),
          status: 'success',
          details: `Operación ${item.operationId} sincronizada exitosamente en ${item.collectionName}`
        });

        await removeOutboxItem(item.id);
        syncedCount++;
      } catch (err: any) {
        logger.error(`Error procesando outbox item ${item.operationId}:`, err);
        failedCount++;
        await offlineDb.outbox.update(item.id, {
          syncStatus: 'failed',
          errorMessage: err?.message || 'Error de comunicación con Firestore',
          retries: (item.retries || 0) + 1
        });
      }
    }

    // 7. Flush legacy typed tables (reports, valuations, routes)
    await syncLegacyDexieTables(activeOrgId, activeProjectId);

  } finally {
    isSyncingActive = false;
    await notifySubscribers();
  }

  return { synced: syncedCount, failed: failedCount, blocked: blockedCount, successCount: syncedCount, failCount: failedCount };
}

async function syncLegacyDexieTables(activeOrgId: string, activeProjectId: string) {
  // Sync pendingReports
  const reports = await offlineDb.pendingReports.where('syncStatus').equals('pending').toArray();
  for (const item of reports) {
    if (!item.id) continue;
    try {
      await offlineDb.pendingReports.update(item.id, { syncStatus: 'syncing' });
      const { id, tempId, syncStatus, errorMessage, operationId, ...cleanData } = item;
      const opId = operationId || generateOperationId();

      await queueOutboxOperation({
        collectionName: 'field_reports',
        operationType: 'create',
        payload: { ...cleanData, originalTempId: tempId },
        orgId: activeOrgId,
        projectId: item.projectId || activeProjectId,
        category: 'report'
      });

      await offlineDb.pendingReports.delete(item.id);
    } catch (err: any) {
      await offlineDb.pendingReports.update(item.id, { syncStatus: 'failed', errorMessage: err?.message });
    }
  }

  // Sync pendingValuations
  const vals = await offlineDb.pendingValuations.where('syncStatus').equals('pending').toArray();
  for (const item of vals) {
    if (!item.id) continue;
    try {
      await offlineDb.pendingValuations.update(item.id, { syncStatus: 'syncing' });
      const { id, tempId, syncStatus, errorMessage, operationId, ...cleanData } = item;

      await queueOutboxOperation({
        collectionName: 'valuations',
        operationType: 'create',
        payload: { ...cleanData, originalTempId: tempId },
        orgId: activeOrgId,
        projectId: item.projectId || activeProjectId,
        category: 'valuation',
        conflictStrategy: 'BLOCKING'
      });

      await offlineDb.pendingValuations.delete(item.id);
    } catch (err: any) {
      await offlineDb.pendingValuations.update(item.id, { syncStatus: 'failed', errorMessage: err?.message });
    }
  }

  // Sync pendingRoutes
  const routes = await offlineDb.pendingRoutes.where('syncStatus').equals('pending').toArray();
  for (const item of routes) {
    if (!item.id) continue;
    try {
      await offlineDb.pendingRoutes.update(item.id, { syncStatus: 'syncing' });
      const { id, tempId, syncStatus, errorMessage, operationId, ...cleanData } = item;

      await queueOutboxOperation({
        collectionName: 'routes',
        operationType: 'create',
        payload: { ...cleanData, originalTempId: tempId },
        orgId: activeOrgId,
        projectId: item.projectId || activeProjectId,
        category: 'route'
      });

      await offlineDb.pendingRoutes.delete(item.id);
    } catch (err: any) {
      await offlineDb.pendingRoutes.update(item.id, { syncStatus: 'failed', errorMessage: err?.message });
    }
  }
}

// Backward Compatibility API for queueing
export async function queueOfflineOperation(
  collectionName: string,
  operationType: 'create' | 'update' | 'delete',
  payload: Record<string, any>,
  docId?: string
) {
  const item = await queueOutboxOperation({
    collectionName,
    operationType,
    payload,
    docId,
    category: payload.category || undefined
  });

  if (isBrowserOnline()) {
    flushOutbox().catch(err => logger.error('Error auto-flushing outbox:', err));
  }

  return {
    id: item.operationId,
    collectionName: item.collectionName,
    operationType: item.operationType,
    docId: item.docId,
    payload: item.payload,
    timestamp: item.timestamp,
    retries: item.retries,
    status: item.syncStatus
  };
}

export async function getPendingOfflineOperations() {
  const outbox = await getPendingOutboxOperations();
  return outbox.map(item => ({
    id: item.operationId,
    collectionName: item.collectionName,
    operationType: item.operationType,
    docId: item.docId,
    payload: item.payload,
    timestamp: item.timestamp,
    retries: item.retries,
    status: item.syncStatus === 'conflict_blocked' ? 'failed' : item.syncStatus,
    errorMessage: item.errorMessage
  }));
}

export const flushOfflineQueue = flushOutbox;
export const syncOfflineStoreToFirestore = flushOutbox;
export const syncPendingRecords = flushOutbox;

export async function saveReportOffline(reportData: Omit<PendingReport, 'id' | 'tempId' | 'syncStatus' | 'operationId'>): Promise<string> {
  const tempId = `off_rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const opId = generateOperationId();

  await offlineDb.pendingReports.add({
    ...reportData,
    tempId,
    operationId: opId,
    syncStatus: 'pending'
  });

  await queueOutboxOperation({
    collectionName: 'field_reports',
    operationType: 'create',
    payload: { ...reportData, tempId },
    orgId: (reportData as any).orgId || '',
    projectId: reportData.projectId || '',
    category: 'report'
  });

  if (isBrowserOnline()) {
    flushOutbox().catch(err => logger.error('Error auto-flushing outbox on saveReportOffline:', err));
  }

  return tempId;
}

export async function saveValuationOffline(valuationData: Omit<PendingValuation, 'id' | 'tempId' | 'syncStatus' | 'operationId'>): Promise<string> {
  const tempId = `off_val_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const opId = generateOperationId();

  await offlineDb.pendingValuations.add({
    ...valuationData,
    tempId,
    operationId: opId,
    syncStatus: 'pending'
  });

  await queueOutboxOperation({
    collectionName: 'valuations',
    operationType: 'create',
    payload: { ...valuationData, tempId },
    orgId: (valuationData as any).orgId || '',
    projectId: valuationData.projectId || '',
    category: 'valuation',
    conflictStrategy: 'BLOCKING'
  });

  if (isBrowserOnline()) {
    flushOutbox().catch(err => logger.error('Error auto-flushing outbox on saveValuationOffline:', err));
  }

  return tempId;
}

export async function saveRouteOffline(routeData: Omit<PendingRoute, 'id' | 'tempId' | 'syncStatus' | 'operationId'>): Promise<string> {
  const tempId = `off_route_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const opId = generateOperationId();

  await offlineDb.pendingRoutes.add({
    ...routeData,
    tempId,
    operationId: opId,
    syncStatus: 'pending'
  });

  await queueOutboxOperation({
    collectionName: 'routes',
    operationType: 'create',
    payload: { ...routeData, tempId },
    orgId: (routeData as any).orgId || '',
    projectId: routeData.projectId || '',
    category: 'route'
  });

  if (isBrowserOnline()) {
    flushOutbox().catch(err => logger.error('Error auto-flushing outbox on saveRouteOffline:', err));
  }

  return tempId;
}

/**
 * Custom React Hook: useOfflineStatus
 * Provides reactive status of network, outbox queue count, blocked items, and manual flush trigger.
 */
export function useOfflineStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(isBrowserOnline());
  const [pendingOps, setPendingOps] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [blockedCount, setBlockedCount] = useState<number>(0);
  const [lastSyncResult, setLastSyncResult] = useState<{ synced: number; failed: number; blocked: number } | null>(null);

  const refreshPendingQueue = useCallback(async () => {
    const pending = await getPendingOfflineOperations();
    const stats = await getSyncStats();
    setPendingOps(pending);
    setBlockedCount(stats.blockedCount);
  }, []);

  const triggerSync = useCallback(async () => {
    if (!isBrowserOnline() || isSyncing) return;
    setIsSyncing(true);
    try {
      const res = await flushOutbox();
      setLastSyncResult(res);
      await refreshPendingQueue();
      if (res.failed === 0 && res.blocked === 0) {
        await clearLocalDrafts();
      }
    } catch (err) {
      logger.error('Error flushing offline outbox queue:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, refreshPendingQueue]);

  useEffect(() => {
    refreshPendingQueue();

    const handleOnline = () => {
      setIsOnline(true);
      triggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    const handleQueueChanged = () => {
      refreshPendingQueue();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      window.addEventListener('ic360-offline-queue-changed', handleQueueChanged);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        window.removeEventListener('ic360-offline-queue-changed', handleQueueChanged);
      }
    };
  }, [refreshPendingQueue, triggerSync]);

  return {
    isOnline,
    pendingCount: pendingOps.length,
    blockedCount,
    pendingOps,
    isSyncing,
    lastSyncResult,
    triggerSync,
    refreshPendingQueue
  };
}

/**
 * Setup global auto-sync listeners
 */
export function initOfflineAutoSync() {
  if (typeof window === 'undefined') return;

  window.addEventListener('online', () => {
    logger.info('[IC360 PWA] Reconexión detectada. Procesando cola outbox...');
    flushOutbox().catch(err => logger.error('Error flushing outbox on reconnect:', err));
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'IC360_TRIGGER_SYNC') {
        logger.info('[IC360 Service Worker] Mensaje de sincronización recibido.');
        flushOutbox().catch(err => logger.error('Error flushing outbox on SW message:', err));
      }
    });
  }
}
