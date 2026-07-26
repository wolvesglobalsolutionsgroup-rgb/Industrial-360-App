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
  Thermometer,
  FileText
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
    '1-1/4"': { nps: '1-1/4"', odMm: 117, thicknessMm: 15.9, bcdMm: 88.9, holesCount: 4, holeDiamInches: '5/8"', boltDiamInches: '1/2"-13 UNC', socketInches: '7/8"', socketMm: 22, torqueFtLb: 60 },
    '1-1/2"': { nps: '1-1/2"', odMm: 127, thicknessMm: 17.5, bcdMm: 98.4, holesCount: 4, holeDiamInches: '5/8"', boltDiamInches: '1/2"-13 UNC', socketInches: '7/8"', socketMm: 22, torqueFtLb: 60 },
    '2"': { nps: '2"', odMm: 152, thicknessMm: 19.1, bcdMm: 120.7, holesCount: 4, holeDiamInches: '3/4"', boltDiamInches: '5/8"-11 UNC', socketInches: '1-1/16"', socketMm: 27, torqueFtLb: 120 },
    '2-1/2"': { nps: '2-1/2"', odMm: 178, thicknessMm: 22.4, bcdMm: 139.7, holesCount: 4, holeDiamInches: '3/4"', boltDiamInches: '5/8"-11 UNC', socketInches: '1-1/16"', socketMm: 27, torqueFtLb: 120 },
    '3"': { nps: '3"', odMm: 191, thicknessMm: 23.9, bcdMm: 152.4, holesCount: 4, holeDiamInches: '3/4"', boltDiamInches: '5/8"-11 UNC', socketInches: '1-1/16"', socketMm: 27, torqueFtLb: 120 },
    '3-1/2"': { nps: '3-1/2"', odMm: 216, thicknessMm: 23.9, bcdMm: 177.8, holesCount: 8, holeDiamInches: '3/4"', boltDiamInches: '5/8"-11 UNC', socketInches: '1-1/16"', socketMm: 27, torqueFtLb: 120 },
    '4"': { nps: '4"', odMm: 229, thicknessMm: 23.9, bcdMm: 190.5, holesCount: 8, holeDiamInches: '3/4"', boltDiamInches: '5/8"-11 UNC', socketInches: '1-1/16"', socketMm: 27, torqueFtLb: 120 },
    '5"': { nps: '5"', odMm: 254, thicknessMm: 23.9, bcdMm: 215.9, holesCount: 8, holeDiamInches: '7/8"', boltDiamInches: '3/4"-10 UNC', socketInches: '1-1/4"', socketMm: 32, torqueFtLb: 200 },
    '6"': { nps: '6"', odMm: 279, thicknessMm: 25.4, bcdMm: 241.3, holesCount: 8, holeDiamInches: '7/8"', boltDiamInches: '3/4"-10 UNC', socketInches: '1-1/4"', socketMm: 32, torqueFtLb: 200 },
    '8"': { nps: '8"', odMm: 343, thicknessMm: 28.6, bcdMm: 298.5, holesCount: 8, holeDiamInches: '7/8"', boltDiamInches: '3/4"-10 UNC', socketInches: '1-1/4"', socketMm: 32, torqueFtLb: 200 },
    '10"': { nps: '10"', odMm: 406, thicknessMm: 30.2, bcdMm: 362.0, holesCount: 12, holeDiamInches: '1"', boltDiamInches: '7/8"-9 UNC', socketInches: '1-7/16"', socketMm: 36, torqueFtLb: 320 },
    '12"': { nps: '12"', odMm: 483, thicknessMm: 31.8, bcdMm: 431.8, holesCount: 12, holeDiamInches: '1"', boltDiamInches: '7/8"-9 UNC', socketInches: '1-7/16"', socketMm: 36, torqueFtLb: 320 },
    '14"': { nps: '14"', odMm: 533, thicknessMm: 35.0, bcdMm: 476.3, holesCount: 12, holeDiamInches: '1-1/8"', boltDiamInches: '1"-8 UNC', socketInches: '1-5/8"', socketMm: 41, torqueFtLb: 480 },
    '16"': { nps: '16"', odMm: 597, thicknessMm: 36.5, bcdMm: 539.8, holesCount: 16, holeDiamInches: '1-1/8"', boltDiamInches: '1"-8 UNC', socketInches: '1-5/8"', socketMm: 41, torqueFtLb: 480 },
    '18"': { nps: '18"', odMm: 635, thicknessMm: 39.7, bcdMm: 577.9, holesCount: 16, holeDiamInches: '1-1/4"', boltDiamInches: '1-1/8"-8 UN', socketInches: '1-13/16"', socketMm: 46, torqueFtLb: 710 },
    '20"': { nps: '20"', odMm: 699, thicknessMm: 42.9, bcdMm: 635.0, holesCount: 20, holeDiamInches: '1-1/4"', boltDiamInches: '1-1/8"-8 UN', socketInches: '1-13/16"', socketMm: 46, torqueFtLb: 710 },
    '24"': { nps: '24"', odMm: 813, thicknessMm: 47.6, bcdMm: 749.3, holesCount: 20, holeDiamInches: '1-3/8"', boltDiamInches: '1-1/4"-8 UN', socketInches: '2"', socketMm: 50, torqueFtLb: 1000 },
    '26"': { nps: '26"', odMm: 870, thicknessMm: 68.3, bcdMm: 806.5, holesCount: 24, holeDiamInches: '1-3/8"', boltDiamInches: '1-1/4"-8 UN', socketInches: '2"', socketMm: 50, torqueFtLb: 1050 },
    '28"': { nps: '28"', odMm: 927, thicknessMm: 71.4, bcdMm: 863.6, holesCount: 28, holeDiamInches: '1-3/8"', boltDiamInches: '1-1/4"-8 UN', socketInches: '2"', socketMm: 50, torqueFtLb: 1100 },
    '30"': { nps: '30"', odMm: 984, thicknessMm: 74.6, bcdMm: 914.4, holesCount: 28, holeDiamInches: '1-3/8"', boltDiamInches: '1-1/4"-8 UN', socketInches: '2"', socketMm: 50, torqueFtLb: 1150 },
    '32"': { nps: '32"', odMm: 1060, thicknessMm: 81.0, bcdMm: 977.9, holesCount: 28, holeDiamInches: '1-5/8"', boltDiamInches: '1-1/2"-8 UN', socketInches: '2-3/8"', socketMm: 60, torqueFtLb: 1800 },
    '34"': { nps: '34"', odMm: 1111, thicknessMm: 82.6, bcdMm: 1028.7, holesCount: 32, holeDiamInches: '1-5/8"', boltDiamInches: '1-1/2"-8 UN', socketInches: '2-3/8"', socketMm: 60, torqueFtLb: 1850 },
    '36"': { nps: '36"', odMm: 1168, thicknessMm: 90.5, bcdMm: 1085.9, holesCount: 32, holeDiamInches: '1-5/8"', boltDiamInches: '1-1/2"-8 UN', socketInches: '2-3/8"', socketMm: 60, torqueFtLb: 1900 },
    '40"': { nps: '40"', odMm: 1289, thicknessMm: 90.5, bcdMm: 1200.2, holesCount: 36, holeDiamInches: '1-5/8"', boltDiamInches: '1-1/2"-8 UN', socketInches: '2-3/8"', socketMm: 60, torqueFtLb: 2000 },
    '42"': { nps: '42"', odMm: 1346, thicknessMm: 96.8, bcdMm: 1257.3, holesCount: 36, holeDiamInches: '1-5/8"', boltDiamInches: '1-1/2"-8 UN', socketInches: '2-3/8"', socketMm: 60, torqueFtLb: 2100 }
  },
  '300#': {
    '1/2"': { nps: '1/2"', odMm: 95, thicknessMm: 14.3, bcdMm: 66.7, holesCount: 4, holeDiamInches: '5/8"', boltDiamInches: '1/2"-13 UNC', socketInches: '7/8"', socketMm: 22, torqueFtLb: 70 },
    '3/4"': { nps: '3/4"', odMm: 117, thicknessMm: 15.9, bcdMm: 82.6, holesCount: 4, holeDiamInches: '3/4"', boltDiamInches: '5/8"-11 UNC', socketInches: '1-1/16"', socketMm: 27, torqueFtLb: 130 },
    '1"': { nps: '1"', odMm: 124, thicknessMm: 17.5, bcdMm: 88.9, holesCount: 4, holeDiamInches: '3/4"', boltDiamInches: '5/8"-11 UNC', socketInches: '1-1/16"', socketMm: 27, torqueFtLb: 130 },
    '1-1/4"': { nps: '1-1/4"', odMm: 133, thicknessMm: 19.1, bcdMm: 98.4, holesCount: 4, holeDiamInches: '3/4"', boltDiamInches: '5/8"-11 UNC', socketInches: '1-1/16"', socketMm: 27, torqueFtLb: 130 },
    '1-1/2"': { nps: '1-1/2"', odMm: 156, thicknessMm: 20.6, bcdMm: 114.3, holesCount: 4, holeDiamInches: '7/8"', boltDiamInches: '3/4"-10 UNC', socketInches: '1-1/4"', socketMm: 32, torqueFtLb: 210 },
    '2"': { nps: '2"', odMm: 165, thicknessMm: 22.4, bcdMm: 127.0, holesCount: 8, holeDiamInches: '3/4"', boltDiamInches: '5/8"-11 UNC', socketInches: '1-1/16"', socketMm: 27, torqueFtLb: 120 },
    '2-1/2"': { nps: '2-1/2"', odMm: 191, thicknessMm: 25.4, bcdMm: 149.2, holesCount: 8, holeDiamInches: '7/8"', boltDiamInches: '3/4"-10 UNC', socketInches: '1-1/4"', socketMm: 32, torqueFtLb: 210 },
    '3"': { nps: '3"', odMm: 210, thicknessMm: 28.6, bcdMm: 168.3, holesCount: 8, holeDiamInches: '7/8"', boltDiamInches: '3/4"-10 UNC', socketInches: '1-1/4"', socketMm: 32, torqueFtLb: 200 },
    '3-1/2"': { nps: '3-1/2"', odMm: 229, thicknessMm: 30.2, bcdMm: 184.2, holesCount: 8, holeDiamInches: '7/8"', boltDiamInches: '3/4"-10 UNC', socketInches: '1-1/4"', socketMm: 32, torqueFtLb: 210 },
    '4"': { nps: '4"', odMm: 254, thicknessMm: 31.8, bcdMm: 200.0, holesCount: 8, holeDiamInches: '7/8"', boltDiamInches: '3/4"-10 UNC', socketInches: '1-1/4"', socketMm: 32, torqueFtLb: 200 },
    '5"': { nps: '5"', odMm: 279, thicknessMm: 35.0, bcdMm: 235.0, holesCount: 8, holeDiamInches: '7/8"', boltDiamInches: '3/4"-10 UNC', socketInches: '1-1/4"', socketMm: 32, torqueFtLb: 220 },
    '6"': { nps: '6"', odMm: 318, thicknessMm: 36.5, bcdMm: 269.9, holesCount: 12, holeDiamInches: '7/8"', boltDiamInches: '3/4"-10 UNC', socketInches: '1-1/4"', socketMm: 32, torqueFtLb: 200 },
    '8"': { nps: '8"', odMm: 381, thicknessMm: 41.3, bcdMm: 330.2, holesCount: 12, holeDiamInches: '1"', boltDiamInches: '7/8"-9 UNC', socketInches: '1-7/16"', socketMm: 36, torqueFtLb: 320 },
    '10"': { nps: '10"', odMm: 445, thicknessMm: 47.6, bcdMm: 387.4, holesCount: 16, holeDiamInches: '1-1/8"', boltDiamInches: '1"-8 UNC', socketInches: '1-5/8"', socketMm: 41, torqueFtLb: 500 },
    '12"': { nps: '12"', odMm: 521, thicknessMm: 50.8, bcdMm: 457.2, holesCount: 16, holeDiamInches: '1-1/4"', boltDiamInches: '1-1/8"-8 UN', socketInches: '1-13/16"', socketMm: 46, torqueFtLb: 710 },
    '14"': { nps: '14"', odMm: 584, thicknessMm: 54.0, bcdMm: 514.4, holesCount: 20, holeDiamInches: '1-1/4"', boltDiamInches: '1-1/8"-8 UN', socketInches: '1-13/16"', socketMm: 46, torqueFtLb: 730 },
    '16"': { nps: '16"', odMm: 648, thicknessMm: 57.2, bcdMm: 571.5, holesCount: 20, holeDiamInches: '1-3/8"', boltDiamInches: '1-1/4"-8 UN', socketInches: '2"', socketMm: 50, torqueFtLb: 1050 },
    '18"': { nps: '18"', odMm: 711, thicknessMm: 60.3, bcdMm: 628.7, holesCount: 24, holeDiamInches: '1-3/8"', boltDiamInches: '1-1/4"-8 UN', socketInches: '2"', socketMm: 50, torqueFtLb: 1100 },
    '20"': { nps: '20"', odMm: 775, thicknessMm: 63.5, bcdMm: 685.8, holesCount: 24, holeDiamInches: '1-3/8"', boltDiamInches: '1-1/4"-8 UN', socketInches: '2"', socketMm: 50, torqueFtLb: 1150 },
    '24"': { nps: '24"', odMm: 914, thicknessMm: 69.9, bcdMm: 812.8, holesCount: 24, holeDiamInches: '1-5/8"', boltDiamInches: '1-1/2"-8 UN', socketInches: '2-3/8"', socketMm: 60, torqueFtLb: 1950 },
    '26"': { nps: '26"', odMm: 972, thicknessMm: 88.9, bcdMm: 876.3, holesCount: 28, holeDiamInches: '1-3/8"', boltDiamInches: '1-1/4"-8 UN', socketInches: '2"', socketMm: 50, torqueFtLb: 1200 },
    '28"': { nps: '28"', odMm: 1035, thicknessMm: 95.3, bcdMm: 933.5, holesCount: 28, holeDiamInches: '1-5/8"', boltDiamInches: '1-1/2"-8 UN', socketInches: '2-3/8"', socketMm: 60, torqueFtLb: 2000 },
    '30"': { nps: '30"', odMm: 1092, thicknessMm: 101.6, bcdMm: 990.6, holesCount: 28, holeDiamInches: '1-7/8"', boltDiamInches: '1-3/4"-8 UN', socketInches: '2-3/4"', socketMm: 70, torqueFtLb: 3100 },
    '32"': { nps: '32"', odMm: 1149, thicknessMm: 108.0, bcdMm: 1047.8, holesCount: 28, holeDiamInches: '2"', boltDiamInches: '1-7/8"-8 UN', socketInches: '2-15/16"', socketMm: 75, torqueFtLb: 3800 },
    '34"': { nps: '34"', odMm: 1207, thicknessMm: 111.1, bcdMm: 1104.9, holesCount: 32, holeDiamInches: '2"', boltDiamInches: '1-7/8"-8 UN', socketInches: '2-15/16"', socketMm: 75, torqueFtLb: 3900 },
    '36"': { nps: '36"', odMm: 1270, thicknessMm: 117.5, bcdMm: 1162.1, holesCount: 32, holeDiamInches: '2-1/8"', boltDiamInches: '2"-8 UN', socketInches: '3-1/8"', socketMm: 80, torqueFtLb: 4800 },
    '40"': { nps: '40"', odMm: 1240, thicknessMm: 133.4, bcdMm: 1143.0, holesCount: 32, holeDiamInches: '1-7/8"', boltDiamInches: '1-3/4"-8 UN', socketInches: '2-3/4"', socketMm: 70, torqueFtLb: 3300 },
    '42"': { nps: '42"', odMm: 1295, thicknessMm: 142.9, bcdMm: 1193.8, holesCount: 36, holeDiamInches: '1-7/8"', boltDiamInches: '1-3/4"-8 UN', socketInches: '2-3/4"', socketMm: 70, torqueFtLb: 3500 }
  },
  '600#': {
    '1/2"': { nps: '1/2"', odMm: 95, thicknessMm: 14.3, bcdMm: 66.7, holesCount: 4, holeDiamInches: '5/8"', boltDiamInches: '1/2"-13 UNC', socketInches: '7/8"', socketMm: 22, torqueFtLb: 80 },
    '3/4"': { nps: '3/4"', odMm: 117, thicknessMm: 15.9, bcdMm: 82.6, holesCount: 4, holeDiamInches: '3/4"', boltDiamInches: '5/8"-11 UNC', socketInches: '1-1/16"', socketMm: 27, torqueFtLb: 140 },
    '1"': { nps: '1"', odMm: 124, thicknessMm: 17.5, bcdMm: 88.9, holesCount: 4, holeDiamInches: '3/4"', boltDiamInches: '5/8"-11 UNC', socketInches: '1-1/16"', socketMm: 27, torqueFtLb: 140 },
    '1-1/4"': { nps: '1-1/4"', odMm: 133, thicknessMm: 20.6, bcdMm: 98.4, holesCount: 4, holeDiamInches: '3/4"', boltDiamInches: '5/8"-11 UNC', socketInches: '1-1/16"', socketMm: 27, torqueFtLb: 140 },
    '1-1/2"': { nps: '1-1/2"', odMm: 156, thicknessMm: 22.4, bcdMm: 114.3, holesCount: 4, holeDiamInches: '7/8"', boltDiamInches: '3/4"-10 UNC', socketInches: '1-1/4"', socketMm: 32, torqueFtLb: 230 },
    '2"': { nps: '2"', odMm: 165, thicknessMm: 25.4, bcdMm: 127.0, holesCount: 8, holeDiamInches: '3/4"', boltDiamInches: '5/8"-11 UNC', socketInches: '1-1/16"', socketMm: 27, torqueFtLb: 140 },
    '2-1/2"': { nps: '2-1/2"', odMm: 191, thicknessMm: 28.6, bcdMm: 149.2, holesCount: 8, holeDiamInches: '7/8"', boltDiamInches: '3/4"-10 UNC', socketInches: '1-1/4"', socketMm: 32, torqueFtLb: 230 },
    '3"': { nps: '3"', odMm: 210, thicknessMm: 31.8, bcdMm: 168.3, holesCount: 8, holeDiamInches: '7/8"', boltDiamInches: '3/4"-10 UNC', socketInches: '1-1/4"', socketMm: 32, torqueFtLb: 230 },
    '3-1/2"': { nps: '3-1/2"', odMm: 229, thicknessMm: 35.0, bcdMm: 184.2, holesCount: 8, holeDiamInches: '1"', boltDiamInches: '7/8"-9 UNC', socketInches: '1-7/16"', socketMm: 36, torqueFtLb: 360 },
    '4"': { nps: '4"', odMm: 273, thicknessMm: 38.1, bcdMm: 215.9, holesCount: 8, holeDiamInches: '1"', boltDiamInches: '7/8"-9 UNC', socketInches: '1-7/16"', socketMm: 36, torqueFtLb: 360 },
    '5"': { nps: '5"', odMm: 330, thicknessMm: 44.5, bcdMm: 266.7, holesCount: 8, holeDiamInches: '1-1/8"', boltDiamInches: '1"-8 UNC', socketInches: '1-5/8"', socketMm: 41, torqueFtLb: 540 },
    '6"': { nps: '6"', odMm: 356, thicknessMm: 47.6, bcdMm: 292.1, holesCount: 12, holeDiamInches: '1-1/8"', boltDiamInches: '1"-8 UNC', socketInches: '1-5/8"', socketMm: 41, torqueFtLb: 540 },
    '8"': { nps: '8"', odMm: 419, thicknessMm: 55.6, bcdMm: 349.2, holesCount: 12, holeDiamInches: '1-1/4"', boltDiamInches: '1-1/8"-8 UN', socketInches: '1-13/16"', socketMm: 46, torqueFtLb: 780 },
    '10"': { nps: '10"', odMm: 508, thicknessMm: 63.5, bcdMm: 431.8, holesCount: 16, holeDiamInches: '1-3/8"', boltDiamInches: '1-1/4"-8 UN', socketInches: '2"', socketMm: 50, torqueFtLb: 1150 },
    '12"': { nps: '12"', odMm: 559, thicknessMm: 66.7, bcdMm: 489.0, holesCount: 20, holeDiamInches: '1-3/8"', boltDiamInches: '1-1/4"-8 UN', socketInches: '2"', socketMm: 50, torqueFtLb: 1200 },
    '14"': { nps: '14"', odMm: 603, thicknessMm: 69.9, bcdMm: 527.1, holesCount: 20, holeDiamInches: '1-5/8"', boltDiamInches: '1-3/8"-8 UN', socketInches: '2-3/16"', socketMm: 55, torqueFtLb: 1600 },
    '16"': { nps: '16"', odMm: 686, thicknessMm: 76.2, bcdMm: 603.3, holesCount: 20, holeDiamInches: '1-5/8"', boltDiamInches: '1-1/2"-8 UN', socketInches: '2-3/8"', socketMm: 60, torqueFtLb: 2100 },
    '18"': { nps: '18"', odMm: 743, thicknessMm: 82.6, bcdMm: 654.1, holesCount: 20, holeDiamInches: '1-7/8"', boltDiamInches: '1-5/8"-8 UN', socketInches: '2-9/16"', socketMm: 65, torqueFtLb: 2800 },
    '20"': { nps: '20"', odMm: 813, thicknessMm: 88.9, bcdMm: 723.9, holesCount: 24, holeDiamInches: '1-7/8"', boltDiamInches: '1-5/8"-8 UN', socketInches: '2-9/16"', socketMm: 65, torqueFtLb: 2900 },
    '24"': { nps: '24"', odMm: 940, thicknessMm: 101.6, bcdMm: 838.2, holesCount: 24, holeDiamInches: '2-1/8"', boltDiamInches: '1-7/8"-8 UN', socketInches: '2-15/16"', socketMm: 75, torqueFtLb: 4400 },
    '26"': { nps: '26"', odMm: 1016, thicknessMm: 108.0, bcdMm: 914.4, holesCount: 28, holeDiamInches: '2-1/8"', boltDiamInches: '1-7/8"-8 UN', socketInches: '2-15/16"', socketMm: 75, torqueFtLb: 4600 },
    '28"': { nps: '28"', odMm: 1073, thicknessMm: 114.3, bcdMm: 965.2, holesCount: 28, holeDiamInches: '2-3/8"', boltDiamInches: '2"-8 UN', socketInches: '3-1/8"', socketMm: 80, torqueFtLb: 5600 },
    '30"': { nps: '30"', odMm: 1130, thicknessMm: 120.7, bcdMm: 1022.4, holesCount: 28, holeDiamInches: '2-3/8"', boltDiamInches: '2"-8 UN', socketInches: '3-1/8"', socketMm: 80, torqueFtLb: 5800 },
    '32"': { nps: '32"', odMm: 1194, thicknessMm: 127.0, bcdMm: 1079.5, holesCount: 28, holeDiamInches: '2-5/8"', boltDiamInches: '2-1/4"-8 UN', socketInches: '3-1/2"', socketMm: 90, torqueFtLb: 7800 },
    '34"': { nps: '34"', odMm: 1245, thicknessMm: 133.4, bcdMm: 1130.3, holesCount: 32, holeDiamInches: '2-5/8"', boltDiamInches: '2-1/4"-8 UN', socketInches: '3-1/2"', socketMm: 90, torqueFtLb: 8000 },
    '36"': { nps: '36"', odMm: 1314, thicknessMm: 139.7, bcdMm: 1193.8, holesCount: 32, holeDiamInches: '2-7/8"', boltDiamInches: '2-1/2"-8 UN', socketInches: '3-7/8"', socketMm: 98, torqueFtLb: 10500 },
    '40"': { nps: '40"', odMm: 1321, thicknessMm: 165.1, bcdMm: 1212.9, holesCount: 32, holeDiamInches: '2-3/8"', boltDiamInches: '2-1/4"-8 UN', socketInches: '3-1/2"', socketMm: 90, torqueFtLb: 8200 },
    '42"': { nps: '42"', odMm: 1378, thicknessMm: 171.5, bcdMm: 1263.7, holesCount: 32, holeDiamInches: '2-5/8"', boltDiamInches: '2-1/2"-8 UN', socketInches: '3-7/8"', socketMm: 98, torqueFtLb: 11000 }
  },
  '900#': {
    '1/2"': { nps: '1/2"', odMm: 121, thicknessMm: 22.4, bcdMm: 82.6, holesCount: 4, holeDiamInches: '7/8"', boltDiamInches: '3/4"-10 UNC', socketInches: '1-1/4"', socketMm: 32, torqueFtLb: 220 },
    '3/4"': { nps: '3/4"', odMm: 130, thicknessMm: 25.4, bcdMm: 88.9, holesCount: 4, holeDiamInches: '7/8"', boltDiamInches: '3/4"-10 UNC', socketInches: '1-1/4"', socketMm: 32, torqueFtLb: 220 },
    '1"': { nps: '1"', odMm: 149, thicknessMm: 28.6, bcdMm: 101.6, holesCount: 4, holeDiamInches: '1"', boltDiamInches: '7/8"-9 UNC', socketInches: '1-7/16"', socketMm: 36, torqueFtLb: 350 },
    '1-1/4"': { nps: '1-1/4"', odMm: 159, thicknessMm: 28.6, bcdMm: 111.1, holesCount: 4, holeDiamInches: '1"', boltDiamInches: '7/8"-9 UNC', socketInches: '1-7/16"', socketMm: 36, torqueFtLb: 350 },
    '1-1/2"': { nps: '1-1/2"', odMm: 178, thicknessMm: 31.8, bcdMm: 124.0, holesCount: 4, holeDiamInches: '1-1/8"', boltDiamInches: '1"-8 UNC', socketInches: '1-5/8"', socketMm: 41, torqueFtLb: 520 },
    '2"': { nps: '2"', odMm: 216, thicknessMm: 38.1, bcdMm: 165.1, holesCount: 8, holeDiamInches: '1"', boltDiamInches: '7/8"-9 UNC', socketInches: '1-7/16"', socketMm: 36, torqueFtLb: 380 },
    '2-1/2"': { nps: '2-1/2"', odMm: 244, thicknessMm: 41.3, bcdMm: 190.5, holesCount: 8, holeDiamInches: '1-1/8"', boltDiamInches: '1"-8 UNC', socketInches: '1-5/8"', socketMm: 41, torqueFtLb: 550 },
    '3"': { nps: '3"', odMm: 241, thicknessMm: 38.1, bcdMm: 190.5, holesCount: 8, holeDiamInches: '1"', boltDiamInches: '7/8"-9 UNC', socketInches: '1-7/16"', socketMm: 36, torqueFtLb: 380 },
    '4"': { nps: '4"', odMm: 292, thicknessMm: 44.5, bcdMm: 235.0, holesCount: 8, holeDiamInches: '1-1/4"', boltDiamInches: '1-1/8"-8 UN', socketInches: '1-13/16"', socketMm: 46, torqueFtLb: 800 },
    '6"': { nps: '6"', odMm: 381, thicknessMm: 55.6, bcdMm: 317.5, holesCount: 12, holeDiamInches: '1-1/4"', boltDiamInches: '1-1/8"-8 UN', socketInches: '1-13/16"', socketMm: 46, torqueFtLb: 820 },
    '8"': { nps: '8"', odMm: 470, thicknessMm: 63.5, bcdMm: 393.7, holesCount: 12, holeDiamInches: '1-1/2"', boltDiamInches: '1-3/8"-8 UN', socketInches: '2-3/16"', socketMm: 55, torqueFtLb: 1650 },
    '10"': { nps: '10"', odMm: 546, thicknessMm: 69.9, bcdMm: 469.9, holesCount: 16, holeDiamInches: '1-1/2"', boltDiamInches: '1-3/8"-8 UN', socketInches: '2-3/16"', socketMm: 55, torqueFtLb: 1700 },
    '12"': { nps: '12"', odMm: 610, thicknessMm: 79.4, bcdMm: 533.4, holesCount: 20, holeDiamInches: '1-1/2"', boltDiamInches: '1-3/8"-8 UN', socketInches: '2-3/16"', socketMm: 55, torqueFtLb: 1750 },
    '14"': { nps: '14"', odMm: 641, thicknessMm: 85.7, bcdMm: 558.8, holesCount: 20, holeDiamInches: '1-5/8"', boltDiamInches: '1-1/2"-8 UN', socketInches: '2-3/8"', socketMm: 60, torqueFtLb: 2300 },
    '16"': { nps: '16"', odMm: 705, thicknessMm: 88.9, bcdMm: 616.0, holesCount: 20, holeDiamInches: '1-7/8"', boltDiamInches: '1-3/4"-8 UN', socketInches: '2-3/4"', socketMm: 70, torqueFtLb: 3600 },
    '18"': { nps: '18"', odMm: 787, thicknessMm: 101.6, bcdMm: 685.8, holesCount: 20, holeDiamInches: '2-1/8"', boltDiamInches: '2"-8 UN', socketInches: '3-1/8"', socketMm: 80, torqueFtLb: 5400 },
    '20"': { nps: '20"', odMm: 851, thicknessMm: 108.0, bcdMm: 749.3, holesCount: 20, holeDiamInches: '2-1/8"', boltDiamInches: '2"-8 UN', socketInches: '3-1/8"', socketMm: 80, torqueFtLb: 5600 },
    '24"': { nps: '24"', odMm: 1041, thicknessMm: 139.7, bcdMm: 901.7, holesCount: 20, holeDiamInches: '2-5/8"', boltDiamInches: '2-1/2"-8 UN', socketInches: '3-7/8"', socketMm: 98, torqueFtLb: 11200 },
    '26"': { nps: '26"', odMm: 1086, thicknessMm: 152.4, bcdMm: 952.5, holesCount: 24, holeDiamInches: '2-7/8"', boltDiamInches: '2-1/2"-8 UN', socketInches: '3-7/8"', socketMm: 98, torqueFtLb: 11500 },
    '28"': { nps: '28"', odMm: 1168, thicknessMm: 165.1, bcdMm: 1022.4, holesCount: 24, holeDiamInches: '3-1/8"', boltDiamInches: '2-3/4"-8 UN', socketInches: '4-1/4"', socketMm: 108, torqueFtLb: 15000 },
    '30"': { nps: '30"', odMm: 1232, thicknessMm: 171.5, bcdMm: 1085.9, holesCount: 24, holeDiamInches: '3-3/8"', boltDiamInches: '3"-8 UN', socketInches: '4-5/8"', socketMm: 118, torqueFtLb: 19500 },
    '36"': { nps: '36"', odMm: 1461, thicknessMm: 212.7, bcdMm: 1289.1, holesCount: 28, holeDiamInches: '3-5/8"', boltDiamInches: '3-1/2"-8 UN', socketInches: '5-3/8"', socketMm: 136, torqueFtLb: 31000 },
    '42"': { nps: '42"', odMm: 1676, thicknessMm: 241.3, bcdMm: 1485.9, holesCount: 32, holeDiamInches: '4-1/8"', boltDiamInches: '4"-8 UN', socketInches: '6-1/8"', socketMm: 155, torqueFtLb: 46000 }
  },
  '1500#': {
    '1/2"': { nps: '1/2"', odMm: 121, thicknessMm: 22.4, bcdMm: 82.6, holesCount: 4, holeDiamInches: '7/8"', boltDiamInches: '3/4"-10 UNC', socketInches: '1-1/4"', socketMm: 32, torqueFtLb: 220 },
    '3/4"': { nps: '3/4"', odMm: 130, thicknessMm: 25.4, bcdMm: 88.9, holesCount: 4, holeDiamInches: '7/8"', boltDiamInches: '3/4"-10 UNC', socketInches: '1-1/4"', socketMm: 32, torqueFtLb: 220 },
    '1"': { nps: '1"', odMm: 149, thicknessMm: 28.6, bcdMm: 101.6, holesCount: 4, holeDiamInches: '1"', boltDiamInches: '7/8"-9 UNC', socketInches: '1-7/16"', socketMm: 36, torqueFtLb: 350 },
    '1-1/2"': { nps: '1-1/2"', odMm: 178, thicknessMm: 31.8, bcdMm: 124.0, holesCount: 4, holeDiamInches: '1-1/8"', boltDiamInches: '1"-8 UNC', socketInches: '1-5/8"', socketMm: 41, torqueFtLb: 520 },
    '2"': { nps: '2"', odMm: 216, thicknessMm: 38.1, bcdMm: 165.1, holesCount: 8, holeDiamInches: '1"', boltDiamInches: '7/8"-9 UNC', socketInches: '1-7/16"', socketMm: 36, torqueFtLb: 380 },
    '3"': { nps: '3"', odMm: 267, thicknessMm: 47.6, bcdMm: 203.2, holesCount: 8, holeDiamInches: '1-2/8"', boltDiamInches: '1-1/8"-8 UN', socketInches: '1-13/16"', socketMm: 46, torqueFtLb: 850 },
    '4"': { nps: '4"', odMm: 311, thicknessMm: 54.0, bcdMm: 241.3, holesCount: 8, holeDiamInches: '1-3/8"', boltDiamInches: '1-1/4"-8 UN', socketInches: '2"', socketMm: 50, torqueFtLb: 1200 },
    '6"': { nps: '6"', odMm: 394, thicknessMm: 82.6, bcdMm: 317.5, holesCount: 12, holeDiamInches: '1-1/2"', boltDiamInches: '1-3/8"-8 UN', socketInches: '2-3/16"', socketMm: 55, torqueFtLb: 1750 },
    '8"': { nps: '8"', odMm: 483, thicknessMm: 92.1, bcdMm: 393.7, holesCount: 12, holeDiamInches: '1-3/4"', boltDiamInches: '1-5/8"-8 UN', socketInches: '2-9/16"', socketMm: 65, torqueFtLb: 2900 },
    '10"': { nps: '10"', odMm: 584, thicknessMm: 108.0, bcdMm: 482.6, holesCount: 12, holeDiamInches: '2"', boltDiamInches: '1-7/8"-8 UN', socketInches: '2-15/16"', socketMm: 75, torqueFtLb: 4800 },
    '12"': { nps: '12"', odMm: 673, thicknessMm: 124.0, bcdMm: 552.4, holesCount: 16, holeDiamInches: '2-1/8"', boltDiamInches: '2"-8 UN', socketInches: '3-1/8"', socketMm: 80, torqueFtLb: 5800 },
    '14"': { nps: '14"', odMm: 749, thicknessMm: 133.4, bcdMm: 616.0, holesCount: 16, holeDiamInches: '2-3/8"', boltDiamInches: '2-1/4"-8 UN', socketInches: '3-1/2"', socketMm: 90, torqueFtLb: 8200 },
    '16"': { nps: '16"', odMm: 826, thicknessMm: 146.1, bcdMm: 685.8, holesCount: 16, holeDiamInches: '2-5/8"', boltDiamInches: '2-1/2"-8 UN', socketInches: '3-7/8"', socketMm: 98, torqueFtLb: 11800 },
    '18"': { nps: '18"', odMm: 914, thicknessMm: 162.0, bcdMm: 762.0, holesCount: 16, holeDiamInches: '2-7/8"', boltDiamInches: '2-3/4"-8 UN', socketInches: '4-1/4"', socketMm: 108, torqueFtLb: 15800 },
    '20"': { nps: '20"', odMm: 984, thicknessMm: 177.8, bcdMm: 825.5, holesCount: 16, holeDiamInches: '3-1/8"', boltDiamInches: '3"-8 UN', socketInches: '4-5/8"', socketMm: 118, torqueFtLb: 21000 },
    '24"': { nps: '24"', odMm: 1168, thicknessMm: 203.2, bcdMm: 990.6, holesCount: 16, holeDiamInches: '3-5/8"', boltDiamInches: '3-1/2"-8 UN', socketInches: '5-3/8"', socketMm: 136, torqueFtLb: 33000 }
  },
  '2500#': {
    '1/2"': { nps: '1/2"', odMm: 133, thicknessMm: 30.2, bcdMm: 88.9, holesCount: 4, holeDiamInches: '7/8"', boltDiamInches: '3/4"-10 UNC', socketInches: '1-1/4"', socketMm: 32, torqueFtLb: 260 },
    '3/4"': { nps: '3/4"', odMm: 140, thicknessMm: 31.8, bcdMm: 95.3, holesCount: 4, holeDiamInches: '7/8"', boltDiamInches: '3/4"-10 UNC', socketInches: '1-1/4"', socketMm: 32, torqueFtLb: 260 },
    '1"': { nps: '1"', odMm: 159, thicknessMm: 35.0, bcdMm: 108.0, holesCount: 4, holeDiamInches: '1"', boltDiamInches: '7/8"-9 UNC', socketInches: '1-7/16"', socketMm: 36, torqueFtLb: 410 },
    '1-1/2"': { nps: '1-1/2"', odMm: 203, thicknessMm: 44.5, bcdMm: 133.4, holesCount: 4, holeDiamInches: '1-1/4"', boltDiamInches: '1-1/8"-8 UN', socketInches: '1-13/16"', socketMm: 46, torqueFtLb: 890 },
    '2"': { nps: '2"', odMm: 235, thicknessMm: 50.8, bcdMm: 171.4, holesCount: 8, holeDiamInches: '1-1/8"', boltDiamInches: '1"-8 UNC', socketInches: '1-5/8"', socketMm: 41, torqueFtLb: 580 },
    '2-1/2"': { nps: '2-1/2"', odMm: 267, thicknessMm: 57.2, bcdMm: 196.9, holesCount: 8, holeDiamInches: '1-1/4"', boltDiamInches: '1-1/8"-8 UN', socketInches: '1-13/16"', socketMm: 46, torqueFtLb: 920 },
    '3"': { nps: '3"', odMm: 305, thicknessMm: 66.7, bcdMm: 228.6, holesCount: 8, holeDiamInches: '1-3/8"', boltDiamInches: '1-1/4"-8 UN', socketInches: '2"', socketMm: 50, torqueFtLb: 1350 },
    '4"': { nps: '4"', odMm: 356, thicknessMm: 76.2, bcdMm: 273.0, holesCount: 8, holeDiamInches: '1-5/8"', boltDiamInches: '1-1/2"-8 UN', socketInches: '2-3/8"', socketMm: 60, torqueFtLb: 2100 },
    '6"': { nps: '6"', odMm: 483, thicknessMm: 108.0, bcdMm: 368.3, holesCount: 8, holeDiamInches: '2-1/8"', boltDiamInches: '2"-8 UN', socketInches: '3-1/8"', socketMm: 80, torqueFtLb: 6200 },
    '8"': { nps: '8"', odMm: 552, thicknessMm: 127.0, bcdMm: 438.2, holesCount: 12, holeDiamInches: '2-1/8"', boltDiamInches: '2"-8 UN', socketInches: '3-1/8"', socketMm: 80, torqueFtLb: 6400 },
    '10"': { nps: '10"', odMm: 673, thicknessMm: 165.1, bcdMm: 539.8, holesCount: 12, holeDiamInches: '2-5/8"', boltDiamInches: '2-1/2"-8 UN', socketInches: '3-7/8"', socketMm: 98, torqueFtLb: 12500 },
    '12"': { nps: '12"', odMm: 762, thicknessMm: 184.2, bcdMm: 619.1, holesCount: 12, holeDiamInches: '2-7/8"', boltDiamInches: '2-3/4"-8 UN', socketInches: '4-1/4"', socketMm: 108, torqueFtLb: 17200 }
  },
  'API 3K': {
    '2-1/16"': { nps: '2-1/16"', odMm: 200, thicknessMm: 33.3, bcdMm: 146.0, holesCount: 8, holeDiamInches: '7/8"', boltDiamInches: '3/4"-10 UNC', socketInches: '1-1/4"', socketMm: 32, torqueFtLb: 220 },
    '3-1/8"': { nps: '3-1/8"', odMm: 240, thicknessMm: 38.0, bcdMm: 181.0, holesCount: 8, holeDiamInches: '1"', boltDiamInches: '7/8"-9 UNC', socketInches: '1-7/16"', socketMm: 36, torqueFtLb: 380 },
    '4-1/16"': { nps: '4-1/16"', odMm: 275, thicknessMm: 44.5, bcdMm: 215.9, holesCount: 8, holeDiamInches: '1"', boltDiamInches: '7/8"-9 UNC', socketInches: '1-7/16"', socketMm: 36, torqueFtLb: 410 },
    '7-1/16"': { nps: '7-1/16"', odMm: 380, thicknessMm: 55.0, bcdMm: 317.5, holesCount: 12, holeDiamInches: '1-1/4"', boltDiamInches: '1-1/8"-8 UN', socketInches: '1-13/16"', socketMm: 46, torqueFtLb: 820 },
    '11"': { nps: '11"', odMm: 545, thicknessMm: 70.0, bcdMm: 469.9, holesCount: 16, holeDiamInches: '1-1/2"', boltDiamInches: '1-3/8"-8 UN', socketInches: '2-3/16"', socketMm: 55, torqueFtLb: 1700 }
  },
  'API 5K': {
    '2-1/16"': { nps: '2-1/16"', odMm: 215, thicknessMm: 38.1, bcdMm: 165.1, holesCount: 8, holeDiamInches: '1"', boltDiamInches: '7/8"-9 UNC', socketInches: '1-7/16"', socketMm: 36, torqueFtLb: 420 },
    '3-1/8"': { nps: '3-1/8"', odMm: 265, thicknessMm: 47.6, bcdMm: 203.2, holesCount: 8, holeDiamInches: '1-1/8"', boltDiamInches: '1"-8 UNC', socketInches: '1-5/8"', socketMm: 41, torqueFtLb: 850 },
    '4-1/16"': { nps: '4-1/16"', odMm: 310, thicknessMm: 54.0, bcdMm: 241.3, holesCount: 8, holeDiamInches: '1-3/8"', boltDiamInches: '1-1/4"-8 UN', socketInches: '2"', socketMm: 50, torqueFtLb: 1250 },
    '7-1/16"': { nps: '7-1/16"', odMm: 395, thicknessMm: 82.6, bcdMm: 317.5, holesCount: 12, holeDiamInches: '1-1/2"', boltDiamInches: '1-3/8"-8 UN', socketInches: '2-3/16"', socketMm: 55, torqueFtLb: 1750 },
    '11"': { nps: '11"', odMm: 585, thicknessMm: 108.0, bcdMm: 482.6, holesCount: 12, holeDiamInches: '2"', boltDiamInches: '1-7/8"-8 UN', socketInches: '2-15/16"', socketMm: 75, torqueFtLb: 4800 }
  },
  'API 10K': {
    '2-1/16"': { nps: '2-1/16"', odMm: 200, thicknessMm: 46.0, bcdMm: 146.0, holesCount: 8, holeDiamInches: '7/8"', boltDiamInches: '3/4"-10 UNC', socketInches: '1-1/4"', socketMm: 32, torqueFtLb: 280 },
    '3-1/16"': { nps: '3-1/16"', odMm: 270, thicknessMm: 57.0, bcdMm: 196.9, holesCount: 8, holeDiamInches: '1-1/4"', boltDiamInches: '1-1/8"-8 UN', socketInches: '1-13/16"', socketMm: 46, torqueFtLb: 950 },
    '4-1/16"': { nps: '4-1/16"', odMm: 315, thicknessMm: 70.0, bcdMm: 241.3, holesCount: 8, holeDiamInches: '1-3/8"', boltDiamInches: '1-1/4"-8 UN', socketInches: '2"', socketMm: 50, torqueFtLb: 1450 },
    '7-1/16"': { nps: '7-1/16"', odMm: 480, thicknessMm: 108.0, bcdMm: 368.3, holesCount: 8, holeDiamInches: '2-1/8"', boltDiamInches: '2"-8 UN', socketInches: '3-1/8"', socketMm: 80, torqueFtLb: 6400 }
  }
};

