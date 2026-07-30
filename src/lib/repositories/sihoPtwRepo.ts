import { BaseRepository } from './baseRepo';
import { SihoPtwRecord } from './types';

export class SihoPtwRepository extends BaseRepository<SihoPtwRecord> {
  constructor() {
    super('siho_ptw');
  }
}

export const sihoPtwRepo = new SihoPtwRepository();
