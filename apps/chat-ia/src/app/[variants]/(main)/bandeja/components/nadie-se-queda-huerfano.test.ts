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
      if (ENTRADAS.has(nombre)) return false;
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
