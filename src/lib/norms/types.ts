export const NORM_DISCLAIMER = "Apoyo técnico sujeto a revisión/aprobación del ingeniero responsable.";

export interface NormField {
  id: string;
  label: string;
  type: 'number' | 'select' | 'text';
  unit?: string;
  required?: boolean;
  defaultValue?: number | string;
  min?: number;
  max?: number;
  step?: number;
  options?: { value: string; label: string }[];
  description?: string;
  normaReference?: string;
}

export interface NormResult {
  passed: boolean;
  value: number | string;
  unit?: string;
  label: string;
  margin?: number;               // % margen de seguridad
  codeReference: string;        // "ASME B31.3 §304.1.2 — Ec. 3a"
  recommendations: string[];
  severity?: 'success' | 'warning' | 'error';
  details?: Record<string, string | number>;
  disclaimer?: string;
}

export interface NormCalculator<TInput = Record<string, any>, TResult = NormResult[]> {
  id: string;
  standard: string;
  edition: string;
  reference: string;
  name?: string;
  description?: string;
  category?: 'tuberias' | 'soldadura' | 'bridas' | 'inspeccion' | 'proceso';
  disclaimer?: string;
  getFields?(): NormField[];
  validate(input: TInput): string[];
  calculate(input: TInput): TResult;
}
