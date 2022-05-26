import '../styles/globals.css'
import DefaultLayout from '../layouts/DefaultLayout'
import "swiper/components/pagination/pagination.min.css"
import "swiper/swiper.min.css";
import { AnimatePresence } from 'framer-motion';

const MyApp = ({ Component, pageProps }) => {
  return (
    <>
  <AnimatePresence exitBeforeEnter initial={false}>
  <DefaultLayout>
  <Component {...pageProps} />
  </DefaultLayout>
  </AnimatePresence>
  <style jsx global>
      {`
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #f1f1f1
          border-radius: 6px;
        }

        ::-webkit-scrollbar-thumb {
          background: pink;
          border-radius: 6px;
          height: 50%;
        }
      `}
    </style>
  </>
  )}

export default MyApp
