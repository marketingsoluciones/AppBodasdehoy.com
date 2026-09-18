import { describe, expect, it } from 'vitest';

/**
 * El contraste se mide, no se opina. La paleta de la bandeja se comprueba aquí para que nadie
 * la "afine" a ojo y deje texto que se ve pero no se lee: hasta el 18-09 el gris de las horas
 * y los contadores daba 2.8:1 sobre blanco, cuando el mínimo para texto normal es 4.5:1.
 *
 * Si esta prueba falla tras tocar `tailwind.css`, el color nuevo es más bonito y menos
 * legible. Los valores de aquí tienen que ir a la par con los de ese fichero.
 */
const CLARO = { border: '#EDEDF0', surface: '#FFFFFF', surface2: '#F2F1F6', text1: '#1C1C22', text2: '#6B6B76', text3: '#6C6C76' };
const OSCURO = { border: '#32323A', surface: '#1A1A1F', surface2: '#26262D', text1: '#F2F1F6', text2: '#A8A6B3', text3: '#9A9AA6' };

function luminancia(hex: string): number {
  const c = [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16) / 255);
  const l = c.map((x) => (x <= 0.039_28 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2];
}

function contraste(a: string, b: string): number {
  const [alta, baja] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (alta + 0.05) / (baja + 0.05);
}

const MINIMO_TEXTO = 4.5;

describe('contraste de la paleta de la bandeja', () => {
  for (const [nombre, p] of [['claro', CLARO], ['oscuro', OSCURO]] as const) {
    for (const texto of ['text1', 'text2', 'text3'] as const) {
      for (const fondo of ['surface', 'surface2'] as const) {
        it(`${nombre}: ${texto} sobre ${fondo} llega al mínimo legible`, () => {
          expect(contraste(p[texto], p[fondo])).toBeGreaterThanOrEqual(MINIMO_TEXTO);
        });
      }
    }
  }
});
