import { defaultImagenes, getEventImage } from '../imagenEvento';
import { esTipoConocido, normalizeTipoEvento } from '../tipoEvento';

/** Los 8 tipos del select, tal como los guarda el form. */
const DESDE_SELECT = [
  'boda', 'cumpleaños', 'babyshower', 'graduación',
  'bautizo', 'comunión', 'despedida de soltero', 'otro',
];

/** Los mismos, tal como los devuelve api-mcp (enum EventoTipo). */
const DESDE_BACKEND = [
  'BODA', 'CUMPLEANOS', 'BABY_SHOWER', 'GRADUACION',
  'BAUTIZO', 'COMUNION', 'DESPEDIDA_SOLTERO', 'OTRO',
];

describe('normalizeTipoEvento', () => {
  it('los dos formatos del mismo tipo dan la misma clave', () => {
    DESDE_SELECT.forEach((select, i) => {
      expect(normalizeTipoEvento(DESDE_BACKEND[i])).toBe(normalizeTipoEvento(select));
    });
  });

  it('el valor del select ya es la clave canónica', () => {
    for (const t of DESDE_SELECT) expect(normalizeTipoEvento(t)).toBe(t);
  });

  it('resuelve los que fallaban con toLowerCase() a secas', () => {
    // Estos cinco eran los rotos: acento o guion bajo de por medio.
    expect(normalizeTipoEvento('CUMPLEANOS')).toBe('cumpleaños');
    expect(normalizeTipoEvento('GRADUACION')).toBe('graduación');
    expect(normalizeTipoEvento('COMUNION')).toBe('comunión');
    expect(normalizeTipoEvento('BABY_SHOWER')).toBe('babyshower');
    expect(normalizeTipoEvento('DESPEDIDA_SOLTERO')).toBe('despedida de soltero');
  });

  it('acepta variantes de escritura', () => {
    expect(normalizeTipoEvento('baby shower')).toBe('babyshower');
    expect(normalizeTipoEvento('  Bautizo  ')).toBe('bautizo');
    expect(normalizeTipoEvento('despedida de soltera')).toBe('despedida de soltero');
  });

  it('lo desconocido o ausente cae en otro', () => {
    for (const t of ['quinceañera', '', '   ', undefined, null]) {
      expect(normalizeTipoEvento(t)).toBe('otro');
    }
  });
});

describe('esTipoConocido', () => {
  it('distingue un tipo real de uno que no supimos leer', () => {
    expect(esTipoConocido('OTRO')).toBe(true);        // es un tipo de verdad
    expect(esTipoConocido('quinceañera')).toBe(false); // desconocido
    expect(esTipoConocido(undefined)).toBe(false);
  });
});

describe('getEventImage — el bug de QA 17-09', () => {
  it('cada tipo del select tiene su imagen alusiva', () => {
    for (const t of DESDE_SELECT) {
      expect(getEventImage(t)).toBe(defaultImagenes[normalizeTipoEvento(t)]);
    }
  });

  it('el tipo que llega del backend da la MISMA imagen que el del select', () => {
    DESDE_SELECT.forEach((select, i) => {
      expect(getEventImage(DESDE_BACKEND[i])).toBe(getEventImage(select));
    });
  });

  it.each([
    ['CUMPLEANOS', '/cards/cumpleanos.webp'],
    ['GRADUACION', '/cards/graduacion.webp'],
    ['COMUNION', '/cards/comunion.webp'],
    ['BABY_SHOWER', '/cards/baby.webp'],
    ['DESPEDIDA_SOLTERO', '/cards/despedida.webp'],
  ])('%s ya no cae en la genérica', (tipo, esperada) => {
    expect(getEventImage(tipo)).toBe(esperada);
    expect(getEventImage(tipo)).not.toBe(defaultImagenes.otro);
  });

  it('NUNCA devuelve undefined — era lo que rompía la tarjeta pública', () => {
    for (const t of [...DESDE_SELECT, ...DESDE_BACKEND, 'inventado', '', undefined, null]) {
      expect(typeof getEventImage(t)).toBe('string');
      expect(getEventImage(t)).toMatch(/^\/cards\//);
    }
  });
});
