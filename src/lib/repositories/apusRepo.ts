import { BaseRepository } from './baseRepo';
import { ApuItem } from './types';

export class ApusRepository extends BaseRepository<ApuItem> {
  constructor() {
    super('apus');
  }
}

export const apusRepo = new ApusRepository();
