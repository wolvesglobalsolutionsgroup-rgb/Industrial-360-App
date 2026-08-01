// src/lib/data/mechanical/bolting.ts
// Especificaciones técnicas de Pernos Espárragos, Tuercas Pesadas y Materiales
// Según ASME B18.2.1 (Pernos), ASME B18.2.2 (Tuercas Pesadas), ASME B16.5 (Longitudes por clase),
// ASTM A193 (Materiales de Pernos/Espárragos), ASTM A194 (Materiales de Tuercas).

export interface StudBoltSpec {
  boltDiamInches: string;
  thread: string;
  threadPerInch: number;
  lengthPerFlangeMm: Record<string, number>;
  weightPer100Kg: number;
  socketAcrossFlatsInches: string;
  socketAcrossFlatsMm: number;
  tensileStrengthPsi: number;
  yieldStrengthPsi: number;
  hardnessBHN: number;
  material: string;
}

export interface HeavyHexNutSpec {
  nutDiamInches: string;
  socketInches: string;
  socketMm: number;
  heightInches: string;
  heightMm: number;
  weightPer100Kg: number;
  proofLoadPsi: number;
  material: string;
}

export interface BoltMaterialSpec {
  grade: string;
  standard: string;
  type: string;
  minTensilePsi: number;
  minYieldPsi: number;
  tempMinC: number;
  tempMaxC: number;
  application: string;
}

export interface NutMaterialSpec {
  grade: string;
  standard: string;
  proofLoadPsi: number;
  hardness: string;
  matchingBolt: string;
}

