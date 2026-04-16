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
    // Cache en memoria primero (0ms latencia)
    const cached = this.cache.get(key);
    const timestamp = this.cacheTimestamp.get(key);

    if (cached && timestamp && (Date.now() - timestamp < this.CACHE_TTL)) {
      return cached;
    }

    // localStorage.getItem es síncrono y tarda <1ms — leer directamente.
    // requestIdleCallback era incorrecto aquí: espera al idle del navegador,
    // que durante el page load puede tardar 300-900ms y bloquear la UI.
    try {
      const item = safeLocalStorage.getItem(key);

      // Limpiar datos corruptos/gigantes (>1MB)
      if (item && item.length > 1_000_000) {
        console.warn(`⚠️ [AsyncLocalStorage] ${key} excede 1MB, limpiando`);
        safeLocalStorage.removeItem(key);
        return {} as State;
      }

      const parsed = item ? JSON.parse(item) : {};

      this.cache.set(key, parsed as State);
      this.cacheTimestamp.set(key, Date.now());

      return parsed as State;
    } catch {
      safeLocalStorage.removeItem(key);
      return {} as State;
    }
  }
}
