import { describe, expect, it } from 'vitest';

import { normalizeMessage } from './useMessages';

/**
 * Los ✓ dicen tres cosas distintas y no se pueden inventar: ✓ salió de aquí, ✓✓ llegó al
 * teléfono, ✓✓ azul lo leyó. Hasta el 17-09 un mensaje sin estado del servidor se pintaba
 * como leído, que es la afirmación más fuerte de las tres, y ningún dato la sostenía.
 */
describe('estado de los mensajes', () => {
  it('no da por leído un mensaje que llega sin estado', () => {
    const m = normalizeMessage({ fromUser: false, id: 'm1', text: 'hola' });
    expect(m.status).not.toBe('read');
  });

  it('un mensaje nuestro sin estado consta como enviado, no como entregado', () => {
    const m = normalizeMessage({ fromUser: false, id: 'm2', text: 'hola' });
    expect(m.status).toBe('sent');
  });

  it('a un mensaje entrante no se le pone acuse: no aplica', () => {
    const m = normalizeMessage({ fromUser: true, id: 'm3', text: 'hola' });
    expect(m.status).toBeUndefined();
  });

  it('respeta el estado que sí manda el servidor', () => {
    const m = normalizeMessage({ fromUser: false, id: 'm4', status: 'read', text: 'hola' });
    expect(m.status).toBe('read');
  });
});
