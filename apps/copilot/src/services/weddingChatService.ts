/**
 * Wedding Chat Service
 * ====================
 * Conecta el chat del Wedding Creator con el backend AI
 */

import type { WeddingWebData, PaletteType, SectionType } from '@/components/wedding-site/types';
import { buildAuthHeaders } from '@/utils/authToken';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8030';

export interface WeddingChatMessage {
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp?: string;
}

export interface WeddingChangeAction {
  payload: any;
  type: 'updateCouple' | 'updateDate' | 'updatePalette' | 'updateHero' | 'toggleSection' | 'updateSection';
}

export interface WeddingChatResponse {
  actions?: WeddingChangeAction[];
  error?: string;
  message: string;
  metadata?: {
    model?: string;
    processing_time_ms?: number;
    provider?: string;
    tokens_used?: number;
  };
  success: boolean;
}

/**
 * Genera el contexto del sistema para el Wedding Creator
 */
function getWeddingSystemPrompt(wedding: WeddingWebData): string {
  const sectionsStatus = wedding.sections
    .map(s => `- ${s.type}: ${s.enabled ? 'habilitada' : 'deshabilitada'}`)
    .join('\n');

  return `Eres un asistente especializado en crear webs profesionales para EVENTOS Y BODAS.

🎯 **ENFOQUE: SECTOR EVENTOS Y BODAS**
Tu objetivo es ayudar a crear webs profesionales para:
- Bodas y celebraciones matrimoniales
- Eventos corporativos y empresariales
- Celebraciones y fiestas especiales
- Eventos sociales y culturales

📋 **CONTEXTO ACTUAL DEL EVENTO:**
- Anfitriones/Pareja: ${wedding.couple.partner1.name || 'Sin nombre'} y ${wedding.couple.partner2.name || 'Sin nombre'}
- Fecha del evento: ${wedding.date.date ? new Date(wedding.date.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', weekday: 'long', year: 'numeric' }) : 'Sin definir'}
- Estilo/Paleta: ${wedding.style.palette}
- Secciones activas:
${sectionsStatus}

🎨 **PALETAS DISPONIBLES (Profesionales para eventos):**
- romantic: Rosas suaves, elegancia femenina (ideal para bodas clásicas y eventos románticos)
- elegant: Negro y dorado, sofisticado (ideal para eventos de gala, corporativos y bodas elegantes)
- modern: Minimalista, colores neutros (ideal para eventos urbanos, corporativos y bodas modernas)
- rustic: Tonos tierra, estilo campo (ideal para eventos al aire libre, bodas rústicas y celebraciones campestres)
- beach: Azules y turquesas (ideal para eventos en playa, bodas costeras y celebraciones veraniegas)
- classic: Tradicional, colores sobrios (ideal para eventos formales, bodas religiosas y celebraciones tradicionales)

📑 **SECCIONES DISPONIBLES (Funcionalidades del sector eventos):**
- schedule: Programa del día (agenda completa, timeline de eventos, horarios detallados)
- location: Ubicación con mapa interactivo (ideal para eventos con múltiples ubicaciones)
- gallery: Galería de fotos (muestra momentos, historia, preparativos del evento)
- info: Información importante (dress code, hospedaje, FAQs, transporte, estacionamiento)
- rsvp: Formulario de confirmación de asistencia (gestión de invitados, contador de asistentes)
- registry: Mesa de regalos (opciones de pago, links externos, detalles bancarios)

💡 **INSTRUCCIONES ESPECÍFICAS PARA EVENTOS:**
1. Cuando el usuario quiera cambiar algo, responde confirmando el cambio de forma profesional
2. Usa un tono amable, entusiasta y profesional (¡es su evento importante!)
3. Si el usuario menciona nombres, actualiza los anfitriones/pareja
4. Si menciona fechas, actualiza la fecha del evento (importante para countdown y RSVP)
5. Si menciona colores o estilos, sugiere la paleta adecuada según el tipo de evento
6. Si quiere agregar/quitar secciones, confirma el cambio explicando su utilidad para eventos
7. Siempre contextualiza las funcionalidades en el marco del sector eventos y bodas
8. Ofrece sugerencias profesionales basadas en mejores prácticas del sector eventos

📝 **FORMATO DE RESPUESTA:**
Responde de forma conversacional y profesional. Al final, si detectas acciones, incluye un bloque JSON:
<!--WEDDING_ACTIONS
[{"type": "updateCouple", "payload": {"partner": "partner1", "name": "Maria"}}]
WEDDING_ACTIONS-->
`;
}

