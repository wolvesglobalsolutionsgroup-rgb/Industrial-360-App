import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { offlineDb, PendingReport, PendingValuation, PendingRoute } from './dexieDb';

export interface SyncStats {
  isOnline: boolean;
  pendingReportsCount: number;
  pendingValuationsCount: number;
  pendingRoutesCount: number;
  totalPending: number;
  isSyncing: boolean;
}

type SyncStatusCallback = (stats: SyncStats) => void;
const subscribers: Set<SyncStatusCallback> = new Set();
let isSyncingActive = false;

export function isBrowserOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

export async function getSyncStats(): Promise<SyncStats> {
  const pendingReportsCount = await offlineDb.pendingReports.count();
  const pendingValuationsCount = await offlineDb.pendingValuations.count();
  const pendingRoutesCount = await offlineDb.pendingRoutes.count();
  const totalPending = pendingReportsCount + pendingValuationsCount + pendingRoutesCount;

  return {
    isOnline: isBrowserOnline(),
    pendingReportsCount,
    pendingValuationsCount,
    pendingRoutesCount,
    totalPending,
    isSyncing: isSyncingActive
  };
}

export function subscribeSyncStatus(callback: SyncStatusCallback): () => void {
  subscribers.add(callback);
  getSyncStats().then(callback);

  const handleStatusChange = () => {
    getSyncStats().then(stats => {
      subscribers.forEach(cb => cb(stats));
      if (navigator.onLine) {
        syncPendingRecords();
      }
    });
  };

  window.addEventListener('online', handleStatusChange);
  window.addEventListener('offline', handleStatusChange);

  return () => {
    subscribers.delete(callback);
    window.removeEventListener('online', handleStatusChange);
    window.removeEventListener('offline', handleStatusChange);
  };
}

async function notifySubscribers() {
  const stats = await getSyncStats();
  subscribers.forEach(cb => cb(stats));
}

export async function saveReportOffline(reportData: Omit<PendingReport, 'id' | 'tempId' | 'syncStatus'>): Promise<string> {
  const tempId = `off_rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  await offlineDb.pendingReports.add({
    ...reportData,
    tempId,
    syncStatus: 'pending'
  });
  await notifySubscribers();
  if (isBrowserOnline()) {
    syncPendingRecords();
  }
  return tempId;
}

export async function saveValuationOffline(valuationData: Omit<PendingValuation, 'id' | 'tempId' | 'syncStatus'>): Promise<string> {
  const tempId = `off_val_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  await offlineDb.pendingValuations.add({
    ...valuationData,
    tempId,
    syncStatus: 'pending'
  });
  await notifySubscribers();
  if (isBrowserOnline()) {
    syncPendingRecords();
  }
  return tempId;
}

export async function saveRouteOffline(routeData: Omit<PendingRoute, 'id' | 'tempId' | 'syncStatus'>): Promise<string> {
  const tempId = `off_route_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  await offlineDb.pendingRoutes.add({
    ...routeData,
    tempId,
    syncStatus: 'pending'
  });
  await notifySubscribers();
  if (isBrowserOnline()) {
    syncPendingRecords();
  }
  return tempId;
}

export async function syncPendingRecords(): Promise<{ successCount: number; failCount: number }> {
  if (!isBrowserOnline() || isSyncingActive) {
    return { successCount: 0, failCount: 0 };
  }

  isSyncingActive = true;
  await notifySubscribers();

  let successCount = 0;
  let failCount = 0;

  try {
    // 1. Sync Pending Field Reports
    const pendingReports = await offlineDb.pendingReports.toArray();
    for (const item of pendingReports) {
      try {
        await offlineDb.pendingReports.update(item.id!, { syncStatus: 'syncing' });
        const { id, tempId, syncStatus, errorMessage, ...cleanData } = item;
        
        const docRef = await addDoc(collection(db, 'field_reports'), {
          ...cleanData,
          offlineSynced: true,
          originalTempId: tempId,
          timestamp: serverTimestamp()
        });

        await offlineDb.syncLog.add({
          action: 'create',
          collectionName: 'field_reports',
          recordId: docRef.id,
          timestamp: new Date().toISOString(),
          status: 'success',
          details: `Reporte de campo offline ${tempId} sincronizado exitosamente`
        });

        await offlineDb.pendingReports.delete(item.id!);
        successCount++;
      } catch (err: any) {
        failCount++;
        await offlineDb.pendingReports.update(item.id!, {
          syncStatus: 'failed',
          errorMessage: err?.message || 'Error al enviar a Firestore'
        });
        await offlineDb.syncLog.add({
          action: 'create',
          collectionName: 'field_reports',
          recordId: item.tempId,
          timestamp: new Date().toISOString(),
          status: 'failed',
          details: err?.message || 'Fallo de red'
        });
      }
    }

    // 2. Sync Pending Valuations
    const pendingValuations = await offlineDb.pendingValuations.toArray();
    for (const item of pendingValuations) {
      try {
        await offlineDb.pendingValuations.update(item.id!, { syncStatus: 'syncing' });
        const { id, tempId, syncStatus, errorMessage, ...cleanData } = item;

        const docRef = await addDoc(collection(db, 'valuations'), {
          ...cleanData,
          offlineSynced: true,
          originalTempId: tempId,
          timestamp: serverTimestamp()
        });

        await offlineDb.syncLog.add({
          action: 'create',
          collectionName: 'valuations',
          recordId: docRef.id,
          timestamp: new Date().toISOString(),
          status: 'success',
          details: `Valuación ROE offline ${tempId} sincronizada`
        });

        await offlineDb.pendingValuations.delete(item.id!);
        successCount++;
      } catch (err: any) {
        failCount++;
        await offlineDb.pendingValuations.update(item.id!, {
          syncStatus: 'failed',
          errorMessage: err?.message || 'Error al enviar a Firestore'
        });
      }
    }

    // 3. Sync Pending Routes
    const pendingRoutes = await offlineDb.pendingRoutes.toArray();
    for (const item of pendingRoutes) {
      try {
        await offlineDb.pendingRoutes.update(item.id!, { syncStatus: 'syncing' });
        const { id, tempId, syncStatus, errorMessage, ...cleanData } = item;

        const docRef = await addDoc(collection(db, 'routes'), {
          ...cleanData,
          offlineSynced: true,
          originalTempId: tempId,
          timestamp: serverTimestamp()
        });

        await offlineDb.syncLog.add({
          action: 'create',
          collectionName: 'routes',
          recordId: docRef.id,
          timestamp: new Date().toISOString(),
          status: 'success',
          details: `Ruta offline ${tempId} sincronizada`
        });

        await offlineDb.pendingRoutes.delete(item.id!);
        successCount++;
      } catch (err: any) {
        failCount++;
        await offlineDb.pendingRoutes.update(item.id!, {
          syncStatus: 'failed',
          errorMessage: err?.message || 'Error al enviar a Firestore'
        });
      }
    }

  } finally {
    isSyncingActive = false;
    await notifySubscribers();
  }

  return { successCount, failCount };
}
