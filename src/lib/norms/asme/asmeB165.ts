import { NormCalculator, NormField, NormResult } from '../core/NormCalculator';

export interface FlangeSpec {
  nps: string;
  odMm: number;
  thicknessMm: number;
  bcdMm: number;
  holesCount: number;
  holeDiamInches: string;
  boltDiamInches: string;
  socketInches: string;
  socketMm: number;
  torqueFtLb: number;
  torqueNm: number;
}

export const FLANGE_DATA_MATRIX: Record<string, Record<string, FlangeSpec>> = {
  '150#': {
    '1/2"': { nps: '1/2"', odMm: 89, thicknessMm: 11.2, bcdMm: 60.3, holesCount: 4, holeDiamInches: '5/8"', boltDiamInches: '1/2"-13 UNC', socketInches: '7/8"', socketMm: 22, torqueFtLb: 60, torqueNm: 81 },
    '3/4"': { nps: '3/4"', odMm: 98, thicknessMm: 12.7, bcdMm: 69.8, holesCount: 4, holeDiamInches: '5/8"', boltDiamInches: '1/2"-13 UNC', socketInches: '7/8"', socketMm: 22, torqueFtLb: 60, torqueNm: 81 },
    '1"': { nps: '1"', odMm: 108, thicknessMm: 14.3, bcdMm: 79.4, holesCount: 4, holeDiamInches: '5/8"', boltDiamInches: '1/2"-13 UNC', socketInches: '7/8"', socketMm: 22, torqueFtLb: 60, torqueNm: 81 },
    '1-1/2"': { nps: '1-1/2"', odMm: 127, thicknessMm: 17.5, bcdMm: 98.4, holesCount: 4, holeDiamInches: '5/8"', boltDiamInches: '1/2"-13 UNC', socketInches: '7/8"', socketMm: 22, torqueFtLb: 60, torqueNm: 81 },
    '2"': { nps: '2"', odMm: 152, thicknessMm: 19.1, bcdMm: 120.7, holesCount: 4, holeDiamInches: '3/4"', boltDiamInches: '5/8"-11 UNC', socketInches: '1-1/16"', socketMm: 27, torqueFtLb: 120, torqueNm: 163 },
    '3"': { nps: '3"', odMm: 191, thicknessMm: 23.9, bcdMm: 152.4, holesCount: 4, holeDiamInches: '3/4"', boltDiamInches: '5/8"-11 UNC', socketInches: '1-1/16"', socketMm: 27, torqueFtLb: 120, torqueNm: 163 },
    '4"': { nps: '4"', odMm: 229, thicknessMm: 23.9, bcdMm: 190.5, holesCount: 8, holeDiamInches: '3/4"', boltDiamInches: '5/8"-11 UNC', socketInches: '1-1/16"', socketMm: 27, torqueFtLb: 120, torqueNm: 163 },
    '6"': { nps: '6"', odMm: 279, thicknessMm: 25.4, bcdMm: 241.3, holesCount: 8, holeDiamInches: '7/8"', boltDiamInches: '3/4"-10 UNC', socketInches: '1-1/4"', socketMm: 32, torqueFtLb: 200, torqueNm: 271 },
    '8"': { nps: '8"', odMm: 343, thicknessMm: 28.6, bcdMm: 298.5, holesCount: 8, holeDiamInches: '7/8"', boltDiamInches: '3/4"-10 UNC', socketInches: '1-1/4"', socketMm: 32, torqueFtLb: 200, torqueNm: 271 },
    '10"': { nps: '10"', odMm: 406, thicknessMm: 30.2, bcdMm: 362.0, holesCount: 12, holeDiamInches: '1"', boltDiamInches: '7/8"-9 UNC', socketInches: '1-7/16"', socketMm: 36, torqueFtLb: 320, torqueNm: 434 },
    '12"': { nps: '12"', odMm: 483, thicknessMm: 31.8, bcdMm: 431.8, holesCount: 12, holeDiamInches: '1"', boltDiamInches: '7/8"-9 UNC', socketInches: '1-7/16"', socketMm: 36, torqueFtLb: 320, torqueNm: 434 }
  },
  '300#': {
    '1/2"': { nps: '1/2"', odMm: 95, thicknessMm: 14.3, bcdMm: 66.7, holesCount: 4, holeDiamInches: '5/8"', boltDiamInches: '1/2"-13 UNC', socketInches: '7/8"', socketMm: 22, torqueFtLb: 70, torqueNm: 95 },
    '3/4"': { nps: '3/4"', odMm: 117, thicknessMm: 15.9, bcdMm: 82.6, holesCount: 4, holeDiamInches: '3/4"', boltDiamInches: '5/8"-11 UNC', socketInches: '1-1/16"', socketMm: 27, torqueFtLb: 130, torqueNm: 176 },
    '1"': { nps: '1"', odMm: 124, thicknessMm: 17.5, bcdMm: 88.9, holesCount: 4, holeDiamInches: '3/4"', boltDiamInches: '5/8"-11 UNC', socketInches: '1-1/16"', socketMm: 27, torqueFtLb: 130, torqueNm: 176 },
    '2"': { nps: '2"', odMm: 165, thicknessMm: 22.4, bcdMm: 127.0, holesCount: 8, holeDiamInches: '3/4"', boltDiamInches: '5/8"-11 UNC', socketInches: '1-1/16"', socketMm: 27, torqueFtLb: 120, torqueNm: 163 },
    '3"': { nps: '3"', odMm: 210, thicknessMm: 28.6, bcdMm: 168.3, holesCount: 8, holeDiamInches: '7/8"', boltDiamInches: '3/4"-10 UNC', socketInches: '1-1/4"', socketMm: 32, torqueFtLb: 200, torqueNm: 271 },
    '4"': { nps: '4"', odMm: 254, thicknessMm: 31.8, bcdMm: 200.0, holesCount: 8, holeDiamInches: '7/8"', boltDiamInches: '3/4"-10 UNC', socketInches: '1-1/4"', socketMm: 32, torqueFtLb: 200, torqueNm: 271 },
    '6"': { nps: '6"', odMm: 318, thicknessMm: 36.5, bcdMm: 269.9, holesCount: 12, holeDiamInches: '7/8"', boltDiamInches: '3/4"-10 UNC', socketInches: '1-1/4"', socketMm: 32, torqueFtLb: 200, torqueNm: 271 },
    '8"': { nps: '8"', odMm: 381, thicknessMm: 41.3, bcdMm: 330.2, holesCount: 12, holeDiamInches: '1"', boltDiamInches: '7/8"-9 UNC', socketInches: '1-7/16"', socketMm: 36, torqueFtLb: 320, torqueNm: 434 },
    '10"': { nps: '10"', odMm: 445, thicknessMm: 47.6, bcdMm: 387.4, holesCount: 16, holeDiamInches: '1-1/8"', boltDiamInches: '1"-8 UNC', socketInches: '1-5/8"', socketMm: 41, torqueFtLb: 500, torqueNm: 678 },
    '12"': { nps: '12"', odMm: 521, thicknessMm: 50.8, bcdMm: 457.2, holesCount: 16, holeDiamInches: '1-1/4"', boltDiamInches: '1-1/8"-8 UN', socketInches: '1-13/16"', socketMm: 46, torqueFtLb: 710, torqueNm: 963 }
  },
  '600#': {
    '1/2"': { nps: '1/2"', odMm: 95, thicknessMm: 14.3, bcdMm: 66.7, holesCount: 4, holeDiamInches: '5/8"', boltDiamInches: '1/2"-13 UNC', socketInches: '7/8"', socketMm: 22, torqueFtLb: 70, torqueNm: 95 },
    '1"': { nps: '1"', odMm: 124, thicknessMm: 17.5, bcdMm: 88.9, holesCount: 4, holeDiamInches: '3/4"', boltDiamInches: '5/8"-11 UNC', socketInches: '1-1/16"', socketMm: 27, torqueFtLb: 130, torqueNm: 176 },
    '2"': { nps: '2"', odMm: 165, thicknessMm: 25.4, bcdMm: 127.0, holesCount: 8, holeDiamInches: '3/4"', boltDiamInches: '5/8"-11 UNC', socketInches: '1-1/16"', socketMm: 27, torqueFtLb: 140, torqueNm: 190 },
    '3"': { nps: '3"', odMm: 210, thicknessMm: 31.8, bcdMm: 168.3, holesCount: 8, holeDiamInches: '7/8"', boltDiamInches: '3/4"-10 UNC', socketInches: '1-1/4"', socketMm: 32, torqueFtLb: 220, torqueNm: 298 },
    '4"': { nps: '4"', odMm: 273, thicknessMm: 38.1, bcdMm: 215.9, holesCount: 8, holeDiamInches: '1"', boltDiamInches: '7/8"-9 UNC', socketInches: '1-7/16"', socketMm: 36, torqueFtLb: 360, torqueNm: 488 },
    '6"': { nps: '6"', odMm: 356, thicknessMm: 47.6, bcdMm: 292.1, holesCount: 12, holeDiamInches: '1-1/8"', boltDiamInches: '1"-8 UNC', socketInches: '1-5/8"', socketMm: 41, torqueFtLb: 550, torqueNm: 746 },
    '8"': { nps: '8"', odMm: 419, thicknessMm: 55.6, bcdMm: 349.3, holesCount: 12, holeDiamInches: '1-1/4"', boltDiamInches: '1-1/8"-8 UN', socketInches: '1-13/16"', socketMm: 46, torqueFtLb: 800, torqueNm: 1085 },
    '10"': { nps: '10"', odMm: 508, thicknessMm: 63.5, bcdMm: 431.8, holesCount: 16, holeDiamInches: '1-3/8"', boltDiamInches: '1-1/4"-8 UN', socketInches: '2"', socketMm: 50, torqueFtLb: 1150, torqueNm: 1559 },
    '12"': { nps: '12"', odMm: 559, thicknessMm: 66.7, bcdMm: 489.0, holesCount: 20, holeDiamInches: '1-3/8"', boltDiamInches: '1-1/4"-8 UN', socketInches: '2"', socketMm: 50, torqueFtLb: 1200, torqueNm: 1627 }
  }
};

