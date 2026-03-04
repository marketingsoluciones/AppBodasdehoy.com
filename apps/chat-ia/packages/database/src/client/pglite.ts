import { PGliteWorker } from '@electric-sql/pglite/worker';

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
