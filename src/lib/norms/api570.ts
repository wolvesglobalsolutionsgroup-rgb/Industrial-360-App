import { API570Calculator } from './api/api570';

export { API570Calculator };

/**
 * Cálculo normativo API 570 (Tasa de Corrosión, Vida Útil Residual e Intervalo de Inspección)
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
