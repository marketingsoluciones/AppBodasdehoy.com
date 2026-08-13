'use client';

/**
 * MessagesRail — rail vertical 56px del lado izquierdo de la Bandeja.
 * Rediseño 18-jul: 54 → 56px + fondo #FCFCFD + border #EDEDF0 (tokens sistema).
 * Diseño 25-jun-2026 (handoff v2):
 *
 * De arriba a abajo:
 *   1. Avatar usuario (32x32 gradient #F59E0B → #E11D48)
 *   2. Conversaciones (chat bubble) — link a /chat
 *   3. Bandeja / Mensajes (inbox) — link a /messages, badge no leídos
 *   4. Historial / Notificaciones (reloj) — link a /messages?tab=history
 *   -- espacio flexible --
 *   5. Badge plan (texto "€XX" del workspace)
 *
 * Cada icono (2-4): contenedor 36x36, border-radius 10px.
 * Activo: bg #7C3AED + icono #fff. Inactivo: bg transparent + icono #A39DB5.
 * Hover: bg #F6F4FB (surface-rail).
 */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type ReactNode, useMemo } from 'react';

import { useAuthCheck } from '@/hooks/useAuthCheck';

import { useBandejaBrand } from '../utils/brand';

interface RailItem {
  href: string;
  icon: ReactNode;
  label: string;
  matchPrefix: string;
  unreadCount?: number;
}

const ICON_CONVERSATIONS = (
  <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="20">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const ICON_INBOX = (
  <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="20">
    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
    <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
  </svg>
);

const ICON_HISTORY = (
  <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="20">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v5l3 2" />
  </svg>
);

// Rediseño 18-jul Fase B — item nuevo "Agentes" (Cowork). Ver /agentes.
const ICON_AGENTS = (
  <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="20">
    <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
    <circle cx="10" cy="7" r="4" />
    <path d="M22 11l-2 2-2-2" />
    <path d="M20 13V7" />
  </svg>
);

interface MessagesRailProps {
  historyUnread?: number;
  inboxUnread?: number;
  planLabel?: string;
}

export function MessagesRail({
  inboxUnread = 0,
  historyUnread = 0,
  planLabel,
}: MessagesRailProps) {
  const pathname = usePathname();
  const brand = useBandejaBrand();
  const { checkAuth } = useAuthCheck();
  const auth = checkAuth();
  const userInitial = (auth.userId || '?').charAt(0).toUpperCase();

  const items: RailItem[] = useMemo(
    () => [
      {
        href: '/asistente',
        icon: ICON_CONVERSATIONS,
        label: 'Conversaciones',
        matchPrefix: '/asistente',
      },
      {
        href: '/bandeja',
        icon: ICON_INBOX,
        label: 'Bandeja',
        matchPrefix: '/bandeja',
        unreadCount: inboxUnread,
      },
      {
        href: '/agentes',
        icon: ICON_AGENTS,
        label: 'Agentes',
        matchPrefix: '/agentes',
      },
      {
        href: '/bandeja?tab=history',
        icon: ICON_HISTORY,
        label: 'Notificaciones',
        matchPrefix: '/bandeja?tab=history',
        unreadCount: historyUnread,
      },
    ],
    [inboxUnread, historyUnread],
  );

  const isActive = (matchPrefix: string) => {
    if (!pathname) return false;
    // Match exacto sin querystring (excepto cuando el item incluye query)
    if (matchPrefix.includes('?')) return false; // querystring matching → caller
    return pathname === matchPrefix || pathname.startsWith(matchPrefix + '/');
  };

  return (
    <nav
      aria-label="Rail navegación Bandeja"
      className="hidden h-full w-[56px] shrink-0 flex-col items-center justify-between border-r py-3 lg:flex"
      style={{ backgroundColor: '#FCFCFD', borderColor: '#EDEDF0' }}
    >
      {/* Top: avatar + items navegación */}
      <div className="flex flex-col items-center gap-2">
        {/* Avatar usuario */}
        <div
          aria-label="Usuario"
          className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{ background: 'linear-gradient(135deg, #F59E0B, #E11D48)' }}
          title={auth.userId || 'Usuario'}
        >
          {userInitial}
        </div>

        <div className="my-1 h-px w-6" style={{ backgroundColor: '#EFEFF3' }} />

        {/* Items navegación */}
        {items.map((item) => {
          const active = isActive(item.matchPrefix);
          return (
            <Link
              aria-current={active ? 'page' : undefined}
              aria-label={item.label}
              className="relative flex h-9 w-9 items-center justify-center rounded-[10px] transition-colors"
              href={item.href}
              key={item.href}
              style={
                active
                  ? { backgroundColor: brand.brand, color: brand.onBrand }
                  : { backgroundColor: 'transparent', color: '#A39DB5' }
              }
              title={item.label}
            >
              {item.icon}
              {item.unreadCount != null && item.unreadCount > 0 && (
                <span
                  aria-label={`${item.unreadCount} sin leer`}
                  className="absolute -right-0.5 -top-0.5 flex h-[15px] min-w-[15px] items-center justify-center rounded-full px-0.5 text-[9px] font-bold text-white"
                  style={{
                    backgroundColor: '#FF3B5C',
                    border: '2px solid #F6F4FB',
                  }}
                >
                  {item.unreadCount > 99 ? '99+' : item.unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Bottom: badge plan */}
      {planLabel && (
        <div
          className="rounded-md px-1.5 py-0.5 text-[9px] font-bold"
          style={{ backgroundColor: brand.brandBg, color: brand.brand }}
          title={`Plan ${planLabel}`}
        >
          {planLabel}
        </div>
      )}
    </nav>
  );
}
