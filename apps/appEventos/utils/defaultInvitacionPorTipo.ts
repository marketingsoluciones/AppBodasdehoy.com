/**
 * Textos por defecto de la invitación según el TIPO de evento.
 *
 * La web deja crear cumpleaños, bautizos, graduaciones, baby showers… pero el
 * Studio de invitaciones arrancaba siempre con los textos de una boda: el
 * encabezado decía "NOS CASAMOS" y el asunto del correo "¡Nos casamos! 💍"
 * aunque el evento fuera un bautizo. Quien creaba otro tipo de evento tenía que
 * reescribirlo todo a mano antes de poder enviar nada.
 *
 * Los textos de boda se mantienen EXACTAMENTE como estaban (decisión JCP 17-09):
 * son el caso más usado y ya estaban bien. Lo que se añade es el resto.
 *
 * Todo esto son valores INICIALES: en cuanto el usuario edita cualquier campo,
 * el Studio persiste su versión y esto no vuelve a aplicarse.
 *
 * Mismo criterio que `defaultGruposPorTipo.ts`, que ya resuelve por tipo los
 * grupos de invitados.
 */

export interface InvitacionDefaults {
  /** Encabezado de la tarjeta, en mayúsculas. Ej: "NOS CASAMOS". */
  title: string;
  /** Placeholder de nombres cuando el evento aún no tiene uno. */
  names: string;
  /** Cuerpo de la invitación. */
  message: string;
  /** Llamada a confirmar asistencia. */
  rsvp: string;
  /**
   * Fragmento que acompaña a los nombres en el asunto del correo y en el cuerpo
   * de WhatsApp. Ej: "¡Nos casamos! 💍" → "Ana & Marcos · ¡Nos casamos! 💍".
   */
  claim: string;
  /** Asunto de reserva, cuando no hay ni nombres ni fecha que componer. */
  fallbackSubject: string;
}

const BODA: InvitacionDefaults = {
  title: 'NOS CASAMOS',
  names: 'Ana & Marcos',
  message: 'Nos encantaría compartir contigo este día tan especial.',
  rsvp: 'Confirma tu asistencia',
  claim: '¡Nos casamos! 💍',
  fallbackSubject: 'Estáis invitados a nuestra boda 💍',
};

const CUMPLEANOS: InvitacionDefaults = {
  title: '¡LO CELEBRAMOS!',
  names: 'Mi cumpleaños',
  message: 'Cumplo años y me haría mucha ilusión celebrarlo contigo.',
  rsvp: 'Confirma tu asistencia',
  claim: '¡Estás invitado! 🎂',
  fallbackSubject: 'Estás invitado a mi cumpleaños 🎂',
};

const BABY_SHOWER: InvitacionDefaults = {
  title: 'BABY SHOWER',
  names: 'Nuestro bebé viene en camino',
  message: 'Ven a celebrar con nosotros la llegada de nuestro bebé.',
  rsvp: 'Confirma tu asistencia',
  claim: '¡Baby shower! 🍼',
  fallbackSubject: 'Estás invitado a nuestro baby shower 🍼',
};

const GRADUACION: InvitacionDefaults = {
  title: '¡ME GRADÚO!',
  names: 'Mi graduación',
  message: 'Después de mucho esfuerzo llegó el día, y quiero celebrarlo contigo.',
  rsvp: 'Confirma tu asistencia',
  claim: '¡Me gradúo! 🎓',
  fallbackSubject: 'Estás invitado a mi graduación 🎓',
};

const BAUTIZO: InvitacionDefaults = {
  title: 'NUESTRO BAUTIZO',
  names: 'El bautizo de nuestro pequeño',
  message: 'Nos hace mucha ilusión que nos acompañes en un día tan especial.',
  rsvp: 'Confirma tu asistencia',
  claim: '¡Nos bautizamos! 🕊️',
  fallbackSubject: 'Estás invitado a nuestro bautizo 🕊️',
};

const COMUNION: InvitacionDefaults = {
  title: 'PRIMERA COMUNIÓN',
  names: 'Mi primera comunión',
  message: 'Me encantaría que me acompañaras en este día tan importante.',
  rsvp: 'Confirma tu asistencia',
  claim: '¡Primera comunión! ✨',
  fallbackSubject: 'Estás invitado a mi primera comunión ✨',
};

const DESPEDIDA: InvitacionDefaults = {
  title: '¡NOS VAMOS DE DESPEDIDA!',
  names: 'La despedida',
  message: 'Queda poco para el gran día y toca celebrarlo. No puedes faltar.',
  rsvp: 'Confirma tu asistencia',
  claim: '¡Nos vamos de despedida! 🎉',
  fallbackSubject: 'Estás invitado a la despedida 🎉',
};

const CORPORATIVO: InvitacionDefaults = {
  title: 'TE ESPERAMOS',
  names: 'Nuestro evento',
  message: 'Nos gustaría contar contigo en este encuentro.',
  rsvp: 'Confirma tu asistencia',
  claim: 'Estás invitado',
  fallbackSubject: 'Invitación a nuestro evento',
};

/** Para 'otro', 'social' y cualquier tipo que no esté contemplado. */
const GENERICO: InvitacionDefaults = {
  title: 'ESTÁS INVITADO',
  names: 'Nuestro evento',
  message: 'Nos encantaría contar contigo en un día tan especial.',
  rsvp: 'Confirma tu asistencia',
  claim: '¡Estás invitado!',
  fallbackSubject: 'Estás invitado a nuestro evento',
};

/**
 * El tipo llega en dos formatos según de dónde venga:
 *   · el select del front lo guarda en minúsculas y con acentos ('graduación')
 *   · api-mcp lo devuelve como enum EventoTipo, en mayúsculas y sin acentos
 *     ('GRADUACION', 'BABY_SHOWER', 'DESPEDIDA_SOLTERO')
 *
 * Este mapa acepta los dos, igual que hace `normalizeTipoForForm` en
 * FormCrearEvento. Sin esto, un evento recién leído del backend caía siempre
 * en el genérico.
 */
const POR_TIPO: Record<string, InvitacionDefaults> = {
  // boda
  'boda': BODA,
  // cumpleaños
  'cumpleaños': CUMPLEANOS,
  'cumpleanos': CUMPLEANOS,
  // baby shower
  'babyshower': BABY_SHOWER,
  'baby shower': BABY_SHOWER,
  'baby_shower': BABY_SHOWER,
  // graduación
  'graduación': GRADUACION,
  'graduacion': GRADUACION,
  // bautizo
  'bautizo': BAUTIZO,
  // comunión
  'comunión': COMUNION,
  'comunion': COMUNION,
  // despedida de soltero/a
  'despedida de soltero': DESPEDIDA,
  'despedida_soltero': DESPEDIDA,
  // resto del enum EventoTipo
  'corporativo': CORPORATIVO,
  'religioso': GENERICO,
  'social': GENERICO,
  'otro': GENERICO,
};

/**
 * Textos iniciales de la invitación para un tipo de evento.
 * Nunca devuelve undefined: ante un tipo desconocido, textos genéricos.
 */
export function getInvitacionDefaults(tipo?: string | null): InvitacionDefaults {
  const t = (tipo || '').toLowerCase().trim();
  return POR_TIPO[t] ?? GENERICO;
}
