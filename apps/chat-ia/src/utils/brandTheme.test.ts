import { describe, expect, it } from 'vitest';

import { deriveBrandColors, hue, nearestLobePalette, shade } from './brandTheme';

/**
 * Unificación de marca 15-09: una sola fuente (el primario compartido) y el resto
 * derivado, más el mapeo a las paletas con nombre que exige lobe-ui.
 */
describe('brandTheme', () => {
  it('mapea cada marca a la paleta de lobe-ui de su tono', () => {
    expect(nearestLobePalette('#F7628C')).toBe('magenta'); // bodasdehoy, rosa
    expect(nearestLobePalette('#6096B9')).toBe('blue'); // eventosorganizador, azul
    expect(nearestLobePalette('#6771ae')).toBe('geekblue'); // eventosplanificador
    expect(nearestLobePalette('#2c3e50')).toBe('blue'); // corporativozr, azul oscuro
  });

  it('devuelve undefined si el color no es válido (no inventa marca)', () => {
    expect(nearestLobePalette('no-es-un-color')).toBeUndefined();
    expect(nearestLobePalette('')).toBeUndefined();
  });

  it('deriva secundario más oscuro y acento más claro, conservando el tono', () => {
    const c = deriveBrandColors('#F7628C');
    expect(c.primary).toBe('#F7628C');
    expect(c.secondary).not.toBe(c.primary);
    expect(c.accent).not.toBe(c.primary);
    // el tono se mantiene dentro de un margen estrecho: sigue siendo la misma marca
    const h = hue('#F7628C')!;
    expect(Math.abs(hue(c.secondary)! - h)).toBeLessThan(6);
    expect(Math.abs(hue(c.accent)! - h)).toBeLessThan(6);
  });

  it('shade aclara y oscurece sin salirse de rango', () => {
    expect(shade('#000000', 1.5)).toMatch(/^#[\da-f]{6}$/);
    expect(shade('#ffffff', 1.5)).toBe('#ffffff');
    expect(shade('#ffffff', 0.5)).toBe('#808080');
  });

  it('tolera un hex inválido devolviéndolo tal cual', () => {
    expect(shade('rgb(1,2,3)', 0.5)).toBe('rgb(1,2,3)');
    expect(hue('#zzzzzz')).toBeNull();
  });
});
