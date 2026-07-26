import { NormCalculator, NormField, NormResult } from '../core/NormCalculator';

export class ASMEB31GCalculator implements NormCalculator {
  id = 'asme_b31g';
  name = 'ASME B31G — Presión Remanente en Tuberías con Corrosión';
  standard = 'ASME B31G / Manual for Determining Remaining Strength of Corroded Pipelines';
  version = '2021';
  description = 'Evaluación de la resistencia estructural remanente y presión máxima admisible (MAOP) en tuberías con pérdida de metal por corrosión.';
  category: 'tuberias' = 'tuberias';

  getFields(): NormField[] {
    return [
      {
        id: 'D',
        label: 'Diámetro Exterior Tubería (D)',
        type: 'number',
        unit: 'pulgadas',
        defaultValue: 16.0,
        min: 2,
        max: 60,
        step: 0.1,
        description: 'Diámetro nominal exterior del tubo según API 5L.',
        normaReference: 'ASME B31G §2.1'
      },
      {
        id: 't',
        label: 'Espesor Nominal de Pared (t)',
        type: 'number',
        unit: 'pulgadas',
        defaultValue: 0.375,
        min: 0.05,
        max: 2.0,
        step: 0.001,
        description: 'Espesor original o nominal de la tubería sin corrosión.',
        normaReference: 'ASME B31G §2.1'
      },
      {
        id: 'd',
        label: 'Profundidad Máxima de Corrosión (d)',
        type: 'number',
        unit: 'pulgadas',
        defaultValue: 0.125,
        min: 0.001,
        max: 2.0,
        step: 0.001,
        description: 'Profundidad máxima medida de la anomalía o cavidad de corrosión.',
        normaReference: 'ASME B31G §2.2'
      },
      {
        id: 'L',
        label: 'Longitud Axial de la Anomalía (L)',
        type: 'number',
        unit: 'pulgadas',
        defaultValue: 4.5,
        min: 0.1,
        max: 100,
        step: 0.1,
        description: 'Longitud de la corrosión a lo largo del eje longitudinal del tubo.',
        normaReference: 'ASME B31G §2.2'
      },
      {
        id: 'smys',
        label: 'Límite Elástico Especificado (SMYS)',
        type: 'select',
        defaultValue: '52000',
        options: [
          { value: '35000', label: 'API 5L Gr. B (35,000 psi)' },
          { value: '42000', label: 'API 5L X42 (42,000 psi)' },
          { value: '46000', label: 'API 5L X46 (46,000 psi)' },
          { value: '52000', label: 'API 5L X52 (52,000 psi)' },
          { value: '60000', label: 'API 5L X60 (60,000 psi)' },
          { value: '65000', label: 'API 5L X65 (65,000 psi)' },
          { value: '70000', label: 'API 5L X70 (70,000 psi)' }
        ],
        description: 'Especificación de resistencia del acero según API 5L.',
        normaReference: 'ASME B31G §1.3'
      },
      {
        id: 'F',
        label: 'Factor de Diseño de Clase de Ubicación (F)',
        type: 'select',
        defaultValue: '0.72',
        options: [
          { value: '0.72', label: 'Clase 1 — Áreas desérticas / rurales (F = 0.72)' },
          { value: '0.60', label: 'Clase 2 — Áreas semi-urbanas (F = 0.60)' },
          { value: '0.50', label: 'Clase 3 — Áreas residenciales / comerciales (F = 0.50)' },
          { value: '0.40', label: 'Clase 4 — Edificaciones de alta densidad (F = 0.40)' }
        ],
        description: 'Factor de seguridad según densidad poblacional (ASME B31.8).',
        normaReference: 'ASME B31.8 Tab. 841.1.6-1'
      },
      {
        id: 'P_oper',
        label: 'Presión de Operación Actual (P_oper)',
        type: 'number',
        unit: 'psi',
        defaultValue: 650,
        min: 10,
        max: 5000,
        step: 10,
        description: 'Presión de servicio u operación del gasoducto/oleoducto.',
        normaReference: 'ASME B31G §3.1'
      }
    ];
  }

  validate(inputs: Record<string, any>): string[] {
    const errors: string[] = [];
    if (!inputs.D || inputs.D <= 0) errors.push('El diámetro D debe ser mayor a 0.');
    if (!inputs.t || inputs.t <= 0) errors.push('El espesor t debe ser mayor a 0.');
    if (!inputs.d || inputs.d <= 0) errors.push('La profundidad de corrosión d debe ser mayor a 0.');
    if (inputs.d >= inputs.t) errors.push('La profundidad d no puede ser mayor o igual al espesor t.');
    if (!inputs.L || inputs.L <= 0) errors.push('La longitud L debe ser mayor a 0.');
    return errors;
  }

