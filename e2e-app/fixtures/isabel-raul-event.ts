/**
 * Fixture determinístico — Boda Isabel & Raúl
 *
 * Datos verificados vía api-ia el 2026-04-01.
 * Actualizar SOLO si los datos del evento cambian intencionalmente en DB.
 *
 * ⚠️  NO modificar sin verificar primero en api-ia que el valor real cambió.
 */

export const ISABEL_RAUL_EVENT = {
  id: '66a9042dec5c58aa734bca44',
  nombre: 'Boda Isabel & Raúl',
  fecha: '2025-12-30',
  estatus: 'PENDIENTE',

  // Invitados — actualizado 2026-04-08 (añadido Carlos Carrillo vía agregarInvitado)
  invitados: {
    total: 44,
    confirmados: 39,
    pendientes: 4,
    rechazados: 0,
    pendientesList: ['Jose Luis', 'Maria Garcia', 'Juancarlos test', 'Carlos Carrillo'],
  },

  // Restricciones alimentarias
  // ⚠️  api-ia devuelve 9 en el resumen aunque lista ~15 nombres (bug de conteo en api-ia).
  // Valor verificado vía respuesta AI 2026-04-03. Actualizar cuando api-ia corrija el conteo.
  dietas: {
    celiacos: 9,
  },

  // Presupuesto — usar como referencia en BATCH PRE-*
  // Los tests usan baseline dinámico (preguntan antes de mutar), no dependen de valores exactos.
  // ⚠️ partida1: verificar que "Catering" existe en la BD antes de ejecutar PRE-PAGOS.
  presupuesto: {
    partida1: 'Catering',
  },

  // Itinerario — ⚠️ TODO: actualizar `total` con valor real.
  // Para obtenerlo: login como owner → "¿cuántos items tiene el itinerario de Boda Isabel & Raúl?"
  itinerario: {
    total: 5,
  },
} as const;

/**
 * Usuarios de prueba y sus roles en el sistema
 *
 * Cada email tiene un rol distinto para testear permisos.
 * Password compartida: lorca2012M*+
 */
