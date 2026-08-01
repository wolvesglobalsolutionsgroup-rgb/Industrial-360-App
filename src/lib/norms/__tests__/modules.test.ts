import { describe, it, expect } from 'vitest';
import { getFlangeSpec, ASMEB165Calculator } from '../b165';
import { PDVSA90601ESeparatorCalculator, calculatePDVSASeparator, PDVSA906Calculator } from '../pdvsa906';
import { WeldingEstimatorCalculator, calculateWeldingMaterialsAndHours } from '../weldingEstimator';
import { ASMEPCC1Calculator, calculatePCC1Torque } from '../pcc1';
import { normRegistry } from '../core/NormRegistry';

describe('Sprint 3 Normative Modules & Calculators (IC360-012)', () => {
  it('ASME B16.5 — Debe retornar datos de brida 4" Clase 150# correctamente', () => {
    const spec = getFlangeSpec('150#', '4"');
    expect(spec).toBeDefined();
    expect(spec?.holesCount).toBe(8);
    expect(spec?.torqueFtLb).toBe(120);

    const calc = new ASMEB165Calculator();
    const res = calc.calculate({ rating: '150#', nps: '4"' });
    expect(res[0].passed).toBe(true);
  });

  it('PDVSA 90601-E — Debe calcular el diámetro y velocidad de separador de gas', () => {
    const res = calculatePDVSASeparator(15.0, 600, 100, 0.65, 0.85, 0.35);
    expect(res[0].passed).toBe(true);
    expect(res[0].details?.['Diámetro Comercial Recomendado']).toBeDefined();

    const calc = new PDVSA90601ESeparatorCalculator();
    const resCalc = calc.calculate({ Qg: 10, P_oper: 500 });
    expect(resCalc[0].passed).toBe(true);
  });

  it('PDVSA 906 NDT — Debe evaluar rechazo por grieta', () => {
    const calc = new PDVSA906Calculator();
    const res = calc.calculate({ defectType: 'grieta', defectLength: 5, wallThickness: 9.53 });
    expect(res[0].passed).toBe(false);
    expect(res[0].severity).toBe('error');
  });

  it('Welding Estimator — Debe calcular consumo bruto, cajas y Horas-Hombre', () => {
    const res = calculateWeldingMaterialsAndHours(8, 8.18, 10, 'E7018');
    expect(res[0].passed).toBe(true);
    expect(res[0].details?.['Cajas de 5 kg Requeridas']).toBeDefined();
    expect(res[0].details?.['Horas Hombre Estimadas (HH)']).toBeDefined();

    const calc = new WeldingEstimatorCalculator();
    const resCalc = calc.calculate({ npsInches: 12, wallThicknessMm: 9.52, jointCount: 20 });
    expect(resCalc[0].passed).toBe(true);
  });

  it('ASME PCC-1 — Debe calcular torque y secuencia de 4 pasadas para bridas', () => {
    const res = calculatePCC1Torque('300#', '6"', 0.16);
    expect(res[0].passed).toBe(true);
    expect(res[0].details?.['Torque 100% (ft-lb)']).toBeDefined();

    const calc = new ASMEPCC1Calculator();
    const resCalc = calc.calculate({ rating: '150#', nps: '8"', frictionK: 0.16 });
    expect(resCalc[0].passed).toBe(true);
  });

  it('NormRegistry — Debe registrar las 8 calculadoras normativas', () => {
    const all = normRegistry.getAll();
    expect(all.length).toBeGreaterThanOrEqual(8);
    expect(normRegistry.get('asme_b313')).toBeDefined();
    expect(normRegistry.get('asme_b31g')).toBeDefined();
    expect(normRegistry.get('api_570')).toBeDefined();
    expect(normRegistry.get('asme_b165')).toBeDefined();
    expect(normRegistry.get('pdvsa_906')).toBeDefined();
    expect(normRegistry.get('pdvsa_90601e')).toBeDefined();
    expect(normRegistry.get('welding_estimator')).toBeDefined();
    expect(normRegistry.get('asme_pcc1')).toBeDefined();
  });
});
