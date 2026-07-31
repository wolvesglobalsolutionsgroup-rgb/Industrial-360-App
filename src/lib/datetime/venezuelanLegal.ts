/**
 * venezuelanLegal — Utilidades de fecha/hora con zona horaria legal de Venezuela (America/Caracas - UTC-4).
 */

const VENEZUELA_TZ = 'America/Caracas';

export function venezuelanLegalDate(iso: string, locale: string = 'es-VE'): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(locale, {
    timeZone: VENEZUELA_TZ,
    year: 'numeric',
    month: 'long',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

export function venezuelanLegalYear(iso: string = new Date().toISOString()): number {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return new Date().getUTCFullYear();
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: VENEZUELA_TZ,
    year: 'numeric',
  }).formatToParts(d);
  const y = parts.find((p) => p.type === 'year')?.value;
  return y ? parseInt(y, 10) : d.getUTCFullYear();
}

export function nowInVenezuela(): string {
  return new Date().toLocaleString('es-VE', { timeZone: VENEZUELA_TZ }) + ' (HLV UTC-4)';
}
