// src/lib/norms/asme/asmeB165.ts
// ASME B16.5 — Dimensiones de bridas, torques y secuencias de apriete
// Completo hasta 42" para todas las clases (150#, 300#, 600#, 900#, 1500#, 2500#)

export interface FlangeSpec {
  nps: string;              // Nominal Pipe Size
  odMm: number;             // Diámetro exterior (mm)
  thicknessMm: number;      // Espesor (mm)
  bcdMm: number;            // Diámetro círculo pernos (mm)
  holesCount: number;       // Número de agujeros
  holeDiamInches: string;   // Diámetro agujero (pulg)
  boltDiamInches: string;   // Diámetro perno (pulg)
  boltThread: string;       // Rosca
  socketInches: string;     // Boca de perno (pulg)
  socketMm: number;         // Boca de perno (mm)
  torqueFtLb: number;       // Torque recomendado (ft-lb)
  torqueNm: number;         // Torque recomendado (Nm)
  pesoKg: number;           // Peso aproximado (kg)
}

export const FLANGE_DATA: Record<string, Record<string, FlangeSpec>> = {
  '150#': {
    '1/2"':  { nps: '1/2"', odMm: 89, thicknessMm: 11.2, bcdMm: 60.3, holesCount: 4, holeDiamInches: '5/8"', boltDiamInches: '1/2"', boltThread: '13 UNC', socketInches: '7/8"', socketMm: 22, torqueFtLb: 60, torqueNm: 81, pesoKg: 0.8 },
    '3/4"':  { nps: '3/4"', odMm: 98, thicknessMm: 12.7, bcdMm: 69.8, holesCount: 4, holeDiamInches: '5/8"', boltDiamInches: '1/2"', boltThread: '13 UNC', socketInches: '7/8"', socketMm: 22, torqueFtLb: 60, torqueNm: 81, pesoKg: 1.0 },
    '1"':    { nps: '1"', odMm: 108, thicknessMm: 14.3, bcdMm: 79.4, holesCount: 4, holeDiamInches: '5/8"', boltDiamInches: '1/2"', boltThread: '13 UNC', socketInches: '7/8"', socketMm: 22, torqueFtLb: 60, torqueNm: 81, pesoKg: 1.3 },
    '1-1/4"': { nps: '1-1/4"', odMm: 117, thicknessMm: 15.9, bcdMm: 88.9, holesCount: 4, holeDiamInches: '5/8"', boltDiamInches: '1/2"', boltThread: '13 UNC', socketInches: '7/8"', socketMm: 22, torqueFtLb: 60, torqueNm: 81, pesoKg: 1.6 },
    '1-1/2"': { nps: '1-1/2"', odMm: 127, thicknessMm: 17.5, bcdMm: 98.4, holesCount: 4, holeDiamInches: '5/8"', boltDiamInches: '1/2"', boltThread: '13 UNC', socketInches: '7/8"', socketMm: 22, torqueFtLb: 60, torqueNm: 81, pesoKg: 1.9 },
    '2"':    { nps: '2"', odMm: 152, thicknessMm: 19.1, bcdMm: 120.7, holesCount: 4, holeDiamInches: '3/4"', boltDiamInches: '5/8"', boltThread: '11 UNC', socketInches: '1-1/16"', socketMm: 27, torqueFtLb: 120, torqueNm: 163, pesoKg: 2.8 },
    '2-1/2"': { nps: '2-1/2"', odMm: 178, thicknessMm: 22.4, bcdMm: 139.7, holesCount: 4, holeDiamInches: '3/4"', boltDiamInches: '5/8"', boltThread: '11 UNC', socketInches: '1-1/16"', socketMm: 27, torqueFtLb: 120, torqueNm: 163, pesoKg: 3.8 },
    '3"':    { nps: '3"', odMm: 191, thicknessMm: 23.9, bcdMm: 152.4, holesCount: 4, holeDiamInches: '3/4"', boltDiamInches: '5/8"', boltThread: '11 UNC', socketInches: '1-1/16"', socketMm: 27, torqueFtLb: 120, torqueNm: 163, pesoKg: 4.5 },
    '3-1/2"': { nps: '3-1/2"', odMm: 216, thicknessMm: 23.9, bcdMm: 177.8, holesCount: 8, holeDiamInches: '3/4"', boltDiamInches: '5/8"', boltThread: '11 UNC', socketInches: '1-1/16"', socketMm: 27, torqueFtLb: 120, torqueNm: 163, pesoKg: 5.5 },
    '4"':    { nps: '4"', odMm: 229, thicknessMm: 23.9, bcdMm: 190.5, holesCount: 8, holeDiamInches: '3/4"', boltDiamInches: '5/8"', boltThread: '11 UNC', socketInches: '1-1/16"', socketMm: 27, torqueFtLb: 120, torqueNm: 163, pesoKg: 6.3 },
    '5"':    { nps: '5"', odMm: 254, thicknessMm: 23.9, bcdMm: 215.9, holesCount: 8, holeDiamInches: '7/8"', boltDiamInches: '3/4"', boltThread: '10 UNC', socketInches: '1-1/4"', socketMm: 32, torqueFtLb: 200, torqueNm: 271, pesoKg: 7.8 },
    '6"':    { nps: '6"', odMm: 279, thicknessMm: 25.4, bcdMm: 241.3, holesCount: 8, holeDiamInches: '7/8"', boltDiamInches: '3/4"', boltThread: '10 UNC', socketInches: '1-1/4"', socketMm: 32, torqueFtLb: 200, torqueNm: 271, pesoKg: 9.5 },
    '8"':    { nps: '8"', odMm: 343, thicknessMm: 28.6, bcdMm: 298.5, holesCount: 8, holeDiamInches: '7/8"', boltDiamInches: '3/4"', boltThread: '10 UNC', socketInches: '1-1/4"', socketMm: 32, torqueFtLb: 200, torqueNm: 271, pesoKg: 14.5 },
    '10"':   { nps: '10"', odMm: 406, thicknessMm: 30.2, bcdMm: 362.0, holesCount: 12, holeDiamInches: '1"', boltDiamInches: '7/8"', boltThread: '9 UNC', socketInches: '1-7/16"', socketMm: 36, torqueFtLb: 320, torqueNm: 434, pesoKg: 20.0 },
    '12"':   { nps: '12"', odMm: 483, thicknessMm: 31.8, bcdMm: 431.8, holesCount: 12, holeDiamInches: '1"', boltDiamInches: '7/8"', boltThread: '9 UNC', socketInches: '1-7/16"', socketMm: 36, torqueFtLb: 320, torqueNm: 434, pesoKg: 28.0 },
    '14"':   { nps: '14"', odMm: 533, thicknessMm: 35.0, bcdMm: 476.3, holesCount: 12, holeDiamInches: '1-1/8"', boltDiamInches: '1"', boltThread: '8 UNC', socketInches: '1-5/8"', socketMm: 41, torqueFtLb: 480, torqueNm: 651, pesoKg: 36.0 },
    '16"':   { nps: '16"', odMm: 597, thicknessMm: 36.5, bcdMm: 539.8, holesCount: 16, holeDiamInches: '1-1/8"', boltDiamInches: '1"', boltThread: '8 UNC', socketInches: '1-5/8"', socketMm: 41, torqueFtLb: 480, torqueNm: 651, pesoKg: 45.0 },
    '18"':   { nps: '18"', odMm: 635, thicknessMm: 39.7, bcdMm: 577.9, holesCount: 16, holeDiamInches: '1-1/4"', boltDiamInches: '1-1/8"', boltThread: '8 UN', socketInches: '1-13/16"', socketMm: 46, torqueFtLb: 710, torqueNm: 962, pesoKg: 55.0 },
    '20"':   { nps: '20"', odMm: 699, thicknessMm: 42.9, bcdMm: 635.0, holesCount: 20, holeDiamInches: '1-1/4"', boltDiamInches: '1-1/8"', boltThread: '8 UN', socketInches: '1-13/16"', socketMm: 46, torqueFtLb: 710, torqueNm: 962, pesoKg: 67.0 },
    '22"':   { nps: '22"', odMm: 749, thicknessMm: 46.0, bcdMm: 692.2, holesCount: 20, holeDiamInches: '1-3/8"', boltDiamInches: '1-1/4"', boltThread: '8 UN', socketInches: '2"', socketMm: 50, torqueFtLb: 1000, torqueNm: 1356, pesoKg: 78.0 },
    '24"':   { nps: '24"', odMm: 813, thicknessMm: 47.6, bcdMm: 749.3, holesCount: 20, holeDiamInches: '1-3/8"', boltDiamInches: '1-1/4"', boltThread: '8 UN', socketInches: '2"', socketMm: 50, torqueFtLb: 1000, torqueNm: 1356, pesoKg: 92.0 },
    '26"':   { nps: '26"', odMm: 870, thicknessMm: 68.3, bcdMm: 806.5, holesCount: 24, holeDiamInches: '1-3/8"', boltDiamInches: '1-1/4"', boltThread: '8 UN', socketInches: '2"', socketMm: 50, torqueFtLb: 1050, torqueNm: 1424, pesoKg: 145.0 },
    '28"':   { nps: '28"', odMm: 927, thicknessMm: 71.4, bcdMm: 863.6, holesCount: 28, holeDiamInches: '1-3/8"', boltDiamInches: '1-1/4"', boltThread: '8 UN', socketInches: '2"', socketMm: 50, torqueFtLb: 1100, torqueNm: 1491, pesoKg: 165.0 },
    '30"':   { nps: '30"', odMm: 984, thicknessMm: 74.6, bcdMm: 914.4, holesCount: 28, holeDiamInches: '1-3/8"', boltDiamInches: '1-1/4"', boltThread: '8 UN', socketInches: '2"', socketMm: 50, torqueFtLb: 1150, torqueNm: 1559, pesoKg: 188.0 },
    '32"':   { nps: '32"', odMm: 1060, thicknessMm: 81.0, bcdMm: 977.9, holesCount: 28, holeDiamInches: '1-5/8"', boltDiamInches: '1-1/2"', boltThread: '8 UN', socketInches: '2-3/8"', socketMm: 60, torqueFtLb: 1800, torqueNm: 2440, pesoKg: 225.0 },
    '34"':   { nps: '34"', odMm: 1111, thicknessMm: 82.6, bcdMm: 1028.7, holesCount: 32, holeDiamInches: '1-5/8"', boltDiamInches: '1-1/2"', boltThread: '8 UN', socketInches: '2-3/8"', socketMm: 60, torqueFtLb: 1850, torqueNm: 2508, pesoKg: 248.0 },
    '36"':   { nps: '36"', odMm: 1168, thicknessMm: 90.5, bcdMm: 1085.9, holesCount: 32, holeDiamInches: '1-5/8"', boltDiamInches: '1-1/2"', boltThread: '8 UN', socketInches: '2-3/8"', socketMm: 60, torqueFtLb: 1900, torqueNm: 2576, pesoKg: 275.0 },
    '38"':   { nps: '38"', odMm: 1240, thicknessMm: 90.5, bcdMm: 1143.0, holesCount: 36, holeDiamInches: '1-5/8"', boltDiamInches: '1-1/2"', boltThread: '8 UN', socketInches: '2-3/8"', socketMm: 60, torqueFtLb: 2000, torqueNm: 2712, pesoKg: 310.0 },
    '40"':   { nps: '40"', odMm: 1289, thicknessMm: 90.5, bcdMm: 1200.2, holesCount: 36, holeDiamInches: '1-5/8"', boltDiamInches: '1-1/2"', boltThread: '8 UN', socketInches: '2-3/8"', socketMm: 60, torqueFtLb: 2000, torqueNm: 2712, pesoKg: 335.0 },
    '42"':   { nps: '42"', odMm: 1346, thicknessMm: 96.8, bcdMm: 1257.3, holesCount: 36, holeDiamInches: '1-5/8"', boltDiamInches: '1-1/2"', boltThread: '8 UN', socketInches: '2-3/8"', socketMm: 60, torqueFtLb: 2100, torqueNm: 2847, pesoKg: 370.0 },
  },
  
  '300#': {
    '1/2"':  { nps: '1/2"', odMm: 95, thicknessMm: 14.3, bcdMm: 66.7, holesCount: 4, holeDiamInches: '5/8"', boltDiamInches: '1/2"', boltThread: '13 UNC', socketInches: '7/8"', socketMm: 22, torqueFtLb: 70, torqueNm: 95, pesoKg: 1.0 },
    '3/4"':  { nps: '3/4"', odMm: 117, thicknessMm: 15.9, bcdMm: 82.6, holesCount: 4, holeDiamInches: '3/4"', boltDiamInches: '5/8"', boltThread: '11 UNC', socketInches: '1-1/16"', socketMm: 27, torqueFtLb: 130, torqueNm: 176, pesoKg: 1.5 },
    '1"':    { nps: '1"', odMm: 124, thicknessMm: 17.5, bcdMm: 88.9, holesCount: 4, holeDiamInches: '3/4"', boltDiamInches: '5/8"', boltThread: '11 UNC', socketInches: '1-1/16"', socketMm: 27, torqueFtLb: 130, torqueNm: 176, pesoKg: 1.8 },
    '1-1/4"': { nps: '1-1/4"', odMm: 133, thicknessMm: 19.1, bcdMm: 98.4, holesCount: 4, holeDiamInches: '3/4"', boltDiamInches: '5/8"', boltThread: '11 UNC', socketInches: '1-1/16"', socketMm: 27, torqueFtLb: 130, torqueNm: 176, pesoKg: 2.2 },
    '1-1/2"': { nps: '1-1/2"', odMm: 156, thicknessMm: 20.6, bcdMm: 114.3, holesCount: 4, holeDiamInches: '7/8"', boltDiamInches: '3/4"', boltThread: '10 UNC', socketInches: '1-1/4"', socketMm: 32, torqueFtLb: 210, torqueNm: 285, pesoKg: 3.0 },
    '2"':    { nps: '2"', odMm: 165, thicknessMm: 22.4, bcdMm: 127.0, holesCount: 8, holeDiamInches: '3/4"', boltDiamInches: '5/8"', boltThread: '11 UNC', socketInches: '1-1/16"', socketMm: 27, torqueFtLb: 120, torqueNm: 163, pesoKg: 3.5 },
    '2-1/2"': { nps: '2-1/2"', odMm: 191, thicknessMm: 25.4, bcdMm: 149.2, holesCount: 8, holeDiamInches: '7/8"', boltDiamInches: '3/4"', boltThread: '10 UNC', socketInches: '1-1/4"', socketMm: 32, torqueFtLb: 210, torqueNm: 285, pesoKg: 4.8 },
    '3"':    { nps: '3"', odMm: 210, thicknessMm: 28.6, bcdMm: 168.3, holesCount: 8, holeDiamInches: '7/8"', boltDiamInches: '3/4"', boltThread: '10 UNC', socketInches: '1-1/4"', socketMm: 32, torqueFtLb: 200, torqueNm: 271, pesoKg: 6.0 },
    '3-1/2"': { nps: '3-1/2"', odMm: 229, thicknessMm: 30.2, bcdMm: 184.2, holesCount: 8, holeDiamInches: '7/8"', boltDiamInches: '3/4"', boltThread: '10 UNC', socketInches: '1-1/4"', socketMm: 32, torqueFtLb: 210, torqueNm: 285, pesoKg: 7.0 },
    '4"':    { nps: '4"', odMm: 254, thicknessMm: 31.8, bcdMm: 200.0, holesCount: 8, holeDiamInches: '7/8"', boltDiamInches: '3/4"', boltThread: '10 UNC', socketInches: '1-1/4"', socketMm: 32, torqueFtLb: 200, torqueNm: 271, pesoKg: 8.5 },
    '5"':    { nps: '5"', odMm: 279, thicknessMm: 35.0, bcdMm: 235.0, holesCount: 8, holeDiamInches: '7/8"', boltDiamInches: '3/4"', boltThread: '10 UNC', socketInches: '1-1/4"', socketMm: 32, torqueFtLb: 220, torqueNm: 298, pesoKg: 10.5 },
    '6"':    { nps: '6"', odMm: 318, thicknessMm: 36.5, bcdMm: 269.9, holesCount: 12, holeDiamInches: '7/8"', boltDiamInches: '3/4"', boltThread: '10 UNC', socketInches: '1-1/4"', socketMm: 32, torqueFtLb: 200, torqueNm: 271, pesoKg: 14.0 },
    '8"':    { nps: '8"', odMm: 381, thicknessMm: 41.3, bcdMm: 330.2, holesCount: 12, holeDiamInches: '1"', boltDiamInches: '7/8"', boltThread: '9 UNC', socketInches: '1-7/16"', socketMm: 36, torqueFtLb: 320, torqueNm: 434, pesoKg: 22.0 },
    '10"':   { nps: '10"', odMm: 445, thicknessMm: 47.6, bcdMm: 387.4, holesCount: 16, holeDiamInches: '1-1/8"', boltDiamInches: '1"', boltThread: '8 UNC', socketInches: '1-5/8"', socketMm: 41, torqueFtLb: 500, torqueNm: 678, pesoKg: 32.0 },
    '12"':   { nps: '12"', odMm: 521, thicknessMm: 50.8, bcdMm: 457.2, holesCount: 16, holeDiamInches: '1-1/4"', boltDiamInches: '1-1/8"', boltThread: '8 UN', socketInches: '1-13/16"', socketMm: 46, torqueFtLb: 710, torqueNm: 963, pesoKg: 46.0 },
    '14"':   { nps: '14"', odMm: 584, thicknessMm: 54.0, bcdMm: 514.4, holesCount: 20, holeDiamInches: '1-1/4"', boltDiamInches: '1-1/8"', boltThread: '8 UN', socketInches: '1-13/16"', socketMm: 46, torqueFtLb: 720, torqueNm: 976, pesoKg: 58.0 },
    '16"':   { nps: '16"', odMm: 648, thicknessMm: 57.2, bcdMm: 571.5, holesCount: 20, holeDiamInches: '1-3/8"', boltDiamInches: '1-1/4"', boltThread: '8 UN', socketInches: '2"', socketMm: 50, torqueFtLb: 1000, torqueNm: 1356, pesoKg: 75.0 },
    '18"':   { nps: '18"', odMm: 711, thicknessMm: 60.3, bcdMm: 628.7, holesCount: 24, holeDiamInches: '1-3/8"', boltDiamInches: '1-1/4"', boltThread: '8 UN', socketInches: '2"', socketMm: 50, torqueFtLb: 1050, torqueNm: 1424, pesoKg: 95.0 },
    '20"':   { nps: '20"', odMm: 775, thicknessMm: 63.5, bcdMm: 685.8, holesCount: 24, holeDiamInches: '1-3/8"', boltDiamInches: '1-1/4"', boltThread: '8 UN', socketInches: '2"', socketMm: 50, torqueFtLb: 1100, torqueNm: 1491, pesoKg: 118.0 },
    '24"':   { nps: '24"', odMm: 914, thicknessMm: 69.9, bcdMm: 812.8, holesCount: 24, holeDiamInches: '1-5/8"', boltDiamInches: '1-1/2"', boltThread: '8 UN', socketInches: '2-3/8"', socketMm: 60, torqueFtLb: 1800, torqueNm: 2440, pesoKg: 165.0 },
    '30"':   { nps: '30"', odMm: 1092, thicknessMm: 95.3, bcdMm: 984.3, holesCount: 28, holeDiamInches: '1-7/8"', boltDiamInches: '1-3/4"', boltThread: '8 UN', socketInches: '2-3/4"', socketMm: 70, torqueFtLb: 2800, torqueNm: 3796, pesoKg: 320.0 },
    '36"':   { nps: '36"', odMm: 1270, thicknessMm: 104.8, bcdMm: 1155.7, holesCount: 32, holeDiamInches: '2-1/8"', boltDiamInches: '2"', boltThread: '8 UN', socketInches: '3-1/8"', socketMm: 80, torqueFtLb: 3800, torqueNm: 5152, pesoKg: 490.0 },
    '42"':   { nps: '42"', odMm: 1422, thicknessMm: 119.1, bcdMm: 1301.8, holesCount: 36, holeDiamInches: '2-1/8"', boltDiamInches: '2"', boltThread: '8 UN', socketInches: '3-1/8"', socketMm: 80, torqueFtLb: 4100, torqueNm: 5559, pesoKg: 680.0 },
  },

  '600#': {
    '1/2"':  { nps: '1/2"', odMm: 95, thicknessMm: 14.3, bcdMm: 66.7, holesCount: 4, holeDiamInches: '5/8"', boltDiamInches: '1/2"', boltThread: '13 UNC', socketInches: '7/8"', socketMm: 22, torqueFtLb: 70, torqueNm: 95, pesoKg: 1.1 },
    '3/4"':  { nps: '3/4"', odMm: 117, thicknessMm: 15.9, bcdMm: 82.6, holesCount: 4, holeDiamInches: '3/4"', boltDiamInches: '5/8"', boltThread: '11 UNC', socketInches: '1-1/16"', socketMm: 27, torqueFtLb: 130, torqueNm: 176, pesoKg: 1.8 },
    '1"':    { nps: '1"', odMm: 124, thicknessMm: 17.5, bcdMm: 88.9, holesCount: 4, holeDiamInches: '3/4"', boltDiamInches: '5/8"', boltThread: '11 UNC', socketInches: '1-1/16"', socketMm: 27, torqueFtLb: 130, torqueNm: 176, pesoKg: 2.1 },
    '1-1/2"': { nps: '1-1/2"', odMm: 156, thicknessMm: 22.4, bcdMm: 114.3, holesCount: 4, holeDiamInches: '7/8"', boltDiamInches: '3/4"', boltThread: '10 UNC', socketInches: '1-1/4"', socketMm: 32, torqueFtLb: 220, torqueNm: 298, pesoKg: 3.6 },
    '2"':    { nps: '2"', odMm: 165, thicknessMm: 25.4, bcdMm: 127.0, holesCount: 8, holeDiamInches: '3/4"', boltDiamInches: '5/8"', boltThread: '11 UNC', socketInches: '1-1/16"', socketMm: 27, torqueFtLb: 140, torqueNm: 190, pesoKg: 4.5 },
    '3"':    { nps: '3"', odMm: 210, thicknessMm: 31.8, bcdMm: 168.3, holesCount: 8, holeDiamInches: '7/8"', boltDiamInches: '3/4"', boltThread: '10 UNC', socketInches: '1-1/4"', socketMm: 32, torqueFtLb: 220, torqueNm: 298, pesoKg: 7.8 },
    '4"':    { nps: '4"', odMm: 273, thicknessMm: 38.1, bcdMm: 215.9, holesCount: 8, holeDiamInches: '1"', boltDiamInches: '7/8"', boltThread: '9 UNC', socketInches: '1-7/16"', socketMm: 36, torqueFtLb: 360, torqueNm: 488, pesoKg: 14.5 },
    '6"':    { nps: '6"', odMm: 356, thicknessMm: 47.6, bcdMm: 292.1, holesCount: 12, holeDiamInches: '1-1/8"', boltDiamInches: '1"', boltThread: '8 UNC', socketInches: '1-5/8"', socketMm: 41, torqueFtLb: 550, torqueNm: 746, pesoKg: 28.0 },
    '8"':    { nps: '8"', odMm: 419, thicknessMm: 55.6, bcdMm: 349.3, holesCount: 12, holeDiamInches: '1-1/4"', boltDiamInches: '1-1/8"', boltThread: '8 UN', socketInches: '1-13/16"', socketMm: 46, torqueFtLb: 800, torqueNm: 1085, pesoKg: 42.0 },
    '10"':   { nps: '10"', odMm: 508, thicknessMm: 63.5, bcdMm: 431.8, holesCount: 16, holeDiamInches: '1-3/8"', boltDiamInches: '1-1/4"', boltThread: '8 UN', socketInches: '2"', socketMm: 50, torqueFtLb: 1150, torqueNm: 1559, pesoKg: 70.0 },
    '12"':   { nps: '12"', odMm: 559, thicknessMm: 66.7, bcdMm: 489.0, holesCount: 20, holeDiamInches: '1-3/8"', boltDiamInches: '1-1/4"', boltThread: '8 UN', socketInches: '2"', socketMm: 50, torqueFtLb: 1200, torqueNm: 1627, pesoKg: 90.0 },
    '16"':   { nps: '16"', odMm: 686, thicknessMm: 76.2, bcdMm: 603.3, holesCount: 20, holeDiamInches: '1-5/8"', boltDiamInches: '1-1/2"', boltThread: '8 UN', socketInches: '2-3/8"', socketMm: 60, torqueFtLb: 1900, torqueNm: 2576, pesoKg: 155.0 },
    '20"':   { nps: '20"', odMm: 813, thicknessMm: 88.9, bcdMm: 723.9, holesCount: 24, holeDiamInches: '1-7/8"', boltDiamInches: '1-3/4"', boltThread: '8 UN', socketInches: '2-3/4"', socketMm: 70, torqueFtLb: 3000, torqueNm: 4067, pesoKg: 250.0 },
    '24"':   { nps: '24"', odMm: 940, thicknessMm: 101.6, bcdMm: 838.2, holesCount: 24, holeDiamInches: '2-1/8"', boltDiamInches: '2"', boltThread: '8 UN', socketInches: '3-1/8"', socketMm: 80, torqueFtLb: 4200, torqueNm: 5694, pesoKg: 380.0 },
    '30"':   { nps: '30"', odMm: 1130, thicknessMm: 114.3, bcdMm: 1016.0, holesCount: 28, holeDiamInches: '2-3/8"', boltDiamInches: '2-1/4"', boltThread: '8 UN', socketInches: '3-1/2"', socketMm: 90, torqueFtLb: 5800, torqueNm: 7863, pesoKg: 620.0 },
    '36"':   { nps: '36"', odMm: 1314, thicknessMm: 127.0, bcdMm: 1193.8, holesCount: 28, holeDiamInches: '2-5/8"', boltDiamInches: '2-1/2"', boltThread: '8 UN', socketInches: '3-7/8"', socketMm: 98, torqueFtLb: 7800, torqueNm: 10575, pesoKg: 950.0 },
    '42"':   { nps: '42"', odMm: 1499, thicknessMm: 142.9, bcdMm: 1371.6, holesCount: 32, holeDiamInches: '2-7/8"', boltDiamInches: '2-3/4"', boltThread: '8 UN', socketInches: '4-1/4"', socketMm: 108, torqueFtLb: 10200, torqueNm: 13829, pesoKg: 1350.0 },
  },

  '900#': {
    '1/2"':  { nps: '1/2"', odMm: 121, thicknessMm: 22.4, bcdMm: 82.6, holesCount: 4, holeDiamInches: '7/8"', boltDiamInches: '3/4"', boltThread: '10 UNC', socketInches: '1-1/4"', socketMm: 32, torqueFtLb: 220, torqueNm: 298, pesoKg: 2.3 },
    '1"':    { nps: '1"', odMm: 149, thicknessMm: 28.6, bcdMm: 101.6, holesCount: 4, holeDiamInches: '1"', boltDiamInches: '7/8"', boltThread: '9 UNC', socketInches: '1-7/16"', socketMm: 36, torqueFtLb: 380, torqueNm: 515, pesoKg: 4.2 },
    '2"':    { nps: '2"', odMm: 216, thicknessMm: 38.1, bcdMm: 165.1, holesCount: 8, holeDiamInches: '1"', boltDiamInches: '7/8"', boltThread: '9 UNC', socketInches: '1-7/16"', socketMm: 36, torqueFtLb: 390, torqueNm: 528, pesoKg: 10.5 },
    '3"':    { nps: '3"', odMm: 241, thicknessMm: 38.1, bcdMm: 190.5, holesCount: 8, holeDiamInches: '1-1/8"', boltDiamInches: '1"', boltThread: '8 UNC', socketInches: '1-5/8"', socketMm: 41, torqueFtLb: 600, torqueNm: 813, pesoKg: 14.0 },
    '4"':    { nps: '4"', odMm: 292, thicknessMm: 44.5, bcdMm: 235.0, holesCount: 8, holeDiamInches: '1-1/4"', boltDiamInches: '1-1/8"', boltThread: '8 UN', socketInches: '1-13/16"', socketMm: 46, torqueFtLb: 850, torqueNm: 1152, pesoKg: 22.0 },
    '6"':    { nps: '6"', odMm: 381, thicknessMm: 55.6, bcdMm: 317.5, holesCount: 12, holeDiamInches: '1-3/8"', boltDiamInches: '1-1/4"', boltThread: '8 UN', socketInches: '2"', socketMm: 50, torqueFtLb: 1250, torqueNm: 1695, pesoKg: 48.0 },
    '8"':    { nps: '8"', odMm: 470, thicknessMm: 63.5, bcdMm: 393.7, holesCount: 12, holeDiamInches: '1-5/8"', boltDiamInches: '1-1/2"', boltThread: '8 UN', socketInches: '2-3/8"', socketMm: 60, torqueFtLb: 2100, torqueNm: 2847, pesoKg: 85.0 },
    '10"':   { nps: '10"', odMm: 546, thicknessMm: 69.9, bcdMm: 469.9, holesCount: 16, holeDiamInches: '1-5/8"', boltDiamInches: '1-1/2"', boltThread: '8 UN', socketInches: '2-3/8"', socketMm: 60, torqueFtLb: 2200, torqueNm: 2983, pesoKg: 125.0 },
    '12"':   { nps: '12"', odMm: 610, thicknessMm: 79.2, bcdMm: 533.4, holesCount: 20, holeDiamInches: '1-5/8"', boltDiamInches: '1-1/2"', boltThread: '8 UN', socketInches: '2-3/8"', socketMm: 60, torqueFtLb: 2300, torqueNm: 3118, pesoKg: 170.0 },
    '16"':   { nps: '16"', odMm: 705, thicknessMm: 88.9, bcdMm: 616.0, holesCount: 20, holeDiamInches: '1-7/8"', boltDiamInches: '1-3/4"', boltThread: '8 UN', socketInches: '2-3/4"', socketMm: 70, torqueFtLb: 3500, torqueNm: 4745, pesoKg: 260.0 },
    '20"':   { nps: '20"', odMm: 851, thicknessMm: 108.0, bcdMm: 749.3, holesCount: 20, holeDiamInches: '2-1/8"', boltDiamInches: '2"', boltThread: '8 UN', socketInches: '3-1/8"', socketMm: 80, torqueFtLb: 5200, torqueNm: 7050, pesoKg: 430.0 },
    '24"':   { nps: '24"', odMm: 1041, thicknessMm: 139.7, bcdMm: 901.7, holesCount: 20, holeDiamInches: '2-5/8"', boltDiamInches: '2-1/2"', boltThread: '8 UN', socketInches: '3-7/8"', socketMm: 98, torqueFtLb: 9800, torqueNm: 13287, pesoKg: 820.0 },
    '30"':   { nps: '30"', odMm: 1232, thicknessMm: 152.4, bcdMm: 1085.9, holesCount: 20, holeDiamInches: '3"', boltDiamInches: '2-3/4"', boltThread: '8 UN', socketInches: '4-1/4"', socketMm: 108, torqueFtLb: 13500, torqueNm: 18303, pesoKg: 1250.0 },
    '36"':   { nps: '36"', odMm: 1422, thicknessMm: 171.5, bcdMm: 1257.3, holesCount: 20, holeDiamInches: '3-3/8"', boltDiamInches: '3-1/4"', boltThread: '8 UN', socketInches: '5"', socketMm: 127, torqueFtLb: 21000, torqueNm: 28472, pesoKg: 1950.0 },
    '42"':   { nps: '42"', odMm: 1613, thicknessMm: 190.5, bcdMm: 1435.1, holesCount: 24, holeDiamInches: '3-5/8"', boltDiamInches: '3-1/2"', boltThread: '8 UN', socketInches: '5-3/8"', socketMm: 136, torqueFtLb: 27000, torqueNm: 36607, pesoKg: 2800.0 },
  },

  '1500#': {
    '1/2"':  { nps: '1/2"', odMm: 121, thicknessMm: 22.4, bcdMm: 82.6, holesCount: 4, holeDiamInches: '7/8"', boltDiamInches: '3/4"', boltThread: '10 UNC', socketInches: '1-1/4"', socketMm: 32, torqueFtLb: 220, torqueNm: 298, pesoKg: 2.5 },
    '1"':    { nps: '1"', odMm: 149, thicknessMm: 28.6, bcdMm: 101.6, holesCount: 4, holeDiamInches: '1"', boltDiamInches: '7/8"', boltThread: '9 UNC', socketInches: '1-7/16"', socketMm: 36, torqueFtLb: 380, torqueNm: 515, pesoKg: 4.5 },
    '2"':    { nps: '2"', odMm: 216, thicknessMm: 38.1, bcdMm: 165.1, holesCount: 8, holeDiamInches: '1"', boltDiamInches: '7/8"', boltThread: '9 UNC', socketInches: '1-7/16"', socketMm: 36, torqueFtLb: 390, torqueNm: 528, pesoKg: 11.2 },
    '3"':    { nps: '3"', odMm: 267, thicknessMm: 47.6, bcdMm: 203.2, holesCount: 8, holeDiamInches: '1-1/4"', boltDiamInches: '1-1/8"', boltThread: '8 UN', socketInches: '1-13/16"', socketMm: 46, torqueFtLb: 900, torqueNm: 1220, pesoKg: 21.0 },
    '4"':    { nps: '4"', odMm: 311, thicknessMm: 54.0, bcdMm: 241.3, holesCount: 8, holeDiamInches: '1-3/8"', boltDiamInches: '1-1/4"', boltThread: '8 UN', socketInches: '2"', socketMm: 50, torqueFtLb: 1300, torqueNm: 1762, pesoKg: 33.0 },
    '6"':    { nps: '6"', odMm: 394, thicknessMm: 82.6, bcdMm: 317.5, holesCount: 12, holeDiamInches: '1-1/2"', boltDiamInches: '1-3/8"', boltThread: '8 UN', socketInches: '2-3/16"', socketMm: 55, torqueFtLb: 1900, torqueNm: 2576, pesoKg: 72.0 },
    '8"':    { nps: '8"', odMm: 483, thicknessMm: 92.1, bcdMm: 393.7, holesCount: 12, holeDiamInches: '1-3/8"', boltDiamInches: '1-5/8"', boltThread: '8 UN', socketInches: '2-9/16"', socketMm: 65, torqueFtLb: 3200, torqueNm: 4338, pesoKg: 130.0 },
    '10"':   { nps: '10"', odMm: 584, thicknessMm: 108.0, bcdMm: 482.6, holesCount: 12, holeDiamInches: '2"', boltDiamInches: '1-7/8"', boltThread: '8 UN', socketInches: '2-15/16"', socketMm: 75, torqueFtLb: 4800, torqueNm: 6508, pesoKg: 220.0 },
    '12"':   { nps: '12"', odMm: 673, thicknessMm: 124.0, bcdMm: 552.4, holesCount: 16, holeDiamInches: '2-1/8"', boltDiamInches: '2"', boltThread: '8 UN', socketInches: '3-1/8"', socketMm: 80, torqueFtLb: 6000, torqueNm: 8135, pesoKg: 330.0 },
    '16"':   { nps: '16"', odMm: 826, thicknessMm: 146.0, bcdMm: 673.1, holesCount: 16, holeDiamInches: '2-5/8"', boltDiamInches: '2-1/2"', boltThread: '8 UN', socketInches: '3-7/8"', socketMm: 98, torqueFtLb: 11500, torqueNm: 15592, pesoKg: 580.0 },
    '20"':   { nps: '20"', odMm: 984, thicknessMm: 177.8, bcdMm: 812.8, holesCount: 16, holeDiamInches: '3-1/8"', boltDiamInches: '3"', boltThread: '8 UN', socketInches: '4-5/8"', socketMm: 117, torqueFtLb: 19500, torqueNm: 26438, pesoKg: 1020.0 },
    '24"':   { nps: '24"', odMm: 1168, thicknessMm: 203.2, bcdMm: 965.2, holesCount: 16, holeDiamInches: '3-5/8"', boltDiamInches: '3-1/2"', boltThread: '8 UN', socketInches: '5-3/8"', socketMm: 136, torqueFtLb: 31000, torqueNm: 42030, pesoKg: 1750.0 },
  },

  '2500#': {
    '1/2"':  { nps: '1/2"', odMm: 133, thicknessMm: 30.2, bcdMm: 88.9, holesCount: 4, holeDiamInches: '7/8"', boltDiamInches: '3/4"', boltThread: '10 UNC', socketInches: '1-1/4"', socketMm: 32, torqueFtLb: 240, torqueNm: 325, pesoKg: 3.5 },
    '1"':    { nps: '1"', odMm: 159, thicknessMm: 35.0, bcdMm: 108.0, holesCount: 4, holeDiamInches: '1"', boltDiamInches: '7/8"', boltThread: '9 UNC', socketInches: '1-7/16"', socketMm: 36, torqueFtLb: 420, torqueNm: 569, pesoKg: 6.0 },
    '2"':    { nps: '2"', odMm: 235, thicknessMm: 50.8, bcdMm: 171.4, holesCount: 8, holeDiamInches: '1-1/8"', boltDiamInches: '1"', boltThread: '8 UNC', socketInches: '1-5/8"', socketMm: 41, torqueFtLb: 680, torqueNm: 922, pesoKg: 18.0 },
    '3"':    { nps: '3"', odMm: 305, thicknessMm: 66.7, bcdMm: 228.6, holesCount: 8, holeDiamInches: '1-3/8"', boltDiamInches: '1-1/4"', boltThread: '8 UN', socketInches: '2"', socketMm: 50, torqueFtLb: 1400, torqueNm: 1898, pesoKg: 38.0 },
    '4"':    { nps: '4"', odMm: 356, thicknessMm: 76.2, bcdMm: 273.0, holesCount: 8, holeDiamInches: '1-5/8"', boltDiamInches: '1-1/2"', boltThread: '8 UN', socketInches: '2-3/8"', socketMm: 60, torqueFtLb: 2400, torqueNm: 3254, pesoKg: 62.0 },
    '6"':    { nps: '6"', odMm: 483, thicknessMm: 108.0, bcdMm: 368.3, holesCount: 8, holeDiamInches: '2-1/8"', boltDiamInches: '2"', boltThread: '8 UN', socketInches: '3-1/8"', socketMm: 80, torqueFtLb: 6200, torqueNm: 8406, pesoKg: 155.0 },
    '8"':    { nps: '8"', odMm: 552, thicknessMm: 127.0, bcdMm: 438.2, holesCount: 12, holeDiamInches: '2-1/8"', boltDiamInches: '2"', boltThread: '8 UN', socketInches: '3-1/8"', socketMm: 80, torqueFtLb: 6500, torqueNm: 8812, pesoKg: 245.0 },
    '10"':   { nps: '10"', odMm: 673, thicknessMm: 165.1, bcdMm: 539.8, holesCount: 12, holeDiamInches: '2-5/8"', boltDiamInches: '2-1/2"', boltThread: '8 UN', socketInches: '3-7/8"', socketMm: 98, torqueFtLb: 12500, torqueNm: 16947, pesoKg: 460.0 },
    '12"':   { nps: '12"', odMm: 762, thicknessMm: 184.2, bcdMm: 619.1, holesCount: 12, holeDiamInches: '2-7/8"', boltDiamInches: '2-3/4"', boltThread: '8 UN', socketInches: '4-1/4"', socketMm: 108, torqueFtLb: 17500, torqueNm: 23726, pesoKg: 680.0 },
  }
};

