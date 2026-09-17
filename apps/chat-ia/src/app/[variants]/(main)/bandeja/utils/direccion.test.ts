import { describe, expect, it } from 'vitest';

import { DEL_CONTACTO_SI_NO_CONSTA, esDelContacto } from './direccion';

/**
 * El caso que motiva estas pruebas: por SSE, un mensaje con `direction: 'outbound'` —escrito
 * por nosotros— se atribuía al contacto, y uno entrante se pintaba como nuestro. Un mensaje
 * del cliente pintado como propio parece contestado, y nadie lo contesta.
 */
describe('esDelContacto', () => {
  it('direction inbound es del contacto, en cualquier grafía', () => {
    expect(esDelContacto({ direction: 'INBOUND' })).toBe(true);
    expect(esDelContacto({ direction: 'inbound' })).toBe(true);
  });

  it('direction outbound es nuestro, en cualquier grafía', () => {
    expect(esDelContacto({ direction: 'OUTBOUND' })).toBe(false);
    expect(esDelContacto({ direction: 'outbound' })).toBe(false);
  });

  it('fromMe significa que lo mandamos nosotros', () => {
    expect(esDelContacto({ fromMe: true })).toBe(false);
    expect(esDelContacto({ fromMe: false })).toBe(true);
  });

  it('respeta el formato viejo en sus dos grafías', () => {
    expect(esDelContacto({ fromUser: true })).toBe(true);
    expect(esDelContacto({ from_user: false })).toBe(false);
  });

  it('direction manda sobre fromMe cuando ambos vienen', () => {
    expect(esDelContacto({ direction: 'outbound', fromMe: false })).toBe(false);
  });

  it('sin ningún dato no se inventa: undefined', () => {
    expect(esDelContacto({})).toBeUndefined();
    expect(esDelContacto({ direction: 'lo-que-sea' })).toBeUndefined();
  });

  it('el defecto documentado atribuye al contacto', () => {
    expect(DEL_CONTACTO_SI_NO_CONSTA).toBe(true);
  });
});
