import { useEffect, useState } from 'react';

import { useAuthCheck } from '@/hooks/useAuthCheck';

export interface Message {
  attachments?: Array<{
    filename?: string;
    type: 'image' | 'file';
    url: string;
  }>;
  fromUser: boolean;
  id: string;
  status?: 'sent' | 'delivered' | 'read';
  text: string;
  // true = del contacto, false = tuya (respuesta)
  timestamp: string;
}

export function useMessages(channel: string, conversationId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // ✅ NUEVO: Detectar si el usuario es invitado
  const { checkAuth, isGuest } = useAuthCheck();
  const authResult = checkAuth();
  const { isAuthenticated, development } = authResult;

  const fetchMessages = async () => {
    try {
      setLoading(true);

      // ✅ CORRECCIÓN: Si es usuario invitado, NO mostrar datos mock
      if (isGuest) {
        console.log('👤 Usuario invitado detectado - No se muestran mensajes mock');
        setMessages([]);
        setError(null);
        setLoading(false);
        return;
      }

      // ✅ IMPLEMENTACIÓN: Fetch real desde backend
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8030';

      // Obtener token de autenticación
      let token: string | null = null;
      if (typeof window !== 'undefined') {
        token =
          localStorage.getItem('auth-token') ||
          sessionStorage.getItem('auth-token') ||
          (localStorage.getItem('dev-user-config')
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
            : null);
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${backendUrl}/api/messages/conversations/${conversationId}`, {
        headers,
      });

      if (!response.ok) {
        if (response.status === 404) {
          // Conversación no encontrada - retornar lista vacía
          setMessages([]);
          setError(null);
          return;
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Convertir formato del backend al formato esperado
      const formattedMessages: Message[] = Array.isArray(data)
        ? data.map((msg: any) => ({
            attachments: msg.attachments,
            fromUser: msg.fromUser !== undefined ? msg.fromUser : !msg.role || msg.role === 'user',
            id: msg.id || msg.messageId || `msg_${Date.now()}_${Math.random()}`,
            status: msg.status || 'read',
            text: msg.text || msg.content || '',
            timestamp: msg.timestamp || msg.createdAt || new Date().toISOString(),
          }))
        : [];

      setMessages(formattedMessages);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error desconocido al obtener mensajes');
      setError(error);
      console.error('Error al obtener mensajes:', error);

      // ✅ En producción, no usar datos mock como fallback
      const isProduction = process.env.NODE_ENV === 'production';
      if (isProduction) {
        setMessages([]);
      } else {
        // ⚠️ Solo en desarrollo, usar datos mock como fallback
        console.warn('⚠️ MODO DESARROLLO: Usando datos mock como fallback');
        const mockData: Message[] = [
          {
            fromUser: true,
            id: 'msg_1',
            status: 'read',
            text: 'Hola, necesito información sobre mi boda',
            timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          },
          {
            fromUser: false,
            id: 'msg_2',
            status: 'read',
            text: '¡Hola! Claro, estaré encantado de ayudarte. ¿Qué necesitas saber?',
            timestamp: new Date(Date.now() - 9 * 60 * 1000).toISOString(),
          },
        ];
        setMessages(mockData);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (conversationId) {
      fetchMessages();
    }
  }, [conversationId, isGuest, isAuthenticated, development]); // ✅ Agregar dependencias

  const addMessage = (message: Message) => {
    setMessages((prev) => [...prev, message]);
  };

  return { addMessage, error, loading, messages, refetch: fetchMessages };
}
