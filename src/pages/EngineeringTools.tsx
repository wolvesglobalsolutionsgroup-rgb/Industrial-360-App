import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Wrench, 
  Flame, 
  Gauge, 
  Disc, 
  Paintbrush, 
  Database, 
  Box, 
  ArrowRightLeft, 
  Activity, 
  Zap, 
  ShieldAlert, 
  Building2, 
  Layers, 
  Ruler, 
  Info, 
  CheckCircle2, 
  Truck, 
  Volume2, 
  Cpu, 
  Droplets,
  HardHat,
  Thermometer
} from 'lucide-react';

// ==========================================
// DATA STRUCTURES & DATA TABLES
// ==========================================

// 1. FLANGE MATRIX ANSI & API
interface FlangeMatrixSpec {
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
}

const FLANGE_DATA: Record<string, Record<string, FlangeMatrixSpec>> = {
  '150#': {
    '1/2"': { nps: '1/2"', odMm: 89, thicknessMm: 11.2, bcdMm: 60.3, holesCount: 4, holeDiamInches: '5/8"', boltDiamInches: '1/2"-13 UNC', socketInches: '7/8"', socketMm: 22, torqueFtLb: 60 },
    '3/4"': { nps: '3/4"', odMm: 98, thicknessMm: 12.7, bcdMm: 69.8, holesCount: 4, holeDiamInches: '5/8"', boltDiamInches: '1/2"-13 UNC', socketInches: '7/8"', socketMm: 22, torqueFtLb: 60 },
    '1"': { nps: '1"', odMm: 108, thicknessMm: 14.3, bcdMm: 79.4, holesCount: 4, holeDiamInches: '5/8"', boltDiamInches: '1/2"-13 UNC', socketInches: '7/8"', socketMm: 22, torqueFtLb: 60 },
    '2"': { nps: '2"', odMm: 152, thicknessMm: 19.1, bcdMm: 120.7, holesCount: 4, holeDiamInches: '3/4"', boltDiamInches: '5/8"-11 UNC', socketInches: '1-1/16"', socketMm: 27, torqueFtLb: 120 },
    '3"': { nps: '3"', odMm: 191, thicknessMm: 23.9, bcdMm: 152.4, holesCount: 4, holeDiamInches: '3/4"', boltDiamInches: '5/8"-11 UNC', socketInches: '1-1/16"', socketMm: 27, torqueFtLb: 120 },
    '4"': { nps: '4"', odMm: 229, thicknessMm: 23.9, bcdMm: 190.5, holesCount: 8, holeDiamInches: '3/4"', boltDiamInches: '5/8"-11 UNC', socketInches: '1-1/16"', socketMm: 27, torqueFtLb: 120 },
    '6"': { nps: '6"', odMm: 279, thicknessMm: 25.4, bcdMm: 241.3, holesCount: 8, holeDiamInches: '7/8"', boltDiamInches: '3/4"-10 UNC', socketInches: '1-1/4"', socketMm: 32, torqueFtLb: 200 },
    '8"': { nps: '8"', odMm: 343, thicknessMm: 28.6, bcdMm: 298.5, holesCount: 8, holeDiamInches: '7/8"', boltDiamInches: '3/4"-10 UNC', socketInches: '1-1/4"', socketMm: 32, torqueFtLb: 200 },
    '10"': { nps: '10"', odMm: 406, thicknessMm: 30.2, bcdMm: 362.0, holesCount: 12, holeDiamInches: '1"', boltDiamInches: '7/8"-9 UNC', socketInches: '1-7/16"', socketMm: 36, torqueFtLb: 320 },
    '12"': { nps: '12"', odMm: 483, thicknessMm: 31.8, bcdMm: 431.8, holesCount: 12, holeDiamInches: '1"', boltDiamInches: '7/8"-9 UNC', socketInches: '1-7/16"', socketMm: 36, torqueFtLb: 320 },
    '16"': { nps: '16"', odMm: 597, thicknessMm: 36.5, bcdMm: 539.8, holesCount: 16, holeDiamInches: '1-1/8"', boltDiamInches: '1"-8 UNC', socketInches: '1-5/8"', socketMm: 41, torqueFtLb: 480 },
    '24"': { nps: '24"', odMm: 813, thicknessMm: 47.6, bcdMm: 749.3, holesCount: 20, holeDiamInches: '1-3/8"', boltDiamInches: '1-1/4"-8 UN', socketInches: '2"', socketMm: 50, torqueFtLb: 1000 }
  },
  '300#': {
    '2"': { nps: '2"', odMm: 165, thicknessMm: 22.4, bcdMm: 127.0, holesCount: 8, holeDiamInches: '3/4"', boltDiamInches: '5/8"-11 UNC', socketInches: '1-1/16"', socketMm: 27, torqueFtLb: 120 },
    '3"': { nps: '3"', odMm: 210, thicknessMm: 28.6, bcdMm: 168.3, holesCount: 8, holeDiamInches: '7/8"', boltDiamInches: '3/4"-10 UNC', socketInches: '1-1/4"', socketMm: 32, torqueFtLb: 200 },
    '4"': { nps: '4"', odMm: 254, thicknessMm: 31.8, bcdMm: 200.0, holesCount: 8, holeDiamInches: '7/8"', boltDiamInches: '3/4"-10 UNC', socketInches: '1-1/4"', socketMm: 32, torqueFtLb: 200 },
    '6"': { nps: '6"', odMm: 318, thicknessMm: 36.5, bcdMm: 269.9, holesCount: 12, holeDiamInches: '7/8"', boltDiamInches: '3/4"-10 UNC', socketInches: '1-1/4"', socketMm: 32, torqueFtLb: 200 },
    '8"': { nps: '8"', odMm: 381, thicknessMm: 41.3, bcdMm: 330.2, holesCount: 12, holeDiamInches: '1"', boltDiamInches: '7/8"-9 UNC', socketInches: '1-7/16"', socketMm: 36, torqueFtLb: 320 },
    '12"': { nps: '12"', odMm: 521, thicknessMm: 50.8, bcdMm: 457.2, holesCount: 16, holeDiamInches: '1-1/4"', boltDiamInches: '1-1/8"-8 UN', socketInches: '1-13/16"', socketMm: 46, torqueFtLb: 710 }
  },
  '600#': {
    '2"': { nps: '2"', odMm: 165, thicknessMm: 25.4, bcdMm: 127.0, holesCount: 8, holeDiamInches: '3/4"', boltDiamInches: '5/8"-11 UNC', socketInches: '1-1/16"', socketMm: 27, torqueFtLb: 140 },
    '4"': { nps: '4"', odMm: 273, thicknessMm: 38.1, bcdMm: 215.9, holesCount: 8, holeDiamInches: '1"', boltDiamInches: '7/8"-9 UNC', socketInches: '1-7/16"', socketMm: 36, torqueFtLb: 360 },
    '6"': { nps: '6"', odMm: 356, thicknessMm: 47.6, bcdMm: 292.1, holesCount: 12, holeDiamInches: '1-1/8"', boltDiamInches: '1"-8 UNC', socketInches: '1-5/8"', socketMm: 41, torqueFtLb: 540 },
    '8"': { nps: '8"', odMm: 419, thicknessMm: 55.6, bcdMm: 349.2, holesCount: 12, holeDiamInches: '1-1/4"', boltDiamInches: '1-1/8"-8 UN', socketInches: '1-13/16"', socketMm: 46, torqueFtLb: 780 }
  },
  '900#': {
    '3"': { nps: '3"', odMm: 241, thicknessMm: 38.1, bcdMm: 190.5, holesCount: 8, holeDiamInches: '1"', boltDiamInches: '7/8"-9 UNC', socketInches: '1-7/16"', socketMm: 36, torqueFtLb: 380 },
    '6"': { nps: '6"', odMm: 381, thicknessMm: 55.6, bcdMm: 317.5, holesCount: 12, holeDiamInches: '1-1/4"', boltDiamInches: '1-1/8"-8 UN', socketInches: '1-13/16"', socketMm: 46, torqueFtLb: 820 }
  },
  '1500#': {
    '2"': { nps: '2"', odMm: 216, thicknessMm: 38.1, bcdMm: 165.1, holesCount: 8, holeDiamInches: '1"', boltDiamInches: '7/8"-9 UNC', socketInches: '1-7/16"', socketMm: 36, torqueFtLb: 380 },
    '4"': { nps: '4"', odMm: 311, thicknessMm: 54.0, bcdMm: 241.3, holesCount: 8, holeDiamInches: '1-3/8"', boltDiamInches: '1-1/4"-8 UN', socketInches: '2"', socketMm: 50, torqueFtLb: 1200 }
  },
  '2500#': {
    '2"': { nps: '2"', odMm: 235, thicknessMm: 50.8, bcdMm: 171.4, holesCount: 8, holeDiamInches: '1-1/8"', boltDiamInches: '1"-8 UNC', socketInches: '1-5/8"', socketMm: 41, torqueFtLb: 580 },
    '4"': { nps: '4"', odMm: 356, thicknessMm: 76.2, bcdMm: 273.0, holesCount: 8, holeDiamInches: '1-5/8"', boltDiamInches: '1-1/2"-8 UN', socketInches: '2-3/8"', socketMm: 60, torqueFtLb: 2100 }
  },
  'API 3K': {
    '2-1/16"': { nps: '2-1/16"', odMm: 200, thicknessMm: 33.3, bcdMm: 146.0, holesCount: 8, holeDiamInches: '7/8"', boltDiamInches: '3/4"-10 UNC', socketInches: '1-1/4"', socketMm: 32, torqueFtLb: 220 },
    '4-1/16"': { nps: '4-1/16"', odMm: 275, thicknessMm: 44.5, bcdMm: 215.9, holesCount: 8, holeDiamInches: '1"', boltDiamInches: '7/8"-9 UNC', socketInches: '1-7/16"', socketMm: 36, torqueFtLb: 410 }
  },
  'API 5K': {
    '2-1/16"': { nps: '2-1/16"', odMm: 215, thicknessMm: 38.1, bcdMm: 165.1, holesCount: 8, holeDiamInches: '1"', boltDiamInches: '7/8"-9 UNC', socketInches: '1-7/16"', socketMm: 36, torqueFtLb: 420 },
    '4-1/16"': { nps: '4-1/16"', odMm: 310, thicknessMm: 54.0, bcdMm: 241.3, holesCount: 8, holeDiamInches: '1-3/8"', boltDiamInches: '1-1/4"-8 UN', socketInches: '2"', socketMm: 50, torqueFtLb: 1250 }
  },
  'API 10K': {
    '2-1/16"': { nps: '2-1/16"', odMm: 200, thicknessMm: 46.0, bcdMm: 146.0, holesCount: 8, holeDiamInches: '7/8"', boltDiamInches: '3/4"-10 UNC', socketInches: '1-1/4"', socketMm: 32, torqueFtLb: 280 },
    '4-1/16"': { nps: '4-1/16"', odMm: 315, thicknessMm: 70.0, bcdMm: 241.3, holesCount: 8, holeDiamInches: '1-3/8"', boltDiamInches: '1-1/4"-8 UN', socketInches: '2"', socketMm: 50, torqueFtLb: 1450 }
  }
};

