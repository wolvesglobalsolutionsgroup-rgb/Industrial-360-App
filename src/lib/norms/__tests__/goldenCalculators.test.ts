import { describe, it, expect } from 'vitest';
import {
  calculateASMEB31G,
  ASMEB31GCalculator,
  calculateAPI570,
  API570Calculator,
  evaluateAPI1163Anomaly,
  API1163Evaluator,
  GOLDEN_CARDON_AMUAY_PRESET,
  getFlangeSpec,
  calculateB165Flange,
  ASMEB165Calculator,
  calculateASMEB31_3_tmin,
  ASMEB313Calculator,
  calculatePDVSASeparator,
  PDVSA90601ESeparatorCalculator,
  calculatePCC1Torque,
  ASMEPCC1Calculator,
  calculateWeldingMaterialsAndHours,
  WeldingEstimatorCalculator,
  NORM_DISCLAIMER
} from '../index';

describe('GOLDEN TESTS — Engineering Norm Calculators (Official Standard Values)', () => {

  describe('1. ASME B31G — Remaining Strength of Corroded Pipe', () => {
    it('Golden Test: 16" Pipe, 0.5" WT, 0.118" defect depth, 5.9" length, SMYS 52,000 psi', () => {
      const res = calculateASMEB31G({
        d_depth_mm: 3.0,
        t_wall_mm: 12.7,
        L_length_mm: 150,
        D_outer_mm: 406.4,
        SMYS_psi: 52000,
        MOP_psi: 720
      });

      expect(res.d_t_ratio).toBeCloseTo(0.2362, 2);
      expect(res.FoliasFactor_M).toBeGreaterThan(1.0);
      expect(res.P_safe_psi).toBeGreaterThan(700);
      expect(res.isSafe).toBe(true);
      expect(res.disclaimer).toBe(NORM_DISCLAIMER);
    });

    it('Calculator Class conforms to NormCalculator interface', () => {
      const calc = new ASMEB31GCalculator();
      expect(calc.id).toBe('asme_b31g');
      expect(calc.standard).toBe('ASME B31G');
      expect(calc.disclaimer).toBe(NORM_DISCLAIMER);
    });
  });

  describe('2. API 570 — Remaining Corrosion Life and Inspection Interval', () => {
    it('Golden Test: t_initial = 12.7 mm (0.5 in), t_actual = 10.16 mm (0.4 in), t_min = 7.62 mm (0.3 in), 5 years transcurred', () => {
      const res = calculateAPI570({
        t_initial_mm: 12.7,
        t_actual_mm: 10.16,
        t_min_mm: 7.62,
        years: 5.0
      });

      expect(res.corrosion_rate_mm_year).toBeCloseTo(0.508, 3); // 2.54 mm loss / 5 yr = 0.508 mm/yr
      expect(res.corrosion_rate_mpy).toBeCloseTo(20.0, 1); // 0.508 mm/yr = 20 mpy
      expect(res.remaining_years).toBeCloseTo(5.0, 1); // (10.16 - 7.62) / 0.508 = 5 years
      expect(res.next_inspection_years).toBeCloseTo(2.5, 1); // Half-life rule: 5 / 2 = 2.5 years
      expect(res.isSafe).toBe(true);
      expect(res.disclaimer).toBe(NORM_DISCLAIMER);
    });

    it('Calculator Class conforms to NormCalculator interface', () => {
      const calc = new API570Calculator();
      expect(calc.id).toBe('api_570');
      expect(calc.standard).toBe('API 570');
      expect(calc.disclaimer).toBe(NORM_DISCLAIMER);
    });
  });

  describe('3. API 1163 — ILI System Qualification & Anomaly Evaluation', () => {
    it('Golden Test: Cardón-Amuay preset D003 anomaly evaluation', () => {
      const d003 = GOLDEN_CARDON_AMUAY_PRESET.anomalies.find((a) => a.id === 'D003')!;
      expect(d003).toBeDefined();

      const res = evaluateAPI1163Anomaly(d003, GOLDEN_CARDON_AMUAY_PRESET.depthTolerancePercent);
      expect(res.burstPressureRatio).toBeCloseTo(0.9385, 2);
      expect(res.actionRequired).toBe('Acción Inmediata');
      expect(res.recommendedRepair.toLowerCase()).toContain('tipo b');
      expect(res.disclaimer).toBe(NORM_DISCLAIMER);
    });

    it('Evaluator Class conforms to NormCalculator interface', () => {
      const calc = new API1163Evaluator();
      expect(calc.id).toBe('api_1163');
      expect(calc.standard).toBe('API 1163');
      expect(calc.disclaimer).toBe(NORM_DISCLAIMER);
    });
  });

  describe('4. ASME B16.5 — Flange Dimensions & Torques', () => {
    it('Golden Test: 4" Class 150# Flange Specification', () => {
      const spec = getFlangeSpec('150#', '4"');
      expect(spec).toBeDefined();
      expect(spec?.holesCount).toBe(8);
      expect(spec?.bcdMm).toBe(190.5);
      expect(spec?.boltDiamInches).toBe('5/8"');
      expect(spec?.torqueFtLb).toBe(120);

      const pureRes = calculateB165Flange('150#', '4"');
      expect(pureRes?.disclaimer).toBe(NORM_DISCLAIMER);
    });

    it('Calculator Class conforms to NormCalculator interface', () => {
      const calc = new ASMEB165Calculator();
      expect(calc.id).toBe('asme_b165');
      expect(calc.standard).toBe('ASME B16.5');
      expect(calc.disclaimer).toBe(NORM_DISCLAIMER);
    });
  });

  describe('5. ASME B31.3 — Process Piping Wall Thickness', () => {
    it('Golden Test: P = 600 psi, D = 16.0", S = 20,000 psi', () => {
      const res = calculateASMEB31_3_tmin(600, 16, 20000);
      expect(res.t_min_in).toBeGreaterThan(0.2);
      expect(res.t_min_mm).toBeGreaterThan(5.0);
    });

    it('Calculator Class conforms to NormCalculator interface', () => {
      const calc = new ASMEB313Calculator();
      expect(calc.id).toBe('asme_b313');
      expect(calc.standard).toBe('ASME B31.3');
      expect(calc.disclaimer).toBe(NORM_DISCLAIMER);
    });
  });

  describe('6. PDVSA 90601-E — Vertical Gas Scrubber Sizing', () => {
    it('Golden Test: Gas scrubber Qg = 15 MMMSCFD, P = 600 psig', () => {
      const res = calculatePDVSASeparator(15.0, 600, 100, 0.65, 0.85, 0.35);
      expect(res[0].passed).toBe(true);
      expect(res[0].details?.['Diámetro Comercial Recomendado']).toBeDefined();
      expect(res[0].disclaimer).toBe(NORM_DISCLAIMER);
    });

    it('Calculator Class conforms to NormCalculator interface', () => {
      const calc = new PDVSA90601ESeparatorCalculator();
      expect(calc.id).toBe('pdvsa_90601e');
      expect(calc.standard).toBe('PDVSA 90601-E');
      expect(calc.disclaimer).toBe(NORM_DISCLAIMER);
    });
  });

  describe('7. ASME PCC-1 — Flange Joint Assembly & Torque', () => {
    it('Golden Test: 6" 300# Flange with friction factor k = 0.16', () => {
      const res = calculatePCC1Torque('300#', '6"', 0.16);
      expect(res[0].passed).toBe(true);
      expect(res[0].details?.['Torque 100% (ft-lb)']).toBeDefined();
      expect(res[0].disclaimer).toBe(NORM_DISCLAIMER);
    });

    it('Calculator Class conforms to NormCalculator interface', () => {
      const calc = new ASMEPCC1Calculator();
      expect(calc.id).toBe('asme_pcc1');
      expect(calc.standard).toBe('ASME PCC-1');
      expect(calc.disclaimer).toBe(NORM_DISCLAIMER);
    });
  });

  describe('8. Welding Estimator — Material Consumption & Man-Hours', () => {
    it('Golden Test: 8" pipe, 8.18mm WT, 10 joints, E7018 electrode', () => {
      const res = calculateWeldingMaterialsAndHours(8, 8.18, 10, 'E7018');
      expect(res[0].passed).toBe(true);
      expect(res[0].details?.['Cajas de 5 kg Requeridas']).toBeDefined();
      expect(res[0].details?.['Horas Hombre Estimadas (HH)']).toBeDefined();
      expect(res[0].disclaimer).toBe(NORM_DISCLAIMER);
    });

    it('Calculator Class conforms to NormCalculator interface', () => {
      const calc = new WeldingEstimatorCalculator();
      expect(calc.id).toBe('welding_estimator');
      expect(calc.disclaimer).toBe(NORM_DISCLAIMER);
    });
  });
});
