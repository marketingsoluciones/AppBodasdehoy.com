/**
 * i18n Configuration for copilot-shared components
 * 
 * Simple configuration that exports translations for components to use.
 * Apps using these components can integrate with their own i18n system
 * (e.g., i18next, react-intl, etc.)
 */

import esES from './locales/es-ES/common.json';
import enUS from './locales/en-US/common.json';

export type Locale = 'es-ES' | 'en-US';

export interface Translations {
  chat: {
    input: {
      placeholder: string;
      placeholderWithShortcut: string;
      send: string;
      sending: string;
    };
    message: {
      copy: string;
      copied: string;
      delete: string;
      edit: string;
      retry: string;
      user: string;
      assistant: string;
      error: string;
    };
    list: {
      loading: string;
      empty: string;
      emptyDescription: string;
      loadMore: string;
    };
    actions: {
      viewComplete: string;
      openInNewTab: string;
      close: string;
    };
  };
  common: {
    loading: string;
    error: string;
    success: string;
    cancel: string;
    confirm: string;
    save: string;
  };
}

/**
 * Available translations
 */
export const translations: Record<Locale, Translations> = {
  'es-ES': esES as Translations,
  'en-US': enUS as Translations,
};

/**
 * Default locale
 */
export const defaultLocale: Locale = 'es-ES';

/**
 * Get translations for a locale
 */
export const getTranslations = (locale: Locale = defaultLocale): Translations => {
  return translations[locale] || translations[defaultLocale];
};

/**
 * Simple translation function
 * Usage: t('chat.input.placeholder', locale)
 */
export const t = (key: string, locale: Locale = defaultLocale): string => {
  const trans = getTranslations(locale);
  const keys = key.split('.');
  let value: any = trans;

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return key; // Return key if translation not found
    }
  }

  return typeof value === 'string' ? value : key;
};

/**
 * Export individual locales for convenience
 */
export { esES, enUS };
