/**
 * pageContextExtractor - Extrae datos relevantes del evento según la pantalla actual
 *
 * Este módulo permite que el Copilot tenga contexto real de los datos
 * que el usuario está viendo en cada pantalla.
 */

import { Event } from '../../utils/Interfaces';

export interface PageContextData {
  path: string;
  pageName: string;
  pageDescription: string;
  eventSummary: EventSummary | null;
  screenData: Record<string, any>;
}

export interface EventSummary {
  id: string;
  name: string;
  type: string;
  date: string;
  totalGuests: number;
  confirmedGuests: number;
  pendingGuests: number;
  totalBudget: number;
  spent: number;
  paid: number;
  currency: string;
}

/**
 * Extrae un resumen general del evento
 */
function getEventSummary(event: Event | null): EventSummary | null {
  if (!event) return null;

  const guests = event.invitados_array || [];
  const confirmedGuests = guests.filter(g => g.asistencia === 'confirmado' || g.asistencia === 'si').length;
  const pendingGuests = guests.filter(g => g.asistencia === 'pendiente' || !g.asistencia).length;

  return {
    id: event._id,
    name: event.nombre,
    type: event.tipo,
    date: event.fecha,
    totalGuests: guests.length,
    confirmedGuests,
    pendingGuests,
    totalBudget: event.presupuesto_objeto?.presupuesto_total || 0,
    spent: event.presupuesto_objeto?.coste_final || 0,
    paid: event.presupuesto_objeto?.pagado || 0,
    currency: event.presupuesto_objeto?.currency || 'EUR',
  };
}

/**
 * Extrae datos específicos de la pantalla de Presupuesto
 */
function getPresupuestoData(event: Event | null) {
  if (!event?.presupuesto_objeto) return {};

  const budget = event.presupuesto_objeto;
  const categories = budget.categorias_array || [];

  return {
    presupuestoTotal: budget.presupuesto_total,
    costeEstimado: budget.coste_estimado,
    costeFinal: budget.coste_final,
    pagado: budget.pagado,
    pendiente: budget.coste_final - budget.pagado,
    currency: budget.currency,
    totalCategorias: categories.length,
    categorias: categories.map(cat => ({
      nombre: cat.nombre,
      costeEstimado: cat.coste_estimado,
      costeFinal: cat.coste_final,
      pagado: cat.pagado,
      pendiente: cat.coste_final - cat.pagado,
      totalGastos: cat.gastos_array?.length || 0,
    })),
    resumenGastos: `${categories.length} categorías con ${categories.reduce((acc, cat) => acc + (cat.gastos_array?.length || 0), 0)} gastos registrados`,
  };
}

/**
 * Extrae datos específicos de la pantalla de Invitados
 */
function getInvitadosData(event: Event | null) {
  if (!event?.invitados_array) return {};

  const guests = event.invitados_array;
  const groups = event.grupos_array || [];

  // Contar por estado de confirmación (campo: asistencia)
  const confirmados = guests.filter(g => g.asistencia === 'confirmado' || g.asistencia === 'si');
  const pendientes = guests.filter(g => g.asistencia === 'pendiente' || !g.asistencia);
  const rechazados = guests.filter(g => g.asistencia === 'no' || g.asistencia === 'rechazado');

  // Contar pases (passesQuantity representa acompañantes)
  const totalPases = guests.reduce((acc, g) => acc + (g.passesQuantity || 0), 0);

  return {
    totalInvitados: guests.length,
    confirmados: confirmados.length,
    pendientes: pendientes.length,
    rechazados: rechazados.length,
    totalPases,
    totalPersonas: guests.length + totalPases,
    grupos: groups,
    totalGrupos: groups.length,
    invitadosPorGrupo: groups.map(grupo => ({
      nombre: grupo,
      cantidad: guests.filter(g => g.grupo_relacion === grupo).length,
    })),
    resumen: `${guests.length} invitados principales + ${totalPases} pases adicionales = ${guests.length + totalPases} personas totales`,
  };
}

/**
 * Extrae datos específicos de la pantalla de Mesas
 */
function getMesasData(event: Event | null) {
  if (!event) return {};

  const tables = event.mesas_array || [];
  const planSpaces = event.planSpace || [];
  const guests = event.invitados_array || [];

  // Contar invitados sentados (campo: nombre_mesa)
  const sentados = guests.filter(g => g.nombre_mesa && g.nombre_mesa !== '');
  const sinSentar = guests.filter(g => !g.nombre_mesa || g.nombre_mesa === '');

  return {
    totalMesas: tables.length,
    totalPlanos: planSpaces.length,
    invitadosSentados: sentados.length,
    invitadosSinSentar: sinSentar.length,
    planos: planSpaces.map(ps => ({
      id: ps._id,
      nombre: ps.title,
      totalMesas: ps.tables?.length || 0,
    })),
    resumen: `${tables.length} mesas en ${planSpaces.length} planos. ${sentados.length} sentados, ${sinSentar.length} sin asignar`,
  };
}

/**
 * Extrae datos específicos de la pantalla de Itinerario
 */
