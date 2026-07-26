import Dexie, { Table } from 'dexie';

export interface PendingReport {
  id?: number;
  tempId: string;
  projectId: string;
  date: string;
  weather: string;
  personnelCount: number;
  workHours: number;
  notes: string;
  slumpTest?: number | null;
  temperature?: number | null;
  equipmentSerial?: string;
  location?: { lat: number; lng: number; accuracy?: number } | null;
  imagePreview?: string | null;
  aiAnalysis?: string;
  correlatedTaskId?: string;
  correlatedTaskName?: string;
  inspectorName?: string;
  createdAt: string;
  syncStatus: 'pending' | 'syncing' | 'failed';
  errorMessage?: string;
}

export interface PendingValuation {
  id?: number;
  tempId: string;
  projectId: string;
  number: number;
  periodStart: string;
  periodEnd: string;
  description: string;
  grossAmount: number;
  retentionFCPercent: number;
  retentionLaboralPercent: number;
  advancePercent: number;
  otherDeductions: number;
  netAmount: number;
  status: string;
  photos: string[];
  ownerId: string;
  createdAt: string;
  syncStatus: 'pending' | 'syncing' | 'failed';
  errorMessage?: string;
}

export interface PendingRoute {
  id?: number;
  tempId: string;
  projectId?: string;
  name: string;
  distanceKm: number;
  path: { lat: number; lng: number; timestamp?: number; altitude?: number }[];
  startTime: number;
  endTime: number;
  createdAt: string;
  syncStatus: 'pending' | 'syncing' | 'failed';
  errorMessage?: string;
}

export interface SyncLogItem {
  id?: number;
  action: 'create' | 'update' | 'delete';
  collectionName: string;
  recordId: string;
  timestamp: string;
  status: 'success' | 'failed';
  details?: string;
}

export class IndustrialControl360DB extends Dexie {
  pendingReports!: Table<PendingReport>;
  pendingValuations!: Table<PendingValuation>;
  pendingRoutes!: Table<PendingRoute>;
  syncLog!: Table<SyncLogItem>;

  constructor() {
    super('IndustrialControl360_OfflineDB');
    this.version(1).stores({
      pendingReports: '++id, tempId, projectId, date, syncStatus, createdAt',
      pendingValuations: '++id, tempId, projectId, number, syncStatus, createdAt',
      pendingRoutes: '++id, tempId, projectId, syncStatus, createdAt',
      syncLog: '++id, collectionName, recordId, timestamp, status'
    });
  }
}

export const offlineDb = new IndustrialControl360DB();
