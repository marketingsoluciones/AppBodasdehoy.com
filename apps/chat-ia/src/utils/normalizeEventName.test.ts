import { describe, expect, it } from 'vitest';

import { eventNamesMatch, normalizeEventName } from './normalizeEventName';

describe('normalizeEventName', () => {
  it('quita acentos españoles', () => {
    expect(normalizeEventName('Boda de María')).toBe('boda de maria');
    expect(normalizeEventName('Cumpleaños de Ñoño')).toBe('cumpleanos de nono');
    expect(normalizeEventName('Comunión de José')).toBe('comunion de jose');
  });

  it('colapsa espacios múltiples y trim', () => {
    expect(normalizeEventName('  BODA   DE MARIA  ')).toBe('boda de maria');
    expect(normalizeEventName('\tBoda\n\ndel siglo')).toBe('boda del siglo');
  });

  it('devuelve string vacío para null/undefined/vacío', () => {
    expect(normalizeEventName(null)).toBe('');
    expect(normalizeEventName(undefined)).toBe('');
    expect(normalizeEventName('')).toBe('');
    expect(normalizeEventName('   ')).toBe('');
  });
});

describe('eventNamesMatch', () => {
  it('empareja variaciones acento/case/espacios', () => {
    expect(eventNamesMatch('Boda de María', 'boda de maria')).toBe(true);
    expect(eventNamesMatch('BODA DE MARIA', '  boda de maría  ')).toBe(true);
  });

  it('no empareja nombres distintos', () => {
    expect(eventNamesMatch('Boda de María', 'Boda de Juan')).toBe(false);
  });

  it('nunca empareja strings vacíos (evita match espurio)', () => {
    expect(eventNamesMatch(null, undefined)).toBe(false);
    expect(eventNamesMatch('', '')).toBe(false);
    expect(eventNamesMatch(null, 'Boda')).toBe(false);
  });
});
