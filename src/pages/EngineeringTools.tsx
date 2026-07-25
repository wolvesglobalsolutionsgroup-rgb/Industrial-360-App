import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Calculator, 
  Ruler, 
  ArrowRightLeft, 
  Droplets, 
  Box, 
  Layers, 
  Flame, 
  Gauge, 
  Disc, 
  Paintbrush, 
  Database, 
  Activity, 
  CheckCircle2, 
  Info,
  Wrench
} from 'lucide-react';

// Pipe Data Structure
interface PipeSpec {
  odInches: number;
  odMm: number;
  schedules: Record<string, { wallInches: number; wallMm: number }>;
}

const PIPE_DATA: Record<string, PipeSpec> = {
  '1/2"': { odInches: 0.840, odMm: 21.3, schedules: { 'SCH 10': { wallInches: 0.083, wallMm: 2.11 }, 'SCH 40/STD': { wallInches: 0.109, wallMm: 2.77 }, 'SCH 80/XS': { wallInches: 0.147, wallMm: 3.73 }, 'SCH 160': { wallInches: 0.188, wallMm: 4.78 }, 'XXS': { wallInches: 0.294, wallMm: 7.47 } } },
  '3/4"': { odInches: 1.050, odMm: 26.7, schedules: { 'SCH 10': { wallInches: 0.083, wallMm: 2.11 }, 'SCH 40/STD': { wallInches: 0.113, wallMm: 2.87 }, 'SCH 80/XS': { wallInches: 0.154, wallMm: 3.91 }, 'SCH 160': { wallInches: 0.219, wallMm: 5.56 }, 'XXS': { wallInches: 0.308, wallMm: 7.82 } } },
  '1"': { odInches: 1.315, odMm: 33.4, schedules: { 'SCH 10': { wallInches: 0.109, wallMm: 2.77 }, 'SCH 40/STD': { wallInches: 0.133, wallMm: 3.38 }, 'SCH 80/XS': { wallInches: 0.179, wallMm: 4.55 }, 'SCH 160': { wallInches: 0.250, wallMm: 6.35 }, 'XXS': { wallInches: 0.358, wallMm: 9.09 } } },
  '1.5"': { odInches: 1.900, odMm: 48.3, schedules: { 'SCH 10': { wallInches: 0.109, wallMm: 2.77 }, 'SCH 40/STD': { wallInches: 0.145, wallMm: 3.68 }, 'SCH 80/XS': { wallInches: 0.200, wallMm: 5.08 }, 'SCH 160': { wallInches: 0.281, wallMm: 7.14 }, 'XXS': { wallInches: 0.400, wallMm: 10.16 } } },
  '2"': { odInches: 2.375, odMm: 60.3, schedules: { 'SCH 10': { wallInches: 0.109, wallMm: 2.77 }, 'SCH 40/STD': { wallInches: 0.154, wallMm: 3.91 }, 'SCH 80/XS': { wallInches: 0.218, wallMm: 5.54 }, 'SCH 160': { wallInches: 0.343, wallMm: 8.71 }, 'XXS': { wallInches: 0.436, wallMm: 11.07 } } },
  '3"': { odInches: 3.500, odMm: 88.9, schedules: { 'SCH 10': { wallInches: 0.120, wallMm: 3.05 }, 'SCH 40/STD': { wallInches: 0.216, wallMm: 5.49 }, 'SCH 80/XS': { wallInches: 0.300, wallMm: 7.62 }, 'SCH 160': { wallInches: 0.438, wallMm: 11.13 }, 'XXS': { wallInches: 0.600, wallMm: 15.24 } } },
  '4"': { odInches: 4.500, odMm: 114.3, schedules: { 'SCH 10': { wallInches: 0.120, wallMm: 3.05 }, 'SCH 40/STD': { wallInches: 0.237, wallMm: 6.02 }, 'SCH 80/XS': { wallInches: 0.337, wallMm: 8.56 }, 'SCH 120': { wallInches: 0.438, wallMm: 11.13 }, 'SCH 160': { wallInches: 0.531, wallMm: 13.49 }, 'XXS': { wallInches: 0.674, wallMm: 17.12 } } },
  '6"': { odInches: 6.625, odMm: 168.3, schedules: { 'SCH 10': { wallInches: 0.134, wallMm: 3.40 }, 'SCH 40/STD': { wallInches: 0.280, wallMm: 7.11 }, 'SCH 80/XS': { wallInches: 0.432, wallMm: 10.97 }, 'SCH 120': { wallInches: 0.562, wallMm: 14.27 }, 'SCH 160': { wallInches: 0.719, wallMm: 18.26 }, 'XXS': { wallInches: 0.864, wallMm: 21.95 } } },
  '8"': { odInches: 8.625, odMm: 219.1, schedules: { 'SCH 10': { wallInches: 0.148, wallMm: 3.76 }, 'SCH 20': { wallInches: 0.250, wallMm: 6.35 }, 'SCH 40/STD': { wallInches: 0.322, wallMm: 8.18 }, 'SCH 80/XS': { wallInches: 0.500, wallMm: 12.70 }, 'SCH 120': { wallInches: 0.719, wallMm: 18.26 }, 'SCH 160': { wallInches: 0.906, wallMm: 23.01 } } },
  '10"': { odInches: 10.750, odMm: 273.1, schedules: { 'SCH 10': { wallInches: 0.165, wallMm: 4.19 }, 'SCH 20': { wallInches: 0.250, wallMm: 6.35 }, 'SCH 40/STD': { wallInches: 0.365, wallMm: 9.27 }, 'SCH 60': { wallInches: 0.500, wallMm: 12.70 }, 'SCH 80/XS': { wallInches: 0.594, wallMm: 15.09 }, 'SCH 120': { wallInches: 0.843, wallMm: 21.41 }, 'SCH 160': { wallInches: 1.000, wallMm: 25.40 } } },
  '12"': { odInches: 12.750, odMm: 323.8, schedules: { 'SCH 10': { wallInches: 0.180, wallMm: 4.57 }, 'SCH 20': { wallInches: 0.250, wallMm: 6.35 }, 'SCH 30': { wallInches: 0.330, wallMm: 8.38 }, 'SCH 40/STD': { wallInches: 0.406, wallMm: 10.31 }, 'SCH 80/XS': { wallInches: 0.500, wallMm: 12.70 }, 'SCH 120': { wallInches: 0.843, wallMm: 21.41 }, 'SCH 160': { wallInches: 1.312, wallMm: 33.32 } } },
  '14"': { odInches: 14.000, odMm: 355.6, schedules: { 'SCH 10': { wallInches: 0.250, wallMm: 6.35 }, 'SCH 20': { wallInches: 0.312, wallMm: 7.92 }, 'SCH 30': { wallInches: 0.375, wallMm: 9.53 }, 'SCH 40/STD': { wallInches: 0.438, wallMm: 11.13 }, 'SCH 80/XS': { wallInches: 0.500, wallMm: 12.70 }, 'SCH 120': { wallInches: 0.938, wallMm: 23.83 }, 'SCH 160': { wallInches: 1.406, wallMm: 35.71 } } },
  '16"': { odInches: 16.000, odMm: 406.4, schedules: { 'SCH 10': { wallInches: 0.250, wallMm: 6.35 }, 'SCH 20': { wallInches: 0.312, wallMm: 7.92 }, 'SCH 30': { wallInches: 0.375, wallMm: 9.53 }, 'SCH 40/STD': { wallInches: 0.500, wallMm: 12.70 }, 'SCH 80/XS': { wallInches: 0.500, wallMm: 12.70 }, 'SCH 120': { wallInches: 1.031, wallMm: 26.19 }, 'SCH 160': { wallInches: 1.594, wallMm: 40.49 } } },
  '18"': { odInches: 18.000, odMm: 457.2, schedules: { 'SCH 10': { wallInches: 0.250, wallMm: 6.35 }, 'SCH 20': { wallInches: 0.312, wallMm: 7.92 }, 'SCH 40/STD': { wallInches: 0.562, wallMm: 14.27 }, 'SCH 80/XS': { wallInches: 0.500, wallMm: 12.70 }, 'SCH 160': { wallInches: 1.781, wallMm: 45.24 } } },
  '20"': { odInches: 20.000, odMm: 508.0, schedules: { 'SCH 10': { wallInches: 0.250, wallMm: 6.35 }, 'SCH 20': { wallInches: 0.375, wallMm: 9.53 }, 'SCH 30': { wallInches: 0.500, wallMm: 12.70 }, 'SCH 40/STD': { wallInches: 0.594, wallMm: 15.09 }, 'SCH 80/XS': { wallInches: 0.500, wallMm: 12.70 }, 'SCH 160': { wallInches: 1.968, wallMm: 49.99 } } },
  '24"': { odInches: 24.000, odMm: 609.6, schedules: { 'SCH 10': { wallInches: 0.250, wallMm: 6.35 }, 'SCH 20': { wallInches: 0.375, wallMm: 9.53 }, 'SCH 30': { wallInches: 0.562, wallMm: 14.27 }, 'SCH 40/STD': { wallInches: 0.688, wallMm: 17.48 }, 'SCH 80/XS': { wallInches: 0.500, wallMm: 12.70 }, 'SCH 160': { wallInches: 2.344, wallMm: 59.54 } } },
  '30"': { odInches: 30.000, odMm: 762.0, schedules: { 'SCH 10': { wallInches: 0.312, wallMm: 7.92 }, 'SCH 20': { wallInches: 0.500, wallMm: 12.70 }, 'SCH 30': { wallInches: 0.625, wallMm: 15.88 }, 'SCH 40/STD': { wallInches: 0.750, wallMm: 19.05 } } },
  '36"': { odInches: 36.000, odMm: 914.4, schedules: { 'SCH 10': { wallInches: 0.312, wallMm: 7.92 }, 'SCH 20': { wallInches: 0.500, wallMm: 12.70 }, 'SCH 30': { wallInches: 0.625, wallMm: 15.88 }, 'SCH 40/STD': { wallInches: 0.750, wallMm: 19.05 } } },
  '42"': { odInches: 42.000, odMm: 1066.8, schedules: { 'SCH 10': { wallInches: 0.375, wallMm: 9.53 }, 'SCH 20': { wallInches: 0.500, wallMm: 12.70 }, 'SCH 30': { wallInches: 0.625, wallMm: 15.88 }, 'SCH 40/STD': { wallInches: 0.750, wallMm: 19.05 } } },
  '48"': { odInches: 48.000, odMm: 1219.2, schedules: { 'SCH 10': { wallInches: 0.375, wallMm: 9.53 }, 'SCH 20': { wallInches: 0.500, wallMm: 12.70 }, 'SCH 30': { wallInches: 0.625, wallMm: 15.88 }, 'SCH 40/STD': { wallInches: 0.750, wallMm: 19.05 } } }
};