  calculate(inputs: Record<string, any>): NormResult[] {
    const validationErrors = this.validate(inputs);
    if (validationErrors.length > 0) {
      return [{
        passed: false,
        value: 'ERROR_VALIDACION',
        label: 'Error de entrada de datos',
        codeReference: 'ASME B31G §1.4',
        recommendations: validationErrors,
        severity: 'error'
      }];
    }

    const D = Number(inputs.D);
    const t = Number(inputs.t);
    const d = Number(inputs.d);
    const L = Number(inputs.L);
    const smys = Number(inputs.smys || 52000);
    const F = Number(inputs.F || 0.72);
    const P_oper = Number(inputs.P_oper || 650);

    // 1. Check max depth ratio d/t
    const depthRatio = d / t;
    const isDepthOk = depthRatio <= 0.80; // ASME B31G states if d > 80% t, replace/repair

    // 2. Compute Parameter A
    const A = 0.893 * (L / Math.sqrt(D * t));

    // 3. Compute Folias Factor M
    let M = 1.0;
    if (A <= 4.0) {
      M = Math.sqrt(1 + 0.6275 * (Math.pow(L, 2) / (D * t)) - 0.003375 * (Math.pow(L, 4) / (Math.pow(D, 2) * Math.pow(t, 2))));
    } else {
      M = 0.032 * (Math.pow(L, 2) / (D * t)) + 3.3;
    }

    // 4. Original Design Pressure (un-corroded)
    const P_design = (2 * t * smys * F) / D;

    // 5. Failure Pressure Pf
    let Pf = 0;
    if (A <= 4.0) {
      const num = 1 - (2 / 3) * (d / t);
      const den = 1 - (2 / 3) * (d / (t * M));
      Pf = ((2 * t * smys) / D) * (num / den);
    } else {
      Pf = ((2 * t * smys) / D) * (1 - (d / t));
    }

    // Safe Maximum Operating Pressure P_safe
    const P_safe = Math.min(Pf * F, P_design);
    const margin = ((P_safe - P_oper) / P_oper) * 100;
    const isPressureOk = P_safe >= P_oper;
    const passed = isDepthOk && isPressureOk;

    const recommendations: string[] = [];
    if (!isDepthOk) {
      recommendations.push(`CRÍTICO: La profundidad de corrosión (${(depthRatio * 100).toFixed(1)}%) supera el límite máximo del 80% permitido por ASME B31G. Se requiere reemplazo de junta o camisa no metálica / envolvente metálica (B-Sleeve).`);
    } else {
      recommendations.push(`Profundidad de corrosión dentro del rango permitido (${(depthRatio * 100).toFixed(1)}% ≤ 80%).`);
    }

    if (!isPressureOk) {
      recommendations.push(`ALERTA: La presión de operación actual (${P_oper} psi) supera la Presión Segura Remanente (${P_safe.toFixed(1)} psi). Desrate de presión inmediato requerido.`);
    } else {
      recommendations.push(`Presión segura remanente (${P_safe.toFixed(1)} psi) es adecuada para operar a ${P_oper} psi con un margen del ${margin.toFixed(1)}%.`);
    }

    let severity: 'success' | 'warning' | 'error' = 'success';
    if (!isDepthOk || !isPressureOk) {
      severity = 'error';
    } else if (margin < 15) {
      severity = 'warning';
      recommendations.push('Atención: El margen de seguridad operativo es inferior al 15%. Monitorear con UT periódico.');
    }

    return [
      {
        passed,
        value: Number(P_safe.toFixed(1)),
        unit: 'psi',
        label: 'Presión Máxima Segura Remanente (MAOP_safe)',
        margin: Number(margin.toFixed(1)),
        codeReference: 'ASME B31G §3.2 — Ec. (3-1)',
        recommendations,
        severity,
        details: {
          'Profundidad d/t': `${(depthRatio * 100).toFixed(1)}%`,
          'Factor Folias (M)': Number(M.toFixed(3)),
          'Parámetro A': Number(A.toFixed(3)),
          'Presión de Diseño Original': `${P_design.toFixed(1)} psi`,
          'Presión Estimada de Falla (Pf)': `${Pf.toFixed(1)} psi`,
          'Presión Operación': `${P_oper} psi`
        }
      }
    ];
  }
}
