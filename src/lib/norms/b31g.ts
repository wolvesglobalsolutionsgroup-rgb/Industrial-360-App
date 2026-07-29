import { ASMEB31GCalculator } from './asme/asmeB31g';

export { ASMEB31GCalculator };

/**
 * Cálculo normativo ASME B31G / Modified B31G (Resistencia Residual en Tuberías Corroídas)
 * Incluye Factor Folias M, Presión de Falla Pf, Presión Segura P_safe, e Interactividad S <= 3t.
 */
export function calculateASMEB31G(
  d_depth_mm: number,
  t_wall_mm: number,
  L_length_mm: number,
  D_outer_mm: number,
  SMYS_psi: number = 52000,
  MOP_psi: number = 720,
  S_spacing_mm?: number
) {
  const d_t = d_depth_mm / t_wall_mm;
  
  // Interactivity check: S <= 3t
  const interactiveLimit_mm = 3 * t_wall_mm;
  const isInteractive = S_spacing_mm !== undefined && S_spacing_mm <= interactiveLimit_mm;

  // Folias Factor M
  const z = (L_length_mm * L_length_mm) / (D_outer_mm * t_wall_mm);
  let M = 1.0;

  if (z <= 50) {
    M = Math.sqrt(1 + 0.6275 * z - 0.003375 * z * z);
  } else {
    M = 0.032 * z + 3.3;
  }

  // Original MAOP psi (Design Pressure)
  const P_original = (2 * SMYS_psi * 0.72 * (t_wall_mm / 25.4)) / (D_outer_mm / 25.4);

  // Failure Pressure Pf ratio
  const Pf_ratio = (1 - (2 / 3) * d_t) / (1 - (2 / 3) * (d_t / M));
  const Pf_psi = P_original * Pf_ratio;
  const P_safe_psi = Pf_psi * 0.72;

  const isSafe = P_safe_psi >= MOP_psi && d_t <= 0.80;

  return {
    d_t_ratio: Number(d_t.toFixed(4)),
    FoliasFactor_M: Number(M.toFixed(4)),
    P_fail_psi: Math.round(Pf_psi),
    P_safe_psi: Math.round(P_safe_psi),
    isInteractive,
    interactiveLimit_mm: Number(interactiveLimit_mm.toFixed(2)),
    isSafe,
  };
}
