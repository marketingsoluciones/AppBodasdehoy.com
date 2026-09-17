import { getInvitacionDefaults } from '../defaultInvitacionPorTipo';

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
