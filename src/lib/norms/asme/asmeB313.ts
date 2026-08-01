import { NormCalculator, NormField, NormResult, NORM_DISCLAIMER } from '../types';

export class ASMEB313Calculator implements NormCalculator {
  id = 'asme_b313';
  name = 'ASME B31.3 — Espesor Mínimo de Pared en Tuberías de Proceso';
  standard = 'ASME B31.3';
  edition = '2022';
  reference = 'ASME B31.3 Process Piping Code §304.1.2';
  description = 'Cálculo del espesor mínimo de pared requerido y presión de diseño admisible para tuberías de proceso en refinerías y plantas petroquímicas.';
  category: 'tuberias' = 'tuberias';
  disclaimer = NORM_DISCLAIMER;

  getFields(): NormField[] {
    return [
      {
        id: 'P',
        label: 'Presión Interna de Diseño (P)',
        type: 'number',
        unit: 'psi',
        defaultValue: 300,
        min: 10,
        max: 10000,
        step: 5,
        description: 'Presión manométrica interna de diseño del fluido procesado.',
        normaReference: 'ASME B31.3 §304.1.2'
      },
      {
        id: 'D',
        label: 'Diámetro Exterior de la Tubería (D)',
        type: 'number',
        unit: 'pulgadas',
        defaultValue: 8.625,
        min: 0.5,
        max: 60,
        step: 0.125,
        description: 'Diámetro exterior nominal de la tubería.',
        normaReference: 'ASME B31.3 §304.1.2'
      },
      {
        id: 'S',
        label: 'Esfuerzo Admisible del Material (S)',
        type: 'select',
        defaultValue: '20000',
        options: [
          { value: '20000_A106', label: 'ASTM A106 Gr. B (20,000 psi @ 100°F)' },
          { value: '17100_A106', label: 'ASTM A106 Gr. B (17,100 psi @ 400°F)' },
          { value: '20000_A53', label: 'ASTM A53 Gr. B (20,000 psi @ 100°F)' },
          { value: '16700_TP304', label: 'ASTM A312 TP304 (16,700 psi @ 100°F)' },
          { value: '16700_TP316', label: 'ASTM A312 TP316 (16,700 psi @ 100°F)' },
          { value: '21400_X52', label: 'API 5L X52 (21,400 psi @ 100°F)' }
        ],
        description: 'Esfuerzo máximo permisible del acero a la temperatura de operación.',
        normaReference: 'ASME B31.3 Tabla A-1'
      },
      {
        id: 'E',
        label: 'Factor de Eficiencia de Junta / Calidad (E)',
        type: 'select',
        defaultValue: '1.0',
        options: [
          { value: '1.0', label: '1.00 — Sin costura (Seamless / API 5L)' },
          { value: '0.85', label: '0.85 — Soldadura ERW / EFW radiografiada spot' },
          { value: '0.80', label: '0.80 — Soldadura EFW sin radiografía' },
          { value: '0.60', label: '0.60 — Soldadura en espiral continua (FBW)' }
        ],
        description: 'Factor de calidad de la junta longitudinal según radiografía.',
        normaReference: 'ASME B31.3 Tabla 302.3.4'
      },
      {
        id: 'Y',
        label: 'Coeficiente de Temperatura (Y)',
        type: 'select',
        defaultValue: '0.4',
        options: [
          { value: '0.4', label: '0.4 — Aceros ferríticos / al carbono T ≤ 900°F (482°C)' },
          { value: '0.5', label: '0.5 — Aceros austeníticos T ≤ 900°F (482°C)' },
          { value: '0.7', label: '0.7 — Aceros ferríticos T ≥ 1150°F (621°C)' }
        ],
        description: 'Coeficiente empírico de distribución de esfuerzo.',
        normaReference: 'ASME B31.3 Tabla 304.1.1'
      },
      {
        id: 'c',
        label: 'Tolerancia de Corrosión / Roscado / Desgaste (c)',
        type: 'number',
        unit: 'pulgadas',
        defaultValue: 0.063,
        min: 0,
        max: 0.5,
        step: 0.005,
        description: 'Margen adicional por corrosión esperada o roscado (típico 1.6 mm / 0.063 in).',
        normaReference: 'ASME B31.3 §304.1.1'
      },
      {
        id: 't_nom',
        label: 'Espesor Nominal Seleccionado (t_nom)',
        type: 'number',
        unit: 'pulgadas',
        defaultValue: 0.322,
        min: 0.05,
        max: 2.0,
        step: 0.001,
        description: 'Espesor comercial de la tubería elegida (ej: Sch 40 en 8" = 0.322 in).',
        normaReference: 'ASME B31.3 §304.1.2'
      }
    ];
  }

