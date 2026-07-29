import { NormCalculator, NormField, NormResult } from './core/NormCalculator';
import { FLANGE_DATA, FlangeSpec } from './asme/asmeB165';

export interface PCC1Pass {
  passNumber: number;
  name: string;
  percent: number;
  description: string;
}

export const PCC1_PASSES: PCC1Pass[] = [
  { passNumber: 1, name: 'Pasada 1 (Alineación)', percent: 30, description: 'Apriete inicial cruzado al 30% del torque objetivo para asentar la empacadura.' },
  { passNumber: 2, name: 'Pasada 2 (Intermedia)', percent: 60, description: 'Apriete intermedio cruzado al 60% del torque objetivo verificando paralelismo de brida.' },
  { passNumber: 3, name: 'Pasada 3 (Torque Objetivo)', percent: 100, description: 'Apriete completo cruzado al 100% del torque objetivo según ASME PCC-1.' },
  { passNumber: 4, name: 'Pasada 4 (Circular Final)', percent: 100, description: 'Pasada circular continua en sentido horario al 100% para uniformar carga en todos los pernos.' }
];

export class ASMEPCC1Calculator implements NormCalculator {
  id = 'asme_pcc1';
  name = 'ASME PCC-1 — Torque de Apriete de Pernos y Secuencia Cruzada en Bridas';
  standard = 'ASME PCC-1 / Guidelines for Pressure Boundary Bolted Flange Joint Assembly';
  version = '2022';
  description = 'Cálculo del torque objetivo de apriete de pernos, momentos de tensión según coeficiente de fricción k, diámetro de copas/dados y protocolo de 4 pasadas (Star Pattern).';
  category: 'bridas' = 'bridas';

  getFields(): NormField[] {
    return [
      {
        id: 'rating',
        label: 'Clase de Presión (Rating)',
        type: 'select',
        defaultValue: '150#',
        options: [
          { value: '150#', label: 'Clase 150#' },
          { value: '300#', label: 'Clase 300#' },
          { value: '600#', label: 'Clase 600#' },
          { value: '900#', label: 'Clase 900#' },
          { value: '1500#', label: 'Clase 1500#' },
          { value: '2500#', label: 'Clase 2500#' }
        ],
        description: 'Clase de presión ASME de la brida.',
        normaReference: 'ASME B16.5 Tabla 2'
      },
      {
        id: 'nps',
        label: 'Diámetro Nominal Tubería (NPS)',
        type: 'select',
        defaultValue: '4"',
        options: [
          { value: '1/2"', label: '1/2"' },
          { value: '3/4"', label: '3/4"' },
          { value: '1"', label: '1"' },
          { value: '2"', label: '2"' },
          { value: '3"', label: '3"' },
          { value: '4"', label: '4"' },
          { value: '6"', label: '6"' },
          { value: '8"', label: '8"' },
          { value: '10"', label: '10"' },
          { value: '12"', label: '12"' },
          { value: '16"', label: '16"' },
          { value: '20"', label: '20"' },
          { value: '24"', label: '24"' }
        ],
        description: 'Diámetro nominal de la brida.',
        normaReference: 'ASME B16.5 §1.4'
      },
      {
        id: 'frictionK',
        label: 'Coeficiente de Fricción (k)',
        type: 'select',
        defaultValue: '0.16',
        options: [
          { value: '0.12', label: '0.12 — Lubricación pesada / Molikote / Anti-seize en pasta de níquel' },
          { value: '0.16', label: '0.16 — Lubricante estándar en rosca y cara de tuerca (Típico ASME PCC-1)' },
          { value: '0.20', label: '0.20 — Rosca limpia sin lubricante especial (Seco)' }
        ],
        description: 'Factor k de fricción en rosca y asentamiento de tuerca.',
        normaReference: 'ASME PCC-1 Tabla 2'
      }
    ];
  }

  validate(): string[] {
    return [];
  }

  calculate(inputs: Record<string, any>): NormResult[] {
    const rating = String(inputs.rating || '150#');
    const nps = String(inputs.nps || '4"');
    const k = Number(inputs.frictionK || 0.16);

    const spec: FlangeSpec | undefined = FLANGE_DATA[rating]?.[nps];

    if (!spec) {
      return [{
        passed: false,
        value: 'SIN_DATOS',
        label: 'Combinación Rating/NPS no encontrada',
        codeReference: 'ASME PCC-1 / B16.5',
        recommendations: ['Seleccione una combinación válida de Clase y NPS.'],
        severity: 'warning'
      }];
    }

    // Base torque adjustment according to friction factor k (baseline k=0.16)
    const factorK = k / 0.16;
    const targetTorqueFtLb = Math.round(spec.torqueFtLb * factorK);
    const targetTorqueNm = Math.round(spec.torqueNm * factorK);

    const pass30FtLb = Math.round(targetTorqueFtLb * 0.30);
    const pass60FtLb = Math.round(targetTorqueFtLb * 0.60);

    return [
      {
        passed: true,
        value: `${targetTorqueFtLb} ft-lb (${targetTorqueNm} N-m)`,
        unit: 'Torque Objetivo 100%',
        label: `Secuencia de Apriete ASME PCC-1 — Brida ${nps} Clase ${rating}`,
        margin: Number((k * 100).toFixed(0)),
        codeReference: 'ASME PCC-1 Tabla 3 / Apéndice J',
        recommendations: [
          `Pase 1 (30%): Aplicar ${pass30FtLb} ft-lb en patrón cruzado (Star Pattern) en los ${spec.holesCount} pernos.`,
          `Pase 2 (60%): Aplicar ${pass60FtLb} ft-lb en patrón cruzado verificando holgura uniforme.`,
          `Pase 3 (100%): Aplicar ${targetTorqueFtLb} ft-lb en patrón cruzado.`,
          `Pase 4 (Circular 100%): Aplicar ${targetTorqueFtLb} ft-lb continuo en sentido horario.`,
          `Usar dados hexagonales de ${spec.socketInches} (${spec.socketMm} mm) para tuercas de perno de ${spec.boltDiamInches}.`
        ],
        severity: 'success',
        details: {
          'Torque 100% (ft-lb)': `${targetTorqueFtLb} ft-lb`,
          'Torque 100% (N-m)': `${targetTorqueNm} N-m`,
          'Pase 1 (30%)': `${pass30FtLb} ft-lb`,
          'Pase 2 (60%)': `${pass60FtLb} ft-lb`,
          'Número de Pernos': `${spec.holesCount} x ${spec.boltDiamInches}`,
          'Dado / Copa Requerida': `${spec.socketInches} (${spec.socketMm} mm)`,
          'Coeficiente k Aplicado': `${k}`
        }
      }
    ];
  }
}

/**
 * Función auxiliar para cálculo rápido de torque ASME PCC-1
 */
export function calculatePCC1Torque(rating: string, nps: string, frictionK: number = 0.16) {
  const calc = new ASMEPCC1Calculator();
  return calc.calculate({ rating, nps, frictionK });
}