export const STUD_BOLTS: Record<string, StudBoltSpec> = {
  '1/2"': {
    boltDiamInches: '1/2"',
    thread: 'UNC',
    threadPerInch: 13,
    socketAcrossFlatsInches: '7/8"',
    socketAcrossFlatsMm: 22.2,
    weightPer100Kg: 7.8,
    tensileStrengthPsi: 125000,
    yieldStrengthPsi: 105000,
    hardnessBHN: 321,
    material: 'ASTM A193 Gr.B7',
    lengthPerFlangeMm: { '150#': 55, '300#': 60, '600#': 65, '900#': 75, '1500#': 85, '2500#': 95 }
  },
  '5/8"': {
    boltDiamInches: '5/8"',
    thread: 'UNC',
    threadPerInch: 11,
    socketAcrossFlatsInches: '1-1/16"',
    socketAcrossFlatsMm: 27.0,
    weightPer100Kg: 13.0,
    tensileStrengthPsi: 125000,
    yieldStrengthPsi: 105000,
    hardnessBHN: 321,
    material: 'ASTM A193 Gr.B7',
    lengthPerFlangeMm: { '150#': 65, '300#': 70, '600#': 75, '900#': 85, '1500#': 95, '2500#': 110 }
  },
  '3/4"': {
    boltDiamInches: '3/4"',
    thread: 'UNC',
    threadPerInch: 10,
    socketAcrossFlatsInches: '1-1/4"',
    socketAcrossFlatsMm: 31.8,
    weightPer100Kg: 19.5,
    tensileStrengthPsi: 125000,
    yieldStrengthPsi: 105000,
    hardnessBHN: 321,
    material: 'ASTM A193 Gr.B7',
    lengthPerFlangeMm: { '150#': 70, '300#': 80, '600#': 90, '900#': 100, '1500#': 110, '2500#': 125 }
  },
  '7/8"': {
    boltDiamInches: '7/8"',
    thread: 'UNC',
    threadPerInch: 9,
    socketAcrossFlatsInches: '1-7/16"',
    socketAcrossFlatsMm: 36.5,
    weightPer100Kg: 27.5,
    tensileStrengthPsi: 125000,
    yieldStrengthPsi: 105000,
    hardnessBHN: 321,
    material: 'ASTM A193 Gr.B7',
    lengthPerFlangeMm: { '150#': 80, '300#': 90, '600#': 100, '900#': 115, '1500#': 125, '2500#': 140 }
  },
  '1"': {
    boltDiamInches: '1"',
    thread: '8-UN',
    threadPerInch: 8,
    socketAcrossFlatsInches: '1-5/8"',
    socketAcrossFlatsMm: 41.3,
    weightPer100Kg: 38.0,
    tensileStrengthPsi: 125000,
    yieldStrengthPsi: 105000,
    hardnessBHN: 321,
    material: 'ASTM A193 Gr.B7',
    lengthPerFlangeMm: { '150#': 90, '300#': 100, '600#': 115, '900#': 125, '1500#': 140, '2500#': 160 }
  },
  '1-1/8"': {
    boltDiamInches: '1-1/8"',
    thread: '8-UN',
    threadPerInch: 8,
    socketAcrossFlatsInches: '1-13/16"',
    socketAcrossFlatsMm: 46.0,
    weightPer100Kg: 50.5,
    tensileStrengthPsi: 125000,
    yieldStrengthPsi: 105000,
    hardnessBHN: 321,
    material: 'ASTM A193 Gr.B7',
    lengthPerFlangeMm: { '150#': 100, '300#': 115, '600#': 125, '900#': 140, '1500#': 160, '2500#': 180 }
  },
  '1-1/4"': {
    boltDiamInches: '1-1/4"',
    thread: '8-UN',
    threadPerInch: 8,
    socketAcrossFlatsInches: '2"',
    socketAcrossFlatsMm: 50.8,
    weightPer100Kg: 65.0,
    tensileStrengthPsi: 125000,
    yieldStrengthPsi: 105000,
    hardnessBHN: 321,
    material: 'ASTM A193 Gr.B7',
    lengthPerFlangeMm: { '150#': 110, '300#': 125, '600#': 140, '900#': 155, '1500#': 180, '2500#': 200 }
  },
  '1-3/8"': {
    boltDiamInches: '1-3/8"',
    thread: '8-UN',
    threadPerInch: 8,
    socketAcrossFlatsInches: '2-3/16"',
    socketAcrossFlatsMm: 55.6,
    weightPer100Kg: 82.0,
    tensileStrengthPsi: 125000,
    yieldStrengthPsi: 105000,
    hardnessBHN: 321,
    material: 'ASTM A193 Gr.B7',
    lengthPerFlangeMm: { '150#': 120, '300#': 140, '600#': 155, '900#': 175, '1500#': 200, '2500#': 225 }
  },
  '1-1/2"': {
    boltDiamInches: '1-1/2"',
    thread: '8-UN',
    threadPerInch: 8,
    socketAcrossFlatsInches: '2-3/8"',
    socketAcrossFlatsMm: 60.3,
    weightPer100Kg: 101.0,
    tensileStrengthPsi: 125000,
    yieldStrengthPsi: 105000,
    hardnessBHN: 321,
    material: 'ASTM A193 Gr.B7',
    lengthPerFlangeMm: { '150#': 130, '300#': 150, '600#': 170, '900#': 190, '1500#': 220, '2500#': 250 }
  },
  '1-3/4"': {
    boltDiamInches: '1-3/4"',
    thread: '8-UN',
    threadPerInch: 8,
    socketAcrossFlatsInches: '2-3/4"',
    socketAcrossFlatsMm: 69.9,
    weightPer100Kg: 148.0,
    tensileStrengthPsi: 125000,
    yieldStrengthPsi: 105000,
    hardnessBHN: 321,
    material: 'ASTM A193 Gr.B7',
    lengthPerFlangeMm: { '150#': 150, '300#': 175, '600#': 200, '900#': 225, '1500#': 250, '2500#': 290 }
  },
  '2"': {
    boltDiamInches: '2"',
    thread: '8-UN',
    threadPerInch: 8,
    socketAcrossFlatsInches: '3-1/8"',
    socketAcrossFlatsMm: 79.4,
    weightPer100Kg: 205.0,
    tensileStrengthPsi: 125000,
    yieldStrengthPsi: 105000,
    hardnessBHN: 321,
    material: 'ASTM A193 Gr.B7',
    lengthPerFlangeMm: { '150#': 175, '300#': 200, '600#': 230, '900#': 260, '1500#': 290, '2500#': 330 }
  },
  '2-1/4"': {
    boltDiamInches: '2-1/4"',
    thread: '8-UN',
    threadPerInch: 8,
    socketAcrossFlatsInches: '3-1/2"',
    socketAcrossFlatsMm: 88.9,
    weightPer100Kg: 275.0,
    tensileStrengthPsi: 125000,
    yieldStrengthPsi: 105000,
    hardnessBHN: 321,
    material: 'ASTM A193 Gr.B7',
    lengthPerFlangeMm: { '150#': 200, '300#': 225, '600#': 260, '900#': 290, '1500#': 330, '2500#': 380 }
  },
  '2-1/2"': {
    boltDiamInches: '2-1/2"',
    thread: '8-UN',
    threadPerInch: 8,
    socketAcrossFlatsInches: '3-7/8"',
    socketAcrossFlatsMm: 98.4,
    weightPer100Kg: 355.0,
    tensileStrengthPsi: 125000,
    yieldStrengthPsi: 105000,
    hardnessBHN: 321,
    material: 'ASTM A193 Gr.B7',
    lengthPerFlangeMm: { '150#': 225, '300#': 250, '600#': 290, '900#': 330, '1500#': 370, '2500#': 420 }
  }
};

