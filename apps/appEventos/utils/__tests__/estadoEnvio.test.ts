/**
 * Candado sobre la interpretación de `sendComunications`.
 *
 * Tres veces esta semana la interfaz ha declarado éxito por haber recibido respuesta y
 * no por lo que la respuesta decía: la confirmación del invitado (4015a7f5), el visor
 * público de itinerario (4f32c485) y el botón de enviar invitaciones, que cantaba
 * «Envío por WhatsApp exitoso» sin mirar nada. Un anfitrión que lee "enviada" no vuelve
 * a mirar, así que la mentira no se descubre: se planifica encima.
 *
 * Estos tests fijan lo único que no se puede volver a perder: que `aceptado` no se
 * cuente como entregado, y que un estado desconocido NUNCA se asuma bueno.
 */
import { clasificarEnvio, estadoDeResultado } from '../estadoEnvio';

describe('clasificarEnvio', () => {
  it('cuenta los aceptados sin tratarlos como entregados', () => {
    const r = clasificarEnvio({
      failed: 0,
      results: [
        { _id: 'a', estado: 'aceptado', wamid: 'wamid.X' },
        { _id: 'b', estado: 'aceptado', wamid: 'wamid.Y' },
      ],
      sent: 2,
    });
    expect(r.aceptados).toBe(2);
    expect(r.aceptadosIds).toEqual(['a', 'b']);
    expect(r.conError).toBe(0);
    expect(r.desconocidos).toBe(0);
  });

  it('ignora `enviado:false` cuando hay estado — el backend lo puso a false SIEMPRE', () => {
    // Esto es lo que rompía: `results.filter((r) => r?.enviado)` daba lista vacía y el
    // respaldo marcaba a TODOS como enviados.
    const r = clasificarEnvio({
      failed: 0,
      results: [{ _id: 'a', enviado: false, estado: 'aceptado' }],
      sent: 1,
    });
    expect(r.aceptados).toBe(1);
    expect(r.aceptadosIds).toEqual(['a']);
  });

  it('en email, donde no viene estado, `enviado` sigue siendo la señal', () => {
    const r = clasificarEnvio({
      failed: 0,
      results: [{ _id: 'a', enviado: true }, { _id: 'b', enviado: true }],
      sent: 2,
    });
    expect(r.aceptados).toBe(2);
    expect(r.desconocidos).toBe(0);
  });

  it('separa sin_telefono de los errores de verdad', () => {
    // `failed` del backend suma los dos; el anfitrión necesita saber cuál fue, porque
    // "sin teléfono" lo arregla él y un error de Meta no.
    const r = clasificarEnvio({
      failed: 2,
      results: [
        { _id: 'a', estado: 'aceptado' },
        { _id: 'b', estado: 'sin_telefono' },
        { _id: 'c', estado: 'fallido' },
      ],
      sent: 1,
    });
    expect(r.sinTelefono).toBe(1);
    expect(r.conError).toBe(1);
    expect(r.aceptados).toBe(1);
  });

  it('un estado NUEVO no se asume bueno: cae en desconocidos y se puede enseñar', () => {
    // api-ia añadirá 'entregado' / 'leido' / 'no_entregado' al procesar value.statuses.
    // Hasta que este front los conozca, deben verse como desconocidos — nunca como éxito.
    const r = clasificarEnvio({
      failed: 1,
      results: [
        { _id: 'a', estado: 'entregado' },
        { _id: 'b', estado: 'no_entregado' },
        { _id: 'c', estado: 'entregado' },
      ],
      sent: 0,
    });
    expect(r.desconocidos).toBe(3);
    expect(r.aceptados).toBe(0);
    expect(r.estadosRaros.sort()).toEqual(['entregado', 'no_entregado']);
  });

  it('detecta que el backend no devolvió nada utilizable', () => {
    expect(clasificarEnvio({ failed: 0, results: [], sent: 0 }).sinRespuesta).toBe(true);
    expect(clasificarEnvio(null).sinRespuesta).toBe(true);
    expect(clasificarEnvio({ failed: 3, sent: 0 }).sinRespuesta).toBe(false);
  });

  it('si no hay detalle de results, se cree a `sent`', () => {
    // El backend puede no detallar. Ahí `sent` es lo único que hay y no inventamos.
    const r = clasificarEnvio({ failed: 0, results: [], sent: 5 });
    expect(r.aceptados).toBe(5);
    expect(r.aceptadosIds).toEqual([]);
  });

  it('no se cae con basura', () => {
    const r = clasificarEnvio({ results: [null, {}, { estado: '' }], sent: 0 });
    expect(r.desconocidos).toBe(0);
    expect(r.aceptados).toBe(0);
  });
});

describe('estadoDeResultado', () => {
  it.each([
    [{ estado: 'ACEPTADO' }, 'aceptado'],
    [{ estado: 'Sin_Telefono' }, 'sin_telefono'],
    [{ enviado: true }, 'aceptado'],
    [{ enviado: false }, ''],
    [{}, ''],
  ])('%o → %s', (entrada, esperado) => {
    expect(estadoDeResultado(entrada)).toBe(esperado);
  });
});
