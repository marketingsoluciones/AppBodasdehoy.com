import { BuiltinToolManifest } from '@lobechat/types';

export const FilterAppViewManifest: BuiltinToolManifest = {
  api: [
    {
      description:
        'Filtra la vista principal de la app CRM/ERP para mostrar solo los registros relevantes basandose en los IDs encontrados. Usa esta herramienta DESPUES de consultar datos para mostrar al usuario los resultados directamente en la app.',
      name: 'filter_view',
      parameters: {
        properties: {
          entity: {
            description:
              'Tipo de entidad a filtrar en la vista de la app. Usa el tipo que corresponda con la seccion actual del usuario.',
            enum: [
              'leads',
              'contacts',
              'opportunities',
              'campaigns',
              'tasks',
              'invoices',
            ],
            type: 'string',
          },
          ids: {
            description:
              'Lista de IDs de los registros encontrados que deben mostrarse en la app. Incluye solo los IDs relevantes para la consulta del usuario.',
            items: {
              type: 'string',
            },
            type: 'array',
          },
          query: {
            description:
              'Descripcion breve de que filtro el Copilot. Se muestra al usuario como contexto del filtro activo. Ejemplo: "Leads nuevos de esta semana", "Contactos del segmento Premium".',
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
    avatar: '\uD83D\uDD0D',
    title: 'Filtrar Vista App',
  },
  systemRole: `Cuando respondas preguntas sobre datos del CRM/ERP (leads, contactos, oportunidades, campanas, etc.) y encuentres resultados especificos, usa la herramienta filter_view para filtrar la vista de la app automaticamente.

USA filter_view cuando:
- El usuario pida "quiero ver los leads X", "muestrame los contactos de Y", "ver oportunidades por cerrar"
- El usuario busque leads por nombre, estado, fuente o cualquier criterio
- El usuario pregunte por contactos de un segmento especifico
- El usuario busque oportunidades, campanas, tareas o facturas
- El resultado contenga una lista de IDs que el usuario podria querer ver en la app

COMO USARLO:
1. Primero consulta los datos usando lobe-crm (list_leads, list_contacts, etc.) o lobe-crm-analytics.
2. Filtra los resultados segun la consulta del usuario.
3. Extrae los IDs de los registros relevantes.
4. Llama a filter_view con entity + ids + una query descriptiva.
5. En tu respuesta, menciona que has filtrado la vista: "He filtrado la app para mostrar [descripcion]. Puedes ver el resultado en la seccion [Leads/Contactos/Oportunidades]."

ENTIDADES DISPONIBLES:
- leads: Leads y prospectos del CRM
- contacts: Contactos registrados
- opportunities: Oportunidades de venta en el pipeline
- campaigns: Campanas de marketing
- tasks: Tareas y seguimientos pendientes
- invoices: Facturas emitidas y recibidas

NO uses filter_view si:
- La consulta no devuelve IDs especificos
- El usuario solo hace preguntas generales sin buscar registros concretos
- Ya estas mostrando toda la lista sin filtrado`,
  type: 'builtin',
};
