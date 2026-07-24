import { useTenantBranding } from '@bodasdehoy/shared/branding';

import { getCurrentDevelopment } from '@/utils/developmentDetector';

/**
 * Paleta de MARCA de la Bandeja, derivada del whitelabel ACTIVO.
 *
 * MULTI-MARCA (regla del proyecto): cada whitelabel elige su `primaryColor`
 * (bodasdehoy = #ec4899 rosa · otros = #6771ae, #6096B9, #ecb290…). El prototipo
 * "Bandeja - Prototipo.dc.html" usa #7C3AED como color de DEMOSTRACIÓN; aquí ese
 * morado = el primario del whitelabel, así cada marca se pinta en SU paleta.
 *
 * FUENTE: `useTenantBranding(development)` (config estática de @bodasdehoy/shared,
 * autoritativa por development/hostname). NOTA: NO usamos `theme.colorPrimary` de
 * antd porque el branding del whitelabel NO se sincroniza con el tema antd (solo
 * pone la CSS var `--primary-color`); antd quedaría en su azul por defecto.
 *
 * Lo que NO va aquí (colores SEMÁNTICOS, iguales entre marcas):
 *   RSVP (verde/ámbar/rojo), canales (WA verde, IG rosa, SMS gris…), IA teal/cyan.
 */
export interface BandejaBrand {
  /** Color de marca (demo #7C3AED / #6B4EFF) = primaryColor del whitelabel. */
  brand: string;
  /** Fondo claro de marca para estados activos (demo #EDE9FE / #F4F1FE). */
  brandBg: string;
  /** Fondo claro de marca al hover. */
  brandBgHover: string;
  /** Borde de marca suave (demo #C4B5FD). */
  brandBorder: string;
  /** Texto de marca sobre fondo claro (demo #5B21B6). */
  brandText: string;
  /** Texto sobre el color de marca sólido (blanco). */
  onBrand: string;
}

/** Parseo tolerante de #RGB / #RRGGBB → {r,g,b}. Fallback rosa bodasdehoy. */
function parseHex(hex: string): { b: number; g: number; r: number } {
  let h = (hex || '').trim().replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const int = Number.parseInt(h, 16);
  if (h.length !== 6 || Number.isNaN(int)) return { b: 0x99, g: 0x48, r: 0xEC }; // #ec4899
  return { b: int & 0xFF, g: (int >> 8) & 0xFF, r: (int >> 16) & 0xFF };
}

const to2 = (n: number) => n.toString(16).padStart(2, '0');

/** Mezcla `hex` con `other` (blanco/negro): weight = fracción de `hex` (0..1). */
function mix(hex: string, other: string, weight: number): string {
  const a = parseHex(hex);
  const b = parseHex(other);
  const ch = (x: number, y: number) => Math.round(x * weight + y * (1 - weight));
  return `#${to2(ch(a.r, b.r))}${to2(ch(a.g, b.g))}${to2(ch(a.b, b.b))}`;
}

const WHITE = '#ffffff';
const BLACK = '#000000';

export function useBandejaBrand(): BandejaBrand {
  const development = typeof window !== 'undefined' ? getCurrentDevelopment() : undefined;
  const { primaryColor } = useTenantBranding(development || undefined);
  const p = primaryColor || '#ec4899';
  return {
    brand: p,
    brandBg: mix(p, WHITE, 0.12),
    brandBgHover: mix(p, WHITE, 0.2),
    brandBorder: mix(p, WHITE, 0.42),
    brandText: mix(p, BLACK, 0.72),
    onBrand: WHITE,
  };
}
