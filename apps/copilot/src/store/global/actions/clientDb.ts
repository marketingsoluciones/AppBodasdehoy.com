import { SWRResponse } from 'swr';
import type { StateCreator } from 'zustand/vanilla';

import { useOnlyFetchOnceSWR } from '@/libs/swr';
import type { GlobalStore } from '@/store/global';
import { DatabaseLoadingState, OnStageChange } from '@/types/clientDB';

type InitClientDBParams = { onStateChange: OnStageChange };
/**
 * 设置操作
 */
export interface GlobalClientDBAction {
  initializeClientDB: (params?: InitClientDBParams) => Promise<void>;
  markPgliteEnabled: () => void;
  useInitClientDB: (params?: InitClientDBParams) => SWRResponse;
}

export const clientDBSlice: StateCreator<
  GlobalStore,
  [['zustand/devtools', never]],
  [],
  GlobalClientDBAction
> = (set, get) => ({
  initializeClientDB: async (params) => {
    // ✅ MEDICIÓN: Iniciar medición de toda la inicialización de DB
    const { performanceMonitor } = await import('@/utils/performanceMonitor');
    performanceMonitor.startPhase('initializeClientDB');

    // if the db has started initialized or not error, just skip.
    if (
      get().initClientDBStage !== DatabaseLoadingState.Idle &&
      get().initClientDBStage !== DatabaseLoadingState.Error
    )
      return;

    // ✅ SOLUCIÓN RÁPIDA: Timeout reducido agresivamente - si tarda más de 30s, usar fallback
    const INIT_TIMEOUT = 30_000; // ✅ Reducido de 60s a 30s (30 segundos) - respuesta más rápida

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        const currentStage = get().initClientDBStage;
        // Solo marcar como error si todavía está en proceso (no está Ready ni Error)
        if (currentStage !== DatabaseLoadingState.Ready && currentStage !== DatabaseLoadingState.Error) {
          console.error('❌ Timeout: initializeClientDB tardó más de 30 segundos');
          set({
            initClientDBError: {
              message: 'Timeout: La inicialización de la base de datos tardó más de 30 segundos',
              name: 'TimeoutError',
              stack: new Error().stack,
            },
            initClientDBStage: DatabaseLoadingState.Error,
          });
          params?.onStateChange?.(DatabaseLoadingState.Error);
        }
        performanceMonitor.endPhase('initializeClientDB');
        reject(new Error('Timeout: initializeClientDB tardó más de 30 segundos'));
      }, INIT_TIMEOUT);
    });

    try {
      const { initializeDB } = await import('@/database/client/db');
      await Promise.race([
        initializeDB({
          onError: ({ error, migrationsSQL, migrationTableItems }) => {
            set({
              initClientDBError: error,
              initClientDBMigrations: {
                sqls: migrationsSQL,
                tableRecords: migrationTableItems,
              },
            });
          },
          onProgress: (data) => {
            set({ initClientDBProcess: data });
          },
          onStateChange: (state) => {
            // ✅ MEDICIÓN: Medir cada cambio de estado
            const stateName = `DB_${state}`;
            if (!performanceMonitor['startTimes'].has(stateName)) {
              performanceMonitor.startPhase(stateName);
            } else {
              performanceMonitor.endPhase(stateName);
            }

            set({ initClientDBStage: state });
            params?.onStateChange?.(state);
          },
        }),
        timeoutPromise,
      ]);

      // ✅ MEDICIÓN: Finalizar medición cuando termine exitosamente
      performanceMonitor.endPhase('initializeClientDB');
    } catch (error) {
      // Si hay un error (incluyendo timeout), asegurarse de que el estado sea Error
      const currentStage = get().initClientDBStage;
      if (currentStage !== DatabaseLoadingState.Ready && currentStage !== DatabaseLoadingState.Error) {
        console.error('❌ Error en initializeClientDB:', error);
        set({
          initClientDBError: {
            message: error instanceof Error ? error.message : String(error),
            name: error instanceof Error ? error.name : 'Error',
            stack: error instanceof Error ? error.stack : undefined,
          },
          initClientDBStage: DatabaseLoadingState.Error,
        });
        params?.onStateChange?.(DatabaseLoadingState.Error);
      }
      performanceMonitor.endPhase('initializeClientDB');
      throw error;
    }
  },
  markPgliteEnabled: async () => {
    get().updateSystemStatus({ isEnablePglite: true });

    if (navigator.storage && !!navigator.storage.persist) {
      // 1. Check if persistent permission has been obtained
      const isPersisted = await navigator.storage.persisted();

      // 2. If the persistent permission has not been obtained, request permission
      if (!isPersisted) {
        await navigator.storage.persist();
      }
    }
  },
  useInitClientDB: (params) =>
    useOnlyFetchOnceSWR('initClientDB', () => get().initializeClientDB(params)),
});
