import { NormCalculator } from './NormCalculator';
import { ASMEB31GCalculator } from '../asme/asmeB31g';
import { ASMEB313Calculator } from '../asme/asmeB313';
import { API570Calculator } from '../api/api570';
import { PDVSA906Calculator } from '../pdvsa/pdvsa906';
import { ASMEB165Calculator } from '../asme/asmeB165';

class NormRegistry {
  private calculators: Map<string, NormCalculator> = new Map();

  constructor() {
    this.register(new ASMEB31GCalculator());
    this.register(new ASMEB313Calculator());
    this.register(new API570Calculator());
    this.register(new PDVSA906Calculator());
    this.register(new ASMEB165Calculator());
  }

  public register(calculator: NormCalculator): void {
    this.calculators.set(calculator.id, calculator);
  }

  public get(id: string): NormCalculator | undefined {
    return this.calculators.get(id);
  }

  public getAll(): NormCalculator[] {
    return Array.from(this.calculators.values());
  }

  public getByCategory(category: NormCalculator['category']): NormCalculator[] {
    return this.getAll().filter(calc => calc.category === category);
  }
}

export const normRegistry = new NormRegistry();
