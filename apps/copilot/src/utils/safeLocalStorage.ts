/**
 * Helper seguro para acceder a localStorage
 * Maneja casos donde localStorage no está disponible o está bloqueado
 *
 * Casos comunes donde localStorage puede fallar:
 * - Navegación en modo incógnito (algunos navegadores)
 * - iframes con restricciones de seguridad
 * - Configuración de privacidad del navegador
 * - Quotas excedidas
 */

export const safeLocalStorage = {
  
  /**
   * Limpia todo el localStorage de forma segura
   * @returns true si se limpió exitosamente, false en caso contrario
   */
clear: (): boolean => {
    if (typeof window === 'undefined') return false;

    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.warn('⚠️ No se pudo limpiar localStorage:', error);
      return false;
    }
  },

  
  

/**
   * Lee un valor de localStorage de forma segura
   * @returns El valor almacenado o null si no está disponible
   */
getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;

    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn(`⚠️ No se pudo leer de localStorage (${key}):`, error);
      return null;
    }
  },

  
  

/**
   * Elimina un valor de localStorage de forma segura
   * @returns true si se eliminó exitosamente, false en caso contrario
   */
removeItem: (key: string): boolean => {
    if (typeof window === 'undefined') return false;

    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`⚠️ No se pudo eliminar de localStorage (${key}):`, error);
      return false;
    }
  },

  
  /**
   * Escribe un valor en localStorage de forma segura
   * @returns true si se guardó exitosamente, false en caso contrario
   */
setItem: (key: string, value: string): boolean => {
    if (typeof window === 'undefined') return false;

    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn(`⚠️ No se pudo escribir en localStorage (${key}):`, error);
      return false;
    }
  },
};
