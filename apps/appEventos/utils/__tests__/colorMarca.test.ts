/**
 * Candado: las dos tablas de color de marca no pueden volver a separarse.
 *
 * Había DOS fuentes de verdad para el `primaryColor` de cada whitelabel:
 *   · packages/shared/src/types/developments.ts   (la que lee chat-ia)
 *   · apps/appEventos/firebase.tsx                (la que lee appEventos)
 *
 * Seis de once marcas tenían valores distintos, y dos no eran matices: corporativozr
 * estaba en azul marino en una y beige en la otra; eventosintegrados en azul violáceo
 * y en rojo carmín. Cada app pintaba su versión, así que la misma marca se veía
 * distinta según la pantalla.
 *
 * Decisión JCP 17-09: manda appEventos. Este test lee las DOS tablas del disco y
 * falla si alguna marca divergiera de nuevo — es lo único que evita que el arreglo
 * se deshaga en el siguiente merge.
 *
 * Si hay que cambiar el color de una marca, se cambia en los dos sitios (o mejor:
 * se borra la tabla de firebase.tsx y se importa la compartida, y entonces este
 * test sobra).
 */
import fs from 'node:fs';
import path from 'node:path';

const RAIZ = path.resolve(__dirname, '../../../..');
const RUTA_SHARED = path.join(RAIZ, 'packages/shared/src/types/developments.ts');
const RUTA_APP = path.join(RAIZ, 'apps/appEventos/firebase.tsx');

/** Empareja `development: 'x'` con el `primaryColor` de su bloque de tema. */
function leerTabla(ruta: string): Record<string, string> {
  const s = fs.readFileSync(ruta, 'utf8');
  const tokens: Array<['dev' | 'col', string]> = [];
  const re = /development:\s*['"]([^'"]+)['"]|primaryColor:\s*['"](#[0-9A-Fa-f]{3,8})['"]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) {
    if (m[1]) tokens.push(['dev', m[1]]);
    else if (m[2]) tokens.push(['col', m[2].toUpperCase()]);
  }
  const out: Record<string, string> = {};
  let actual: string | null = null;
  for (const [tipo, valor] of tokens) {
    if (tipo === 'dev') actual = valor;
    else if (actual && !(actual in out)) out[actual] = valor;
  }
  return out;
}

describe('color de marca: una sola verdad', () => {
  const shared = leerTabla(RUTA_SHARED);
  const app = leerTabla(RUTA_APP);

  it('las dos tablas existen y traen las 11 marcas', () => {
    expect(Object.keys(shared).length).toBeGreaterThanOrEqual(11);
    expect(Object.keys(app).length).toBeGreaterThanOrEqual(11);
  });

  it('ninguna marca tiene primaryColor distinto entre las dos tablas', () => {
    const comunes = Object.keys(app).filter((m) => m in shared);
    const divergen = comunes
      .filter((m) => shared[m] !== app[m])
      .map((m) => `${m}: shared=${shared[m]} vs appEventos=${app[m]}`);
    expect(divergen).toEqual([]);
  });

  it('bodasdehoy usa el rosa que la app pinta de verdad', () => {
    // #EF5B94 aparece en 82 ficheros de appEventos (botones, enlaces, bordes).
    // El viejo #F7628C solo salía en el trazo de un SVG: estaba configurado y no
    // se usaba. Si alguien lo revierte, este test lo dice.
    expect(app['bodasdehoy']).toBe('#EF5B94');
    expect(shared['bodasdehoy']).toBe('#EF5B94');
  });

  it('todos los colores son hexadecimales de 6 dígitos', () => {
    const malos = Object.entries({ ...shared, ...app })
      .filter(([, c]) => !/^#[0-9A-F]{6}$/.test(c))
      .map(([m, c]) => `${m}=${c}`);
    expect(malos).toEqual([]);
  });

  it('el fallback de branding es un color de marca real, no inventado', () => {
    // Era '#ec4899', que no pertenece a ninguna marca: un fallo de resolución
    // pintaba un rosa fantasma imposible de rastrear.
    const src = fs.readFileSync(
      path.join(RAIZ, 'packages/shared/src/branding/useTenantBranding.ts'),
      'utf8',
    );
    const m = src.match(/primaryColor:\s*config\.theme\?\.primaryColor\s*\|\|\s*'(#[0-9A-Fa-f]{6})'/);
    // Si el match falla, el toContain de abajo lo delata igual (fallback = '').
    const fallback = (m?.[1] || '').toUpperCase();
    expect(Object.values(shared)).toContain(fallback);
  });
});
