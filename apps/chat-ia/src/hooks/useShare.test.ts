import { describe, expect, it } from 'vitest';

import { useShare } from './useShare';

describe('useShare (WhatsApp)', () => {
  it('genera enlace de WhatsApp (wa.me) con texto prellenado', () => {
    const { whatsapp } = useShare({
      desc: 'Descripción',
      hashtags: ['hola mundo'],
      title: 'Título',
      url: 'https://example.com/ruta',
    });

    const parsed = new URL(whatsapp.link);

    expect(parsed.hostname).toBe('wa.me');
    expect(parsed.pathname).toBe('/');

    const text = parsed.searchParams.get('text');
    expect(text).toBe('Título - Descripción https://example.com/ruta #holaMundo');
  });
});
