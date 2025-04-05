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
import { NextSeo } from 'next-seo';
import { dataMetaData } from "../utils/SeoRecurses"

const MyApp = ({ Component, pageProps }) => {
  const [valirBlock, setValirBlock] = useState<boolean>()
  const [dataConfig, setDataConfig] = useState<any>()

  useEffect(() => {
    console.log(100021, dataConfig)
  }, [dataConfig])


  return (
    <>
      <NextSeo
        {...dataConfig}
      />
      <I18nextProvider i18n={i18n}>
        <DefaultLayout>
          <Load setValirBlock={setValirBlock} setDataConfig={setDataConfig} />
          {valirBlock
            ? <BlockRedirection />
            : <Component {...pageProps} />
          }
        </DefaultLayout>
      </I18nextProvider>
    </>
  )
}

export default MyApp



import dynamic from 'next/dynamic';
import Head from 'next/head';
const PixelTracker = dynamic(() => import("../components/PixelTracker") as any, {
  ssr: false,
});

const Load = ({ setValirBlock, setDataConfig }) => {
  const { config } = AuthContextProvider()
  const [isAllowedRouter] = useAllowedRouter()
  const { event } = EventContextProvider()
  const { user } = AuthContextProvider()
  const router = useRouter()

  useEffect(() => {
    const currentMetaData = dataMetaData.find(meta => meta.ruta === router.pathname)?.metaData(config)
    setDataConfig({ ...currentMetaData })
  }, [])

  useEffect(() => {
    setValirBlock(!isAllowedRouter())
  }, [event, user, router])

  return (
    <>
      <Head>
        <link id="favicon" rel="icon" href={config?.favicon} />
        <title>{config?.headTitle}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="description" content="¡Bodas de Hoy Organizador! Organiza tu boda en un sólo click., user-scalable=no, width=device-width, initial-scale=1" />
      </Head>
      <PixelTracker />
      <style jsx global>
        {`
      @import url('https://fonts.googleapis.com/css2?family=Noto+Color+Emoji&display=swap');
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
      .my-emoji {
        white-space: pre-wrap;
        font-family: Montserrat, 'Noto Color Emoji';
        }
      `}
      </style>
    </>
  )
}