// 2. VALVE FACE-TO-FACE ASME B16.10
interface ValveSpec {
  nps: string;
  gate150Mm: number;
  ball150Mm: number;
  globe150Mm: number;
  check150Mm: number;
  butterflyMm: number;
  plug150Mm: number;
}

const VALVE_FACE_DATA: Record<string, ValveSpec> = {
  '2"': { nps: '2"', gate150Mm: 178, ball150Mm: 178, globe150Mm: 203, check150Mm: 203, butterflyMm: 43, plug150Mm: 178 },
  '3"': { nps: '3"', gate150Mm: 203, ball150Mm: 203, globe150Mm: 241, check150Mm: 241, butterflyMm: 46, plug150Mm: 203 },
  '4"': { nps: '4"', gate150Mm: 229, ball150Mm: 229, globe150Mm: 292, check150Mm: 292, butterflyMm: 52, plug150Mm: 229 },
  '6"': { nps: '6"', gate150Mm: 267, ball150Mm: 394, globe150Mm: 406, check150Mm: 356, butterflyMm: 56, plug150Mm: 267 },
  '8"': { nps: '8"', gate150Mm: 292, ball150Mm: 457, globe150Mm: 495, check150Mm: 495, butterflyMm: 64, plug150Mm: 292 },
  '10"': { nps: '10"', gate150Mm: 330, ball150Mm: 533, globe150Mm: 622, check150Mm: 622, butterflyMm: 68, plug150Mm: 330 },
  '12"': { nps: '12"', gate150Mm: 356, ball150Mm: 610, globe150Mm: 698, check150Mm: 698, butterflyMm: 78, plug150Mm: 356 }
};

// 3. REINFORCING BARS (CABILLAS) COVENIN / ASTM
interface RebarSpec {
  designation: string;
  nominalDiamMm: number;
  nominalDiamInches: string;
  weightKgPerMeter: number;
  lapLengthMeters: number; // 40d
}

const REBAR_DATA: RebarSpec[] = [
  { designation: 'N° 3 (3/8")', nominalDiamMm: 9.5, nominalDiamInches: '3/8"', weightKgPerMeter: 0.560, lapLengthMeters: 0.40 },
  { designation: 'N° 4 (1/2")', nominalDiamMm: 12.7, nominalDiamInches: '1/2"', weightKgPerMeter: 0.994, lapLengthMeters: 0.50 },
  { designation: 'N° 5 (5/8")', nominalDiamMm: 15.9, nominalDiamInches: '5/8"', weightKgPerMeter: 1.552, lapLengthMeters: 0.65 },
  { designation: 'N° 6 (3/4")', nominalDiamMm: 19.1, nominalDiamInches: '3/4"', weightKgPerMeter: 2.235, lapLengthMeters: 0.80 },
  { designation: 'N° 7 (7/8")', nominalDiamMm: 22.2, nominalDiamInches: '7/8"', weightKgPerMeter: 3.042, lapLengthMeters: 0.90 },
  { designation: 'N° 8 (1")', nominalDiamMm: 25.4, nominalDiamInches: '1"', weightKgPerMeter: 3.973, lapLengthMeters: 1.05 },
  { designation: 'N° 9 (1-1/8")', nominalDiamMm: 28.7, nominalDiamInches: '1-1/8"', weightKgPerMeter: 5.060, lapLengthMeters: 1.20 },
  { designation: 'N° 10 (1-1/4")', nominalDiamMm: 32.3, nominalDiamInches: '1-1/4"', weightKgPerMeter: 6.404, lapLengthMeters: 1.35 },
  { designation: 'N° 11 (1-3/8")', nominalDiamMm: 35.8, nominalDiamInches: '1-3/8"', weightKgPerMeter: 7.907, lapLengthMeters: 1.50 }
];

