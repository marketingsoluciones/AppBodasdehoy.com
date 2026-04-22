/**
 * pageContextExtractor — Extrae contexto enriquecido de la página actual para el Copilot.
 *
 * Envía analytics computados por sección + resumen cross-section para que el AI
 * pueda responder preguntas contextuales sin necesidad de tools adicionales.
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
  daysUntilEvent: number;
  totalGuests: number;
  confirmedGuests: number;
  pendingGuests: number;
  declinedGuests: number;
  guestsWithMenu: number;
  guestsWithTable: number;
  guestsWithAllergies: number;
  totalBudget: number;
  spent: number;
  paid: number;
  budgetRemaining: number;
  currency: string;
  totalTasks: number;
  completedTasks: number;
}

/**
 * Extrae contexto de la página actual. Envuelto en try/catch para seguridad.
 */
export function extractPageContext(path: string, event: Event | null): PageContextData {
  try {
    return _extractPageContextUnsafe(path, event);
  } catch (err) {
    console.warn('[pageContextExtractor] Error extracting context, returning defaults', err);
    return { path, pageName: 'Desconocida', pageDescription: '', eventSummary: null, screenData: {} };
  }
}

// ========================================
// Helpers
// ========================================

function countBy<T>(arr: T[], fn: (item: T) => string): Record<string, number> {
  const map: Record<string, number> = {};
  arr.forEach(item => { const k = fn(item) || 'unknown'; map[k] = (map[k] || 0) + 1; });
  return map;
}

