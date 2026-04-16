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

    safeLocalStorage.setItem(this.storageKey, JSON.stringify({ ...data, ...state }));
  }

  async getFromLocalStorage(key: StorageKey = this.storageKey): Promise<State> {
    // ✅ CORRECCIÓN: Hacer el parseo verdaderamente asíncrono para no bloquear el render
    // Usar queueMicrotask para diferir el parseo y permitir que el render continúe
    return new Promise<State>((resolve) => {
      queueMicrotask(() => {
        try {
          const item = safeLocalStorage.getItem(key);
          const parsed = item ? JSON.parse(item) : {};
          resolve(parsed as State);
        } catch (error) {
          // Si hay error al parsear, retornar objeto vacío
          console.warn(`⚠️ [AsyncLocalStorage] Error parseando ${key}, usando objeto vacío:`, error);
          resolve({} as State);
        }
      });
    });
  }
}