const API_GRADES: Record<string, { smysPsi: number; smysMpa: number; name: string }> = {
  'Grade B': { smysPsi: 35000, smysMpa: 241, name: 'API 5L Gr. B (SMYS 35 ksi)' },
  'X42': { smysPsi: 42100, smysMpa: 290, name: 'API 5L X42 (SMYS 42.1 ksi)' },
  'X52': { smysPsi: 52200, smysMpa: 360, name: 'API 5L X52 (SMYS 52.2 ksi)' },
  'X60': { smysPsi: 60200, smysMpa: 415, name: 'API 5L X60 (SMYS 60.2 ksi)' },
  'X65': { smysPsi: 65300, smysMpa: 450, name: 'API 5L X65 (SMYS 65.3 ksi)' },
  'X70': { smysPsi: 70300, smysMpa: 485, name: 'API 5L X70 (SMYS 70.3 ksi)' }
};

// Flange Torque Data ANSI B16.5
interface FlangeTorqueSpec {
  boltsCount: number;
  boltDiameter: string;
  socketSizeInches: string;
  socketSizeMm: number;
  torqueFtLb: number;
}

const FLANGE_TORQUE_DATA: Record<string, Record<string, FlangeTorqueSpec>> = {
  '150#': {
    '2"': { boltsCount: 4, boltDiameter: '5/8"-11 UNC', socketSizeInches: '1-1/16"', socketSizeMm: 27, torqueFtLb: 120 },
    '3"': { boltsCount: 4, boltDiameter: '5/8"-11 UNC', socketSizeInches: '1-1/16"', socketSizeMm: 27, torqueFtLb: 120 },
    '4"': { boltsCount: 8, boltDiameter: '5/8"-11 UNC', socketSizeInches: '1-1/16"', socketSizeMm: 27, torqueFtLb: 120 },
    '6"': { boltsCount: 8, boltDiameter: '3/4"-10 UNC', socketSizeInches: '1-1/4"', socketSizeMm: 32, torqueFtLb: 200 },
    '8"': { boltsCount: 8, boltDiameter: '3/4"-10 UNC', socketSizeInches: '1-1/4"', socketSizeMm: 32, torqueFtLb: 200 },
    '10"': { boltsCount: 12, boltDiameter: '7/8"-9 UNC', socketSizeInches: '1-7/16"', socketSizeMm: 36, torqueFtLb: 320 },
    '12"': { boltsCount: 12, boltDiameter: '7/8"-9 UNC', socketSizeInches: '1-7/16"', socketSizeMm: 36, torqueFtLb: 320 },
    '14"': { boltsCount: 12, boltDiameter: '1"-8 UNC', socketSizeInches: '1-5/8"', socketSizeMm: 41, torqueFtLb: 480 },
    '16"': { boltsCount: 16, boltDiameter: '1"-8 UNC', socketSizeInches: '1-5/8"', socketSizeMm: 41, torqueFtLb: 480 },
    '20"': { boltsCount: 20, boltDiameter: '1-1/8"-8 UN', socketSizeInches: '1-13/16"', socketSizeMm: 46, torqueFtLb: 710 },
    '24"': { boltsCount: 20, boltDiameter: '1-1/4"-8 UN', socketSizeInches: '2"', socketSizeMm: 50, torqueFtLb: 1000 }
  },
  '300#': {
    '2"': { boltsCount: 8, boltDiameter: '5/8"-11 UNC', socketSizeInches: '1-1/16"', socketSizeMm: 27, torqueFtLb: 120 },
    '3"': { boltsCount: 8, boltDiameter: '3/4"-10 UNC', socketSizeInches: '1-1/4"', socketSizeMm: 32, torqueFtLb: 200 },
    '4"': { boltsCount: 8, boltDiameter: '3/4"-10 UNC', socketSizeInches: '1-1/4"', socketSizeMm: 32, torqueFtLb: 200 },
    '6"': { boltsCount: 12, boltDiameter: '3/4"-10 UNC', socketSizeInches: '1-1/4"', socketSizeMm: 32, torqueFtLb: 200 },
    '8"': { boltsCount: 12, boltDiameter: '7/8"-9 UNC', socketSizeInches: '1-7/16"', socketSizeMm: 36, torqueFtLb: 320 },
    '10"': { boltsCount: 16, boltDiameter: '1"-8 UNC', socketSizeInches: '1-5/8"', socketSizeMm: 41, torqueFtLb: 480 },
    '12"': { boltsCount: 16, boltDiameter: '1-1/8"-8 UN', socketSizeInches: '1-13/16"', socketSizeMm: 46, torqueFtLb: 710 },
    '16"': { boltsCount: 20, boltDiameter: '1-1/4"-8 UN', socketSizeInches: '2"', socketSizeMm: 50, torqueFtLb: 1000 },
    '20"': { boltsCount: 24, boltDiameter: '1-1/4"-8 UN', socketSizeInches: '2"', socketSizeMm: 50, torqueFtLb: 1000 },
    '24"': { boltsCount: 24, boltDiameter: '1-1/2"-8 UN', socketSizeInches: '2-3/8"', socketSizeMm: 60, torqueFtLb: 1750 }
  },
  '600#': {
    '2"': { boltsCount: 8, boltDiameter: '5/8"-11 UNC', socketSizeInches: '1-1/16"', socketSizeMm: 27, torqueFtLb: 140 },
    '3"': { boltsCount: 8, boltDiameter: '3/4"-10 UNC', socketSizeInches: '1-1/4"', socketSizeMm: 32, torqueFtLb: 230 },
    '4"': { boltsCount: 8, boltDiameter: '7/8"-9 UNC', socketSizeInches: '1-7/16"', socketSizeMm: 36, torqueFtLb: 360 },
    '6"': { boltsCount: 12, boltDiameter: '1"-8 UNC', socketSizeInches: '1-5/8"', socketSizeMm: 41, torqueFtLb: 540 },
    '8"': { boltsCount: 12, boltDiameter: '1-1/8"-8 UN', socketSizeInches: '1-13/16"', socketSizeMm: 46, torqueFtLb: 780 },
    '10"': { boltsCount: 16, boltDiameter: '1-1/4"-8 UN', socketSizeInches: '2"', socketSizeMm: 50, torqueFtLb: 1100 },
    '12"': { boltsCount: 20, boltDiameter: '1-1/4"-8 UN', socketSizeInches: '2"', socketSizeMm: 50, torqueFtLb: 1100 },
    '16"': { boltsCount: 20, boltDiameter: '1-1/2"-8 UN', socketSizeInches: '2-3/8"', socketSizeMm: 60, torqueFtLb: 1900 }
  },
  '900#': {
    '3"': { boltsCount: 8, boltDiameter: '7/8"-9 UNC', socketSizeInches: '1-7/16"', socketSizeMm: 36, torqueFtLb: 380 },
    '4"': { boltsCount: 8, boltDiameter: '11/8"-8 UN', socketSizeInches: '1-13/16"', socketSizeMm: 46, torqueFtLb: 820 },
    '6"': { boltsCount: 12, boltDiameter: '11/8"-8 UN', socketSizeInches: '1-13/16"', socketSizeMm: 46, torqueFtLb: 820 },
    '8"': { boltsCount: 12, boltDiameter: '13/8"-8 UN', socketSizeInches: '2-3/16"', socketSizeMm: 55, torqueFtLb: 1600 }
  },
  '1500#': {
    '2"': { boltsCount: 8, boltDiameter: '7/8"-9 UNC', socketSizeInches: '1-7/16"', socketSizeMm: 36, torqueFtLb: 380 },
    '3"': { boltsCount: 8, boltDiameter: '11/8"-8 UN', socketSizeInches: '1-13/16"', socketSizeMm: 46, torqueFtLb: 820 },
    '4"': { boltsCount: 8, boltDiameter: '11/4"-8 UN', socketSizeInches: '2"', socketSizeMm: 50, torqueFtLb: 1200 },
    '6"': { boltsCount: 12, boltDiameter: '13/8"-8 UN', socketSizeInches: '2-3/16"', socketSizeMm: 55, torqueFtLb: 1650 }
  },
  '2500#': {
    '2"': { boltsCount: 8, boltDiameter: '1"-8 UNC', socketSizeInches: '1-5/8"', socketSizeMm: 41, torqueFtLb: 580 },
    '3"': { boltsCount: 8, boltDiameter: '11/4"-8 UN', socketSizeInches: '2"', socketSizeMm: 50, torqueFtLb: 1250 },
    '4"': { boltsCount: 8, boltDiameter: '11/2"-8 UN', socketSizeInches: '2-3/8"', socketSizeMm: 60, torqueFtLb: 2100 }
  }
};

