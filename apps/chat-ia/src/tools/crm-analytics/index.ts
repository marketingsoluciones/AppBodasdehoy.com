import { BuiltinToolManifest } from '@lobechat/types';

export const CrmAnalyticsManifest: BuiltinToolManifest = {
  api: [
    {
      description:
        'Obtiene un resumen del pipeline de ventas: cantidad de oportunidades por etapa, valor total y proyeccion de cierre.',
      name: 'get_pipeline_summary',
      parameters: {
        properties: {
          period: {
            description: 'Periodo de analisis.',
            enum: ['week', 'month', 'quarter'],
            type: 'string',
          },
        },
        required: [],
        type: 'object',
      },
    },
    {
      description:
        'Genera un reporte de ingresos agrupado por periodo: totales, promedios y tendencias.',
      name: 'get_revenue_report',
      parameters: {
        properties: {
          dateFrom: {
            description: 'Fecha de inicio del reporte (formato ISO 8601).',
            type: 'string',
          },
          dateTo: {
            description: 'Fecha de fin del reporte (formato ISO 8601).',
            type: 'string',
          },
          groupBy: {
            description: 'Agrupar resultados por periodo.',
            enum: ['day', 'week', 'month'],
            type: 'string',
          },
        },
        required: [],
        type: 'object',
      },
    },
    {
      description:
        'Obtiene el embudo de conversion de leads: cuantos leads hay en cada etapa, tasas de conversion entre etapas y fuentes mas efectivas.',
      name: 'get_lead_funnel',
      parameters: {
        properties: {
          period: {
            description: 'Periodo de analisis (week, month, quarter).',
            type: 'string',
          },
          source: {
            description: 'Filtrar por fuente de leads (web, referido, feria, etc.).',
            type: 'string',
          },
        },
        required: [],
        type: 'object',
      },
    },
    {
      description:
        'Obtiene metricas clave (KPIs) del negocio. Selecciona una o varias metricas de la lista disponible.',
      name: 'get_kpis',
      parameters: {
        properties: {
          metrics: {
            description: 'Lista de metricas a obtener.',
            items: {
              enum: [
                'conversion_rate',
                'avg_deal_size',
                'lead_response_time',
                'revenue',
                'active_leads',
              ],
              type: 'string',
            },
            type: 'array',
          },
        },
        required: ['metrics'],
        type: 'object',
      },
    },
    {
      description:
        'Obtiene metricas de rendimiento de campanas de marketing: envios, apertura, clics, conversiones y ROI.',
      name: 'get_campaign_performance',
      parameters: {
        properties: {
          campaignId: {
            description: 'ID de la campana especifica a analizar. Si no se indica, muestra resumen general.',
            type: 'string',
          },
          period: {
            description: 'Periodo de analisis (week, month, quarter).',
            type: 'string',
          },
        },
        required: [],
        type: 'object',
      },
    },
  ],
  identifier: 'lobe-crm-analytics',
  meta: {
    avatar: '\uD83D\uDCC8',
    title: 'Analitica CRM',
  },
  systemRole: `Eres un asistente analitico del CRM. Usa lobe-crm-analytics para obtener metricas, reportes y analisis del negocio.

Usa get_pipeline_summary cuando el usuario pregunte:
- "como va el pipeline", "resumen de ventas", "cuantas oportunidades tenemos"
- "estado del pipeline", "oportunidades por etapa"

Usa get_revenue_report cuando el usuario pregunte:
- "reporte de ingresos", "cuanto hemos facturado", "ventas del mes"
- "ingresos por semana", "comparar ingresos"

Usa get_lead_funnel cuando el usuario pregunte:
- "embudo de leads", "conversion de leads", "cuantos leads convierten"
- "funnel de ventas", "de donde vienen mis mejores leads"

Usa get_kpis cuando el usuario pregunte:
- "como van los KPIs", "metricas del negocio", "tasa de conversion"
- "ticket promedio", "revenue total", "leads activos"

Usa get_campaign_performance cuando el usuario pregunte:
- "como fue la campana", "resultados de la campana X"
- "open rate", "rendimiento de campanas", "ROI de marketing"

Flujo recomendado:
1. Para preguntas generales de performance, usa get_kpis con las metricas relevantes.
2. Para analisis de ventas, combina get_pipeline_summary + get_revenue_report.
3. Para analisis de marketing, combina get_lead_funnel + get_campaign_performance.
4. Presenta los datos con contexto: comparativas, tendencias, alertas sobre anomalias.`,
  type: 'builtin',
};
