import { DEFAULT_LANG } from '@/const/locale';

import resources from './default';

// SPRINT-BG 2026-05-20: reducidos 18 → 3 locales.
// chat-ia bodasdehoy es plataforma whitelabel para 11 tenants hispanohablantes
// (España + México timezones). Otros 15 idiomas (LobeChat upstream) NO usados.
// Public/locales/* dirs eliminados (~11MB ahorro). Si futuro tenant requiere
// otro idioma, restaurar dir + añadir aquí.
export const locales = ['en-US', 'es-ES', 'pt-BR'] as const;

export type DefaultResources = typeof resources;
export type NS = keyof DefaultResources;
export type Locales = (typeof locales)[number];

export const normalizeLocale = (locale?: string): Locales => {
  if (!locale) return DEFAULT_LANG;

  for (const l of locales) {
    if (l.startsWith(locale)) {
      return l;
    }
  }

  return DEFAULT_LANG;
};

type LocaleOptions = {
  label: string;
  value: Locales;
}[];

export const localeOptions: LocaleOptions = [
  {
    label: 'English',
    value: 'en-US',
  },
  {
    label: 'Español',
    value: 'es-ES',
  },
  {
    label: 'Português',
    value: 'pt-BR',
  },
] as LocaleOptions;

export const supportLocales: string[] = [...locales, 'en', 'es', 'pt'];