export const HEAVY_HEX_NUTS: Record<string, HeavyHexNutSpec> = {
  '1/2"':  { nutDiamInches: '1/2"',  socketInches: '7/8"',    socketMm: 22.2, heightInches: '31/64"', heightMm: 12.3, weightPer100Kg: 3.2,  proofLoadPsi: 175000, material: 'ASTM A194 Gr.2H' },
  '5/8"':  { nutDiamInches: '5/8"',  socketInches: '1-1/16"', socketMm: 27.0, heightInches: '39/64"', heightMm: 15.5, weightPer100Kg: 5.4,  proofLoadPsi: 175000, material: 'ASTM A194 Gr.2H' },
  '3/4"':  { nutDiamInches: '3/4"',  socketInches: '1-1/4"',  socketMm: 31.8, heightInches: '47/64"', heightMm: 18.7, weightPer100Kg: 8.8,  proofLoadPsi: 175000, material: 'ASTM A194 Gr.2H' },
  '7/8"':  { nutDiamInches: '7/8"',  socketInches: '1-7/16"', socketMm: 36.5, heightInches: '55/64"', heightMm: 21.8, weightPer100Kg: 13.5, proofLoadPsi: 175000, material: 'ASTM A194 Gr.2H' },
  '1"':    { nutDiamInches: '1"',    socketInches: '1-5/8"',  socketMm: 41.3, heightInches: '63/64"', heightMm: 25.0, weightPer100Kg: 19.5, proofLoadPsi: 175000, material: 'ASTM A194 Gr.2H' },
  '1-1/8"': { nutDiamInches: '1-1/8"', socketInches: '1-13/16"', socketMm: 46.0, heightInches: '1-7/64"', heightMm: 28.2, weightPer100Kg: 27.0, proofLoadPsi: 175000, material: 'ASTM A194 Gr.2H' },
  '1-1/4"': { nutDiamInches: '1-1/4"', socketInches: '2"',      socketMm: 50.8, heightInches: '1-7/32"', heightMm: 31.0, weightPer100Kg: 36.0, proofLoadPsi: 175000, material: 'ASTM A194 Gr.2H' },
  '1-3/8"': { nutDiamInches: '1-3/8"', socketInches: '2-3/16"', socketMm: 55.6, heightInches: '1-11/32"', heightMm: 34.1, weightPer100Kg: 47.0, proofLoadPsi: 175000, material: 'ASTM A194 Gr.2H' },
  '1-1/2"': { nutDiamInches: '1-1/2"', socketInches: '2-3/8"',  socketMm: 60.3, heightInches: '1-15/32"', heightMm: 37.3, weightPer100Kg: 60.0, proofLoadPsi: 175000, material: 'ASTM A194 Gr.2H' },
  '1-3/4"': { nutDiamInches: '1-3/4"', socketInches: '2-3/4"',  socketMm: 69.9, heightInches: '1-23/32"', heightMm: 43.7, weightPer100Kg: 92.0, proofLoadPsi: 175000, material: 'ASTM A194 Gr.2H' },
  '2"':    { nutDiamInches: '2"',    socketInches: '3-1/8"',  socketMm: 79.4, heightInches: '1-31/32"', heightMm: 50.0, weightPer100Kg: 135.0, proofLoadPsi: 175000, material: 'ASTM A194 Gr.2H' },
  '2-1/4"': { nutDiamInches: '2-1/4"', socketInches: '3-1/2"',  socketMm: 88.9, heightInches: '2-7/32"', heightMm: 56.4, weightPer100Kg: 190.0, proofLoadPsi: 175000, material: 'ASTM A194 Gr.2H' },
  '2-1/2"': { nutDiamInches: '2-1/2"', socketInches: '3-7/8"',  socketMm: 98.4, heightInches: '2-[15/32"', heightMm: 62.7, weightPer100Kg: 255.0, proofLoadPsi: 175000, material: 'ASTM A194 Gr.2H' }
};

