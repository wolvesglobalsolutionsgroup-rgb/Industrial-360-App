// src/lib/data/mechanical/gaskets.ts
// Empacaduras Industriales (Spiral Wound, RTJ, Grafito Flexible, PTFE, Fibra Comprimida)
// Normas ASME B16.20 / ASME B16.21 / API 6A

export interface GasketSpec {
  typeId: string;
  name: string;
  normStandard: string;
  description: string;
  tempRangeMinC: number;
  tempRangeMaxC: number;
  maxPressureBar: number;
  materials: string[];
  flangeCompatibility: string[];
  recommendedServices: string[];
}

export const GASKET_CATALOG: GasketSpec[] = [
  {
    typeId: 'spiral_wound_cgi',
    name: 'Empacadura Espiralada con Anillo Interno y Externo (Style CGI)',
    normStandard: 'ASME B16.20',
    description: 'Empacadura metálica espiralada de enrollamiento en V (316L) con relleno de Grafito Flexible o PTFE, anillo centrado exterior de acero al carbono y anillo retenedor interior.',
    tempRangeMinC: -200,
    tempRangeMaxC: 550,
    maxPressureBar: 250,
    materials: ['316L / Grafito / CS', '304L / Grafito / CS', 'Inconel 620 / Grafito', '316L / PTFE / 316L'],
    flangeCompatibility: ['ASME B16.5 RF (Cara Levantada)', 'ASME B16.47 Serie A/B RF'],
    recommendedServices: ['Vapor de alta presión', 'Hidrocarburos en refinerías', 'Líneas de gas natural', 'Fluidos térmicos']
  },
  {
    typeId: 'rtj_ring_joint',
    name: 'Anillo Metálico Junta Anular RTJ (Type R Oval / Octagonal / RX / BX)',
    normStandard: 'ASME B16.20 / API 6A',
    description: 'Anillo macizo de metal forjado mecanizado para encajar en la ranura RTJ de la brida. Deformación plástica metal-metal para sellado hermético ultra-alta presión.',
    tempRangeMinC: -250,
    tempRangeMaxC: 800,
    maxPressureBar: 700,
    materials: ['Hierro Dulce Soft Iron', 'Acero Inoxidable 316L', 'Monel 400', 'Inconel 625'],
    flangeCompatibility: ['ASME B16.5 RTJ (Ring Type Joint)', 'Cabezales de Pozo API 6A 2000#-15000#'],
    recommendedServices: ['Pozos petroleros de alta presión', 'Líneas de alta temperatura', 'Gas licuado cryogénico', 'Hidrocarburos amargos H2S']
  },
  {
    typeId: 'flexible_graphite_tanged',
    name: 'Lámina de Grafito Flexible con Inserto de Malla / Chapa Perforada',
    normStandard: 'ASME B16.21',
    description: 'Grafito puro expandido al 98%+ reforzado internamente con núcleo de acero inoxidable 316 perforado (tanged) de 0.1mm. Excelente relajación de esfuerzo.',
    tempRangeMinC: -200,
    tempRangeMaxC: 450,
    maxPressureBar: 100,
    materials: ['Grafito puro + Inserto SS316 Perforado'],
    flangeCompatibility: ['ASME B16.5 Flat Face (FF)', 'ASME B16.5 Raised Face (RF)'],
    recommendedServices: ['Vapor saturado y sobrecalentado', 'Aceite térmico', 'Condensado', 'Ácidos diluidos']
  },
  {
    typeId: 'ptfe_expanded',
    name: 'Lámina de PTFE Expandido / Reestructurado (Teflón Multidireccional)',
    normStandard: 'ASME B16.21',
    description: 'PTFE 100% puro fibrilado multidireccionalmente para eliminar la fluencia en frío (cold flow). Resistencia química universal ph 0-14.',
    tempRangeMinC: -240,
    tempRangeMaxC: 260,
    maxPressureBar: 80,
    materials: ['PTFE Expandido ePTFE', 'PTFE con Carga de Microesferas de Vidrio'],
    flangeCompatibility: ['Bridas de Acero RF/FF', 'Bridas de Fibra de Vidrio (FRP)', 'Bridas Esmaltadas / Vidriadas'],
    recommendedServices: ['Servicio químico agresivo (Ácido Sulfúrico, Clórico, Soda)', 'Sistemas alimenticios y farmacéuticos', 'Agua ultra pura']
  },
  {
    typeId: 'compressed_fiber',
    name: 'Lámina de Fibra Sintética Comprimida con Nitrilo (Sin Asbesto - CNAF)',
    normStandard: 'ASME B16.21',
    description: 'Empacadura libre de asbesto elaborada con fibras de aramida/Kevlar ligadas con caucho NBR (Nitrilo). Económica para servicios generales.',
    tempRangeMinC: -40,
    tempRangeMaxC: 250,
    maxPressureBar: 50,
    materials: ['Fibra Aramida + Caucho NBR', 'Fibra Mineral + Caucho SBR'],
    flangeCompatibility: ['ASME B16.5 RF/FF Class 150# y 300#'],
    recommendedServices: ['Agua potable y de proceso', 'Aire comprimido', 'Aceites lubricantes y diésel', 'Gases inertes']
  },
  {
    typeId: 'kammprofile',
    name: 'Empacadura Dentada Camprofile / Kammprofile con Capa de Grafito',
    normStandard: 'ASME B16.20',
    description: 'Núcleo metálico con ranuras concéntricas dentadas recubiertas con capas delgadas de grafito flexible o PTFE. Soporta severos ciclos térmicos.',
    tempRangeMinC: -200,
    tempRangeMaxC: 700,
    maxPressureBar: 400,
    materials: ['Núcleo SS316L + Caras de Grafito Flexible'],
    flangeCompatibility: ['ASME B16.5 RF / Male & Female / Tongue & Groove', 'Intercambiadores de calor'],
    recommendedServices: ['Intercambiadores de calor shell & tube', 'Reactores químicos', 'Líneas con choques térmicos severos']
  }
];

