import { shallow } from 'zustand/shallow';

import { useChatStore } from '@/store/chat';
import { externalChatSelectors } from '@/store/chat/selectors';
import { useUserStore } from '@/store/user';

/**
 * Invitado en dominio Bodas: combina chat store + nombre en useUserStore (Lobe),
 * por si el perfil del chat llegó inconsistente por el merge de userData.
 *
 * Importante: el selector de useUserStore debe usar `shallow` si devuelve un objeto;
 * si no, cada render crea un objeto nuevo y Zustand re-suscribe en bucle → pantalla de error.
 */
export function useDomainGuestUser(): boolean {
  const fromChat = useChatStore((s) => externalChatSelectors.isDomainGuestUser(s));
  const { fullName, username } = useUserStore(
    (s) => ({
      fullName: s.user?.fullName,
      username: s.user?.username,
    }),
    shallow,
  );
  const lobeName = (username || fullName || '').toLowerCase().trim();
  if (lobeName === 'guest') return true;
  return fromChat;
}
