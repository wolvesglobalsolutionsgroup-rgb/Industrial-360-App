import { describe, it, expect } from 'vitest';
import { API570Calculator } from '../api/api570';

const api570 = new API570Calculator();

describe('API 570 — Remaining Life', () => {
  it('should calculate CR and RL', () => {
    const results = api570.calculate({
      t_initial: 0.5,
      t_actual: 0.4,
      t_min: 0.3,
      years: 5.0
    });
    const result = results[0];
    expect(Number(result.value)).toBeGreaterThan(0);
    expect(result.details).toBeDefined();
    expect(result.passed).toBe(true);
  });
});
