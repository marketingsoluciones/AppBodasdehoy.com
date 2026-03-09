'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';

import { EventosAutoAuth } from '@/features/EventosAutoAuth';
import { useChatStore } from '@/store/chat';

interface AdminLayoutProps {
  children: ReactNode;
}

function AdminLayoutInner({ children }: AdminLayoutProps) {
  const router = useRouter();
  const currentUserId = useChatStore((s) => s.currentUserId);
  const userRole = useChatStore((s) => s.userRole);

  const isAuthenticated = !!(currentUserId && currentUserId !== 'visitante@guest.local');

  // Mientras EventosAutoAuth hidrata el store, mostrar skeleton
  const [isCheckingAuth, setIsCheckingAuth] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      const saved = JSON.parse(localStorage.getItem('dev-user-config') || '{}');
      const hasSSOCookie = document.cookie.includes('idTokenV0.1.0');
      return !!(hasSSOCookie || (saved?.userId && saved.userId !== 'visitante@guest.local'));
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (isAuthenticated) {
      setIsCheckingAuth(false);
      return;
    }
    const timer = setTimeout(() => setIsCheckingAuth(false), 6000);
    return () => clearTimeout(timer);
  }, [isAuthenticated]);

  // Redirigir si no es admin (después de que se hidrate el store)
  useEffect(() => {
    if (isCheckingAuth) return; // Esperar a que se complete la auth
    if (!isAuthenticated || (userRole !== undefined && userRole !== 'admin')) {
      router.replace('/settings/billing');
    }
  }, [isCheckingAuth, isAuthenticated, userRole, router]);

  if (isCheckingAuth || (isAuthenticated && userRole === undefined)) {
    return (
      <div className="flex h-full">
        <aside className="w-64 border-r border-gray-200 bg-gray-50 p-4">
          <div className="mb-6 h-8 w-32 animate-pulse rounded bg-gray-200" />
          {Array.from({ length: 8 }).map((_, i) => (
            <div className="mb-2 h-9 w-full animate-pulse rounded-lg bg-gray-200" key={i} />
          ))}
        </aside>
        <main className="flex-1 overflow-auto p-6">
          <div className="space-y-4">
            <div className="h-8 w-64 animate-pulse rounded bg-gray-200" />
            <div className="grid grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div className="h-32 animate-pulse rounded-lg bg-gray-200" key={i} />
              ))}
            </div>
            <div className="h-64 animate-pulse rounded-lg bg-gray-200" />
          </div>
        </main>
      </div>
    );
  }

  if (!isAuthenticated || userRole !== 'admin') {
    return null; // Redirect en curso
  }

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-200 bg-gray-50 p-4">
        <h2 className="mb-6 text-xl font-bold">Panel Admin</h2>
        <nav className="space-y-2">
          <Link
            className="block rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            href="/admin"
          >
            📊 Dashboard
          </Link>
          <Link
            className="block rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            href="/admin/billing"
          >
            💰 Facturación y Costos
          </Link>
          <Link
            className="block rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            href="/admin/audit"
          >
            🔍 Auditoría de Costos
          </Link>
          <Link
            className="block rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            href="/admin/tests"
          >
            🧪 Tests de Calidad
          </Link>
          <Link
            className="block rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            href="/admin/playground"
          >
            🎮 Playground - Tiempo Real
          </Link>
          <Link
            className="block rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            href="/admin/training"
          >
            🎓 Entrenamiento IA
          </Link>
          <Link
            className="block rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            href="/admin/mcps"
          >
            🔧 MCPs
          </Link>
          <Link
            className="block rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            href="/admin/campaigns"
          >
            📣 Campañas CRM
          </Link>
          <Link
            className="block rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            href="/admin/users"
          >
            👥 Usuarios
          </Link>
          <Link
            className="block rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            href="/admin/sessions"
          >
            🔐 Sesiones
          </Link>
          <Link
            className="block rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            href="/admin/debug"
          >
            🐛 Debug - Peticiones
          </Link>
          <Link
            className="block rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            href="/admin/branding"
          >
            🎨 Branding - Iconos y Logos
          </Link>
          <Link
            className="block rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            href="/admin/notifications"
          >
            🔔 Notificaciones
          </Link>
          <Link
            className="block rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            href="/admin/debug-logs"
          >
            🐛 Debug Logs
          </Link>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <>
      <EventosAutoAuth />
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </>
  );
}
