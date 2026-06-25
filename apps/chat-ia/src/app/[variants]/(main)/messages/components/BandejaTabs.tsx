'use client';

/**
 * BandejaTabs — wrapper de tabs principales /messages.
 * Diseño handoff v2 (24-jun) Sección "Las 3 pestañas".
 *
 *   1. CONVERSACIONES (Workspace LobeChat actual integrado, ruta /chat)
 *   2. BANDEJA       (lista de conversaciones — vista actual de /messages)
 *   3. HISTORIAL     (feed notificaciones del sistema)
 *
 * Sincronizado con URL via `?tab=conv|inbox|history`.
 * Default `inbox`. Si tab='conv' redirigimos a /chat (no embedimos).
 */
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

export type BandejaTab = 'conv' | 'inbox' | 'history';

interface BandejaTabsProps {
  active: BandejaTab;
  /** Counter por tab opcional (badge). */
  counts?: Partial<Record<BandejaTab, number>>;
}

const TAB_META: Array<{ id: BandejaTab; label: string; icon: string; redirectsTo?: string }> = [
  { id: 'conv', icon: '💬', label: 'Conversaciones', redirectsTo: '/chat' },
  { id: 'inbox', icon: '📥', label: 'Bandeja' },
  { id: 'history', icon: '🕒', label: 'Historial' },
];

export function BandejaTabs({ active, counts }: BandejaTabsProps) {
  const router = useRouter();
  const sp = useSearchParams();

  const handleClick = useCallback(
    (tab: (typeof TAB_META)[number]) => {
      if (tab.redirectsTo) {
        router.push(tab.redirectsTo);
        return;
      }
      const params = new URLSearchParams(sp?.toString() ?? '');
      params.set('tab', tab.id);
      // Conservar otros params (scope, filtros, etc.)
      router.replace(`/messages?${params.toString()}`);
    },
    [router, sp],
  );

  return (
    <div
      className="flex items-center gap-1 border-b border-gray-200 bg-white px-3 py-1.5"
      role="tablist"
    >
      {TAB_META.map((tab) => {
        const isActive = active === tab.id;
        const count = counts?.[tab.id];
        return (
          <button
            aria-controls={`tab-panel-${tab.id}`}
            aria-selected={isActive}
            className={`relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              isActive ? 'bg-violet-50 text-violet-700' : 'text-gray-600 hover:bg-gray-50'
            }`}
            id={`tab-${tab.id}`}
            key={tab.id}
            onClick={() => handleClick(tab)}
            role="tab"
            type="button"
          >
            <span aria-hidden>{tab.icon}</span>
            <span>{tab.label}</span>
            {count != null && count > 0 && (
              <span
                className={`rounded-full px-1.5 text-[9px] font-bold ${
                  isActive ? 'bg-violet-600 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                {count > 99 ? '99+' : count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Lee el tab activo desde la URL. Default 'inbox'. */
export function useActiveBandejaTab(): BandejaTab {
  const sp = useSearchParams();
  const t = sp?.get('tab');
  if (t === 'conv' || t === 'history') return t;
  return 'inbox';
}
