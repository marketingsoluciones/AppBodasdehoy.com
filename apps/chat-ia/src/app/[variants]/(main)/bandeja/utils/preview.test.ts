import { describe, expect, it } from 'vitest';

import { formatPhone } from './jid';
import { previewText } from './preview';

/**
 * Usabilidad 17-09: la lista enseñaba `+1150321594779596` de un tirón y, cuando el último
 * mensaje no traía texto, ponía el nombre del canal ("WhatsApp") como si fuera el mensaje.
 */
describe('formatPhone', () => {
  it('agrupa para que se pueda leer y respeta el prefijo de país', () => {
    expect(formatPhone('34910603622')).toBe('+34 910 603 622');
    expect(formatPhone('5491159703031')).toBe('+54 91 159 703 031');
  });

  it('no inventa país cuando no reconoce el prefijo', () => {
    expect(formatPhone('999888777666')).toMatch(/^\+/);
    expect(formatPhone('999888777666')).toContain(' ');
  });

  it('deja en paz lo que no es un número', () => {
    expect(formatPhone('')).toBe('');
    expect(formatPhone('12345')).toBe('12345');
  });
});

describe('previewText', () => {
  it('describe el adjunto en vez de dejar la fila muda', () => {
    expect(previewText('', 'image')).toBe('📷 Imagen');
    expect(previewText('', 'audio')).toBe('🎤 Audio');
    expect(previewText('', 'document')).toBe('📎 Documento');
  });

  it('nunca usa el nombre del canal como si fuera el mensaje', () => {
    // Antes la fila ponía "Tú: WhatsApp", que no dice nada de la conversación.
    expect(previewText('', undefined)).toBe('Sin mensajes aún');
    expect(previewText('   ', undefined)).toBe('Sin mensajes aún');
  });

  it('respeta el texto real cuando existe', () => {
    expect(previewText('Hola, ¿mañana a las 5?', undefined)).toBe('Hola, ¿mañana a las 5?');
  });
});