// 2. VALVE FACE-TO-FACE ASME B16.10
interface ValveSpec {
  nps: string;
  gateMm: number;
  ballMm: number;
  globeMm: number;
  checkMm: number;
  butterflyMm: number;
  plugMm: number;
}

const VALVE_FACE_DATA_BY_CLASS: Record<string, Record<string, ValveSpec>> = {
  '150#': {
    '1/2"': { nps: '1/2"', gateMm: 108, ballMm: 108, globeMm: 108, checkMm: 108, butterflyMm: 33, plugMm: 108 },
    '3/4"': { nps: '3/4"', gateMm: 117, ballMm: 117, globeMm: 117, checkMm: 117, butterflyMm: 33, plugMm: 117 },
    '1"': { nps: '1"', gateMm: 127, ballMm: 127, globeMm: 127, checkMm: 127, butterflyMm: 33, plugMm: 127 },
    '1-1/4"': { nps: '1-1/4"', gateMm: 140, ballMm: 140, globeMm: 140, checkMm: 140, butterflyMm: 33, plugMm: 140 },
    '1-1/2"': { nps: '1-1/2"', gateMm: 165, ballMm: 165, globeMm: 165, checkMm: 165, butterflyMm: 33, plugMm: 165 },
    '2"': { nps: '2"', gateMm: 178, ballMm: 178, globeMm: 203, checkMm: 203, butterflyMm: 43, plugMm: 178 },
    '2-1/2"': { nps: '2-1/2"', gateMm: 191, ballMm: 191, globeMm: 216, checkMm: 216, butterflyMm: 46, plugMm: 191 },
    '3"': { nps: '3"', gateMm: 203, ballMm: 203, globeMm: 241, checkMm: 241, butterflyMm: 46, plugMm: 203 },
    '3-1/2"': { nps: '3-1/2"', gateMm: 216, ballMm: 216, globeMm: 241, checkMm: 241, butterflyMm: 46, plugMm: 216 },
    '4"': { nps: '4"', gateMm: 229, ballMm: 229, globeMm: 292, checkMm: 292, butterflyMm: 52, plugMm: 229 },
    '5"': { nps: '5"', gateMm: 254, ballMm: 254, globeMm: 356, checkMm: 330, butterflyMm: 56, plugMm: 254 },
    '6"': { nps: '6"', gateMm: 267, ballMm: 394, globeMm: 406, checkMm: 356, butterflyMm: 56, plugMm: 267 },
    '8"': { nps: '8"', gateMm: 292, ballMm: 457, globeMm: 495, checkMm: 495, butterflyMm: 64, plugMm: 292 },
    '10"': { nps: '10"', gateMm: 330, ballMm: 533, globeMm: 622, checkMm: 622, butterflyMm: 68, plugMm: 330 },
    '12"': { nps: '12"', gateMm: 356, ballMm: 610, globeMm: 698, checkMm: 698, butterflyMm: 78, plugMm: 356 },
    '14"': { nps: '14"', gateMm: 381, ballMm: 686, globeMm: 787, checkMm: 787, butterflyMm: 78, plugMm: 381 },
    '16"': { nps: '16"', gateMm: 406, ballMm: 762, globeMm: 864, checkMm: 864, butterflyMm: 102, plugMm: 406 },
    '18"': { nps: '18"', gateMm: 432, ballMm: 864, globeMm: 978, checkMm: 978, butterflyMm: 114, plugMm: 432 },
    '20"': { nps: '20"', gateMm: 457, ballMm: 914, globeMm: 978, checkMm: 978, butterflyMm: 127, plugMm: 457 },
    '24"': { nps: '24"', gateMm: 508, ballMm: 1067, globeMm: 1295, checkMm: 1295, butterflyMm: 154, plugMm: 508 },
    '26"': { nps: '26"', gateMm: 559, ballMm: 1143, globeMm: 1350, checkMm: 1350, butterflyMm: 165, plugMm: 559 },
    '28"': { nps: '28"', gateMm: 610, ballMm: 1245, globeMm: 1420, checkMm: 1420, butterflyMm: 165, plugMm: 610 },
    '30"': { nps: '30"', gateMm: 660, ballMm: 1295, globeMm: 1500, checkMm: 1500, butterflyMm: 190, plugMm: 660 },
    '32"': { nps: '32"', gateMm: 711, ballMm: 1372, globeMm: 1580, checkMm: 1580, butterflyMm: 190, plugMm: 711 },
    '34"': { nps: '34"', gateMm: 762, ballMm: 1473, globeMm: 1650, checkMm: 1650, butterflyMm: 216, plugMm: 762 },
    '36"': { nps: '36"', gateMm: 813, ballMm: 1524, globeMm: 1727, checkMm: 1727, butterflyMm: 216, plugMm: 813 },
    '40"': { nps: '40"', gateMm: 914, ballMm: 1676, globeMm: 1850, checkMm: 1850, butterflyMm: 241, plugMm: 914 },
    '42"': { nps: '42"', gateMm: 965, ballMm: 1753, globeMm: 1950, checkMm: 1950, butterflyMm: 254, plugMm: 965 }
  },
  '300#': {
    '1/2"': { nps: '1/2"', gateMm: 140, ballMm: 140, globeMm: 152, checkMm: 152, butterflyMm: 33, plugMm: 140 },
    '3/4"': { nps: '3/4"', gateMm: 152, ballMm: 152, globeMm: 178, checkMm: 178, butterflyMm: 33, plugMm: 152 },
    '1"': { nps: '1"', gateMm: 165, ballMm: 165, globeMm: 203, checkMm: 203, butterflyMm: 33, plugMm: 165 },
    '1-1/4"': { nps: '1-1/4"', gateMm: 178, ballMm: 178, globeMm: 216, checkMm: 216, butterflyMm: 33, plugMm: 178 },
    '1-1/2"': { nps: '1-1/2"', gateMm: 191, ballMm: 191, globeMm: 229, checkMm: 229, butterflyMm: 33, plugMm: 191 },
    '2"': { nps: '2"', gateMm: 216, ballMm: 216, globeMm: 267, checkMm: 267, butterflyMm: 43, plugMm: 216 },
    '2-1/2"': { nps: '2-1/2"', gateMm: 241, ballMm: 241, globeMm: 292, checkMm: 292, butterflyMm: 48, plugMm: 241 },
    '3"': { nps: '3"', gateMm: 283, ballMm: 283, globeMm: 318, checkMm: 318, butterflyMm: 48, plugMm: 283 },
    '3-1/2"': { nps: '3-1/2"', gateMm: 292, ballMm: 292, globeMm: 330, checkMm: 330, butterflyMm: 48, plugMm: 292 },
    '4"': { nps: '4"', gateMm: 305, ballMm: 305, globeMm: 356, checkMm: 356, butterflyMm: 54, plugMm: 305 },
    '5"': { nps: '5"', gateMm: 381, ballMm: 381, globeMm: 400, checkMm: 400, butterflyMm: 59, plugMm: 381 },
    '6"': { nps: '6"', gateMm: 403, ballMm: 403, globeMm: 445, checkMm: 445, butterflyMm: 59, plugMm: 403 },
    '8"': { nps: '8"', gateMm: 419, ballMm: 502, globeMm: 559, checkMm: 533, butterflyMm: 73, plugMm: 419 },
    '10"': { nps: '10"', gateMm: 457, ballMm: 568, globeMm: 622, checkMm: 622, butterflyMm: 83, plugMm: 457 },
    '12"': { nps: '12"', gateMm: 502, ballMm: 648, globeMm: 711, checkMm: 711, butterflyMm: 92, plugMm: 502 },
    '14"': { nps: '14"', gateMm: 762, ballMm: 762, globeMm: 838, checkMm: 838, butterflyMm: 117, plugMm: 762 },
    '16"': { nps: '16"', gateMm: 838, ballMm: 838, globeMm: 864, checkMm: 864, butterflyMm: 133, plugMm: 838 },
    '18"': { nps: '18"', gateMm: 914, ballMm: 914, globeMm: 978, checkMm: 978, butterflyMm: 149, plugMm: 914 },
    '20"': { nps: '20"', gateMm: 991, ballMm: 991, globeMm: 1016, checkMm: 1016, butterflyMm: 159, plugMm: 991 },
    '24"': { nps: '24"', gateMm: 1143, ballMm: 1143, globeMm: 1346, checkMm: 1346, butterflyMm: 181, plugMm: 1143 },
    '26"': { nps: '26"', gateMm: 1245, ballMm: 1245, globeMm: 1420, checkMm: 1420, butterflyMm: 195, plugMm: 1245 },
    '28"': { nps: '28"', gateMm: 1346, ballMm: 1346, globeMm: 1500, checkMm: 1500, butterflyMm: 210, plugMm: 1346 },
    '30"': { nps: '30"', gateMm: 1397, ballMm: 1397, globeMm: 1580, checkMm: 1580, butterflyMm: 230, plugMm: 1397 },
    '32"': { nps: '32"', gateMm: 1524, ballMm: 1524, globeMm: 1680, checkMm: 1680, butterflyMm: 240, plugMm: 1524 },
    '34"': { nps: '34"', gateMm: 1626, ballMm: 1626, globeMm: 1750, checkMm: 1750, butterflyMm: 250, plugMm: 1626 },
    '36"': { nps: '36"', gateMm: 1727, ballMm: 1727, globeMm: 1850, checkMm: 1850, butterflyMm: 260, plugMm: 1727 },
    '40"': { nps: '40"', gateMm: 1930, ballMm: 1930, globeMm: 2050, checkMm: 2050, butterflyMm: 280, plugMm: 1930 },
    '42"': { nps: '42"', gateMm: 2032, ballMm: 2032, globeMm: 2150, checkMm: 2150, butterflyMm: 300, plugMm: 2032 }
  },
  '600#': {
    '1/2"': { nps: '1/2"', gateMm: 165, ballMm: 165, globeMm: 165, checkMm: 165, butterflyMm: 43, plugMm: 165 },
    '3/4"': { nps: '3/4"', gateMm: 191, ballMm: 191, globeMm: 191, checkMm: 191, butterflyMm: 43, plugMm: 191 },
    '1"': { nps: '1"', gateMm: 216, ballMm: 216, globeMm: 216, checkMm: 216, butterflyMm: 43, plugMm: 216 },
    '1-1/4"': { nps: '1-1/4"', gateMm: 229, ballMm: 229, globeMm: 229, checkMm: 229, butterflyMm: 43, plugMm: 229 },
    '1-1/2"': { nps: '1-1/2"', gateMm: 241, ballMm: 241, globeMm: 241, checkMm: 241, butterflyMm: 43, plugMm: 241 },
    '2"': { nps: '2"', gateMm: 292, ballMm: 292, globeMm: 292, checkMm: 292, butterflyMm: 43, plugMm: 292 },
    '2-1/2"': { nps: '2-1/2"', gateMm: 330, ballMm: 330, globeMm: 330, checkMm: 330, butterflyMm: 48, plugMm: 330 },
    '3"': { nps: '3"', gateMm: 356, ballMm: 356, globeMm: 356, checkMm: 356, butterflyMm: 54, plugMm: 356 },
    '3-1/2"': { nps: '3-1/2"', gateMm: 381, ballMm: 381, globeMm: 381, checkMm: 381, butterflyMm: 54, plugMm: 381 },
    '4"': { nps: '4"', gateMm: 432, ballMm: 432, globeMm: 432, checkMm: 432, butterflyMm: 64, plugMm: 432 },
    '5"': { nps: '5"', gateMm: 508, ballMm: 508, globeMm: 508, checkMm: 508, butterflyMm: 70, plugMm: 508 },
    '6"': { nps: '6"', gateMm: 559, ballMm: 559, globeMm: 559, checkMm: 559, butterflyMm: 78, plugMm: 559 },
    '8"': { nps: '8"', gateMm: 660, ballMm: 660, globeMm: 660, checkMm: 660, butterflyMm: 89, plugMm: 660 },
    '10"': { nps: '10"', gateMm: 787, ballMm: 787, globeMm: 787, checkMm: 787, butterflyMm: 102, plugMm: 787 },
    '12"': { nps: '12"', gateMm: 838, ballMm: 838, globeMm: 838, checkMm: 838, butterflyMm: 114, plugMm: 838 },
    '14"': { nps: '14"', gateMm: 889, ballMm: 889, globeMm: 889, checkMm: 889, butterflyMm: 127, plugMm: 889 },
    '16"': { nps: '16"', gateMm: 991, ballMm: 991, globeMm: 991, checkMm: 991, butterflyMm: 140, plugMm: 991 },
    '18"': { nps: '18"', gateMm: 1092, ballMm: 1092, globeMm: 1092, checkMm: 1092, butterflyMm: 152, plugMm: 1092 },
    '20"': { nps: '20"', gateMm: 1194, ballMm: 1194, globeMm: 1194, checkMm: 1194, butterflyMm: 165, plugMm: 1194 },
    '24"': { nps: '24"', gateMm: 1397, ballMm: 1397, globeMm: 1397, checkMm: 1397, butterflyMm: 190, plugMm: 1397 },
    '26"': { nps: '26"', gateMm: 1448, ballMm: 1448, globeMm: 1448, checkMm: 1448, butterflyMm: 203, plugMm: 1448 },
    '28"': { nps: '28"', gateMm: 1549, ballMm: 1549, globeMm: 1549, checkMm: 1549, butterflyMm: 216, plugMm: 1549 },
    '30"': { nps: '30"', gateMm: 1651, ballMm: 1651, globeMm: 1651, checkMm: 1651, butterflyMm: 229, plugMm: 1651 },
    '32"': { nps: '32"', gateMm: 1753, ballMm: 1753, globeMm: 1753, checkMm: 1753, butterflyMm: 241, plugMm: 1753 },
    '34"': { nps: '34"', gateMm: 1854, ballMm: 1854, globeMm: 1854, checkMm: 1854, butterflyMm: 254, plugMm: 1854 },
    '36"': { nps: '36"', gateMm: 2083, ballMm: 2083, globeMm: 2083, checkMm: 2083, butterflyMm: 267, plugMm: 2083 },
    '40"': { nps: '40"', gateMm: 2250, ballMm: 2250, globeMm: 2250, checkMm: 2250, butterflyMm: 290, plugMm: 2250 },
    '42"': { nps: '42"', gateMm: 2350, ballMm: 2350, globeMm: 2350, checkMm: 2350, butterflyMm: 310, plugMm: 2350 }
  },
  '900#': {
    '1/2"': { nps: '1/2"', gateMm: 216, ballMm: 216, globeMm: 216, checkMm: 216, butterflyMm: 43, plugMm: 216 },
    '3/4"': { nps: '3/4"', gateMm: 229, ballMm: 229, globeMm: 229, checkMm: 229, butterflyMm: 43, plugMm: 229 },
    '1"': { nps: '1"', gateMm: 254, ballMm: 254, globeMm: 254, checkMm: 254, butterflyMm: 43, plugMm: 254 },
    '1-1/4"': { nps: '1-1/4"', gateMm: 279, ballMm: 279, globeMm: 279, checkMm: 279, butterflyMm: 43, plugMm: 279 },
    '1-1/2"': { nps: '1-1/2"', gateMm: 305, ballMm: 305, globeMm: 305, checkMm: 305, butterflyMm: 43, plugMm: 305 },
    '2"': { nps: '2"', gateMm: 368, ballMm: 368, globeMm: 368, checkMm: 368, butterflyMm: 43, plugMm: 368 },
    '2-1/2"': { nps: '2-1/2"', gateMm: 419, ballMm: 419, globeMm: 419, checkMm: 419, butterflyMm: 48, plugMm: 419 },
    '3"': { nps: '3"', gateMm: 381, ballMm: 381, globeMm: 381, checkMm: 381, butterflyMm: 54, plugMm: 381 },
    '4"': { nps: '4"', gateMm: 457, ballMm: 457, globeMm: 457, checkMm: 457, butterflyMm: 64, plugMm: 457 },
    '6"': { nps: '6"', gateMm: 610, ballMm: 610, globeMm: 610, checkMm: 610, butterflyMm: 78, plugMm: 610 },
    '8"': { nps: '8"', gateMm: 737, ballMm: 737, globeMm: 737, checkMm: 737, butterflyMm: 89, plugMm: 737 },
    '10"': { nps: '10"', gateMm: 838, ballMm: 838, globeMm: 838, checkMm: 838, butterflyMm: 102, plugMm: 838 },
    '12"': { nps: '12"', gateMm: 965, ballMm: 965, globeMm: 965, checkMm: 965, butterflyMm: 114, plugMm: 965 },
    '14"': { nps: '14"', gateMm: 1029, ballMm: 1029, globeMm: 1029, checkMm: 1029, butterflyMm: 127, plugMm: 1029 },
    '16"': { nps: '16"', gateMm: 1130, ballMm: 1130, globeMm: 1130, checkMm: 1130, butterflyMm: 140, plugMm: 1130 },
    '18"': { nps: '18"', gateMm: 1219, ballMm: 1219, globeMm: 1219, checkMm: 1219, butterflyMm: 152, plugMm: 1219 },
    '20"': { nps: '20"', gateMm: 1321, ballMm: 1321, globeMm: 1321, checkMm: 1321, butterflyMm: 165, plugMm: 1321 },
    '24"': { nps: '24"', gateMm: 1549, ballMm: 1549, globeMm: 1549, checkMm: 1549, butterflyMm: 190, plugMm: 1549 },
    '26"': { nps: '26"', gateMm: 1650, ballMm: 1650, globeMm: 1650, checkMm: 1650, butterflyMm: 203, plugMm: 1650 },
    '28"': { nps: '28"', gateMm: 1750, ballMm: 1750, globeMm: 1750, checkMm: 1750, butterflyMm: 216, plugMm: 1750 },
    '30"': { nps: '30"', gateMm: 1850, ballMm: 1850, globeMm: 1850, checkMm: 1850, butterflyMm: 229, plugMm: 1850 },
    '36"': { nps: '36"', gateMm: 2150, ballMm: 2150, globeMm: 2150, checkMm: 2150, butterflyMm: 267, plugMm: 2150 },
    '42"': { nps: '42"', gateMm: 2450, ballMm: 2450, globeMm: 2450, checkMm: 2450, butterflyMm: 310, plugMm: 2450 }
  },
  '1500#': {
    '1/2"': { nps: '1/2"', gateMm: 216, ballMm: 216, globeMm: 216, checkMm: 216, butterflyMm: 43, plugMm: 216 },
    '3/4"': { nps: '3/4"', gateMm: 229, ballMm: 229, globeMm: 229, checkMm: 229, butterflyMm: 43, plugMm: 229 },
    '1"': { nps: '1"', gateMm: 254, ballMm: 254, globeMm: 254, checkMm: 254, butterflyMm: 43, plugMm: 254 },
    '1-1/2"': { nps: '1-1/2"', gateMm: 305, ballMm: 305, globeMm: 305, checkMm: 305, butterflyMm: 43, plugMm: 305 },
    '2"': { nps: '2"', gateMm: 368, ballMm: 368, globeMm: 368, checkMm: 368, butterflyMm: 43, plugMm: 368 },
    '2-1/2"': { nps: '2-1/2"', gateMm: 419, ballMm: 419, globeMm: 419, checkMm: 419, butterflyMm: 48, plugMm: 419 },
    '3"': { nps: '3"', gateMm: 470, ballMm: 470, globeMm: 470, checkMm: 470, butterflyMm: 54, plugMm: 470 },
    '4"': { nps: '4"', gateMm: 546, ballMm: 546, globeMm: 546, checkMm: 546, butterflyMm: 64, plugMm: 546 },
    '6"': { nps: '6"', gateMm: 705, ballMm: 705, globeMm: 705, checkMm: 705, butterflyMm: 78, plugMm: 705 },
    '8"': { nps: '8"', gateMm: 832, ballMm: 832, globeMm: 832, checkMm: 832, butterflyMm: 89, plugMm: 832 },
    '10"': { nps: '10"', gateMm: 991, ballMm: 991, globeMm: 991, checkMm: 991, butterflyMm: 102, plugMm: 991 },
    '12"': { nps: '12"', gateMm: 1130, ballMm: 1130, globeMm: 1130, checkMm: 1130, butterflyMm: 114, plugMm: 1130 },
    '14"': { nps: '14"', gateMm: 1257, ballMm: 1257, globeMm: 1257, checkMm: 1257, butterflyMm: 127, plugMm: 1257 },
    '16"': { nps: '16"', gateMm: 1384, ballMm: 1384, globeMm: 1384, checkMm: 1384, butterflyMm: 140, plugMm: 1384 },
    '18"': { nps: '18"', gateMm: 1537, ballMm: 1537, globeMm: 1537, checkMm: 1537, butterflyMm: 152, plugMm: 1537 },
    '20"': { nps: '20"', gateMm: 1664, ballMm: 1664, globeMm: 1664, checkMm: 1664, butterflyMm: 165, plugMm: 1664 },
    '24"': { nps: '24"', gateMm: 1943, ballMm: 1943, globeMm: 1943, checkMm: 1943, butterflyMm: 190, plugMm: 1943 }
  },
  '2500#': {
    '1/2"': { nps: '1/2"', gateMm: 264, ballMm: 264, globeMm: 264, checkMm: 264, butterflyMm: 43, plugMm: 264 },
    '3/4"': { nps: '3/4"', gateMm: 273, ballMm: 273, globeMm: 273, checkMm: 273, butterflyMm: 43, plugMm: 273 },
    '1"': { nps: '1"', gateMm: 308, ballMm: 308, globeMm: 308, checkMm: 308, butterflyMm: 43, plugMm: 308 },
    '1-1/2"': { nps: '1-1/2"', gateMm: 387, ballMm: 387, globeMm: 387, checkMm: 387, butterflyMm: 43, plugMm: 387 },
    '2"': { nps: '2"', gateMm: 451, ballMm: 451, globeMm: 451, checkMm: 451, butterflyMm: 43, plugMm: 451 },
    '2-1/2"': { nps: '2-1/2"', gateMm: 508, ballMm: 508, globeMm: 508, checkMm: 508, butterflyMm: 48, plugMm: 508 },
    '3"': { nps: '3"', gateMm: 578, ballMm: 578, globeMm: 578, checkMm: 578, butterflyMm: 54, plugMm: 578 },
    '4"': { nps: '4"', gateMm: 673, ballMm: 673, globeMm: 673, checkMm: 673, butterflyMm: 64, plugMm: 673 },
    '6"': { nps: '6"', gateMm: 914, ballMm: 914, globeMm: 914, checkMm: 914, butterflyMm: 78, plugMm: 914 },
    '8"': { nps: '8"', gateMm: 1022, ballMm: 1022, globeMm: 1022, checkMm: 1022, butterflyMm: 89, plugMm: 1022 },
    '10"': { nps: '10"', gateMm: 1270, ballMm: 1270, globeMm: 1270, checkMm: 1270, butterflyMm: 102, plugMm: 1270 },
    '12"': { nps: '12"', gateMm: 1422, ballMm: 1422, globeMm: 1422, checkMm: 1422, butterflyMm: 114, plugMm: 1422 }
  }
};

