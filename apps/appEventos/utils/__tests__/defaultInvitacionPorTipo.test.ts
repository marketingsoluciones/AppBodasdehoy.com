import {
  descartarTextosHeredadosDeBoda,
  esBoda,
  getInvitacionDefaults,
} from '../defaultInvitacionPorTipo';

describe('getInvitacionDefaults', () => {
  it('la boda conserva EXACTAMENTE los textos que ya tenía', () => {
    // Decisión JCP 17-09: boda estaba bien, no se toca. Si alguien la cambia,
    // que sea a propósito y no de rebote al añadir otro tipo.
    const boda = getInvitacionDefaults('boda');
    expect(boda.title).toBe('NOS CASAMOS');
    expect(boda.names).toBe('Ana & Marcos');
    expect(boda.message).toBe('Nos encantaría compartir contigo este día tan especial.');
    expect(boda.rsvp).toBe('Confirma tu asistencia');
    expect(boda.claim).toBe('¡Nos casamos! 💍');
    expect(boda.fallbackSubject).toBe('Estáis invitados a nuestra boda 💍');
  });

  it('cada tipo del select tiene su propio encabezado', () => {
    const titulos = [
      'cumpleaños',
      'boda',
      'babyshower',
      'graduación',
      'bautizo',
      'comunión',
      'despedida de soltero',
    ].map((t) => getInvitacionDefaults(t).title);

    // Ninguno repetido: si dos tipos comparten encabezado, uno se quedó sin personalizar.
    expect(new Set(titulos).size).toBe(titulos.length);
  });

  it.each(['cumpleaños', 'babyshower', 'graduación', 'bautizo', 'comunión', 'otro'])(
    '%s no menciona una boda en ninguno de sus textos',
    (tipo) => {
      const d = getInvitacionDefaults(tipo);
      const todo = `${d.title} ${d.message} ${d.claim} ${d.fallbackSubject}`.toLowerCase();
      expect(todo).not.toMatch(/casamos|boda/);
    },
  );

  it('acepta el enum del backend además del valor del select', () => {
    // api-mcp devuelve EventoTipo en mayúsculas y sin acentos.
    expect(getInvitacionDefaults('BODA')).toEqual(getInvitacionDefaults('boda'));
    expect(getInvitacionDefaults('CUMPLEANOS')).toEqual(getInvitacionDefaults('cumpleaños'));
    expect(getInvitacionDefaults('BABY_SHOWER')).toEqual(getInvitacionDefaults('babyshower'));
    expect(getInvitacionDefaults('GRADUACION')).toEqual(getInvitacionDefaults('graduación'));
    expect(getInvitacionDefaults('COMUNION')).toEqual(getInvitacionDefaults('comunión'));
    expect(getInvitacionDefaults('DESPEDIDA_SOLTERO')).toEqual(
      getInvitacionDefaults('despedida de soltero'),
    );
  });

  it('un tipo desconocido, vacío o ausente cae en los genéricos', () => {
    const generico = getInvitacionDefaults('otro');
    expect(getInvitacionDefaults(undefined)).toEqual(generico);
    expect(getInvitacionDefaults(null)).toEqual(generico);
    expect(getInvitacionDefaults('')).toEqual(generico);
    expect(getInvitacionDefaults('quinceañera')).toEqual(generico);
  });

  it('tolera espacios y mayúsculas sueltas', () => {
    expect(getInvitacionDefaults('  Bautizo  ')).toEqual(getInvitacionDefaults('bautizo'));
  });

  it.each([
    'boda', 'cumpleaños', 'babyshower', 'graduación', 'bautizo',
    'comunión', 'despedida de soltero', 'corporativo', 'otro', 'desconocido',
  ])('%s trae los seis campos rellenos', (tipo) => {
    const d = getInvitacionDefaults(tipo);
    const vacios = (['title', 'names', 'message', 'rsvp', 'claim', 'fallbackSubject'] as const)
      .filter((campo) => !d[campo]);
    expect(vacios).toEqual([]);
  });
});

