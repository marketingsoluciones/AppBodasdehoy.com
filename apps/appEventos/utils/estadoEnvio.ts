/**
 * Clasificación de la respuesta de `sendComunications`.
 *
 * Existe porque dos pantallas (InvitacionesStudio y SendButton) tenían que interpretar
 * lo mismo y lo hacían distinto: una leía `results[].enviado` y la otra no miraba la
 * respuesta en absoluto — cantaba «Envío por WhatsApp exitoso» fijo, aunque fallaran
 * todos los invitados.
 *
 * ── Lo que significa cada estado (api-mcp, despliegue 0088ef9a) ──────────────────
 * En la rama de WhatsApp:
 *   · `aceptado`     → Meta ADMITIÓ el mensaje para procesar. NO está entregado.
 *   · `fallido`      → el envío falló (error de Meta, saldo, excepción).
 *   · `sin_telefono` → el invitado no tiene teléfono. Es accionable por el anfitrión,
 *                      así que se cuenta aparte en vez de sumarlo a "fallaron".
 * Y `results[].enviado` es `false` SIEMPRE desde ese despliegue: usarlo como señal de
 * éxito reponía la mentira que el backend acababa de quitar. En email no viene `estado`,
 * así que allí `enviado` sigue siendo la señal buena.
 *
 * ── Por qué hay un cubo de "desconocido" ────────────────────────────────────────
 * La lista va a CRECER cuando api-ia procese `value.statuses`: se esperan `entregado`,
 * `leido` y `no_entregado`. Un estado nuevo cae en `desconocidos` y se le enseña al
 * anfitrión como tal. Asumir que lo desconocido es bueno es exactamente cómo se cuela
 * esta clase de fallo; y si el estado nuevo era bueno, el coste es un aviso raro
 * durante un día, que es mucho más barato que un "enviada" falso.
 */

/** Estados que hoy sabemos interpretar. Cualquier otro va a `desconocidos`. */
export const ESTADOS_CONOCIDOS = ['aceptado', 'fallido', 'sin_telefono'] as const;

export interface ResumenEnvio {
  /** Aceptados por el proveedor. NO significa entregado. */
  aceptados: number;
  /** Ids de los aceptados, para marcarlos en la lista y no reenviar por error. */
  aceptadosIds: string[];
  /** Fallos reales (no incluye los que no tienen teléfono). */
  conError: number;
  /** Estados que esta versión del front no sabe interpretar. */
  desconocidos: number;
  /** Los estados literales no reconocidos, sin repetir, para poder enseñarlos. */
  estadosRaros: string[];
  /** El backend no devolvió nada utilizable: ni aceptados ni fallos. */
  sinRespuesta: boolean;
  /** Invitados sin teléfono: accionable, se separa de los errores. */
  sinTelefono: number;
}

/** Normaliza un resultado a su estado. Email no manda `estado`: ahí vale `enviado`. */
export function estadoDeResultado(r: any): string {
  return String(r?.estado || (r?.enviado ? 'aceptado' : '')).toLowerCase();
}

export function clasificarEnvio(res: any): ResumenEnvio {
  const sent = Number(res?.sent || 0);
  const failed = Number(res?.failed || 0);
  const results: any[] = Array.isArray(res?.results) ? res.results : [];

  const conocidos: string[] = [...ESTADOS_CONOCIDOS];
  const estados = results.map(estadoDeResultado);
  const raros = estados.filter((e) => e !== '' && !conocidos.includes(e));

  const aceptadosIds = results
    .filter((r) => estadoDeResultado(r) === 'aceptado')
    .map((r) => r?.invitado_id || r?._id)
    .filter(Boolean)
    .map(String);

  return {
    // Si el backend no detalla `results`, `sent` es lo único que hay.
    aceptados: estados.some((e) => e !== '') ? estados.filter((e) => e === 'aceptado').length : sent,
    aceptadosIds,
    conError: estados.filter((e) => e === 'fallido').length,
    desconocidos: raros.length,
    estadosRaros: raros.filter((e, i, a) => a.indexOf(e) === i),
    sinRespuesta: !res || (sent === 0 && failed === 0),
    sinTelefono: estados.filter((e) => e === 'sin_telefono').length,
  };
}