// Helper for Star Pattern Cross Torquing (ASME PCC-1)
function getStarPatternSequence(holesCount: number): number[] {
  switch (holesCount) {
    case 4:
      return [1, 3, 2, 4];
    case 8:
      return [1, 5, 3, 7, 2, 6, 4, 8];
    case 12:
      return [1, 7, 4, 10, 2, 8, 5, 11, 3, 9, 6, 12];
    case 16:
      return [1, 9, 5, 13, 3, 11, 7, 15, 2, 10, 6, 14, 4, 12, 8, 16];
    case 20:
      return [1, 11, 6, 16, 3, 13, 8, 18, 2, 12, 7, 17, 4, 14, 9, 19, 5, 15, 10, 20];
    case 24:
      return [1, 13, 7, 19, 4, 16, 10, 22, 2, 14, 8, 20, 5, 17, 11, 23, 3, 15, 9, 21, 6, 18, 12, 24];
    case 28:
      return [1, 15, 8, 22, 4, 18, 11, 25, 2, 16, 9, 23, 5, 19, 12, 26, 3, 17, 10, 24, 6, 20, 13, 27, 7, 21, 14, 28];
    case 32:
      return [1, 17, 9, 25, 5, 21, 13, 29, 3, 19, 11, 27, 7, 23, 15, 31, 2, 18, 10, 26, 6, 22, 14, 30, 4, 20, 12, 28, 8, 24, 16, 32];
    case 36:
      return [1, 19, 10, 28, 5, 23, 14, 32, 2, 20, 11, 29, 6, 24, 15, 33, 3, 21, 12, 30, 7, 25, 16, 34, 4, 22, 13, 31, 8, 26, 17, 35, 9, 27, 18, 36];
    case 40:
      return [1, 21, 11, 31, 6, 26, 16, 36, 2, 22, 12, 32, 7, 27, 17, 37, 3, 23, 13, 33, 8, 28, 18, 38, 4, 24, 14, 34, 9, 29, 19, 39, 5, 25, 15, 35, 10, 30, 20, 40];
    case 44:
      return [1, 23, 12, 34, 6, 28, 17, 39, 2, 24, 13, 35, 7, 29, 18, 40, 3, 25, 14, 36, 8, 30, 19, 41, 4, 26, 15, 37, 9, 31, 20, 42, 5, 27, 16, 38, 10, 32, 21, 43, 11, 33, 22, 44];
    case 48:
      return [1, 25, 13, 37, 7, 31, 19, 43, 2, 26, 14, 38, 8, 32, 20, 44, 3, 27, 15, 39, 9, 33, 21, 45, 4, 28, 16, 40, 10, 34, 22, 46, 5, 29, 17, 41, 11, 35, 23, 47, 6, 30, 18, 42, 12, 36, 24, 48];
    case 52:
    case 56:
    case 60:
    default: {
      const seq: number[] = [];
      const half = Math.floor(holesCount / 2);
      for (let i = 1; i <= half; i++) {
        seq.push(i);
        seq.push(i + half);
      }
      return seq;
    }
  }
}

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

