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
import { verifyDomain, logUrlVerification, type UrlCheckResult } from '../utils/verifyUrls';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { CopilotPrewarmer } from '../components/Copilot/CopilotPrewarmer';

const MyApp = ({ Component, pageProps, openGraphData }) => {
  const [valirBlock, setValirBlock] = useState<boolean>()
  const [message, setMessage] = useState<string>()

  useEffect(() => {
    if (valirBlock !== undefined) {
      fetchApiBodas({
        query: queries.getDevelopment,
        variables: {},
        development: varGlobalDevelopment
      }).then(res => {
        setMessage(res?.message?.message)
      })
    }
  }, [valirBlock])

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
        // En test solo verificar el origen local y el proxy
        const localUrls = [
          window.location.origin,
          `${window.location.origin}/api/proxy-bodas/graphql`,
        ];
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

  return (
    <ErrorBoundary>
      <NextSeo
        {...openGraphData}
      />
      <I18nextProvider i18n={i18n}>
        <DefaultLayout>
          {/* Pre-calentar el chat de LobeChat en segundo plano */}
          <CopilotPrewarmer />
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
    </ErrorBoundary>
  )
}

export let openGraphData = {} as any
// Esta función se ejecuta en el servidor en cada petición
MyApp.getInitialProps = async ({ Component, ctx }) => {
  const { req, pathname } = ctx;
  let pageProps = {};

  // Remover puerto del host si existe (ej: app-test.bodasdehoy.com:8080 → app-test.bodasdehoy.com)
  const hostWithPort = req ? req.headers.host : window.location.hostname;
  const host = hostWithPort?.split(':')[0];

  const arr = host?.split(".")
  const f1 = arr?.findIndex(elem => ["com", "mx"].includes(elem))
  const nameDomain = arr[f1 - 1]
  const development = developments.find(elem => elem.name === nameDomain)
  const path = "/" + pathname.split("/")[1]
  openGraphData = dataMetaData.find(elem => elem.ruta === path)?.metaData(development) ?? {}

  if (Component.getInitialProps) {
    pageProps = await Component.getInitialProps(ctx);
  }
  return { pageProps, openGraphData };
};

export default MyApp

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