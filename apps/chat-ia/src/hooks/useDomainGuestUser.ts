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
  const isSignedIn = useUserStore((s) => s.isSignedIn);
  const { fullName, username } = useUserStore(
    (s) => ({
      fullName: s.user?.fullName,
      username: s.user?.username,
    }),
    shallow,
  );
  const lobeName = (username || fullName || '').toLowerCase().trim();
  const isServerMode = process.env.NEXT_PUBLIC_SERVICE_MODE === 'server';
  // BUG MÓVIL (22-jul): un usuario autenticado por Bodas-SSO (EventosAutoAuth →
  // currentUserId en chatStore) tiene isSignedIn=false (no usa el auth NATIVO de
  // LobeChat). Esta línea lo trataba como GUEST → en móvil ocultaba la pestaña
  // Bandeja (y su badge de notificaciones) a usuarios Bodas LOGUEADOS.
  // Fix: solo es guest si AMBOS lo confirman — LobeChat (!isSignedIn) Y el chat
  // store Bodas (fromChat, que ya considera currentUserId + userType). Un guest
  // real sigue con fromChat=true → sigue bloqueado (0 impacto de seguridad).
  if (isServerMode && !isSignedIn && fromChat) return true;
  // ✅ Si el usuario está autenticado por el sistema nativo de LobeChat (isSignedIn),
  // NO es invitado aunque el chatStore aún no tenga currentUserId (puebla EventosAutoAuth).
  // Esto evita tratar como guest a un usuario logueado por isSignedIn (regresión del gate de
  // seguridad en isDomainGuestUser, que asume guest si falta currentUserId).
  if (isSignedIn) return false;
  if (
    lobeName === 'guest' ||
    lobeName === 'anonymous' ||
    lobeName === 'visitante' ||
    lobeName.startsWith('visitante ') ||
    lobeName.startsWith('visitante·') ||
    lobeName.startsWith('visitante ·') ||
    lobeName === 'visitor' ||
    lobeName.startsWith('visitor ')
  ) {
    return true;
  }
  return fromChat;
}
