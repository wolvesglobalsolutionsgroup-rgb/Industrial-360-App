import { httpsCallable } from 'firebase/functions';
import { functionsInstance } from '../firebase';

/**
 * Solicita un código regulatorio oficial generado en servidor vía Cloud Function con transacción atómica.
 * Si falla o está offline, retorna un código determinista formateado sin Math.random().
 */
export async function generateRegulatoryCode(orgId: string, projectId: string, series: string): Promise<string> {
  const cleanOrg = orgId || '';
  const cleanProj = projectId || '';
  const seriesUpper = series.trim().toUpperCase();

  try {
    const fn = httpsCallable(functionsInstance, 'issueRegulatoryCode');
    const response: any = await fn({ orgId: cleanOrg, projectId: cleanProj, series: seriesUpper });
    if (response.data?.code) {
      return response.data.code;
    }
  } catch (err) {
    console.warn(`[RegulatoryIDs] Fallback determinista para ${seriesUpper}:`, err);
  }

  const year = new Date().getFullYear();
  const timestampSeq = String(Date.now()).slice(-5);
  return `${seriesUpper}-${year}-${timestampSeq}`;
}
