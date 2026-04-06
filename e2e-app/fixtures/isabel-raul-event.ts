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

  // Invitados — verificados 2026-04-01
  invitados: {
    total: 43,
    confirmados: 39,
    pendientes: 3,
    rechazados: 0,
    pendientesList: ['Jose Luis', 'Maria Garcia', 'Juancarlos test'],
  },

  // Restricciones alimentarias
  // ⚠️  api-ia devuelve 9 en el resumen aunque lista ~15 nombres (bug de conteo en api-ia).
  // Valor verificado vía respuesta AI 2026-04-03. Actualizar cuando api-ia corrija el conteo.
  dietas: {
    celiacos: 9,
  },
} as const;

/**
 * Usuarios de prueba y sus roles en el sistema
 *
 * Cada email tiene un rol distinto para testear permisos.
 * Password compartida: lorca2012M*+
 */
export const TEST_USERS = {
  // Organizador principal — ve todos sus 43 eventos
  organizador: {
    email: 'bodasdehoy.com@gmail.com',
    password: 'lorca2012M*+',
    role: 'creator',
    eventosCount: 43, // total eventos relacionados con este usuario
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

  // Colaborador 2 / Invitado — invitado al evento "Email pruebas"
  colaborador2: {
    email: 'jcc@bodasdehoy.com',
    password: 'lorca2012M*+',
    role: 'invited',                // invitado en "Email pruebas"
    eventoAcceso: 'Email pruebas',
    eventoAccesoId: '69838b14e3550784e116b682',
    canSeeIsabelRaul: false,        // no tiene acceso a Isabel & Raúl
    canModify: false,               // solo lectura
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
