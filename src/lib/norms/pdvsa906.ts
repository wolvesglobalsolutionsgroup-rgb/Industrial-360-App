import { NormCalculator, NormField, NormResult, NORM_DISCLAIMER } from './types';
import { PDVSA906Calculator } from './pdvsa/pdvsa906';

export { PDVSA906Calculator };

/**
 * Calculadora de Separadores y Depuradores de Gas según la Norma PDVSA 90601-E / API SPEC 12J
 * Utiliza la Ecuación de Souders-Brown: V_max = K * sqrt((rho_l - rho_g) / rho_g)
 */
export class PDVSA90601ESeparatorCalculator implements NormCalculator {
  id = 'pdvsa_90601e';
  name = 'PDVSA 90601-E — Diseño y Dimensionamiento de Separadores y Depuradores de Gas';
  standard = 'PDVSA 90601-E';
  edition = '2021';
  reference = 'PDVSA 90601-E / API Spec 12J / GPSA Cap. 7';
  description = 'Cálculo de velocidad máxima permisible de gas, diámetro interno del recipiente y capacidad volumétrica en depuradores de gas de proceso.';
  category: 'proceso' = 'proceso';
  disclaimer = NORM_DISCLAIMER;

  getFields(): NormField[] {
    return [
      {
        id: 'Qg',
        label: 'Flujo Volumétrico de Gas (Qg)',
        type: 'number',
        unit: 'MMMSCFD',
        defaultValue: 15.0,
        min: 0.1,
        max: 500,
        step: 0.5,
        description: 'Tasa de producción de gas a condiciones estándar (MMCFD / MMMSCFD).',
        normaReference: 'PDVSA 90601-E §4.1'
      },
      {
        id: 'P_oper',
        label: 'Presión de Operación (P)',
        type: 'number',
        unit: 'psig',
        defaultValue: 600,
        min: 10,
        max: 3000,
        step: 10,
        description: 'Presión interna de servicio del recipiente.',
        normaReference: 'PDVSA 90601-E §4.2'
      },
      {
        id: 'T_oper',
        label: 'Temperatura de Operación (T)',
        type: 'number',
        unit: '°F',
        defaultValue: 100,
        min: 32,
        max: 350,
        step: 5,
        description: 'Temperatura del fluido procesado.',
        normaReference: 'PDVSA 90601-E §4.2'
      },
      {
        id: 'SG_gas',
        label: 'Gravedad Específica del Gas (SG_g)',
        type: 'number',
        unit: 'aire=1.0',
        defaultValue: 0.65,
        min: 0.55,
        max: 1.2,
        step: 0.01,
        description: 'Densidad relativa del gas respecto al aire.',
        normaReference: 'PDVSA 90601-E §4.3'
      },
      {
        id: 'SG_liq',
        label: 'Gravedad Específica del Líquido (SG_l)',
        type: 'number',
        unit: 'agua=1.0',
        defaultValue: 0.85,
        min: 0.6,
        max: 1.1,
        step: 0.01,
        description: 'Densidad relativa del condensado/agua (ej: 0.85 para crudo de 35° API).',
        normaReference: 'PDVSA 90601-E §4.3'
      },
      {
        id: 'k_factor',
        label: 'Factor de Separación Souders-Brown (K)',
        type: 'select',
        defaultValue: '0.35',
        options: [
          { value: '0.35', label: '0.35 — Separador vertical con extractor de niebla (Mist Extractor)' },
          { value: '0.15', label: '0.15 — Depurador vertical sin malla ni demister' },
          { value: '0.40', label: '0.40 — Separador horizontal con malla tipo vane' }
        ],
        description: 'Constante empírica de arrastre de gotas de líquido.',
        normaReference: 'PDVSA 90601-E Tabla 2'
      }
    ];
  }

  validate(inputs: Record<string, any>): string[] {
    const errors: string[] = [];
    if (!inputs.Qg || inputs.Qg <= 0) errors.push('El flujo de gas Qg debe ser mayor a 0.');
    if (!inputs.P_oper || inputs.P_oper <= 0) errors.push('La presión P_oper debe ser mayor a 0 psig.');
    return errors;
  }

