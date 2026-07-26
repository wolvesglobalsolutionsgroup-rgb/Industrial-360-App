// src/lib/data/mechanical/tightening.ts
// Secuencias de Apriete, Torques y Procedimientos ASME PCC-1 / ASME B16.5
// Generador de Patrones Cruzados de Apriete (Star Pattern Crossover)

export interface BoltTorqueSpec {
  boltDiamInches: string; // e.g. '5/8"'
  threadPitch: string;    // e.g. '11 UNC'
  stressAreaSqIn: number; // Ár3a resistente de tensión
  torqueFtLbTarget: number; // Torque objetivo (ft-lb) al 50% de la fluencia B7
  torqueNmTarget: number;   // Torque objetivo (Nm)
  lubricatedNutKFactor: number; // Coeficiente k de lubricación (0.16)
}

// Procedimiento estandarizado de 4 Pasadas ASME PCC-1
export const PCC1_PASSES = [
  { passNumber: 1, percent: 30, description: 'Pasada 1: Ajuste inicial al 30% del torque objetivo en patrón cruzado estrella.' },
  { passNumber: 2, percent: 60, description: 'Pasada 2: Incrementar al 60% del torque objetivo en patrón cruzado estrella.' },
  { passNumber: 3, percent: 100, description: 'Pasada 3: Aplicar el 100% del torque objetivo en patrón cruzado estrella.' },
  { passNumber: 4, percent: 100, description: 'Pasada 4 (Circular): Repaso en sentido horario orificio por orificio al 100% del torque hasta que no haya rotación de tuercas.' }
];

/**
 * Genera el orden numérico exacto de apriete en estrella (Star Pattern) según ASME PCC-1
 * para cualquier número de pernos estándar (4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 56, 60).
 */
export function generateStarSequence(numBolts: number): number[] {
  if (numBolts <= 0) return [];
  if (numBolts === 4) {
    return [1, 3, 2, 4];
  }
  if (numBolts === 8) {
    return [1, 5, 3, 7, 2, 6, 4, 8];
  }
  if (numBolts === 12) {
    return [1, 7, 4, 10, 2, 8, 5, 11, 3, 9, 6, 12];
  }
  if (numBolts === 16) {
    return [1, 9, 5, 13, 3, 11, 7, 15, 2, 10, 6, 14, 4, 12, 8, 16];
  }
  if (numBolts === 20) {
    return [1, 11, 6, 16, 3, 13, 8, 18, 5, 15, 10, 20, 2, 12, 7, 17, 4, 14, 9, 19];
  }
  if (numBolts === 24) {
    return [
      1, 13, 7, 19, 4, 16, 10, 22, 2, 14, 8, 20, 5, 17, 11, 23, 3, 15, 9, 21, 6, 18, 12, 24
    ];
  }
  
  // Algoritmo general simétrico de cruce en estrella para N pernos
  const result: number[] = [];
  const half = Math.floor(numBolts / 2);
  const quarter = Math.floor(numBolts / 4);

  for (let i = 0; i < quarter; i++) {
    const b1 = i * 2 + 1;
    const b2 = b1 + half;
    const b3 = b1 + quarter;
    const b4 = b3 + half;

    if (!result.includes(b1) && b1 <= numBolts) result.push(b1);
    if (!result.includes(b2) && b2 <= numBolts) result.push(b2);
    if (!result.includes(b3) && b3 <= numBolts) result.push(b3);
    if (!result.includes(b4) && b4 <= numBolts) result.push(b4);
  }

  // Rellenar pernos restantes si falta alguno
  for (let b = 1; b <= numBolts; b++) {
    if (!result.includes(b)) {
      result.push(b);
    }
  }

  return result;
}

export const TIGHTENING_GUIDELINES = [
  'Verificar alineación paralela de caras de bridas antes de apretar (desalineación axial ≤ 1.5mm / angular ≤ 0.25°).',
  'Limpiar minuciosamente las roscas de espárragos y tuercas con cepillo de alambre.',
  'Aplicar lubricante antiaferrante con bisulfuro de molibdeno (MoS2) o base de níquel en roscas y caras de tuerca.',
  'Colocar la empacadura centrada y verificar que no esté dañada ni reciclada.',
  'Ajustar todas las tuercas a mano inicialmente comprobando que al menos 2 a 3 hilos de rosca sobresalgan de la tuerca.',
  'Calibrar el torquímetro hidráulico o neumático/manual con certificado vigente de calibración.',
  'Ejecutar las 4 pasadas de torque en la secuencia de estrella indicada antes de dar la firma de aceptación.'
];
