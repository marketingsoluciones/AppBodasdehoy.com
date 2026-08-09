'use client';

/**
 * BandejaTabs — wrapper de tabs principales de /bandeja.
 * Diseño handoff v2 (24-jun) planteó "3 pestañas", pero la pestaña
 * "Conversaciones" solo REDIRIGÍA a /asistente (el chat), que YA está en el
 * sidebar (icono 💬). Esa duplicidad confundía — una "tab" que en realidad
 * teletransporta fuera de la bandeja (QA H-4, 8-ago). Retirada: quedan 2
 * pestañas de contenido real dentro de la bandeja.
 *
 *   1. BANDEJA    (lista de conversaciones)
 *   2. HISTORIAL  (feed de notificaciones del sistema)
 *
 * Sincronizado con URL via `?tab=inbox|history`. Default `inbox`.
 * El acceso al chat sigue disponible desde el sidebar (💬 → /asistente).
 */
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

export type BandejaTab = 'inbox' | 'history';

interface BandejaTabsProps {
  active: BandejaTab;
  /** Counter por tab opcional (badge). */
  counts?: Partial<Record<BandejaTab, number>>;
}

const TAB_META: Array<{ icon: string; id: BandejaTab; label: string }> = [
  { icon: '📥', id: 'inbox', label: 'Bandeja' },
  { icon: '🕒', id: 'history', label: 'Historial' },
];

export function BandejaTabs({ active, counts }: BandejaTabsProps) {
  const router = useRouter();
  const sp = useSearchParams();

  const handleClick = useCallback(
    (tab: (typeof TAB_META)[number]) => {
      const params = new URLSearchParams(sp?.toString() ?? '');
      params.set('tab', tab.id);
      // Conservar otros params (scope, filtros, etc.)
      router.replace(`/bandeja?${params.toString()}`);
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

/** Lee el tab activo desde la URL. Default 'inbox'. Cualquier valor legacy
 *  (p.ej. `?tab=conv` de la pestaña "Conversaciones" retirada) cae a 'inbox'. */
export function useActiveBandejaTab(): BandejaTab {
  const sp = useSearchParams();
  const t = sp?.get('tab');
  if (t === 'history') return 'history';
  return 'inbox';
}
