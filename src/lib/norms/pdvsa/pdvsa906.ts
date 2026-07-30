import { NormCalculator, NormField, NormResult, NORM_DISCLAIMER } from '../types';

export class PDVSA906Calculator implements NormCalculator {
  id = 'pdvsa_906';
  name = 'PDVSA 906 — Criterios de Aceptación/Rechazo de Defectos de Soldadura NDT';
  standard = 'PDVSA 906';
  edition = '2020';
  reference = 'PDVSA PI-02-05-01 / PDVSA 906 / API 1104 Secc. 9';
  description = 'Evaluación de discontinuidades y defectos de soldadura detectados por Radiografía (RT) o Ultrasonido (UT) según la norma PDVSA 906 y API 1104.';
  category: 'soldadura' = 'soldadura';
  disclaimer = NORM_DISCLAIMER;

  getFields(): NormField[] {
    return [
      {
        id: 'defectType',
        label: 'Tipo de Discontinuidad / Defecto NDT',
        type: 'select',
        defaultValue: 'socavado',
        options: [
          { value: 'grieta', label: 'Grieta / Fisura (Cracks - C)' },
          { value: 'falta_fusion', label: 'Falta de Fusión / Penetración Incompleta (IF / IP)' },
          { value: 'socavado', label: 'Socavado / Caída de Borde (Undercutting - EU/IU)' },
          { value: 'porosidad', label: 'Porosidad Dispersa / Nido de Poros (Porosity - P)' },
          { value: 'inclusion_escoria', label: 'Inclusión de Escoria / Slag Inclusion (ISI/ESI)' }
        ],
        description: 'Tipo de hallazgo reportado en el informe radiográfico o ultrasonido NDT.',
        normaReference: 'PDVSA 906 §5.2 / API 1104 §9.3'
      },
      {
        id: 'defectLength',
        label: 'Longitud Individual del Defecto (L_defecto)',
        type: 'number',
        unit: 'mm',
        defaultValue: 12.0,
        min: 0.1,
        max: 500,
        step: 0.5,
        description: 'Dimensión longitudinal del defecto según placa radiográfica.',
        normaReference: 'API 1104 §9.3'
      },
      {
        id: 'accumulatedLength',
        label: 'Longitud Acumulada de Defectos en 300 mm de Soldadura',
        type: 'number',
        unit: 'mm',
        defaultValue: 20.0,
        min: 0,
        max: 300,
        step: 1.0,
        description: 'Suma de longitudes de defectos continuos en un tramo de 300 mm (12 pulg).',
        normaReference: 'API 1104 §9.3.9'
      },
      {
        id: 'wallThickness',
        label: 'Espesor Nominal de la Pared / Junta (t)',
        type: 'number',
        unit: 'mm',
        defaultValue: 9.53,
        min: 1.0,
        max: 50.0,
        step: 0.1,
        description: 'Espesor nominal del tubo o plancha soldada (ej: 9.53 mm = 3/8 pulg).',
        normaReference: 'PDVSA 906 §3.1'
      }
    ];
  }

  validate(inputs: Record<string, any>): string[] {
    const errors: string[] = [];
    if (!inputs.defectType) errors.push('Seleccione el tipo de defecto.');
    if (!inputs.defectLength || inputs.defectLength <= 0) errors.push('La longitud del defecto debe ser mayor a 0 mm.');
    if (!inputs.wallThickness || inputs.wallThickness <= 0) errors.push('El espesor de pared debe ser mayor a 0 mm.');
    return errors;
  }

