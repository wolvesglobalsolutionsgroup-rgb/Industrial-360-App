import { 
  collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, 
  onSnapshot, query, where, collectionGroup 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { BaseEntity } from './types';

export class BaseRepository<T extends BaseEntity> {
  constructor(public readonly collectionName: string) {}

  private getCollectionPath(orgId: string, projectId: string): string {
    return `organizations/${orgId}/projects/${projectId}/${this.collectionName}`;
  }

  async getAll(orgId: string, projectId: string): Promise<T[]> {
    if (!orgId || !projectId) throw new Error('orgId y projectId son obligatorios.');
    try {
      if (projectId === 'all') {
        const q = query(collectionGroup(db, this.collectionName), where('orgId', '==', orgId));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as T));
      } else {
        const snap = await getDocs(collection(db, this.getCollectionPath(orgId, projectId)));
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as T));
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, this.collectionName);
      return [];
    }
  }

  async getById(orgId: string, projectId: string, id: string): Promise<T | null> {
    if (!orgId || !projectId || !id) throw new Error('orgId, projectId e id son obligatorios.');
    try {
      const snap = await getDoc(doc(db, this.getCollectionPath(orgId, projectId), id));
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() } as T;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `${this.collectionName}/${id}`);
      return null;
    }
  }

  async create(
    orgId: string, 
    projectId: string, 
    data: Omit<T, 'id' | 'orgId' | 'projectId' | 'createdAt' | 'updatedAt'> & Partial<BaseEntity>
  ): Promise<T> {
    if (!orgId || !projectId) throw new Error('orgId y projectId son obligatorios.');
    if (projectId === 'all') throw new Error('No se puede crear un registro en el portafolio corporativo ("all"). Seleccione un proyecto específico.');
    
    const now = new Date().toISOString();
    const payload = {
      ...data,
      orgId,
      projectId,
      createdAt: data.createdAt || now,
      updatedAt: now,
    };

    try {
      const ref = await addDoc(collection(db, this.getCollectionPath(orgId, projectId)), payload);
      return { id: ref.id, ...payload } as T;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, this.collectionName);
      throw err;
    }
  }

  async update(orgId: string, projectId: string, id: string, updates: Partial<T>): Promise<void> {
    if (!orgId || !projectId || !id) throw new Error('orgId, projectId e id son obligatorios.');
    try {
      const docRef = doc(db, this.getCollectionPath(orgId, projectId), id);
      await updateDoc(docRef, {
        ...updates,
        orgId,
        projectId,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${this.collectionName}/${id}`);
      throw err;
    }
  }

  async delete(orgId: string, projectId: string, id: string): Promise<void> {
    if (!orgId || !projectId || !id) throw new Error('orgId, projectId e id son obligatorios.');
    try {
      await deleteDoc(doc(db, this.getCollectionPath(orgId, projectId), id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${this.collectionName}/${id}`);
      throw err;
    }
  }

  subscribe(orgId: string, projectId: string, callback: (items: T[]) => void, onError?: (err: any) => void): () => void {
    if (!orgId || !projectId) {
      console.warn('subscribe invocado sin orgId o projectId');
      callback([]);
      return () => {};
    }

    const q = projectId === 'all'
      ? query(collectionGroup(db, this.collectionName), where('orgId', '==', orgId))
      : query(collection(db, this.getCollectionPath(orgId, projectId)));

    return onSnapshot(q, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as T));
      callback(items);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, this.collectionName);
      if (onError) onError(err);
    });
  }
}
