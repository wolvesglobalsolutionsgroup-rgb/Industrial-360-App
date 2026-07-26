// src/lib/data/mechanical/valves.ts
// Especificaciones de Válvulas Industriales (Compuerta, Globo, Retención, Bola, Mariposa, Macho)
// Según normas API 600, API 602, API 6D, ASME B16.34, PDVSA 90617.1.040

export interface ValveSpec {
  type: 'gate' | 'globe' | 'check' | 'ball' | 'butterfly' | 'plug';
  typeName: string;
  normStandard: string;
  classes: string[];
  endConnections: string[];
  trimTypes: string[];
  description: string;
  applications: string[];
  faceToFaceMm?: Record<string, Record<string, number>>; // rating -> nps -> mm
}

export const VALVE_CATALOG: ValveSpec[] = [
  {
    type: 'gate',
    typeName: 'Válvula de Compuerta (Gate Valve)',
    normStandard: 'API 600 (Acero Fundido) / API 602 (Acero Forjado) / ASME B16.34',
    classes: ['150#', '300#', '600#', '900#', '1500#', '2500#'],
    endConnections: ['Bridada (RF/RTJ)', 'Biselada para Soldar (BW)', 'Roscada (NPT)', 'Socket Weld (SW)'],
    trimTypes: ['Trim 1 (F6/410)', 'Trim 5 (Stellite/Stellite)', 'Trim 8 (F6/Stellite)', 'Trim 10 (316)'],
    description: 'Válvula de aislamiento paso completo on/off. Mínima caída de presión cuando está totalmente abierta. No recomendada para estrangulamiento.',
    applications: ['Líneas principales de crudo y gas', 'Sistemas de agua de enfriamiento', 'Aislamiento de equipos', 'Vapor saturado y sobrecalentado']
  },
  {
    type: 'globe',
    typeName: 'Válvula de Globo (Globe Valve)',
    normStandard: 'API 623 / BS 1873 / ASME B16.34',
    classes: ['150#', '300#', '600#', '900#', '1500#', '2500#'],
    endConnections: ['Bridada (RF/RTJ)', 'Biselada para Soldar (BW)', 'Roscada (NPT)', 'Socket Weld (SW)'],
    trimTypes: ['Trim 1 (F6/410)', 'Trim 5 (Stellite/Stellite)', 'Trim 8 (F6/Stellite)', 'Trim 12 (316/Stellite)'],
    description: 'Diseñada específicamente para regulación y estrangulamiento de flujo (throttling). Mayor caída de presión que compuerta.',
    applications: ['Control manual de flujo', 'Inyección de químicos', 'By-pass de estaciones de control', 'Purga de calderas y drenajes']
  },
  {
    type: 'check',
    typeName: 'Válvula de Retención (Check Valve / Non-Return)',
    normStandard: 'API 594 (Wafer/Lug) / API 6D (Pipeline) / BS 1868',
    classes: ['150#', '300#', '600#', '900#', '1500#', '2500#'],
    endConnections: ['Bridada (RF/RTJ)', 'Wafer Dual Plate', 'Lug Type', 'Biselada para Soldar (BW)'],
    trimTypes: ['Trim 1 (F6/410)', 'Trim 5 (Stellite/Stellite)', 'Trim 8 (F6/Stellite)'],
    description: 'Permite el flujo en una sola dirección previniendo el contraflujo perjudicial para bombas y compresores.',
    applications: ['Descarga de bombas y compresores', 'Líneas de inyección', 'Sistemas contra incendio', 'Líneas de alimentación a calderas']
  },
  {
    type: 'ball',
    typeName: 'Válvula de Bola (Ball Valve - Floating & Trunnion)',
    normStandard: 'API 6D (Oleoductos/Gasoductos) / API 608 / ASME B16.34',
    classes: ['150#', '300#', '600#', '900#', '1500#', '2500#'],
    endConnections: ['Bridada (RF/RTJ)', 'Biselada para Soldar (BW)'],
    trimTypes: ['Bola 316 / Asiento Nylon', 'Bola 316 / Asiento PEEK', 'Metal-Metal (Stellite)'],
    description: 'Aislamiento de cierre hermético rápido (1/4 de vuelta). Opción Trunnion Mounted recomendada para altos diámetros y presiones elevadas.',
    applications: ['Gasoductos y oleoductos', 'Estaciones de medición y regulación', 'Cabezales de pozos', 'Servicio amargo NACE MR0175']
  },
  {
    type: 'butterfly',
    typeName: 'Válvula Mariposa Alto Rendimiento / Triple Excéntrica',
    normStandard: 'API 609 / MSS SP-68 / ASME B16.34',
    classes: ['150#', '300#', '600#'],
    endConnections: ['Wafer', 'Lugged', 'Bridada Doble Excéntrica'],
    trimTypes: ['Disco 316 / Asiento PTFE', 'Metal-Metal Triple Excéntrica (A prueba de fuego)'],
    description: 'Diseño compacto y liviano. Cierre hermético clase VI (metal-metal en triple excéntrica). Excelente para grandes diámetros.',
    applications: ['Agua de mar / Desalinización', 'Sistemas de servicios generales', 'Plantas de tratamiento de efluentes', 'Torres de enfriamiento']
  },
  {
    type: 'plug',
    typeName: 'Válvula Macho (Plug Valve - Lubricada / No Lubricada)',
    normStandard: 'API 6D / API 599',
    classes: ['150#', '300#', '600#', '900#', '1500#'],
    endConnections: ['Bridada (RF/RTJ)', 'Biselada para Soldar (BW)'],
    trimTypes: ['Camisa de PTFE / Macho Cromado', 'Macho Lubricado con Grasa Sintética'],
    description: 'Cierre directo por rotación de macho cilíndrico o cónico. Ideal para fluidos viscosos, lodos y hidrocarburos pesados.',
    applications: ['Manejo de crudos pesados/extrapesados', 'Líneas de fango / Slurry', 'Coque de petróleo', 'Sistemas de antorcha / Flare']
  }
];

// ASME B16.10 Face-to-Face dimensions (mm) for Gate Valves
export const VALVE_FACE_TO_FACE_ASME_B1610: Record<string, Record<string, number>> = {
  '150#': {
    '2"': 178, '3"': 203, '4"': 229, '6"': 267, '8"': 292, '10"': 330, '12"': 356, '14"': 381, '16"': 406, '18"': 432, '20"': 457, '24"': 508
  },
  '300#': {
    '2"': 216, '3"': 283, '4"': 305, '6"': 403, '8"': 419, '10"': 457, '12"': 502, '14"': 762, '16"': 838, '18"': 914, '20"': 991, '24"': 1143
  },
  '600#': {
    '2"': 292, '3"': 356, '4"': 432, '6"': 559, '8"': 660, '10"': 787, '12"': 838, '14"': 889, '16"': 991, '18"': 1092, '20"': 1194, '24"': 1397
  }
};
