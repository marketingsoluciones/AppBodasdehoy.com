import Link from 'next/link';
import { ReactNode } from 'react';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
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

