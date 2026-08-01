import { NormCalculator, NormField, NormResult, NORM_DISCLAIMER } from './types';

export interface API570Input {
  t_initial_mm?: number;
  t_actual_mm: number;
  t_min_mm: number;
  corrosion_rate_mm_year?: number;
  years?: number;
}

export interface API570Result {
  corrosion_rate_mm_year: number;
  corrosion_rate_mpy: number;
  remaining_years: number;
  next_inspection_years: number;
  isSafe: boolean;
  disclaimer: string;
}

/**
 * Cálculo normativo de velocidad/tasa de corrosión, vida útil residual e intervalo de inspección según API 570.
 */
export function calculateAPI570(input: API570Input): API570Result;
export function calculateAPI570(
  t_actual_mm: number,
  t_min_mm: number,
  corrosion_rate_mm_year: number
): { remaining_years: number; next_inspection_years: number; disclaimer: string };
export function calculateAPI570(
  arg1: API570Input | number,
  arg2?: number,
  arg3?: number
): any {
  if (typeof arg1 === 'object') {
    const t_actual = arg1.t_actual_mm;
    const t_min = arg1.t_min_mm;
    let cr = arg1.corrosion_rate_mm_year ?? 0;

    if (arg1.t_initial_mm !== undefined && arg1.years && arg1.years > 0) {
      const loss = Math.max(0, arg1.t_initial_mm - t_actual);
      cr = loss / arg1.years;
    }

    let remaining_years = 0;
    if (cr > 0) {
      remaining_years = (t_actual - t_min) / cr;
    } else {
      remaining_years = 99;
    }

    const next_inspection_years = Math.min(remaining_years / 2, 10);
    const cr_mpy = (cr / 25.4) * 1000;
    const isSafe = t_actual >= t_min && remaining_years >= 2;

    return {
      corrosion_rate_mm_year: Number(cr.toFixed(3)),
      corrosion_rate_mpy: Number(cr_mpy.toFixed(1)),
      remaining_years: Number(remaining_years.toFixed(1)),
      next_inspection_years: Number(next_inspection_years.toFixed(1)),
      isSafe,
      disclaimer: NORM_DISCLAIMER,
    };
  } else {
    const t_actual_mm = arg1;
    const t_min_mm = arg2 ?? 0;
    const corrosion_rate_mm_year = arg3 ?? 0;

    if (corrosion_rate_mm_year <= 0) {
      return { remaining_years: 99, next_inspection_years: 10, disclaimer: NORM_DISCLAIMER };
    }
    const remaining_years = (t_actual_mm - t_min_mm) / corrosion_rate_mm_year;
    const next_inspection_years = Math.min(remaining_years / 2, 10);

    return {
      remaining_years: Number(remaining_years.toFixed(1)),
      next_inspection_years: Number(next_inspection_years.toFixed(1)),
      disclaimer: NORM_DISCLAIMER,
    };
  }
}

export const calculateAPI570CorrosionLife = calculateAPI570;

export class API570Calculator implements NormCalculator<Record<string, any>, NormResult[]> {
  id = 'api_570';
  standard = 'API 570';
  edition = '2020';
  reference = 'API 570 Piping Inspection Code §7.1.1';
  name = 'API 570 — Vida Remanente y Tasa de Corrosión en Tuberías';
  description = 'Cálculo de la tasa de corrosión de largo/corto plazo, vida remanente estimada y frecuencia máxima de inspección según API 570.';
  category: 'inspeccion' = 'inspeccion';
  disclaimer = NORM_DISCLAIMER;

  getFields(): NormField[] {
    return [
      {
        id: 't_initial',
        label: 'Espesor de Pared Inicial / Anterior (t_inicial)',
        type: 'number',
        unit: 'pulgadas',
        defaultValue: 0.322,
        min: 0.05,
        max: 2.0,
        step: 0.001,
        description: 'Espesor medido en la inspección base anterior o valor nominal.',
        normaReference: 'API 570 §7.1.1'
      },
      {
        id: 't_actual',
        label: 'Espesor de Pared Actual Medido por UT (t_actual)',
        type: 'number',
        unit: 'pulgadas',
        defaultValue: 0.250,
        min: 0.01,
        max: 2.0,
        step: 0.001,
        description: 'Lectura de espesor ultrasónico (UT) más reciente en el CML/TML.',
        normaReference: 'API 570 §7.1.1'
      },
      {
        id: 't_min',
        label: 'Espesor Mínimo Requerido por Diseño (t_mínimo)',
        type: 'number',
        unit: 'pulgadas',
        defaultValue: 0.180,
        min: 0.01,
        max: 2.0,
        step: 0.001,
        description: 'Espesor mínimo de retiro según ASME B31.3 / B31.4 / B31.8.',
        normaReference: 'API 570 §7.1.2'
      },
      {
        id: 'years',
        label: 'Años Transcurridos entre Mediciones (T_años)',
        type: 'number',
        unit: 'años',
        defaultValue: 5.0,
        min: 0.1,
        max: 50,
        step: 0.5,
        description: 'Intervalo de tiempo en años entre la lectura inicial y la actual.',
        normaReference: 'API 570 §7.1.1'
      }
    ];
  }

