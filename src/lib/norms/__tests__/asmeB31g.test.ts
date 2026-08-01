import { describe, it, expect } from 'vitest';
import { ASMEB31GCalculator, calculateASMEB31G } from '../b31g';

const asmeB31g = new ASMEB31GCalculator();

const defaultInputs = {
  D: 16.0,
  t: 0.5, // 12.7 mm
  d: 0.118, // 3.0 mm
  L: 5.9, // 150 mm
  smys: '52000',
  F: '0.72',
  P_oper: 1100,
  S_spacing: 1.0, // 1.0 in < 3t (1.5 in) => interactive
};

describe('ASME B31G — Pressure Remnant & Interactivity', () => {
  it('should calculate Pf correctly and pass for safe defects', () => {
    const results = asmeB31g.calculate(defaultInputs);
    const result = results[0];
    expect(Number(result.value)).toBeGreaterThan(0);
    expect(Number(result.value)).toBeGreaterThan(defaultInputs.P_oper);
    expect(result.passed).toBe(true);
  });

  it('should detect interactivity when S <= 3t', () => {
    const calc = calculateASMEB31G(3.0, 12.7, 150, 406.4, 52000, 720, 20.0);
    expect(calc.isInteractive).toBe(true); // 20mm <= 3 * 12.7mm (38.1mm)
    expect(calc.FoliasFactor_M).toBeGreaterThan(1.0);
  });

  it('should reject depth > 80% wall thickness', () => {
    const results = asmeB31g.calculate({ ...defaultInputs, d: 0.42 }); // 0.42 / 0.5 = 84% > 80%
    const result = results[0];
    expect(result.passed).toBe(false);
    expect(result.severity).toBe('error');
  });
});
