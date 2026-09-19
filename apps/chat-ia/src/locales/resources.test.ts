import { describe, expect, it } from 'vitest';

import { normalizeLocale } from './resources';

describe('normalizeLocale', () => {
  it('should return "en-US" when locale is undefined', () => {
    expect(normalizeLocale()).toBe('en-US');
  });

  it('should return "zh-CN" when locale is "zh-CN"', () => {
    expect(normalizeLocale('es-ES')).toBe('es-ES');
  });

  it('should return "zh-CN" when locale is "zh"', () => {
    expect(normalizeLocale('zh')).toBe('es-ES');
  });

  it('should return "de-DE" when locale is "de"', () => {
    expect(normalizeLocale('de')).toBe('es-ES');
  });

  it('should return "ru-RU" when locale is "ru"', () => {
    expect(normalizeLocale('ru')).toBe('es-ES');
  });

  it('should return "ar" when locale is "ar-EG"', () => {
    expect(normalizeLocale('es-ES')).toBe('es-ES');
    expect(normalizeLocale('ar-EG')).toBe('es-ES');
  });

  it('should return "en-US" when locale is "en"', () => {
    expect(normalizeLocale('en')).toBe('en-US');
  });

  it('should return the input locale for other valid locales', () => {
    expect(normalizeLocale('es-ES')).toBe('es-ES');
    expect(normalizeLocale('es-ES')).toBe('es-ES');
    expect(normalizeLocale('es-ES')).toBe('es-ES');
    expect(normalizeLocale('pt-BR')).toBe('pt-BR');
    expect(normalizeLocale('es-ES')).toBe('es-ES');
    expect(normalizeLocale('es-ES')).toBe('es-ES');
    expect(normalizeLocale('es-ES')).toBe('es-ES');
  });

  it('should return the input locale for unknown locales', () => {
    expect(normalizeLocale('unknown')).toBe('en-US');
    expect(normalizeLocale('fr')).toBe('es-ES');
  });
});
