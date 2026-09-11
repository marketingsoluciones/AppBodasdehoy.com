'use client';

import { useQuery } from '@tanstack/react-query';

import { EVENTOS_API_CONFIG } from '@/config/eventos-api';
import { getSupportKey } from '@/const/supportKeys';
import { buildAuthHeaders } from '@/utils/authToken';
import { getAPIOriginHeader } from '@/utils/developmentDetector';

type ConversationChannel = 'whatsapp' | 'instagram' | 'facebook' | 'telegram' | 'web';

export interface ConversationHistoryItem {
  canal: ConversationChannel;
  fecha: string;
  id: string;
  nombre: string;
  raw?: any;
  session_type?: string;
  timestamp: number;
  ultimoMensaje: string;
}

interface ConversationHistoryResponse {
  chats?: any[];
  conversations?: any[];
  error?: string;
  source?: 'mcp' | 'cache';
  success: boolean;
}

interface ConversationHistoryQueryResult {
  conversations: ConversationHistoryItem[];
  errorMessage?: string;
  isFallback: boolean;
  lastUpdated?: number;
  source: 'mcp' | 'cache' | 'local';
}

const CHANNEL_MAP: Record<string, ConversationChannel> = {
  FACEBOOK: 'facebook',
  INSTAGRAM: 'instagram',
  LOBE_CHAT: 'web',
  TELEGRAM: 'telegram',
  WHATSAPP: 'whatsapp',
};

const KNOWN_CHANNELS = new Set<ConversationChannel>(['facebook', 'instagram', 'telegram', 'web', 'whatsapp']);

const resolveChannel = (sessionType?: string, channel?: string): ConversationChannel => {
  if (sessionType) {
    const mapped = CHANNEL_MAP[sessionType.toUpperCase()];
    if (mapped) return mapped;
  }

  if (channel) {
    const normalizedChannel = channel.toLowerCase();
    if (KNOWN_CHANNELS.has(normalizedChannel as ConversationChannel)) {
      return normalizedChannel as ConversationChannel;
    }
  }

  return 'web';
};

const DAY_IN_MS = 86_400_000;
const HOUR_IN_MS = 3_600_000;
const MINUTE_IN_MS = 60_000;

const formatFecha = (fechaString: string | undefined): string => {
  if (!fechaString) return 'Sin fecha';

  try {
    const fecha = new Date(fechaString);
    const ahora = new Date();
    const diffMs = ahora.getTime() - fecha.getTime();
    const diffMins = Math.floor(diffMs / MINUTE_IN_MS);
    const diffHours = Math.floor(diffMs / HOUR_IN_MS);
    const diffDays = Math.floor(diffMs / DAY_IN_MS);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;

    // Formato de fecha completa
    return fecha.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: fecha.getFullYear() !== ahora.getFullYear() ? 'numeric' : undefined,
    });
  } catch {
    return 'Fecha inválida';
  }
};

interface FetchConversationHistoryParams {
  development?: string;
  email: string;
  limit?: number;
}

const buildCacheKey = (development: string, email: string) =>
  `conversationHistory:${development}:${email}`.toLowerCase();

const persistConversationHistory = (
  key: string,
  payload: { items: ConversationHistoryItem[]; source?: 'mcp' | 'cache' },
) => {
  try {
    const cachePayload = {
      items: payload.items,
      savedAt: Date.now(),
      source: payload.source ?? 'mcp',
    };
    localStorage.setItem(key, JSON.stringify(cachePayload));
  } catch {
    // ignore storage errors
  }
};

const readConversationHistoryCache = (
  key: string,
): { items: ConversationHistoryItem[]; savedAt: number; source?: 'mcp' | 'cache' } | null => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.items) return null;
    const source = String(parsed?.source ?? '').toLowerCase() === ('api' + '2') ? 'mcp' : parsed?.source;
    return { ...parsed, source };
  } catch {
    return null;
  }
};

