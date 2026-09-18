'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';

/**
 * Meta Pixel, pero NO dentro del panel de gestión.
 *
 * Auditoría del owner (18-09): cada clic dentro de la bandeja disparaba un POST a
 * facebook.com/tr con la URL de la conversación y el texto del botón pulsado. El Pixel existe
 * para medir campañas en páginas públicas; un panel donde se gestionan conversaciones de
 * clientes no es eso, y mandar fuera la URL de una conversación es un problema de privacidad,
 * no de ruido en las métricas.
 *
 * Se decide en cliente y no en el servidor a propósito: el layout raíz no recibe la ruta de
 * forma fiable —el middleware no la publica en ninguna cabecera— y adivinarla habría
 * desactivado la medición también en las páginas públicas. Aquí la ruta se sabe con certeza.
 */
const PANEL_INTERNO = ['/bandeja', '/settings', '/admin', '/me', '/files', '/memories', '/asistente'];

export function MetaPixel({ id }: { id: string }) {
  const pathname = usePathname();
  const esPanelInterno = PANEL_INTERNO.some((p) => pathname === p || pathname?.startsWith(`${p}/`));

  if (!id || esPanelInterno) return null;

  return (
    <Script id="meta-pixel" strategy="afterInteractive">{`
      !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
      n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
      document,'script','https://connect.facebook.net/en_US/fbevents.js');
      fbq('init','${id}');fbq('track','PageView');
    `}</Script>
  );
}
