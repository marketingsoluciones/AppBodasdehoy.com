import { useEffect, useState } from 'react';

import { useAuthCheck } from '@/hooks/useAuthCheck';

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

      // ✅ MEJORA 3: Preparar headers de autenticación
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8030';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // ✅ Obtener token JWT si está disponible
      let token: string | null = null;
      if (typeof window !== 'undefined') {
        token =
          localStorage.getItem('auth-token') ||
          sessionStorage.getItem('auth-token') ||
          localStorage.getItem('dev-user-config')
            ? (() => {
                try {
                  const configStr = localStorage.getItem('dev-user-config') || '{}';
                  if (!configStr.trim().startsWith('{') && !configStr.trim().startsWith('[')) {
                    return undefined;
                  }
                  return JSON.parse(configStr)?.token;
                } catch {
                  return undefined;
                }
              })()
            : null;
      }

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // ✅ MEJORA 3: Construir parámetros con información del usuario
      const params = new URLSearchParams({
        development: development || 'bodasdehoy',
        ...(userEmail && { email: userEmail }),
        ...(userId && { user_id: userId }),
        ...(channel && { channel }),
      });

      // ✅ CORRECCIÓN: Solo en desarrollo/testing, usar datos mock si no hay backend
      const isDevelopment = process.env.NODE_ENV === 'development';

      if (isDevelopment) {
        // Intentar obtener desde backend real primero
        try {
          const response = await fetch(`${backendUrl}/api/messages/conversations?${params}`, {
            headers,
          });

          if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data) && data.length > 0) {
              // Filtrar por canal si está seleccionado
              const filtered = channel
                ? data.filter((conv: Conversation) => conv.channel === channel)
                : data;
              setConversations(filtered);
              setError(null);
              setLoading(false);
              return;
            }
          }
        } catch (backendError) {
          console.warn(
            '⚠️ No se pudo conectar al backend, usando datos mock (solo desarrollo):',
            backendError,
          );
        }

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
        // ✅ En producción, siempre intentar obtener desde backend con autenticación
        try {
          const response = await fetch(`${backendUrl}/api/messages/conversations?${params}`, {
            headers,
          });

          if (response.ok) {
            const data = await response.json();
            const filtered = channel
              ? data.filter((conv: Conversation) => conv.channel === channel)
              : data;
            setConversations(filtered);
          } else {
            console.warn('⚠️ Backend retornó error:', response.status, response.statusText);
            setConversations([]);
          }
        } catch (fetchError) {
          console.error('❌ Error al obtener conversaciones:', fetchError);
          setConversations([]);
        }
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

  return { conversations, error, loading, refetch: fetchConversations };
}
