import type { ReactNode } from 'react';
import Script from 'next/script';
import { getDevelopmentConfig } from '@bodasdehoy/shared';

// Los IDs de GTM y Meta Pixel vienen del config del white-label, no de env vars.
// NEXT_PUBLIC_DEVELOPMENT se configura por despliegue en Vercel (ej: bodasdehoy, champagne-events).
const DEVELOPMENT = process.env.NEXT_PUBLIC_DEVELOPMENT || 'bodasdehoy';
const devConfig = getDevelopmentConfig(DEVELOPMENT);
const GTM_ID = devConfig?.gtm_id;
const META_PIXEL_ID = devConfig?.metaPixel_id;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {/* GTM noscript (debe ir justo después de <body>) */}
        {GTM_ID && (
          <noscript>
            <iframe
              height="0"
              src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
              style={{ display: 'none', visibility: 'hidden' }}
              width="0"
            />
          </noscript>
        )}

        {children}

        {/* Google Tag Manager */}
        {GTM_ID && (
          <Script id="gtm" strategy="afterInteractive">{`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
            var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
            j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
            f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');
          `}</Script>
        )}

        {/* Meta Pixel */}
        {META_PIXEL_ID && (
          <Script id="meta-pixel" strategy="afterInteractive">{`
            !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
            n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
            document,'script','https://connect.facebook.net/en_US/fbevents.js');
            fbq('init','${META_PIXEL_ID}');fbq('track','PageView');
          `}</Script>
        )}
      </body>
    </html>
  );
}