export const TEST_USERS = {
  // Organizador principal — ve todos sus 44 eventos (43 originales + Carlos Carrillo añadido 2026-04-08)
  // NOTA: bodasdehoy.com@gmail.com y jcc@bodasdehoy.com comparten Firebase UID upSETrmXc7ZnsIhrjDjbHd7u2up1
  organizador: {
    email: 'bodasdehoy.com@gmail.com',
    password: 'lorca2012M*+',
    role: 'creator',
    firebaseUid: 'upSETrmXc7ZnsIhrjDjbHd7u2up1',
    eventosCount: 44,
    canSeeIsabelRaul: true,
  },

  // Colaborador 1 — organizador de su propia boda (BODA DE PILAR), NO colaborador de Isabel & Raúl
  colaborador1: {
    email: 'jcc@recargaexpress.com',
    password: 'lorca2012M*+',
    role: 'creator',                // rol en su propio evento
    propioEvento: 'BODA DE PILAR',
    canSeeIsabelRaul: false,        // no tiene acceso a Isabel & Raúl
  },

  // Colaborador 2 — propietario de "Email pruebas", INVITED_GUEST en eventos ajenos
  // Verificado 2026-04-08: getAllUserRelatedEventsByEmail('jcc@bodasdehoy.com') → 1 evento ("Email pruebas")
  // Al acceder a "Boda Isabel & Raúl" → role_detector FIX: guest→invited_guest (email válido + no owner)
  colaborador2: {
    email: 'jcc@bodasdehoy.com',
    password: 'lorca2012M*+',
    role: 'creator',                // CREATOR de su propio evento "Email pruebas"
    propioEvento: 'Email pruebas',
    propioEventoId: '69838b14e3550784e116b682',
    rolEnEventoAjeno: 'invited_guest', // rol cuando accede a "Boda Isabel & Raúl"
    canSeeIsabelRaul: false,        // no como CREATOR; accede como INVITED_GUEST (datos filtrados)
    canModify: false,               // NO puede modificar eventos ajenos (INVITED_GUEST)
  },

  // carlos.carrillo@recargaexpress.com — CREATOR con cuenta propia, cuota minimal
  // Verificado 2026-04-08: getAllUserRelatedEventsByEmail → 2 eventos propios:
  //   "Juan Carlos" (673bb4d879a9e6767609ea51) PENDIENTE
  //   "Jhj"         (65e1a4c6f9d4cf50e203bcb9) ARCHIVADO
  // Password: madrid2012M*+  (distinta de la familia jcc@*)
  // Usar para tests de CREATOR sin consumir cuota de la cuenta principal (44 eventos).
  carlosCarrillo: {
    email: 'carlos.carrillo@recargaexpress.com',
    password: 'madrid2012M*+',
    role: 'creator',
    eventos: [
      { id: '673bb4d879a9e6767609ea51', nombre: 'Juan Carlos', estatus: 'PENDIENTE' },
      { id: '65e1a4c6f9d4cf50e203bcb9', nombre: 'Jhj',         estatus: 'ARCHIVADO' },
    ],
    canSeeIsabelRaul: false,
  },

  // carlos.carrillo@marketingsoluciones.com — INVITED_GUEST REAL en "Boda Isabel & Raúl"
  // Convención: @marketingsoluciones.com = dominio para roles invitado/colaborador en tests
  // Todos los @marketingsoluciones.com van al inbox: carlos.carrillo@recargaexpress.com
  //
  // Setup completo 2026-04-08 (sin intervención manual):
  //   1. Añadido a invitados de "Boda Isabel & Raúl" vía agregarInvitado ✅
  //   2. Cuenta Firebase creada vía REST API ✅
  //      UID: XVPdnN2mYhfX2fl86k7qFQ2Uj963  |  password: madrid2012M*+
  carlosCarrilloInvitado: {
    email: 'carlos.carrillo@marketingsoluciones.com',
    password: 'madrid2012M*+',
    role: 'invited_guest',
    firebaseUid: 'XVPdnN2mYhfX2fl86k7qFQ2Uj963',
    eventoInvitado: 'Boda Isabel & Raúl',
    eventoInvitadoId: '66a9042dec5c58aa734bca44',
    canSeeIsabelRaul: true,   // datos básicos (nombre, fecha, población)
    canSeeGuestList: false,   // NO lista completa (DATA_FILTER: self_only)
    canModify: false,
  },

  // jcc@marketingsoluciones.com — COLLABORATOR en evento "Juan Carlos"
  // Setup completo 2026-04-08 (sin intervención manual):
  //   1. Cuenta Firebase creada vía REST API ✅
  //      UID: BQaCmwIYxwgZRqPYzcbXkSRIWoT2  |  password: madrid2012M*+
  //   2. Compartido como COLLABORATOR en "Juan Carlos" (673bb4d8) ✅
  //      Propietario: carlos.carrillo@recargaexpress.com (UID: OMkxtxExEgZHvVJVW249uZHq5eR2)
  //   ⚠️  PENDIENTE: el colaborador debe ACEPTAR la invitación desde el email
  //       (llega a carlos.carrillo@recargaexpress.com — inbox que agrega @marketingsoluciones.com)
  jccColaborador: {
    email: 'jcc@marketingsoluciones.com',
    password: 'madrid2012M*+',
    role: 'collaborator',
    firebaseUid: 'BQaCmwIYxwgZRqPYzcbXkSRIWoT2',
    eventoCompartido: 'Juan Carlos',
    eventoCompartidoId: '673bb4d879a9e6767609ea51',
    propietario: 'carlos.carrillo@recargaexpress.com',
    invitacionAceptada: false,  // ⚠️ pendiente — aceptar desde carlos.carrillo@recargaexpress.com
  },
} as const;

