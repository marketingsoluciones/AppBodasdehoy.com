import { BuiltinToolManifest } from '@lobechat/types';

export const FloorPlanEditorManifest: BuiltinToolManifest = {
  api: [
    {
      description:
        'Navega al editor de planos de mesas de la app organizador. Opcionalmente sugiere una configuración inicial (tipo de mesa, número de sillas, cantidad de mesas, nombre). Úsalo cuando el usuario quiera abrir, editar o diseñar el plano de sala de su evento.',
      name: 'open_floor_plan_editor',
      parameters: {
        properties: {
          eventId: {
            description: 'ID del evento (opcional, se usa el evento activo si no se especifica).',
            type: 'string',
          },
          label: {
            description: 'Nombre sugerido para la mesa principal (ej: "Mesa de Novios", "Mesa 1").',
            type: 'string',
          },
          seats: {
            description: 'Número de sillas por mesa sugerido.',
            type: 'number',
          },
          tableCount: {
            description: 'Número total de mesas sugerido para el evento.',
            type: 'number',
          },
          tableType: {
            description:
              'Tipo de mesa sugerido. Valores: redonda, cuadrada, imperial, podio, militar, bancos.',
            enum: ['redonda', 'cuadrada', 'imperial', 'podio', 'militar', 'bancos'],
            type: 'string',
          },
        },
        required: [],
        type: 'object',
      },
    },
    {
      description:
        'Genera una previsualización SVG de una mesa según la configuración indicada. Muestra el resultado inline en el chat sin necesidad de navegar. Úsalo cuando el usuario quiera ver cómo quedaría una mesa antes de crearla.',
      name: 'suggest_table_config',
      parameters: {
        properties: {
          label: {
            description: 'Nombre de la mesa (ej: "Mesa de los novios", "Mesa 1").',
            type: 'string',
          },
          seats: {
            description: 'Número de sillas.',
            type: 'number',
          },
          tableType: {
            description:
              'Tipo de mesa. Valores: round (redonda), rectangular (imperial/larga), square (cuadrada), oval, semicircle (mesa de novios).',
            enum: ['round', 'rectangular', 'square', 'oval', 'semicircle'],
            type: 'string',
          },
        },
        required: ['tableType', 'seats'],
        type: 'object',
      },
    },
  ],
  identifier: 'lobe-floor-plan-editor',
  meta: {
    avatar: '🪑',
    title: 'Editor de Plano de Mesas',
  },
  systemRole: `Eres experto en distribución de mesas y planos de sala para bodas y eventos.

Usa la herramienta \`lobe-floor-plan-editor\` cuando el usuario:
- Quiera diseñar, configurar o reorganizar mesas ("¿cómo distribuyo mis mesas?", "necesito un plano")
- Pida ver cómo quedaría una mesa concreta ("¿cómo quedaría una mesa redonda para 10?")
- Quiera ir al editor de mesas ("abre el plano", "ir a mesas", "ver plano de sala")
- Hable de seating, distribución de invitados o disposición de sala

FLUJO RECOMENDADO:
1. Si el usuario pide ir al editor → usa \`open_floor_plan_editor\`. Si mencionó tipo o nº de sillas, inclúyelos como sugerencia.
2. Si quiere previsualizar una mesa SIN navegar → usa \`suggest_table_config\` para mostrar el SVG en el chat.
3. Si el usuario tiene un número de invitados, sugiere el tipo y cantidad de mesas más adecuado antes de navegar.

TIPOS DE MESA:
- redonda (round): clásica de boda, 6-12 personas
- rectangular/imperial: banquetes largos, 8-40 personas
- cuadrada (square): grupos pequeños, 2-8 personas
- oval: elegante, 8-16 personas
- semicircle/podio: mesa de novios, 2-12 personas

NO uses estas herramientas para gestionar invitados, presupuesto u otras áreas — solo para el plano de mesas.`,
  type: 'builtin',
};
