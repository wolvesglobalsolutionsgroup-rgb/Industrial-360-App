import { BaseRepository } from './baseRepo';
import { RouteItem } from './types';

export class RoutesRepository extends BaseRepository<RouteItem> {
  constructor() {
    super('routes');
  }
}

export const routesRepo = new RoutesRepository();
