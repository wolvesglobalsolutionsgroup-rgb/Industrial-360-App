import { BaseRepository } from './baseRepo';
import { WorkerItem } from './types';

export class WorkersRepository extends BaseRepository<WorkerItem> {
  constructor() {
    super('workers');
  }
}

export const workersRepo = new WorkersRepository();
