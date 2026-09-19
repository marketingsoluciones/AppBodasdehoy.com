/**
 * auditoria-front-storage-whatsapp.spec.ts — Auditoría desde el FRONT (15-09-2026)
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * QUÉ AUDITA
 *
 * Las rutas de servidor de chat-ia que tocan ficheros y mensajería. La pregunta
 * es siempre la misma: ¿qué consigue un navegador SIN sesión?
 *
 *   IMG-01  POST /api/storage/upload          → ¿exige JWT o basta X-User-ID?
 *   IMG-02  DELETE /api/storage/files/{id}    → ¿deja borrar como 'anonymous'?
 *   WA-01   POST /api/messages/whatsapp/...   → ¿el gate N32 aguanta?
 *
 * Las tres rutas llevan al MISMO backend (api-ia). Dos de ellas no piden nada.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * SEGURIDAD DE LA PROPIA AUDITORÍA
 *
 * Ninguna petición de este spec escribe, envía ni borra nada real:
 *   · Los POST de subida van SIN fichero → la ruta corta en "file requerido"
 *     antes de llamar al backend. Si contesta 400, ya entró sin autenticarse.
 *   · Los POST de WhatsApp van con cuerpo vacío → sin phone_number ni content
 *     no hay mensaje que enviar, ni siquiera si el gate cediera.
 *   · Los DELETE apuntan a un id inventado que no existe.
 *
 * El criterio de fallo es el CÓDIGO DE ESTADO, no el efecto. Un 401 es la única
 * respuesta correcta a un anónimo; cualquier otra cosa significa que la petición
 * pasó la puerta y llegó a la lógica de negocio.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * CÓMO EJECUTAR
 *
 *   E2E_ENV=local bunx playwright test auditoria-front-storage-whatsapp --project=webkit
 *   E2E_ENV=dev   bunx playwright test auditoria-front-storage-whatsapp --project=webkit
 *
 * No necesita credenciales: el bloque principal audita justamente el acceso
 * anónimo. El bloque autenticado del final se salta solo si no hay
 * TEST_USER_PASSWORD en el entorno.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { expect, test } from '@playwright/test';

import { TEST_CREDENTIALS, TEST_URLS } from './fixtures';
import { getAuthJwt, loginAndSelectEvent } from './helpers';

const CHAT_URL = process.env.CHAT_URL || TEST_URLS.chat;

/** Id que no existe en ningún bucket — para que un DELETE no pueda destruir nada. */
const ID_INEXISTENTE = 'auditoria-qa-id-que-no-existe';
const EVENTO_INEXISTENTE = 'auditoria-qa-evento-que-no-existe';

/** Un anónimo solo debería recibir esto. */
const NO_AUTENTICADO = [401, 403];

/**
 * Describe el veredicto en una línea legible en el log, para que el informe
 * se pueda escribir copiando la salida del runner.
 */
function veredicto(status: number): string {
  if (NO_AUTENTICADO.includes(status)) return `✅ ${status} — rechazado sin sesión`;
  if (status === 404) return `➖ ${status} — la ruta no existe en este entorno`;
  return `❌ ${status} — ENTRÓ sin sesión (debería ser 401)`;
}

