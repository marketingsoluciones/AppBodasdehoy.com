import '../styles/globals.css'
import '../utils/react-polyfill' // Polyfill para findDOMNode en React 19
import '../utils/next-navigation-polyfill' // Polyfill para next/navigation en Pages Router
import DefaultLayout from '../layouts/DefaultLayout'
import 'swiper/css';
import "swiper/css/bundle"
import "@fontsource/italiana";
import "@fontsource/montserrat";
import "@fontsource/poppins";
import { AuthContextProvider, EventContextProvider } from '../context';
import { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from "../utils/i18n"
import { useAllowedRouter } from '../hooks/useAllowed';
import { BlockRedirection } from '../components/Utils/BlockRedirection';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import { dataMetaData } from "../utils/SeoRecurses"
import { varGlobalDevelopment } from "../context/AuthContext"
import { fetchApiBodas, queries } from '../utils/Fetching';
import { developments } from '../firebase';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import useDevLogger from '../hooks/useDevLogger';
import DevWhitelabelSwitcher from '../components/Dev/DevWhitelabelSwitcher';
import { verifyDomain, logUrlVerification, type UrlCheckResult } from '../utils/verifyUrls';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { CopilotPrewarmer } from '../components/Copilot/CopilotPrewarmer';
import { captureTrackingParams } from '@bodasdehoy/shared';
import App from 'next/app';

const MyApp = ({ Component, pageProps, openGraphData }) => {
  const [valirBlock, setValirBlock] = useState<boolean>()
  const [message, setMessage] = useState<string>()

  useEffect(() => {
    if (valirBlock !== undefined) {
      // Query getDevelopment puede no existir en algunos backends/proxies.
      // Evitar ruido 400 en runtime y mantener la app funcional.
      setMessage(undefined)
    }
  }, [valirBlock])

  // Capturar UTMs y ?ref= al aterrizar (tracking / referidos)
  useEffect(() => {
    captureTrackingParams();
  }, []);

  // Verificar dominio y URLs al cargar (solo en cliente y producción)
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      const domainInfo = verifyDomain();
      console.log('[App] Información del dominio:', domainInfo);

      // En dominios de test, solo verificar URLs locales (evitar CORS)
      const isTestDomain = window.location.hostname.includes('-test.') ||
                           window.location.hostname === 'localhost' ||
                           window.location.hostname === '127.0.0.1';

      if (isTestDomain) {
        // En test solo verificar el origen; no HEAD a graphql (solo acepta POST → 405)
        const localUrls = [
          window.location.origin,
          `${window.location.origin}/api/health`,
        ].filter(Boolean);
        Promise.all(
          localUrls.map(async (url): Promise<UrlCheckResult> => {
            try {
              const response = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(3000) });
              console.log(`[App] ✅ ${url} - Status: ${response.status}`);
              return { url, status: 'ok' as const, statusCode: response.status };
            } catch (error: any) {
              console.warn(`[App] ⚠️ ${url} - Error:`, error.message);
              return { url, status: 'error' as const, error: error.message };
            }
          })
        ).then(results => {
          logUrlVerification(results);
        });
      }
    }
  }, [])

  // Rutas públicas del portal del invitado — sin auth, sin nav, sin layout autenticado
  const router = useRouter()
  const isPublicPortal = router.pathname.startsWith('/e/') || router.pathname.startsWith('/buscador-mesa/')

  if (isPublicPortal) {
    return (
      <ErrorBoundary>
        <I18nextProvider i18n={i18n}>
          <Component {...pageProps} />
        </I18nextProvider>
        {process.env.NODE_ENV === 'development' && <DevWhitelabelSwitcher />}
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary>
      <NextSeo
        {...openGraphData}
      />
      <I18nextProvider i18n={i18n}>
        <DefaultLayout>
          {/* En desarrollo evita prewarm para no penalizar el primer compile */}
          {process.env.NODE_ENV === "production" && <CopilotPrewarmer />}
          {!!message && <div className='bg-yellow-400 absolute top-[7.5rem] left-0 w-full bg-red-500 z-50 flex items-center justify-center'>
            <span className='text-center px-10 py-0.5'>{message}</span>
          </div>}
          <Load setValirBlock={setValirBlock} />
          {valirBlock
            ? <BlockRedirection />
            : <Component {...pageProps} />
          }
        </DefaultLayout>
      </I18nextProvider>
      {process.env.NODE_ENV === 'development' && <DevWhitelabelSwitcher />}
    </ErrorBoundary>
  )
}

export let openGraphData = {} as any
/**
 * Importante: si solo se llama a `Component.getInitialProps`, las páginas que usan
 * `getServerSideProps` / `getStaticProps` llegan al cliente con `pageProps` vacío
 * (el itinerario público “desaparece” tras la hidratación y muestra el falso 404).
 * Hay que delegar en `App.getInitialProps` de next/app para fusionar esas props.
 */
