import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import Script from 'next/script';
import { appWithTranslation } from 'next-i18next';
import posthog from 'posthog-js';
import { captureTrackingParams, registerReferralIfPending, sendAttributionToApi, getDevelopmentConfig, authBridge, getAttributionData } from '@bodasdehoy/shared';
import '../styles/globals.css';

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;

const API2_URL = process.env.NEXT_PUBLIC_API2_URL || 'https://api2.eventosorganizador.com/graphql';
const DEVELOPMENT = process.env.NEXT_PUBLIC_DEVELOPMENT || 'bodasdehoy';

// Los IDs de GTM y Meta Pixel vienen del config del white-label, no de env vars
const devConfig = getDevelopmentConfig(DEVELOPMENT);
const GTM_ID = devConfig?.gtm_id;
const META_PIXEL_ID = devConfig?.metaPixel_id;

function App({ Component, pageProps }: AppProps) {
  // 1. Capturar UTMs y ?ref= al aterrizar
  useEffect(() => {
    captureTrackingParams();
  }, []);

  // 2. PostHog init + identify
  useEffect(() => {
    if (!POSTHOG_KEY) return;
    posthog.init(POSTHOG_KEY, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
      capture_pageview: true,
    });
    const authState = authBridge.getSharedAuthState();
    if (authState.isAuthenticated && authState.user?.uid) {
      const attribution = getAttributionData();
      posthog.identify(authState.user.uid, {
        development: DEVELOPMENT,
        email: authState.user.email ?? undefined,
        utm_source: attribution?.utm_source,
        utm_medium: attribution?.utm_medium,
        utm_campaign: attribution?.utm_campaign,
      });
    }
  }, []);

  // 3. Registrar referido y atribución cuando el usuario está autenticado
  useEffect(() => {
    const authState = authBridge.getSharedAuthState();
    if (authState.isAuthenticated && authState.idToken) {
      registerReferralIfPending(authState.idToken, DEVELOPMENT, API2_URL).catch(() => undefined);
      sendAttributionToApi(authState.idToken, DEVELOPMENT, API2_URL).catch(() => undefined);
    }
  }, []);

  return (
    <>
      {/* Google Tag Manager */}
      {GTM_ID && (
        <>
          <Script id="gtm" strategy="afterInteractive">{`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
            var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
            j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
            f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');
          `}</Script>
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        </>
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

      <Component {...pageProps} />
    </>
  );
}

export default appWithTranslation(App);
