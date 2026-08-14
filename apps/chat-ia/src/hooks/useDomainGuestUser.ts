import { useEffect, useState } from 'react';
import { shallow } from 'zustand/shallow';

import { useChatStore } from '@/store/chat';
import { externalChatSelectors } from '@/store/chat/selectors';
import { useUserStore } from '@/store/user';

// AUTH-03 / coherencia de sesión (QA 9-ago): un usuario autenticado por email/Google/SSO
// tiene su JWT en localStorage (mcp_jwt_token/jwt_token) AUNQUE el chat store todavía no
// haya poblado currentUserId (EventosAutoAuth en curso). Sin este fast-path,
// isDomainGuestUser cae a guest=true durante el arranque ("sin id → guest") → el sidebar y
// menús mostraban "Iniciar sesión" con contenido ya cargado, y /files el muro "Crear
// cuenta" a usuarios YA logueados: identidad incoherente entre módulos. Mismo patrón que
// ya usan bandeja/layout y settings. 0 impacto de seguridad: un visitante real no tiene JWT.
function hasLocalJwt(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const t = localStorage.getItem('mcp_jwt_token') || localStorage.getItem('jwt_token');
    return !!t && t.length > 20;
  } catch {
    return false;
  }
}

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
  // Fast-path JWT local (lectura post-mount → SSR-safe: server y primer render cliente
  // devuelven false, sin hydration mismatch; tras montar refleja el JWT real). NO leer en el
  // useState initializer: rompe la hidratación (BUG-04 QA #13). El parpadeo transitorio se
  // resuelve en el consumidor mostrando un loader durante la ventana (ver /integraciones, /files).
  const [hasJwt, setHasJwt] = useState(false);
  useEffect(() => {
    setHasJwt(hasLocalJwt());
  }, []);

  const lobeName = (username || fullName || '').toLowerCase().trim();
  const isServerMode = process.env.NEXT_PUBLIC_SERVICE_MODE === 'server';

  // Usuario con JWT local = autenticado → nunca invitado (coherencia en toda la app).
  if (hasJwt) return false;
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
