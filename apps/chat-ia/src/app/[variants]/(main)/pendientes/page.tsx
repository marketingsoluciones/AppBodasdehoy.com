'use client';

/**
 * /pendientes — REDIRECT a la Bandeja unificada (Fase B rediseño, 14-ago).
 *
 * Antes esta ruta era una SEGUNDA bandeja con su propio store (useBandejaStore),
 * que mostraba lo no leído de conversaciones + notificaciones agrupado por
 * dominio. Coexistía con /bandeja (useUnifiedFeed) cubriendo lo mismo por otro
 * camino → los usuarios lo percibían como "bandejas de mensajes duplicadas"
 * (informe rediseño mensajería 13-ago).
 *
 * Se fusionó dentro de /bandeja como la vista "Esperan respuesta" (?view=esperan),
 * que filtra lo NO leído de AMBOS tipos sobre la MISMA fuente (useUnifiedFeed) —
 * sin perder las notificaciones (Regla 0). Esta ruta ahora redirige allí para
 * conservar enlaces/marcadores existentes. Reversible: el historial git guarda
 * la página original con el agrupado por secciones.
 */
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function PendientesRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/bandeja?view=esperan');
  }, [router]);

  return (
    <div className="flex h-full items-center justify-center bg-white">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-pink-500" />
    </div>
  );
}
