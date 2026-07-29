import { ASMEB165Calculator, FLANGE_DATA, FlangeSpec } from './asme/asmeB165';

export { ASMEB165Calculator, FLANGE_DATA };
export type { FlangeSpec };

/**
 * Consulta y obtención de especificaciones dimensionales y torques de brida según ASME B16.5
 */
export function getFlangeSpec(rating: string, nps: string): FlangeSpec | undefined {
  return FLANGE_DATA[rating]?.[nps];
}
