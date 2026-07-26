import { NormCalculator, NormField, NormResult } from '../core/NormCalculator';

export class API570Calculator implements NormCalculator {
  id = 'api_570';
  name = 'API 570 — Vida Remanente y Tasa de Corrosión en Tuberías';
  standard = 'API 570 / Piping Inspection Code: In-service Inspection, Rating, Repair, and Alteration of Piping Systems';
  version = '2020';
  description = 'Cálculo de la tasa de corrosión de largo/corto plazo, vida remanente estimada y frecuencia máxima de inspección según API 570.';
  category: 'inspeccion' = 'inspeccion';

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
        severity: 'error'
      }];
    }

    const t_initial = Number(inputs.t_initial);
    const t_actual = Number(inputs.t_actual);
    const t_min = Number(inputs.t_min);
    const years = Number(inputs.years);

    // 1. Corrosion rate (mpy = mils per year, and inches/year or mm/year)
    // 1 mil = 0.001 inch
    const lossInches = Math.max(0, t_initial - t_actual);
    const corrosionRateInpy = lossInches / years; // inches per year
    const corrosionRateMpy = corrosionRateInpy * 1000; // mils per year
    const corrosionRateMmpy = corrosionRateInpy * 25.4; // mm per year

    // 2. Remaining life in years
    let remainingLifeYears = 0;
    if (corrosionRateInpy > 0) {
      remainingLifeYears = (t_actual - t_min) / corrosionRateInpy;
    } else {
      remainingLifeYears = 99; // negligible corrosion
    }

    // 3. API 570 Inspection Interval = min(Remaining Life / 2, 10 years)
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
