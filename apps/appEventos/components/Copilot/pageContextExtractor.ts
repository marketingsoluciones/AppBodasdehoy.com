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
 * Extrae contexto básico de la página actual.
 * Envuelto en try/catch para que un campo inesperado nunca rompa el Copilot.
 */
export function extractPageContext(path: string, event: Event | null): PageContextData {
  try {
    return _extractPageContextUnsafe(path, event);
  } catch (err) {
    console.warn('[pageContextExtractor] Error extracting context, returning defaults', err);
    return {
      path,
      pageName: 'Desconocida',
      pageDescription: '',
      eventSummary: null,
      screenData: {},
    };
  }
}

function _extractPageContextUnsafe(path: string, event: Event | null): PageContextData {
  // Determinar nombre de la página según el path
  let pageName = 'Inicio';
  let pageDescription = 'Página principal del evento';

  if (path.includes('/invitados')) {
    pageName = 'Invitados';
    pageDescription = 'Gestión de invitados y listas';
  } else if (path.includes('/presupuesto')) {
    pageName = 'Presupuesto';
    pageDescription = 'Gestión del presupuesto del evento';
  } else if (path.includes('/itinerario')) {
    pageName = 'Itinerario';
    pageDescription = 'Vista cronológica del itinerario y tareas';
  } else if (path.includes('/servicios')) {
    pageName = 'Servicios';
    pageDescription = 'Vista Kanban de tareas y servicios del evento';
  } else if (path.includes('/mesas')) {
    pageName = 'Mesas';
    pageDescription = 'Gestión de mesas y distribución de invitados';
  } else if (path.includes('/invitaciones')) {
    pageName = 'Invitaciones';
    pageDescription = 'Envío y gestión de invitaciones digitales';
  } else if (path.includes('/lista-regalos')) {
    pageName = 'Lista de regalos';
    pageDescription = 'Lista de regalos del evento';
  } else if (path.includes('/resumen-evento')) {
    pageName = 'Resumen del evento';
    pageDescription = 'Vista general y resumen del evento';
  } else if (path.includes('/proveedores')) {
    pageName = 'Proveedores';
    pageDescription = 'Gestión de proveedores del evento';
  } else if (path.includes('/tareas')) {
    pageName = 'Tareas';
    pageDescription = 'Lista de tareas del evento';
  } else if (path.includes('/diseño-espacios') || path.includes('/diseno-espacios')) {
    pageName = 'Diseño de espacios';
    pageDescription = 'Visualización de decoración de espacios con IA';
  } else if (path.includes('/momentos')) {
    pageName = 'Momentos';
    pageDescription = 'Álbumes de fotos y recuerdos del evento';
  }

  // Resumen básico del evento (con optional chaining para campos opcionales)
  let eventSummary: EventSummary | null = null;
  if (event) {
    const guests = event.invitados_array ?? [];
    const confirmed = guests.filter(g =>
      g?.asistencia === 'confirmado' || g?.asistencia === 'si'
    ).length;
    const pending = guests.filter(g =>
      g?.asistencia === 'pendiente' || !g?.asistencia
    ).length;

    eventSummary = {
      id: event._id ?? '',
      name: event.nombre ?? '',
      type: event.tipo ?? '',
      date: event.fecha ?? '',
      totalGuests: guests.length,
      confirmedGuests: confirmed,
      pendingGuests: pending,
      totalBudget: event.presupuesto_objeto?.presupuesto_total ?? 0,
      spent: event.presupuesto_objeto?.coste_final ?? 0,
      paid: event.presupuesto_objeto?.pagado ?? 0,
      currency: event.presupuesto_objeto?.currency ?? 'EUR',
    };
  }

  // Poblar screenData con datos reales según la página actual
  const screenData: Record<string, any> = {};

  if (event) {
    const guests = event.invitados_array ?? [];

    if (path.includes('/invitados') && guests.length > 0) {
      screenData.totalGuests = guests.length;
      screenData.guestList = guests.map((g: any) => ({
        id: g?._id ?? null,
        nombre: g?.nombre ?? '',
        asistencia: g?.asistencia ?? 'pendiente',
        menu: g?.nombre_menu ?? null,
        mesa_recepcion: g?.tableNameRecepcion?.title ?? g?.nombre_mesa ?? null,
        mesa_ceremonia: g?.tableNameCeremonia?.title ?? null,
        grupo: g?.grupo_relacion ?? null,
        acompanantes: g?.passesQuantity ?? 0,
        sexo: g?.sexo ?? null,
        grupo_edad: g?.grupo_edad ?? null,
        alergenos: g?.alergenos?.length ? g.alergenos : null,
      }));
    }

    if (path.includes('/presupuesto') && event.presupuesto_objeto) {
      const p = event.presupuesto_objeto as any;
      screenData.budget = {
        presupuesto_total: p?.presupuesto_total ?? 0,
        coste_final: p?.coste_final ?? 0,
        pagado: p?.pagado ?? 0,
        pendiente: (p?.coste_final ?? 0) - (p?.pagado ?? 0),
        currency: p?.currency ?? 'EUR',
        categorias: (p?.categorias_array ?? []).map((cat: any) => ({
          nombre: cat?.nombre ?? '',
          presupuesto: cat?.coste_estimado ?? 0,
          coste: cat?.coste_final ?? 0,
          pagado: cat?.pagado ?? 0,
        })),
      };
    }

    if (path.includes('/mesas') && guests.length > 0) {
      const mesaMap: Record<string, string[]> = {};
      guests.forEach((g: any) => {
        const mesa = g?.tableNameRecepcion?.title ?? g?.nombre_mesa ?? 'Sin mesa';
        if (!mesaMap[mesa]) mesaMap[mesa] = [];
        mesaMap[mesa].push(g?.nombre ?? '');
      });
      screenData.tables = Object.entries(mesaMap).map(([mesa, guestNames]) => ({
        mesa,
        invitados: guestNames,
        capacidad: guestNames.length,
      }));
    }

    if (path.includes('/itinerario')) {
      const itinerarios = (event as any).itinerarios_array ?? [];
      if (itinerarios.length > 0) {
        screenData.itinerary = itinerarios.map((item: any) => ({
          titulo: item?.title ?? item?.titulo ?? item?.nombre ?? '',
          tipo: item?.tipo ?? null,
          tareas: (item?.tasks ?? []).map((t: any) => ({
            descripcion: t?.descripcion ?? '',
            completada: t?.completada ?? t?.estatus ?? false,
            icon: t?.icon ?? null,
            fecha: t?.fecha ?? null,
          })),
        }));
      }
    }

    // --- Páginas que faltaban ---

    if (path.includes('/proveedores')) {
      // Extraer proveedores de las categorías del presupuesto (si existen)
      const categorias = (event.presupuesto_objeto as any)?.categorias_array ?? [];
      const proveedores = categorias
        .filter((cat: any) => cat?.proveedor || cat?.nombre_proveedor)
        .map((cat: any) => ({
          categoria: cat?.nombre ?? '',
          proveedor: cat?.nombre_proveedor ?? cat?.proveedor ?? '',
          coste: cat?.coste_final ?? 0,
          pagado: cat?.pagado ?? 0,
        }));
      if (proveedores.length > 0) {
        screenData.proveedores = proveedores;
      }
    }

    if (path.includes('/tareas')) {
      // Extraer tareas de los itinerarios
      const itinerarios = (event as any).itinerarios_array ?? [];
      const allTasks: any[] = [];
      itinerarios.forEach((item: any) => {
        (item?.tasks ?? []).forEach((t: any) => {
          allTasks.push({
            descripcion: t?.descripcion ?? '',
            completada: t?.completada ?? t?.estatus ?? false,
            fecha: t?.fecha ?? null,
            categoria: item?.title ?? item?.titulo ?? '',
          });
        });
      });
      if (allTasks.length > 0) {
        screenData.tareas = allTasks;
        screenData.tareasCompletadas = allTasks.filter(t => t.completada).length;
        screenData.tareasPendientes = allTasks.filter(t => !t.completada).length;
      }
    }

    if (path.includes('/lista-regalos')) {
      screenData.listaRegalos = event.listaRegalos ?? null;
      // Si hay lista de identificadores (links a Amazon, etc.)
      const identifiers = (event as any).listIdentifiers ?? [];
      if (identifiers.length > 0) {
        screenData.listIdentifiers = identifiers.map((li: any) => ({
          nombre: li?.nombre ?? li?.title ?? '',
          url: li?.url ?? '',
          tipo: li?.tipo ?? null,
        }));
      }
    }

    if (path.includes('/resumen-evento')) {
      // Resumen general: reutilizar eventSummary + stats adicionales
      screenData.resumen = {
        tipo: event.tipo ?? '',
        fecha: event.fecha ?? '',
        poblacion: (event as any).poblacion ?? '',
        pais: (event as any).pais ?? '',
        lugar: (event as any).lugar?.nombre ?? null,
        totalInvitados: guests.length,
        mesasCreadas: (event.mesas_array ?? []).length,
        itinerarios: ((event as any).itinerarios_array ?? []).length,
      };
    }
  }

  return {
    path,
    pageName,
    pageDescription,
    eventSummary,
    screenData,
  };
}
