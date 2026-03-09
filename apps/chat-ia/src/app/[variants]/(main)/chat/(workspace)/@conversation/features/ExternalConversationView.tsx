'use client';

import { useSearchParams } from 'next/navigation';
import { memo, useMemo } from 'react';
import { createStyles } from 'antd-style';

import {
  useExternalConversationMessages,
} from '@/hooks/useExternalConversationMessages';
import { useChatStore } from '@/store/chat';

import ExternalConversationComposer from './ExternalConversationComposer';
import ExternalMessageList from './ExternalMessageList';

const useStyles = createStyles(({ css }) => ({
  container: css`
    overflow: hidden;
    display: flex;
    flex-direction: column;
    height: 100%;
  `,
  messages: css`
    overflow-y: auto;
    flex: 1;
  `,
}));

/**
 * Componente que detecta si estamos en una conversación externa y muestra sus mensajes
 * Retorna un objeto con el componente y un flag para ocultar ChatList
 */
export const useExternalConversation = () => {
  const searchParams = useSearchParams();
  const development = useChatStore((s) => s.development || 'bodasdehoy');
  const sessionId = searchParams.get('session');
  const isExternal = searchParams.get('external') === 'true';
  const channel = searchParams.get('channel') || 'web';
  const isGroup = searchParams.get('is_group') === 'true';
  const sessionType = searchParams.get('session_type') || undefined;

  // Extraer el ID real de la sesión (remover prefijo "external:")
  const realSessionId = useMemo(() => {
    if (!sessionId) return null;
    if (sessionId.startsWith('external:')) {
      return sessionId.replace('external:', '');
    }
    return isExternal ? sessionId : null;
  }, [sessionId, isExternal]);

  // ✅ CORRECCIÓN: Solo considerar conversación externa si hay sessionId válido Y isExternal=true
  // Si no hay sessionId, NO es conversación externa (mostrar chat normal)
  const isExternalConversation = isExternal === true && !!realSessionId && realSessionId.trim() !== '';

  return {
    channel,
    development,
    isExternalConversation,
    isGroup,
    sessionId: realSessionId,
    sessionType,
  };
};

const ExternalConversationView = memo(() => {
  const {
    channel,
    development,
    isExternalConversation,
    isGroup,
    sessionId,
    sessionType,
  } = useExternalConversation();
  const { styles } = useStyles();
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    status,
  } = useExternalConversationMessages(sessionId, development, {
    is_group: isGroup,
    session_type: sessionType,
  });

  const messages = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages
      .flatMap((page) => page.messages)
      .sort((a, b) => {
        const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return dateA - dateB;
      });
  }, [data?.pages]);

  // Solo renderizar si es una conversación externa
  if (!isExternalConversation) {
    return null;
  }

  if (status === 'pending') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-500">
          <div className="mb-2 animate-spin text-2xl">⏳</div>
          <div>Cargando conversación...</div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-red-500">
          <div className="mb-2">❌</div>
          <div>No se pudo cargar la conversación</div>
          <div className="text-xs text-gray-400 mt-1">
            {error instanceof Error ? error.message : 'Error desconocido'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.messages}>
        <ExternalMessageList
          channel={channel}
          hasMore={hasNextPage}
          isLoadingMore={isFetchingNextPage}
          messages={messages}
          onLoadMore={hasNextPage ? fetchNextPage : undefined}
          onReload={refetch}
        />
      </div>
      <ExternalConversationComposer
        channel={channel}
        development={development}
        isGroup={isGroup}
        sessionId={sessionId}
        sessionType={sessionType}
      />
    </div>
  );
});

ExternalConversationView.displayName = 'ExternalConversationView';

export default ExternalConversationView;

