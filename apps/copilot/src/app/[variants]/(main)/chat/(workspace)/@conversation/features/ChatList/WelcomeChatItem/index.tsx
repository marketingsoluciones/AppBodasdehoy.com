import React, { memo } from 'react';

import { sessionSelectors } from '@/store/session/selectors';
import { useSessionStore } from '@/store/session/store';
import { useChatStore } from '@/store/chat';

import AgentWelcome from './AgentWelcome';
import GroupWelcome from './GroupWelcome';
import GuestWelcomeMessage from '@/features/GuestWelcomeMessage';

const WelcomeChatItem = memo(() => {
  const isGroupSession = useSessionStore(sessionSelectors.isCurrentSessionGroupSession);
  const { currentUserId, userType, externalChatsInit } = useChatStore((s) => ({
    currentUserId: s.currentUserId,
    externalChatsInit: s.externalChatsInit,
    userType: s.userType,
  }));

  // ✅ CORRECCIÓN: Verificar si es visitante DESPUÉS de que la sesión se haya inicializado
  // Esto evita mostrar el mensaje de registro antes de cargar la sesión desde localStorage
  const isGuest =
    externalChatsInit && // Solo verificar después de que la sesión se inicialice
    (!currentUserId ||
    currentUserId === 'visitante@guest.local' ||
    currentUserId === 'guest' ||
    currentUserId === 'anonymous' ||
    userType === 'guest');

  if (isGroupSession) return <GroupWelcome />;

  // Mostrar mensaje especial para visitantes (solo si la sesión ya se inicializó)
  if (isGuest) return <GuestWelcomeMessage />;

  return <AgentWelcome />;
});

export default WelcomeChatItem;