function getItinerarioData(event: Event | null) {
  if (!event?.itinerarios_array) return {};

  const itinerarios = event.itinerarios_array;
  const totalTasks = itinerarios.reduce((acc, it) => acc + (it.tasks?.length || 0), 0);
  const completedTasks = itinerarios.reduce((acc, it) =>
    acc + (it.tasks?.filter(t => t.estatus)?.length || 0), 0);

  return {
    totalItinerarios: itinerarios.length,
    totalTareas: totalTasks,
    tareasCompletadas: completedTasks,
    tareasPendientes: totalTasks - completedTasks,
    itinerarios: itinerarios.map(it => ({
      id: it._id,
      titulo: it.title,
      tipo: it.tipo,
      totalTareas: it.tasks?.length || 0,
      tareasCompletadas: it.tasks?.filter(t => t.estatus)?.length || 0,
    })),
    resumen: `${itinerarios.length} itinerarios con ${totalTasks} tareas (${completedTasks} completadas)`,
  };
}

/**
 * Extrae datos específicos de la pantalla de Invitaciones
 */
function getInvitacionesData(event: Event | null) {
  if (!event) return {};

  const guests = event.invitados_array || [];

  // Invitaciones enviadas (simplificado - puedes ajustar según tu modelo)
  const conEmail = guests.filter((g: any) => g.email && g.email !== '');
  const conTelefono = guests.filter((g: any) => g.telefono && g.telefono !== '');

  return {
    totalInvitados: guests.length,
    conEmail: conEmail.length,
    sinEmail: guests.length - conEmail.length,
    conTelefono: conTelefono.length,
    sinTelefono: guests.length - conTelefono.length,
    templateEmail: event.templateEmailSelect,
    templateWhatsapp: event.templateWhatsappSelect,
    resumen: `${conEmail.length} invitados con email, ${conTelefono.length} con teléfono`,
  };
}

/**
 * Extrae datos específicos del Resumen del evento
 */
function getResumenData(event: Event | null) {
  if (!event) return {};

  return {
    ...getEventSummary(event),
    presupuesto: getPresupuestoData(event),
    invitados: getInvitadosData(event),
    mesas: getMesasData(event),
    itinerario: getItinerarioData(event),
  };
}

/**
 * Mapa de rutas a funciones extractoras
 */
const PAGE_EXTRACTORS: Record<string, (event: Event | null) => Record<string, any>> = {
  '/': getResumenData,
  '/eventos': () => ({}), // Lista de eventos - no necesita datos del evento actual
  '/presupuesto': getPresupuestoData,
  '/invitados': getInvitadosData,
  '/mesas': getMesasData,
  '/invitaciones': getInvitacionesData,
  '/itinerario': getItinerarioData,
  '/servicios': getItinerarioData, // Usa la misma estructura de tareas
  '/resumen-evento': getResumenData,
  '/lista-regalos': () => ({}), // TODO: agregar cuando se defina la estructura
  '/configuracion': () => ({}),
  '/facturacion': () => ({}),
  '/perfil': () => ({}),
};

/**
 * Mapa de nombres de páginas
 */
const PAGE_NAMES: Record<string, { name: string; description: string }> = {
  '/': { name: 'Inicio', description: 'Pantalla principal con resumen del evento' },
  '/eventos': { name: 'Eventos', description: 'Lista de todos los eventos del usuario' },
  '/presupuesto': { name: 'Presupuesto', description: 'Gestión del presupuesto con categorías, gastos y pagos' },
  '/invitados': { name: 'Invitados', description: 'Lista de invitados, grupos y confirmaciones' },
  '/mesas': { name: 'Mesas', description: 'Distribución de mesas y asignación de invitados' },
  '/invitaciones': { name: 'Invitaciones', description: 'Envío de invitaciones por email y WhatsApp' },
  '/itinerario': { name: 'Itinerario', description: 'Cronograma del evento con horarios y actividades' },
  '/servicios': { name: 'Servicios', description: 'Gestión de tareas y proveedores' },
  '/resumen-evento': { name: 'Resumen', description: 'Resumen general con estadísticas del evento' },
  '/lista-regalos': { name: 'Lista de Regalos', description: 'Gestión de la lista de regalos' },
  '/configuracion': { name: 'Configuración', description: 'Configuración del evento' },
  '/facturacion': { name: 'Facturación', description: 'Planes y pagos de la cuenta' },
  '/perfil': { name: 'Perfil', description: 'Perfil del usuario' },
};

/**
 * Función principal que extrae el contexto completo de la página
 */
export function extractPageContext(path: string, event: Event | null): PageContextData {
  const pageInfo = PAGE_NAMES[path] || {
    name: path.replace('/', '').replace(/-/g, ' ') || 'Página',
    description: `Pantalla: ${path}`,
  };

  const extractor = PAGE_EXTRACTORS[path] || (() => ({}));

  return {
    path,
    pageName: pageInfo.name,
    pageDescription: pageInfo.description,
    eventSummary: getEventSummary(event),
    screenData: extractor(event),
  };
}

export default extractPageContext;
