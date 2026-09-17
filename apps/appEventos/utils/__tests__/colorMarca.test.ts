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
/** El artefacto que las apps consumen de verdad. Gitignoreado: se compila, no viaja. */
const RUTA_DIST = path.join(RAIZ, 'packages/shared/dist/types/developments.js');

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
    //
    // CORRECCIÓN 17-09: este comentario decía que el viejo #F7628C "solo salía en
    // el trazo de un SVG". Es falso — hay 16 en appEventos y 47 en chat-ia. Dos de
    // ellas no eran decorativas: el respaldo de `themePrimary` en pages/login.tsx
    // (que es el primer paint de SSR, o sea visible en CADA carga del login) y el
    // último recurso de LoginStudio. Corregidas. Lo que queda es decorativo
    // (iconos SVG, paleta de un gráfico) y espera la decisión del barrido.
    expect(app['bodasdehoy']).toBe('#EF5B94');
    expect(shared['bodasdehoy']).toBe('#EF5B94');
  });

  it('el respaldo del login no pinta el rosa anterior', () => {
    // Se quitan los comentarios antes de buscar. La primera versión de este test se
    // pillaba a SÍ MISMA: el comentario de arriba nombra el color viejo para explicar
    // el arreglo, y el test lo leía como si fuera código. Un test que no distingue
    // prosa de código obliga a no volver a mencionar el problema por escrito, que es
    // justo lo contrario de lo que interesa.
    const sinComentarios = (src: string) =>
      src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    const rutas = ['pages/login.tsx', 'components/Forms/Login/LoginStudio.tsx'];
    const culpables = rutas.filter((r) =>
      sinComentarios(
        fs.readFileSync(path.join(RAIZ, 'apps/appEventos', r), 'utf8'),
      ).includes('#F7628C'),
    );
    expect(culpables).toEqual([]);
  });


  it('packages/shared/dist no se queda atrás de su fuente', () => {
    // EL FALLO MÁS CARO DEL 17-09, y no daba ningún síntoma.
    //
    // `packages/shared/dist/` está en .gitignore: ningún commit lo lleva y cada
    // checkout tiene el suyo. Las CUATRO apps consumen el paquete por su exports
    // map, que apunta solo a dist (appEventos lo saca incluso de transpilePackages
    // "tras migrar a dist build"). Ninguna resuelve a src.
    //
    // Resultado: el arreglo de colores estaba commiteado y revisado, y dist seguía
    // con los valores ANTERIORES en 7 de 11 marcas — bodasdehoy entre ellas. Nada
    // falla, nada avisa, y la pantalla sigue pintando el color viejo. Lo único que
    // lo arregla es recompilar (`cd packages/shared && npx tsc`), y lo único que
    // lo detecta es esto.
    //
    // Se salta si no hay dist (clon limpio o CI antes de compilar): ahí la ausencia
    // no es el fallo. El fallo es un dist PRESENTE y viejo, que es lo que engaña.
    if (!fs.existsSync(RUTA_DIST)) return;
    const dist = leerTabla(RUTA_DIST);
    const atrasadas = Object.keys(shared)
      .filter((m) => m in dist && dist[m] !== shared[m])
      .map((m) => `${m}: dist=${dist[m]} vs fuente=${shared[m]}`);
    expect(atrasadas).toEqual([]);
  });

  it('la variable de marca NO se define en términos de sí misma', () => {
    // Me lo hice yo al barrer los literales. `_app.tsx` publica
    // `--color-primary: ${themePrimary}`, y el barrido convirtió el respaldo de
    // `themePrimary` en `var(--color-primary,#EF5B94)`. Eso es una definición cíclica:
    // CSS la invalida, la variable se queda SIN valor, y entonces TODOS los var() de
    // la app caen a su respaldo. Resultado: bodasdehoy perfecta y las otras diez marcas
    // pintando rosa de bodasdehoy — exactamente lo contrario de para qué era el barrido.
    // Y no lo habría visto mirando bodasdehoy, que es lo que se mira siempre.
    const src = fs.readFileSync(path.join(RAIZ, 'apps/appEventos/pages/_app.tsx'), 'utf8');
    const sinComentarios = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    const asignaciones = sinComentarios
      .split('\n')
      .filter((l) => /const theme(Primary|Secondary|Tertiary|Base|Scroll)\s*=/.test(l))
      .filter((l) => l.includes('var(--color-'));
    expect(asignaciones).toEqual([]);
  });

  it('ningún respaldo de la variable de marca pinta un color ajeno', () => {
    // Había TRES respaldos y cada uno de un color distinto: #ec4899 (de ninguna marca)
    // en _app.tsx, #7C3AED (morado del prototipo) en el tailwind.css de chat y #F7628C
    // (el rosa anterior) en su vía de auto-auth. Cuando la variable no está resuelta,
    // el respaldo ES lo que se ve, así que tiene que ser un color de marca real.
    //
    // ESTE TEST MIRABA UNA LISTA FIJA DE TRES FICHEROS, y por eso se le escaparon 20
    // respaldos más: 10 en NewTypes.tsx, 8 en table-animations.css y 2 en el NotesPanel
    // de packages/shared, todos con el #ec4899 fantasma. Un guardián con lista curada
    // envejece en silencio: protege de lo que ya sabías y no de lo siguiente. Ahora
    // recorre el árbol entero, así que un fichero nuevo entra en el radar solo.
    const raices = [
      'apps/appEventos',
      'apps/chat-ia/src',
      'packages/shared/src',
      'packages/auth-ui/src',
      'packages/copilot-shared/src',
    ];
    const re = /var\(\s*--(?:color-primary|primary-color|color-brand[\w-]*)\s*,\s*(#[0-9A-Fa-f]{3,8})\s*\)/g;
    const colores = new Set(Object.values(shared).map((c) => c.toUpperCase()));
    const ajenos: string[] = [];

    const recorrer = (dir: string) => {
      let entradas: fs.Dirent[];
      try {
        entradas = fs.readdirSync(dir, { withFileTypes: true });
      } catch {
        return; // una raíz que no existe no es un fallo de color
      }
      for (const e of entradas) {
        // `._*` son AppleDouble (binarios) y reventaban la lectura en UTF-8.
        if (e.name.startsWith('._') || e.name === 'node_modules' || e.name.startsWith('.next')) continue;
        const ruta = path.join(dir, e.name);
        if (e.isDirectory()) {
          recorrer(ruta);
        } else if (/\.(tsx?|css)$/.test(e.name) && !e.name.includes('.test.')) {
          let txt: string;
          try {
            txt = fs.readFileSync(ruta, 'utf8');
          } catch {
            continue;
          }
          let m: RegExpExecArray | null;
          re.lastIndex = 0;
          while ((m = re.exec(txt)) !== null) {
            const hex = m[1].toUpperCase();
            if (hex.length === 7 && !colores.has(hex)) {
              ajenos.push(`${path.relative(RAIZ, ruta)}: ${hex}`);
            }
          }
        }
      }
    };
    for (const r of raices) recorrer(path.join(RAIZ, r));

    expect(ajenos).toEqual([]);
  });

  it('los cinco respaldos de _app coinciden con la tabla de bodasdehoy', () => {
    // Los cuatro de acompañamiento eran tonos de Tailwind (#f472b6, #f9a8d4, #ffffff,
    // #e5e7eb), restos de la misma familia que el #ec4899 del primario. Los reales de
    // bodasdehoy son verde menta (#87F3B5) y amarillo (#FBFF4E): al fallar la
    // resolución, el gradiente del login salía rosa-rosa-rosa en vez de
    // rosa-menta-amarillo. Y pages/login.tsx ya tenía los correctos, así que los dos
    // ficheros del mismo repo se contradecían sobre los colores de la misma marca.
    const campos: Array<[string, string]> = [
      ['primaryColor', 'themePrimary'],
      ['secondaryColor', 'themeSecondary'],
      ['tertiaryColor', 'themeTertiary'],
      ['baseColor', 'themeBase'],
      ['colorScroll', 'themeScroll'],
    ];
    const tabla = fs.readFileSync(RUTA_SHARED, 'utf8');
    const bloque = tabla.slice(tabla.indexOf("development: 'bodasdehoy'"));
    const app = fs.readFileSync(path.join(RAIZ, 'apps/appEventos/pages/_app.tsx'), 'utf8');
    const desalineados: string[] = [];
    for (const [campo, variable] of campos) {
      const esperado = bloque.match(new RegExp(`${campo}:\\s*['"](#[0-9A-Fa-f]{6})['"]`))?.[1];
      const usado = app
        .match(new RegExp(`const ${variable} = safeThemeValue\\([^)]*\\)\\s*\\|\\|\\s*'(#[0-9A-Fa-f]{6})'`))?.[1];
      if (!esperado || !usado) {
        desalineados.push(`${campo}: no se pudo leer (tabla=${esperado} app=${usado})`);
      } else if (esperado.toUpperCase() !== usado.toUpperCase()) {
        desalineados.push(`${campo}: _app usa ${usado} y la tabla dice ${esperado}`);
      }
    }
    expect(desalineados).toEqual([]);
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
