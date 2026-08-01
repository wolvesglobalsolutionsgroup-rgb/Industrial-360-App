import { describe, it, expect } from 'vitest';
import { ASMEB313Calculator } from '../asme/asmeB313';

const asmeB313 = new ASMEB313Calculator();

describe('ASME B31.3 — Wall Thickness', () => {
  it('should calculate t_min correctly and pass for adequate pipe schedule', () => {
    const results = asmeB313.calculate({
      P: 600,
      D: 12.75,
      S: '20000',
      E: '1.0',
      Y: '0.4',
      c: 0.063,
      t_nom: 0.5
    });
    const result = results[0];
    expect(Number(result.value)).toBeGreaterThan(0);
    expect(Number(result.value)).toBeLessThan(12.75);
    expect(result.passed).toBe(true);
  });

  it('should reject when nominal pipe thickness is insufficient for high pressure', () => {
    const results = asmeB313.calculate({
      P: 1500,
      D: 12.75,
      S: '20000',
      E: '1.0',
      Y: '0.4',
      c: 0.063,
      t_nom: 0.322
    });
    const result = results[0];
    expect(result.passed).toBe(false);
    expect(result.severity).toBe('error');
  });
});
