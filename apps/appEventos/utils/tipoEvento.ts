/**
 * Normalización del tipo de evento — fuente única.
 *
 * El tipo viaja en DOS formatos distintos y eso ya ha causado el mismo bug dos
 * veces:
 *
 *   · el select de FormCrearEvento guarda el valor en minúsculas y CON acentos
 *     ('graduación', 'cumpleaños', 'despedida de soltero')
 *   · api-mcp lo devuelve como enum EventoTipo, en MAYÚSCULAS y SIN acentos ni
 *     espacios ('GRADUACION', 'CUMPLEANOS', 'DESPEDIDA_SOLTERO', 'BABY_SHOWER')
 *
 * Quien haga `event.tipo.toLowerCase()` y busque en un mapa con claves del
 * select acierta solo con los tipos que no llevan acento ni guion bajo —boda,
 * bautizo, otro— y falla silenciosamente con el resto. Fue lo que pasó con
 * `defaultImagenes` (QA 17-09): cumpleaños, graduación, comunión, baby shower y
 * despedida caían en la imagen genérica, o en `undefined` donde no había
 * fallback, dejando la imagen rota.
 *
 * La clave canónica es la del select, porque es la que ya usan los mapas
 * existentes (`defaultImagenes`, `defaultGruposPorTipo`).
 */

/** Claves canónicas: los valores del select de FormCrearEvento. */
export type TipoEventoCanonico =
  | 'boda'
  | 'cumpleaños'
  | 'babyshower'
  | 'graduación'
  | 'bautizo'
  | 'comunión'
  | 'despedida de soltero'
  | 'corporativo'
  | 'religioso'
  | 'social'
  | 'otro';

export const TIPO_EVENTO_POR_DEFECTO: TipoEventoCanonico = 'otro';

/**
 * Todo lo que puede llegar → la clave canónica.
 *
 * Incluye las dos escrituras de cada tipo. Si mañana aparece un formato nuevo
 * (por ejemplo con guiones), se añade aquí y todos los mapas se enteran a la vez.
 */
const ALIAS: Record<string, TipoEventoCanonico> = {
  'boda': 'boda',

  'cumpleaños': 'cumpleaños',
  'cumpleanos': 'cumpleaños',

  'babyshower': 'babyshower',
  'baby shower': 'babyshower',
  'baby_shower': 'babyshower',

  'graduación': 'graduación',
  'graduacion': 'graduación',

  'bautizo': 'bautizo',

  'comunión': 'comunión',
  'comunion': 'comunión',

  'despedida de soltero': 'despedida de soltero',
  'despedida_soltero': 'despedida de soltero',
  'despedida de soltera': 'despedida de soltero',

  'corporativo': 'corporativo',
  'religioso': 'religioso',
  'social': 'social',
  'otro': 'otro',
};

/**
 * Clave canónica del tipo, venga como venga.
 * Ante un tipo desconocido, vacío o ausente devuelve 'otro'.
 */
export function normalizeTipoEvento(tipo?: string | null): TipoEventoCanonico {
  const t = (tipo || '').toLowerCase().trim();
  return ALIAS[t] ?? TIPO_EVENTO_POR_DEFECTO;
}

/**
 * true solo si el tipo reconoce un evento concreto.
 * Útil para distinguir «es de tipo otro» de «no supimos leer el tipo».
 */
export function esTipoConocido(tipo?: string | null): boolean {
  const t = (tipo || '').toLowerCase().trim();
  return t in ALIAS;
}
