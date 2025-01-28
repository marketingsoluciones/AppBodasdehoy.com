declare global {
  interface Window {
    fbq: any;
  }
}

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

const MyApp = ({ Component, pageProps }) => {
  const [valirBlock, setValirBlock] = useState<boolean>()
  const [dataConfig, setDataConfig] = useState<any>()
  const router = useRouter()
  const dataMetaData = [
    {
      ruta: "/resumen-evento",
      metaData: {
        title: `Todos los detalles de tus eventos en un solo lugar | ${dataConfig?.development != undefined ? dataConfig?.development : 'tu app planificador'}`,
        description: "Encuentra toda la información sobre tu evento en nuestro organizador de eventos.",
        canonical: `${dataConfig?.pathDomain}/resumen-evento`,
        openGraph: {
          url: `${dataConfig?.pathDomain}/resumen-evento`,
          siteName: `${dataConfig?.name}`,
          title: `Resumen del evento | ${dataConfig?.name}`,
          description: 'Descubre todos los detalles de este evento especial.',
          images: [
            {
              url: `${dataConfig?.logoDirectory.props.src != undefined ? dataConfig?.logoDirectory.props.src : '/Pantalla.png'}`,
              alt: 'Imagen del evento',
              type: 'image/png',
              width: 1200,
              height: 1200,
            },
            {
              url: `${dataConfig?.logoDirectory.props.src != undefined ? dataConfig?.logoDirectory.props.src : '/Pantalla.png'}`,
              alt: 'Imagen del evento',
              type: 'image/png',
              width: 1200,
              height: 620,
            },
            {
              url: `${dataConfig?.logoDirectory.props.src != undefined ? dataConfig?.logoDirectory.props.src : '/Pantalla.png'}`,
              alt: 'Imagen del evento',
              type: 'image/png',
              width: 1200,
              height: 620,
            },
          ],
        }
      }
    },
    {
      ruta: "/invitados",
      metaData: {
        title: `Lista de invitados | ${dataConfig?.development != undefined ? dataConfig?.development : 'tu app planificador'}`,
        description: "Encuentra toda la información sobre tus invitados en nuestro organizador de eventos.",
        canonical: `${dataConfig?.pathDomain}/invitados`,
        openGraph: {
          url: `${dataConfig?.pathDomain}/invitados`,
          siteName: `${dataConfig?.name}`,
          title: `Lista de invitados | ${dataConfig?.name}`,
          description: 'Encuentra toda la información sobre tus invitados en nuestro organizador de eventos...',
          images: [
            {
              url: `${dataConfig?.logoDirectory.props.src != undefined ? dataConfig?.logoDirectory.props.src : '/Pantalla.png'}`,
              alt: 'Imagen del evento',
              type: 'image/png',
              width: 1200,
              height: 1200,
            },
            {
              url: `${dataConfig?.logoDirectory.props.src != undefined ? dataConfig?.logoDirectory.props.src : '/Pantalla.png'}`,
              alt: 'Imagen del evento',
              type: 'image/png',
              width: 1200,
              height: 620,
            },
            {
              url: `${dataConfig?.logoDirectory.props.src != undefined ? dataConfig?.logoDirectory.props.src : '/Pantalla.png'}`,
              alt: 'Imagen del evento',
              type: 'image/png',
              width: 1200,
              height: 620,
            },
          ],
        }
      }
    },
    {
      ruta: "/mesas",
      metaData: {
        title: `Mesas | ${dataConfig?.development != undefined ? dataConfig?.development : 'tu app planificador'}`,
        description: "Organiza las mesas de tu evento con nuestro organizador de eventos.",
        canonical: `${dataConfig?.pathDomain}/mesas`,
        openGraph: {
          url: `${dataConfig?.pathDomain}/mesas`,
          siteName: `${dataConfig?.name}`,
          title: `Mesas | ${dataConfig?.name}`,
          description: 'Organiza las mesas de tu evento con nuestro organizador de eventos.',
          images: [
            {
              url: `${dataConfig?.logoDirectory.props.src != undefined ? dataConfig?.logoDirectory.props.src : '/Pantalla.png'}`,
              alt: 'Imagen del evento',
              type: 'image/png',
              width: 1200,
              height: 1200,
            },
            {
              url: `${dataConfig?.logoDirectory.props.src != undefined ? dataConfig?.logoDirectory.props.src : '/Pantalla.png'}`,
              alt: 'Imagen del evento',
              type: 'image/png',
              width: 1200,
              height: 620,
            },
            {
              url: `${dataConfig?.logoDirectory.props.src != undefined ? dataConfig?.logoDirectory.props.src : '/Pantalla.png'}`,
              alt: 'Imagen del evento',
              type: 'image/png',
              width: 1200,
              height: 620,
            },
          ],
        }
      }
    },
    {
      ruta: "/lista-regalos",
      metaData: {
        title: `Lista de regalos | ${dataConfig?.development != undefined ? dataConfig?.development : 'tu app planificador'}`,
        description: "Crea tu lista de regalos en nuestro organizador de eventos.",
        canonical: `${dataConfig?.pathDomain}/lista-regalos`,
        openGraph: {
          url: `${dataConfig?.pathDomain}/lista-regalos`,
          siteName: `${dataConfig?.name}`,
          title: `Lista de regalos | ${dataConfig?.name}`,
          description: 'Crea tu lista de regalos en nuestro organizador de eventos.',
          images: [
            {
              url: `${dataConfig?.logoDirectory.props.src != undefined ? dataConfig?.logoDirectory.props.src : '/Pantalla.png'}`,
              alt: 'Imagen del evento',
              type: 'image/png',
              width: 1200,
              height: 1200,
            },
            {
              url: `${dataConfig?.logoDirectory.props.src != undefined ? dataConfig?.logoDirectory.props.src : '/Pantalla.png'}`,
              alt: 'Imagen del evento',
              type: 'image/png',
              width: 1200,
              height: 620,
            },
            {
              url: `${dataConfig?.logoDirectory.props.src != undefined ? dataConfig?.logoDirectory.props.src : '/Pantalla.png'}`,
              alt: 'Imagen del evento',
              type: 'image/png',
              width: 1200,
              height: 620,
            },
          ],
        }
      }
    },
    {
      ruta: "/presupuesto",
      metaData: {
        title: `Presupuesto | ${dataConfig?.development != undefined ? dataConfig?.development : 'tu app planificador'}`,
        description: "Organiza tu presupuesto en nuestro organizador de eventos.",
        canonical: `${dataConfig?.pathDomain}/presupuesto`,
        openGraph: {
          url: `${dataConfig?.pathDomain}/presupuesto`,
          siteName: `${dataConfig?.name}`,
          title: `Presupuesto | ${dataConfig?.name}`,
          description: 'Organiza tu presupuesto en nuestro organizador de eventos.',
          images: [
            {
              url: `${dataConfig?.logoDirectory.props.src != undefined ? dataConfig?.logoDirectory.props.src : '/Pantalla.png'}`,
              alt: 'Imagen del evento',
              type: 'image/png',
              width: 1200,
              height: 1200,
            },
            {
              url: `${dataConfig?.logoDirectory.props.src != undefined ? dataConfig?.logoDirectory.props.src : '/Pantalla.png'}`,
              alt: 'Imagen del evento',
              type: 'image/png',
              width: 1200,
              height: 620,
            },
            {
              url: `${dataConfig?.logoDirectory.props.src != undefined ? dataConfig?.logoDirectory.props.src : '/Pantalla.png'}`,
              alt: 'Imagen del evento',
              type: 'image/png',
              width: 1200,
              height: 620,
            },
          ],
        }
      }
    },
    {
      ruta: "/invitaciones",
      metaData: {
        title: `Invitaciones | ${dataConfig?.development != undefined ? dataConfig?.development : 'tu app planificador'}`,
        description: "Crea tus invitaciones en nuestro organizador de eventos.",
        canonical: `${dataConfig?.pathDomain}/invitaciones`,
        openGraph: {
          url: `${dataConfig?.pathDomain}/invitaciones`,
          siteName: `${dataConfig?.name}`,
          title: `Invitaciones | ${dataConfig?.name}`,
          description: 'Crea tus invitaciones en nuestro organizador de eventos.',
          images: [
            {
              url: `${dataConfig?.logoDirectory.props.src != undefined ? dataConfig?.logoDirectory.props.src : '/Pantalla.png'}`,
              alt: 'Imagen del evento',
              type: 'image/png',
              width: 1200,
              height: 1200,
            },
            {
              url: `${dataConfig?.logoDirectory.props.src != undefined ? dataConfig?.logoDirectory.props.src : '/Pantalla.png'}`,
              alt: 'Imagen del evento',
              type: 'image/png',
              width: 1200,
              height: 620,
            },
            {
              url: `${dataConfig?.logoDirectory.props.src != undefined ? dataConfig?.logoDirectory.props.src : '/Pantalla.png'}`,
              alt: 'Imagen del evento',
              type: 'image/png',
              width: 1200,
              height: 620,
            },
          ],
        }
      }
    },
    {
      ruta: "/itinerario",
      metaData: {
        title: `Itinerario | ${dataConfig?.development != undefined ? dataConfig?.development : 'tu app planificador'}`,
        description: "Crea tu itinerario en nuestro organizador de eventos.",
        canonical: `${dataConfig?.pathDomain}/itinerario`,
        openGraph: {
          url: `${dataConfig?.pathDomain}/itinerario`,
          siteName: `${dataConfig?.name}`,
          title: `Itinerario | ${dataConfig?.name}`,
          description: 'Crea tu itinerario en nuestro organizador de eventos.',
          images: [
            {
              url: `${dataConfig?.logoDirectory.props.src != undefined ? dataConfig?.logoDirectory.props.src : '/Pantalla.png'}`,
              alt: 'Imagen del evento',
              type: 'image/png',
              width: 1200,
              height: 1200,
            },
            {
              url: `${dataConfig?.logoDirectory.props.src != undefined ? dataConfig?.logoDirectory.props.src : '/Pantalla.png'}`,
              alt: 'Imagen del evento',
              type: 'image/png',
              width: 1200,
              height: 620,
            },
            {
              url: `${dataConfig?.logoDirectory.props.src != undefined ? dataConfig?.logoDirectory.props.src : '/Pantalla.png'}`,
              alt: 'Imagen del evento',
              type: 'image/png',
              width: 1200,
              height: 620,
            },
          ],
        }
      }
    },
    {
      ruta: "/servicios",
      metaData: {
        title: `Servicios | ${dataConfig?.development != undefined ? dataConfig?.development : 'tu app planificador'}`,
        description: "Encuentra los servicios para tu evento en nuestro organizador de eventos.",
        canonical: `${dataConfig?.pathDomain}/servicios`,
        openGraph: {
          url: `${dataConfig?.pathDomain}/servicios`,
          siteName: `${dataConfig?.name}`,
          title: `Servicios | ${dataConfig?.name}`,
          description: 'Encuentra los servicios para tu evento en nuestro organizador de eventos.',
          images: [
            {
              url: `${dataConfig?.logoDirectory.props.src != undefined ? dataConfig?.logoDirectory.props.src : '/Pantalla.png'}`,
              alt: 'Imagen del evento',
              type: 'image/png',
              width: 1200,
              height: 1200,
            },
            {
              url: `${dataConfig?.logoDirectory.props.src != undefined ? dataConfig?.logoDirectory.props.src : '/Pantalla.png'}`,
              alt: 'Imagen del evento',
              type: 'image/png',
              width: 1200,
              height: 620,
            },
            {
              url: `${dataConfig?.logoDirectory.props.src != undefined ? dataConfig?.logoDirectory.props.src : '/Pantalla.png'}`,
              alt: 'Imagen del evento',
              type: 'image/png',
              width: 1200,
              height: 620,
            },
          ],
        }
      }
    },
    {
      ruta: "/",
      metaData: {
        title: `Tu organizador de eventos favoritos, todo en uno| ${dataConfig?.development != undefined ? dataConfig?.development : 'tu app planificador'}`,
        description: "Encuentra los servicios para tu evento en nuestro organizador de eventos.",
        canonical: `${dataConfig?.pathDomain}/servicios`,
        openGraph: {
          url: `${dataConfig?.pathDomain}/servicios`,
          siteName: `${dataConfig?.name}`,
          title: `Servicios | ${dataConfig?.name}`,
          description: 'Encuentra los servicios para tu evento en nuestro organizador de eventos.',
          images: [
            {
              url: `${dataConfig?.logoDirectory.props.src != undefined ? dataConfig?.logoDirectory.props.src : '/Pantalla.png'}`,
              alt: 'Imagen del evento',
              type: 'image/png',
              width: 1200,
              height: 1200,
            },
            {
              url: `${dataConfig?.logoDirectory.props.src != undefined ? dataConfig?.logoDirectory.props.src : '/Pantalla.png'}`,
              alt: 'Imagen del evento',
              type: 'image/png',
              width: 1200,
              height: 620,
            },
            {
              url: `${dataConfig?.logoDirectory.props.src != undefined ? dataConfig?.logoDirectory.props.src : '/Pantalla.png'}`,
              alt: 'Imagen del evento',
              type: 'image/png',
              width: 1200,
              height: 620,
            },
          ],
        }
      }
    },
  ]
  const currentMetaData = dataMetaData.find(meta => meta.ruta === router.pathname)?.metaData
  return (
    <>
      <NextSeo
        {...currentMetaData}
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

const Load = ({ setValirBlock, setDataConfig }) => {
  const { config } = AuthContextProvider()
  const [isAllowedRouter] = useAllowedRouter()
  const { event } = EventContextProvider()
  const { user } = AuthContextProvider()
  const router = useRouter()

  console.log(100051, config?.metaPixel_id)

  useEffect(() => {
    if (!!config?.metaPixel_id) {
      window.fbq = window.fbq || function () {
        (window.fbq.q = window.fbq.q || []).push(arguments);
      };
      window.fbq('init', config.metaPixel_id);
      window.fbq('track', 'PageView');

      const script = document.createElement('script');
      script.src = 'https://connect.facebook.net/en_US/fbevents.js';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }, []);

  useEffect(() => {
    setDataConfig(config)
  }, [])

  useEffect(() => {
    setValirBlock(!isAllowedRouter())
  }, [event, user, router])

  return (
    <>
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
        font-family: Montserrat, 'Noto Color Emoji';
        }
      `}
      </style>
    </>
  )
}