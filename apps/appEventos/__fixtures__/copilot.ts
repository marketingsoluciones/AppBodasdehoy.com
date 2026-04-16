/**
 * Fixtures con formas REALES de api-ia y API2.
 * Fuente: docs/ANALISIS-RESPUESTA-BACKEND-COPILOT.md y contrato actual.
 * Cuando api-ia nos confirme ejemplos reales, sustituir por esos.
 */

// ─── API2 getChatMessages (historial) ───
export const API2_CHAT_MESSAGE_SHAPE = {
  id: 'msg_abc123',
  role: 'user' as const,
  content: '¿Cuántos invitados tengo?',
  createdAt: '2025-02-06T10:00:00.000Z',
  metadata: null as Record<string, unknown> | null,
};

export const API2_CHAT_MESSAGE_ASSISTANT = {
  id: 'msg_def456',
  role: 'assistant' as const,
  content: 'Tienes 42 invitados confirmados.',
  createdAt: '2025-02-06T10:00:01.000Z',
  metadata: null as Record<string, unknown> | null,
};

/** Respuesta real esperada de getChatMessages (GraphQL) */
export const API2_GET_CHAT_MESSAGES_RESPONSE = {
  data: {
    getChatMessages: [API2_CHAT_MESSAGE_SHAPE, API2_CHAT_MESSAGE_ASSISTANT],
  },
};

// ─── api-ia SSE: event_card (tarjeta con acciones) ───
export const SSE_EVENT_CARD_REAL = {
  event: 'invitados_actualizados',
  message: 'Se han actualizado los invitados.',
  actions: [
    { label: 'Ver invitados', url: '/invitados' },
    { label: 'Añadir otro', url: '/invitados?add=1' },
  ],
};

// ─── api-ia SSE: usage (tokens/coste) ───
export const SSE_USAGE_REAL = {
  tokens: { prompt: 100, completion: 50, total: 150 },
  cost: 0.002,
};

// ─── api-ia SSE: reasoning (razonamiento interno) ───
export const SSE_REASONING_REAL = {
  step: 1,
  thought: 'El usuario pregunta por el número de invitados; tengo ese dato en contexto.',
};

// ─── api-ia SSE: tool_result (ui_action / enlace) ───
export const SSE_TOOL_RESULT_UI_ACTION_REAL = {
  tool: 'get_guests',
  result: {
    type: 'ui_action',
    message: 'Listado cargado.',
    url: '/invitados',
    label: 'Ver invitados',
  },
};

// ─── api-ia SSE: texto (delta) ───
export const SSE_TEXT_DELTA_REAL = {
  choices: [{ delta: { content: 'Tienes ' } }],
};

// ─── Request body real que envía el front a /api/copilot/chat ───
export const CHAT_REQUEST_BODY_REAL = {
  messages: [{ role: 'user' as const, content: '¿Cuántos invitados confirmados hay?' }],
  stream: true,
  metadata: {
    userId: 'user_abc123',
    development: 'bodasdehoy',
    sessionId: 'user_uid456',
    eventId: 'evt_789',
    eventName: 'Boda de Ana',
    pageContext: {
      pageName: 'invitados',
      screenData: { totalInvitados: 42, confirmados: 38, pendientes: 4 },
    },
  },
};
