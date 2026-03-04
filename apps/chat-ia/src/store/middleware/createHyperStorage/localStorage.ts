import { StorageValue } from 'zustand/middleware';

export const createLocalStorage = <State extends any>() => ({
  getItem: <T extends State>(name: string): StorageValue<T> | undefined => {
    if (!global.localStorage) return undefined;
    const string = localStorage.getItem(name);

    if (string) {
      // ✅ FIX: Manejo robusto de parsing JSON con validación
      try {
        // Validar que sea JSON válido antes de parsear
        const trimmed = string.trim();
        if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
          console.warn(`⚠️ [localStorage] Valor en "${name}" no parece ser JSON válido, limpiando...`);
          localStorage.removeItem(name);
          return undefined;
        }
        return JSON.parse(trimmed) as StorageValue<T>;
      } catch (parseError) {
        console.error(`❌ [localStorage] Error parseando "${name}":`, parseError);
        console.warn(`⚠️ [localStorage] Limpiando valor corrupto en "${name}"...`);
        // Limpiar el valor corrupto para evitar errores futuros
        localStorage.removeItem(name);
        return undefined;
      }
    }

    return undefined;
  },
  removeItem: (name: string) => {
    if (global.localStorage) localStorage.removeItem(name);
  },
  setItem: <T extends State>(name: string, state: T, version: number | undefined) => {
    if (global.localStorage) localStorage.setItem(name, JSON.stringify({ state, version }));
  },
});
