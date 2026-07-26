import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { ParsedXerTask } from './xerParser';
import { ParsedBc3Task } from './bc3Parser';

export interface SyncTaskPayload {
  code: string;
  name: string;
  unit: string;
  plannedQuantity: number;
  executedQuantity: number;
  unitCost: number;
  startDate?: string;
  endDate?: string;
  status?: string;
}

/**
 * Syncs parsed tasks from .xer / .bc3 files to Firestore (both root tasks & org project subcollections)
 */
export async function syncImportedTasksToFirestore(
  tasks: (ParsedXerTask | ParsedBc3Task)[],
  projectId: string,
  orgId: string = 'default_org',
  sourceName: string = 'Importador Automático'
): Promise<{ successCount: number; errorsCount: number }> {
  let successCount = 0;
  let errorsCount = 0;

  for (const task of tasks) {
    try {
      const taskDoc = {
        projectId,
        code: task.code,
        name: task.name,
        unit: task.unit || 'und',
        plannedQuantity: Number(task.plannedQuantity) || 1,
        executedQuantity: Number(task.executedQuantity) || 0,
        unitCost: Number(task.unitCost) || 0,
        totalCost: (Number(task.plannedQuantity) || 1) * (Number(task.unitCost) || 0),
        startDate: task.startDate || new Date().toISOString().split('T')[0],
        endDate: task.endDate || new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
        status: (task as any).status || (Number(task.executedQuantity) >= Number(task.plannedQuantity) ? 'Completado' : 'Pendiente'),
        importedFrom: sourceName,
        importedAt: new Date().toISOString(),
        createdAt: serverTimestamp()
      };

      // 1. Write to root collection 'tasks'
      await addDoc(collection(db, 'tasks'), taskDoc);

      // 2. Write to org project subcollection 'organizations/{orgId}/projects/{projId}/tasks'
      try {
        const subcollRef = collection(db, 'organizations', orgId, 'projects', projectId, 'tasks');
        await addDoc(subcollRef, taskDoc);
      } catch (subErr) {
        // Non-blocking subcollection backup
        console.warn('Subcollection write warning:', subErr);
      }

      successCount++;
    } catch (err) {
      console.error('Error writing task doc:', err);
      errorsCount++;
    }
  }

  return { successCount, errorsCount };
}