const fetchConversationHistory = async ({
  development = 'bodasdehoy',
  email,
  limit = 50,
}: FetchConversationHistoryParams): Promise<ConversationHistoryQueryResult> => {
  if (!email) {
    throw new Error('Email requerido para cargar el historial');
  }

  const cacheKey = buildCacheKey(development, email);
  const cached = typeof window !== 'undefined' ? readConversationHistoryCache(cacheKey) : null;

  // Siempre usar proxy para evitar mixed-content (HTTPS → HTTP bloqueado)
  const backendURL = EVENTOS_API_CONFIG.BACKEND_URL;
  let url: URL;
  if (backendURL && backendURL.startsWith('http')) {
    url = new URL('/api/conversations/last', backendURL);
  } else {
    url = new URL('/api/backend/api/conversations/last', window.location.origin);
  }

  url.searchParams.set('development', development);
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('email', email);

  try {
  const headers: Record<string, string> = {
    ...buildAuthHeaders(),
    'Developer': development,
    'Origin':
      typeof window !== 'undefined' ? getAPIOriginHeader() : 'https://bodasdehoy.com',
    'SupportKey': getSupportKey(development),
    'X-Development': development,
  };

  const response = await fetch(url.toString(), {
    credentials: 'include',
    headers,
  });

  if (response.status === 401 || response.status === 403) {
    throw new Error(
      'Historial: sesión rechazada por el servidor (token inválido o expirado). El chat puede seguir con otra cookie, pero este endpoint necesita JWT válido. Cierra sesión y vuelve a entrar desde /dev-login o /login, o en consola ejecuta: window.debugAuthState()',
    );
  }

  if (!response.ok) {
    throw new Error(`Error HTTP ${response.status}`);
  }

  const data: ConversationHistoryResponse = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'No se pudieron cargar las conversaciones');
  }

  // Normalizar datos de diferentes formatos de respuesta
  let conversaciones: ConversationHistoryItem[] = [];

    const normalizeConversation = (conv: any): ConversationHistoryItem => {
      const canal = resolveChannel(conv.session_type, conv.channel);
      const fecha = formatFecha(conv.updated_at || conv.created_at);
      const timestampSource = conv.updated_at || conv.created_at || Date.now();

      return {
        canal,
        fecha,
        id: conv.session_id || conv._id || conv.id,
        nombre: conv.title || conv.user_name || 'Conversación sin título',
        raw: conv,
        session_type: conv.session_type,
        timestamp: new Date(timestampSource).getTime(),
        ultimoMensaje: conv.last_message || conv.message || 'Sin mensajes',
      };
    };

    if (Array.isArray(data.conversations)) {
      conversaciones = data.conversations.map(normalizeConversation);
    } else if (Array.isArray(data.chats)) {
      conversaciones = data.chats.map(normalizeConversation);
  }

  // Ordenar por fecha más reciente
  conversaciones.sort((a, b) => b.timestamp - a.timestamp);

    persistConversationHistory(cacheKey, { items: conversaciones, source: data.source });

    return {
      conversations: conversaciones,
      isFallback: false,
      lastUpdated: Date.now(),
      source: data.source === 'cache' ? 'cache' : 'mcp',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // ✅ MEJORA: Logging detallado para debugging
    console.error('❌ Error cargando historial:', errorMessage);
    if (errorMessage.includes('404')) {
      console.error('🔍 Error 404 detectado - Verificar:');
      console.error('   - URL construida:', url.toString());
      console.error('   - Backend URL config:', backendURL);
      console.error('   - Verificar que el backend está corriendo en puerto 8030');
    }

    if (cached) {
      return {
        conversations: cached.items,
        errorMessage: errorMessage.includes('404')
          ? `Error HTTP 404 - Endpoint no encontrado. Verificar que el backend está corriendo.`
          : errorMessage,
        isFallback: true,
        lastUpdated: cached.savedAt,
        source: cached.source ?? 'local',
      };
    }

    throw error;
  }
};

export const useConversationHistory = (
  development: string = 'bodasdehoy',
  email?: string,
) => {
  return useQuery<ConversationHistoryQueryResult>({
    enabled: Boolean(email),
    queryFn: () => fetchConversationHistory({ development, email: email! }),
    queryKey: ['conversationHistory', development, email],
    staleTime: 30_000, // 30 segundos
  });
};
