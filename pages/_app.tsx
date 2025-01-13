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
        <DefaultLayout>
          <NextSeo
            title="Evento organizador | Bodas de Hoy"
            description="Encuentra toda la información sobre el evento, itinerario y tareas relacionadas."
            canonical="https://testorganizador.bodasdehoy.com"
            openGraph={{
              url: 'https://testorganizador.bodasdehoy.com',
              title: 'Detalles del Evento en bodasdehoy.com',
              description: 'Descubre todos los detalles de este evento especial.',
              images: [       // Images must be in a 1.91:1 ratio.            
                {
                  url: 'https://lh3.googleusercontent.com/fife/ALs6j_HTbxUn0lJzQwHUQ36W2KsNXBODeo2LE83Dk7eDsV7XJAoP8GOulBgWwdpzk6EezcM1CPI3mbG5NJf09Kau-HUvkQDqkrLW0S58cCz3VBNM1VWnlbLaIaAD6esZwZ0dAkROcVYSOECHmQJnpUOJNMCf4DN1eX0Kfou2D8JKNLkZ_CxeixjxCxMJG2iwGF97VDZ2qHiIcGIm4gM7vy0-Ql6deJQyIcYZc2aVEqcXmvDVIn-u9IFqtqSMtlbhUgy87lN1nney9Rd8YX8WjxxZqsSffds9Y7uej0MX0-rMdWGaYHEurnkyRVZ7IiJBil406lrjrAW0iczhAy5IrtUWLOFTNh6pEEAnODTl8KAeAQfmrSBQKdTIy-zfgGYy3A_daoIkhx5vuimuRikxXcKP4akWX7PWMNQxBgFuLlq9wOiVsK8KaHCcSPoevJWt0uIDKwrmGPdt5C-OwTq3sJKGirejrkxISW1pYpZIJDOxp5pwtVWb7sfXKNkriGfO-4Kt1SldFABAEraH2CHq4vNFuDHCD5HOr7QAviEVhTL0l5hX4NemzQq1gZwLzodAeppMTJgYDtQhdum1nFBsoPXwvDFvkkIZbhKF6sY1b9quNMn1uDSJEaIo5t-YqabjvmL2gvSaf8Pfx9xHaZ-NU3cGGYQ6yxniBPKSACE0_2cxMRsBd5_eWwGVU9-6FiWs1BiVhupmHiBMX9Bqmy_diz61srb_xiqiZGam1M8-p289u5jUkyFN0VcPbEAKDszyvVaRmVfofBfuZ9Q_ZnVDx06HQk7innJRuUr84eCa7jO1P-52orgoorIvKZgyKJ8cTq8p91ii8Koq2GOO1F7FGf5J1gUwaptgabCM-UT4ncnYzqJ0Pr2dsyrO9_dOQjpl05t0Fb8LESQAeEqopMSrlgqj0RtMXiz7phVGBaLGVAWcxwr7-5IX6Ur3xgUQZMyshmqforXBhFR5kGs92tH6p7kMvfvTxOjnPdkVOYSqYxNmPzXDNERdYeQx6rnRh4qiiOKO633bSDfNKlQcbtkgTKTKm5dzcbD0L0D2mk1t59RXoA7VE9K-rXCc5dVAqcRdolxIHfDtLA_jFM65g-KK4WMxaHYZoHArAQPhav4vfZHHQ10dIpa4cotNdCmGRYKLfYkKx0XN6Uw6Oh4GOpq9ymdssWMo6m0J7a8863CMqBAQzxO4Uy5fY7xxX-gFeBfzEt2kJdLUGv_5a09N4POh5Ac7qgzjXkOvbkDlqDBCWlcpCkm2I26UbjyAb2atW4cbDwLlzyRp74mnsZ_icVJhFIN8XE2iyO3I5czsv8B1EFmmQLZUY44FqqGMDx3wYhhzsUsfHHgvr8UlcT6JGf5rTVdM_pw9paOW0BlPtBiVEsp40aobK09yNjRTGH6QUUn9J3K3tQuFdHb_PqVPI0eHSBXCyg9wjuPCq756gF_--pHyBIHCSB8ZuQSidqjEwUKEE9Seg6qjuV4Q2E3gxDk=s1024',
                  alt: 'Imagen del evento',
                },
              ],
              site_name: 'Bodas de Hoy',
            }}
          />

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