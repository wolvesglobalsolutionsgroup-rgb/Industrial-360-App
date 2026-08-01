import { BaseRepository } from './baseRepo';
import { InventoryItem } from './types';

export class InventoryRepository extends BaseRepository<InventoryItem> {
  constructor() {
    super('inventory');
  }
}

export const inventoryRepo = new InventoryRepository();
