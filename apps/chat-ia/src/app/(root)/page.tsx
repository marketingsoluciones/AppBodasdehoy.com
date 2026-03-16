import { redirect } from 'next/navigation';

/**
 * Página raíz "/": redirige a la variante por defecto.
 * Evita 404 en chat-test cuando el middleware no reescribe (producción/túnel).
 */
const DEFAULT_VARIANT_PATH = 'en-US__0__light';

export default function RootPage() {
  redirect(`/${DEFAULT_VARIANT_PATH}`);
}
