import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import resourcesToBackend from 'i18next-resources-to-backend';
import { initReactI18next } from 'react-i18next';
import { isRtlLang } from 'rtl-detect';

import { DEFAULT_LANG } from '@/const/locale';
import { getDebugConfig } from '@/envs/debug';
import { normalizeLocale } from '@/locales/resources';
import { isOnServerSide } from '@/utils/env';

const { I18N_DEBUG, I18N_DEBUG_BROWSER, I18N_DEBUG_SERVER } = getDebugConfig();
const debugMode = (I18N_DEBUG ?? isOnServerSide) ? I18N_DEBUG_SERVER : I18N_DEBUG_BROWSER;

export const createI18nNext = (lang?: string) => {
  const instance = i18n
    .use(initReactI18next)
    .use(LanguageDetector)
    .use(
      resourcesToBackend(async (lng: string, ns: string) => {
        try {
          // Idioma por defecto (zh-CN): usar imports estáticos TypeScript
          if (lng === 'zh-CN') {
            return await import(`./default/${ns}`);
          }

          // En SSR, las URLs relativas fallan en Node.js (no hay base URL)
          // El cliente cargará las traducciones correctamente desde el browser
          if (isOnServerSide) return {};

          const normalizedLng = normalizeLocale(lng);

          // Fetch desde /locales/ (public folder) - funciona en dev y prod
          // Next.js sirve public/ en ambos modos; evita problemas de webpack con dynamic import
          const url = `/locales/${normalizedLng}/${ns}.json`;
          try {
            const res = await fetch(url);
            if (!res.ok) return {};
            return await res.json();
          } catch {
            if (debugMode) console.warn(`[i18n] Prod: Error fetching "${url}"`);
            return {};
          }
        } catch (error) {
          if (debugMode) console.warn(`[i18n] Error cargando traducción ${lng}/${ns}:`, error);
          return {};
        }
      }),
    );
  // Dynamically set HTML direction on language change
  instance.on('languageChanged', (lng) => {
    if (typeof window !== 'undefined') {
      const direction = isRtlLang(lng) ? 'rtl' : 'ltr';
      document.documentElement.dir = direction;
    }
  });
  return {
    init: (params: { initAsync?: boolean } = {}) => {
      const { initAsync = true } = params;

      return instance.init({
        debug: debugMode,
        defaultNS: ['error', 'common', 'chat'],
        fallbackLng: DEFAULT_LANG,
        initAsync,
        interpolation: {
          escapeValue: false,
        },
        lng: lang,
        missingKeyHandler: (lng, ns, key) => {
          if (debugMode) {
            console.warn(`[i18n] Missing translation: ${lng}/${ns}/${key}`);
          }
        },
        ns: ['error', 'common', 'chat', 'editor', 'auth', 'setting', 'welcome', 'plugin', 'tool', 'file', 'image', 'topic', 'components', 'hotkey'],
        partialBundledLanguages: true,
      });
    },
    instance,
  };
};