/**
 * Extrae acciones de la respuesta del AI
 */
function extractActionsFromResponse(response: string): { actions: WeddingChangeAction[], cleanMessage: string; } {
  const actionsRegex = /<!--WEDDING_ACTIONS\s*([\S\s]*?)\s*WEDDING_ACTIONS-->/;
  const match = response.match(actionsRegex);

  let actions: WeddingChangeAction[] = [];
  let cleanMessage = response;

  if (match) {
    try {
      actions = JSON.parse(match[1]);
      cleanMessage = response.replace(actionsRegex, '').trim();
    } catch (e) {
      console.error('Error parsing wedding actions:', e);
    }
  }

  // También detectar acciones por keywords si no hay JSON
  if (actions.length === 0) {
    actions = detectActionsFromText(response);
  }

  return { actions, cleanMessage };
}

/**
 * Detecta acciones basadas en el texto de la respuesta
 */
function detectActionsFromText(text: string): WeddingChangeAction[] {
  const actions: WeddingChangeAction[] = [];
  const lowerText = text.toLowerCase();

  // Detectar cambio de paleta
  const paletteMap: Record<string, PaletteType> = {
    'clasico': 'classic',
    'clásico': 'classic',
    'elegante': 'elegant',
    'moderna': 'modern',
    'moderno': 'modern',
    'playa': 'beach',
    'romantico': 'romantic',
    'romántico': 'romantic',
    'rustico': 'rustic',
    'rústico': 'rustic',
  };

  for (const [keyword, palette] of Object.entries(paletteMap)) {
    if (lowerText.includes(`estilo ${keyword}`) ||
        lowerText.includes(`paleta ${keyword}`) ||
        lowerText.includes(`cambiado a ${keyword}`)) {
      actions.push({ payload: { palette }, type: 'updatePalette' });
      break;
    }
  }

  // Detectar toggle de secciones
  const sectionKeywords: Record<string, SectionType> = {
    'galeria': 'gallery',
    'galería': 'gallery',
    'informacion': 'info',
    'información': 'info',
    'programa': 'schedule',
    'regalos': 'registry',
    'rsvp': 'rsvp',
    'ubicacion': 'location',
    'ubicación': 'location',
  };

  for (const [keyword, section] of Object.entries(sectionKeywords)) {
    if (lowerText.includes(`habilitado la ${keyword}`) ||
        lowerText.includes(`habilitada la ${keyword}`) ||
        lowerText.includes(`agregado la ${keyword}`)) {
      actions.push({ payload: { enabled: true, section }, type: 'toggleSection' });
    }
    if (lowerText.includes(`deshabilitado la ${keyword}`) ||
        lowerText.includes(`deshabilitada la ${keyword}`) ||
        lowerText.includes(`quitado la ${keyword}`) ||
        lowerText.includes(`ocultado la ${keyword}`)) {
      actions.push({ payload: { enabled: false, section }, type: 'toggleSection' });
    }
  }

  return actions;
}

/**
 * Envía mensaje al backend de chat
 */
