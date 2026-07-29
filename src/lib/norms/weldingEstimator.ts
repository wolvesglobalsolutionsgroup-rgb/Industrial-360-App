import { NormCalculator, NormField, NormResult } from './core/NormCalculator';

export interface ElectrodeSpec {
  id: string;
  name: string;
  process: 'SMAW' | 'GTAW' | 'GMAW' | 'FCAW';
  yieldPct: number; // Rendimiento de deposición (%)
  stubLossPct: number; // Colilla / Desperdicio (%)
  note: string;
}

export const ELECTRODE_CATALOG: ElectrodeSpec[] = [
  { id: 'E6010', name: 'AWS E6010 (Celulósico Raíz)', process: 'SMAW', yieldPct: 58, stubLossPct: 42, note: 'Ideal para pases de raíz en tuberías de acero al carbono (API 5L Gr. B/X52).' },
  { id: 'E7018', name: 'AWS E7018-1 (Bajo Hidrógeno)', process: 'SMAW', yieldPct: 68, stubLossPct: 32, note: 'Polvo de hierro en revestimiento. Pases de relleno y presentación ASME B31.3.' },
  { id: 'E8018-B2', name: 'AWS E8018-B2 (Cr-Mo Alloy)', process: 'SMAW', yieldPct: 66, stubLossPct: 34, note: 'Acero aleado Cromo-Molibdeno para líneas de vapor y alta temperatura.' },
  { id: 'E308L-16', name: 'AWS E308L-16 (Inoxidable 304/316)', process: 'SMAW', yieldPct: 62, stubLossPct: 38, note: 'Electrodo rutilo-básico para aceros inoxidables austeníticos.' },
  { id: 'ER70S-6_TIG', name: 'AWS ER70S-6 (Varilla TIG 36")', process: 'GTAW', yieldPct: 95, stubLossPct: 5, note: 'Varilla sólida con desoxidantes Si/Mn. Pase de raíz 100% radiografiado.' },
  { id: 'ER70S-6_MIG', name: 'AWS ER70S-6 (Alambre Sólido MIG)', process: 'GMAW', yieldPct: 92, stubLossPct: 8, note: 'Alambre continuo para alta productividad en taller de prefabricación.' },
  { id: 'E71T-1M', name: 'AWS E71T-1M / E71T-8 (Tubular FCAW)', process: 'FCAW', yieldPct: 86, stubLossPct: 14, note: 'Alambre tubular con escoria para alta tasa de deposición en campo.' },
  { id: 'ERNiCrMo-3', name: 'AWS ERNiCrMo-3 (Inconel 625)', process: 'GTAW', yieldPct: 96, stubLossPct: 4, note: 'Aleación Níquel-Cromo-Molibdeno para revestimientos y servicio amargo H2S.' }
];

export class WeldingEstimatorCalculator implements NormCalculator {
  id = 'welding_estimator';
  name = 'Estimador de Consumo de Electrodos y Horas Hombre de Soldadura';
  standard = 'AWS D1.1 / ASME IX / API 1104 / Ratios de Campo O&G';
  version = '2023';
  description = 'Estimación del volumen de aporte, peso bruto/neto de electrodos (kg), cajas de 5 kg y rendimiento en Horas-Hombre (HH) por junta soldada.';
  category: 'soldadura' = 'soldadura';

  getFields(): NormField[] {
    return [
      {
        id: 'npsInches',
        label: 'Diámetro Nominal Tubería (NPS)',
        type: 'number',
        unit: 'pulgadas',
        defaultValue: 8,
        min: 0.5,
        max: 60,
        step: 0.5,
        description: 'Diámetro nominal de la junta de tubería a soldar.',
        normaReference: 'API 1104 §3.1'
      },
      {
        id: 'wallThicknessMm',
        label: 'Espesor Nominal de Pared (t)',
        type: 'number',
        unit: 'mm',
        defaultValue: 8.18,
        min: 1.0,
        max: 50.0,
        step: 0.1,
        description: 'Espesor de pared del bisel (ej: 8" Sch 40 = 8.18 mm).',
        normaReference: 'ASME B31.3 §304.1.2'
      },
      {
        id: 'jointCount',
        label: 'Número de Juntas a Soldar (N_juntas)',
        type: 'number',
        unit: 'juntas',
        defaultValue: 10,
        min: 1,
        max: 1000,
        step: 1,
        description: 'Cantidad total de pegues o juntas a tope en el proyecto.',
        normaReference: 'Estimación de Campo'
      },
      {
        id: 'electrodeId',
        label: 'Electrodo / Aporte Seleccionado',
        type: 'select',
        defaultValue: 'E7018',
        options: ELECTRODE_CATALOG.map(e => ({ value: e.id, label: e.name })),
        description: 'Tipo de electrodo según especificación de procedimiento de soldadura (WPS).',
        normaReference: 'AWS A5.1 / A5.18'
      }
    ];
  }

