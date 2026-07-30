import { BaseRepository } from './baseRepo';
import { TaskItem } from './types';

export class TasksRepository extends BaseRepository<TaskItem> {
  constructor() {
    super('tasks');
  }
}

export const tasksRepo = new TasksRepository();
