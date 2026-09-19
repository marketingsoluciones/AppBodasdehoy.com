/**
 * direccion — quién escribió un mensaje: el contacto o nosotros.
 *
 * Un solo criterio para las dos vías por las que entran mensajes, porque tenían el suyo y
 * estaban INVERTIDOS entre sí (17-09):
 *
 *   · normalizeMessage (REST):  direction === 'INBOUND'            → del contacto
 *   · useMessageStream (SSE):   direction === 'outbound' || fromMe → "del contacto"  ✗
 *
 * O sea que un mensaje que llegara por SSE sin el campo `fromUser` explícito se atribuía al
 * revés: lo que escribíamos nosotros aparecía como dicho por el cliente, y lo que decía el
 * cliente aparecía como nuestro. Lo segundo es lo grave: un mensaje entrante pintado como
 * propio parece ya contestado, y nadie lo contesta.
 *
 * `undefined` = no consta. Quien llama decide, pero lo hace a la vista.
 */
export function esDelContacto(msg: {
  direction?: unknown;
  fromMe?: unknown;
  fromUser?: unknown;
  from_user?: unknown;
}): boolean | undefined {
  // `direction` manda: es el campo normalizado de api-ia. Sin distinguir mayúsculas, que
  // api-ia lo manda en mayúsculas y el SSE en minúsculas.
  if (typeof msg.direction === 'string') {
    const d = msg.direction.toLowerCase();
    if (d === 'inbound') return true;
    if (d === 'outbound') return false;
  }
  // Baileys / api-mcp: fromMe = lo mandamos NOSOTROS.
  if (typeof msg.fromMe === 'boolean') return !msg.fromMe;
  // Formato heredado, en las dos grafías.
  if (typeof msg.fromUser === 'boolean') return msg.fromUser;
  if (typeof msg.from_user === 'boolean') return msg.from_user;
  return undefined;
}

/**
 * Cuando no consta, se atribuye al CONTACTO. No es neutral —en un chat de dos lados no hay
 * neutro— pero es el error menos dañino de los dos: un mensaje nuestro pintado como suyo se
 * ve raro y alguien lo mira; uno suyo pintado como nuestro parece contestado y se queda sin
 * respuesta para siempre.
 */
export const DEL_CONTACTO_SI_NO_CONSTA = true;
