import { BaseRepository } from './baseRepo';
import { DocumentItem } from './types';

export class DocumentsRepository extends BaseRepository<DocumentItem> {
  constructor() {
    super('documents');
  }
}

export const documentsRepo = new DocumentsRepository();
