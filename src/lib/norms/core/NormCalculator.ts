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
}

export interface NormCalculator {
  id: string;
  name: string;
  standard: string;
  version: string;
  description: string;
  category: 'tuberias' | 'soldadura' | 'bridas' | 'inspeccion';
  getFields(): NormField[];
  calculate(inputs: Record<string, any>): NormResult[];
  validate(inputs: Record<string, any>): string[];
}