export class ASMEB165Calculator implements NormCalculator {
  id = 'asme_b165';
  name = 'ASME B16.5 — Matriz Dimensional y Torques de Bridas';
  standard = 'ASME B16.5 / Pipe Flanges and Flanged Fittings';
  version = '2020';
  description = 'Consulta rápida de dimensiones de bridas, diámetro de pernos, número de orificios y torque de apriete recomendado (ft-lb / N-m).';
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
          { value: '600#', label: 'Clase 600#' }
        ],
        description: 'Clase de presión ASME de la brida.',
        normaReference: 'ASME B16.5 Tabla 2'
      },
      {
        id: 'nps',
        label: 'Tamaño Nominal de Tubería (NPS)',
        type: 'select',
        defaultValue: '4"',
        options: [
          { value: '1/2"', label: '1/2" (DN15)' },
          { value: '3/4"', label: '3/4" (DN20)' },
          { value: '1"', label: '1" (DN25)' },
          { value: '1-1/2"', label: '1-1/2" (DN40)' },
          { value: '2"', label: '2" (DN50)' },
          { value: '3"', label: '3" (DN80)' },
          { value: '4"', label: '4" (DN100)' },
          { value: '6"', label: '6" (DN150)' },
          { value: '8"', label: '8" (DN200)' },
          { value: '10"', label: '10" (DN250)' },
          { value: '12"', label: '12" (DN300)' }
        ],
        description: 'Diámetro nominal de la brida.',
        normaReference: 'ASME B16.5 §1.4'
      }
    ];
  }

  validate(inputs: Record<string, any>): string[] {
    return [];
  }

  calculate(inputs: Record<string, any>): NormResult[] {
    const rating = String(inputs.rating || '150#');
    const nps = String(inputs.nps || '4"');

    const ratingMap = FLANGE_DATA_MATRIX[rating];
    const spec = ratingMap ? ratingMap[nps] : null;

    if (!spec) {
      return [{
        passed: false,
        value: 'SIN_DATOS',
        label: 'Combinación Rating/NPS no encontrada en matriz',
        codeReference: 'ASME B16.5 Tabla C',
        recommendations: ['Seleccione otra combinación de Clase y Diámetro Nominal.'],
        severity: 'warning'
      }];
    }

    return [
      {
        passed: true,
        value: `${spec.torqueFtLb} ft-lb (${spec.torqueNm} N-m)`,
        unit: 'Torque Recomendado',
        label: `Brida ${nps} Clase ${rating}`,
        codeReference: 'ASME B16.5 / PCC-1 Tabla 3',
        recommendations: [
          `Utilizar secuencias de apriete en cruz (Star Pattern) en ${spec.holesCount} pernos.`,
          `Aplicar lubricante en roscas con coeficiente de fricción k = 0.16.`,
          `Usar dados/copas hexagonales de ${spec.socketInches} (${spec.socketMm} mm).`
        ],
        severity: 'success',
        details: {
          'Diámetro Exterior Brida (OD)': `${spec.odMm} mm`,
          'Espesor de Brida (t)': `${spec.thicknessMm} mm`,
          'Diámetro Círculo Pernos (BCD)': `${spec.bcdMm} mm`,
          'Cantidad de Pernos': `${spec.holesCount} orificios`,
          'Diámetro de Perno': spec.boltDiamInches,
          'Diámetro Orificios': spec.holeDiamInches,
          'Copa / Dado Requerido': `${spec.socketInches} (${spec.socketMm} mm)`
        }
      }
    ];
  }
}
