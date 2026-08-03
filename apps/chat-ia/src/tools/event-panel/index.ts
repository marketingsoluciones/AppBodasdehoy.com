import { BuiltinToolManifest } from '@lobechat/types';

/**
 * lobe-event-panel — F1/F3 del panel contextual del chat.
 * La IA invoca `show_event_section` cuando el usuario habla del presupuesto o
 * itinerario del evento → se abre el PORTAL (panel lateral del propio chat) con
 * los datos reales (getEventoDetalle). Funciona en standalone por diseño (portal
 * chat-side, no depende de postMessage al parent).
 */
export const EventPanelManifest: BuiltinToolManifest = {
  api: [
    {
      description:
        'Abre el panel lateral del chat mostrando una sección del evento actual (presupuesto o itinerario) con sus datos reales. Úsalo cuando el usuario hable de su presupuesto/gastos/pagos o de su itinerario/agenda y quiera verlo.',
      name: 'show_event_section',
      parameters: {
        properties: {
          eventoId: {
            description:
              'ID del evento (Mongo _id). Tómalo del contexto de página (screenData) del evento actual.',
            type: 'string',
          },
          section: {
            description: 'Sección del evento a mostrar en el panel.',
            enum: ['presupuesto', 'itinerario'],
            type: 'string',
          },
        },
        required: ['section', 'eventoId'],
        type: 'object',
      },
    },
  ],
  identifier: 'lobe-event-panel',
  meta: {
    avatar: '📊',
    title: 'Panel del evento',
  },
  systemRole: `Cuando el usuario hable del PRESUPUESTO (gastos, coste, pagos, cuánto llevo) o del ITINERARIO (agenda, tareas, timing) de su evento y quiera verlo, invoca show_event_section con { section, eventoId }.
- El eventoId está en el contexto de página (screenData) del evento actual.
- Tras invocarlo, el panel lateral del chat muestra la sección con los datos REALES (solo lectura por ahora).
- En tu respuesta menciónalo brevemente: "Te muestro el presupuesto en el panel derecho."
NO uses esta herramienta si el usuario no se refiere a un evento concreto o no hay eventoId disponible.`,
  type: 'builtin',
};
