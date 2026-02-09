'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

import { ConversationHistoryItem } from '@/hooks/useConversationHistory';

/**
 * Hook para abrir una conversación externa en el panel de chat
 */
export const useOpenExternalConversation = () => {
  const router = useRouter();

  const openExternalConversation = useCallback(
    (conversation: ConversationHistoryItem) => {
      // Crear un ID único para la conversación externa
      // Usar prefijo "external:" para distinguirlas de las sesiones normales de Lobe Chat
      const externalSessionId = `external:${conversation.id}`;

      // Construir parámetros de URL
      const params = new URLSearchParams({
        channel: conversation.canal,
        external: 'true',
        session: externalSessionId,
      });

      if (conversation.session_type) {
        params.append('session_type', conversation.session_type);
      }

      if (conversation.raw?.tipo === 'grupo' || conversation.raw?.is_group) {
        params.append('is_group', 'true');
      }

      // Navegar a la conversación externa
      router.push(`/chat?${params.toString()}`);
    },
    [router]
  );

  return { openExternalConversation };
};