describe('descartarTextosHeredadosDeBoda', () => {
  const VIEJO_TITULO = 'NOS CASAMOS';
  const VIEJO_MENSAJE = 'Nos encantaría compartir contigo este día tan especial.';

  it('en un bautizo descarta los dos textos heredados', () => {
    const guardado = { title: VIEJO_TITULO, message: VIEJO_MENSAJE, venue: 'La Ermita' };
    const limpio = descartarTextosHeredadosDeBoda(guardado, 'bautizo');
    expect(limpio.title).toBeUndefined();
    expect(limpio.message).toBeUndefined();
    // Lo que no es texto heredado se conserva intacto.
    expect(limpio.venue).toBe('La Ermita');
  });

  it('en una boda no toca nada — ahí esos textos son los correctos', () => {
    const guardado = { title: VIEJO_TITULO, message: VIEJO_MENSAJE };
    expect(descartarTextosHeredadosDeBoda(guardado, 'boda')).toBe(guardado);
    expect(descartarTextosHeredadosDeBoda(guardado, 'BODA')).toBe(guardado);
  });

  it('respeta un encabezado que el usuario escribió', () => {
    const guardado = { title: 'BAUTIZO DE LUCÍA', message: VIEJO_MENSAJE };
    const limpio = descartarTextosHeredadosDeBoda(guardado, 'bautizo');
    expect(limpio.title).toBe('BAUTIZO DE LUCÍA');   // decisión suya
    expect(limpio.message).toBeUndefined();          // esto sí era el default
  });

  it('corrige solo el encabezado si el mensaje está personalizado', () => {
    const guardado = { title: VIEJO_TITULO, message: 'Te esperamos a las 12 en la iglesia.' };
    const limpio = descartarTextosHeredadosDeBoda(guardado, 'comunión');
    expect(limpio.title).toBeUndefined();
    expect(limpio.message).toBe('Te esperamos a las 12 en la iglesia.');
  });

  it('un cambio mínimo ya cuenta como decisión del usuario', () => {
    // Con una sola palabra distinta, deja de ser el default y se respeta.
    const guardado = { title: 'NOS CASAMOS!' };
    expect(descartarTextosHeredadosDeBoda(guardado, 'bautizo').title).toBe('NOS CASAMOS!');
  });

  it('devuelve el MISMO objeto cuando no hay nada que limpiar', () => {
    // El llamante compara por identidad para saber si debe volver a guardar.
    const guardado = { title: 'BABY SHOWER', message: 'Ven a celebrarlo.' };
    expect(descartarTextosHeredadosDeBoda(guardado, 'babyshower')).toBe(guardado);
  });

  it('tolera espacios alrededor del texto heredado', () => {
    const guardado = { title: '  NOS CASAMOS  ' };
    expect(descartarTextosHeredadosDeBoda(guardado, 'bautizo').title).toBeUndefined();
  });

  it('aguanta un diseño vacío o campos ausentes', () => {
    expect(descartarTextosHeredadosDeBoda({}, 'bautizo')).toEqual({});
    expect(descartarTextosHeredadosDeBoda({ title: undefined } as any, 'bautizo').title).toBeUndefined();
  });

  it('con tipo desconocido sigue limpiando (no es boda)', () => {
    const guardado = { title: VIEJO_TITULO };
    expect(descartarTextosHeredadosDeBoda(guardado, 'quinceañera').title).toBeUndefined();
  });
});

describe('esBoda', () => {
  it('reconoce la boda en los dos formatos', () => {
    expect(esBoda('boda')).toBe(true);
    expect(esBoda('BODA')).toBe(true);
  });

  it('todo lo demás no es boda', () => {
    for (const t of ['bautizo', 'cumpleaños', 'BABY_SHOWER', 'otro', '', undefined, null]) {
      expect(esBoda(t)).toBe(false);
    }
  });
});
