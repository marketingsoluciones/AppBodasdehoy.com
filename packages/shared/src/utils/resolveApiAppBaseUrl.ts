/**
 * resolveApiAppBaseUrl — URL base del servidor de imágenes/assets (apiapp).
 *
 * Todos los tenants comparten el mismo servidor apiapp para imágenes de eventos,
 * logos, templates Excel, etc. Esta función centraliza el fallback para que
 * no se repita "https://apiapp.bodasdehoy.com" en 15+ archivos.
 *
 * Usa NEXT_PUBLIC_BASE_URL si está definida (en Vercel, .env.production, etc.),
 * sino fallback al dominio conocido.
 */
const DEFAULT_APIAPP_URL = 'https://apiapp.bodasdehoy.com';

export function resolveApiAppBaseUrl(): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const envImages: string = (globalThis as any).process?.env?.NEXT_PUBLIC_IMAGES_BASE_URL ?? '';
  const envLegacy: string = (globalThis as any).process?.env?.NEXT_PUBLIC_BASE_URL ?? '';
  return (envImages || envLegacy || DEFAULT_APIAPP_URL).replace(/\/$/, '');
}
