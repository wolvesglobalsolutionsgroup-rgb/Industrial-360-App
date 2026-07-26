// src/lib/data/mechanical/pipeSchedules.ts
// Tabla de Cédulas y Espesores de Tuberías Industriales
// Normas ASME B36.10M (Acero al Carbono / Aleados) y ASME B36.19M (Acero Inoxidable)

export interface PipeScheduleSpec {
  nps: string;          // NPS e.g. 2"
  dnMm: number;         // DN e.g. 50
  odMm: number;         // Diámetro exterior real (mm)
  schedule: string;     // Cédula: '5S', '10S', '10', '20', '30', '40S', '40/STD', '60', '80S', '80/XS', '100', '120', '140', '160', 'XXS'
  wallMm: number;       // Espesor de pared (mm)
  idMm: number;         // Diámetro interior (mm)
  weightKgM: number;    // Peso lineal por metro (kg/m)
  volumeLitersM: number;// Capacidad volumétrica interna por metro (L/m)
}

export const PIPE_SCHEDULE_CATALOG: Record<string, Record<string, PipeScheduleSpec>> = {
  '1/2"': {
    '10S':     { nps: '1/2"', dnMm: 15, odMm: 21.3, schedule: '10S', wallMm: 1.65, idMm: 18.0, weightKgM: 0.81, volumeLitersM: 0.25 },
    '40/STD':  { nps: '1/2"', dnMm: 15, odMm: 21.3, schedule: '40/STD', wallMm: 2.77, idMm: 15.8, weightKgM: 1.27, volumeLitersM: 0.20 },
    '80/XS':   { nps: '1/2"', dnMm: 15, odMm: 21.3, schedule: '80/XS', wallMm: 3.73, idMm: 13.8, weightKgM: 1.62, volumeLitersM: 0.15 },
    '160':     { nps: '1/2"', dnMm: 15, odMm: 21.3, schedule: '160', wallMm: 4.78, idMm: 11.7, weightKgM: 1.95, volumeLitersM: 0.11 },
    'XXS':     { nps: '1/2"', dnMm: 15, odMm: 21.3, schedule: 'XXS', wallMm: 7.47, idMm: 6.4, weightKgM: 2.55, volumeLitersM: 0.03 }
  },
  '3/4"': {
    '10S':     { nps: '3/4"', dnMm: 20, odMm: 26.7, schedule: '10S', wallMm: 1.65, idMm: 23.4, weightKgM: 1.02, volumeLitersM: 0.43 },
    '40/STD':  { nps: '3/4"', dnMm: 20, odMm: 26.7, schedule: '40/STD', wallMm: 2.87, idMm: 20.9, weightKgM: 1.69, volumeLitersM: 0.34 },
    '80/XS':   { nps: '3/4"', dnMm: 20, odMm: 26.7, schedule: '80/XS', wallMm: 3.91, idMm: 18.9, weightKgM: 2.20, volumeLitersM: 0.28 },
    '160':     { nps: '3/4"', dnMm: 20, odMm: 26.7, schedule: '160', wallMm: 5.56, idMm: 15.6, weightKgM: 2.90, volumeLitersM: 0.19 },
    'XXS':     { nps: '3/4"', dnMm: 20, odMm: 26.7, schedule: 'XXS', wallMm: 7.82, idMm: 11.1, weightKgM: 3.64, volumeLitersM: 0.10 }
  },
  '1"': {
    '10S':     { nps: '1"', dnMm: 25, odMm: 33.4, schedule: '10S', wallMm: 1.65, idMm: 30.1, weightKgM: 1.29, volumeLitersM: 0.71 },
    '40/STD':  { nps: '1"', dnMm: 25, odMm: 33.4, schedule: '40/STD', wallMm: 3.38, idMm: 26.6, weightKgM: 2.50, volumeLitersM: 0.56 },
    '80/XS':   { nps: '1"', dnMm: 25, odMm: 33.4, schedule: '80/XS', wallMm: 4.55, idMm: 24.3, weightKgM: 3.24, volumeLitersM: 0.46 },
    '160':     { nps: '1"', dnMm: 25, odMm: 33.4, schedule: '160', wallMm: 6.35, idMm: 20.7, weightKgM: 4.24, volumeLitersM: 0.34 },
    'XXS':     { nps: '1"', dnMm: 25, odMm: 33.4, schedule: 'XXS', wallMm: 9.09, idMm: 15.2, weightKgM: 5.45, volumeLitersM: 0.18 }
  },
  '1-1/2"': {
    '10S':     { nps: '1-1/2"', dnMm: 40, odMm: 48.3, schedule: '10S', wallMm: 1.65, idMm: 45.0, weightKgM: 1.90, volumeLitersM: 1.59 },
    '40/STD':  { nps: '1-1/2"', dnMm: 40, odMm: 48.3, schedule: '40/STD', wallMm: 3.68, idMm: 40.9, weightKgM: 4.05, volumeLitersM: 1.31 },
    '80/XS':   { nps: '1-1/2"', dnMm: 40, odMm: 48.3, schedule: '80/XS', wallMm: 5.08, idMm: 38.1, weightKgM: 5.41, volumeLitersM: 1.14 },
    '160':     { nps: '1-1/2"', dnMm: 40, odMm: 48.3, schedule: '160', wallMm: 7.14, idMm: 34.0, weightKgM: 7.25, volumeLitersM: 0.91 },
    'XXS':     { nps: '1-1/2"', dnMm: 40, odMm: 48.3, schedule: 'XXS', wallMm: 10.15, idMm: 28.0, weightKgM: 9.56, volumeLitersM: 0.62 }
  },
  '2"': {
    '10S':     { nps: '2"', dnMm: 50, odMm: 60.3, schedule: '10S', wallMm: 1.65, idMm: 57.0, weightKgM: 2.39, volumeLitersM: 2.55 },
    '40/STD':  { nps: '2"', dnMm: 50, odMm: 60.3, schedule: '40/STD', wallMm: 3.91, idMm: 52.5, weightKgM: 5.44, volumeLitersM: 2.16 },
    '80/XS':   { nps: '2"', dnMm: 50, odMm: 60.3, schedule: '80/XS', wallMm: 5.54, idMm: 49.2, weightKgM: 7.48, volumeLitersM: 1.90 },
    '160':     { nps: '2"', dnMm: 50, odMm: 60.3, schedule: '160', wallMm: 8.74, idMm: 42.8, weightKgM: 11.11, volumeLitersM: 1.44 },
    'XXS':     { nps: '2"', dnMm: 50, odMm: 60.3, schedule: 'XXS', wallMm: 11.07, idMm: 38.2, weightKgM: 13.44, volumeLitersM: 1.15 }
  },
  '3"': {
    '10S':     { nps: '3"', dnMm: 80, odMm: 88.9, schedule: '10S', wallMm: 2.11, idMm: 84.7, weightKgM: 4.58, volumeLitersM: 5.63 },
    '40/STD':  { nps: '3"', dnMm: 80, odMm: 88.9, schedule: '40/STD', wallMm: 5.49, idMm: 77.9, weightKgM: 11.29, volumeLitersM: 4.77 },
    '80/XS':   { nps: '3"', dnMm: 80, odMm: 88.9, schedule: '80/XS', wallMm: 7.62, idMm: 73.7, weightKgM: 15.27, volumeLitersM: 4.27 },
    '160':     { nps: '3"', dnMm: 80, odMm: 88.9, schedule: '160', wallMm: 11.13, idMm: 66.6, weightKgM: 21.35, volumeLitersM: 3.48 },
    'XXS':     { nps: '3"', dnMm: 80, odMm: 88.9, schedule: 'XXS', wallMm: 15.24, idMm: 58.4, weightKgM: 27.68, volumeLitersM: 2.68 }
  },
  '4"': {
    '10S':     { nps: '4"', dnMm: 100, odMm: 114.3, schedule: '10S', wallMm: 2.11, idMm: 110.1, weightKgM: 5.93, volumeLitersM: 9.52 },
    '40/STD':  { nps: '4"', dnMm: 100, odMm: 114.3, schedule: '40/STD', wallMm: 6.02, idMm: 102.3, weightKgM: 16.07, volumeLitersM: 8.22 },
    '80/XS':   { nps: '4"', dnMm: 100, odMm: 114.3, schedule: '80/XS', wallMm: 8.56, idMm: 97.2, weightKgM: 22.32, volumeLitersM: 7.42 },
    '120':     { nps: '4"', dnMm: 100, odMm: 114.3, schedule: '120', wallMm: 11.13, idMm: 92.0, weightKgM: 28.32, volumeLitersM: 6.65 },
    '160':     { nps: '4"', dnMm: 100, odMm: 114.3, schedule: '160', wallMm: 13.49, idMm: 87.3, weightKgM: 33.54, volumeLitersM: 5.99 },
    'XXS':     { nps: '4"', dnMm: 100, odMm: 114.3, schedule: 'XXS', wallMm: 17.12, idMm: 80.1, weightKgM: 41.03, volumeLitersM: 5.04 }
  },
  '6"': {
    '10S':     { nps: '6"', dnMm: 150, odMm: 168.3, schedule: '10S', wallMm: 2.77, idMm: 162.8, weightKgM: 11.47, volumeLitersM: 20.82 },
    '40/STD':  { nps: '6"', dnMm: 150, odMm: 168.3, schedule: '40/STD', wallMm: 7.11, idMm: 154.1, weightKgM: 28.26, volumeLitersM: 18.65 },
    '80/XS':   { nps: '6"', dnMm: 150, odMm: 168.3, schedule: '80/XS', wallMm: 10.97, idMm: 146.4, weightKgM: 42.56, volumeLitersM: 16.83 },
    '120':     { nps: '6"', dnMm: 150, odMm: 168.3, schedule: '120', wallMm: 14.27, idMm: 139.8, weightKgM: 54.20, volumeLitersM: 15.35 },
    '160':     { nps: '6"', dnMm: 150, odMm: 168.3, schedule: '160', wallMm: 18.26, idMm: 131.8, weightKgM: 67.56, volumeLitersM: 13.64 },
    'XXS':     { nps: '6"', dnMm: 150, odMm: 168.3, schedule: 'XXS', wallMm: 21.95, idMm: 124.4, weightKgM: 79.22, volumeLitersM: 12.15 }
  },
  '8"': {
    '10S':     { nps: '8"', dnMm: 200, odMm: 219.1, schedule: '10S', wallMm: 2.77, idMm: 213.6, weightKgM: 14.78, volumeLitersM: 35.83 },
    '20':      { nps: '8"', dnMm: 200, odMm: 219.1, schedule: '20', wallMm: 6.35, idMm: 206.4, weightKgM: 33.31, volumeLitersM: 33.46 },
    '40/STD':  { nps: '8"', dnMm: 200, odMm: 219.1, schedule: '40/STD', wallMm: 8.18, idMm: 202.7, weightKgM: 42.55, volumeLitersM: 32.27 },
    '80/XS':   { nps: '8"', dnMm: 200, odMm: 219.1, schedule: '80/XS', wallMm: 12.70, idMm: 193.7, weightKgM: 64.64, volumeLitersM: 29.47 },
    '120':     { nps: '8"', dnMm: 200, odMm: 219.1, schedule: '120', wallMm: 18.26, idMm: 182.6, weightKgM: 90.44, volumeLitersM: 26.19 },
    '160':     { nps: '8"', dnMm: 200, odMm: 219.1, schedule: '160', wallMm: 23.01, idMm: 173.1, weightKgM: 111.27, volumeLitersM: 23.54 },
    'XXS':     { nps: '8"', dnMm: 200, odMm: 219.1, schedule: 'XXS', wallMm: 22.23, idMm: 174.6, weightKgM: 107.82, volumeLitersM: 23.95 }
  },
  '10"': {
    '10S':     { nps: '10"', dnMm: 250, odMm: 273.0, schedule: '10S', wallMm: 3.40, idMm: 266.2, weightKgM: 22.58, volumeLitersM: 55.65 },
    '20':      { nps: '10"', dnMm: 250, odMm: 273.0, schedule: '20', wallMm: 6.35, idMm: 260.3, weightKgM: 41.77, volumeLitersM: 53.21 },
    '40/STD':  { nps: '10"', dnMm: 250, odMm: 273.0, schedule: '40/STD', wallMm: 9.27, idMm: 254.5, weightKgM: 60.30, volumeLitersM: 50.87 },
    '60':      { nps: '10"', dnMm: 250, odMm: 273.0, schedule: '60', wallMm: 12.70, idMm: 247.6, weightKgM: 81.53, volumeLitersM: 48.15 },
    '80/XS':   { nps: '10"', dnMm: 250, odMm: 273.0, schedule: '80/XS', wallMm: 15.09, idMm: 242.8, weightKgM: 95.97, volumeLitersM: 46.30 },
    '120':     { nps: '10"', dnMm: 250, odMm: 273.0, schedule: '120', wallMm: 21.44, idMm: 230.1, weightKgM: 132.99, volumeLitersM: 41.58 },
    '160':     { nps: '10"', dnMm: 250, odMm: 273.0, schedule: '160', wallMm: 28.58, idMm: 215.8, weightKgM: 172.33, volumeLitersM: 36.58 }
  },
  '12"': {
    '10S':     { nps: '12"', dnMm: 300, odMm: 323.8, schedule: '10S', wallMm: 4.57, idMm: 314.7, weightKgM: 36.00, volumeLitersM: 77.79 },
    '20':      { nps: '12"', dnMm: 300, odMm: 323.8, schedule: '20', wallMm: 6.35, idMm: 311.1, weightKgM: 49.73, volumeLitersM: 76.02 },
    '40/STD':  { nps: '12"', dnMm: 300, odMm: 323.8, schedule: '40/STD', wallMm: 10.31, idMm: 303.2, weightKgM: 79.71, volumeLitersM: 72.20 },
    '80/XS':   { nps: '12"', dnMm: 300, odMm: 323.8, schedule: '80/XS', wallMm: 17.48, idMm: 288.8, weightKgM: 132.04, volumeLitersM: 65.51 },
    '120':     { nps: '12"', dnMm: 300, odMm: 323.8, schedule: '120', wallMm: 25.40, idMm: 273.0, weightKgM: 186.91, volumeLitersM: 58.53 },
    '160':     { nps: '12"', dnMm: 300, odMm: 323.8, schedule: '160', wallMm: 33.32, idMm: 257.2, weightKgM: 238.76, volumeLitersM: 51.96 }
  },
  '14"': {
    '10S':     { nps: '14"', dnMm: 350, odMm: 355.6, schedule: '10S', wallMm: 4.78, idMm: 346.0, weightKgM: 41.38, volumeLitersM: 94.03 },
    '30':      { nps: '14"', dnMm: 350, odMm: 355.6, schedule: '30', wallMm: 7.92, idMm: 339.8, weightKgM: 67.90, volumeLitersM: 90.68 },
    '40/STD':  { nps: '14"', dnMm: 350, odMm: 355.6, schedule: '40/STD', wallMm: 9.53, idMm: 336.5, weightKgM: 81.33, volumeLitersM: 88.93 },
    '80/XS':   { nps: '14"', dnMm: 350, odMm: 355.6, schedule: '80/XS', wallMm: 15.09, idMm: 325.4, weightKgM: 126.71, volumeLitersM: 83.16 },
    '160':     { nps: '14"', dnMm: 350, odMm: 355.6, schedule: '160', wallMm: 35.71, idMm: 284.2, weightKgM: 281.82, volumeLitersM: 63.43 }
  },
  '16"': {
    '10S':     { nps: '16"', dnMm: 400, odMm: 406.4, schedule: '10S', wallMm: 4.57, idMm: 397.3, weightKgM: 45.30, volumeLitersM: 123.97 },
    '30':      { nps: '16"', dnMm: 400, odMm: 406.4, schedule: '30', wallMm: 7.92, idMm: 390.6, weightKgM: 77.83, volumeLitersM: 119.82 },
    '40/STD':  { nps: '16"', dnMm: 400, odMm: 406.4, schedule: '40/STD', wallMm: 9.53, idMm: 387.3, weightKgM: 93.27, volumeLitersM: 117.81 },
    '80/XS':   { nps: '16"', dnMm: 400, odMm: 406.4, schedule: '80/XS', wallMm: 16.66, idMm: 373.1, weightKgM: 160.12, volumeLitersM: 109.33 },
    '120':     { nps: '16"', dnMm: 400, odMm: 406.4, schedule: '120', wallMm: 28.58, idMm: 349.2, weightKgM: 266.36, volumeLitersM: 95.77 },
    '160':     { nps: '16"', dnMm: 400, odMm: 406.4, schedule: '160', wallMm: 40.49, idMm: 325.4, weightKgM: 365.25, volumeLitersM: 83.16 }
  },
  '18"': {
    '10S':     { nps: '18"', dnMm: 450, odMm: 457.2, schedule: '10S', wallMm: 4.78, idMm: 447.6, weightKgM: 53.34, volumeLitersM: 157.36 },
    '30':      { nps: '18"', dnMm: 450, odMm: 457.2, schedule: '30', wallMm: 7.92, idMm: 441.4, weightKgM: 87.77, volumeLitersM: 153.02 },
    '40/STD':  { nps: '18"', dnMm: 450, odMm: 457.2, schedule: '40/STD', wallMm: 9.53, idMm: 438.1, weightKgM: 105.16, volumeLitersM: 150.74 },
    '80/XS':   { nps: '18"', dnMm: 450, odMm: 457.2, schedule: '80/XS', wallMm: 19.05, idMm: 419.1, weightKgM: 205.74, volumeLitersM: 137.95 },
    '160':     { nps: '18"', dnMm: 450, odMm: 457.2, schedule: '160', wallMm: 45.24, idMm: 366.7, weightKgM: 459.39, volumeLitersM: 105.61 }
  },
  '20"': {
    '10S':     { nps: '20"', dnMm: 500, odMm: 508.0, schedule: '10S', wallMm: 5.54, idMm: 496.9, weightKgM: 68.61, volumeLitersM: 193.93 },
    '20':      { nps: '20"', dnMm: 500, odMm: 508.0, schedule: '20', wallMm: 9.53, idMm: 488.9, weightKgM: 117.15, volumeLitersM: 187.73 },
    '40/STD':  { nps: '20"', dnMm: 500, odMm: 508.0, schedule: '40/STD', wallMm: 9.53, idMm: 488.9, weightKgM: 117.15, volumeLitersM: 187.73 },
    '80/XS':   { nps: '20"', dnMm: 500, odMm: 508.0, schedule: '80/XS', wallMm: 20.62, idMm: 466.8, weightKgM: 248.01, volumeLitersM: 171.13 },
    '160':     { nps: '20"', dnMm: 500, odMm: 508.0, schedule: '160', wallMm: 50.01, idMm: 408.0, weightKgM: 564.81, volumeLitersM: 130.74 }
  },
  '24"': {
    '10S':     { nps: '24"', dnMm: 600, odMm: 609.6, schedule: '10S', wallMm: 6.35, idMm: 596.9, weightKgM: 94.47, volumeLitersM: 279.82 },
    '20':      { nps: '24"', dnMm: 600, odMm: 609.6, schedule: '20', wallMm: 9.53, idMm: 590.5, weightKgM: 140.98, volumeLitersM: 273.84 },
    '40/STD':  { nps: '24"', dnMm: 600, odMm: 609.6, schedule: '40/STD', wallMm: 9.53, idMm: 590.5, weightKgM: 140.98, volumeLitersM: 273.84 },
    '80/XS':   { nps: '24"', dnMm: 600, odMm: 609.6, schedule: '80/XS', wallMm: 17.48, idMm: 574.6, weightKgM: 255.20, volumeLitersM: 259.34 },
    '120':     { nps: '24"', dnMm: 600, odMm: 609.6, schedule: '120', wallMm: 46.02, idMm: 517.6, weightKgM: 639.63, volumeLitersM: 210.42 },
    '160':     { nps: '24"', dnMm: 600, odMm: 609.6, schedule: '160', wallMm: 59.54, idMm: 490.5, weightKgM: 807.56, volumeLitersM: 188.95 }
  },
  '30"': {
    '10S':     { nps: '30"', dnMm: 750, odMm: 762.0, schedule: '10S', wallMm: 7.92, idMm: 746.2, weightKgM: 147.16, volumeLitersM: 437.33 },
    '20':      { nps: '30"', dnMm: 750, odMm: 762.0, schedule: '20', wallMm: 9.53, idMm: 742.9, weightKgM: 176.84, volumeLitersM: 433.47 },
    '30':      { nps: '30"', dnMm: 750, odMm: 762.0, schedule: '30', wallMm: 12.70, idMm: 736.6, weightKgM: 234.66, volumeLitersM: 426.13 },
    'STD':     { nps: '30"', dnMm: 750, odMm: 762.0, schedule: 'STD', wallMm: 9.53, idMm: 742.9, weightKgM: 176.84, volumeLitersM: 433.47 },
    'XS':      { nps: '30"', dnMm: 750, odMm: 762.0, schedule: 'XS', wallMm: 12.70, idMm: 736.6, weightKgM: 234.66, volumeLitersM: 426.13 }
  },
  '36"': {
    '10S':     { nps: '36"', dnMm: 900, odMm: 914.4, schedule: '10S', wallMm: 7.92, idMm: 898.6, weightKgM: 176.95, volumeLitersM: 634.18 },
    '20':      { nps: '36"', dnMm: 900, odMm: 914.4, schedule: '20', wallMm: 9.53, idMm: 895.3, weightKgM: 212.68, volumeLitersM: 629.53 },
    'STD':     { nps: '36"', dnMm: 900, odMm: 914.4, schedule: 'STD', wallMm: 9.53, idMm: 895.3, weightKgM: 212.68, volumeLitersM: 629.53 },
    'XS':      { nps: '36"', dnMm: 900, odMm: 914.4, schedule: 'XS', wallMm: 12.70, idMm: 889.0, weightKgM: 282.42, volumeLitersM: 620.69 }
  },
  '42"': {
    'STD':     { nps: '42"', dnMm: 1050, odMm: 1066.8, schedule: 'STD', wallMm: 9.53, idMm: 1047.7, weightKgM: 248.53, volumeLitersM: 862.05 },
    'XS':      { nps: '42"', dnMm: 1050, odMm: 1066.8, schedule: 'XS', wallMm: 12.70, idMm: 1041.4, weightKgM: 330.18, volumeLitersM: 851.68 }
  },
  '48"': {
    'STD':     { nps: '48"', dnMm: 1200, odMm: 1219.2, schedule: 'STD', wallMm: 9.53, idMm: 1200.1, weightKgM: 284.38, volumeLitersM: 1131.11 },
    'XS':      { nps: '48"', dnMm: 1200, odMm: 1219.2, schedule: 'XS', wallMm: 12.70, idMm: 1193.8, weightKgM: 377.93, volumeLitersM: 1119.23 }
  }
};
