import { BaseRepository } from './baseRepo';
import { ValuationItem } from './types';

export class ValuationsRepository extends BaseRepository<ValuationItem> {
  constructor() {
    super('valuations');
  }
}

export const valuationsRepo = new ValuationsRepository();
