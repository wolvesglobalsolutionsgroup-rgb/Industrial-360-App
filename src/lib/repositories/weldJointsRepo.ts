import { BaseRepository } from './baseRepo';
import { WeldJoint } from './types';

export class WeldJointsRepository extends BaseRepository<WeldJoint> {
  constructor() {
    super('weld_joints');
  }
}

export const weldJointsRepo = new WeldJointsRepository();
