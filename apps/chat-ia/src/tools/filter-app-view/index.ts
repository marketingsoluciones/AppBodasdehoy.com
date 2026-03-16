import { BuiltinToolManifest } from '@lobechat/types';

export const FilterAppViewManifest: BuiltinToolManifest = {
  api: [
    {
      description:
        'Filtra la vista principal de la app del organizador para mostrar solo los elementos relevantes (eventos, invitados, mesas, etc.) basándose en los IDs encontrados. Usa esta herramienta DESPUÉS de consultar datos para mostrar al usuario los resultados directamente en la app.',
      name: 'filter_view',
      parameters: {
        properties: {
          entity: {
            description:
              'Tipo de entidad a filtrar en la vista de la app. Usa el tipo que corresponda con la pantalla actual del usuario.',
            enum: [
              'events',
              'guests',
              'tables',
              'budget_items',
              'services',
              'menus',
              'moments',
            ],
            type: 'string',
          },
          ids: {
            description:
              'Lista de IDs de los elementos encontrados que deben mostrarse en la app. Incluye solo los IDs relevantes para la consulta del usuario.',
            items: {
              type: 'string',
            },
            type: 'array',
          },
          query: {
            description:
              'Descripción breve de qué filtró el Copilot. Se muestra al usuario como contexto del filtro activo. Ejemplo: "Eventos con invitado José García", "Mesas en zona jardín".',
            type: 'string',
          },
        },
        required: ['entity', 'ids'],
        type: 'object',
      },
    },
  ],
  identifier: 'lobe-filter-app-view',
  meta: {
    avatar: '🔍',
    title: 'Filtrar Vista App',
  },
  systemRole: `Cuando respondas preguntas sobre datos del evento (invitados, eventos, mesas, presupuesto, etc.) y encuentres resultados específicos, usa la herramienta filter_view para filtrar la vista de la app automáticamente.

USA filter_view cuando:
- El usuario pida "quiero ver la mesa X", "muéstrame la mesa 5", "ver la tarea Y" o similar (filtrar por esa mesa/tarea/servicio)
- El usuario pregunte "¿cuántos invitados tengo?" y hayas consultado la lista
- El usuario busque invitados por nombre, mesa, categoría o cualquier criterio
- El usuario pregunte por eventos específicos ("mis eventos este año", "bodas confirmadas")
- El usuario busque ítems de presupuesto, servicios, o cualquier entidad filtrable
- El resultado contenga una lista de IDs que el usuario podría querer ver en la app

CÓMO USARLO:
1. Los datos del evento están disponibles en el contexto de página (PAGE_CONTEXT) bajo screenData. Cada elemento tiene un campo "id" con su MongoDB _id.
2. Filtra los elementos relevantes según la consulta del usuario (por nombre, asistencia, mesa, etc.)
3. Extrae los IDs de los elementos filtrados (campo "id" de cada invitado/elemento)
4. Llama a filter_view con entity + ids + una query descriptiva
5. En tu respuesta, menciona que has filtrado la vista y, si aplica, sugiere ir a la sección: "He filtrado la app. Puedes ver el resultado en [Invitados/Mesas/Presupuesto/Itinerario/Servicios]." (en el panel derecho se mostrará el filtro activo y una X para quitarlo)

FUENTES DE IDs:
- Invitados (guests): screenData.guestList[].id
- También puedes usar IDs de resultados de herramientas CRUD (add_guest, get_user_events, etc.)

ENTIDADES DISPONIBLES:
- events: Eventos/bodas del organizador
- guests: Invitados de un evento
- tables: Mesas del evento
- budget_items: Ítems del presupuesto
- services: Servicios contratados
- menus: Menús del evento
- moments: Momentos/itinerario del evento

NO uses filter_view si:
- La consulta no devuelve IDs específicos
- El usuario solo hace preguntas generales sin buscar entidades concretas
- Ya estás mostrando toda la lista sin filtrado`,
  type: 'builtin',
};