// 4. LINE CLASS SPECIFICATION DECODER (PDVSA / ASME B31.3 / NACE)
export interface LineClassInfo {
  code: string;
  ratingClass: string;
  material: string;
  service: string;
  nace: boolean;
  corrosionAllowanceMm: number;
  corrosionAllowanceInches: string;
  maxPressPsi: number;
  standardRef: string;
}

export const LINE_CLASS_PRESETS: Record<string, LineClassInfo> = {
  'A1A': {
    code: 'A1A',
    ratingClass: '150#',
    material: 'Acero al Carbono (ASTM A106 Gr. B / A53 Gr. B / API 5L Gr. B)',
    service: 'Servicio General / Hidrocarburos No Corrosivos (Sweet Service)',
    nace: false,
    corrosionAllowanceMm: 1.5,
    corrosionAllowanceInches: '1/16" (1.5 mm)',
    maxPressPsi: 285,
    standardRef: 'PDVSA / ASME B16.5 / ASME B31.3'
  },
  'A1B': {
    code: 'A1B',
    ratingClass: '150#',
    material: 'Acero al Carbono (ASTM A106 Gr. B / NACE Tested)',
    service: 'Servicio Amargo (Sour Service / H2S / CO2)',
    nace: true,
    corrosionAllowanceMm: 3.0,
    corrosionAllowanceInches: '1/8" (3.0 mm)',
    maxPressPsi: 285,
    standardRef: 'PDVSA / NACE MR0175 / ISO 15156 / ASME B31.3'
  },
  'B1A': {
    code: 'B1A',
    ratingClass: '300#',
    material: 'Acero al Carbono (ASTM A106 Gr. B / API 5L X52)',
    service: 'Servicio General / Presión Intermedia',
    nace: false,
    corrosionAllowanceMm: 1.5,
    corrosionAllowanceInches: '1/16" (1.5 mm)',
    maxPressPsi: 740,
    standardRef: 'PDVSA / ASME B16.5 / ASME B31.3'
  },
  'B1B': {
    code: 'B1B',
    ratingClass: '300#',
    material: 'Acero al Carbono (ASTM A106 Gr. B / API 5L X52 NACE)',
    service: 'Servicio Amargo (Sour Service / H2S / CO2)',
    nace: true,
    corrosionAllowanceMm: 3.0,
    corrosionAllowanceInches: '1/8" (3.0 mm)',
    maxPressPsi: 740,
    standardRef: 'PDVSA / NACE MR0175 / ISO 15156 / ASME B31.3'
  },
  'D1A': {
    code: 'D1A',
    ratingClass: '600#',
    material: 'Acero al Carbono High Yield (API 5L X52 / X60 / A106 Gr. B)',
    service: 'Servicio General / Alta Presión',
    nace: false,
    corrosionAllowanceMm: 1.5,
    corrosionAllowanceInches: '1/16" (1.5 mm)',
    maxPressPsi: 1480,
    standardRef: 'PDVSA / ASME B16.5 / ASME B31.3'
  },
  'F1A': {
    code: 'F1A',
    ratingClass: '1500#',
    material: 'Acero al Carbono Forjado / API 5L X65 / A106 Gr. C',
    service: 'Servicio General / Muy Alta Presión (Cabezales / Inyección)',
    nace: false,
    corrosionAllowanceMm: 1.5,
    corrosionAllowanceInches: '1/16" (1.5 mm)',
    maxPressPsi: 3705,
    standardRef: 'PDVSA / ASME B16.5 / ASME B31.3'
  }
};