// Spiral Wound Gasket Dimensions per ASME B16.20 (Outer Ring OD, Inner Ring ID) in mm
export const SPIRAL_WOUND_DIMENSIONS_B1620: Record<string, Record<string, { outerOdMm: number; innerIdMm: number; windingOdMm: number; windingIdMm: number }>> = {
  '150#': {
    '1/2"':  { outerOdMm: 48, innerIdMm: 14, windingOdMm: 33, windingIdMm: 19 },
    '3/4"':  { outerOdMm: 57, innerIdMm: 21, windingOdMm: 40, windingIdMm: 25 },
    '1"':    { outerOdMm: 67, innerIdMm: 27, windingOdMm: 48, windingIdMm: 32 },
    '1-1/2"': { outerOdMm: 86, innerIdMm: 42, windingOdMm: 64, windingIdMm: 48 },
    '2"':    { outerOdMm: 105, innerIdMm: 52, windingOdMm: 73, windingIdMm: 57 },
    '3"':    { outerOdMm: 137, innerIdMm: 78, windingOdMm: 102, windingIdMm: 83 },
    '4"':    { outerOdMm: 175, innerIdMm: 102, windingOdMm: 127, windingIdMm: 108 },
    '6"':    { outerOdMm: 222, innerIdMm: 154, windingOdMm: 178, windingIdMm: 160 },
    '8"':    { outerOdMm: 279, innerIdMm: 203, windingOdMm: 230, windingIdMm: 210 },
    '10"':   { outerOdMm: 340, innerIdMm: 257, windingOdMm: 283, windingIdMm: 264 },
    '12"':   { outerOdMm: 410, innerIdMm: 308, windingOdMm: 337, windingIdMm: 318 },
    '14"':   { outerOdMm: 451, innerIdMm: 337, windingOdMm: 375, windingIdMm: 356 },
    '16"':   { outerOdMm: 514, innerIdMm: 387, windingOdMm: 425, windingIdMm: 406 },
    '18"':   { outerOdMm: 549, innerIdMm: 438, windingOdMm: 476, windingIdMm: 457 },
    '20"':   { outerOdMm: 606, innerIdMm: 489, windingOdMm: 527, windingIdMm: 508 },
    '24"':   { outerOdMm: 718, innerIdMm: 591, windingOdMm: 629, windingIdMm: 610 },
  },
  '300#': {
    '1/2"':  { outerOdMm: 54, innerIdMm: 14, windingOdMm: 33, windingIdMm: 19 },
    '3/4"':  { outerOdMm: 67, innerIdMm: 21, windingOdMm: 40, windingIdMm: 25 },
    '1"':    { outerOdMm: 73, innerIdMm: 27, windingOdMm: 48, windingIdMm: 32 },
    '2"':    { outerOdMm: 111, innerIdMm: 52, windingOdMm: 73, windingIdMm: 57 },
    '3"':    { outerOdMm: 149, innerIdMm: 78, windingOdMm: 102, windingIdMm: 83 },
    '4"':    { outerOdMm: 181, innerIdMm: 102, windingOdMm: 127, windingIdMm: 108 },
    '6"':    { outerOdMm: 251, innerIdMm: 154, windingOdMm: 178, windingIdMm: 160 },
    '8"':    { outerOdMm: 308, innerIdMm: 203, windingOdMm: 230, windingIdMm: 210 },
    '10"':   { outerOdMm: 362, innerIdMm: 257, windingOdMm: 283, windingIdMm: 264 },
    '12"':   { outerOdMm: 422, innerIdMm: 308, windingOdMm: 337, windingIdMm: 318 },
  }
};
