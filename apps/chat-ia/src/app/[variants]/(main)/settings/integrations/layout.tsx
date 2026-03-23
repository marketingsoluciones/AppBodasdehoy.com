import Link from 'next/link';
import type { ReactNode } from 'react';

/**
 * Misma jerarquía visual que el resto de Ajustes: submenú lateral + contenido.
 */
export default function IntegracionesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[65vh] w-full">
      <aside
        aria-label="Enlace rápido a ajustes y mensajes"
        className="hidden w-[220px] shrink-0 border-r border-gray-200 bg-gray-50/90 p-3 md:block"
      >
        <nav className="flex flex-col gap-1 text-sm">
          <Link
            className="rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-200/80"
            href="/settings"
          >
            Ajustes generales
          </Link>
          <span className="rounded-lg bg-white px-3 py-2 font-medium text-pink-600 shadow-sm ring-1 ring-gray-100">
            Integraciones
          </span>
          <Link
            className="rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-200/80"
            href="/messages"
          >
            Mensajes
          </Link>
        </nav>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
