import { describe, it, expect } from 'vitest';
import { ASMEB31GCalculator } from '../asme/asmeB31g';

const asmeB31g = new ASMEB31GCalculator();

const defaultInputs = {
  D: 16.0,
  t: 0.5, // 12.7 mm
  d: 0.118, // 3.0 mm
  L: 5.9, // 150 mm
  smys: '52000',
  F: '0.72',
  P_oper: 1100,
};

describe('ASME B31G — Pressure Remnant', () => {
  it('should calculate Pf correctly and pass for safe defects', () => {
    const results = asmeB31g.calculate(defaultInputs);
    const result = results[0];
    expect(Number(result.value)).toBeGreaterThan(0);
    expect(Number(result.value)).toBeGreaterThan(defaultInputs.P_oper);
    expect(result.passed).toBe(true);
  });

  it('should reject depth > 80% wall thickness', () => {
    const results = asmeB31g.calculate({ ...defaultInputs, d: 0.42 }); // 0.42 / 0.5 = 84% > 80%
    const result = results[0];
    expect(result.passed).toBe(false);
    expect(result.severity).toBe('error');
  });
});
