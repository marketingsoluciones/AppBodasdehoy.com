import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Hook seguro para traducciones que siempre retorna valores válidos
 * incluso si i18n no está inicializado o las traducciones fallan
 *
 * @param ns - Namespace de traducción (default: 'error')
 * @returns Objeto con función `t` segura y instancia de i18n
 */
export const useSafeTranslation = (ns = 'error') => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { t: rawT, i18n } = useTranslation(ns as any);

  const safeT = useCallback(
    (key: string, fallback?: string): string => {
      // Si i18n no está inicializado, retornar fallback o la key
      if (!i18n.isInitialized) {
        return fallback || key;
      }

      // Intentar obtener la traducción
      const translated = String(rawT(key as any));

      // Si la traducción no se resolvió (retorna la key), usar fallback si está disponible
      if (translated === key && fallback) {
        return fallback;
      }

      // Si la traducción se resolvió pero contiene el formato de key (error.title), usar fallback
      if (translated.includes('error.') && fallback) {
        return fallback;
      }

      return translated;
    },
    [rawT, i18n.isInitialized],
  );

  return { i18n, t: safeT };
};
