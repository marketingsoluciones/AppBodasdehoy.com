/**
 * Host api2.bodasdehoy.com no tiene DNS estable; API2 real vive en eventosorganizador.com.
 * Las vars NEXT_PUBLIC_* se sustituyen en build; si en Vercel quedó el host viejo, normalizamos en runtime.
 */
export const API2_HTTP_FALLBACK = 'https://api2.eventosorganizador.com';

export function normalizeApi2HttpBase(raw?: string | null): string {
  const trimmed = (raw || '').trim();
  if (!trimmed) return API2_HTTP_FALLBACK;
  const lowered = trimmed.toLowerCase();
  if (lowered.includes('api2.bodasdehoy.com')) return API2_HTTP_FALLBACK;
  try {
    const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const host = new URL(withScheme).hostname.toLowerCase();
    if (host === 'api2.bodasdehoy.com') return API2_HTTP_FALLBACK;
    return /^https?:\/\//i.test(trimmed) ? trimmed : withScheme;
  } catch {
    return API2_HTTP_FALLBACK;
  }
}