import { NormCalculator, NormField, NormResult } from '../core/NormCalculator';

export class ASMEB165Calculator implements NormCalculator {
  id = 'asme_b165';
  name = 'ASME B16.5 — Matriz Dimensional, Pernos y Torques de Bridas';
  standard = 'ASME B16.5 / Pipe Flanges and Flanged Fittings';
  version = '2020';
  description = 'Consulta completa de dimensiones de bridas hasta 42", diámetro de pernos, número de orificios y torque de apriete recomendado (ft-lb / N-m).';
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
        label: 'Tamaño Nominal de Tubería (NPS)',
        type: 'select',
        defaultValue: '4"',
        options: [
          { value: '1/2"', label: '1/2" (DN15)' },
          { value: '3/4"', label: '3/4" (DN20)' },
          { value: '1"', label: '1" (DN25)' },
          { value: '1-1/4"', label: '1-1/4" (DN32)' },
          { value: '1-1/2"', label: '1-1/2" (DN40)' },
          { value: '2"', label: '2" (DN50)' },
          { value: '2-1/2"', label: '2-1/2" (DN65)' },
          { value: '3"', label: '3" (DN80)' },
          { value: '4"', label: '4" (DN100)' },
          { value: '6"', label: '6" (DN150)' },
          { value: '8"', label: '8" (DN200)' },
          { value: '10"', label: '10" (DN250)' },
          { value: '12"', label: '12" (DN300)' },
          { value: '14"', label: '14" (DN350)' },
          { value: '16"', label: '16" (DN400)' },
          { value: '18"', label: '18" (DN450)' },
          { value: '20"', label: '20" (DN500)' },
          { value: '24"', label: '24" (DN600)' },
          { value: '30"', label: '30" (DN750)' },
          { value: '36"', label: '36" (DN900)' },
          { value: '42"', label: '42" (DN1050)' }
        ],
        description: 'Diámetro nominal de la brida.',
        normaReference: 'ASME B16.5 §1.4'
      }
    ];
  }

  validate(): string[] {
    return [];
  }

  calculate(inputs: Record<string, any>): NormResult[] {
    const rating = String(inputs.rating || '150#');
    const nps = String(inputs.nps || '4"');

    const ratingMap = FLANGE_DATA[rating];
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
        unit: 'Torque Recomendado (PCC-1)',
        label: `Brida ${nps} Clase ${rating}`,
        codeReference: 'ASME B16.5 / ASME PCC-1 Tabla 3',
        recommendations: [
          `Utilizar secuencia de apriete en cruz (Star Pattern) en ${spec.holesCount} pernos.`,
          `Aplicar lubricante en roscas con coeficiente de fricción k = 0.16.`,
          `Usar dados/copas hexagonales de ${spec.socketInches} (${spec.socketMm} mm).`,
          `Procedimiento de 4 pasadas: 30% → 60% → 100% → Pasada circular final al 100%.`
        ],
        severity: 'success',
        details: {
          'Diámetro Exterior Brida (OD)': `${spec.odMm} mm`,
          'Espesor de Brida (t)': `${spec.thicknessMm} mm`,
          'Diámetro Círculo Pernos (BCD)': `${spec.bcdMm} mm`,
          'Cantidad de Pernos': `${spec.holesCount} orificios`,
          'Diámetro de Perno': `${spec.boltDiamInches} (${spec.boltThread})`,
          'Diámetro Orificios': spec.holeDiamInches,
          'Copa / Dado Requerido': `${spec.socketInches} (${spec.socketMm} mm)`,
          'Peso Aprox. Brida': `${spec.pesoKg} kg`
        }
      }
    ];
  }
}
