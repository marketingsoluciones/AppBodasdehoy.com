import { BuiltinToolManifest } from '@lobechat/types';

export const CrmActionsManifest: BuiltinToolManifest = {
  api: [
    {
      description:
        'Crea un nuevo lead en el CRM con los datos proporcionados.',
      name: 'create_lead',
      parameters: {
        properties: {
          email: {
            description: 'Email del lead.',
            type: 'string',
          },
          name: {
            description: 'Nombre completo del lead.',
            type: 'string',
          },
          notes: {
            description: 'Notas iniciales sobre el lead.',
            type: 'string',
          },
          phone: {
            description: 'Telefono del lead.',
            type: 'string',
          },
          source: {
            description: 'Fuente de donde proviene el lead (web, referido, feria, redes sociales, etc.).',
            type: 'string',
          },
        },
        required: ['name'],
        type: 'object',
      },
    },
    {
      description:
        'Actualiza el estado de un lead existente en el pipeline.',
      name: 'update_lead_status',
      parameters: {
        properties: {
          leadId: {
            description: 'ID del lead a actualizar.',
            type: 'string',
          },
          status: {
            description: 'Nuevo estado del lead.',
            enum: ['new', 'contacted', 'qualified', 'converted', 'lost'],
            type: 'string',
          },
        },
        required: ['leadId', 'status'],
        type: 'object',
      },
    },
    {
      description:
        'Agrega una nota a un registro del CRM (lead, contacto u oportunidad).',
      name: 'add_note',
      parameters: {
        properties: {
          entityId: {
            description: 'ID del registro al que se agrega la nota.',
            type: 'string',
          },
          entityType: {
            description: 'Tipo de entidad a la que pertenece la nota.',
            enum: ['lead', 'contact', 'opportunity'],
            type: 'string',
          },
          text: {
            description: 'Contenido de la nota.',
            type: 'string',
          },
        },
        required: ['entityType', 'entityId', 'text'],
        type: 'object',
      },
    },
    {
      description:
        'Crea una tarea de seguimiento asociada a un registro del CRM.',
      name: 'create_task',
      parameters: {
        properties: {
          assignee: {
            description: 'Nombre o ID del responsable de la tarea.',
            type: 'string',
          },
          description: {
            description: 'Descripcion detallada de la tarea.',
            type: 'string',
          },
          dueDate: {
            description: 'Fecha limite de la tarea (formato ISO 8601, ej: 2026-03-25).',
            type: 'string',
          },
          relatedTo: {
            description:
              'Referencia al registro relacionado, formato "tipo:id" (ej: "lead:abc123", "opportunity:xyz789").',
            type: 'string',
          },
          title: {
            description: 'Titulo de la tarea.',
            type: 'string',
          },
        },
        required: ['title'],
        type: 'object',
      },
    },
    {
      description:
        'Mueve una oportunidad de venta a una nueva etapa del pipeline y opcionalmente actualiza su valor.',
      name: 'update_opportunity_stage',
      parameters: {
        properties: {
          opportunityId: {
            description: 'ID de la oportunidad.',
            type: 'string',
          },
          stage: {
            description: 'Nueva etapa del pipeline (ej: prospecting, qualification, proposal, negotiation, closed_won, closed_lost).',
            type: 'string',
          },
          value: {
            description: 'Nuevo valor monetario de la oportunidad (opcional).',
            type: 'number',
          },
        },
        required: ['opportunityId', 'stage'],
        type: 'object',
      },
    },
    {
      description:
        'Envia un mensaje al contacto o lead por el canal indicado (email o WhatsApp).',
      name: 'send_message',
      parameters: {
        properties: {
          body: {
            description: 'Cuerpo del mensaje.',
            type: 'string',
          },
          channel: {
            description: 'Canal de envio.',
            enum: ['email', 'whatsapp'],
            type: 'string',
          },
          subject: {
            description: 'Asunto del mensaje (solo para email).',
            type: 'string',
          },
          to: {
            description: 'Destinatario: email o numero de telefono segun el canal.',
            type: 'string',
          },
        },
        required: ['channel', 'to', 'body'],
        type: 'object',
      },
    },
  ],
  identifier: 'lobe-crm-actions',
  meta: {
    avatar: '\u26A1',
    title: 'Acciones CRM',
  },
  systemRole: `Eres un asistente que ejecuta acciones en el CRM. Usa lobe-crm-actions para crear, modificar y gestionar registros.

Usa create_lead cuando el usuario pida:
- "agrega un lead", "nuevo prospecto", "registra este contacto como lead"
- Crear un nuevo lead con la informacion proporcionada

Usa update_lead_status cuando el usuario pida:
- "marca el lead como contactado", "este lead ya califico", "cambia el estado"
- Mover un lead a otro estado del pipeline

Usa add_note cuando el usuario pida:
- "agrega una nota", "anota esto en el lead", "registra esta observacion"
- Agregar notas a leads, contactos u oportunidades

Usa create_task cuando el usuario pida:
- "crea una tarea de seguimiento", "recordarme llamar a X manana"
- "agenda un follow-up", "crea pendiente"

Usa update_opportunity_stage cuando el usuario pida:
- "mueve la oportunidad a negociacion", "cierra el deal", "marca como ganado"
- Cambiar la etapa de una oportunidad en el pipeline

Usa send_message cuando el usuario pida:
- "enviame un email a", "manda un WhatsApp a", "contacta a este lead"
- Enviar mensajes por email o WhatsApp

IMPORTANTE:
- Antes de ejecutar acciones destructivas o de envio, confirma con el usuario los datos.
- Para actualizar registros, primero consulta el estado actual con lobe-crm.
- Despues de crear/modificar, informa al usuario el resultado de la accion.`,
  type: 'builtin',
};