export default function EngineeringTools() {
  const [activeMainTab, setActiveMainTab] = useState<
    | 'piping'
    | 'instrumentation'
    | 'process'
    | 'coatings'
    | 'electrical'
    | 'civil'
    | 'siho'
    | 'conversions'
  >('piping');

  // ==========================================
  // STATE FOR TAB 1: PIPING, FLANGES & VALVES
  // ==========================================
  const [flangeClassSelect, setFlangeClassSelect] = useState<string>('150#');
  const [flangeNpsSelect, setFlangeNpsSelect] = useState<string>('4"');
  const [assemblyType, setAssemblyType] = useState<'flange_flange' | 'flange_gate_valve' | 'flange_butterfly'>('flange_flange');

  // Barlow Pipe thickness calc state
  const [pipePressPsi, setPipePressPsi] = useState<number>(600);
  const [pipeOdInches, setPipeOdInches] = useState<number>(8.625);
  const [smysPsi, setSmysPsi] = useState<number>(52000); // X52
  const [jointEffE, setJointEffE] = useState<number>(1.0); // Seamless/ERW
  const [designFactorF, setDesignFactorF] = useState<number>(0.72); // B31.3/B31.4
  const [corrosionAllowanceMm, setCorrosionAllowanceMm] = useState<number>(1.5);

  // Barlow Calculated
  const calculatedReqThicknessInches = (pipePressPsi * pipeOdInches) / (2 * (smysPsi * designFactorF * jointEffE) + 2 * pipePressPsi * 0.4);
  const calculatedReqThicknessMm = calculatedReqThicknessInches * 25.4 + corrosionAllowanceMm;
  const hydrotestPressurePsi = pipePressPsi * 1.5;

  // Selected Flange spec
  const currentFlangeClassData = FLANGE_DATA[flangeClassSelect] || FLANGE_DATA['150#'];
  const currentFlangeSpec = currentFlangeClassData[flangeNpsSelect] || Object.values(currentFlangeClassData)[0];

  // Stud length estimation
  let studLengthInches = 3.5;
  if (assemblyType === 'flange_flange') {
    studLengthInches = Math.ceil((currentFlangeSpec.thicknessMm * 2) / 25.4 + 1.5);
  } else if (assemblyType === 'flange_gate_valve') {
    const vSpec = VALVE_FACE_DATA[flangeNpsSelect] || VALVE_FACE_DATA['4"'];
    studLengthInches = Math.ceil((currentFlangeSpec.thicknessMm * 2 + vSpec.gate150Mm) / 25.4 + 1.5);
  } else {
    const vSpec = VALVE_FACE_DATA[flangeNpsSelect] || VALVE_FACE_DATA['4"'];
    studLengthInches = Math.ceil((currentFlangeSpec.thicknessMm * 2 + vSpec.butterflyMm) / 25.4 + 1.5);
  }

  // ==========================================
  // STATE FOR TAB 2: I&C
  // ==========================================
  const [psvFlowGpm, setPsvFlowGpm] = useState<number>(450);
  const [psvSetPressPsi, setPsvSetPressPsi] = useState<number>(250);
  const [psvBackPressPsi, setPsvBackPressPsi] = useState<number>(15);
  const [psvFluidSg, setPsvFluidSg] = useState<number>(0.85);

  // PSV Orifice area calculation (liquid approx API 520)
  const psvDeltaP = psvSetPressPsi - psvBackPressPsi;
  const calculatedCv = (psvFlowGpm * Math.sqrt(psvFluidSg)) / Math.sqrt(Math.max(1, psvDeltaP));
  const reqOrificeAreaSqIn = (psvFlowGpm * Math.sqrt(psvFluidSg)) / (38 * 0.62 * Math.sqrt(Math.max(1, psvDeltaP)));

  // Orifice designation selection
  let recommendedOrificeLetter = 'D';
  if (reqOrificeAreaSqIn > 0.11) recommendedOrificeLetter = 'E';
  if (reqOrificeAreaSqIn > 0.196) recommendedOrificeLetter = 'F';
  if (reqOrificeAreaSqIn > 0.307) recommendedOrificeLetter = 'G';
  if (reqOrificeAreaSqIn > 0.503) recommendedOrificeLetter = 'H';
  if (reqOrificeAreaSqIn > 0.785) recommendedOrificeLetter = 'J';
  if (reqOrificeAreaSqIn > 1.287) recommendedOrificeLetter = 'K';
  if (reqOrificeAreaSqIn > 1.84) recommendedOrificeLetter = 'L';
  if (reqOrificeAreaSqIn > 2.85) recommendedOrificeLetter = 'M';
  if (reqOrificeAreaSqIn > 3.60) recommendedOrificeLetter = 'N';
  if (reqOrificeAreaSqIn > 4.34) recommendedOrificeLetter = 'P';
  if (reqOrificeAreaSqIn > 6.38) recommendedOrificeLetter = 'Q';
  if (reqOrificeAreaSqIn > 11.05) recommendedOrificeLetter = 'R';
  if (reqOrificeAreaSqIn > 16.0) recommendedOrificeLetter = 'T';

  // ==========================================
  // STATE FOR TAB 3: PROCESS & TANKS
  // ==========================================
  const [tankShape, setTankShape] = useState<'vertical_cyl' | 'spherical'>('vertical_cyl');
  const [tankDiamM, setTankDiamM] = useState<number>(15); // 15m
  const [tankHeightM, setTankHeightM] = useState<number>(12); // 12m
  const [liquidLevelM, setLiquidLevelM] = useState<number>(8); // 8m

  let totalTankM3 = 0;
  let currentLiquidM3 = 0;

  if (tankShape === 'vertical_cyl') {
    const radius = tankDiamM / 2;
    totalTankM3 = Math.PI * Math.pow(radius, 2) * tankHeightM;
    currentLiquidM3 = Math.PI * Math.pow(radius, 2) * Math.min(liquidLevelM, tankHeightM);
  } else {
    const radius = tankDiamM / 2;
    totalTankM3 = (4 / 3) * Math.PI * Math.pow(radius, 3);
    const h = Math.min(liquidLevelM, tankDiamM);
    currentLiquidM3 = (Math.PI * Math.pow(h, 2) * (3 * radius - h)) / 3;
  }

  const liquidBbl = currentLiquidM3 * 6.28981;
  const liquidGal = currentLiquidM3 * 264.172;
  const fillPercent = Math.min(100, (currentLiquidM3 / (totalTankM3 || 1)) * 100);

  // ==========================================
  // STATE FOR TAB 4: COATINGS & MATERIALS
  // ==========================================
  const [targetDftMils, setTargetDftMils] = useState<number>(8);
  const [solidsVolPercent, setSolidsVolPercent] = useState<number>(70);
  const [areaToPaintM2, setAreaToPaintM2] = useState<number>(350);
  const [lossFactor, setLossFactor] = useState<number>(30); // 30% loss

  const reqWftMils = targetDftMils / (solidsVolPercent / 100);
  const reqWftMicrons = reqWftMils * 25.4;
  const theoreticalCoverageM2PerGal = (39.7 * (solidsVolPercent / 100)) / targetDftMils;
  const practicalCoverageM2PerGal = theoreticalCoverageM2PerGal * (1 - lossFactor / 100);
  const paintGallonsReq = areaToPaintM2 / (practicalCoverageM2PerGal || 1);

  // ==========================================
  // STATE FOR TAB 5: ELECTRICAL VOLTAGE DROP
  // ==========================================
  const [voltPhase, setVoltPhase] = useState<'3phase' | '1phase'>('3phase');
  const [systemVoltage, setSystemVoltage] = useState<number>(480);
  const [cableLengthMeters, setCableLengthMeters] = useState<number>(180);
  const [loadAmps, setLoadAmps] = useState<number>(65);
  const [cableAwgResistance, setCableAwgResistance] = useState<number>(0.26); // #2 AWG Cu ~0.26 ohm/1000ft

  const lengthFeet = cableLengthMeters * 3.28084;
  const voltageDropVolts = voltPhase === '3phase' 
    ? (1.732 * loadAmps * (cableAwgResistance / 1000) * lengthFeet)
    : (2 * loadAmps * (cableAwgResistance / 1000) * lengthFeet);
  const percentVoltDrop = (voltageDropVolts / systemVoltage) * 100;

  // ==========================================
  // STATE FOR TAB 6: CIVIL & EARTHMOVING
  // ==========================================
  const [trenchLengthM, setTrenchLengthM] = useState<number>(120);
  const [trenchWidthM, setTrenchWidthM] = useState<number>(1.2);
  const [trenchDepthM, setTrenchDepthM] = useState<number>(1.5);
  const [swellFactorPercent, setSwellFactorPercent] = useState<number>(25); // 25% esponjamiento

  const bankVolumeM3 = trenchLengthM * trenchWidthM * trenchDepthM;
  const looseVolumeM3 = bankVolumeM3 * (1 + swellFactorPercent / 100);
  const truckTrips12m3 = Math.ceil(looseVolumeM3 / 12);

  // Concrete footing calc
  const [concFootingCount, setConcFootingCount] = useState<number>(8);
  const [footingDimX, setFootingDimX] = useState<number>(2.0);
  const [footingDimY, setFootingDimY] = useState<number>(2.0);
  const [footingDimZ, setFootingDimZ] = useState<number>(0.8);

  const totalConcM3 = concFootingCount * footingDimX * footingDimY * footingDimZ;
  const truckMixers8m3 = Math.ceil(totalConcM3 / 8);

  // ==========================================
  // STATE FOR TAB 7: SIHO-A FLARE & NOISE
  // ==========================================
  const [flareHeatMw, setFlareHeatMw] = useState<number>(45); // 45 MW
  const [distFromFlareM, setDistFromFlareM] = useState<number>(80); // 80 m

  // K = Q / (4 * PI * R^2) [kW/m2]
  const flareRadiationKwM2 = (flareHeatMw * 1000) / (4 * Math.PI * Math.pow(distFromFlareM, 2));

  // Noise attenuation: L2 = L1 - 20*log10(r2/r1)
  const [noiseSourceDb, setNoiseSourceDb] = useState<number>(105);
  const [distNoiseM, setDistNoiseM] = useState<number>(25);
  const noiseAtDistDb = Math.max(0, noiseSourceDb - 20 * Math.log10(Math.max(1, distNoiseM)));

  // ==========================================
  // STATE FOR TAB 8: UNIVERSAL CONVERSION
  // ==========================================
  const [convCategory, setConvCategory] = useState<'pressure' | 'flow' | 'volume' | 'weight' | 'length' | 'temp'>('pressure');
  const [convValue, setConvValue] = useState<number>(100);
  const [convFromUnit, setConvFromUnit] = useState<string>('psi');
  const [convToUnit, setConvToUnit] = useState<string>('bar');

  const unitRates: Record<string, Record<string, number>> = {
    pressure: { psi: 1, bar: 0.0689476, kPa: 6.89476, 'kg/cm²': 0.070307, MPa: 0.00689476 },
    flow: { GPM: 1, BPD: 34.2857, 'm³/h': 0.227125, 'L/min': 3.78541 },
    volume: { bbl: 1, gal: 42, L: 158.987, m3: 0.158987, ft3: 5.61458 },
    weight: { lb: 1, kg: 0.453592, MT: 0.000453592, Ton_US: 0.0005 },
    length: { in: 1, mm: 25.4, ft: 0.0833333, m: 0.0254 },
    temp: { C: 1, F: 1 } // Custom logic
  };

  const getConversionResult = (): string => {
    if (convCategory === 'temp') {
      if (convFromUnit === 'F' && convToUnit === 'C') return (((convValue - 32) * 5) / 9).toFixed(2) + ' °C';
      if (convFromUnit === 'C' && convToUnit === 'F') return ((convValue * 9) / 5 + 32).toFixed(2) + ' °F';
      return convValue.toFixed(2);
    }
    const rates = unitRates[convCategory] || unitRates.pressure;
    const fromRate = rates[convFromUnit] || 1;
    const toRate = rates[convToUnit] || 1;
    const baseValue = convValue / fromRate;
    const result = baseValue * toRate;
    return result.toFixed(3);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <header className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider mb-1">
            <Wrench size={16} /> Suite Multidisciplinaria de Ingeniería & Pocket Hub
          </div>
          <h1 className="text-2xl font-black tracking-tight">Herramientas de Campo, Tablas & Calculadoras</h1>
          <p className="text-xs text-slate-400 mt-1">
            Normativa Homologada: PDVSA / API / ASME / IEEE / NACE / SSPC / COVENIN
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-xl text-xs font-mono border border-slate-700 text-slate-300">
          <CheckCircle2 size={14} className="text-emerald-400" />
          <span>Calculadoras de Bolsillo Activas</span>
        </div>
      </header>

      {/* 8-Tab Main Navigation Header */}
      <div className="flex overflow-x-auto gap-2 bg-slate-100 p-2 rounded-2xl border border-slate-200 text-xs font-bold scrollbar-none">
        {[
          { id: 'piping', label: '1. Tuberías, Bridas & Válvulas', icon: Flame },
          { id: 'instrumentation', label: '2. I&C y Válvulas PSV', icon: Cpu },
          { id: 'process', label: '3. Procesos & Tanques API', icon: Database },
          { id: 'coatings', label: '4. Corrosión & Materiales', icon: Paintbrush },
          { id: 'electrical', label: '5. Electricidad & Potencia', icon: Zap },
          { id: 'civil', label: '6. Civil & Mov. Tierra', icon: Building2 },
          { id: 'siho', label: '7. SIHO-A & Antorchas', icon: ShieldAlert },
          { id: 'conversions', label: '8. Conversor Universal', icon: ArrowRightLeft },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveMainTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all ${
                activeMainTab === tab.id
                  ? 'bg-slate-900 text-emerald-400 shadow-lg scale-[1.01]'
                  : 'text-slate-600 hover:bg-white hover:text-slate-900'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ========================================== */}
      /* TAB 1: PIPING, FLANGES, STUDS & VALVES      */
      {/* ========================================== */}
      {activeMainTab === 'piping' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Flange & Stud Bolt Matrix */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
              <div className="border-b border-gray-100 pb-3 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Disc size={20} className="text-emerald-600" />
                    Matriz Completa de Bridas y Pernería (ASME B16.5 & API 6A)
                  </h2>
                  <p className="text-xs text-gray-500">Geometría, agujeros, dados de torque y cálculo de espárragos</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Clase de Brida / Presión</label>
                  <select 
                    value={flangeClassSelect} 
                    onChange={(e) => {
                      setFlangeClassSelect(e.target.value);
                      const availableNps = Object.keys(FLANGE_DATA[e.target.value] || {});
                      if (!availableNps.includes(flangeNpsSelect)) setFlangeNpsSelect(availableNps[0]);
                    }}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {Object.keys(FLANGE_DATA).map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Diámetro Nominal (NPS)</label>
                  <select 
                    value={flangeNpsSelect} 
                    onChange={(e) => setFlangeNpsSelect(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {Object.keys(currentFlangeClassData).map(nps => (
                      <option key={nps} value={nps}>{nps}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Tipo de Montaje</label>
                  <select 
                    value={assemblyType} 
                    onChange={(e) => setAssemblyType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="flange_flange">Brida - Brida (Unión Simple)</option>
                    <option value="flange_gate_valve">Brida - Válvula Compuerta/Bola</option>
                    <option value="flange_butterfly">Brida - Válvula Mariposa (Wafer)</option>
                  </select>
                </div>
              </div>

              {/* Specs Output Cards */}
              <div className="p-5 bg-slate-900 text-white rounded-2xl space-y-4 font-mono text-xs">
                <span className="text-xs uppercase font-bold text-emerald-400 block">Datos Dimensionales y Pernería Requerida</span>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-800 rounded-xl border border-slate-700">
                    <span className="text-slate-400 block">Diámetro Ext. (OD)</span>
                    <span className="text-base font-bold text-white">{currentFlangeSpec.odMm} mm</span>
                  </div>
                  <div className="p-3 bg-slate-800 rounded-xl border border-slate-700">
                    <span className="text-slate-400 block">Espesor Brida (t)</span>
                    <span className="text-base font-bold text-white">{currentFlangeSpec.thicknessMm} mm</span>
                  </div>
                  <div className="p-3 bg-slate-800 rounded-xl border border-slate-700">
                    <span className="text-slate-400 block">Círculo de Pernos (BCD)</span>
                    <span className="text-base font-bold text-white">{currentFlangeSpec.bcdMm} mm</span>
                  </div>
                  <div className="p-3 bg-slate-800 rounded-xl border border-slate-700">
                    <span className="text-slate-400 block">N° y Diám. Agujeros</span>
                    <span className="text-base font-bold text-emerald-400">{currentFlangeSpec.holesCount} x {currentFlangeSpec.holeDiamInches}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                  <div className="p-3 bg-slate-800 rounded-xl border border-slate-700">
                    <span className="text-slate-400 block">Espárragos Requeridos</span>
                    <span className="text-base font-bold text-amber-400">{currentFlangeSpec.holesCount} Unid. ({currentFlangeSpec.boltDiamInches})</span>
                  </div>
                  <div className="p-3 bg-slate-800 rounded-xl border border-slate-700">
                    <span className="text-slate-400 block">Tuercas Pesadas (2x)</span>
                    <span className="text-base font-bold text-amber-400">{currentFlangeSpec.holesCount * 2} Unid. Heavy Hex</span>
                  </div>
                  <div className="p-3 bg-slate-800 rounded-xl border border-slate-700">
                    <span className="text-slate-400 block">Dado / Llave Requerida</span>
                    <span className="text-base font-bold text-blue-400">{currentFlangeSpec.socketInches} ({currentFlangeSpec.socketMm} mm)</span>
                  </div>
                  <div className="p-3 bg-slate-800 rounded-xl border border-slate-700">
                    <span className="text-slate-400 block">Torque Objetivo (100%)</span>
                    <span className="text-base font-bold text-emerald-400">{currentFlangeSpec.torqueFtLb} ft-lb</span>
                  </div>
                </div>

                <div className="p-3 bg-emerald-950 border border-emerald-800 rounded-xl flex justify-between items-center text-xs">
                  <span className="text-emerald-300 font-bold">Longitud Estimada de Espárragos:</span>
                  <span className="text-lg font-black text-amber-400">{studLengthInches}" Longitud Total (A193 B7)</span>
                </div>
              </div>
            </div>

            {/* Right: Barlow Minimum Pipe Thickness Calc */}
            <div className="bg-slate-900 text-white rounded-2xl p-6 space-y-4 border border-slate-800">
              <h3 className="font-bold text-sm text-emerald-400 flex items-center gap-2">
                <Ruler size={18} /> Calculadora Barlow / ASME B31.3
              </h3>
              <p className="text-xs text-slate-400">
                Cálculo de espesor mínimo requerido para tuberías presurizadas con tolerancia por corrosión.
              </p>

              <div className="space-y-3 font-mono text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Presión de Diseño (psi)</label>
                  <input 
                    type="number" 
                    value={pipePressPsi} 
                    onChange={(e) => setPipePressPsi(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Diámetro Ext. OD (pulgadas)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={pipeOdInches} 
                    onChange={(e) => setPipeOdInches(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">SMYS Acero (psi)</label>
                  <select 
                    value={smysPsi}
                    onChange={(e) => setSmysPsi(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white outline-none"
                  >
                    <option value={35000}>API 5L Gr. B (35.000 psi)</option>
                    <option value={42000}>API 5L X42 (42.000 psi)</option>
                    <option value={52000}>API 5L X52 (52.000 psi)</option>
                    <option value={60000}>API 5L X60 (60.000 psi)</option>
                    <option value={65000}>API 5L X65 (65.000 psi)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Margen Corrosión (mm)</label>
                  <input 
                    type="number" 
                    step="0.5"
                    value={corrosionAllowanceMm} 
                    onChange={(e) => setCorrosionAllowanceMm(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white outline-none"
                  />
                </div>

                <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 space-y-1 pt-3">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Espesor Mínimo Calculado (t):</span>
                  <span className="text-xl font-bold text-emerald-400 block">{calculatedReqThicknessMm.toFixed(2)} mm</span>
                  <span className="text-[10px] text-slate-400 block">({calculatedReqThicknessInches.toFixed(3)}" + {corrosionAllowanceMm}mm corrosión)</span>
                  <span className="text-[10px] text-amber-400 block pt-1">Prueba Hidrostática (1.5x P): {hydrotestPressurePsi} psi</span>
                </div>
              </div>
            </div>
          </div>

          {/* Table for Face-to-Face Valve Dimensions B16.10 */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4 shadow-sm">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <Flame size={18} className="text-emerald-600" /> Catálogo de Distancias Cara a Cara de Válvulas Clase 150# (ASME B16.10)
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900 text-white font-mono uppercase">
                  <tr>
                    <th className="p-3">NPS</th>
                    <th className="p-3">Compuerta (Gate)</th>
                    <th className="p-3">Bola (Ball)</th>
                    <th className="p-3">Globo (Globe)</th>
                    <th className="p-3">Retención (Check)</th>
                    <th className="p-3">Mariposa (Wafer)</th>
                    <th className="p-3">Macho (Plug)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 font-mono">
                  {Object.values(VALVE_FACE_DATA).map(v => (
                    <tr key={v.nps} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">{v.nps}</td>
                      <td className="p-3 text-slate-700">{v.gate150Mm} mm</td>
                      <td className="p-3 text-slate-700">{v.ball150Mm} mm</td>
                      <td className="p-3 text-slate-700">{v.globe150Mm} mm</td>
                      <td className="p-3 text-slate-700">{v.check150Mm} mm</td>
                      <td className="p-3 text-emerald-700 font-bold">{v.butterflyMm} mm</td>
                      <td className="p-3 text-slate-700">{v.plug150Mm} mm</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      /* TAB 2: INSTRUMENTATION & CONTROL (I&C)      */
      {/* ========================================== */}
      {activeMainTab === 'instrumentation' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* PSV Relief Valve Dimensioning */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
            <div className="border-b border-gray-100 pb-3">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Cpu size={20} className="text-emerald-600" />
                Dimensionamiento de Válvulas de Seguridad / Alivio PSV (API 520 / 526)
              </h2>
              <p className="text-xs text-gray-500">Estimación de área de orificio efectiva para líquidos y fluidos limpios</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Caudal Requerido (GPM)</label>
                <input 
                  type="number" 
                  value={psvFlowGpm} 
                  onChange={(e) => setPsvFlowGpm(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Presión de Set (psi)</label>
                <input 
                  type="number" 
                  value={psvSetPressPsi} 
                  onChange={(e) => setPsvSetPressPsi(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Contrapresión (psi)</label>
                <input 
                  type="number" 
                  value={psvBackPressPsi} 
                  onChange={(e) => setPsvBackPressPsi(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Gravedad Específica (SG)</label>
                <input 
                  type="number" 
                  step="0.05"
                  value={psvFluidSg} 
                  onChange={(e) => setPsvFluidSg(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="p-5 bg-slate-900 text-white rounded-2xl space-y-4 font-mono text-xs">
              <span className="text-xs uppercase font-bold text-emerald-400 block">Resultado de Selección de Orificio API 526</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
                  <span className="text-slate-400 block">Área Mínima Requerida</span>
                  <span className="text-2xl font-black text-white mt-1 block">{reqOrificeAreaSqIn.toFixed(3)} in²</span>
                  <span className="text-slate-400 text-[10px] block">{(reqOrificeAreaSqIn * 645.16).toFixed(1)} mm²</span>
                </div>

                <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
                  <span className="text-slate-400 block">Orificio Normalizado API</span>
                  <span className="text-2xl font-black text-amber-400 mt-1 block">Letra "{recommendedOrificeLetter}"</span>
                  <span className="text-slate-400 text-[10px] block">Según API Standard 526</span>
                </div>

                <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
                  <span className="text-slate-400 block">Coeficiente de Flujo (Cv)</span>
                  <span className="text-2xl font-black text-emerald-400 mt-1 block">{calculatedCv.toFixed(1)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Hazardous Area Classifier */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 space-y-4 border border-slate-800 font-mono text-xs">
            <h3 className="font-bold text-sm text-emerald-400 flex items-center gap-2">
              <ShieldAlert size={18} /> Clasificación de Áreas Peligrosas (PDVSA IR-S-02 / NFPA 497)
            </h3>
            <div className="space-y-3 text-slate-300">
              <div className="p-3 bg-slate-800 rounded-xl border border-slate-700">
                <span className="text-amber-400 font-bold block">Clase I, Div 1 (Zona 0 / 1):</span>
                <p className="text-[11px] text-slate-400 mt-1">Presencia continua o frecuente de gases inflamables (ej. venteos, purgas, bombas de crudo).</p>
                <span className="text-emerald-400 font-bold text-[10px] block mt-1">Requerimiento: Encerramientos NEMA 7 / Explosion Proof.</span>
              </div>

              <div className="p-3 bg-slate-800 rounded-xl border border-slate-700">
                <span className="text-blue-400 font-bold block">Clase I, Div 2 (Zona 2):</span>
                <p className="text-[11px] text-slate-400 mt-1">Presencia accidental o por falla de tuberías de gases inflamables.</p>
                <span className="text-emerald-400 font-bold text-[10px] block mt-1">Requerimiento: Equipos no producentes de chispas / Intrínsecamente seguros.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      /* TAB 3: PROCESS & STORAGE TANKS (API 650)   */
      {/* ========================================== */}
      {activeMainTab === 'process' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
            <div className="border-b border-gray-100 pb-3">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Database size={20} className="text-emerald-600" />
                Volumetría y Aforo de Tanques de Almacenamiento (API 650 / 653)
              </h2>
              <p className="text-xs text-gray-500">Cálculo de volumen bruto, capacidad útil, bbls y porcentaje de llenado</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Geometría de Tanque</label>
                <select 
                  value={tankShape} 
                  onChange={(e) => setTankShape(e.target.value as any)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="vertical_cyl">Cilíndrico Vertical (API 650)</option>
                  <option value="spherical">Esférico (LPG / NGL)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Diámetro (m)</label>
                <input 
                  type="number" 
                  value={tankDiamM} 
                  onChange={(e) => setTankDiamM(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Altura Total (m)</label>
                <input 
                  type="number" 
                  value={tankHeightM} 
                  onChange={(e) => setTankHeightM(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nivel de Cinta / Dip (m)</label>
                <input 
                  type="number" 
                  step="0.1"
                  value={liquidLevelM} 
                  onChange={(e) => setLiquidLevelM(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Results Grid */}
            <div className="p-5 bg-slate-900 text-white rounded-2xl space-y-4 font-mono text-xs">
              <span className="text-xs uppercase font-bold text-emerald-400 block">Resultados de Aforo y Llenado</span>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-800 rounded-xl border border-slate-700">
                  <span className="text-slate-400 block">Volumen Total Bruto</span>
                  <span className="text-lg font-bold text-white">{totalTankM3.toFixed(1)} m³</span>
                </div>
                <div className="p-3 bg-slate-800 rounded-xl border border-slate-700">
                  <span className="text-slate-400 block">Volumen Actual Líquido</span>
                  <span className="text-lg font-bold text-emerald-400">{currentLiquidM3.toFixed(1)} m³</span>
                </div>
                <div className="p-3 bg-slate-800 rounded-xl border border-slate-700">
                  <span className="text-slate-400 block">Barriles (bbls)</span>
                  <span className="text-lg font-bold text-amber-400">{Math.round(liquidBbl)} bbls</span>
                </div>
                <div className="p-3 bg-slate-800 rounded-xl border border-slate-700">
                  <span className="text-slate-400 block">Galones (gal)</span>
                  <span className="text-lg font-bold text-blue-400">{Math.round(liquidGal)} gal</span>
                </div>
              </div>

              <div className="p-4 bg-slate-800 rounded-xl border border-slate-700 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-bold">Porcentaje de Llenado del Tanque:</span>
                  <span className="text-amber-400 font-black">{fillPercent.toFixed(1)}% Capacidad</span>
                </div>
                <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden border border-slate-700">
                  <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${fillPercent}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 text-white rounded-2xl p-6 space-y-3 font-mono text-xs border border-slate-800">
            <h3 className="font-bold text-emerald-400 flex items-center gap-2">
              <Info size={16} /> Criterios API 12J / Separadores
            </h3>
            <p className="text-slate-300">
              Tiempo de residencia mínimo para separación trifásica agua-crudo-gas:
            </p>
            <ul className="space-y-2 text-slate-400">
              <li>• Crudos livianos (&gt; 30° API): 3 a 5 Minutos</li>
              <li>• Crudos medianos (22-30° API): 5 a 10 Minutos</li>
              <li>• Crudos pesados (&lt; 22° API - Faja): 15 a 30 Minutos + Calentamiento</li>
            </ul>
          </div>
        </div>
      )}

      {/* ========================================== */}
      /* TAB 4: COATINGS, NACE & MATERIALS           */
      {/* ========================================== */}
      {activeMainTab === 'coatings' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
            <div className="border-b border-gray-100 pb-3">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Paintbrush size={20} className="text-emerald-600" />
                Calculadora de Espesor de Película DFT / WFT (NACE / SSPC / PDVSA O-201)
              </h2>
              <p className="text-xs text-gray-500">Determinación de galga húmeda (peine) y galones requeridos</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">DFT Seco Objetivo (mils)</label>
                <input 
                  type="number" 
                  value={targetDftMils} 
                  onChange={(e) => setTargetDftMils(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">% Sólidos por Volumen</label>
                <input 
                  type="number" 
                  value={solidsVolPercent} 
                  onChange={(e) => setSolidsVolPercent(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Área Total (m²)</label>
                <input 
                  type="number" 
                  value={areaToPaintM2} 
                  onChange={(e) => setAreaToPaintM2(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">% Merma / Pérdida</label>
                <input 
                  type="number" 
                  value={lossFactor} 
                  onChange={(e) => setLossFactor(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="p-5 bg-slate-900 text-white rounded-2xl space-y-4 font-mono text-xs">
              <span className="text-xs uppercase font-bold text-emerald-400 block">Especificaciones de Aplicación en Campo</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
                  <span className="text-slate-400 block">Lectura Galga Peine (WFT)</span>
                  <span className="text-2xl font-black text-emerald-400 mt-1 block">{reqWftMils.toFixed(1)} mils</span>
                  <span className="text-slate-400 text-[10px] block">{Math.round(reqWftMicrons)} micras (µm)</span>
                </div>

                <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
                  <span className="text-slate-400 block">Rendimiento Práctico</span>
                  <span className="text-xl font-bold text-amber-400 mt-1 block">{practicalCoverageM2PerGal.toFixed(1)} m²/galón</span>
                </div>

                <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
                  <span className="text-slate-400 block">Volumen Pintura Requerido</span>
                  <span className="text-2xl font-black text-blue-400 mt-1 block">{paintGallonsReq.toFixed(1)} Galones</span>
                  <span className="text-slate-400 text-[10px] block">{(paintGallonsReq / 5).toFixed(1)} Cuñetes (5 gal)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 text-white rounded-2xl p-6 space-y-3 font-mono text-xs border border-slate-800">
            <h3 className="font-bold text-emerald-400">Tabla de Consumibles de Soldadura</h3>
            <div className="space-y-2 text-slate-300">
              <div className="p-2.5 bg-slate-800 rounded-lg border border-slate-700">
                <span className="font-bold text-white">API 5L Gr. B / X42:</span> E6010 (Raíz) + E7018 (Relleno/Pase final)
              </div>
              <div className="p-2.5 bg-slate-800 rounded-lg border border-slate-700">
                <span className="font-bold text-white">API 5L X52 / X60:</span> E7010-P1 (Raíz) + E8018-G / ER70S-6
              </div>
              <div className="p-2.5 bg-slate-800 rounded-lg border border-slate-700">
                <span className="font-bold text-white">Acero Inox 316L:</span> Electrodo E316L-16 / Varilla TIG ER316L
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      /* TAB 5: ELECTRICAL POWER & VOLTAGE DROP      */
      {/* ========================================== */}
      {activeMainTab === 'electrical' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
            <div className="border-b border-gray-100 pb-3">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Zap size={20} className="text-emerald-600" />
                Calculadora de Caída de Tensión en Cables de Potencia (PDVSA N-201 / IEEE)
              </h2>
              <p className="text-xs text-gray-500">Cálculo de caída de voltaje en voltios y porcentaje para motores y alimentadores</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Tipo de Sistema</label>
                <select 
                  value={voltPhase} 
                  onChange={(e) => setVoltPhase(e.target.value as any)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="3phase">Trifásico (3Ø - 480V/208V)</option>
                  <option value="1phase">Monofásico (1Ø - 120V/240V)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Tensión Nominal (V)</label>
                <input 
                  type="number" 
                  value={systemVoltage} 
                  onChange={(e) => setSystemVoltage(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Corriente Carga (A)</label>
                <input 
                  type="number" 
                  value={loadAmps} 
                  onChange={(e) => setLoadAmps(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Longitud Cable (m)</label>
                <input 
                  type="number" 
                  value={cableLengthMeters} 
                  onChange={(e) => setCableLengthMeters(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="p-5 bg-slate-900 text-white rounded-2xl space-y-4 font-mono text-xs">
              <span className="text-xs uppercase font-bold text-emerald-400 block">Resultado de Caída de Tensión</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
                  <span className="text-slate-400 block">Caída de Tensión (Volts)</span>
                  <span className="text-2xl font-black text-white mt-1 block">{voltageDropVolts.toFixed(2)} Volts</span>
                </div>

                <div className={`p-4 rounded-xl border ${percentVoltDrop > 3.0 ? 'bg-red-950/60 border-red-700' : 'bg-slate-800 border-slate-700'}`}>
                  <span className="text-slate-400 block">Porcentaje Caída de Tensión</span>
                  <span className={`text-2xl font-black mt-1 block ${percentVoltDrop > 3.0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {percentVoltDrop.toFixed(2)}%
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    {percentVoltDrop > 3.0 ? '⚠️ Excede límite IEEE (&lt; 3.0%)' : '✓ Aceptable según PDVSA N-201'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 text-white rounded-2xl p-6 space-y-3 font-mono text-xs border border-slate-800">
            <h3 className="font-bold text-emerald-400">Límites Normativos PDVSA</h3>
            <p className="text-slate-300">
              Criterios de diseño para instalaciones eléctricas industriales:
            </p>
            <ul className="space-y-2 text-slate-400">
              <li>• Alimentadores principales: Máximo 2.0%</li>
              <li>• Circuitos ramales a motores: Máximo 3.0%</li>
              <li>• Caída total acumulada: Máximo 5.0%</li>
            </ul>
          </div>
        </div>
      )}

      {/* ========================================== */}
      /* TAB 6: CIVIL & EARTHMOVING & REBARS        */
      {/* ========================================== */}
      {activeMainTab === 'civil' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Earthmoving trench calc */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
              <div className="border-b border-gray-100 pb-3">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Truck size={20} className="text-emerald-600" />
                  Calculadora de Excavación de Zanjas y Camiones Volteo
                </h2>
                <p className="text-xs text-gray-500">Volumen en banco, suelto por esponjamiento y viajes de volteo (12m³)</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Longitud Zanja (m)</label>
                  <input 
                    type="number" 
                    value={trenchLengthM} 
                    onChange={(e) => setTrenchLengthM(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Ancho Zanja (m)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={trenchWidthM} 
                    onChange={(e) => setTrenchWidthM(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Profundidad (m)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={trenchDepthM} 
                    onChange={(e) => setTrenchDepthM(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">% Esponjamiento</label>
                  <input 
                    type="number" 
                    value={swellFactorPercent} 
                    onChange={(e) => setSwellFactorPercent(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-900 text-white rounded-2xl font-mono text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Volumen en Banco:</span>
                  <span className="font-bold text-white">{bankVolumeM3.toFixed(1)} m³</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Volumen Suelto (Swell):</span>
                  <span className="font-bold text-emerald-400">{looseVolumeM3.toFixed(1)} m³</span>
                </div>
                <div className="flex justify-between text-amber-400 font-bold pt-1 border-t border-slate-800">
                  <span>Camiones Volteo (12m³):</span>
                  <span>{truckTrips12m3} Viajes</span>
                </div>
              </div>
            </div>

            {/* Concrete pour calc */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
              <div className="border-b border-gray-100 pb-3">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Box size={20} className="text-emerald-600" />
                  Calculadora de Vaciado de Concreto & Camiones Trompo
                </h2>
                <p className="text-xs text-gray-500">Cómputo métrico de fundaciones y número de mixer trucks (8m³)</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">N° de Zapatas/Fundaciones</label>
                  <input 
                    type="number" 
                    value={concFootingCount} 
                    onChange={(e) => setConcFootingCount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Largo L1 (m)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={footingDimX} 
                    onChange={(e) => setFootingDimX(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Ancho L2 (m)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={footingDimY} 
                    onChange={(e) => setFootingDimY(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Espesor / Alto (m)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={footingDimZ} 
                    onChange={(e) => setFootingDimZ(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-900 text-white rounded-2xl font-mono text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Volumen Total Concreto:</span>
                  <span className="font-bold text-emerald-400">{totalConcM3.toFixed(2)} m³</span>
                </div>
                <div className="flex justify-between text-amber-400 font-bold pt-1 border-t border-slate-800">
                  <span>Camiones Trompo (8m³):</span>
                  <span>{truckMixers8m3} Camiones Mixer</span>
                </div>
              </div>
            </div>
          </div>

          {/* Rebar table */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4 shadow-sm">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <Building2 size={18} className="text-emerald-600" /> Tabla de Cuantías y Pesos de Cabillas (COVENIN / ASTM)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900 text-white font-mono uppercase">
                  <tr>
                    <th className="p-3">Designación</th>
                    <th className="p-3">Diámetro (pulg)</th>
                    <th className="p-3">Diámetro (mm)</th>
                    <th className="p-3">Peso Nominal (kg/m)</th>
                    <th className="p-3">Longitud Solape (40d)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 font-mono">
                  {REBAR_DATA.map(r => (
                    <tr key={r.designation} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">{r.designation}</td>
                      <td className="p-3 text-slate-700">{r.nominalDiamInches}</td>
                      <td className="p-3 text-slate-700">{r.nominalDiamMm} mm</td>
                      <td className="p-3 text-emerald-700 font-bold">{r.weightKgPerMeter} kg/m</td>
                      <td className="p-3 text-slate-700">{r.lapLengthMeters} m</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      /* TAB 7: SIHO-A FLARE RADIATION & NOISE     */
      {/* ========================================== */}
      {activeMainTab === 'siho' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Flare Thermal Radiation Calc */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
            <div className="border-b border-gray-100 pb-3">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <ShieldAlert size={20} className="text-emerald-600" />
                Calculadora de Radiación Térmica de Antorchas (API 521 / PDVSA SI-S-04)
              </h2>
              <p className="text-xs text-gray-500">Cálculo de intensidad térmica K (kW/m²) a distancia del mechurrio</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Calor Liberado (MW)</label>
                <input 
                  type="number" 
                  value={flareHeatMw} 
                  onChange={(e) => setFlareHeatMw(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Distancia al Punto (m)</label>
                <input 
                  type="number" 
                  value={distFromFlareM} 
                  onChange={(e) => setDistFromFlareM(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-900 text-white rounded-2xl font-mono text-xs space-y-3">
              <div>
                <span className="text-slate-400 block">Radiación Térmica Calculada (K):</span>
                <span className="text-2xl font-black text-amber-400 mt-1 block">{flareRadiationKwM2.toFixed(2)} kW/m²</span>
              </div>
              <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 text-[11px] text-slate-300">
                {flareRadiationKwM2 < 1.57 && '✓ Nivel Seguro (&lt; 1.57 kW/m²): Operación continua sin equipo especial.'}
                {flareRadiationKwM2 >= 1.57 && flareRadiationKwM2 < 4.73 && '⚠️ Nivel de Alerta (1.57 - 4.73 kW/m²): Requiere ropa de protección térmica.'}
                {flareRadiationKwM2 >= 4.73 && '🚨 Zona Peligrosa (&gt; 4.73 kW/m²): Exposición máxima 30 segundos sin EPP especializado.'}
              </div>
            </div>
          </div>

          {/* Noise Attenuation Calc */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
            <div className="border-b border-gray-100 pb-3">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Volume2 size={20} className="text-emerald-600" />
                Atenuación de Ruido Industrial y Exposición (PDVSA HO-H-16)
              </h2>
              <p className="text-xs text-gray-500">Atenuación por distancia inversa al cuadrado</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Ruido en Fuente (dBA @ 1m)</label>
                <input 
                  type="number" 
                  value={noiseSourceDb} 
                  onChange={(e) => setNoiseSourceDb(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Distancia Receptora (m)</label>
                <input 
                  type="number" 
                  value={distNoiseM} 
                  onChange={(e) => setDistNoiseM(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-900 text-white rounded-2xl font-mono text-xs space-y-3">
              <div>
                <span className="text-slate-400 block">Nivel de Ruido a {distNoiseM} metros:</span>
                <span className="text-2xl font-black text-emerald-400 mt-1 block">{noiseAtDistDb.toFixed(1)} dBA</span>
              </div>
              <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 text-[11px] text-slate-300">
                {noiseAtDistDb > 85 ? '🚨 Obligatorio uso de Protectores Auditivos de Copa / Inserción (&gt; 85 dBA).' : '✓ Nivel Seguro (&lt; 85 dBA según COVENIN 871).'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      /* TAB 8: UNIVERSAL QUICK CONVERTER            */
      {/* ========================================== */}
      {activeMainTab === 'conversions' && (
        <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
          <div className="border-b border-gray-100 pb-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <ArrowRightLeft size={20} className="text-emerald-600" />
              Conversor Universal Rápido de Unidades de Campo
            </h2>
            <p className="text-xs text-gray-500">Presión, Caudal, Volumen, Masa, Longitud y Temperatura</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Categoría</label>
              <select 
                value={convCategory} 
                onChange={(e) => {
                  const cat = e.target.value as any;
                  setConvCategory(cat);
                  if (cat === 'pressure') { setConvFromUnit('psi'); setConvToUnit('bar'); }
                  if (cat === 'flow') { setConvFromUnit('GPM'); setConvToUnit('BPD'); }
                  if (cat === 'volume') { setConvFromUnit('bbl'); setConvToUnit('m3'); }
                  if (cat === 'weight') { setConvFromUnit('lb'); setConvToUnit('kg'); }
                  if (cat === 'length') { setConvFromUnit('in'); setConvToUnit('mm'); }
                  if (cat === 'temp') { setConvFromUnit('F'); setConvToUnit('C'); }
                }}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none"
              >
                <option value="pressure">Presión</option>
                <option value="flow">Caudal / Volumétrico</option>
                <option value="volume">Volumen Liquido</option>
                <option value="weight">Masa / Peso</option>
                <option value="length">Longitud / Espesor</option>
                <option value="temp">Temperatura</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Desde (Unidad Origin)</label>
              <select 
                value={convFromUnit} 
                onChange={(e) => setConvFromUnit(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none"
              >
                {Object.keys(unitRates[convCategory] || {}).map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Hacia (Unidad Destino)</label>
              <select 
                value={convToUnit} 
                onChange={(e) => setConvToUnit(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none"
              >
                {Object.keys(unitRates[convCategory] || {}).map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Valor a Convertir</label>
              <input 
                type="number" 
                value={convValue} 
                onChange={(e) => setConvValue(Number(e.target.value))}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-black text-xl outline-none"
              />
            </div>

            <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-col justify-center items-center font-mono">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Resultado Convertido:</span>
              <span className="text-2xl font-black text-emerald-400 mt-1">{getConversionResult()}</span>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