  calculate(inputs: Record<string, any>): NormResult[] {
    const errors = this.validate(inputs);
    if (errors.length > 0) {
      return [{
        passed: false,
        value: 'ERROR',
        label: 'Error de entrada de datos',
        codeReference: 'PDVSA 90601-E §4.1',
        recommendations: errors,
        severity: 'error',
        disclaimer: NORM_DISCLAIMER
      }];
    }

    const Qg = Number(inputs.Qg); // MMCFD
    const P_psig = Number(inputs.P_oper);
    const T_degF = Number(inputs.T_oper || 100);
    const SG_g = Number(inputs.SG_gas || 0.65);
    const SG_l = Number(inputs.SG_liq || 0.85);
    const K = Number(inputs.k_factor || 0.35);

    // Gas & liquid densities
    const P_psia = P_psig + 14.7;
    const T_degR = T_degF + 460;
    const rho_g = (2.7 * P_psia * SG_g) / (T_degR * 0.90); // lb/ft3 (assuming Z~0.9)
    const rho_l = SG_l * 62.4; // lb/ft3

    // Maximum allowable gas velocity V_max = K * sqrt((rho_l - rho_g) / rho_g)
    const V_max = K * Math.sqrt((rho_l - rho_g) / Math.max(rho_g, 0.01)); // ft/s

    // Actual gas flow rate in ACFS (Actual Cubic Feet per Second)
    const Q_acfs = (Qg * 1e6 * 14.7 * T_degR * 0.90) / (86400 * P_psia * 520);

    // Minimum cross-sectional area A_min = Q_acfs / V_max (ft2)
    const A_min = Q_acfs / Math.max(V_max, 0.1);
    const D_min_ft = Math.sqrt((4 * A_min) / Math.PI);
    const D_min_in = D_min_ft * 12;

    // Recommended vessel ID rounded to nearest commercial size
    const D_rec_in = Math.ceil(D_min_in / 6) * 6; // e.g. 24", 30", 36"
    const L_tan_tan_ft = (D_rec_in / 12) * 3.0; // L/D ratio = 3.0 typical

    const passed = D_rec_in >= 12;

    return [
      {
        passed,
        value: `${D_rec_in} pulg ID (${(D_rec_in * 25.4).toFixed(0)} mm)`,
        unit: 'Diámetro Mínimo Recipiente',
        label: 'Dimensionamiento de Depurador PDVSA 90601-E',
        margin: Number(((D_rec_in - D_min_in) / D_min_in * 100).toFixed(1)),
        codeReference: 'PDVSA 90601-E §5.3 / Ecuación de Souders-Brown',
        recommendations: [
          `Velocidad máxima de gas permisible sin arrastre: ${V_max.toFixed(2)} ft/s.`,
          `Longitud de costura a costura recomendada (L/D = 3.0): ${L_tan_tan_ft.toFixed(1)} pies (${(L_tan_tan_ft * 0.3048).toFixed(2)} m).`,
          `Instalar malla extractora de niebla (Demister Pad) de acero inoxidable 316L de 6" de espesor.`,
          `Cumplir con código de diseño de recipientes a presión ASME Secc. VIII Div. 1.`
        ],
        severity: 'success',
        disclaimer: NORM_DISCLAIMER,
        details: {
          'Flujo Real de Gas (ACFS)': `${Q_acfs.toFixed(2)} ft³/s`,
          'Velocidad Máxima Permisible (V_max)': `${V_max.toFixed(2)} ft/s`,
          'Densidad del Gas (rho_g)': `${rho_g.toFixed(3)} lb/ft³`,
          'Densidad del Líquido (rho_l)': `${rho_l.toFixed(1)} lb/ft³`,
          'Diámetro Calculado Mínimo': `${D_min_in.toFixed(1)} pulg`,
          'Diámetro Comercial Recomendado': `${D_rec_in} pulg`,
          'Longitud Tan-to-Tan': `${L_tan_tan_ft.toFixed(1)} pies`
        }
      }
    ];
  }
}

/**
 * Función auxiliar para cálculo rápido de depurador de gas PDVSA 90601-E
 */
export function calculatePDVSASeparator(
  Qg_mmcfd: number,
  P_psig: number,
  T_degF: number = 100,
  SG_gas: number = 0.65,
  SG_liq: number = 0.85,
  K_factor: number = 0.35
) {
  const calc = new PDVSA90601ESeparatorCalculator();
  return calc.calculate({ Qg: Qg_mmcfd, P_oper: P_psig, T_oper: T_degF, SG_gas, SG_liq, k_factor: K_factor });
}