  validate(inputs: Record<string, any>): string[] {
    const errors: string[] = [];
    if (!inputs.P || inputs.P <= 0) errors.push('La presión P debe ser mayor a 0 psi.');
    if (!inputs.D || inputs.D <= 0) errors.push('El diámetro exterior D debe ser mayor a 0.');
    if (!inputs.S || inputs.S <= 0) errors.push('El esfuerzo S debe ser mayor a 0.');
    if (!inputs.t_nom || inputs.t_nom <= 0) errors.push('El espesor nominal t_nom debe ser mayor a 0.');
    return errors;
  }

  calculate(inputs: Record<string, any>): NormResult[] {
    const validationErrors = this.validate(inputs);
    if (validationErrors.length > 0) {
      return [{
        passed: false,
        value: 'ERROR_VALIDACION',
        label: 'Error de entrada de datos',
        codeReference: 'ASME B31.3 §304.1.2',
        recommendations: validationErrors,
        severity: 'error',
        disclaimer: NORM_DISCLAIMER
      }];
    }

    const P = Number(inputs.P);
    const D = Number(inputs.D);
    const S = Number(String(inputs.S || 20000).split('_')[0]);
    const E = Number(inputs.E || 1.0);
    const Y = Number(inputs.Y || 0.4);
    const c = Number(inputs.c || 0.063);
    const t_nom = Number(inputs.t_nom || 0.322);

    // 1. Calculate pressure design thickness t_p
    // t = (P * D) / (2 * (S*E + P*Y))
    const num = P * D;
    const den = 2 * (S * E + P * Y);
    const t_p = num / den;

    // 2. Minimum required thickness t_m = t_p + c
    const t_min = t_p + c;

    // 3. Accounting for 12.5% mill tolerance on nominal pipe
    const t_after_mill = t_nom * 0.875;
    const passed = t_after_mill >= t_min;

    // 4. Maximum Allowable Working Pressure (MAWP) for the selected pipe
    const t_net = t_nom - c;
    const P_max = (2 * S * E * t_net) / (D - 2 * Y * t_net);

    const margin = ((t_after_mill - t_min) / t_min) * 100;

    const recommendations: string[] = [];
    if (passed) {
      recommendations.push(`CUMPLE: El espesor nominal (${t_nom} in) descontando 12.5% de tolerancia de fabricación (${t_after_mill.toFixed(3)} in) supera el mínimo requerido por ASME B31.3 (${t_min.toFixed(3)} in).`);
      recommendations.push(`La tubería seleccionada soporta hasta ${P_max.toFixed(1)} psi a la temperatura de diseño.`);
    } else {
      recommendations.push(`NO CUMPLE: El espesor nominal de ${t_nom} in es insuficiente para soportar la presión de ${P} psi con la tolerancia de corrosión especificada.`);
      recommendations.push(`Aumentar la cédula del tubo (Schedule superior) a mínimo ${(t_min / 0.875).toFixed(3)} in.`);
    }

    let severity: 'success' | 'warning' | 'error' = 'success';
    if (!passed) {
      severity = 'error';
    } else if (margin < 10) {
      severity = 'warning';
      recommendations.push('Atención: El margen sobre el espesor mínimo es menor al 10%.');
    }

    return [
      {
        passed,
        value: Number(t_min.toFixed(4)),
        unit: 'pulgadas',
        label: 'Espesor Mínimo Requerido (t_min)',
        margin: Number(margin.toFixed(1)),
        codeReference: 'ASME B31.3 §304.1.2 — Ec. (3a)',
        recommendations,
        severity,
        disclaimer: NORM_DISCLAIMER,
        details: {
          'Espesor por Presión (t_p)': `${t_p.toFixed(4)} in`,
          'Tolerancia Corrosión (c)': `${c.toFixed(4)} in`,
          'Espesor Nominal Seleccionado': `${t_nom} in`,
          'Espesor Mínimo Comercial (-12.5%)': `${t_after_mill.toFixed(4)} in`,
          'Presión Máxima Admisible (MAWP)': `${P_max.toFixed(1)} psi`
        }
      }
    ];
  }
}
