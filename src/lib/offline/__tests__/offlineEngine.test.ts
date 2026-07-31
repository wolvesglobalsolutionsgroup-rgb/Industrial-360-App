import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { offlineDb } from '../dexieDb';
import { queueOutboxOperation, getPendingOutboxOperations, generateOperationId } from '../outbox';
import { evaluateConflictPolicy, determineConflictStrategy } from '../conflictPolicy';

describe('Offline Queue & Idempotency System', () => {
  beforeEach(async () => {
    await offlineDb.outbox.clear();
    await offlineDb.syncLog.clear();
    await offlineDb.pendingReports.clear();
  });

  it('generates valid RFC4122 UUID v4 for operationId', () => {
    const opId1 = generateOperationId();
    const opId2 = generateOperationId();

    expect(opId1).toBeDefined();
    expect(opId2).toBeDefined();
    expect(opId1).not.toEqual(opId2);
    // UUID v4 format regex
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(opId1).toMatch(uuidV4Regex);
  });

  it('enqueues 3 offline reports resulting in exactly 3 outbox documents with unique operationIds', async () => {
    const r1 = await queueOutboxOperation({
      collectionName: 'field_reports',
      operationType: 'create',
      payload: { title: 'Reporte 1 - Inspección Macolla A' },
      orgId: 'org_demo_test',
      projectId: 'PROJ-001',
      category: 'report'
    });

    const r2 = await queueOutboxOperation({
      collectionName: 'field_reports',
      operationType: 'create',
      payload: { title: 'Reporte 2 - Inspección Macolla B' },
      orgId: 'org_demo_test',
      projectId: 'PROJ-001',
      category: 'report'
    });

    const r3 = await queueOutboxOperation({
      collectionName: 'field_reports',
      operationType: 'create',
      payload: { title: 'Reporte 3 - Inspección Macolla C' },
      orgId: 'org_demo_test',
      projectId: 'PROJ-001',
      category: 'report'
    });

    const pending = await getPendingOutboxOperations();

    expect(pending.length).toBe(3);
    expect(pending[0].operationId).toBe(r1.operationId);
    expect(pending[1].operationId).toBe(r2.operationId);
    expect(pending[2].operationId).toBe(r3.operationId);

    // Verify all 3 operationIds are unique
    const uniqueOpIds = new Set(pending.map(p => p.operationId));
    expect(uniqueOpIds.size).toBe(3);
  });

  it('correctly assigns conflict strategy based on collection or category', () => {
    expect(determineConflictStrategy('evidence_photos', 'evidence')).toBe('APPEND_ONLY');
    expect(determineConflictStrategy('field_reports', 'report')).toBe('FIELD_VISIBLE');
    expect(determineConflictStrategy('ptw_permits', 'ptw')).toBe('BLOCKING');
    expect(determineConflictStrategy('valuations', 'valuation')).toBe('BLOCKING');
  });

  it('evaluates APPEND_ONLY conflict strategy for evidence', () => {
    const local = { photoUrl: 'https://example.com/p1.jpg', title: 'Evidencia Junta J-01' };
    const remote = { photoUrl: 'https://example.com/p0.jpg', title: 'Evidencia Previa' };

    const res = evaluateConflictPolicy('APPEND_ONLY', local, remote, 'create');

    expect(res.canSync).toBe(true);
    expect(res.hasConflict).toBe(false);
    expect(res.resolvedPayload?._isAppendedEvidence).toBe(true);
  });

  it('evaluates FIELD_VISIBLE conflict strategy for field reports', () => {
    const now = Date.now();
    const local = {
      notes: 'Edición offline',
      _offlineCapturedAt: new Date(now - 10000).toISOString()
    };
    const remote = {
      notes: 'Edición en servidor',
      updatedAt: new Date(now).toISOString()
    };

    const res = evaluateConflictPolicy('FIELD_VISIBLE', local, remote, 'update');

    expect(res.canSync).toBe(true);
    expect(res.hasConflict).toBe(true);
    expect(res.resolvedPayload?.hasConflict).toBe(true);
    expect(res.resolvedPayload?.conflictDetails).toContain('Conflicto de sincronización');
  });

  it('evaluates BLOCKING conflict strategy for PTW permits and rejects sync', () => {
    const now = Date.now();
    const local = {
      status: 'aprobado',
      _offlineCapturedAt: new Date(now - 10000).toISOString()
    };
    const remote = {
      status: 'cerrado',
      updatedAt: new Date(now).toISOString()
    };

    const res = evaluateConflictPolicy('BLOCKING', local, remote, 'update');

    expect(res.canSync).toBe(false);
    expect(res.hasConflict).toBe(true);
    expect(res.reason).toContain('Bloqueo');
  });
});
