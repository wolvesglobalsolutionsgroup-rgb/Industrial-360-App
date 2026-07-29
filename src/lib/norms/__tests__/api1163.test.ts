import { describe, it, expect } from 'vitest';
import { API1163Evaluator, GOLDEN_CARDON_AMUAY_PRESET } from '../api1163';

describe('API 1163 ILI Integrity Evaluation — Golden Test Cardón-Amuay', () => {
  const evaluator = new API1163Evaluator();

  it('VAL-01: D003 anomaly has burstPressureRatio < 1.0 (≈0.9385) and requires Acción Inmediata', () => {
    const d003 = GOLDEN_CARDON_AMUAY_PRESET.anomalies.find((a) => a.id === 'D003')!;
    expect(d003).toBeDefined();

    const result = evaluator.evaluateAnomaly(d003, GOLDEN_CARDON_AMUAY_PRESET.depthTolerancePercent);
    expect(result.burstPressureRatio).toBeLessThan(1.0);
    expect(result.burstPressureRatio).toBeCloseTo(0.9385, 2);
    expect(result.actionRequired).toBe('Acción Inmediata');
  });

  it('VAL-02: D003 anomaly recommendedRepair contains "tipo b"', () => {
    const d003 = GOLDEN_CARDON_AMUAY_PRESET.anomalies.find((a) => a.id === 'D003')!;
    expect(d003).toBeDefined();

    const result = evaluator.evaluateAnomaly(d003, GOLDEN_CARDON_AMUAY_PRESET.depthTolerancePercent);
    expect(result.recommendedRepair.toLowerCase()).toContain('tipo b');
  });

  it('VAL-03: D001 anomaly has burstPressureRatio > 1.0 and requires Monitoreo Continuo', () => {
    const d001 = GOLDEN_CARDON_AMUAY_PRESET.anomalies.find((a) => a.id === 'D001')!;
    expect(d001).toBeDefined();

    const result = evaluator.evaluateAnomaly(d001, GOLDEN_CARDON_AMUAY_PRESET.depthTolerancePercent);
    expect(result.burstPressureRatio).toBeGreaterThan(1.0);
    expect(result.actionRequired).toBe('Monitoreo Continuo');
  });

  it('VAL-05: D002 anomaly recommendedRepair contains "API 1183"', () => {
    const d002 = GOLDEN_CARDON_AMUAY_PRESET.anomalies.find((a) => a.id === 'D002')!;
    expect(d002).toBeDefined();

    const result = evaluator.evaluateAnomaly(d002, GOLDEN_CARDON_AMUAY_PRESET.depthTolerancePercent);
    expect(result.recommendedRepair).toContain('API 1183');
  });
});
