import { useContext } from 'react'
import EventoContext from '../../context/EventContext'
import { EventContextProvider } from "../../context";
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/router';

const Banner = ({ setEmailEditorModal, EmailEditorModal }) => {
  const { t } = useTranslation();
  const { event } = EventContextProvider()
  const router = useRouter()

  const banners = {
    boda: "boda.webp",
    bautizo: "bautizo.webp",
    babyshower: "baby_shower.webp",
    comunión: "comunion.webp",
    cumpleaños: "cumpleaños.webp",
    "despedida de soltero": "despedida_soltero.webp",
    graduación: "graduacion.webp"
  }

  /* style = [
    banners = {
      backgroundImage : "url("/banners/${banners[event?.tipo]}")",
      backgroundRepeat: "no-repeat",
      bagroundSize: "contain",
      backgroundPosition:" top center",
    }
  ] */

  return (
    <>
      <div className="h-40 w-full bg-white banner grid place-items-center rounded-xl my-4 relative">
        <div className="bg-primary w-40 h-40 rounded-full absolute right-0 inset-y-0 my-auto p-8 flex items-center justify-center">
          <div className="w-max h-max relative">
            <p className="font-display text-xs text-white">{t("foronly")}</p>
            <p className="font-display text-sm text-white">{t("yourinvitation")}</p>
            <button onClick={() => setEmailEditorModal(!EmailEditorModal)} className="focus:outline-none bg-tertiary text-gray-500 font-display text-sm px-2 rounded-lg w-full hover:text-primary hover:bg-white transition">{t("todesign")}</button>
            <div className="bg-tertiary w-20 h-20 absolute rounded-full top-0 right-0 translate-x-1/2 -translate-y-3/4 transform flex items-center justify-center">
              <p className="font-display text-primary text-5xl font-bold">5<span className="text-xl font-light">€</span></p>
            </div>
          </div>
        </div>
      </div>
      <style jsx>
        {`
            .banner {
                background-image : url("/${banners[event?.tipo]}");
                background-repeat: no-repeat;
                baground-size: contain;
                background-position: top center;
            }
            `}
      </style>
    </>
  )
}

export default Banner
