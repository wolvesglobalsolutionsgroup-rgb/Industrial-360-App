import { describe, it, expect } from 'vitest';

/**
 * ASME B31G: Remaining Strength of Corroded Pipelines
 * Equation 3a / Modified B31G calculation
 */
export function calculateASMEB31G(
  d_depth_mm: number,
  t_wall_mm: number,
  L_length_mm: number,
  D_outer_mm: number,
  SMYS_psi: number = 52000,
  MOP_psi: number = 720
) {
  const d_t = d_depth_mm / t_wall_mm;
  // Folias Factor M
  const z = (L_length_mm * L_length_mm) / (D_outer_mm * t_wall_mm);
  let M = 1.0;

  if (z <= 50) {
    M = Math.sqrt(1 + 0.6275 * z - 0.003375 * z * z);
  } else {
    M = 0.032 * z + 3.3;
  }

  // Safe operating pressure Pf
  const S_flow = SMYS_psi * 1.1; // Flow stress
  const P_original = (2 * SMYS_psi * 0.72 * (t_wall_mm / 25.4)) / (D_outer_mm / 25.4); // MAOP psi

  const Pf_ratio = (1 - (2 / 3) * d_t) / (1 - (2 / 3) * (d_t / M));
  const Pf_psi = P_original * Pf_ratio;

  const isSafe = Pf_psi >= MOP_psi;

  return {
    d_t_ratio: d_t,
    FoliasFactor_M: M,
    P_safe_psi: Math.round(Pf_psi),
    isSafe,
  };
}

/**
 * ASME B31.3 / B31.8: Minimum Required Wall Thickness
 * t_min = (P * D) / (2 * (S * E * W + P * Y))
 */
export function calculateASMEB31_3_tmin(
  P_psi: number,
  D_outer_in: number,
  S_stress_psi: number = 20000,
  E_joint_efficiency: number = 1.0,
  Y_coefficient: number = 0.4
) {
  const t_min_in = (P_psi * D_outer_in) / (2 * (S_stress_psi * E_joint_efficiency + P_psi * Y_coefficient));
  const t_min_mm = t_min_in * 25.4;
  return {
    t_min_in: Number(t_min_in.toFixed(4)),
    t_min_mm: Number(t_min_mm.toFixed(2)),
  };
}

/**
 * API 570: Remaining Corrosion Life and Next Inspection Interval
 * Life = (t_actual - t_minimum) / CorrosionRate
 */
export function calculateAPI570CorrosionLife(
  t_actual_mm: number,
  t_min_mm: number,
  corrosion_rate_mm_year: number
) {
  if (corrosion_rate_mm_year <= 0) {
    return { remaining_years: 99, next_inspection_years: 10 };
  }
  const remaining_years = (t_actual_mm - t_min_mm) / corrosion_rate_mm_year;
  const next_inspection_years = Math.min(remaining_years / 2, 10);

  return {
    remaining_years: Number(remaining_years.toFixed(1)),
    next_inspection_years: Number(next_inspection_years.toFixed(1)),
  };
}

describe('Pruebas de Cálculo de Ingeniería Normativas (ASME / API)', () => {
  it('ASME B31G: Debe calcular correctamente la presión segura Pf para tubería corroída', () => {
    // Tubería 16", espesor 9.52mm, defecto profundidad 3mm (31% d/t), longitud 100mm
    const result = calculateASMEB31G(3.0, 9.52, 100, 406.4, 52000, 720);
    expect(result.d_t_ratio).toBeCloseTo(0.315, 2);
    expect(result.FoliasFactor_M).toBeGreaterThan(1.0);
    expect(result.P_safe_psi).toBeGreaterThan(700);
    expect(result.isSafe).toBe(true);
  });

  it('ASME B31.3: Debe calcular el espesor mínimo t_min según presión y diámetro', () => {
    // P = 600 psi, D = 16", S = 20000 psi
    const result = calculateASMEB31_3_tmin(600, 16, 20000);
    expect(result.t_min_in).toBeGreaterThan(0.2);
    expect(result.t_min_mm).toBeGreaterThan(5.0);
  });

  it('API 570: Debe determinar la vida remanente y el intervalo de inspección (Half Life Rule)', () => {
    // t_actual = 8.0 mm, t_min = 5.0 mm, tasa = 0.3 mm/año => Vida = 10 años => Próxima inspección = 5 años
    const result = calculateAPI570CorrosionLife(8.0, 5.0, 0.3);
    expect(result.remaining_years).toBe(10.0);
    expect(result.next_inspection_years).toBe(5.0);
  });
});
