'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';

import { EventosAutoAuth } from '@/features/EventosAutoAuth';
import { useChatStore } from '@/store/chat';

interface AdminLayoutProps {
  children: ReactNode;
}

const NAV_ITEMS = [
  { href: '/admin', icon: '📊', label: 'Dashboard' },
  { href: '/admin/billing', icon: '💰', label: 'Facturación y Costos' },
  { href: '/admin/audit', icon: '🔍', label: 'Auditoría de Costos' },
  { href: '/admin/tests', icon: '🧪', label: 'Tests de Calidad' },
  { href: '/admin/playground', icon: '🎮', label: 'Playground - Tiempo Real' },
  { href: '/admin/training', icon: '🎓', label: 'Entrenamiento IA' },
  { href: '/admin/mcps', icon: '🔧', label: 'MCPs' },
  { href: '/admin/campaigns', icon: '📣', label: 'Campañas CRM' },
  { href: '/admin/users', icon: '👥', label: 'Usuarios' },
  { href: '/admin/sessions', icon: '🔐', label: 'Sesiones' },
  { href: '/admin/debug', icon: '🐛', label: 'Debug - Peticiones' },
  { href: '/admin/branding', icon: '🎨', label: 'Branding - Iconos y Logos' },
  { href: '/admin/notifications', icon: '🔔', label: 'Notificaciones' },
  { href: '/admin/debug-logs', icon: '🐛', label: 'Debug Logs' },
];

function isActive(pathname: string, href: string): boolean {
  if (href === '/admin') return pathname === '/admin';
  return pathname.startsWith(href);
}

function Breadcrumbs({ pathname }: { pathname: string }) {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length <= 1) return null;

  const crumbs = segments.map((seg, i) => {
    const href = '/' + segments.slice(0, i + 1).join('/');
    const navItem = NAV_ITEMS.find((item) => item.href === href);
    const label = navItem ? navItem.label : seg.charAt(0).toUpperCase() + seg.slice(1);
    const isLast = i === segments.length - 1;

    return (
      <span key={href} className="flex items-center gap-1">
        {i > 0 && <span className="text-gray-300 mx-1">/</span>}
        {isLast ? (
          <span className="text-gray-900 font-medium text-sm">{label}</span>
        ) : (
          <Link href={href} className="text-gray-500 text-sm hover:text-blue-600">
            {label}
          </Link>
        )}
      </span>
    );
  });

  return (
    <div className="mb-4 flex items-center flex-wrap text-sm">
      {crumbs}
    </div>
  );
}

function AdminLayoutInner({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const currentUserId = useChatStore((s) => s.currentUserId);
  const userRole = useChatStore((s) => s.userRole);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAuthenticated = !!(currentUserId && currentUserId !== 'visitante@guest.local');

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

  useEffect(() => {
    if (isCheckingAuth) return;
    if (!isAuthenticated || (userRole !== undefined && userRole !== 'admin')) {
      router.replace('/settings/billing');
    }
  }, [isCheckingAuth, isAuthenticated, userRole, router]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (isCheckingAuth || (isAuthenticated && userRole === undefined)) {
    return (
      <div className="flex h-full">
        <aside className="hidden w-64 border-r border-gray-200 bg-gray-50 p-4 md:block">
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
    return null;
  }

  return (
    <div className="flex h-full">
      {/* Mobile hamburger */}
      <button
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-md md:hidden"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        type="button"
      >
        {sidebarOpen ? '✕' : '☰'}
      </button>

      {/* Backdrop for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed z-40 h-full w-64 transform border-r border-gray-200 bg-gray-50 p-4 transition-transform md:static md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <h2 className="mb-6 text-xl font-bold">Panel Admin</h2>
        <nav className="space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 100px)' }}>
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                className={`block rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-blue-100 text-blue-700 border-l-3 border-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                href={item.href}
              >
                {item.icon} {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-6 md:pl-6 pl-4 pt-16 md:pt-6">
        <Breadcrumbs pathname={pathname} />
        {children}
      </main>
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
