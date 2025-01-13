import '../styles/globals.css'
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
import { DefaultSeo } from 'next-seo';

const defaultSEOConfig = {
  titleTemplate: '%s | Mi Sitio Web',
  defaultTitle: 'Mi Sitio Web',
  description: 'La descripción de mi sitio web',
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: 'https://tu-sitio-web.com',
    site_name: 'Mi Sitio Web'
  },
  twitter: {
    handle: '@tu_cuenta_twitter',
    site: '@tu_cuenta_twitter'
  }
};
const MyApp = ({ Component, pageProps }) => {
  const [valirBlock, setValirBlock] = useState<boolean>()

  return (
    <>
      <I18nextProvider i18n={i18n}>
        <DefaultLayout>
          <DefaultSeo {...defaultSEOConfig} />
          <Load setValirBlock={setValirBlock} />
          {valirBlock
            ? <BlockRedirection />
            : <Component {...pageProps} />
          }
        </DefaultLayout>
      </I18nextProvider>
      <style jsx global>
        {`
        
        
      `}
      </style>
    </>
  )
}

export default MyApp

const Load = ({ setValirBlock }) => {
  const { config } = AuthContextProvider()
  const [isAllowedRouter] = useAllowedRouter()
  const { event } = EventContextProvider()
  const { user } = AuthContextProvider()
  const router = useRouter()

  useEffect(() => {
    setValirBlock(!isAllowedRouter())
  }, [event, user, router])

  return (<>
    <style jsx global>
      {`
      :root {
        --color-primary: ${config?.theme?.primaryColor};
        --color-secondary: ${config?.theme?.secondaryColor};
        --color-tertiary: ${config?.theme?.tertiaryColor};
        --color-base: ${config?.theme?.baseColor};
        --color-scroll: ${config?.theme?.colorScroll}
      }
      body {
          overscroll-behavior: contain;
      }
      ::-webkit-scrollbar {
        width: 8px;
      }
      ::-webkit-scrollbar-track {
        background: #f1f1f1
        border-radius: 6px;
      }

      ::-webkit-scrollbar-thumb {
        background:  ${config?.theme?.colorScroll};
        border-radius: 6px;
        height: 50%;
      }
      `}
    </style>
  </>)
}