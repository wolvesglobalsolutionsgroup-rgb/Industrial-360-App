import { NormCalculator } from './NormCalculator';
import { ASMEB31GCalculator } from '../b31g';
import { ASMEB313Calculator } from '../b313';
import { API570Calculator } from '../api570';
import { ASMEB165Calculator } from '../b165';
import { PDVSA906Calculator, PDVSA90601ESeparatorCalculator } from '../pdvsa906';
import { WeldingEstimatorCalculator } from '../weldingEstimator';
import { ASMEPCC1Calculator } from '../pcc1';

class NormRegistry {
  private calculators: Map<string, NormCalculator> = new Map();

  constructor() {
    this.register(new ASMEB31GCalculator());
    this.register(new ASMEB313Calculator());
    this.register(new API570Calculator());
    this.register(new ASMEB165Calculator());
    this.register(new PDVSA906Calculator());
    this.register(new PDVSA90601ESeparatorCalculator());
    this.register(new WeldingEstimatorCalculator());
    this.register(new ASMEPCC1Calculator());
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
