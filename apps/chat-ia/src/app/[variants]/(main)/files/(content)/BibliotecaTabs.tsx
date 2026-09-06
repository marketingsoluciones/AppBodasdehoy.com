'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { memo } from 'react';

/**
 * BibliotecaTabs — cabecera de la sección "Biblioteca" (Fase C rediseño, 15-ago).
 *
 * /files (Archivos) y /knowledge (Conocimiento) son dos caras del mismo material:
 * ambos usan el mismo componente FileManager; Conocimiento añade las bases RAG.
 * Antes eran dos entradas sueltas del rail (Conocimiento acabó OCULTO en Fase A),
 * lo que dejaba las bases de conocimiento inalcanzables desde la navegación.
 *
 * Aquí se unifican bajo una sola superficie "Biblioteca" con pestañas, SIN fusionar
 * los módulos: /knowledge es una SPA con MemoryRouter (react-router) y sus componentes
 * crashean fuera de ese contexto (ver nota en files/page.tsx). Por eso solo se enlazan
 * como pestañas — cada ruta mantiene su router. Se usan primitivas de Next (Link,
 * usePathname), nunca hooks de react-router, para no romper nada.
 *
 * El rail sigue con UN solo icono "Biblioteca" → /files (sin clutter). Desde aquí se
 * llega a Conocimiento. La ruta /knowledge sigue gateada por enableKnowledgeBase.
 */
const TABS: Array<{ href: string; key: string; label: string }> = [
  { href: '/files', key: 'archivos', label: '📄 Archivos' },
  { href: '/knowledge', key: 'conocimiento', label: '📚 Conocimiento' },
];

const BibliotecaTabs = memo(() => {
  const pathname = usePathname();
  const activeKey = pathname?.includes('/knowledge') ? 'conocimiento' : 'archivos';

  return (
    <div
      style={{
        alignItems: 'center',
        background: '#FFFFFF',
        borderBottom: '1px solid #EDEDF0',
        display: 'flex',
        flexShrink: 0,
        gap: 4,
        paddingInline: 12,
      }}
    >
      {TABS.map((tab) => {
        const active = tab.key === activeKey;
        return (
          <Link
            href={tab.href}
            key={tab.key}
            style={{
              // Color inline: el repo no usa variantes dark:, evita texto invisible.
              borderBottom: active ? '2px solid #F7628C' : '2px solid transparent',
              color: active ? '#111827' : '#6B7280',
              fontSize: 13,
              fontWeight: active ? 600 : 500,
              padding: '10px 8px',
              textDecoration: 'none',
            }}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
});

BibliotecaTabs.displayName = 'BibliotecaTabs';

export default BibliotecaTabs;
