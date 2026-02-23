'use client';

import { redirect } from 'next/navigation';

/**
 * /settings/billing/packages — redirige al historial de paquetes.
 * La ruta raíz existe para evitar 404; el contenido está en /packages/history.
 */
export default function PackagesPage() {
  redirect('/settings/billing/packages/history');
}
