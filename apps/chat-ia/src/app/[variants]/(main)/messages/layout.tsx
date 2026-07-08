'use client';

import { useRouter } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';

import { useDomainGuestUser } from '@/hooks/useDomainGuestUser';
import { useUserStore } from '@/store/user';
import { authSelectors } from '@/store/user/selectors';

import { ChannelSidebar } from './components/ChannelSidebar';
import { MessagesRail } from './components/MessagesRail';
import { BottomNavBar } from './components/BottomNavBar';
import { useActiveBandejaTab } from './components/BandejaTabs';

interface MessagesLayoutProps {
  children: ReactNode;
}

// Ventana de gracia antes de redirigir a /login: EventosAutoAuth (SSO Bodas/Firebase)
// puebla currentUserId del chatStore de forma asíncrona tras montar. Durante esa
// hidratación isDomainGuestUser devuelve true (currentUserId undefined = guest, por el
// gate de "login fantasma"). Redirigir en ese instante echaba a /login a usuarios
// AUTENTICADOS (informe 14-jun §8.1: "Acceso requerido" pese a estar logueado).
//
// QA bug 25-jun: navegación DIRECTA a /messages (sin pasar por /chat antes) hacía
// que EventosAutoAuth tardase >2500ms y "Acceso requerido" se mostraba a usuarios
// autenticados. Subido a 5000ms + fast-path localStorage (ver hasLocalJwt abajo).
const AUTH_GRACE_MS = 5000;

/** Fast-path: si hay JWT válido en localStorage, ya estamos autenticados
 *  aunque los stores aún no se hayan hidratado. Evita falso "Acceso requerido"
 *  en navegación directa a /messages.
 */
function hasLocalJwt(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const t = localStorage.getItem('mcp_jwt_token') || localStorage.getItem('jwt_token');
    if (t && t !== 'null' && t !== 'undefined' && t.length > 20) return true;
    const cfg = localStorage.getItem('dev-user-config');
    if (cfg) {
      const parsed = JSON.parse(cfg);
      if (parsed?.token && parsed.token !== 'null' && parsed.token.length > 20) return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

export default function MessagesLayout({ children }: MessagesLayoutProps) {
  const router = useRouter();
  const isLoaded = useUserStore(authSelectors.isLoaded);
  const isGuest = useDomainGuestUser();
  const [graceElapsed, setGraceElapsed] = useState(false);
  // BUG-04 QA #13 (25-jun): leer localStorage en useState initializer rompe
  // hydration (SSR=false, CSR=true). Inicializar a false y hidratar en effect
  // tras el primer paint. Patrón estándar Next.js para datos client-only.
  const [localJwtPresent, setLocalJwtPresent] = useState(false);

  useEffect(() => {
    setLocalJwtPresent(hasLocalJwt());
    const t = setTimeout(() => setGraceElapsed(true), AUTH_GRACE_MS);
    return () => clearTimeout(t);
  }, []);

  // Si deja de ser guest durante la gracia (token Bodas hidratado), no redirigimos.
  // Adicional: si hay JWT local válido, NO redirigir aunque los stores no se hayan
  // hidratado todavía — significa que volvimos a abrir directo a /messages tras login.
  useEffect(() => {
    if (isLoaded && isGuest && graceElapsed && !localJwtPresent) {
      router.replace('/login?redirect=/messages');
    }
  }, [isLoaded, isGuest, graceElapsed, localJwtPresent, router]);

  // Si hay JWT local válido (fast-path), renderizamos UI sin esperar a que
  // los stores acaben de hidratar — evita falso "Acceso requerido" en
  // navegación directa a /messages tras refresh.
  // Mientras carga la auth O dentro de la ventana de gracia (aún puede resolverse a
  // usuario real), mostramos el spinner en vez de la pantalla "Acceso requerido".
  if (!localJwtPresent && (!isLoaded || (isGuest && !graceElapsed))) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-purple-500" />
      </div>
    );
  }

  if (isGuest && graceElapsed && !localJwtPresent) {
    return (
      <div className="flex h-full items-center justify-center bg-white px-6">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-purple-500" />
          <div className="mt-4 text-sm font-semibold text-gray-900">Acceso requerido</div>
          <div className="mt-1 text-xs text-gray-500">Redirigiendo a login…</div>
          <button
            className="mt-4 rounded-lg bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-700"
            onClick={() => router.push('/login?redirect=/messages')}
            type="button"
          >
            Ir a login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      <div className="flex flex-1 overflow-hidden">
        {/* Rail 54px FASE B v2.0 Diseño 25-jun — solo desktop ≥1024px.
            Iconos avatar + Conversaciones + Bandeja + Historial + badge plan. */}
        <MessagesRail />
        {/* Panel izquierdo persistente — tipo WhatsApp/Slack — solo desktop md..lg */}
        <div className="hidden md:flex md:w-80 md:shrink-0 md:flex-col md:border-r md:border-gray-200 lg:hidden">
          <ChannelSidebar compact />
        </div>
        {/* Panel derecho: contenido específico de cada ruta */}
        <div className="flex flex-1 overflow-hidden">
          {children}
        </div>
      </div>
      {/* Móvil only — bottom-bar Asistente/Bandeja/Historial (Diseño 24-jun) */}
      <MobileBottomNav />
    </div>
  );
}

/** Lee tab activa del URL y la pasa al BottomNavBar (móvil only). */
function MobileBottomNav() {
  const activeTab = useActiveBandejaTab();
  return <BottomNavBar activeTab={activeTab} />;
}
