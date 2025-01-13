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
import { DefaultSeo, NextSeo } from 'next-seo';


const MyApp = ({ Component, pageProps }) => {
  const [valirBlock, setValirBlock] = useState<boolean>()

  return (
    <>

      <I18nextProvider i18n={i18n}>
          <NextSeo
            title="Evento organizador | Bodas de Hoy"
            description="Encuentra toda la información sobre el evento, itinerario y tareas relacionadas."
            canonical="https://testorganizador.bodasdehoy.com"
            openGraph={{
              url: 'https://testorganizador.bodasdehoy.com',
              siteName: 'Bodas de Hoy',
              title: 'Detalles del Evento en bodasdehoy.com',
              description: 'Descubre todos los detalles de este evento especial.',
              images: [       // Images must be in a 1.91:1 ratio.            
                {
                  url: 'https://github.githubassets.com/assets/github-logo-55c5b9a1fe52.png',
                  alt: 'Imagen del evento',
                  type: 'image/png',
                  width: 1200,
                  height: 1200,
                },
                {
                  url: 'https://github.githubassets.com/assets/github-mark-57519b92ca4e.png',
                  alt: 'Imagen del evento',
                  type: 'image/png',
                  width: 1200,
                  height: 620,
                },
                {
                  url: 'https://github.githubassets.com/assets/github-octocat-13c86b8b336d.png',
                  alt: 'Imagen del evento',
                  type: 'image/png',
                  width: 1200,
                  height: 620,
                },
              ],
            
              site_name: 'Bodas de Hoy',
            }}
          />
        <DefaultLayout>

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