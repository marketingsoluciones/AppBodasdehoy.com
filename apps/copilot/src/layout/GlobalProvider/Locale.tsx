'use client';

import { ConfigProvider } from 'antd';
import dayjs from 'dayjs';
import { PropsWithChildren, memo, useEffect, useState } from 'react';
import { isRtlLang } from 'rtl-detect';

import { createI18nNext } from '@/locales/create';
import { isOnServerSide } from '@/utils/env';
import { getAntdLocale } from '@/utils/locale';

import Editor from './Editor';

const updateDayjs = async (lang: string) => {
  // load default lang
  let dayJSLocale;
  try {
    // dayjs locale is using `en` instead of `en-US`
    // refs: https://github.com/lobehub/lobe-chat/issues/3396
    // También convertir es-ES a es
    let locale = lang!.toLowerCase();
    if (locale === 'en-us') {
      locale = 'en';
    } else if (locale === 'es-es' || locale === 'es_es') {
      locale = 'es'; // dayjs usa 'es' no 'es-es'
    }

    dayJSLocale = await import(`dayjs/locale/${locale}.js`);
  } catch {
    // Silenciar el warning en producción o solo loguear en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.warn(`dayjs locale for ${lang} not found, fallback to en`);
    }
    dayJSLocale = await import(`dayjs/locale/en.js`);
  }

  dayjs.locale(dayJSLocale.default);
};

interface LocaleLayoutProps extends PropsWithChildren {
  antdLocale?: any;
  defaultLang?: string;
}

const Locale = memo<LocaleLayoutProps>(({ children, defaultLang, antdLocale }) => {
  const [i18n] = useState(createI18nNext(defaultLang));
  const [lang, setLang] = useState(defaultLang);
  const [locale, setLocale] = useState(antdLocale);

  // if run on server side, init i18n instance everytime
  if (isOnServerSide) {
    // use sync mode to init instantly
    i18n.init({ initAsync: false });

    // load the dayjs locale
    // if (lang) {
    //   const dayJSLocale = require(`dayjs/locale/${lang!.toLowerCase()}.js`);
    //
    //   dayjs.locale(dayJSLocale);
    // }
  } else {
    // if on browser side, init i18n instance only once
    if (!i18n.instance.isInitialized)
      // console.debug('locale', lang);
      i18n.init().then(async () => {
        if (!lang) return;

        await updateDayjs(lang);
      });
  }

  // ✅ Pre-cargar namespace 'error' explícitamente después de inicializar i18n
  useEffect(() => {
    if (!i18n.instance.isInitialized) return;
    
    // Pre-cargar namespace 'error' explícitamente para asegurar que esté disponible
    i18n.instance.loadNamespaces(['error']).catch(err => {
      console.warn('[Locale] Error pre-cargando namespace error:', err);
    });
  }, [i18n.instance.isInitialized]);

  // handle i18n instance language change
  useEffect(() => {
    const handleLang = async (lng: string) => {
      setLang(lng);

      if (lang === lng) return;

      const newLocale = await getAntdLocale(lng);
      setLocale(newLocale);

      await updateDayjs(lng);
      
      // ✅ Re-cargar namespace 'error' cuando cambia el idioma
      i18n.instance.loadNamespaces(['error']).catch(err => {
        console.warn('[Locale] Error re-cargando namespace error después de cambio de idioma:', err);
      });
    };

    i18n.instance.on('languageChanged', handleLang);
    return () => {
      i18n.instance.off('languageChanged', handleLang);
    };
  }, [i18n, lang]);

  // detect document direction
  const documentDir = isRtlLang(lang!) ? 'rtl' : 'ltr';

  return (
    <ConfigProvider
      direction={documentDir}
      locale={locale}
      theme={{
        components: {
          Button: {
            contentFontSizeSM: 12,
          },
        },
      }}
    >
      <Editor>{children}</Editor>
    </ConfigProvider>
  );
});

Locale.displayName = 'Locale';

export default Locale;
