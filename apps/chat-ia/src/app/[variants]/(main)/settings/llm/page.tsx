import { redirect } from 'next/navigation';

/**
 * BUG-NEW-01 QA #20 (27-jun): /settings/llm devolvía 404 porque la carpeta
 * tenía index.tsx pero NO page.tsx (Next.js App Router requiere page.tsx
 * para que la ruta sea accesible). La funcionalidad fue MOVIDA a
 * /settings?active=agent&tab=modal en refactor previo.
 *
 * Redirect 308 permanent para que clients (bookmarks, links externos) se
 * actualicen automáticamente.
 */
export default function SettingsLlmPage() {
  redirect('/settings?active=agent&tab=modal');
}