  validate(inputs: Record<string, any>): string[] {
    const errors: string[] = [];
    if (!inputs.npsInches || inputs.npsInches <= 0) errors.push('El diámetro NPS debe ser mayor a 0.');
    if (!inputs.wallThicknessMm || inputs.wallThicknessMm <= 0) errors.push('El espesor t debe ser mayor a 0 mm.');
    if (!inputs.jointCount || inputs.jointCount <= 0) errors.push('El número de juntas debe ser mayor a 0.');
    return errors;
  }

  calculate(inputs: Record<string, any>): NormResult[] {
    const errors = this.validate(inputs);
    if (errors.length > 0) {
      return [{
        passed: false,
        value: 'ERROR',
        label: 'Error de entrada de datos',
        codeReference: 'AWS / API 1104',
        recommendations: errors,
        severity: 'error'
      }];
    }

    const nps = Number(inputs.npsInches);
    const t = Number(inputs.wallThicknessMm);
    const jointCount = Number(inputs.jointCount);
    const electrodeId = String(inputs.electrodeId || 'E7018');

    const spec = ELECTRODE_CATALOG.find(e => e.id === electrodeId) || ELECTRODE_CATALOG[1];

    const OD = nps * 25.4; // mm
    const meanDiam = OD - t;
    const meanCirc = Math.PI * meanDiam;
    
    // Standard 75° included V-bevel angle + 2mm root gap estimation
    const areaSqMm = (t * t * Math.tan((37.5 * Math.PI) / 180)) + (2.0 * t);
    const volNetCuMm = areaSqMm * meanCirc * jointCount;
    const netKg = (volNetCuMm * 7.85) / 1e6; // Steel density 7.85 g/cm3

    const effDecimal = spec.yieldPct / 100;
    const grossKg = netKg / Math.max(effDecimal, 0.1);
    const boxes5kg = Math.ceil(grossKg / 5);

    // Man-Hours Estimation (HH = Horas-Hombre)
    // Field empirical ratio: ~0.15 HH per inch-diameter per mm thickness per joint
    const inchDiameterJoints = nps * jointCount;
    const hhPerJoint = 0.25 * (nps) * (t / 6.0); // HH por junta
    const totalManHours = Math.ceil(hhPerJoint * jointCount);

    return [
      {
        passed: true,
        value: `${grossKg.toFixed(1)} kg (${boxes5kg} cajas de 5kg)`,
        unit: 'Consumo Bruto Electrodo',
        label: `Estimación para ${jointCount} Juntas de ${nps}" (Sch ${t}mm)`,
        margin: Number(spec.yieldPct),
        codeReference: 'AWS D1.1 / Manual de Soldadura O&G',
        recommendations: [
          `Electrodo seleccionado: ${spec.name}. Eficiencia de deposición: ${spec.yieldPct}%.`,
          `Rendimiento de Horas-Hombre estimadas de soldador + calif.: ${totalManHours} HH (${(totalManHours / Math.max(jointCount, 1)).toFixed(1)} HH/junta).`,
          `Almacenar y mantener electrodos bajo bajo hidrógeno (E7018) en horno de mantenimiento a 120°C a 150°C según AWS D1.1.`,
          `Pulgadas-Diámetro totales del lote: ${inchDiameterJoints} in-p.`
        ],
        severity: 'success',
        details: {
          'Peso Neto Depositado': `${netKg.toFixed(2)} kg`,
          'Peso Bruto Requerido': `${grossKg.toFixed(1)} kg`,
          'Cajas de 5 kg Requeridas': `${boxes5kg} cajas`,
          'Desperdicio / Colillas': `${(grossKg - netKg).toFixed(1)} kg`,
          'Horas Hombre Estimadas (HH)': `${totalManHours} HH`,
          'In-Diámetro Totales': `${inchDiameterJoints} pulg-diám`
        }
      }
    ];
  }
}

/**
 * Función auxiliar para cálculo rápido de insumos de soldadura y Horas-Hombre
 */
export function calculateWeldingMaterialsAndHours(
  npsInches: number,
  wallThicknessMm: number,
  jointCount: number = 10,
  electrodeId: string = 'E7018'
) {
  const calc = new WeldingEstimatorCalculator();
  return calc.calculate({ npsInches, wallThicknessMm, jointCount, electrodeId });
}
