/**
 * Saneo defensivo de URLs de media/branding.
 *
 * El backend de branding (api-ia) devuelve a veces URLs con el protocolo DUPLICADO,
 * p.ej. "https://https://media.eventosorganizador.com/...". Esto rompe la carga del logo,
 * favicon y demás recursos (ERR_NAME_NOT_RESOLVED). Ver reporte 2026-06-11.
 *
 * Esta función colapsa el protocolo duplicado y corrige el patrón "https//" (sin los dos puntos).
 * Es un parche del front mientras api-ia corrige el origen del dato.
 */
export function normalizeMediaUrl(url?: string | null): string | undefined {
  if (!url || typeof url !== 'string') return url ?? undefined;
  let u = url.trim();
  // Colapsar protocolo duplicado, incluyendo el caso mixto donde el 2º protocolo
  // viene SIN los dos puntos: "https://https//host" o "https://https://host" → "https://host".
  // (reportado 2026-06-13: favicon https://https//media... daba 503).
  u = u.replace(/^(https?:\/\/)+(https?):?\/\//i, '$2://');
  // Corregir "https//host" (faltan los dos puntos) → "https://host".
  u = u.replace(/^(https?)\/\/(?!\/)/i, '$1://');
  return u;
}

/** Aplica normalizeMediaUrl a todos los campos string que parezcan URLs en un objeto plano. */
export function normalizeBrandingUrls<T extends Record<string, any>>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj;
  const out: Record<string, any> = Array.isArray(obj) ? [...obj] : { ...obj };
  for (const key of Object.keys(out)) {
    const val = out[key];
    if (typeof val === 'string' && /^https?[/:]/i.test(val)) {
      out[key] = normalizeMediaUrl(val);
    } else if (val && typeof val === 'object') {
      out[key] = normalizeBrandingUrls(val);
    }
  }
  return out as T;
}
