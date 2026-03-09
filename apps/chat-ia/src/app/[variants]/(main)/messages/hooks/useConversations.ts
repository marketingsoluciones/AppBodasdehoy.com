import { useEffect, useState } from 'react';

import { useAuthCheck } from '@/hooks/useAuthCheck';

import { buildHeaders } from '../utils/auth';

export interface Conversation {
  channel: 'whatsapp' | 'instagram' | 'telegram' | 'email';
  contact: {
    avatar?: string;
    name: string;
    phone?: string;
    username?: string;
  };
  id: string;
  lastMessage: {
    fromUser: boolean;
    text: string;
    timestamp: string;
  };
  unreadCount: number;
}

export function useConversations(channel: string | null) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // ✅ NUEVO: Detectar si el usuario es invitado y obtener datos de autenticación
  const { checkAuth, isGuest } = useAuthCheck();
  const authResult = checkAuth();
  const { isAuthenticated, development, userEmail, userId } = authResult;

  const fetchConversations = async () => {
    try {
      setLoading(true);

      // ✅ CORRECCIÓN: Si es usuario invitado, NO mostrar datos mock
      if (isGuest) {
        console.log('👤 Usuario invitado detectado - No se muestran conversaciones mock');
        setConversations([]);
        setError(null);
        setLoading(false);
        return;
      }

      const proxyBase = '/api/messages';
      const headers = buildHeaders();
      const dev = development || 'bodasdehoy';

      // WhatsApp usa el nuevo endpoint en api2 vía proxy /api/messages/whatsapp/...
      // Otros canales usarán api-ia cuando estén implementados
      const fetchUrl = (channel === 'whatsapp' || !channel)
        ? `${proxyBase}/whatsapp/conversations/${dev}`
        : `${proxyBase}/conversations?development=${dev}&channel=${channel}`;

      // ✅ Intentar primero con el backend real
      try {
        const response = await fetch(fetchUrl, { headers });

        if (response.ok) {
          const data = await response.json();
          // api2 devuelve { conversations: [...] }, api-ia devuelve []
          const rawList = Array.isArray(data) ? data : (data.conversations || []);
          const normalized: Conversation[] = rawList.map((c: any) => ({
            channel: 'whatsapp' as const,
            id: c.conversationId || c.id,
            contact: {
              name: c.displayName || c.phoneNumber || 'Desconocido',
              phone: c.phoneNumber,
            },
            lastMessage: {
              text: c.lastMessage || '',
              timestamp: c.lastMessageAt || c.updatedAt || new Date().toISOString(),
              fromUser: false,
            },
            unreadCount: c.unreadCount || 0,
          }));
          const filtered = channel ? normalized.filter((c) => c.channel === channel) : normalized;
          setConversations(filtered);
          setError(null);
          setLoading(false);
          return;
        }
      } catch (backendError) {
        console.warn('⚠️ Backend no disponible:', backendError);
      }

      // Solo en desarrollo, usar datos mock si backend no responde
      const isDevelopment = process.env.NODE_ENV === 'development';
      if (isDevelopment) {

        // ✅ Solo en desarrollo, si el backend no está disponible, usar datos mock
        const mockData: Conversation[] = [
          {
            channel: 'whatsapp',
            contact: {
              avatar: undefined,
              name: 'Juan Pérez',
              phone: '+34622440213',
            },
            id: 'conv_1',
            lastMessage: {
              fromUser: true,
              text: 'Hola, necesito información sobre mi boda',
              timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
            },
            unreadCount: 2,
          },
          {
            channel: 'instagram',
            contact: {
              avatar: undefined,
              name: 'María García',
              username: '@mariagarcia',
            },
            id: 'conv_2',
            lastMessage: {
              fromUser: true,
              text: '¿Cuánto cuesta el servicio?',
              timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            },
            unreadCount: 1,
          },
          {
            channel: 'telegram',
            contact: {
              avatar: undefined,
              name: 'Carlos López',
              username: '@carloslopez',
            },
            id: 'conv_3',
            lastMessage: {
              fromUser: true,
              text: 'Gracias por tu ayuda!',
              timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            },
            unreadCount: 0,
          },
          {
            channel: 'whatsapp',
            contact: {
              avatar: undefined,
              name: 'Ana Martínez',
              phone: '+34600111222',
            },
            id: 'conv_4',
            lastMessage: {
              fromUser: false,
              text: 'Perfecto, nos vemos mañana',
              timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            },
            unreadCount: 0,
          },
        ];

        // Filtrar por canal si está seleccionado
        const filtered = channel ? mockData.filter((conv) => conv.channel === channel) : mockData;

        setConversations(filtered);
      } else {
        // En producción sin mock: lista vacía si backend no responde
        setConversations([]);
      }

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error desconocido'));
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [channel, isGuest, isAuthenticated, development]);

  return { conversations, error, isAuthenticated, loading, refetch: fetchConversations };
}
