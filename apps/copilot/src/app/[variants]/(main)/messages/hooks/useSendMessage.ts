import { useState } from 'react';

interface Message {
  fromUser: boolean;
  id: string;
  status?: 'sent' | 'delivered' | 'read';
  text: string;
  timestamp: string;
}

export function useSendMessage() {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const sendMessage = async (
    channel: string,
    conversationId: string,
    text: string,
  ): Promise<{ message: Message; success: boolean }> => {
    try {
      setSending(true);
      setError(null);

      // ✅ IMPLEMENTACIÓN: Envío real a backend
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

      const response = await fetch(`${backendUrl}/api/messages/send`, {
        body: JSON.stringify({
          channel,
          conversationId,
          text,
        }),
        headers,
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.detail ||
          errorData.message ||
          `Error ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Retornar mensaje en el formato esperado
      return {
        message: {
          fromUser: true, // El mensaje es del usuario
          id: data.id || data.messageId || `msg_${Date.now()}`,
          status: 'sent' as const,
          text,
          timestamp: data.timestamp || new Date().toISOString(),
        },
        success: true,
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error desconocido al enviar mensaje');
      setError(error);
      console.error('Error al enviar mensaje:', error);
      // No relanzar el error para evitar recarga de página
      // El componente puede manejar el error desde el estado
      return {
        message: {
          fromUser: true,
          id: `msg_error_${Date.now()}`,
          status: 'sent' as const,
          text,
          timestamp: new Date().toISOString(),
        },
        success: false,
      };
    } finally {
      setSending(false);
    }
  };

  return { error, sendMessage, sending };
}