/**
 * Preguntas determinísticas para el CRUD via IA.
 *
 * Cada pregunta tiene una respuesta esperada verificable.
 * La respuesta del AI DEBE contener el valor esperado (número, nombre o fecha exacta).
 */
export const CRUD_QUESTIONS = [
  {
    id: 'C01',
    pregunta: '¿Cuántos invitados hay en la boda de Isabel y Raúl?',
    expectedValue: 43,
    expectedPattern: /43\s*(invitados?|total|en total)/i,
    // "tienes" captura "No tienes eventos registrados" (api-ia sin filter_by_name)
    failPattern: /no\s*(encontr|pud|tengo|tienes)/i,
    description: 'Total invitados = 43',
  },
  {
    id: 'C02',
    pregunta: '¿Cuántos invitados han confirmado en la boda de Isabel y Raúl?',
    expectedValue: 39,
    expectedPattern: /39[^.]*confirmad|confirmad[^.]*39/i,
    failPattern: /no\s*(encontr|pud|tengo|tienes)/i,
    description: 'Confirmados = 39',
  },
  {
    id: 'C03',
    pregunta: '¿Cuántos invitados celíacos hay en la boda de Isabel y Raúl?',
    // ⚠️  api-ia tiene un bug de conteo — devuelve valores distintos (4, 9, 16...) en cada llamada.
    // Solo verificamos que la IA devuelva ALGÚN número + "celíaco/invitado".
    expectedValue: 'any positive count',
    expectedPattern: /\d+[^.]*cel[ií]ac/i,
    failPattern: /no\s*(encontr|pud|tengo|tienes)|no hay invitados registrados/i,
    description: 'Celíacos — respuesta contiene número + "celíac" (conteo exacto no determinístico)',
  },
  {
    id: 'C04',
    pregunta: '¿Ha confirmado Juancarlos en la boda de Isabel y Raúl?',
    expectedValue: 'no confirmado / pendiente',
    expectedPattern: /no\s*ha\s*confirmado|pendiente|sin\s*confirmaci/i,
    // "no tienes eventos" = IA no encuentra el evento → nudge
    // "sí ha confirmado" = falso positivo (Juancarlos no confirmó) → test falla
    failPattern: /sí\s*ha\s*confirmado|ya\s*confirmó|no\s*(encontr|pud|tengo|tienes)/i,
    description: 'Juancarlos test → pendiente (no confirmado)',
  },
  {
    id: 'C05',
    pregunta: '¿Cuándo es la boda de Isabel y Raúl?',
    expectedValue: '30 diciembre 2025 / 2025-12-30',
    expectedPattern: /30.*(diciembre|december|2025)|2025-12-30|diciembre.*2025/i,
    failPattern: /no\s*(encontr|sé la fecha|tienes)/i,
    description: 'Fecha = 30 diciembre 2025',
  },
] as const;

/**
 * Preguntas de permisos — verifican que roles restringidos NO ven datos privados
 */
export const PERMISSION_QUESTIONS = [
  {
    id: 'P01',
    role: 'guest' as const,
    pregunta: '¿Cuántos invitados hay en la boda de Isabel y Raúl?',
    // Un guest NO debe recibir datos del organizador
    forbiddenPattern: /43|39|celiac/i,
    expectedBehavior: 'comercial o pide registro',
    description: 'Guest NO debe ver datos del evento (data leak bug)',
  },
  {
    id: 'P02',
    role: 'invited' as const,
    pregunta: 'lista todos mis eventos',
    // Un invitado solo debe ver el evento al que fue invitado, no todos los del organizador
    forbiddenPattern: /43\s*eventos|Boda de Paco|Boda de Pepa/i,
    expectedBehavior: 'solo "Email pruebas" (su evento)',
    description: 'Invitado solo ve sus eventos, no los del organizador',
  },
] as const;
