'use client';

/**
 * BottomNavBar — barra de navegación inferior en móvil (< md).
 * Diseño handoff v2 (24-jun) sección "Móvil":
 *   Asistente | Bandeja | Historial
 *
 * "Asistente" = navega al Workspace /chat (LobeChat).
 * "Bandeja" = /messages?tab=inbox (default).
 * "Historial" = /messages?tab=history.
 *
 * Badge no-leídos en Bandeja + Historial.
 */
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

interface BottomNavBarProps {
  activeTab: 'conv' | 'inbox' | 'history';
  inboxUnread?: number;
  historyUnread?: number;
}

const ITEMS: Array<{
  id: 'conv' | 'inbox' | 'history';
  label: string;
  icon: string;
  href: string;
}> = [
  { href: '/chat', icon: '💬', id: 'conv', label: 'Asistente' },
  { href: '/bandeja?tab=inbox', icon: '📥', id: 'inbox', label: 'Bandeja' },
  { href: '/bandeja?tab=history', icon: '🕒', id: 'history', label: 'Historial' },
];

export function BottomNavBar({
  activeTab,
  inboxUnread = 0,
  historyUnread = 0,
}: BottomNavBarProps) {
  const router = useRouter();

  const handleClick = useCallback(
    (href: string) => {
      router.push(href);
    },
    [router],
  );

  return (
    <nav
      aria-label="Navegación inferior móvil"
      className="flex items-center justify-around border-t border-gray-200 bg-white md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0)' }}
    >
      {ITEMS.map((item) => {
        const isActive = activeTab === item.id;
        const unread = item.id === 'inbox' ? inboxUnread : item.id === 'history' ? historyUnread : 0;
        return (
          <button
            aria-current={isActive ? 'page' : undefined}
            aria-label={item.label}
            className="flex flex-1 flex-col items-center gap-0.5 py-2 transition-colors"
            key={item.id}
            onClick={() => handleClick(item.href)}
            style={{ color: isActive ? '#7C3AED' : '#6B6678' }}
            type="button"
          >
            <span aria-hidden className="relative text-xl">
              {item.icon}
              {unread > 0 && (
                <span
                  className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-0.5 text-[9px] font-bold text-white"
                  style={{ backgroundColor: '#FF3B5C' }}
                >
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </span>
            <span className="text-[10px] font-semibold">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
