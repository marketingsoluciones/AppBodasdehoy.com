import '../styles/globals.css'
import DefaultLayout from '../layouts/DefaultLayout'
import 'swiper/css';
import "swiper/css/bundle"
import "@fontsource/italiana";
import "@fontsource/montserrat";
import "@fontsource/poppins";
import { AnimatePresence } from 'framer-motion';
import { AuthContextProvider } from '../context';
import { useEffect } from 'react';
import { InfoDevelopment } from '../components/InfoDevelopment';

const MyApp = ({ Component, pageProps }) => {

  return (
    <>
      {/*<AnimatePresence exitBeforeEnter initial={false}>*/}
      <DefaultLayout>
        {/* <InfoDevelopment /> */}
        <Load />
        <Component {...pageProps} />
      </DefaultLayout>
      {/*</AnimatePresence>*/}
      <style jsx global>
        {`
        
        
      `}
      </style>
    </>
  )
}

export default MyApp

const Load = () => {
  const { config } = AuthContextProvider()

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