export function decodeLineCode(rawCode: string): LineClassInfo {
  const clean = rawCode.trim().toUpperCase();
  if (LINE_CLASS_PRESETS[clean]) {
    return LINE_CLASS_PRESETS[clean];
  }

  const ratingChar = clean.charAt(0);
  const matChar = clean.charAt(1);
  const servChar = clean.charAt(2);

  let ratingClass = '150#';
  let maxPressPsi = 285;
  switch (ratingChar) {
    case 'A': ratingClass = '150#'; maxPressPsi = 285; break;
    case 'B': ratingClass = '300#'; maxPressPsi = 740; break;
    case 'C': ratingClass = '400#'; maxPressPsi = 990; break;
    case 'D': ratingClass = '600#'; maxPressPsi = 1480; break;
    case 'E': ratingClass = '900#'; maxPressPsi = 2220; break;
    case 'F': ratingClass = '1500#'; maxPressPsi = 3705; break;
    case 'H': ratingClass = '2500#'; maxPressPsi = 6170; break;
    default: ratingClass = '150#'; maxPressPsi = 285; break;
  }

  let material = 'Acero al Carbono (ASTM A106 Gr. B / API 5L)';
  switch (matChar) {
    case '1': material = 'Acero al Carbono (ASTM A106 Gr. B / A53 / API 5L)'; break;
    case '2': material = 'Acero de Baja Aleación Cr-Mo (ASTM A335 P11/P22)'; break;
    case '3': material = 'Acero Inoxidable Austenítico (ASTM A312 TP304/304L)'; break;
    case '4': material = 'Acero Inoxidable Austenítico (ASTM A312 TP316/316L)'; break;
    case '5': material = 'Acero Dúplex / Super Dúplex (UNS S31803 / S32750)'; break;
    case '6': material = 'Aleación de Níquel / Inconel 625'; break;
    default: material = 'Acero al Carbono (Especial)'; break;
  }

  let service = 'Servicio General';
  let nace = false;
  let corrosionAllowanceMm = 1.5;
  let corrosionAllowanceInches = '1/16" (1.5 mm)';

  switch (servChar) {
    case 'A':
      service = 'Servicio General / Hidrocarburos Dulces';
      nace = false;
      corrosionAllowanceMm = 1.5;
      corrosionAllowanceInches = '1/16" (1.5 mm)';
      break;
    case 'B':
      service = 'Servicio Amargo (Sour Service / H2S / CO2)';
      nace = true;
      corrosionAllowanceMm = 3.0;
      corrosionAllowanceInches = '1/8" (3.0 mm)';
      break;
    case 'C':
      service = 'Servicio Ácido / Corrosivo Severo';
      nace = true;
      corrosionAllowanceMm = 4.5;
      corrosionAllowanceInches = '3/16" (4.5 mm)';
      break;
    case 'D':
      service = 'Servicio Criogénico / Baja Temperatura (ASTM A333 Gr. 6)';
      nace = false;
      corrosionAllowanceMm = 1.5;
      corrosionAllowanceInches = '1/16" (1.5 mm)';
      break;
    default:
      service = 'Servicio Específico de Proceso';
      corrosionAllowanceMm = 1.5;
      break;
  }

  return {
    code: clean || 'A1A',
    ratingClass,
    material,
    service,
    nace,
    corrosionAllowanceMm,
    corrosionAllowanceInches,
    maxPressPsi,
    standardRef: nace ? 'PDVSA / NACE MR0175 / ASME B31.3' : 'PDVSA / ASME B16.5 / B31.3'
  };
}

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
  const [valveClassSelect, setValveClassSelect] = useState<string>('150#');
  const [activeTorquePass, setActiveTorquePass] = useState<number>(1);
  const [assemblyType, setAssemblyType] = useState<'flange_flange' | 'flange_gate_valve' | 'flange_butterfly'>('flange_flange');

  // Line Class Decoder State
  const [customLineCode, setCustomLineCode] = useState<string>('A1A');
  const [syncAppliedMsg, setSyncAppliedMsg] = useState<string>('A1A -> Clase 150# | Ca: 1.5mm');

  // Active decoded Line Class object
  const currentDecodedLineClass = decodeLineCode(customLineCode);

  // Apply Line Class decoded properties to Barlow calculator & Flange/Valve search
  const applyLineClassToCalculators = (code: string) => {
    const clean = code.trim().toUpperCase() || 'A1A';
    setCustomLineCode(clean);
    const decoded = decodeLineCode(clean);

    // Auto-fill ANSI Class for Flange and Valve lookup if present in dataset
    const availableFlangeClasses = Object.keys(FLANGE_DATA);
    if (availableFlangeClasses.includes(decoded.ratingClass)) {
      setFlangeClassSelect(decoded.ratingClass);
      setValveClassSelect(decoded.ratingClass);
      const availableNps = Object.keys(FLANGE_DATA[decoded.ratingClass] || {});
      if (!availableNps.includes(flangeNpsSelect)) {
        setFlangeNpsSelect(availableNps[0] || '4"');
      }
    }

    // Auto-fill Corrosion Allowance in Barlow Calculator
    setCorrosionAllowanceMm(decoded.corrosionAllowanceMm);

    // Auto-fill reference pressure in Barlow calculator
    setPipePressPsi(decoded.maxPressPsi);

    setSyncAppliedMsg(`${decoded.code} -> Clase ${decoded.ratingClass} | Ca: ${decoded.corrosionAllowanceMm}mm | Presión Ref: ${decoded.maxPressPsi} psi`);
  };

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

  // Selected Valve spec according to flange class or valve class selector
  const activeValveClassKey = valveClassSelect in VALVE_FACE_DATA_BY_CLASS ? valveClassSelect : (flangeClassSelect in VALVE_FACE_DATA_BY_CLASS ? flangeClassSelect : '150#');
  const currentValveClassData = VALVE_FACE_DATA_BY_CLASS[activeValveClassKey] || VALVE_FACE_DATA_BY_CLASS['150#'];
  const currentValveSpecForNps = currentValveClassData[flangeNpsSelect] || currentValveClassData['4"'] || Object.values(currentValveClassData)[0];

  // Star Pattern Cross Sequence for selected flange hole count
  const starSequence = getStarPatternSequence(currentFlangeSpec.holesCount);

  // Stud length estimation
  let studLengthInches = 3.5;
  if (assemblyType === 'flange_flange') {
    studLengthInches = Math.ceil((currentFlangeSpec.thicknessMm * 2) / 25.4 + 1.5);
  } else if (assemblyType === 'flange_gate_valve') {
    studLengthInches = Math.ceil((currentFlangeSpec.thicknessMm * 2 + (currentValveSpecForNps?.gateMm || 229)) / 25.4 + 1.5);
  } else {
    studLengthInches = Math.ceil((currentFlangeSpec.thicknessMm * 2 + (currentValveSpecForNps?.butterflyMm || 52)) / 25.4 + 1.5);
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
          {/* DECODIFICADOR DE ESPECIFICACIONES DE LÍNEA (PIPE / LINE CLASS DECODER) - PDVSA / ASME */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <FileText size={20} className="text-[#0B2239]" />
                  Decodificador de Especificaciones de Línea (Pipe / Line Class Decoder)
                </h2>
                <p className="text-xs text-gray-500">
                  Estándar PDVSA / ASME B31.3 / NACE MR0175. Traduce la nomenclatura de tuberías y auto-rellena herramientas de ingeniería.
                </p>
              </div>
              {syncAppliedMsg && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold">
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                  <span>Sincronizado: {syncAppliedMsg}</span>
                </div>
              )}
            </div>

            {/* Selection and Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              {/* Preset Buttons */}
              <div className="md:col-span-8 space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 uppercase">
                  Códigos Estándar Frecuentes (PDVSA / ASME):
                </label>
                <div className="flex flex-wrap gap-2">
                  {['A1A', 'A1B', 'B1A', 'B1B', 'D1A', 'F1A'].map((code) => {
                    const isSelected = (customLineCode.toUpperCase() === code);
                    return (
                      <button
                        key={code}
                        type="button"
                        onClick={() => applyLineClassToCalculators(code)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
                          isSelected
                            ? 'bg-[#0B2239] text-white shadow-md ring-2 ring-emerald-500'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                        }`}
                      >
                        {code}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Code Input */}
              <div className="md:col-span-4 space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 uppercase">
                  Escribir Código Personalizado:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customLineCode}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setCustomLineCode(val);
                      if (val.length >= 3) {
                        applyLineClassToCalculators(val);
                      }
                    }}
                    placeholder="Ej: A1A, B1B, D1A"
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-mono font-bold text-sm outline-none focus:ring-2 focus:ring-[#0B2239]"
                  />
                  <button
                    type="button"
                    onClick={() => applyLineClassToCalculators(customLineCode)}
                    className="px-4 py-2 bg-[#F4C400] text-[#131A22] font-black rounded-xl text-xs hover:bg-[#D9AC00] transition-colors shadow-sm"
                  >
                    Decodificar
                  </button>
                </div>
              </div>
            </div>

            {/* Translation Output Grid */}
            <div className="p-5 bg-slate-900 text-white rounded-2xl space-y-4 font-mono text-xs border border-slate-800">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-xs uppercase font-bold text-emerald-400">
                  Traducción Automática de Especificación: <span className="text-amber-300 text-sm">{currentDecodedLineClass.code}</span>
                </span>
                <span className="text-[11px] text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700">
                  {currentDecodedLineClass.standardRef}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                  <span className="text-slate-400 block text-[11px] mb-1 font-sans font-bold uppercase">Clase ANSI / Presión</span>
                  <span className="text-base font-black text-amber-400">{currentDecodedLineClass.ratingClass}</span>
                  <span className="block text-[10px] text-slate-400 mt-0.5">Rating ~ {currentDecodedLineClass.maxPressPsi} psi</span>
                </div>

                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                  <span className="text-slate-400 block text-[11px] mb-1 font-sans font-bold uppercase">Material de Tubería</span>
                  <span className="text-xs font-bold text-white block leading-tight">{currentDecodedLineClass.material}</span>
                </div>

                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                  <span className="text-slate-400 block text-[11px] mb-1 font-sans font-bold uppercase">Servicio de Proceso</span>
                  <span className="text-xs font-bold text-white block leading-tight">{currentDecodedLineClass.service}</span>
                  {currentDecodedLineClass.nace && (
                    <span className="inline-block mt-1 px-1.5 py-0.5 bg-rose-900/80 text-rose-200 text-[9px] font-sans font-bold rounded">
                      NACE MR0175 Req.
                    </span>
                  )}
                </div>

                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                  <span className="text-slate-400 block text-[11px] mb-1 font-sans font-bold uppercase">Margen de Corrosión (Ca)</span>
                  <span className="text-base font-black text-emerald-400">{currentDecodedLineClass.corrosionAllowanceMm} mm</span>
                  <span className="block text-[10px] text-slate-400 mt-0.5">Equivalente: {currentDecodedLineClass.corrosionAllowanceInches}</span>
                </div>
              </div>

              <div className="p-3 bg-[#0B2239] border border-blue-800/50 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs font-sans">
                <div className="flex items-center gap-2">
                  <Zap size={15} className="text-[#F4C400]" />
                  <span className="text-slate-200">
                    Sincronización Automática Activa: Los valores de <strong>Clase ANSI ({currentDecodedLineClass.ratingClass})</strong> y <strong>Margen de Corrosión ({currentDecodedLineClass.corrosionAllowanceMm} mm)</strong> se transfieren automáticamente a la Calculadora Barlow y Buscador de Bridas/Válvulas.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => applyLineClassToCalculators(currentDecodedLineClass.code)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-colors shrink-0"
                >
                  Re-Aplicar Parámetros
                </button>
              </div>
            </div>
          </div>

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
                      setValveClassSelect(e.target.value);
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

          {/* Star Pattern Torquing Sequence (ASME PCC-1) */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 space-y-6 border border-slate-800 shadow-xl">
            <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider mb-1">
                  <Wrench size={16} /> Guía de Apriete en Estrella (ASME PCC-1 / Star Pattern)
                </div>
                <h3 className="text-lg font-black tracking-tight text-white">
                  Secuencia de Cruzado y Pases Progresivos de Torque
                </h3>
                <p className="text-xs text-slate-400">
                  Brida {currentFlangeSpec.nps} Clase {flangeClassSelect} — {currentFlangeSpec.holesCount} Pernos ({currentFlangeSpec.boltDiamInches}) — Dado: {currentFlangeSpec.socketInches}
                </p>
              </div>

              <div className="bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 text-right font-mono">
                <span className="text-[10px] text-slate-400 block uppercase">Torque Objetivo (100%)</span>
                <span className="text-lg font-black text-emerald-400">{currentFlangeSpec.torqueFtLb} ft-lb</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left: Star Pattern Sequence & SVG Graphic */}
              <div className="lg:col-span-6 space-y-4">
                <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-3 font-mono text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-amber-400 font-bold uppercase">Patrón Numérico en Estrella ({currentFlangeSpec.holesCount} Agujeros)</span>
                    <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold">Paso Cruzado</span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-lg text-emerald-400 font-black text-sm tracking-wider text-center border border-slate-800 break-words">
                    {starSequence.join('  ➔  ')}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Aplica el apriete siguiendo estrictamente el orden numérico opuesto en estrella para asegurar asentamiento uniforme de la empacadura.
                  </p>
                </div>

                {/* SVG Flange Diagram */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col items-center justify-center relative">
                  <span className="text-[10px] text-slate-400 font-mono uppercase mb-2">Esquema Gráfico de Disposición de Agujeros</span>
                  <svg viewBox="0 0 200 200" className="w-48 h-48">
                    <circle cx="100" cy="100" r="90" fill="none" stroke="#334155" strokeWidth="6" />
                    <circle cx="100" cy="100" r="70" fill="none" stroke="#475569" strokeDasharray="3 3" strokeWidth="1.5" />
                    <circle cx="100" cy="100" r="38" fill="#0f172a" stroke="#1e293b" strokeWidth="4" />
                    <text x="100" y="104" textAnchor="middle" fill="#64748b" fontSize="10" fontFamily="monospace" fontWeight="bold">{currentFlangeSpec.nps}</text>

                    {Array.from({ length: currentFlangeSpec.holesCount }).map((_, idx) => {
                      const boltNum = idx + 1;
                      const angleDeg = (360 / currentFlangeSpec.holesCount) * idx - 90;
                      const angleRad = (angleDeg * Math.PI) / 180;
                      const cx = 100 + 70 * Math.cos(angleRad);
                      const cy = 100 + 70 * Math.sin(angleRad);

                      return (
                        <g key={boltNum} className="transition-all duration-300">
                          <circle
                            cx={cx}
                            cy={cy}
                            r="11"
                            fill="#1e293b"
                            stroke="#10b981"
                            strokeWidth="2"
                          />
                          <text
                            x={cx}
                            y={cy + 3.5}
                            textAnchor="middle"
                            fill="#f8fafc"
                            fontSize="9"
                            fontWeight="bold"
                            fontFamily="monospace"
                          >
                            {boltNum}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                  <span className="text-[10px] text-slate-500 font-mono mt-2">Pernos enumerados de 1 a {currentFlangeSpec.holesCount} en sentido horario</span>
                </div>
              </div>

              {/* Right: Progressive Torque Passes Guide */}
              <div className="lg:col-span-6 space-y-3 font-mono text-xs">
                <span className="text-slate-400 font-bold uppercase block">Guía de Pases Progresivos de Torque (ASME PCC-1)</span>

                <div className="grid grid-cols-1 gap-2.5">
                  <div 
                    onClick={() => setActiveTorquePass(1)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      activeTorquePass === 1 
                        ? 'bg-emerald-950/80 border-emerald-500 ring-1 ring-emerald-500' 
                        : 'bg-slate-800 border-slate-700 hover:bg-slate-750'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-emerald-400">Pase 1: 30% del Torque Objetivo</span>
                      <span className="text-base font-black text-white">{Math.round(currentFlangeSpec.torqueFtLb * 0.3)} ft-lb</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Apriete inicial suave en cruzado siguiendo el patrón numérico para asentar alineadas las caras.
                    </p>
                  </div>

                  <div 
                    onClick={() => setActiveTorquePass(2)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      activeTorquePass === 2 
                        ? 'bg-emerald-950/80 border-emerald-500 ring-1 ring-emerald-500' 
                        : 'bg-slate-800 border-slate-700 hover:bg-slate-750'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-amber-400">Pase 2: 60% del Torque Objetivo</span>
                      <span className="text-base font-black text-white">{Math.round(currentFlangeSpec.torqueFtLb * 0.6)} ft-lb</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Segundo apriete en cruzado para comprimir progresivamente la empacadura.
                    </p>
                  </div>

                  <div 
                    onClick={() => setActiveTorquePass(3)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      activeTorquePass === 3 
                        ? 'bg-emerald-950/80 border-emerald-500 ring-1 ring-emerald-500' 
                        : 'bg-slate-800 border-slate-700 hover:bg-slate-750'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-blue-400">Pase 3: 100% del Torque Objetivo</span>
                      <span className="text-base font-black text-white">{currentFlangeSpec.torqueFtLb} ft-lb</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Apriete al valor nominal total de torque en cruzado según especificación.
                    </p>
                  </div>

                  <div 
                    onClick={() => setActiveTorquePass(4)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      activeTorquePass === 4 
                        ? 'bg-emerald-950/80 border-emerald-500 ring-1 ring-emerald-500' 
                        : 'bg-slate-800 border-slate-700 hover:bg-slate-750'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-purple-400">Pase 4: 100% Circular Continuous (Asentamiento)</span>
                      <span className="text-base font-black text-white">{currentFlangeSpec.torqueFtLb} ft-lb</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Apriete en sentido horario perno por perno a 100% de torque para verificación final de asentamiento circular.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Table for Face-to-Face Valve Dimensions B16.10 */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <Flame size={18} className="text-emerald-600" /> Catálogo de Distancias Cara a Cara de Válvulas (ASME B16.10)
                </h3>
                <p className="text-xs text-gray-500">
                  Longitudes normalizadas en milímetros según la Clase de Presión ANSI seleccionada
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-gray-700 uppercase whitespace-nowrap">Clase Válvula:</label>
                <select 
                  value={valveClassSelect}
                  onChange={(e) => setValveClassSelect(e.target.value)}
                  className="px-3 py-1.5 bg-slate-900 text-emerald-400 border border-slate-700 rounded-xl font-mono text-xs font-bold outline-none"
                >
                  {Object.keys(VALVE_FACE_DATA_BY_CLASS).map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>
            </div>

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
                  {Object.values(currentValveClassData).map(v => (
                    <tr key={v.nps} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">{v.nps}</td>
                      <td className="p-3 text-slate-700">{v.gateMm} mm</td>
                      <td className="p-3 text-slate-700">{v.ballMm} mm</td>
                      <td className="p-3 text-slate-700">{v.globeMm} mm</td>
                      <td className="p-3 text-slate-700">{v.checkMm} mm</td>
                      <td className="p-3 text-emerald-700 font-bold">{v.butterflyMm} mm</td>
                      <td className="p-3 text-slate-700">{v.plugMm} mm</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 2: INSTRUMENTATION & CONTROL (I&C)      */}
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
      {/* TAB 3: PROCESS & STORAGE TANKS (API 650)   */}
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
      {/* TAB 4: COATINGS, NACE & MATERIALS           */}
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
      {/* TAB 5: ELECTRICAL POWER & VOLTAGE DROP      */}
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
      {/* TAB 6: CIVIL & EARTHMOVING & REBARS        */}
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
      {/* TAB 7: SIHO-A FLARE RADIATION & NOISE     */}
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
      {/* TAB 8: UNIVERSAL QUICK CONVERTER            */}
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
