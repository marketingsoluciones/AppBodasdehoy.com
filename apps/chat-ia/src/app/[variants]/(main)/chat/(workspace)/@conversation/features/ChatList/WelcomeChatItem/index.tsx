import React, { memo } from 'react';

import { sessionSelectors } from '@/store/session/selectors';
import { useSessionStore } from '@/store/session/store';
import { useChatStore } from '@/store/chat';

import AgentWelcome from './AgentWelcome';
import GroupWelcome from './GroupWelcome';
import GuestWelcomeMessage from '@/features/GuestWelcomeMessage';

const WelcomeChatItem = memo(() => {
  const isGroupSession = useSessionStore(sessionSelectors.isCurrentSessionGroupSession);
  const currentUserId = useChatStore((s) => s.currentUserId);
  const userType = useChatStore((s) => s.userType);
  const externalChatsInit = useChatStore((s) => s.externalChatsInit);

  // ✅ CORRECCIÓN: Verificar si es visitante DESPUÉS de que la sesión se haya inicializado
  // Esto evita mostrar el mensaje de registro antes de cargar la sesión desde localStorage
  const isVisitorUser =
    !currentUserId ||
    currentUserId === 'visitante@guest.local' ||
    currentUserId === 'guest' ||
    currentUserId === 'anonymous' ||
    currentUserId?.startsWith('visitor_') ||
    userType === 'guest' ||
    userType === 'visitor';

  if (isGroupSession) return <GroupWelcome />;

  // Wait for session initialization to avoid AgentWelcome flash for guest users
  if (!externalChatsInit && isVisitorUser) return null;

  if (externalChatsInit && isVisitorUser) return <GuestWelcomeMessage />;

  return <AgentWelcome />;
});

export default WelcomeChatItem;
