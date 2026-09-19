/**
 * brandTheme — derivación del tema a partir del color de marca del tenant.
 *
 * Unificación 15-09. Antes había tres sitios decidiendo el color de una marca:
 *   1. `packages/shared/src/types/developments.ts` (fuente compartida con appEventos),
 *   2. un `COLOR_OVERRIDES` local en chat-ia que solo cubría bodasdehoy — las demás
 *      marcas caían al secundario del paquete (verde menta) o a un morado genérico,
 *   3. literales de marca escritos a mano en componentes.
 *
 * Ahora la única entrada es `theme.primaryColor` del paquete compartido y de ahí se
 * derivan secundario y acento por color, así que TODAS las marcas quedan coherentes,
 * no solo la que alguien recordó poner en un mapa.
 */

const clamp = (n: number) => Math.min(255, Math.max(0, Math.round(n)));

function parseHex(hex: string): [number, number, number] | null {
  const h = hex.trim().replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  if (!/^[\da-f]{6}$/i.test(full)) return null;
  return [
    Number.parseInt(full.slice(0, 2), 16),
    Number.parseInt(full.slice(2, 4), 16),
    Number.parseInt(full.slice(4, 6), 16),
  ];
}

const toHex = (r: number, g: number, b: number) =>
  `#${[r, g, b].map((v) => clamp(v).toString(16).padStart(2, '0')).join('')}`;

/** Oscurece (ratio<1) o aclara (ratio>1) un hex conservando el tono. */
export function shade(hex: string, ratio: number): string {
  const rgb = parseHex(hex);
  if (!rgb) return hex;
  const [r, g, b] = rgb;
  if (ratio <= 1) return toHex(r * ratio, g * ratio, b * ratio);
  const t = ratio - 1;
  return toHex(r + (255 - r) * t, g + (255 - g) * t, b + (255 - b) * t);
}

/** Tono 0-360 del hex, o null si no es un color válido. */
export function hue(hex: string): number | null {
  const rgb = parseHex(hex);
  if (!rgb) return null;
  const [r, g, b] = rgb.map((v) => v / 255) as [number, number, number];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d === 0) return 0;
  let h: number;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h *= 60;
  return h < 0 ? h + 360 : h;
}

/**
 * Paletas con nombre de @lobehub/ui: su `customTheme.primaryColor` NO acepta un hex,
 * solo uno de estos doce nombres. Sin este mapeo, los componentes de lobe-ui se
 * quedaban con el primario por defecto de LobeChat mientras antd sí llevaba la marca
 * — media pantalla con el color del tenant y media sin él.
 */
const PALETTE_HUES: Array<[string, number]> = [
  ['red', 0],
  ['volcano', 15],
  ['orange', 30],
  ['gold', 45],
  ['yellow', 60],
  ['lime', 80],
  ['green', 120],
  ['cyan', 180],
  ['blue', 210],
  ['geekblue', 230],
  ['purple', 270],
  ['magenta', 330],
];

/** Paleta de lobe-ui más próxima al color de marca (distancia circular de tono). */
export function nearestLobePalette(hex: string): string | undefined {
  const h = hue(hex);
  if (h === null) return undefined;
  let best = PALETTE_HUES[0];
  let bestDist = 360;
  for (const entry of PALETTE_HUES) {
    const raw = Math.abs(h - entry[1]);
    const dist = Math.min(raw, 360 - raw);
    if (dist < bestDist) {
      bestDist = dist;
      best = entry;
    }
  }
  return best[0];
}

export interface BrandColors {
  accent: string;
  primary: string;
  secondary: string;
}

/** Secundario y acento derivados del primario, para no mantener un mapa por marca. */
export function deriveBrandColors(primary: string): BrandColors {
  return {
    accent: shade(primary, 1.35),
    primary,
    secondary: shade(primary, 0.82),
  };
}
