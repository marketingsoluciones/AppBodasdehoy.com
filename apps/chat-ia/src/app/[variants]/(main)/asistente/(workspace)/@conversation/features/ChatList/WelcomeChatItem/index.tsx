import React, { memo } from 'react';

import { useDomainGuestUser } from '@/hooks/useDomainGuestUser';
import { sessionSelectors } from '@/store/session/selectors';
import { useSessionStore } from '@/store/session/store';
import { useChatStore } from '@/store/chat';

import AgentWelcome from './AgentWelcome';
import GroupWelcome from './GroupWelcome';
import GuestWelcomeMessage from '@/features/GuestWelcomeMessage';

const WelcomeChatItem = memo(() => {
  const isGroupSession = useSessionStore(sessionSelectors.isCurrentSessionGroupSession);
  const externalChatsInit = useChatStore((s) => s.externalChatsInit);

  // P0 coherencia de sesión (QA 15-ago): usar la detección CANÓNICA cookie-aware en vez
  // de leer currentUserId/userType crudos. Antes, en navegación client-side a /asistente,
  // si externalChatsInit se ponía true ANTES de que currentUserId estuviera poblado, se
  // mostraba GuestWelcomeMessage ("Regístrate/Crear cuenta") a usuarios YA autenticados
  // (flash de invitado que QA veía antes del hard-reload). useDomainGuestUser tiene el
  // fast-path de sesión SSO (cookie/JWT) → devuelve false aunque currentUserId aún no llegue.
  const isVisitorUser = useDomainGuestUser();

  if (isGroupSession) return <GroupWelcome />;

  // Wait for session initialization to avoid AgentWelcome flash for guest users
  if (!externalChatsInit && isVisitorUser) return null;

  if (externalChatsInit && isVisitorUser) return <GuestWelcomeMessage />;

  return <AgentWelcome />;
});

export default WelcomeChatItem;
