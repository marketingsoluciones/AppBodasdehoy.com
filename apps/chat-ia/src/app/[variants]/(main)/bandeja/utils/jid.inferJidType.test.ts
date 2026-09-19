/**
 * jid.inferJidType.test.ts — regresión del ruido en la Bandeja (24-ago).
 *
 * Los filtros anti-spam (page.tsx + ConversationList.tsx) comparan `jidType`
 * contra 'newsletter'/'broadcast'. api-mcp manda ese campo; api-ia NO (su
 * /api/messages/conversations devuelve `{contact:{name,phone}}` y nada más).
 * Al llegar `null`, `null !== 'newsletter'` es true y el filtro NO ocultaba
 * nada: los estados de difusión y los canales de novedades se colaban en la
 * bandeja del organizador (medido: 618 de 622 no-leídos no eran clientes).
 *
 * inferJidType rellena el hueco SIN inventar: si no puede clasificar, null.
 */
import { describe, expect, it } from 'vitest';

import { inferJidType } from './jid';

describe('inferJidType', () => {
  it('respeta el valor del backend cuando existe (api-mcp es la fuente de verdad)', () => {
    expect(inferJidType('group', '120363242494972533')).toBe('group');
    // aunque la heurística diría otra cosa, gana el backend
    expect(inferJidType('user', 'status')).toBe('user');
    expect(inferJidType('lid', '34600111222')).toBe('lid');
  });

  it('clasifica el canal de estados de WhatsApp como difusión', () => {
    // el caso real: 103 no-leídos colgando de un "contacto" llamado status
    expect(inferJidType(null, 'status', 'status')).toBe('broadcast');
  });

  it('clasifica los JID largos como canal, no como teléfono', () => {
    // 18 dígitos: grupos y canales de WhatsApp. No son un número al que responder.
    expect(inferJidType(undefined, '120363242494972533')).toBe('newsletter');
    expect(inferJidType(undefined, '', '120363164043971375')).toBe('newsletter');
  });

  it('deja pasar los teléfonos de verdad como persona', () => {
    expect(inferJidType(null, '34600111222')).toBe('user');
    expect(inferJidType(null, '5212345678')).toBe('user');
  });

  it('no inventa cuando no puede saberlo', () => {
    expect(inferJidType(null, 'conv_1775805823070_7ozra')).toBeNull();
    expect(inferJidType(null, '')).toBeNull();
    expect(inferJidType(null, null, undefined)).toBeNull();
  });

  it('usa el primer candidato con contenido (nombre antes que teléfono)', () => {
    // en api-ia name y phone suelen venir iguales; si el nombre es real, no
    // clasifica por él salvo que parezca identificador
    expect(inferJidType(null, null, 'status')).toBe('broadcast');
    expect(inferJidType(null, '', '', '34600111222')).toBe('user');
  });
});
