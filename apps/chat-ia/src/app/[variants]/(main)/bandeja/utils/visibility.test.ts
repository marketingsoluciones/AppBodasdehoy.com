import { describe, expect, it } from 'vitest';

import { describeVisibility, readSharedWith } from './visibility';

describe('describeVisibility', () => {
  it('no afirma nada cuando no hay comparticiones', () => {
    // La línea del negocio es bandeja de equipo: decir "Privada" sería engañoso.
    expect(describeVisibility([])).toBeNull();
    expect(describeVisibility(null)).toBeNull();
    expect(describeVisibility(undefined)).toBeNull();
  });

  it('cuenta usuarios y equipos', () => {
    const d = describeVisibility([
      { principalType: 'user', principalId: 'u1' },
      { principalType: 'team', principalId: 't1' },
    ]);
    expect(d?.label).toBe('Compartida · 2');
    expect(d?.title).toBe('Compartida con 1 usuario y 1 equipo');
  });

  it('cuando solo hay equipos lo dice en corto', () => {
    expect(describeVisibility([{ principalType: 'team', principalId: 't1' }])?.label).toBe('Equipo');
    expect(
      describeVisibility([
        { principalType: 'team', principalId: 't1' },
        { principalType: 'team', principalId: 't2' },
      ])?.label,
    ).toBe('2 equipos');
  });
});

describe('readSharedWith', () => {
  it('acepta snake_case de api-ia y camelCase de api-mcp', () => {
    expect(readSharedWith({ shared_with: [{ principal_type: 'user', principal_id: 'u1' }] })).toEqual([
      { permission: null, principalId: 'u1', principalType: 'user' },
    ]);
    expect(readSharedWith({ sharedWith: [{ principalType: 'team', principalId: 't1' }] })).toEqual([
      { permission: null, principalId: 't1', principalType: 'team' },
    ]);
  });

  it('devuelve lista vacía si el campo no viene o no es lista', () => {
    expect(readSharedWith({})).toEqual([]);
    expect(readSharedWith({ shared_with: 'nope' })).toEqual([]);
    expect(readSharedWith(null)).toEqual([]);
  });
});
