const PREV_KEY = 'LOBE_GLOBAL';

// LOBE_PREFERENCE for userStore
// LOBE_GLOBAL_PREFERENCE for globalStore
type StorageKey = 'LOBE_PREFERENCE' | 'LOBE_SYSTEM_STATUS';

/**
 * Helper seguro para acceder a localStorage dentro de AsyncLocalStorage
 * Maneja casos donde localStorage no está disponible o está bloqueado
 */
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn(`⚠️ [AsyncLocalStorage] No se pudo leer localStorage (${key}):`, error);
      return null;
    }
  },
  setItem: (key: string, value: string): boolean => {
    if (typeof window === 'undefined') return false;
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn(`⚠️ [AsyncLocalStorage] No se pudo escribir localStorage (${key}):`, error);
      return false;
    }
  },
  removeItem: (key: string): boolean => {
    if (typeof window === 'undefined') return false;
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`⚠️ [AsyncLocalStorage] No se pudo eliminar localStorage (${key}):`, error);
      return false;
    }
  },
};

export class AsyncLocalStorage<State> {
  private storageKey: StorageKey;
  private cache: Map<string, State> = new Map();
  private cacheTimestamp: Map<string, number> = new Map();
  private readonly CACHE_TTL = 5000; // 5 segundos de cache en memoria

  constructor(storageKey: StorageKey) {
    this.storageKey = storageKey;

    // skip server side rendering
    if (typeof window === 'undefined') return;

    // migrate old data
    const prevData = safeLocalStorage.getItem(PREV_KEY);
    if (prevData) {
      try {
        const data = JSON.parse(prevData);
        const preference = data.state?.preference;

        if (preference) {
          safeLocalStorage.setItem('LOBE_PREFERENCE', JSON.stringify(preference));
        }
        safeLocalStorage.removeItem(PREV_KEY);
      } catch (error) {
        console.warn('⚠️ [AsyncLocalStorage] Error migrando datos antiguos:', error);
      }
    }
  }

  async saveToLocalStorage(state: object) {
    const data = await this.getFromLocalStorage();
    const merged = { ...data, ...state };

    // Actualizar cache en memoria
    this.cache.set(this.storageKey, merged as State);
    this.cacheTimestamp.set(this.storageKey, Date.now());

    safeLocalStorage.setItem(this.storageKey, JSON.stringify(merged));
  }

  async getFromLocalStorage(key: StorageKey = this.storageKey): Promise<State> {
    // ✅ OPTIMIZACIÓN 1: Verificar cache en memoria primero (0ms latencia)
    const cached = this.cache.get(key);
    const timestamp = this.cacheTimestamp.get(key);

    if (cached && timestamp && (Date.now() - timestamp < this.CACHE_TTL)) {
      console.log(`✅ [AsyncLocalStorage] Usando cache para ${key}`);
      return cached;
    }

    // ✅ OPTIMIZACIÓN 2: Timeout agresivo de 300ms para evitar bloqueos largos
    const timeoutMs = 300;

    return new Promise<State>((resolve) => {
      let resolved = false;

      // Timeout para retornar objeto vacío si tarda mucho
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          console.warn(`⚠️ [AsyncLocalStorage] Timeout al leer ${key} después de ${timeoutMs}ms, usando objeto vacío`);
          resolve({} as State);
        }
      }, timeoutMs);

      // ✅ OPTIMIZACIÓN 3: Usar requestIdleCallback si está disponible para no bloquear render crítico
      const parseData = () => {
        try {
          if (resolved) return;

          const start = Date.now();
          const item = safeLocalStorage.getItem(key);

          // ✅ OPTIMIZACIÓN 4: Verificar tamaño antes de parsear (prevenir parseo de data gigante)
          if (item && item.length > 1000000) { // 1MB
            console.warn(`⚠️ [AsyncLocalStorage] ${key} es muy grande (${(item.length / 1024).toFixed(2)}KB), limitando o usando objeto vacío`);

            // Intentar limpiar data vieja o corrupta
            safeLocalStorage.removeItem(key);

            if (!resolved) {
              resolved = true;
              clearTimeout(timeout);
              resolve({} as State);
            }
            return;
          }

          const parsed = item ? JSON.parse(item) : {};
          const elapsed = Date.now() - start;

          if (elapsed > 50) {
            console.warn(`⚠️ [AsyncLocalStorage] Parseo de ${key} tardó ${elapsed}ms`);
          }

          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);

            // Actualizar cache en memoria
            this.cache.set(key, parsed as State);
            this.cacheTimestamp.set(key, Date.now());

            console.log(`✅ [AsyncLocalStorage] ${key} cargado en ${elapsed}ms`);
            resolve(parsed as State);
          }
        } catch (error) {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            console.warn(`⚠️ [AsyncLocalStorage] Error parseando ${key}, usando objeto vacío:`, error);

            // Limpiar data corrupta
            safeLocalStorage.removeItem(key);

            resolve({} as State);
          }
        }
      };

      // Usar requestIdleCallback si está disponible (ejecuta cuando el navegador está idle)
      // Esto evita bloquear el render crítico
      if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(parseData, { timeout: timeoutMs });
      } else {
        // Fallback a queueMicrotask (menos ideal pero mejor que síncrono)
        queueMicrotask(parseData);
      }
    });
  }
}