  validate(inputs: Record<string, any>): string[] {
    const errors: string[] = [];
    if (!inputs.t_initial || inputs.t_initial <= 0) errors.push('El espesor inicial debe ser mayor a 0.');
    if (!inputs.t_actual || inputs.t_actual <= 0) errors.push('El espesor actual debe ser mayor a 0.');
    if (!inputs.t_min || inputs.t_min <= 0) errors.push('El espesor mínimo debe ser mayor a 0.');
    if (!inputs.years || inputs.years <= 0) errors.push('Los años transcurridos deben ser mayores a 0.');
    if (inputs.t_actual > inputs.t_initial) errors.push('Advertencia: El espesor actual es mayor al inicial (posible error de medición).');
    return errors;
  }

  calculate(inputs: Record<string, any>): NormResult[] {
    const validationErrors = this.validate(inputs);
    if (validationErrors.length > 0 && validationErrors.some(e => !e.startsWith('Advertencia'))) {
      return [{
        passed: false,
        value: 'ERROR_VALIDACION',
        label: 'Error de entrada de datos',
        codeReference: 'API 570 §7.1',
        recommendations: validationErrors,
        severity: 'error',
        disclaimer: NORM_DISCLAIMER
      }];
    }

    const t_initial = Number(inputs.t_initial);
    const t_actual = Number(inputs.t_actual);
    const t_min = Number(inputs.t_min);
    const years = Number(inputs.years);

    const lossInches = Math.max(0, t_initial - t_actual);
    const corrosionRateInpy = lossInches / years;
    const corrosionRateMpy = corrosionRateInpy * 1000;
    const corrosionRateMmpy = corrosionRateInpy * 25.4;

    let remainingLifeYears = 0;
    if (corrosionRateInpy > 0) {
      remainingLifeYears = (t_actual - t_min) / corrosionRateInpy;
    } else {
      remainingLifeYears = 99;
    }

    const nextInspectionInterval = Math.min(remainingLifeYears / 2, 10);
    const isThicknessOk = t_actual >= t_min;
    const passed = isThicknessOk && remainingLifeYears >= 2;

    const recommendations: string[] = [];
    if (!isThicknessOk) {
      recommendations.push(`CRÍTICO: El espesor actual (${t_actual} in) es INFERIOR al mínimo requerido por diseño (${t_min} in). Retirar de servicio o reparar de inmediato segun API 570 Cap. 8.`);
    } else if (remainingLifeYears < 2) {
      recommendations.push(`ALERTA DE SEGURIDAD: La vida remanente calculada es de solo ${remainingLifeYears.toFixed(1)} años (< 2 años). Programar reemplazo de circuito de tubería.`);
    } else {
      recommendations.push(`La tubería se encuentra dentro de límites seguros con una Vida Remanente Estimada de ${remainingLifeYears.toFixed(1)} años.`);
      recommendations.push(`Frecuencia de inspección máxima recomendada por API 570: Próxima inspección en ${nextInspectionInterval.toFixed(1)} años (o 50% de la vida remanente).`);
    }

    let severity: 'success' | 'warning' | 'error' = 'success';
    if (!isThicknessOk || remainingLifeYears < 2) {
      severity = 'error';
    } else if (remainingLifeYears < 5) {
      severity = 'warning';
      recommendations.push('Atención: La vida remanente es menor a 5 años. Incrementar la densidad de puntos de monitoreo UT (TML/CML).');
    }

    return [
      {
        passed,
        value: Number(remainingLifeYears.toFixed(1)),
        unit: 'años',
        label: 'Vida Remanente Estimada (RL)',
        margin: Number(remainingLifeYears.toFixed(1)),
        codeReference: 'API 570 §7.1.1 — Ec. (1) & (2)',
        recommendations,
        severity,
        disclaimer: NORM_DISCLAIMER,
        details: {
          'Tasa de Corrosión (CR)': `${corrosionRateMpy.toFixed(1)} mpy (${corrosionRateMmpy.toFixed(3)} mm/año)`,
          'Pérdida Total de Metal': `${(lossInches * 1000).toFixed(1)} mils (${(lossInches * 25.4).toFixed(2)} mm)`,
          'Espesor Mínimo Requerido': `${t_min} in`,
          'Próxima Inspección (API 570 §6.3)': `${nextInspectionInterval.toFixed(1)} años`
        }
      }
    ];
  }
}
