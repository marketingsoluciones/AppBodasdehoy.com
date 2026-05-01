/**
 * Converts a semi-transparent color to a solid color by compositing it over a background.
 * Useful when CSS alpha blending isn't available (e.g., inside createStyles CSS-in-JS).
 *
 * @param foreground - Color with potential alpha (hex, rgb, rgba)
 * @param background - Solid background color (hex, rgb)
 * @returns Solid hex color
 */
export function convertAlphaToSolid(foreground: string, background: string): string {
  const fg = parseColor(foreground);
  const bg = parseColor(background);

  if (!fg || !bg) return foreground;

  const alpha = fg.a;
  const r = Math.round(alpha * fg.r + (1 - alpha) * bg.r);
  const g = Math.round(alpha * fg.g + (1 - alpha) * bg.g);
  const b = Math.round(alpha * fg.b + (1 - alpha) * bg.b);

  return `rgb(${r}, ${g}, ${b})`;
}

interface RGBA {
  a: number;
  b: number;
  g: number;
  r: number;
}

function parseColor(color: string): RGBA | null {
  if (!color) return null;

  // rgba(r, g, b, a)
  const rgbaMatch = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/);
  if (rgbaMatch) {
    return {
      a: rgbaMatch[4] !== undefined ? parseFloat(rgbaMatch[4]) : 1,
      b: parseInt(rgbaMatch[3], 10),
      g: parseInt(rgbaMatch[2], 10),
      r: parseInt(rgbaMatch[1], 10),
    };
  }

  // #rrggbbaa or #rrggbb or #rgb
  const hexMatch = color.match(/^#([\da-f]{3,8})$/i);
  if (hexMatch) {
    const hex = hexMatch[1];
    if (hex.length === 3) {
      return {
        a: 1,
        b: parseInt(hex[2] + hex[2], 16),
        g: parseInt(hex[1] + hex[1], 16),
        r: parseInt(hex[0] + hex[0], 16),
      };
    }
    if (hex.length === 6) {
      return {
        a: 1,
        b: parseInt(hex.slice(4, 6), 16),
        g: parseInt(hex.slice(2, 4), 16),
        r: parseInt(hex.slice(0, 2), 16),
      };
    }
    if (hex.length === 8) {
      return {
        a: parseInt(hex.slice(6, 8), 16) / 255,
        b: parseInt(hex.slice(4, 6), 16),
        g: parseInt(hex.slice(2, 4), 16),
        r: parseInt(hex.slice(0, 2), 16),
      };
    }
  }

  return null;
}
