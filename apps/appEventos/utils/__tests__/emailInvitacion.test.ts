/**
 * El HTML de la invitación por correo, probado de verdad.
 *
 * Lo reescribí para que sobreviviera a Gmail y Outlook —tablas en vez de flex, bgcolor
 * bajo el degradado, fuentes web-safe, escapado— y lo di por bueno SIN RENDERIZARLO
 * nunca. Este test lo genera y comprueba las propiedades que de verdad deciden si un
 * correo se ve o se rompe, que no son las mismas que en un navegador.
 *
 * Lo que un cliente de correo NO hace, y por eso se comprueba aquí:
 *   · Outlook (motor Word) ignora flex, grid y position. Solo tablas.
 *   · Ningún cliente resuelve `var(--x)`: el color tiene que ir literal.
 *   · Gmail descarta `<style>` en muchos contextos: los estilos van en línea.
 *   · Un degradado CSS no se ve en Outlook; hace falta un bgcolor sólido debajo.
 */
import { renderEmailHtml } from '../emailInvitacion';

const base = {
  _studio: 'v1' as const,
  accent: '#EF5B94',
  cover: '',
  date: '12 de junio de 2027',
  font: 'elegante' as const,
  message: 'Nos encantaría compartir contigo este día tan especial.',
  names: 'Ana & Luis',
  rsvp: 'Confirma antes del 1 de mayo',
  template: 'elegante' as const,
  time: '18:00',
  title: 'NOS CASAMOS',
  venue: 'Finca La Alameda',
};

describe('renderEmailHtml', () => {
  it('no usa nada que Outlook ignore (flex, grid, position)', () => {
    const html = renderEmailHtml(base);
    const prohibido = ['display:flex', 'display:grid', 'position:absolute', 'position:fixed'];
    expect(prohibido.filter((p) => html.replace(/\s/g, '').includes(p))).toEqual([]);
  });

  it('maqueta con tablas, que es lo único universal', () => {
    const html = renderEmailHtml(base);
    expect(html).toContain('role="presentation"');
    expect((html.match(/<table/g) || []).length).toBeGreaterThanOrEqual(3);
  });

  it('no deja variables CSS: ningún cliente de correo resuelve var()', () => {
    // Es el riesgo real desde que barrí los colores a var(--color-primary): si una se
    // cuela aquí, el correo pierde el color y nadie se entera hasta que lo abre alguien.
    expect(renderEmailHtml(base)).not.toContain('var(--');
  });

  it('lleva bgcolor sólido, porque un degradado no se ve en Outlook', () => {
    expect(renderEmailHtml(base)).toContain('bgcolor=');
  });

  it('declara charset: sin él las tildes y la ñ salen rotas', () => {
    expect(renderEmailHtml(base)).toContain('charset=');
  });

  it('trae preheader oculto para la lista del buzón', () => {
    const html = renderEmailHtml(base);
    expect(html).toContain('mso-hide:all');
    expect(html).toContain(base.message);
  });

  it('escapa lo que escribe el usuario: un nombre no puede inyectar HTML', () => {
    const html = renderEmailHtml({
      ...base,
      names: '<script>alert(1)</script>',
      title: 'Ana " onerror="alert(2)',
    });
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('onerror="alert(2)');
  });

  it('omite los bloques vacíos en vez de dejar huecos', () => {
    const html = renderEmailHtml({ ...base, rsvp: '', time: '', venue: '' });
    expect(html).not.toContain('Finca La Alameda');
    expect(html).not.toContain('Confirma antes');
  });

  it('funciona con las tres plantillas y las tres fuentes', () => {
    const malos: string[] = [];
    for (const template of ['elegante', 'clasica', 'moderna'] as const) {
      for (const font of ['elegante', 'moderna', 'script'] as const) {
        const html = renderEmailHtml({ ...base, font, template });
        if (!html.includes('<!doctype html>') || html.includes('undefined')) {
          malos.push(`${template}/${font}`);
        }
      }
    }
    expect(malos).toEqual([]);
  });
});