export default function EngineeringTools() {
  const [activeModule, setActiveModule] = useState<
    'pipe' | 'hydrotest' | 'flange' | 'paint_dft' | 'tank_vol' | 'civil' | 'conversions'
  >('pipe');

  // 1. Pipe State
  const [pipeNps, setPipeNps] = useState<string>('4"');
  const [pipeSch, setPipeSch] = useState<string>('SCH 40/STD');
  const [pipeGrade, setPipeGrade] = useState<string>('X52');
  const [pipeLengthMeters, setPipeLengthMeters] = useState<number>(100);

  // 2. Hydrotest State
  const [hydroCode, setHydroCode] = useState<'B31.3' | 'B31.4' | 'B31.8'>('B31.4');
  const [maopPsi, setMaopPsi] = useState<number>(720);
  const [hydroNps, setHydroNps] = useState<string>('8"');
  const [hydroSch, setHydroSch] = useState<string>('SCH 40/STD');
  const [hydroGrade, setHydroGrade] = useState<string>('X52');

  // 3. Flange Torque State
  const [flangeClass, setFlangeClass] = useState<string>('150#');
  const [flangeSize, setFlangeSize] = useState<string>('4"');
  const [lubricantK, setLubricantK] = useState<number>(0.15); // 0.12 Teflon/Moly, 0.15 Anti-Seize, 0.20 Dry

  // 4. Paint DFT/WFT State
  const [targetDftMils, setTargetDftMils] = useState<number>(10); // 10 mils dry
  const [percentSolids, setPercentSolids] = useState<number>(75); // 75%
  const [percentDilution, setPercentDilution] = useState<number>(5); // 5%
  const [paintAreaM2, setPaintAreaM2] = useState<number>(250);
  const [lossFactorPercent, setLossFactorPercent] = useState<number>(25); // 25% overspray/profile loss

  // 5. Tank Volumetrics State
  const [tankType, setTankType] = useState<'vertical' | 'horizontal'>('vertical');
  const [tankDiameterM, setTankDiameterM] = useState<number>(12);
  const [tankHeightM, setTankHeightM] = useState<number>(10);
  const [liquidDipLevelM, setLiquidDipLevelM] = useState<number>(6.5);
  const [fluidSg, setFluidSg] = useState<number>(0.85); // Crude SG ~0.85 (35 API)

  // 6. Civil Takeoff State
  const [civilType, setCivilType] = useState<'concrete' | 'bricks' | 'paint'>('concrete');
  const [civilLength, setCivilLength] = useState<number>(10);
  const [civilWidth, setCivilWidth] = useState<number>(5);
  const [civilHeight, setCivilHeight] = useState<number>(0.3);

  // 7. Conversion State
  const [convValue, setConvValue] = useState<number>(100);
  const [convCategory, setConvCategory] = useState<'pressure' | 'flow' | 'length' | 'torque' | 'volume'>('pressure');
  const [convFrom, setConvFrom] = useState<string>('psi');
  const [convTo, setConvTo] = useState<string>('bar');

  // Calculations:
  // 1. Pipe Props Calculation
  const currentPipeSpec = PIPE_DATA[pipeNps] || PIPE_DATA['4"'];
  const currentPipeSch = currentPipeSpec.schedules[pipeSch] || Object.values(currentPipeSpec.schedules)[0];
  const currentGrade = API_GRADES[pipeGrade] || API_GRADES['X52'];

  const pipeOdIn = currentPipeSpec.odInches;
  const pipeWallIn = currentPipeSch.wallInches;
  const pipeIdIn = pipeOdIn - 2 * pipeWallIn;
  const pipeIdMm = pipeIdIn * 25.4;

  // Weight formula (kg/m): W = 0.02466 * t * (OD - t)
  const weightKgPerMeter = 0.02466 * currentPipeSch.wallMm * (currentPipeSpec.odMm - currentPipeSch.wallMm);
  const weightLbPerFoot = weightKgPerMeter * 0.671969;
  const totalPipeWeightTons = (weightKgPerMeter * pipeLengthMeters) / 1000;

  // Internal volume: V = PI/4 * ID^2 * L
  const pipeVolumeLitersPerMeter = (Math.PI / 4) * Math.pow(pipeIdMm / 1000, 2) * 1000;
  const totalLineVolumeM3 = (pipeVolumeLitersPerMeter * pipeLengthMeters) / 1000;
  const totalLineVolumeBbl = totalLineVolumeM3 * 6.28981;

  // Barlow Pressure: P = (2 * S * t * E * F) / OD  (E=1.0, F=0.72)
  const barlowMaxPsi = (2 * currentGrade.smysPsi * pipeWallIn * 1.0 * 0.72) / pipeOdIn;
  const barlowMaxBar = barlowMaxPsi / 14.5038;

  // 2. Hydrotest Calculation
  const hydroPipeSpec = PIPE_DATA[hydroNps] || PIPE_DATA['8"'];
  const hydroSchSpec = hydroPipeSpec.schedules[hydroSch] || Object.values(hydroPipeSpec.schedules)[0];
  const hydroGradeSpec = API_GRADES[hydroGrade] || API_GRADES['X52'];

  let hydroFactor = 1.25;
  if (hydroCode === 'B31.3') hydroFactor = 1.50;
  else if (hydroCode === 'B31.4') hydroFactor = 1.25;
  else if (hydroCode === 'B31.8') hydroFactor = 1.40;

  const hydroTargetPressurePsi = maopPsi * hydroFactor;
  const hydroTargetPressureBar = hydroTargetPressurePsi / 14.5038;

  // Hoop Stress during test: S_test = (P_test * OD) / (2 * t)
  const testHoopStressPsi = (hydroTargetPressurePsi * hydroPipeSpec.odInches) / (2 * hydroSchSpec.wallInches);
  const percentSmysAtTest = (testHoopStressPsi / hydroGradeSpec.smysPsi) * 100;

  // 3. Flange Torque Calculation
  const flangeClassesAvailable = Object.keys(FLANGE_TORQUE_DATA);
  const flangeSizesAvailable = Object.keys(FLANGE_TORQUE_DATA[flangeClass] || {});
  const currentFlangeSpec = FLANGE_TORQUE_DATA[flangeClass]?.[flangeSize] || Object.values(FLANGE_TORQUE_DATA[flangeClass] || {})[0] || {
    boltsCount: 8, boltDiameter: '3/4"-10 UNC', socketSizeInches: '1-1/4"', socketSizeMm: 32, torqueFtLb: 200
  };

  const calculatedTorqueFtLb = Math.round(currentFlangeSpec.torqueFtLb * (lubricantK / 0.15));
  const calculatedTorqueNm = Math.round(calculatedTorqueFtLb * 1.35582);

  // 4. Paint DFT/WFT Calculation
  // WFT = (DFT / %Solids) * (1 + %Dilution)
  const wftMils = (targetDftMils / (percentSolids / 100)) * (1 + percentDilution / 100);
  const wftMicrons = wftMils * 25.4;
  const dftMicrons = targetDftMils * 25.4;

  // Theoretical Coverage: 1 mil DFT = 1604 sqft/gal / %solids -> ~ 39.7 m2/gal @ 1 mil @ 100%
  const theoreticalCoverageM2PerGal = (39.7 * (percentSolids / 100)) / targetDftMils;
  const practicalCoverageM2PerGal = theoreticalCoverageM2PerGal * (1 - lossFactorPercent / 100);
  const gallonsRequired = paintAreaM2 / (practicalCoverageM2PerGal || 1);
  const litersRequired = gallonsRequired * 3.78541;

  // 5. Tank Volumetrics Calculation
  let totalTankVolM3 = 0;
  let liquidVolM3 = 0;

  if (tankType === 'vertical') {
    const radius = tankDiameterM / 2;
    totalTankVolM3 = Math.PI * Math.pow(radius, 2) * tankHeightM;
    const effectiveLiquidLevel = Math.min(liquidDipLevelM, tankHeightM);
    liquidVolM3 = Math.PI * Math.pow(radius, 2) * effectiveLiquidLevel;
  } else {
    // Horizontal Tank Cylinder Approximation
    const radius = tankDiameterM / 2;
    const length = tankHeightM; // Length
    totalTankVolM3 = Math.PI * Math.pow(radius, 2) * length;
    const h = Math.min(liquidDipLevelM, tankDiameterM);
    // Segment area formula: A = r^2 * acos((r-h)/r) - (r-h)*sqrt(2*r*h - h^2)
    const segmentArea = Math.pow(radius, 2) * Math.acos((radius - h) / radius) - (radius - h) * Math.sqrt(Math.max(0, 2 * radius * h - Math.pow(h, 2)));
    liquidVolM3 = segmentArea * length;
  }

  const liquidVolBbl = liquidVolM3 * 6.28981;
  const ullageVolM3 = Math.max(0, totalTankVolM3 - liquidVolM3);
  const liquidMetricTons = liquidVolM3 * fluidSg;

  // 6. Conversions Calculation
  const convRates: Record<string, Record<string, number>> = {
    pressure: { psi: 1, bar: 0.0689476, kPa: 6.89476, MPa: 0.00689476, 'kg/cm²': 0.070307 },
    flow: { GPM: 1, BPD: 34.2857, 'm³/h': 0.227125, 'L/min': 3.78541 },
    length: { m: 1, ft: 3.28084, in: 39.3701, km: 0.001, mi: 0.000621371 },
    torque: { 'ft-lb': 1, 'N·m': 1.35582, 'in-lb': 12, 'kg·m': 0.138255 },
    volume: { m3: 1, bbl: 6.28981, gal: 264.172, L: 1000 }
  };

  const handleRunConversion = () => {
    const rates = convRates[convCategory] || convRates.pressure;
    const fromRate = rates[convFrom] || 1;
    const toRate = rates[convTo] || 1;
    const base = convValue / fromRate;
    return (base * toRate).toFixed(3);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <header className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider mb-1">
            <Wrench size={16} /> Suite de Herramientas de Ingeniería Oil & Gas / Civil
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Calculadoras y Tablas Técnicas de Campo</h1>
          <p className="text-xs text-slate-400 mt-1">
            Propiedades API 5L, Pruebas Hidrostáticas, Torque de Bridas, Pintura NACE/PDVSA, Volumetría API 650 y Cómputos Civiles
          </p>
        </div>
      </header>

      {/* Module Navigation Bar */}
      <div className="flex overflow-x-auto gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs font-bold scrollbar-none">
        {[
          { id: 'pipe', label: 'Tuberías API 5L', icon: Flame },
          { id: 'hydrotest', label: 'Prueba Hidrostática', icon: Gauge },
          { id: 'flange', label: 'Torque de Bridas', icon: Disc },
          { id: 'paint_dft', label: 'Espesor Pintura (DFT/WFT)', icon: Paintbrush },
          { id: 'tank_vol', label: 'Volumetría Tanques API', icon: Database },
          { id: 'civil', label: 'Cómputos Civiles', icon: Box },
          { id: 'conversions', label: 'Conversor Universal', icon: ArrowRightLeft },
        ].map((mod) => {
          const Icon = mod.icon;
          return (
            <button
              key={mod.id}
              onClick={() => setActiveModule(mod.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all ${
                activeModule === mod.id
                  ? 'bg-slate-900 text-emerald-400 shadow'
                  : 'text-slate-600 hover:bg-white hover:text-slate-900'
              }`}
            >
              <Icon size={16} />
              {mod.label}
            </button>
          );
        })}
      </div>

      {/* MODULE 1: PIPE PROPERTIES API 5L */}
      {activeModule === 'pipe' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
            <div className="border-b border-gray-100 pb-3 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Flame size={20} className="text-emerald-600" />
                  Calculadora de Peso y Propiedades de Tuberías
                </h2>
                <p className="text-xs text-gray-500">Normas ASME B36.10M y API Spec 5L / 5CT</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Diámetro Nominal (NPS)</label>
                <select 
                  value={pipeNps} 
                  onChange={(e) => {
                    setPipeNps(e.target.value);
                    const newSchs = Object.keys(PIPE_DATA[e.target.value].schedules);
                    if (!newSchs.includes(pipeSch)) setPipeSch(newSchs[0]);
                  }}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {Object.keys(PIPE_DATA).map(nps => (
                    <option key={nps} value={nps}>{nps}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Cédula / Schedule</label>
                <select 
                  value={pipeSch} 
                  onChange={(e) => setPipeSch(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {Object.keys(currentPipeSpec.schedules).map(sch => (
                    <option key={sch} value={sch}>{sch}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Grado del Acero API 5L</label>
                <select 
                  value={pipeGrade} 
                  onChange={(e) => setPipeGrade(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {Object.keys(API_GRADES).map(grd => (
                    <option key={grd} value={grd}>{API_GRADES[grd].name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Longitud de Línea (m)</label>
                <input 
                  type="number" 
                  value={pipeLengthMeters} 
                  onChange={(e) => setPipeLengthMeters(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Results Grid */}
            <div className="p-5 bg-slate-900 text-white rounded-2xl space-y-4">
              <span className="text-xs font-mono uppercase font-bold text-emerald-400 block">Especificaciones Dimensionale e Hidráulicas</span>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
                <div className="p-3 bg-slate-800 rounded-xl border border-slate-700">
                  <span className="text-slate-400 block mb-1">Diámetro Exterior (OD)</span>
                  <span className="text-lg font-bold text-white">{pipeOdIn}" / {currentPipeSpec.odMm} mm</span>
                </div>

                <div className="p-3 bg-slate-800 rounded-xl border border-slate-700">
                  <span className="text-slate-400 block mb-1">Espesor de Pared (t)</span>
                  <span className="text-lg font-bold text-white">{pipeWallIn.toFixed(3)}" / {currentPipeSch.wallMm} mm</span>
                </div>

                <div className="p-3 bg-slate-800 rounded-xl border border-slate-700">
                  <span className="text-slate-400 block mb-1">Diámetro Interior (ID)</span>
                  <span className="text-lg font-bold text-emerald-400">{pipeIdIn.toFixed(3)}" / {pipeIdMm.toFixed(1)} mm</span>
                </div>

                <div className="p-3 bg-slate-800 rounded-xl border border-slate-700">
                  <span className="text-slate-400 block mb-1">Peso Nominal</span>
                  <span className="text-lg font-bold text-white">{weightKgPerMeter.toFixed(2)} kg/m</span>
                  <span className="text-[10px] text-slate-400 block">{weightLbPerFoot.toFixed(2)} lb/ft</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs font-mono">
                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                  <span className="text-slate-400 block">Peso Total en Sitio ({pipeLengthMeters}m)</span>
                  <span className="text-xl font-bold text-amber-400 mt-1 block">{totalPipeWeightTons.toFixed(2)} Toneladas</span>
                </div>

                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                  <span className="text-slate-400 block">Capacidad Volumétrica Línea</span>
                  <span className="text-xl font-bold text-blue-400 mt-1 block">{totalLineVolumeM3.toFixed(2)} m³ ({totalLineVolumeBbl.toFixed(1)} bbl)</span>
                </div>

                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                  <span className="text-slate-400 block">Presión Máx Barlow (F=0.72)</span>
                  <span className="text-xl font-bold text-emerald-400 mt-1 block">{Math.round(barlowMaxPsi)} psi / {Math.round(barlowMaxBar)} bar</span>
                </div>
              </div>
            </div>
          </div>

          {/* Reference Card */}
          <div className="bg-emerald-950 text-white rounded-2xl p-6 space-y-4 shadow-sm border border-emerald-800">
            <h3 className="font-bold text-sm flex items-center gap-2 text-emerald-400">
              <Info size={18} /> Criterios de Selección API 5L
            </h3>
            <p className="text-xs text-emerald-100 leading-relaxed">
              El peso nominal de la tubería se calcula aplicando la fórmula estandarizada de densidad del acero (7,850 kg/m³):
            </p>
            <div className="p-3 bg-emerald-900/80 rounded-xl text-xs font-mono text-emerald-200">
              W = 0.02466 × t × (OD - t) [kg/m]
            </div>
            <ul className="text-xs text-emerald-200 space-y-2">
              <li className="flex items-start gap-1.5">• <span><strong>SMYS:</strong> Specified Minimum Yield Strength del grado del tubo.</span></li>
              <li className="flex items-start gap-1.5">• <span><strong>Factor Barlow (F):</strong> 0.72 para transporte continuo de fluidos en campo.</span></li>
            </ul>
          </div>
        </div>
      )}

      {/* MODULE 2: HYDROSTATIC TEST CALCULATION */}
      {activeModule === 'hydrotest' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
            <div className="border-b border-gray-100 pb-3">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Gauge size={20} className="text-emerald-600" />
                Calculadora de Presión de Prueba Hidrostática
              </h2>
              <p className="text-xs text-gray-500">Acreditación según ASME B31.3 / B31.4 / B31.8 / PDVSA O-201</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Norma / Código de Diseño</label>
                <select 
                  value={hydroCode} 
                  onChange={(e) => setHydroCode(e.target.value as any)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="B31.4">ASME B31.4 (Líquidos - 1.25 x MOP)</option>
                  <option value="B31.3">ASME B31.3 (Procesos - 1.50 x Design P)</option>
                  <option value="B31.8">ASME B31.8 (Gas - 1.40 x MAOP Cl 2)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Presión de Operación/Diseño (MAOP - psi)</label>
                <input 
                  type="number" 
                  value={maopPsi} 
                  onChange={(e) => setMaopPsi(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Tubería NPS</label>
                <select 
                  value={hydroNps} 
                  onChange={(e) => setHydroNps(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {Object.keys(PIPE_DATA).map(nps => (
                    <option key={nps} value={nps}>{nps}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Cédula Tubería</label>
                <select 
                  value={hydroSch} 
                  onChange={(e) => setHydroSch(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {Object.keys(hydroPipeSpec.schedules).map(sch => (
                    <option key={sch} value={sch}>{sch}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Grado del Acero</label>
                <select 
                  value={hydroGrade} 
                  onChange={(e) => setHydroGrade(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {Object.keys(API_GRADES).map(grd => (
                    <option key={grd} value={grd}>{API_GRADES[grd].name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Hydro Results */}
            <div className="p-5 bg-slate-900 text-white rounded-2xl space-y-4">
              <span className="text-xs font-mono uppercase font-bold text-emerald-400 block">Resultados de Prueba Hidrostática Obligatoria</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
                <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
                  <span className="text-slate-400 block">Presión Objetivo de Prueba</span>
                  <span className="text-2xl font-black text-emerald-400 mt-1 block">
                    {Math.round(hydroTargetPressurePsi)} psi
                  </span>
                  <span className="text-slate-400 text-[11px] block mt-1">{hydroTargetPressureBar.toFixed(1)} bar</span>
                </div>

                <div className={`p-4 rounded-xl border ${percentSmysAtTest > 90 ? 'bg-red-950/60 border-red-700' : 'bg-slate-800 border-slate-700'}`}>
                  <span className="text-slate-400 block">Esfuerzo Hoop (% SMYS)</span>
                  <span className={`text-2xl font-black mt-1 block ${percentSmysAtTest > 90 ? 'text-red-400' : 'text-amber-400'}`}>
                    {percentSmysAtTest.toFixed(1)}% SMYS
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    {percentSmysAtTest > 90 ? '⚠️ Alerta: Cerca del 100% de cedencia' : '✓ Seguro (< 90% SMYS)'}
                  </span>
                </div>

                <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
                  <span className="text-slate-400 block">Tiempo Mínimo Sostenimiento</span>
                  <span className="text-xl font-bold text-blue-400 mt-1 block">
                    {hydroCode === 'B31.4' ? '4 a 8 Horas' : hydroCode === 'B31.3' ? '10 a 30 Minutos' : '8 Horas Continuous'}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">Monitoreo con registrador gráfico Barton</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 text-white rounded-2xl p-6 space-y-3 font-mono text-xs border border-slate-800">
            <h3 className="font-bold text-emerald-400 flex items-center gap-2">
              <CheckCircle2 size={16} /> Requisitos de Prueba Hidrostática
            </h3>
            <p className="text-slate-300">
              Para validar el protocolo de prueba ante la contratista o inspector PDVSA / Chevron:
            </p>
            <ul className="space-y-2 text-slate-400">
              <li>1. Registrar temperatura ambiente y de tubería.</li>
              <li>2. Utilizar agua limpia con inhibidor de corrosión.</li>
              <li>3. Dos manómetros calibrados con certificado vigente &lt; 6 meses.</li>
              <li>4. Graficador Barton con escala de 24 horas.</li>
            </ul>
          </div>
        </div>
      )}

      {/* MODULE 3: FLANGE BOLT TORQUE ANSI B16.5 */}
      {activeModule === 'flange' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
            <div className="border-b border-gray-100 pb-3">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Disc size={20} className="text-emerald-600" />
                Tabla y Calculadora de Torque de Bridas (ANSI/ASME B16.5)
              </h2>
              <p className="text-xs text-gray-500">Secuencia de apriete cruzado estrella y libración de torquímetro</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Clase de Brida (ANSI)</label>
                <select 
                  value={flangeClass} 
                  onChange={(e) => {
                    setFlangeClass(e.target.value);
                    const sizes = Object.keys(FLANGE_TORQUE_DATA[e.target.value] || {});
                    if (!sizes.includes(flangeSize)) setFlangeSize(sizes[0]);
                  }}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {flangeClassesAvailable.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Diámetro Nominal (NPS)</label>
                <select 
                  value={flangeSize} 
                  onChange={(e) => setFlangeSize(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {flangeSizesAvailable.map(sz => (
                    <option key={sz} value={sz}>{sz}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Coeficiente Lubricante (K)</label>
                <select 
                  value={lubricantK} 
                  onChange={(e) => setLubricantK(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value={0.12}>K = 0.12 (Teflón / Moly paste)</option>
                  <option value={0.15}>K = 0.15 (Anti-Seize Níquel/Cobre)</option>
                  <option value={0.20}>K = 0.20 (Perno Seco / Aceite ligero)</option>
                </select>
              </div>
            </div>

            {/* Torque Results */}
            <div className="p-5 bg-slate-900 text-white rounded-2xl space-y-4">
              <span className="text-xs font-mono uppercase font-bold text-emerald-400 block">Especificaciones de Pernos y Torque Recomendado</span>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
                <div className="p-3 bg-slate-800 rounded-xl border border-slate-700">
                  <span className="text-slate-400 block">Número de Espárragos</span>
                  <span className="text-xl font-bold text-white">{currentFlangeSpec.boltsCount} Pernos</span>
                </div>

                <div className="p-3 bg-slate-800 rounded-xl border border-slate-700">
                  <span className="text-slate-400 block">Diámetro y Rosca</span>
                  <span className="text-lg font-bold text-white">{currentFlangeSpec.boltDiameter}</span>
                </div>

                <div className="p-3 bg-slate-800 rounded-xl border border-slate-700">
                  <span className="text-slate-400 block">Boca de Copa (Socket)</span>
                  <span className="text-lg font-bold text-emerald-400">{currentFlangeSpec.socketSizeInches} ({currentFlangeSpec.socketSizeMm} mm)</span>
                </div>

                <div className="p-3 bg-slate-800 rounded-xl border border-slate-700">
                  <span className="text-slate-400 block">Torque Objetivo (100%)</span>
                  <span className="text-xl font-bold text-amber-400">{calculatedTorqueFtLb} ft-lb</span>
                  <span className="text-[10px] text-slate-400 block">{calculatedTorqueNm} N·m</span>
                </div>
              </div>

              {/* Passes */}
              <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700 space-y-2 font-mono text-xs">
                <span className="text-slate-300 font-bold block">Pases Graduales de Torquímetro (Paso a Paso):</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="p-2 bg-slate-900 rounded">Paso 1 (30%): <strong>{Math.round(calculatedTorqueFtLb * 0.3)} ft-lb</strong></div>
                  <div className="p-2 bg-slate-900 rounded">Paso 2 (60%): <strong>{Math.round(calculatedTorqueFtLb * 0.6)} ft-lb</strong></div>
                  <div className="p-2 bg-slate-900 rounded">Paso 3 (100%): <strong>{calculatedTorqueFtLb} ft-lb</strong></div>
                  <div className="p-2 bg-emerald-950 text-emerald-400 rounded border border-emerald-800">Final (Circular): <strong>{calculatedTorqueFtLb} ft-lb</strong></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 text-white rounded-2xl p-6 space-y-4 font-mono text-xs border border-slate-800">
            <h3 className="font-bold text-emerald-400">Patrón de Apriete en Cruz</h3>
            <p className="text-slate-300">
              Seguir estrictamente el orden simétrico en cruz (1-2, 3-4, etc.) para evitar aprisionamiento o desalineación del empaque espirometálico (Flexitallic).
            </p>
            <div className="p-4 bg-slate-800 rounded-xl text-center text-slate-400">
              Visualización de brida {flangeSize} {flangeClass} con {currentFlangeSpec.boltsCount} espárragos.
            </div>
          </div>
        </div>
      )}

      {/* MODULE 4: PAINT DFT / WFT NACE / PDVSA */}
      {activeModule === 'paint_dft' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
            <div className="border-b border-gray-100 pb-3">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Paintbrush size={20} className="text-emerald-600" />
                Calculadora de Espesor de Película Seca/Húmeda (NACE / SSPC / PDVSA O-201)
              </h2>
              <p className="text-xs text-gray-500">Cálculo de WFT, rendimiento teórico/práctico y galones por merma</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Espesor Seco Objetivo (DFT - mils)</label>
                <input 
                  type="number" 
                  step="0.5"
                  value={targetDftMils} 
                  onChange={(e) => setTargetDftMils(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[10px] text-gray-400 font-mono">1 mil = 25.4 micras (µm)</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">% Sólidos por Volumen</label>
                <input 
                  type="number" 
                  value={percentSolids} 
                  onChange={(e) => setPercentSolids(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[10px] text-gray-400 font-mono">Según hoja técnica de pintura</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">% Adición de Diluyente / Thinner</label>
                <input 
                  type="number" 
                  value={percentDilution} 
                  onChange={(e) => setPercentDilution(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Área a Pintar (m²)</label>
                <input 
                  type="number" 
                  value={paintAreaM2} 
                  onChange={(e) => setPaintAreaM2(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">% Factor de Merma / Pérdida</label>
                <input 
                  type="number" 
                  value={lossFactorPercent} 
                  onChange={(e) => setLossFactorPercent(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[10px] text-gray-400 font-mono">20-35% por sobreaspersión/perfil</span>
              </div>
            </div>

            {/* Paint Results */}
            <div className="p-5 bg-slate-900 text-white rounded-2xl space-y-4 font-mono text-xs">
              <span className="text-xs uppercase font-bold text-emerald-400 block">Lectura de Galga de Peine (WFT) y Consumo Real</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
                  <span className="text-slate-400 block">Espesor Húmedo Requerido (WFT)</span>
                  <span className="text-2xl font-black text-emerald-400 mt-1 block">
                    {wftMils.toFixed(1)} mils
                  </span>
                  <span className="text-slate-400 text-[11px] block mt-1">{Math.round(wftMicrons)} µm (micras)</span>
                </div>

                <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
                  <span className="text-slate-400 block">Rendimiento Práctico</span>
                  <span className="text-xl font-bold text-amber-400 mt-1 block">
                    {practicalCoverageM2PerGal.toFixed(1)} m²/galón
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">Con {lossFactorPercent}% de merma</span>
                </div>

                <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
                  <span className="text-slate-400 block">Volumen Total Requerido</span>
                  <span className="text-2xl font-black text-blue-400 mt-1 block">
                    {Math.ceil(gallonsRequired)} Galones
                  </span>
                  <span className="text-slate-400 text-[11px] block mt-1">({litersRequired.toFixed(1)} Litros)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 text-white rounded-2xl p-6 space-y-3 font-mono text-xs border border-slate-800">
            <h3 className="font-bold text-emerald-400">Control de Calidad NACE/PDVSA O-201</h3>
            <p className="text-slate-300">
              La medición de espesor húmedo (WFT) debe realizarse inmediatamente tras la aplicación con la galga de peine húmedo.
            </p>
            <div className="p-3 bg-slate-800 rounded-xl text-slate-400 space-y-1">
              <div>• DFT Objetivo: {targetDftMils} mils ({Math.round(dftMicrons)} µm)</div>
              <div>• WFT Peine: {wftMils.toFixed(1)} mils ({Math.round(wftMicrons)} µm)</div>
            </div>
          </div>
        </div>
      )}

      {/* MODULE 5: TANK VOLUMETRICS API 650/653 */}
      {activeModule === 'tank_vol' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
            <div className="border-b border-gray-100 pb-3">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Database size={20} className="text-emerald-600" />
                Volumetría de Tanques de Almacenamiento (API 650 / API 653)
              </h2>
              <p className="text-xs text-gray-500">Aforo volumétrico, capacidad útil, volumen muerto y ullage</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Geometría de Tanque</label>
                <select 
                  value={tankType} 
                  onChange={(e) => setTankType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="vertical">Cilíndrico Vertical (API 650)</option>
                  <option value="horizontal">Cilíndrico Horizontal (Bala)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Diámetro Interior (m)</label>
                <input 
                  type="number" 
                  value={tankDiameterM} 
                  onChange={(e) => setTankDiameterM(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  {tankType === 'vertical' ? 'Altura de Tanque (m)' : 'Largo de Tanque (m)'}
                </label>
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
                  step="0.01"
                  value={liquidDipLevelM} 
                  onChange={(e) => setLiquidDipLevelM(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Gravedad Específica (SG)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={fluidSg} 
                  onChange={(e) => setFluidSg(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[10px] text-gray-400 font-mono">Crudo 35° API ≈ 0.85 SG</span>
              </div>
            </div>

            {/* Tank Results */}
            <div className="p-5 bg-slate-900 text-white rounded-2xl space-y-4 font-mono text-xs">
              <span className="text-xs uppercase font-bold text-emerald-400 block">Capacidad Nomina y Almacenamiento Actual</span>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-slate-800 rounded-xl border border-slate-700">
                  <span className="text-slate-400 block mb-1">Capacidad Nominal (100%)</span>
                  <span className="text-lg font-bold text-white">{Math.round(totalTankVolM3)} m³</span>
                  <span className="text-[10px] text-slate-400 block">{Math.round(totalTankVolM3 * 6.28981)} bbl</span>
                </div>

                <div className="p-3 bg-slate-800 rounded-xl border border-slate-700">
                  <span className="text-slate-400 block mb-1">Volumen Líquido Actual</span>
                  <span className="text-xl font-bold text-emerald-400">{Math.round(liquidVolM3)} m³</span>
                  <span className="text-[10px] text-emerald-300 font-bold block">{Math.round(liquidVolBbl)} bbl</span>
                </div>

                <div className="p-3 bg-slate-800 rounded-xl border border-slate-700">
                  <span className="text-slate-400 block mb-1">Ullage (Espacio Disponible)</span>
                  <span className="text-lg font-bold text-amber-400">{Math.round(ullageVolM3)} m³</span>
                  <span className="text-[10px] text-slate-400 block">{Math.round(ullageVolM3 * 6.28981)} bbl</span>
                </div>

                <div className="p-3 bg-slate-800 rounded-xl border border-slate-700">
                  <span className="text-slate-400 block mb-1">Masa Almacenada</span>
                  <span className="text-lg font-bold text-blue-400">{liquidMetricTons.toFixed(1)} Ton. M.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 text-white rounded-2xl p-6 space-y-3 font-mono text-xs border border-slate-800">
            <h3 className="font-bold text-emerald-400">Verificación API 653</h3>
            <p className="text-slate-300">
              Para tanques verticales, la tabla de aforo oficial considera la deformación hidrostática de las virolas del cuerpo del tanque.
            </p>
          </div>
        </div>
      )}

      {/* MODULE 6: CIVIL COMPUTATIONS */}
      {activeModule === 'civil' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
          <div className="border-b border-gray-100 pb-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Box size={20} className="text-emerald-600" />
              Cómputos Métricos Civiles e Infraestructura
            </h2>
            <p className="text-xs text-gray-500">Estimación rápida de concreto, mampostería y encofrado</p>
          </div>

          <div className="flex gap-4">
            {[
              { id: 'concrete', label: 'Concreto Estructural', icon: Box },
              { id: 'bricks', label: 'Mampostería / Paredes', icon: Layers },
              { id: 'paint', label: 'Pintura y Acabados', icon: Droplets }
            ].map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  onClick={() => setCivilType(type.id as any)}
                  className={`flex-1 flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    civilType === type.id 
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-bold' 
                      : 'border-gray-100 hover:border-gray-200 text-gray-600'
                  }`}
                >
                  <Icon size={24} />
                  <span className="text-xs font-medium">{type.label}</span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Largo (m)</label>
              <input 
                type="number" 
                value={civilLength} 
                onChange={(e) => setCivilLength(Number(e.target.value))}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none"
              />
            </div>

            {civilType === 'concrete' && (
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Ancho (m)</label>
                <input 
                  type="number" 
                  value={civilWidth} 
                  onChange={(e) => setCivilWidth(Number(e.target.value))}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                {civilType === 'concrete' ? 'Espesor / Altura (m)' : 'Altura de Pared (m)'}
              </label>
              <input 
                type="number" 
                value={civilHeight} 
                onChange={(e) => setCivilHeight(Number(e.target.value))}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none"
              />
            </div>
          </div>

          {civilType === 'concrete' && (
            <div className="p-5 bg-slate-900 text-white rounded-2xl font-mono text-xs space-y-3">
              <span className="text-emerald-400 font-bold uppercase block">Materiales Estimados Concreto Dosificación 1:2:3 (f'c 210 kg/cm²)</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-800 rounded-xl">Volumen: <strong>{(civilLength * civilWidth * civilHeight).toFixed(2)} m³</strong></div>
                <div className="p-3 bg-slate-800 rounded-xl">Cemento (42.5kg): <strong>{Math.ceil((civilLength * civilWidth * civilHeight) * 8.5)} Sacos</strong></div>
                <div className="p-3 bg-slate-800 rounded-xl">Arena Lavada: <strong>{((civilLength * civilWidth * civilHeight) * 0.55).toFixed(2)} m³</strong></div>
                <div className="p-3 bg-slate-800 rounded-xl">Piedra Picada: <strong>{((civilLength * civilWidth * civilHeight) * 0.85).toFixed(2)} m³</strong></div>
              </div>
            </div>
          )}

          {civilType === 'bricks' && (
            <div className="p-5 bg-slate-900 text-white rounded-2xl font-mono text-xs space-y-3">
              <span className="text-emerald-400 font-bold uppercase block">Materiales Estimados Mampostería (Bloque 15x20x40 cm)</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-800 rounded-xl">Área Pared: <strong>{(civilLength * civilHeight).toFixed(2)} m²</strong></div>
                <div className="p-3 bg-slate-800 rounded-xl">Bloques Requeridos: <strong>{Math.ceil((civilLength * civilHeight) * 12.5)} Unidades</strong></div>
                <div className="p-3 bg-slate-800 rounded-xl">Mortero Pega: <strong>{((civilLength * civilHeight) * 0.025).toFixed(2)} m³</strong></div>
              </div>
            </div>
          )}

          {civilType === 'paint' && (
            <div className="p-5 bg-slate-900 text-white rounded-2xl font-mono text-xs space-y-3">
              <span className="text-emerald-400 font-bold uppercase block">Materiales Estimados Pintura Tipo A / Caucho</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-800 rounded-xl">Área a Pintar: <strong>{(civilLength * civilHeight).toFixed(2)} m²</strong></div>
                <div className="p-3 bg-slate-800 rounded-xl">Pintura (2 Manos): <strong>{Math.ceil(((civilLength * civilHeight) * 2) / 35)} Cuñetes / Galones</strong></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODULE 7: UNIVERSAL CONVERTER */}
      {activeModule === 'conversions' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
          <div className="border-b border-gray-100 pb-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <ArrowRightLeft size={20} className="text-emerald-600" />
              Conversor Universal de Unidades de Ingeniería
            </h2>
            <p className="text-xs text-gray-500">Presión, caudal, torque, longitud y volumen</p>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {['pressure', 'flow', 'torque', 'length', 'volume'].map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setConvCategory(cat as any);
                  const units = Object.keys(convRates[cat]);
                  setConvFrom(units[0]);
                  setConvTo(units[1] || units[0]);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-colors ${
                  convCategory === cat ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat === 'pressure' ? 'Presión' : cat === 'flow' ? 'Caudal' : cat === 'torque' ? 'Torque' : cat === 'length' ? 'Longitud' : 'Volumen'}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex w-full sm:flex-1 gap-2">
              <input 
                type="number" 
                value={convValue} 
                onChange={(e) => setConvValue(Number(e.target.value))}
                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-lg font-bold outline-none"
              />
              <select 
                value={convFrom} 
                onChange={(e) => setConvFrom(e.target.value)}
                className="w-32 px-2 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none"
              >
                {Object.keys(convRates[convCategory] || {}).map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>

            <div className="text-slate-400">
              <ArrowRightLeft size={24} />
            </div>

            <div className="flex w-full sm:flex-1 gap-2">
              <div className="flex-1 px-4 py-3 bg-slate-900 border border-slate-800 text-emerald-400 rounded-xl text-xl font-black font-mono flex items-center">
                {handleRunConversion()}
              </div>
              <select 
                value={convTo} 
                onChange={(e) => setConvTo(e.target.value)}
                className="w-32 px-2 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none"
              >
                {Object.keys(convRates[convCategory] || {}).map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
