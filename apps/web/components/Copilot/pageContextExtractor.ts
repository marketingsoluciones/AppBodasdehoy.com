/**
 * pageContextExtractor - Stub simple para extraer contexto de página
 *
 * Versión simplificada restaurada del commit f509f55.
 * Proporciona contexto básico sin la lógica compleja agregada en commits posteriores.
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
 * Extrae contexto básico de la página actual
 */
export function extractPageContext(path: string, event: Event | null): PageContextData {
  // Determinar nombre de la página según el path
  let pageName = 'Inicio';
  let pageDescription = 'Página principal del evento';

  if (path.includes('/invitados')) {
    pageName = 'Invitados';
    pageDescription = 'Gestión de invitados y listas';
  } else if (path.includes('/presupuesto')) {
    pageName = 'Presupuesto';
    pageDescription = 'Gestión del presupuesto del evento';
  } else if (path.includes('/proveedores')) {
    pageName = 'Proveedores';
    pageDescription = 'Gestión de proveedores';
  } else if (path.includes('/tareas')) {
    pageName = 'Tareas';
    pageDescription = 'Lista de tareas del evento';
  }

  // Resumen básico del evento
  let eventSummary: EventSummary | null = null;
  if (event) {
    const guests = event.invitados_array || [];
    const confirmed = guests.filter(g =>
      g.asistencia === 'confirmado' || g.asistencia === 'si'
    ).length;
    const pending = guests.filter(g =>
      g.asistencia === 'pendiente' || !g.asistencia
    ).length;

    eventSummary = {
      id: event._id,
      name: event.nombre,
      type: event.tipo,
      date: event.fecha,
      totalGuests: guests.length,
      confirmedGuests: confirmed,
      pendingGuests: pending,
      totalBudget: event.presupuesto_objeto?.presupuesto_total || 0,
      spent: event.presupuesto_objeto?.coste_final || 0,
      paid: event.presupuesto_objeto?.pagado || 0,
      currency: event.presupuesto_objeto?.currency || 'EUR',
    };
  }

  return {
    path,
    pageName,
    pageDescription,
    eventSummary,
    screenData: {},
  };
}
