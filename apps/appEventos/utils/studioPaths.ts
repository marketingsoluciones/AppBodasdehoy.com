/**
 * Rutas que sirven el rediseño studio.
 *
 * Servicios (Tareas) e Itinerario comparten LOS MISMOS componentes — ambas páginas montan
 * BoddyIter → ItineraryTabs + ItineraryPanel → VistaTarjeta/VistaTabla/VistaKanban — así que
 * el rediseño ya estaba escrito; solo estaba limitado a /itinerario. Este predicado abre el
 * gate a las dos rutas desde un único sitio, en vez de repetir la comparación en los 16
 * componentes que la tenían (que acabarían desincronizándose).
 *
 * ⚠️ ESTO ES SOLO ESTILO. Por el código quedan comparaciones `pathname === "/itinerario"`
 * que controlan COMPORTAMIENTO —qué acciones se ven en cada módulo, los chips de fecha,
 * minimalView— y que son diferencias INTENCIONALES entre Tareas e Itinerario. No deben
 * unificarse con esto: cambiarlas altera funcionalidad, no aspecto.
 */
export const STUDIO_PATHS: readonly string[] = ["/itinerario", "/servicios"];

/** ¿La ruta indicada sirve el rediseño studio? */
export const isStudioPathname = (pathname?: string | null): boolean =>
  !!pathname && STUDIO_PATHS.includes(pathname);
