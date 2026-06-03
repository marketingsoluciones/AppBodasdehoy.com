import { describe, expect, it } from 'vitest';

import { mapApiIaSession, mapApiIaSessionsToList } from './api-ia.mappers';

/**
 * Tests del CONTRATO de los mapeadores api-ia → tipos del store. Verifican que el front
 * tolera variaciones de nombre de campo (id|_id|sessionId, title|name|meta.title) sin romper
 * el render de la lista de conversaciones. Cuando BACKEND confirme el shape, ajustar si hace falta.
 */
describe('api-ia mappers', () => {
  it('mapApiIaSession: acepta id directo y title', () => {
    const s = mapApiIaSession({ id: 'sess-1', title: 'Mi boda', updatedAt: 1700000000000 });
    expect(s.id).toBe('sess-1');
    expect(s.meta.title).toBe('Mi boda');
    expect(s.type).toBe('agent');
    expect(s.updatedAt).toBeInstanceOf(Date);
  });

  it('mapApiIaSession: tolera _id y name como fallback', () => {
    const s = mapApiIaSession({ _id: 'sess-2', name: 'Evento X' });
    expect(s.id).toBe('sess-2');
    expect(s.meta.title).toBe('Evento X');
  });

  it('mapApiIaSession: tolera sessionId y meta.title', () => {
    const s = mapApiIaSession({ meta: { title: 'Desde meta' }, sessionId: 'sess-3' });
    expect(s.id).toBe('sess-3');
    expect(s.meta.title).toBe('Desde meta');
  });

  it('mapApiIaSessionsToList: agrupa en lista vacía de grupos y filtra sin id', () => {
    const list = mapApiIaSessionsToList([
      { id: 'a', title: 'A' },
      { title: 'sin id' }, // debe filtrarse
      { _id: 'c', name: 'C' },
    ]);
    expect(list.sessionGroups).toEqual([]);
    expect(list.sessions.map((s) => s.id)).toEqual(['a', 'c']);
  });

  it('mapApiIaSessionsToList: undefined → lista vacía segura', () => {
    const list = mapApiIaSessionsToList(undefined);
    expect(list.sessions).toEqual([]);
    expect(list.sessionGroups).toEqual([]);
  });
});
