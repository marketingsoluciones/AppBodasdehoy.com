import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * Que ningún fichero de la bandeja se quede sin que nadie lo importe.
 *
 * No es higiene: es la única señal de una pérdida que nada más detecta. El 18-09 el panel
 * central de la bandeja y todos los indicadores de fila llevaban un día revertidos EN
 * PRODUCCIÓN, porque un merge del barrido de color partía de una versión anterior y ganó
 * limpiamente. Git no avisa cuando decide bien —solo cuando no sabe decidir—, los tests
 * siguieron en verde porque prueban componentes que nadie tocó, y la revisión del merge contó
 * lo que el merge APORTABA en vez de lo que se llevaba.
 *
 * Lo único que lo delató fue esto: un fichero que existe y al que nadie llama. El código vivo
 * que se vuelve muerto sigue pareciendo correcto visto de cerca; solo se nota mirando quién
 * lo usa.
 *
 * Si esta prueba falla, hay dos posibilidades y conviene distinguirlas antes de tocar nada:
 *   · el fichero es un resto que hay que borrar, o
 *   · alguien se comió la línea que lo importaba, y lo que falta es esa línea.
 */

const BANDEJA = join(__dirname, '..');
const SRC = join(BANDEJA, '..', '..', '..', '..');

/** Puntos de entrada de Next: los llama el framework, no un import. */
const ENTRADAS = new Set(['page', 'layout', 'template', 'error', 'loading', 'not-found', 'route']);

/**
 * Un `index.ts` se importa por el nombre de su CARPETA, no por "index", así que buscarlo por
 * nombre lo daría siempre por huérfano. Hoy la bandeja no tiene ninguno —comprobado—, pero la
 * exclusión va puesta para que el día que alguien añada un barril no se encuentre con una
 * prueba roja que no entiende y acabe desactivándola. (Aviso del otro frente al llevarse esta
 * prueba a appEventos, donde sí hay barriles.)
 */
const ES_BARRIL = (nombre: string) => nombre === 'index';

function ficheros(dir: string, acc: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (e.startsWith('._') || e === 'node_modules') continue;
    if (statSync(p).isDirectory()) ficheros(p, acc);
    else if (/\.tsx?$/.test(e) && !e.includes('.test.')) acc.push(p);
  }
  return acc;
}

describe('ningún fichero de la bandeja se queda huérfano', () => {
  it('todo lo que existe lo importa alguien', () => {
    const propios = ficheros(BANDEJA);
    const todos = ficheros(SRC);
    const contenido = new Map(todos.map((f) => [f, readFileSync(f, 'utf8')]));

    const huerfanos = propios.filter((f) => {
      const nombre = f.split('/').pop()!.replace(/\.tsx?$/, '');
      if (ENTRADAS.has(nombre) || ES_BARRIL(nombre)) return false;
      // `from '<lo que sea>/nombre'` en cualquier otro fichero del proyecto.
      const patron = new RegExp(`from\\s+['"][^'"]*/${nombre}['"]`);
      for (const [otro, texto] of contenido) {
        if (otro !== f && patron.test(texto)) return false;
      }
      return true;
    });

    expect(huerfanos.map((f) => f.slice(BANDEJA.length + 1))).toEqual([]);
  });
});
