import { BaseRepository } from './baseRepo';
import { BaseEntity } from './types';

export interface ExpenseItem extends BaseEntity {
  description: string;
  amount: number;
  category?: string;
  date?: string;
  receiptUrl?: string;
  status?: string;
  [key: string]: any;
}

export class ExpensesRepository extends BaseRepository<ExpenseItem> {
  constructor() {
    super('expenses');
  }
}

export const expensesRepo = new ExpensesRepository();