function daysUntil(dateStr: string | null | undefined): number {
  if (!dateStr) return -1;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return -1;
  return Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function getAllTasks(event: any): any[] {
  const itinerarios = event?.itinerarios_array ?? [];
  const tasks: any[] = [];
  itinerarios.forEach((it: any) => {
    (it?.tasks ?? []).forEach((t: any) => {
      tasks.push({
        id: t?._id,
        descripcion: t?.descripcion ?? '',
        completada: t?.completada ?? t?.estatus ?? false,
        fecha: t?.fecha ?? null,
        prioridad: t?.prioridad ?? '',
        responsable: t?.responsable ?? [],
        tags: t?.tags ?? [],
        categoria: it?.title ?? it?.titulo ?? '',
      });
    });
  });
  return tasks;
}

// ========================================
// Main extraction
// ========================================

function _extractPageContextUnsafe(path: string, event: Event | null): PageContextData {
  // Page name mapping
  const pageMap: Record<string, [string, string]> = {
    '/invitados': ['Invitados', 'Gestión de invitados y listas'],
    '/presupuesto': ['Presupuesto', 'Gestión del presupuesto del evento'],
    '/itinerario': ['Itinerario', 'Vista cronológica del itinerario y tareas'],
    '/servicios': ['Servicios', 'Vista Kanban de tareas y servicios del evento'],
    '/mesas': ['Mesas', 'Gestión de mesas y distribución de invitados'],
    '/invitaciones': ['Invitaciones', 'Envío y gestión de invitaciones digitales'],
    '/lista-regalos': ['Lista de regalos', 'Lista de regalos del evento'],
    '/resumen-evento': ['Resumen del evento', 'Vista general y resumen del evento'],
    '/proveedores': ['Proveedores', 'Gestión de proveedores del evento'],
    '/tareas': ['Tareas', 'Lista de tareas del evento'],
    '/momentos': ['Momentos', 'Álbumes de fotos y recuerdos del evento'],
  };

  let pageName = 'Inicio';
  let pageDescription = 'Página principal del evento';
  for (const [key, [name, desc]] of Object.entries(pageMap)) {
    if (path.includes(key)) { pageName = name; pageDescription = desc; break; }
  }
  if (path.includes('/diseño-espacios') || path.includes('/diseno-espacios')) {
    pageName = 'Diseño de espacios';
    pageDescription = 'Visualización de decoración de espacios con IA';
  }

  // ========================================
  // Event Summary (enriquecido)
  // ========================================

  let eventSummary: EventSummary | null = null;
  const screenData: Record<string, any> = {};

  if (!event) {
    return { path, pageName, pageDescription, eventSummary, screenData };
  }

  const guests: any[] = event.invitados_array ?? [];
  const allTasks = getAllTasks(event);
  const p = event.presupuesto_objeto as any;

  const confirmed = guests.filter(g => g?.asistencia === 'confirmado' || g?.asistencia === 'si').length;
  const pending = guests.filter(g => g?.asistencia === 'pendiente' || !g?.asistencia).length;
  const declined = guests.filter(g => g?.asistencia === 'no' || g?.asistencia === 'rechazado').length;

  eventSummary = {
    id: event._id ?? '',
    name: event.nombre ?? '',
    type: event.tipo ?? '',
    date: event.fecha ?? '',
    daysUntilEvent: daysUntil(event.fecha),
    totalGuests: guests.length,
    confirmedGuests: confirmed,
    pendingGuests: pending,
    declinedGuests: declined,
    guestsWithMenu: guests.filter(g => g?.nombre_menu).length,
    guestsWithTable: guests.filter(g => g?.tableNameRecepcion?.title || g?.nombre_mesa).length,
    guestsWithAllergies: guests.filter(g => g?.alergenos?.length > 0).length,
    totalBudget: p?.presupuesto_total ?? 0,
    spent: p?.coste_final ?? 0,
    paid: p?.pagado ?? 0,
    budgetRemaining: (p?.presupuesto_total ?? 0) - (p?.coste_final ?? 0),
    currency: p?.currency ?? 'EUR',
    totalTasks: allTasks.length,
    completedTasks: allTasks.filter(t => t.completada).length,
  };

  // ========================================
  // Cross-section summary (siempre disponible)
  // ========================================

  const confirmedWithoutTable = guests
    .filter(g => (g?.asistencia === 'confirmado' || g?.asistencia === 'si') && !g?.tableNameRecepcion?.title && !g?.nombre_mesa)
    .map(g => ({ id: g?._id, nombre: g?.nombre }));

  const guestsWithAllergyByTable: Record<string, string[]> = {};
  guests.forEach(g => {
    if (g?.alergenos?.length > 0) {
      const mesa = g?.tableNameRecepcion?.title || g?.nombre_mesa || 'Sin mesa';
      if (!guestsWithAllergyByTable[mesa]) guestsWithAllergyByTable[mesa] = [];
      guestsWithAllergyByTable[mesa].push(g?.nombre ?? '');
    }
  });

  const categorias = (p?.categorias_array ?? []);
  const unpaidCategories = categorias
    .filter((c: any) => (c?.coste_final ?? 0) > 0 && (c?.pagado ?? 0) < (c?.coste_final ?? 0))
    .map((c: any) => ({ nombre: c?.nombre, pendiente: (c?.coste_final ?? 0) - (c?.pagado ?? 0) }));

  const now = new Date();
  const overdueTasks = allTasks.filter(t => !t.completada && t.fecha && new Date(t.fecha) < now)
    .map(t => ({ descripcion: t.descripcion, fecha: t.fecha, categoria: t.categoria }));

  const unsentInvitations = guests.filter(g => !g?.invitacion).length;

  screenData._crossSection = {
    confirmedWithoutTable: confirmedWithoutTable.slice(0, 20),
    confirmedWithoutTableCount: confirmedWithoutTable.length,
    guestsWithAllergyByTable,
    unpaidCategories,
    overdueTasks: overdueTasks.slice(0, 10),
    overdueTasksCount: overdueTasks.length,
    unsentInvitations,
  };

  // ========================================
  // Per-page screenData + analytics
  // ========================================

  // --- INVITADOS ---
  if (path.includes('/invitados') && guests.length > 0) {
    screenData.totalGuests = guests.length;
    screenData.guestList = guests.map((g: any) => ({
      id: g?._id ?? null,
      nombre: g?.nombre ?? '',
      asistencia: g?.asistencia ?? 'pendiente',
      menu: g?.nombre_menu ?? null,
      mesa_recepcion: g?.tableNameRecepcion?.title ?? g?.nombre_mesa ?? null,
      grupo: g?.grupo_relacion ?? null,
      acompanantes: g?.passesQuantity ?? 0,
      sexo: g?.sexo ?? null,
      grupo_edad: g?.grupo_edad ?? null,
      alergenos: g?.alergenos?.length ? g.alergenos : null,
    }));
    screenData.guestAnalytics = {
      byAsistencia: countBy(guests, g => g?.asistencia ?? 'pendiente'),
      bySexo: countBy(guests, g => g?.sexo ?? 'no especificado'),
      byGrupoEdad: countBy(guests, g => String(g?.grupo_edad ?? 'adulto')),
      byMenu: countBy(guests.filter(g => g?.nombre_menu), g => g.nombre_menu),
      byGrupo: countBy(guests.filter(g => g?.grupo_relacion), g => g.grupo_relacion),
      withAllergies: guests.filter(g => g?.alergenos?.length > 0).length,
      withoutTable: guests.filter(g => !g?.tableNameRecepcion?.title && !g?.nombre_mesa).length,
      withoutMenu: guests.filter(g => !g?.nombre_menu).length,
      totalPasses: guests.reduce((sum, g) => sum + (g?.passesQuantity ?? 0), 0),
    };
  }

  // --- PRESUPUESTO ---
  if (path.includes('/presupuesto') && p) {
    screenData.budget = {
      presupuesto_total: p?.presupuesto_total ?? 0,
      coste_final: p?.coste_final ?? 0,
      pagado: p?.pagado ?? 0,
      pendiente: (p?.coste_final ?? 0) - (p?.pagado ?? 0),
      currency: p?.currency ?? 'EUR',
      categorias: categorias.map((cat: any) => ({
        nombre: cat?.nombre ?? '',
        presupuesto: cat?.coste_estimado ?? 0,
        coste: cat?.coste_final ?? 0,
        pagado: cat?.pagado ?? 0,
      })),
    };
    const sorted = [...categorias].sort((a: any, b: any) => (b?.coste_final ?? 0) - (a?.coste_final ?? 0));
    screenData.budgetAnalytics = {
      totalBudget: p?.presupuesto_total ?? 0,
      totalSpent: p?.coste_final ?? 0,
      totalPaid: p?.pagado ?? 0,
      pendingPayment: (p?.coste_final ?? 0) - (p?.pagado ?? 0),
      overBudgetAmount: Math.max(0, (p?.coste_final ?? 0) - (p?.presupuesto_total ?? 0)),
      isOverBudget: (p?.coste_final ?? 0) > (p?.presupuesto_total ?? 0),
      topCategory: sorted[0] ? { nombre: sorted[0].nombre, coste: sorted[0].coste_final } : null,
      categoriesOverBudget: categorias
        .filter((c: any) => (c?.coste_final ?? 0) > (c?.coste_estimado ?? 0) && (c?.coste_estimado ?? 0) > 0)
        .map((c: any) => ({ nombre: c.nombre, exceso: (c.coste_final ?? 0) - (c.coste_estimado ?? 0) })),
      unpaidCategories,
    };
  }

  // --- MESAS ---
  if (path.includes('/mesas') && guests.length > 0) {
    const mesaMap: Record<string, string[]> = {};
    guests.forEach((g: any) => {
      const mesa = g?.tableNameRecepcion?.title ?? g?.nombre_mesa ?? 'Sin mesa';
      if (!mesaMap[mesa]) mesaMap[mesa] = [];
      mesaMap[mesa].push(g?.nombre ?? '');
    });
    screenData.tables = Object.entries(mesaMap).map(([mesa, names]) => ({
      mesa, invitados: names, capacidad: names.length,
    }));
    const seated = guests.filter(g => g?.tableNameRecepcion?.title || g?.nombre_mesa).length;
    screenData.tableAnalytics = {
      totalTables: Object.keys(mesaMap).filter(k => k !== 'Sin mesa').length,
      totalSeated: seated,
      totalUnseated: guests.length - seated,
      guestsWithAllergyByTable,
      tableOccupancy: Object.entries(mesaMap)
        .filter(([k]) => k !== 'Sin mesa')
        .map(([mesa, names]) => ({ mesa, seated: names.length })),
    };
  }

  // --- ITINERARIO ---
  if (path.includes('/itinerario')) {
    const itinerarios = (event as any).itinerarios_array ?? [];
    if (itinerarios.length > 0) {
      screenData.itinerary = itinerarios.map((item: any) => ({
        titulo: item?.title ?? item?.titulo ?? '',
        tipo: item?.tipo ?? null,
        tareas: (item?.tasks ?? []).map((t: any) => ({
          id: t?._id,
          descripcion: t?.descripcion ?? '',
          completada: t?.completada ?? t?.estatus ?? false,
          icon: t?.icon ?? null,
          fecha: t?.fecha ?? null,
          prioridad: t?.prioridad ?? '',
        })),
      }));
    }
    screenData.taskAnalytics = {
      totalTasks: allTasks.length,
      completed: allTasks.filter(t => t.completada).length,
      pending: allTasks.filter(t => !t.completada).length,
      overdue: overdueTasks.slice(0, 5),
      overdueCount: overdueTasks.length,
      byPriority: countBy(allTasks, t => t.prioridad || 'normal'),
      byCategory: countBy(allTasks, t => t.categoria),
      nextDueTask: allTasks
        .filter(t => !t.completada && t.fecha && new Date(t.fecha) > now)
        .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())[0] ?? null,
    };
  }

  // --- SERVICIOS ---
  if (path.includes('/servicios')) {
    screenData.servicios = {
      totalTasks: allTasks.length,
      completed: allTasks.filter(t => t.completada).length,
      pending: allTasks.filter(t => !t.completada).length,
      byPriority: countBy(allTasks, t => t.prioridad || 'normal'),
      tasks: allTasks.slice(0, 50),
    };
  }

  // --- INVITACIONES ---
  if (path.includes('/invitaciones')) {
    const sent = guests.filter(g => g?.invitacion === true);
    const unsent = guests.filter(g => !g?.invitacion);
    screenData.invitationAnalytics = {
      totalGuests: guests.length,
      sent: sent.length,
      unsent: unsent.length,
      byChannel: {
        email: sent.filter(g => g?.comunicaciones_array?.some((c: any) => c?.transport === 'email')).length,
        whatsapp: sent.filter(g => g?.comunicaciones_array?.some((c: any) => c?.transport === 'whatsapp')).length,
      },
      guestsWithEmail: guests.filter(g => g?.correo).length,
      guestsWithPhone: guests.filter(g => g?.telefono || g?.movil).length,
      noContactInfo: guests.filter(g => !g?.correo && !g?.telefono && !g?.movil).length,
      sentButNotConfirmed: sent.filter(g => g?.asistencia === 'pendiente' || !g?.asistencia).length,
    };
  }

  // --- PROVEEDORES ---
  if (path.includes('/proveedores')) {
    const proveedores = categorias
      .filter((cat: any) => cat?.proveedor || cat?.nombre_proveedor)
      .map((cat: any) => ({
        categoria: cat?.nombre ?? '',
        proveedor: cat?.nombre_proveedor ?? cat?.proveedor ?? '',
        coste: cat?.coste_final ?? 0,
        pagado: cat?.pagado ?? 0,
      }));
    if (proveedores.length > 0) screenData.proveedores = proveedores;
  }

  // --- TAREAS ---
  if (path.includes('/tareas')) {
    screenData.tareas = allTasks;
    screenData.tareasCompletadas = allTasks.filter(t => t.completada).length;
    screenData.tareasPendientes = allTasks.filter(t => !t.completada).length;
    screenData.taskAnalytics = {
      totalTasks: allTasks.length,
      completed: allTasks.filter(t => t.completada).length,
      pending: allTasks.filter(t => !t.completada).length,
      overdue: overdueTasks.slice(0, 5),
      overdueCount: overdueTasks.length,
      byPriority: countBy(allTasks, t => t.prioridad || 'normal'),
    };
  }

  // --- LISTA DE REGALOS ---
  if (path.includes('/lista-regalos')) {
    screenData.listaRegalos = event.listaRegalos ?? null;
    const identifiers = (event as any).listIdentifiers ?? [];
    if (identifiers.length > 0) {
      screenData.listIdentifiers = identifiers.map((li: any) => ({
        nombre: li?.nombre ?? li?.title ?? '',
        url: li?.url ?? '',
        tipo: li?.tipo ?? null,
      }));
    }
  }

  // --- MOMENTOS ---
  if (path.includes('/momentos')) {
    screenData.momentos = {
      eventId: event._id,
      eventName: event.nombre,
    };
  }

  // --- RESUMEN EVENTO ---
  if (path.includes('/resumen-evento')) {
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

    // Readiness checklist
    const totalG = guests.length || 1;
    const sentInv = guests.filter(g => g?.invitacion).length;
    const paidCats = categorias.filter((c: any) => (c?.coste_final ?? 0) > 0 && (c?.pagado ?? 0) >= (c?.coste_final ?? 0)).length;
    const totalCatsWithCost = categorias.filter((c: any) => (c?.coste_final ?? 0) > 0).length || 1;

    screenData.readiness = {
      score: Math.round(
        (confirmed / totalG * 25) +
        (eventSummary.guestsWithTable / totalG * 20) +
        (sentInv / totalG * 20) +
        ((allTasks.length ? allTasks.filter(t => t.completada).length / allTasks.length : 1) * 20) +
        (paidCats / totalCatsWithCost * 15)
      ),
      checks: [
        { name: 'Invitados confirmados', status: confirmed / totalG > 0.8 ? 'ok' : confirmed / totalG > 0.5 ? 'warning' : 'danger', value: `${confirmed}/${guests.length}` },
        { name: 'Presupuesto', status: (p?.coste_final ?? 0) <= (p?.presupuesto_total ?? 0) ? 'ok' : 'danger', value: `${p?.coste_final ?? 0}/${p?.presupuesto_total ?? 0} ${p?.currency ?? 'EUR'}` },
        { name: 'Mesas asignadas', status: eventSummary.guestsWithTable >= totalG * 0.9 ? 'ok' : 'warning', value: `${eventSummary.guestsWithTable}/${guests.length} sentados` },
        { name: 'Invitaciones enviadas', status: sentInv >= totalG * 0.9 ? 'ok' : sentInv >= totalG * 0.5 ? 'warning' : 'danger', value: `${sentInv}/${guests.length}` },
        { name: 'Tareas completadas', status: overdueTasks.length === 0 ? 'ok' : 'warning', value: `${allTasks.filter(t => t.completada).length}/${allTasks.length}` },
        { name: 'Servicios pagados', status: paidCats >= totalCatsWithCost * 0.8 ? 'ok' : 'warning', value: `${paidCats}/${totalCatsWithCost} pagados` },
      ],
    };
  }

  return { path, pageName, pageDescription, eventSummary, screenData };
}
