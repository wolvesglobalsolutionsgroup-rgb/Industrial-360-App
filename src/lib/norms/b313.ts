import { NormCalculator, NormField, NormResult } from './core/NormCalculator';
import { ASMEB313Calculator } from './asme/asmeB313';

export { ASMEB313Calculator };

/**
 * Función auxiliar para cálculo rápido de espesor mínimo requerido por ASME B31.3 §304.1.2
 * Ec (3a): t_min = (P * D) / (2 * (S * E + P * Y)) + c
 */
export function calculateASMEB31_3_tmin(
  P_psi: number,
  D_outer_in: number,
  S_stress_psi: number = 20000,
  E_joint_efficiency: number = 1.0,
  Y_coefficient: number = 0.4,
  c_corrosion_allowance_in: number = 0.063
) {
  const num = P_psi * D_outer_in;
  const den = 2 * (S_stress_psi * E_joint_efficiency + P_psi * Y_coefficient);
  const t_pressure_in = num / den;
  const t_min_in = t_pressure_in + c_corrosion_allowance_in;
  const t_min_mm = t_min_in * 25.4;

  // Max allowable pressure (MAWP) for nominal thickness minus corrosion allowance
  const P_max_psi = (S_stress_psi, t_net_in: number) =>
    (2 * S_stress_psi * E_joint_efficiency * t_net_in) / (D_outer_in - 2 * Y_coefficient * t_net_in);

  return {
    t_pressure_in: Number(t_pressure_in.toFixed(4)),
    t_min_in: Number(t_min_in.toFixed(4)),
    t_min_mm: Number(t_min_mm.toFixed(2)),
    calculateMAWP: (t_nom_in: number) => {
      const t_net = t_nom_in - c_corrosion_allowance_in;
      return t_net > 0 ? Number(P_max_psi(S_stress_psi, t_net).toFixed(1)) : 0;
    }
  };
}