  calculate(inputs: Record<string, any>): NormResult[] {
    const validationErrors = this.validate(inputs);
    if (validationErrors.length > 0) {
      return [{
        passed: false,
        value: 'ERROR_VALIDACION',
        label: 'Error de entrada de datos',
        codeReference: 'PDVSA 906 §5.1',
        recommendations: validationErrors,
        severity: 'error',
        disclaimer: NORM_DISCLAIMER
      }];
    }

    const defectType = String(inputs.defectType);
    const L = Number(inputs.defectLength);
    const L_acc = Number(inputs.accumulatedLength || L);
    const t = Number(inputs.wallThickness);

    let passed = false;
    let maxAllowedSingle = 0;
    let maxAllowedAcc = 0;
    let ruleText = '';
    const recommendations: string[] = [];

    switch (defectType) {
      case 'grieta':
        passed = false;
        ruleText = 'GRIETAS: Rechazadas en cualquier longitud o tamaño según PDVSA 906 / API 1104 §9.3.1.';
        recommendations.push('RECHAZADO: Toda grieta debe ser saneada mediante esmerilado profundo o biselado completo y volver a soldar con WPS calificado.');
        break;

      case 'falta_fusion':
        // API 1104 9.3.2: Unfitted Incomplete Penetration > 25.4mm (1 in) or > 8% weld length is rejected
        maxAllowedSingle = 25.4; // 1 inch
        maxAllowedAcc = 50.8; // 2 inches in 12 inches
        passed = L <= maxAllowedSingle && L_acc <= maxAllowedAcc;
        ruleText = `Falta de Fusión / Penetración: Máximo ${maxAllowedSingle} mm individual y ${maxAllowedAcc} mm acumulado en 300 mm.`;
        if (passed) {
          recommendations.push(`ACEPTADO: La longitud (${L} mm) no supera el límite de ${maxAllowedSingle} mm.`);
        } else {
          recommendations.push(`RECHAZADO: Penetración incompleta o falta de fusión (${L} mm) supera el límite permitido de ${maxAllowedSingle} mm.`);
          recommendations.push('Acción requerida: Sanear la raíz mediante gobing / amolado y resoldar.');
        }
        break;

      case 'socavado':
        // API 1104 9.3.11: Undercutting adjacent to cover or root bead > 0.8mm depth or > 50mm in 300mm length
        maxAllowedSingle = Math.min(50.0, 0.15 * 300); // 50mm
        maxAllowedAcc = 50.0;
        passed = L <= maxAllowedSingle && L_acc <= maxAllowedAcc;
        ruleText = `Socavado: Longitud máxima acumulada ${maxAllowedAcc} mm en 300 mm de junta. Profundidad máx 0.8 mm.`;
        if (passed) {
          recommendations.push(`ACEPTADO: El socavado (${L} mm) está dentro del límite máximo de ${maxAllowedAcc} mm.`);
        } else {
          recommendations.push(`RECHAZADO: Socavado (${L} mm) excede la norma PDVSA 906 / API 1104.`);
          recommendations.push('Acción requerida: Rellenar con pase de presentación (cap weld) y amolar suavemente.');
        }
        break;

      case 'porosidad':
        // API 1104 9.3.9: Individual porosity <= 3.2mm (1/8 in) or 25% of wall thickness
        maxAllowedSingle = Math.min(3.2, 0.25 * t);
        maxAllowedAcc = 12.7; // Cluster porosity <= 1/2 in
        passed = L <= maxAllowedSingle && L_acc <= maxAllowedAcc;
        ruleText = `Porosidad: Diámetro máximo individual ${maxAllowedSingle.toFixed(1)} mm. Nido de poros máx ${maxAllowedAcc} mm.`;
        if (passed) {
          recommendations.push(`ACEPTADO: La porosidad (${L} mm) está dentro del diámetro máximo permitido de ${maxAllowedSingle.toFixed(1)} mm.`);
        } else {
          recommendations.push(`RECHAZADO: El tamaño del poro o nido de poros (${L} mm) supera el máximo de ${maxAllowedSingle.toFixed(1)} mm.`);
          recommendations.push('Acción requerida: Esmerilar la zona con porosidad y resoldar controlando la humedad del electrodo / gas de protección.');
        }
        break;

      case 'inclusion_escoria':
        // API 1104 9.3.8: Slag inclusion length <= 12.7mm (1/2 in)
        maxAllowedSingle = 12.7; // 1/2 in
        maxAllowedAcc = 50.8; // 2 in per 12 in
        passed = L <= maxAllowedSingle && L_acc <= maxAllowedAcc;
        ruleText = `Inclusión de Escoria: Longitud máxima individual ${maxAllowedSingle} mm (1/2 pulg).`;
        if (passed) {
          recommendations.push(`ACEPTADO: La inclusión de escoria (${L} mm) es menor al límite de ${maxAllowedSingle} mm.`);
        } else {
          recommendations.push(`RECHAZADO: La inclusión de escoria (${L} mm) excede los ${maxAllowedSingle} mm permitidos.`);
          recommendations.push('Acción requerida: Remover la escoria atrapada entre pases con disco de pulir resoldar.');
        }
        break;
    }

    const margin = maxAllowedSingle > 0 ? ((maxAllowedSingle - L) / maxAllowedSingle) * 100 : 0;

    return [
      {
        passed,
        value: passed ? 'ACEPTADO' : 'RECHAZADO',
        unit: '',
        label: 'Dictamen NDT según PDVSA 906 / API 1104',
        margin: Number(margin.toFixed(1)),
        codeReference: 'PDVSA 906 §5.2 / API 1104 §9.3',
        recommendations,
        severity: passed ? 'success' : 'error',
        disclaimer: NORM_DISCLAIMER,
        details: {
          'Tipo Defecto': defectType.toUpperCase(),
          'Longitud Medida': `${L} mm`,
          'Longitud Acumulada (300mm)': `${L_acc} mm`,
          'Límite Máximo Permitido': maxAllowedSingle > 0 ? `${maxAllowedSingle} mm` : '0 mm (Cero tolerancia)',
          'Criterio Aplicado': ruleText
        }
      }
    ];
  }
}