test.describe('Auditoría front — acceso anónimo a storage y mensajería', () => {
  // Contexto limpio: sin cookies, sin localStorage, sin sesión heredada de otro spec.
  test.use({ storageState: { cookies: [], origins: [] } });

  test('IMG-01 · subir un fichero exige sesión', async ({ request }) => {
    // POST sin `file`: si hay gate → 401 antes de mirar el cuerpo.
    // Si no hay gate → 400 "file requerido", que es la ruta contestando ya por dentro.
    const res = await request.post(`${CHAT_URL}/api/storage/upload`, {
      failOnStatusCode: false,
      headers: {
        'X-Development': 'bodasdehoy',
        // La cabecera que hoy hace de identidad. Un valor inventado a propósito.
        'X-User-ID': 'auditoria-qa-usuario-inventado',
      },
      multipart: { event_id: EVENTO_INEXISTENTE },
    });

    console.log(`IMG-01 POST /api/storage/upload → ${veredicto(res.status())}`);
    expect(
      NO_AUTENTICADO,
      `BUG IMG-01: la subida aceptó una petición anónima con X-User-ID inventado ` +
        `(${res.status()}). La identidad del que sube la marca el cliente, no el token.`,
    ).toContain(res.status());
  });

  test('IMG-01b · listar los ficheros de un evento exige sesión', async ({ request }) => {
    const res = await request.get(
      `${CHAT_URL}/api/storage/upload?event_id=${EVENTO_INEXISTENTE}`,
      {
        failOnStatusCode: false,
        headers: { 'X-Development': 'bodasdehoy', 'X-User-ID': 'auditoria-qa-usuario-inventado' },
      },
    );

    console.log(`IMG-01b GET /api/storage/upload → ${veredicto(res.status())}`);
    expect(
      NO_AUTENTICADO,
      `BUG IMG-01b: el listado de ficheros de un evento respondió ${res.status()} a un anónimo. ` +
        `Con un event_id real, esto enumera las fotos de ese evento.`,
    ).toContain(res.status());
  });

  test('IMG-02 · borrar un fichero exige sesión', async ({ request }) => {
    // El peligro real: route.ts resuelve el usuario como
    // X-User-ID || X-User-Email || 'anonymous' — el DELETE nunca se queda sin identidad.
    const res = await request.delete(`${CHAT_URL}/api/storage/files/${ID_INEXISTENTE}`, {
      failOnStatusCode: false,
    });

    console.log(`IMG-02 DELETE /api/storage/files → ${veredicto(res.status())}`);
    expect(
      NO_AUTENTICADO,
      `BUG IMG-02: el borrado respondió ${res.status()} sin ninguna cabecera de identidad. ` +
        `El fallback 'anonymous' deja que la petición llegue al backend. Un DELETE sobre ` +
        `fotos de boda no tiene vuelta atrás.`,
    ).toContain(res.status());
  });

  test('WA-01 · enviar un WhatsApp exige sesión', async ({ request }) => {
    // Cuerpo vacío a propósito: sin phone_number ni content no hay mensaje posible.
    // Lo que se mide es si la puerta deja pasar, no si el envío sale.
    const res = await request.post(
      `${CHAT_URL}/api/messages/whatsapp/messages/send?development=bodasdehoy`,
      { data: {}, failOnStatusCode: false },
    );

    console.log(`WA-01 POST whatsapp/messages/send → ${veredicto(res.status())}`);
    expect(
      NO_AUTENTICADO,
      `BUG WA-01: el proxy de envío dejó pasar a un anónimo (${res.status()}). ` +
        `Con un cuerpo válido, eso son mensajes saliendo con el número de la marca.`,
    ).toContain(res.status());
  });

  test('WA-01b · un token con forma inválida no sirve como sesión', async ({ request }) => {
    // Regresión del fix 8d5cdb6f: antes bastaba `?token=x` para que el proxy reenviara.
    // Ahora se exige que el JWT tenga estructura y `exp` válidos.
    const res = await request.post(
      `${CHAT_URL}/api/messages/whatsapp/messages/send?development=bodasdehoy&token=x`,
      { data: {}, failOnStatusCode: false },
    );

    console.log(`WA-01b POST con ?token=x → ${veredicto(res.status())}`);
    expect(
      NO_AUTENTICADO,
      `REGRESIÓN N32: '?token=x' volvió a valer como credencial (${res.status()}). ` +
        `El fix 8d5cdb6f exige un JWT con estructura y exp válidos.`,
    ).toContain(res.status());
  });

  test('WA-01c · enviar una plantilla HSM exige sesión', async ({ request }) => {
    // La ruta hermana de /send. Con la ventana de 24h cerrada, es por donde va todo.
    const res = await request.post(
      `${CHAT_URL}/api/messages/whatsapp/messages/template?development=bodasdehoy`,
      { data: {}, failOnStatusCode: false },
    );

    console.log(`WA-01c POST whatsapp/messages/template → ${veredicto(res.status())}`);
    expect(
      NO_AUTENTICADO,
      `BUG WA-01c: el envío de plantillas dejó pasar a un anónimo (${res.status()}).`,
    ).toContain(res.status());
  });

  test('aislamiento entre marcas · X-Development no debe elegir el inquilino', async ({
    request,
  }) => {
    // Si la marca la decide una cabecera del cliente, el aislamiento del whitelabel
    // es decorativo. Se prueba pidiendo una marca distinta a la del host.
    const res = await request.get(`${CHAT_URL}/api/storage/upload?event_id=${EVENTO_INEXISTENTE}`, {
      failOnStatusCode: false,
      headers: {
        'X-Development': 'eventosorganizador',
        'X-User-ID': 'auditoria-qa-usuario-inventado',
      },
    });

    console.log(`MARCA GET con X-Development ajeno → ${veredicto(res.status())}`);
    expect(
      NO_AUTENTICADO,
      `BUG MULTIMARCA: se pudo consultar como 'eventosorganizador' desde el host de otra marca ` +
        `(${res.status()}). La marca debe salir del token o del hostname, nunca de una cabecera.`,
    ).toContain(res.status());
  });
});

test.describe('Auditoría front — flujos con sesión', () => {
  // Estos sí necesitan credenciales reales. Sin ellas no se inventa un resultado:
  // el spec se salta y lo dice, que es más honesto que un verde vacío.
  //
  // Se exige que la password venga del ENTORNO, no del fallback de fixtures.ts.
  // Motivo: en un checkout viejo ese fallback todavía es una password literal, y
  // entonces el skip no salta y el test intenta un login con credenciales muertas.
  const hayCredenciales = Boolean(TEST_CREDENTIALS.email && process.env.TEST_USER_PASSWORD);

  test.skip(
    !hayCredenciales,
    'Sin TEST_USER_PASSWORD en el entorno — exporta las credenciales para auditar los flujos con sesión',
  );

  test('un usuario con sesión sí puede listar los ficheros de su evento', async ({
    page,
    request,
  }) => {
    await loginAndSelectEvent(
      page,
      TEST_CREDENTIALS.email,
      TEST_CREDENTIALS.password,
      TEST_URLS.app,
    );

    const jwt = await getAuthJwt(page);
    expect(jwt, 'El login debe dejar un JWT canónico en localStorage').toBeTruthy();

    // Contraparte de IMG-01: con credencial de verdad, la ruta debe responder.
    // Si esto falla, es que el gate se pasó de frenada y rompió el caso legítimo.
    const res = await request.get(
      `${CHAT_URL}/api/storage/upload?event_id=${EVENTO_INEXISTENTE}`,
      { failOnStatusCode: false, headers: { Authorization: `Bearer ${jwt}` } },
    );

    console.log(`SESIÓN GET /api/storage/upload → ${res.status()}`);
    expect(
      res.status(),
      'Con JWT válido el listado no debe dar 401 — el gate estaría rompiendo el flujo legítimo',
    ).not.toBe(401);
  });
});
