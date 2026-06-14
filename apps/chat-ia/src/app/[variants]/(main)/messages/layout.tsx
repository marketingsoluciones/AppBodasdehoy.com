'use client';

import { useRouter } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';

import { useDomainGuestUser } from '@/hooks/useDomainGuestUser';
import { useUserStore } from '@/store/user';
import { authSelectors } from '@/store/user/selectors';

import { ChannelSidebar } from './components/ChannelSidebar';

interface MessagesLayoutProps {
  children: ReactNode;
}

// Ventana de gracia antes de redirigir a /login: EventosAutoAuth (SSO Bodas/Firebase)
// puebla currentUserId del chatStore de forma asíncrona tras montar. Durante esa
// hidratación isDomainGuestUser devuelve true (currentUserId undefined = guest, por el
// gate de "login fantasma"). Redirigir en ese instante echaba a /login a usuarios
// AUTENTICADOS (informe 14-jun §8.1: "Acceso requerido" pese a estar logueado).
const AUTH_GRACE_MS = 2500;

export default function MessagesLayout({ children }: MessagesLayoutProps) {
  const router = useRouter();
  const isLoaded = useUserStore(authSelectors.isLoaded);
  const isGuest = useDomainGuestUser();
  const [graceElapsed, setGraceElapsed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setGraceElapsed(true), AUTH_GRACE_MS);
    return () => clearTimeout(t);
  }, []);

  // Si deja de ser guest durante la gracia (token Bodas hidratado), no redirigimos.
  useEffect(() => {
    if (isLoaded && isGuest && graceElapsed) {
      router.replace('/login?redirect=/messages');
    }
  }, [isLoaded, isGuest, graceElapsed, router]);

  // Mientras carga la auth O dentro de la ventana de gracia (aún puede resolverse a
  // usuario real), mostramos el spinner en vez de la pantalla "Acceso requerido".
  if (!isLoaded || (isGuest && !graceElapsed)) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-purple-500" />
      </div>
    );
  }

  if (isGuest && graceElapsed) {
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
    <div className="flex h-full overflow-hidden bg-white">
      {/* Panel izquierdo persistente — tipo WhatsApp/Slack — solo desktop */}
      <div className="hidden md:flex md:w-80 md:shrink-0 md:flex-col md:border-r md:border-gray-200">
        <ChannelSidebar compact />
      </div>
      {/* Panel derecho: contenido específico de cada ruta */}
      <div className="flex flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
