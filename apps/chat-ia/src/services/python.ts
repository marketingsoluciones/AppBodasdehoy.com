import { CodeInterpreterResponse } from '@lobechat/types';

/**
 * Python Interpreter — STUB tras eliminación del package interno (2026-05-19).
 *
 * El package pyodide pesaba ~12MB al bundle y solo se usa para la tool
 * `lobe-code-interpreter` que NO está habilitada en producción bodasdehoy.
 *
 * Cuando api-ia exponga un endpoint `POST /webapi/code/execute` (sandbox
 * server-side), este service llamará a ese endpoint en vez de ejecutar
 * Python en el browser via Pyodide WASM.
 *
 * Mientras tanto, runPython devuelve undefined → la tool muestra "feature
 * no disponible en web" y la UI no rompe.
 */
class PythonService {
  async runPython(
    _code: string,
    _packages: string[],
    _files: File[],
  ): Promise<CodeInterpreterResponse | undefined> {
    if (typeof Worker === 'undefined') return;
    console.warn(
      '[python.ts] Code Interpreter no disponible en build web. ' +
        'Pendiente endpoint POST /webapi/code/execute en api-ia.',
    );
    return undefined;
  }
}

export const pythonService = new PythonService();
