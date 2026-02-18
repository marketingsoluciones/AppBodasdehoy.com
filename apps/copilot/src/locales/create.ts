import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import resourcesToBackend from 'i18next-resources-to-backend';
import { initReactI18next } from 'react-i18next';
import { isRtlLang } from 'rtl-detect';

import { DEFAULT_LANG } from '@/const/locale';
import { getDebugConfig } from '@/envs/debug';
import { normalizeLocale } from '@/locales/resources';
import { isDev, isOnServerSide } from '@/utils/env';

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

          const normalizedLng = normalizeLocale(lng);

          if (isDev) {
            // En desarrollo: dynamic import (webpack puede resolver en dev mode)
            const translationPath = `../../locales/${normalizedLng}/${ns}.json`;
            try {
              return await import(translationPath);
            } catch {
              if (debugMode) console.warn(`[i18n] Dev: Namespace "${ns}" no encontrado para "${lng}"`);
              return {};
            }
          }

          // En producción: fetch estático desde /locales/ (public folder)
          // Los archivos JSON están en public/locales/ servidos estáticamente por Next.js
          // Evita conflictos con el proxy genérico /api/:path* y problemas de webpack
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
        
        // detection: {
//   caches: ['cookie'],
//   cookieMinutes: 60 * 24 * COOKIE_CACHE_DAYS,
//   /**
//      Set `sameSite` to `lax` so that the i18n cookie can be passed to the
//      server side when returning from the OAuth authorization website.
//      ref: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie#samesitesamesite-value
//      discussion: https://github.com/lobehub/lobe-chat/pull/1474
//   */
//   cookieOptions: {
//     sameSite: 'lax',
//   },
//   lookupCookie: LOBE_LOCALE_COOKIE,
// },
fallbackLng: DEFAULT_LANG,
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
initAsync,

        
interpolation: {
          escapeValue: false,
        },
        
lng: lang,
        
// ✅ FIX: Manejar errores de carga de forma silenciosa
missingKeyHandler: (lng, ns, key) => {
          if (debugMode) {
            console.warn(`[i18n] Missing translation: ${lng}/${ns}/${key}`);
          }
        },
        
        // ✅ FIX: Evitar que intente cargar namespaces que no existen
ns: ['error', 'common', 'chat', 'editor', 'auth', 'setting'],
        // ✅ FIX: No fallar si un namespace no existe
        partialBundledLanguages: true,
      });
    },
    instance,
  };
};