export async function sendWeddingChatMessage(
  message: string,
  wedding: WeddingWebData,
  conversationHistory: WeddingChatMessage[] = [],
  sessionId?: string
): Promise<WeddingChatResponse> {
  try {
    // Preparar historial con contexto del sistema
    const systemPrompt = getWeddingSystemPrompt(wedding);

    const messages: WeddingChatMessage[] = [
      { content: systemPrompt, role: 'system' },
      ...conversationHistory.slice(-10), // Últimos 10 mensajes
      { content: message, role: 'user' }
    ];

    const response = await fetch(`${BACKEND_URL}/api/chat`, {
      body: JSON.stringify({
        auto_route: true,
        conversation_history: messages,
        development: 'bodasdehoy',
        message,
        // Usar auto-routing para seleccionar mejor modelo
        requirements: {
          // No necesitamos tools para edición de wedding
          requires_data_access: false,
          requires_function_calling: false,
          requires_high_quality: true, // Queremos buenas respuestas creativas
        },
        session_id: sessionId || `wedding-${wedding.id}`
      }),
      headers: buildAuthHeaders({
        'Content-Type': 'application/json',
      }),
      method: 'POST',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const data = await response.json();

    // Extraer acciones de la respuesta
    const { cleanMessage, actions } = extractActionsFromResponse(
      data.response || data.message || ''
    );

    return {
      actions,
      message: cleanMessage,
      metadata: {
        model: data.metadata?.model,
        processing_time_ms: data.metadata?.response_time_ms,
        provider: data.metadata?.provider,
        tokens_used: data.metadata?.tokens_used,
      },
      success: true
    };

  } catch (error) {
    console.error('Wedding chat error:', error);

    // Fallback a procesamiento local si el backend no está disponible
    return processLocalFallback(message, wedding);
  }
}

/**
 * Procesamiento local como fallback si el backend no está disponible
 */
function processLocalFallback(
  message: string,
  wedding: WeddingWebData
): WeddingChatResponse {
  const lowerMessage = message.toLowerCase();
  const actions: WeddingChangeAction[] = [];
  let responseMessage = '';

  // Detectar nombres
  const nameMatch = message.match(/(?:me llamo|soy|nombre.*?(?:es|sera)?)\s+([a-z\u00C0-\u017F]+)/i);
  if (nameMatch) {
    const name = nameMatch[1];
    actions.push({ payload: { name, partner: 'partner1' }, type: 'updateCouple' });
    responseMessage = `¡Perfecto! He actualizado tu nombre a "${name}". ¿Cuál es el nombre de tu pareja?`;
  }

  const partnerMatch = message.match(/(?:pareja|novio|novia).*?(?:es|llama|sera)\s+([a-z\u00C0-\u017F]+)/i);
  if (partnerMatch) {
    const name = partnerMatch[1];
    actions.push({ payload: { name, partner: 'partner2' }, type: 'updateCouple' });
    responseMessage = `¡Excelente! He agregado a "${name}". La web ya muestra sus nombres juntos. 💍`;
  }

  // Detectar paleta
  const paletteKeywords: Record<string, PaletteType> = {
    'azul': 'beach', 'campo': 'rustic', 'clasico': 'classic',
    'clásico': 'classic', 'dorado': 'elegant', 'elegante': 'elegant',
    'mar': 'beach', 'minimalista': 'modern',
    'moderno': 'modern', 'negro': 'elegant', 'playa': 'beach',
    'romantico': 'romantic', 'romántico': 'romantic', 'rosa': 'romantic',
    'rustico': 'rustic', 'rústico': 'rustic', 'tradicional': 'classic',
  };

  if (lowerMessage.includes('color') || lowerMessage.includes('estilo') || lowerMessage.includes('paleta')) {
    for (const [keyword, palette] of Object.entries(paletteKeywords)) {
      if (lowerMessage.includes(keyword)) {
        actions.push({ payload: { palette }, type: 'updatePalette' });
        responseMessage = `¡He cambiado el estilo a "${palette}"! Los colores y tipografías se han actualizado. ¿Te gusta cómo quedó?`;
        break;
      }
    }
  }

  // Detectar fecha
  const dateMatch = message.match(/(\d{1,2})[\s/\-](?:de\s)?(\w+|\d{1,2})[\s/\-](?:de\s)?(\d{4})/i);
  if (dateMatch) {
    const [, day, month, year] = dateMatch;
    const monthMap: Record<string, number> = {
      'abril': 3, 'agosto': 7, 'diciembre': 11, 'enero': 0, 'febrero': 1, 'julio': 6,
      'junio': 5, 'marzo': 2, 'mayo': 4, 'noviembre': 10, 'octubre': 9, 'septiembre': 8,
    };
    const monthNum = isNaN(Number(month)) ? monthMap[month.toLowerCase()] : Number(month) - 1;
    const date = new Date(Number(year), monthNum, Number(day));
    actions.push({ payload: { date: date.toISOString() }, type: 'updateDate' });
    responseMessage = `¡Fecha actualizada al ${date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', weekday: 'long', year: 'numeric' })}! El countdown ya se está actualizando. ⏰`;
  }

  // Detectar secciones
  if (lowerMessage.includes('seccion') || lowerMessage.includes('quitar') || lowerMessage.includes('agregar')) {
    const sectionKeywords: Record<string, SectionType> = {
      'agenda': 'schedule', 'confirmacion': 'rsvp',
      'fotos': 'gallery', 'galeria': 'gallery',
      'info': 'info', 'informacion': 'info',
      'mapa': 'location', 'mesa': 'registry',
      'programa': 'schedule', 'regalos': 'registry',
      'rsvp': 'rsvp', 'ubicacion': 'location',
    };

    const enable = lowerMessage.includes('agregar') || lowerMessage.includes('habilitar');
    const disable = lowerMessage.includes('quitar') || lowerMessage.includes('deshabilitar');

    for (const [keyword, section] of Object.entries(sectionKeywords)) {
      if (lowerMessage.includes(keyword)) {
        if (enable) {
          actions.push({ payload: { enabled: true, section }, type: 'toggleSection' });
          responseMessage = `¡He habilitado la sección de ${keyword}! Ya es visible en el preview. ✨`;
        } else if (disable) {
          actions.push({ payload: { enabled: false, section }, type: 'toggleSection' });
          responseMessage = `He ocultado la sección de ${keyword}. Puedes habilitarla cuando quieras.`;
        }
        break;
      }
    }
  }

  // Respuesta por defecto
  if (!responseMessage) {
    responseMessage = `¡Perfecto! Estoy aquí para ayudarte a crear una web profesional para tu evento. 🎉\n\n` +
      `📋 **Puedo ayudarte con:**\n\n` +
      `👥 **Anfitriones/Pareja**: "Mi nombre es María y mi pareja es Juan"\n` +
      `📅 **Fecha del evento**: "El evento es el 15 de junio de 2025" o "La boda será el 20 de agosto"\n` +
      `🎨 **Estilo y diseño**: "Quiero un estilo romántico" o "elegante y sofisticado"\n` +
      `📑 **Secciones del evento**:\n` +
      `   • "Agrega la galería de fotos"\n` +
      `   • "Habilita el formulario RSVP de confirmación"\n` +
      `   • "Quita la sección de regalos"\n` +
      `   • "Agrega información sobre el dress code"\n\n` +
      `💡 **Ejemplos para eventos:**\n` +
      `   • "Configura el programa del día con ceremonia, coctel y cena"\n` +
      `   • "Agrega la ubicación con mapa interactivo"\n` +
      `   • "Habilita la confirmación de asistencia con fecha límite"\n\n` +
      `¿Qué te gustaría configurar primero para tu evento? 🎊`;
  }

  return {
    actions,
    message: responseMessage,
    metadata: {
      model: 'pattern-matching',
      provider: 'local-fallback',
    },
    success: true
  };
}

/**
 * Verifica si el backend está disponible
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/chat/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    });
    return response.ok;
  } catch {
    return false;
  }
}
