import { supportLocales } from '@/locales/resources';

// BUG QA 17-jul: fuente única del idioma default. Antes 'en-US' → nuevos
// usuarios (sin cookie) veían la UI en inglés aunque Bodas de Hoy es una
// app en español. Además `parseBrowserLanguage` corta en `if (defaultLang
// !== 'en-US') return defaultLang;` — con 'en-US' el sistema consulta
// Accept-Language del browser (bots dan en-US) y ahí perpetuaba el inglés.
// Cambiado a 'es-ES': la función devuelve inmediatamente ES sin pasar por
// Accept-Language.
export const DEFAULT_LANG = 'es-ES';
export const LOBE_LOCALE_COOKIE = 'LOBE_LOCALE';

/**
 * Check if the language is supported
 * @param locale
 */
export const isLocaleNotSupport = (locale: string) => !supportLocales.includes(locale);