export const BOLT_MATERIALS: Record<string, BoltMaterialSpec> = {
  'A193_B7': {
    grade: 'ASTM A193 Gr. B7',
    standard: 'ASME SA193 B7',
    type: 'Acero Aleado Tratado Térmicamente (Cr-Mo)',
    minTensilePsi: 125000,
    minYieldPsi: 105000,
    tempMinC: -29,
    tempMaxC: 425,
    application: 'Uso estándar de alta presión y temperatura en refinación y tuberías de proceso O&G.'
  },
  'A193_B7M': {
    grade: 'ASTM A193 Gr. B7M',
    standard: 'ASME SA193 B7M',
    type: 'Acero Aleado Resistente a H2S (NACE MR0175)',
    minTensilePsi: 100000,
    minYieldPsi: 80000,
    tempMinC: -29,
    tempMaxC: 425,
    application: 'Servicio amargo con sulfuro de hidrógeno (H2S), cabezales de pozo y separación multifásica.'
  },
  'A193_B8': {
    grade: 'ASTM A193 Gr. B8 Cl.1',
    standard: 'ASME SA193 B8',
    type: 'Acero Inoxidable Austenítico (AISI 304)',
    minTensilePsi: 75000,
    minYieldPsi: 30000,
    tempMinC: -196,
    tempMaxC: 800,
    application: 'Servicio criogénico y entornos moderadamente corrosivos.'
  },
  'A193_B8M': {
    grade: 'ASTM A193 Gr. B8M Cl.2',
    standard: 'ASME SA193 B8M',
    type: 'Acero Inoxidable Alta Resistencia (AISI 316)',
    minTensilePsi: 110000,
    minYieldPsi: 95000,
    tempMinC: -196,
    tempMaxC: 800,
    application: 'Instalaciones costa afuera, plataformas marinas e industrias químicas altamente corrosivas.'
  },
  'A320_L7': {
    grade: 'ASTM A320 Gr. L7',
    standard: 'ASME SA320 L7',
    type: 'Acero Aleado para Baja Temperatura (Impacto Charpy V-Notch)',
    minTensilePsi: 125000,
    minYieldPsi: 105000,
    tempMinC: -101,
    tempMaxC: 340,
    application: 'Plantas de GNL, criogenia y climas árticos/subcero.'
  }
};

export const NUT_MATERIALS: Record<string, NutMaterialSpec> = {
  'A194_2H': {
    grade: 'ASTM A194 Gr. 2H',
    standard: 'ASME SA194 2H',
    proofLoadPsi: 175000,
    hardness: 'Rockwell C24 a C38 (248-352 HB)',
    matchingBolt: 'ASTM A193 Gr. B7 / B16'
  },
  'A194_2HM': {
    grade: 'ASTM A194 Gr. 2HM',
    standard: 'ASME SA194 2HM',
    proofLoadPsi: 150000,
    hardness: 'Rockwell C22 Max (NACE MR0175 / ISO 15156)',
    matchingBolt: 'ASTM A193 Gr. B7M'
  },
  'A194_8': {
    grade: 'ASTM A194 Gr. 8',
    standard: 'ASME SA194 8',
    proofLoadPsi: 75000,
    hardness: 'Rockwell B60 a B90 (AISI 304)',
    matchingBolt: 'ASTM A193 Gr. B8'
  },
  'A194_8M': {
    grade: 'ASTM A194 Gr. 8M',
    standard: 'ASME SA194 8M',
    proofLoadPsi: 75000,
    hardness: 'Rockwell B60 a B90 (AISI 316)',
    matchingBolt: 'ASTM A193 Gr. B8M'
  },
  'A194_7': {
    grade: 'ASTM A194 Gr. 7',
    standard: 'ASME SA194 7',
    proofLoadPsi: 175000,
    hardness: 'Rockwell C24 a C38 (Servicio Criogénico)',
    matchingBolt: 'ASTM A320 Gr. L7'
  }
};
