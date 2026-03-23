import { BuiltinToolManifest } from '@lobechat/types';

export const CrmManifest: BuiltinToolManifest = {
  api: [
    {
      description:
        'Lista leads del CRM con filtros opcionales por estado, texto de busqueda y limite de resultados.',
      name: 'list_leads',
      parameters: {
        properties: {
          limit: {
            description: 'Cantidad maxima de resultados a devolver (por defecto 20).',
            type: 'number',
          },
          search: {
            description: 'Texto libre para buscar leads por nombre, email, empresa, etc.',
            type: 'string',
          },
          status: {
            description: 'Filtrar por estado del lead.',
            enum: ['new', 'contacted', 'qualified', 'converted', 'lost'],
            type: 'string',
          },
        },
        required: [],
        type: 'object',
      },
    },
    {
      description:
        'Obtiene el detalle completo de un lead: datos de contacto, historial de interacciones, notas, tareas pendientes y oportunidades asociadas.',
      name: 'get_lead',
      parameters: {
        properties: {
          leadId: {
            description: 'ID del lead a consultar.',
            type: 'string',
          },
        },
        required: ['leadId'],
        type: 'object',
      },
    },
    {
      description:
        'Lista contactos del CRM con filtros opcionales por busqueda, segmento y limite.',
      name: 'list_contacts',
      parameters: {
        properties: {
          limit: {
            description: 'Cantidad maxima de resultados a devolver (por defecto 20).',
            type: 'number',
          },
          search: {
            description: 'Texto libre para buscar contactos por nombre, email, empresa, etc.',
            type: 'string',
          },
          segment: {
            description: 'Filtrar por segmento al que pertenece el contacto.',
            type: 'string',
          },
        },
        required: [],
        type: 'object',
      },
    },
    {
      description:
        'Obtiene el detalle completo de un contacto: datos personales, historial, segmentos, notas y oportunidades asociadas.',
      name: 'get_contact',
      parameters: {
        properties: {
          contactId: {
            description: 'ID del contacto a consultar.',
            type: 'string',
          },
        },
        required: ['contactId'],
        type: 'object',
      },
    },
    {
      description:
        'Lista oportunidades de venta con filtros opcionales por etapa del pipeline, valor minimo y limite.',
      name: 'list_opportunities',
      parameters: {
        properties: {
          limit: {
            description: 'Cantidad maxima de resultados a devolver (por defecto 20).',
            type: 'number',
          },
          minValue: {
            description: 'Valor minimo de la oportunidad para filtrar.',
            type: 'number',
          },
          stage: {
            description: 'Filtrar por etapa del pipeline de ventas.',
            type: 'string',
          },
        },
        required: [],
        type: 'object',
      },
    },
    {
      description:
        'Obtiene el detalle completo de una oportunidad: valor, etapa, contacto asociado, historial de actividades y probabilidad de cierre.',
      name: 'get_opportunity',
      parameters: {
        properties: {
          opportunityId: {
            description: 'ID de la oportunidad a consultar.',
            type: 'string',
          },
        },
        required: ['opportunityId'],
        type: 'object',
      },
    },
    {
      description:
        'Lista campanas de marketing con filtros opcionales por estado, canal y limite.',
      name: 'list_campaigns',
      parameters: {
        properties: {
          channel: {
            description: 'Filtrar por canal de la campana (email, whatsapp, social, ads, etc.).',
            type: 'string',
          },
          limit: {
            description: 'Cantidad maxima de resultados a devolver (por defecto 20).',
            type: 'number',
          },
          status: {
            description: 'Filtrar por estado de la campana (draft, active, paused, completed).',
            type: 'string',
          },
        },
        required: [],
        type: 'object',
      },
    },
    {
      description:
        'Busqueda full-text en todas las entidades del CRM: leads, contactos, oportunidades y campanas. Devuelve resultados relevantes ordenados por coincidencia.',
      name: 'search_crm',
      parameters: {
        properties: {
          entity: {
            description:
              'Entidad especifica donde buscar. Si no se indica, busca en todas.',
            enum: ['leads', 'contacts', 'opportunities', 'campaigns'],
            type: 'string',
          },
          query: {
            description: 'Texto de busqueda.',
            type: 'string',
          },
        },
        required: ['query'],
        type: 'object',
      },
    },
  ],
  identifier: 'lobe-crm',
  meta: {
    avatar: '\uD83D\uDCCA',
    title: 'CRM',
  },
  systemRole: `Eres un asistente experto en CRM. Usa la herramienta lobe-crm para consultar datos del sistema CRM del usuario.

Usa list_leads cuando el usuario mencione:
- "mis leads", "leads nuevos", "leads de esta semana"
- "prospectos", "clientes potenciales"
- Cualquier peticion para ver o listar leads

Usa get_lead cuando el usuario pida:
- "detalle del lead", "informacion del lead X"
- "historial de este prospecto"
- Informacion detallada de un lead especifico (usa el leadId obtenido con list_leads)

Usa list_contacts cuando el usuario mencione:
- "mis contactos", "lista de contactos"
- "contactos del segmento X"

Usa get_contact cuando necesites:
- Informacion detallada de un contacto especifico

Usa list_opportunities cuando el usuario mencione:
- "oportunidades de venta", "pipeline", "deals"
- "oportunidades por cerrar", "ventas en curso"

Usa get_opportunity cuando necesites:
- Detalle de una oportunidad especifica

Usa list_campaigns cuando el usuario mencione:
- "campanas activas", "mis campanas", "campanas de marketing"

Usa search_crm cuando el usuario haga:
- Busquedas generales: "busca a Juan Perez", "encuentra el deal de Empresa X"
- Busquedas amplias que pueden abarcar multiples entidades

Flujo recomendado:
1. Si el usuario pide ver datos, usa la funcion list_ correspondiente.
2. Si necesita detalle, usa la funcion get_ con el ID obtenido previamente.
3. Si la busqueda es amplia, usa search_crm y luego get_ para detalles.
4. Despues de obtener resultados, usa filter_view para mostrarlos en la app.`,
  type: 'builtin',
};
