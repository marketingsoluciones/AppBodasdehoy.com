// SPRINT-AT: type-only import + dynamic runtime para que el chunk lazy de pglite
// NO arrastre @electric-sql/pglite/worker estáticamente al evaluar el módulo.
// El runtime se carga solo cuando initPgliteWorker se invoca (idem al patrón
// usado en db.ts:382 con await import('./pglite')).
import type { PGliteWorker } from '@electric-sql/pglite/worker';

import { InitMeta } from './type';

// Helper para crear timeout
const createTimeout = (ms: number, message: string): Promise<never> => {
  return new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`Timeout: ${message} después de ${ms}ms`)), ms);
  });
};

export const initPgliteWorker = async (meta: InitMeta) => {
  try {
    // ✅ Agregar timeout a la creación del worker
    const WORKER_TIMEOUT = 15000; // 15 segundos

    // Dynamic import: runtime de @electric-sql/pglite/worker solo cuando se invoca init.
    const { PGliteWorker } = await import('@electric-sql/pglite/worker');

    const createPromise = PGliteWorker.create(
      new Worker(new URL('pglite.worker.ts', import.meta.url)),
      { meta },
    );

    const timeoutPromise = createTimeout(WORKER_TIMEOUT, 'Creación de PGlite Worker');

    const worker = await Promise.race([createPromise, timeoutPromise]);

    // 监听 worker 状态变化
    worker.onLeaderChange(() => {
      console.log('Worker leader changed, isLeader:', worker?.isLeader);
    });

    return worker as PGliteWorker;
  } catch (error) {
    console.error('❌ Error inicializando PGlite Worker:', error);
    throw error;
  }
};