MyApp.getInitialProps = async (appContext) => {
  const appProps = await App.getInitialProps(appContext)
  const { ctx } = appContext
  const { req, pathname } = ctx

  const hostWithPort = req ? req.headers.host : typeof window !== 'undefined' ? window.location.hostname : ''
  const host = hostWithPort?.split(':')[0]

  const arr = host?.split('.')
  const f1 = arr?.findIndex((elem) => ['com', 'mx'].includes(elem))
  const nameDomain = f1 > 0 ? arr[f1 - 1] : undefined
  const development = developments.find((elem) => elem.name === nameDomain)
  const path = '/' + pathname.split('/')[1]
  openGraphData = dataMetaData.find((elem) => elem.ruta === path)?.metaData(development) ?? {}

  return { ...appProps, openGraphData }
};

export default MyApp

// ─── Web Vitals — reportadas por Next.js automáticamente ─────────────────────
// Se invocan una vez por métrica por carga de página.
// En producción podrías enviarlas a tu endpoint de analytics.
export function reportWebVitals(metric: {
  id: string;
  name: string;
  label: 'web-vital' | 'custom';
  value: number;
  startTime: number;
}) {
  if (process.env.NODE_ENV === 'development') {
    const rounded = Math.round(metric.value * 100) / 100;
    const status =
      metric.name === 'LCP' ? (metric.value < 2500 ? '✅' : metric.value < 4000 ? '⚠️' : '❌')
      : metric.name === 'FID' || metric.name === 'INP' ? (metric.value < 100 ? '✅' : metric.value < 300 ? '⚠️' : '❌')
      : metric.name === 'CLS' ? (metric.value < 0.1 ? '✅' : metric.value < 0.25 ? '⚠️' : '❌')
      : metric.name === 'TTFB' ? (metric.value < 800 ? '✅' : metric.value < 1800 ? '⚠️' : '❌')
      : metric.name === 'FCP' ? (metric.value < 1800 ? '✅' : metric.value < 3000 ? '⚠️' : '❌')
      : '📊';
    console.log(`[WebVitals] ${status} ${metric.name}: ${rounded}${metric.name === 'CLS' ? '' : 'ms'} (id: ${metric.id})`);
  }

  // En producción: enviar a tu endpoint de analytics (descomenta cuando tengas el endpoint)
  // if (process.env.NODE_ENV === 'production') {
  //   navigator.sendBeacon?.('/api/vitals', JSON.stringify({
  //     name: metric.name, value: metric.value, id: metric.id, page: window.location.pathname,
  //   }));
  // }
}

const PixelTracker = dynamic(() => import("../components/PixelTracker") as any, {
  ssr: false,
});

const safeThemeValue = (v: unknown) =>
  (typeof v === 'string' && !/[\r\n`\\]/.test(v) ? v : '')

const Load = ({ setValirBlock }) => {
  const { config } = AuthContextProvider()
  const [isAllowedRouter] = useAllowedRouter()
  const { event } = EventContextProvider()
  const { user } = AuthContextProvider()
  const router = useRouter()
  const pathname = router.pathname

  const themePrimary = safeThemeValue(config?.theme?.primaryColor) || '#ec4899'
  const themeSecondary = safeThemeValue(config?.theme?.secondaryColor) || '#f472b6'
  const themeTertiary = safeThemeValue(config?.theme?.tertiaryColor) || '#f9a8d4'
  const themeBase = safeThemeValue(config?.theme?.baseColor) || '#ffffff'
  const themeScroll = safeThemeValue(config?.theme?.colorScroll) || '#e5e7eb'

  // Enable browser logging in development for Claude Code integration
  useDevLogger(process.env.NODE_ENV === 'development')

  useEffect(() => {
    // No bloquear mientras los datos se están cargando o si no hay evento seleccionado
    // Esto evita el "flash" de BlockRedirection durante la navegación
    if (!event || !user) {
      setValirBlock(false)
      return
    }
    setValirBlock(!isAllowedRouter())
  }, [event, user, pathname, isAllowedRouter, setValirBlock])

  return (
    <>
      <Head>
        <link id="favicon" rel="icon" href={config?.favicon} />
        <title>{config?.headTitle}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="description" content="¡Bodas de Hoy Organizador! Organiza tu boda en un solo click., user-scalable=no, width=device-width, initial-scale=1" />
      </Head>
      <PixelTracker />
      <style jsx global>
        {`@import url('https://fonts.googleapis.com/css2?family=Noto+Color+Emoji&display=swap');
      :root {
        --color-primary: ${themePrimary};
        --color-secondary: ${themeSecondary};
        --color-tertiary: ${themeTertiary};
        --color-base: ${themeBase};
        --color-scroll: ${themeScroll};
      }
      body { overscroll-behavior: contain; }
      ::-webkit-scrollbar { width: 8px; }
      ::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 6px; }
      ::-webkit-scrollbar-thumb { background: ${themeScroll}; border-radius: 6px; height: 50%; }
      .my-emoji { white-space: pre-wrap; font-family: Montserrat, 'Noto Color Emoji'; }`}
      </style>
    </>
  )
}