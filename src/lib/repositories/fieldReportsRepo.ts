import { BaseRepository } from './baseRepo';
import { FieldReport } from './types';

export class FieldReportsRepository extends BaseRepository<FieldReport> {
  constructor() {
    super('field_reports');
  }
}

export const fieldReportsRepo = new FieldReportsRepository();
