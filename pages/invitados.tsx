import { FC, useEffect, useState } from "react";
import Breadcumbs from "../components/DefaultLayout/Breadcumb";
import FormInvitado from "../components/Forms/FormInvitado";
import FormCrearGrupo from "../components/Forms/FormCrearGrupo";
import BlockCabecera from "../components/Invitados/BlockCabecera"
import BlockListaInvitados from "../components/Invitados/BlockListaInvitados";
import { useDelayUnmount } from "../utils/Funciones";
import { motion } from "framer-motion";
import ModalLeft from "../components/Utils/ModalLeft";
import { AuthContextProvider, EventContextProvider } from "../context";
import VistaSinCookie from "./vista-sin-cookie";
import FormCrearMenu from "../components/Forms/FormCrearMenu";

const Invitados: FC = () => {
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const shouldRenderChild = useDelayUnmount(isMounted, 500);
  const [formShow, setFormShow] = useState<string | null>(null)
  const { event } = EventContextProvider();
  const [guardarMenu, setGuardarMenu] = useState()
  const menu = ["Invitados", "Alergicos", "Infantil", "hipocondriacoaaaaa"]
  const [getMenu, setGetMenu] = useState([])

  useEffect(() => {
    setGetMenu(JSON.parse(localStorage.getItem("dataMenu")))
  }, [event])

  const reciboClick = (accion) => {
    setIsMounted(accion.state)
    setFormShow(accion.click)
  }
  const { user, verificationDone } = AuthContextProvider()
  if (verificationDone) {
    if (!user) {
      return (
        <VistaSinCookie />
      )
    }
    if (!event) return <></>
    return (
      <>
        {shouldRenderChild && (
          <ModalLeft state={isMounted} set={setIsMounted}>
            {(() => {
              if (formShow == "invitado") {
                return (
                  <FormInvitado state={isMounted} set={setIsMounted} />
                )
              } else if (formShow == "grupo") {
                return (
                  <FormCrearGrupo state={isMounted} set={setIsMounted} />
                )
              } else if (formShow == "menu") {
                return (
                  <FormCrearMenu state={isMounted} set={setIsMounted} guardarMenu={guardarMenu} setGuardarMenu={setGuardarMenu} getMenu={getMenu} setGetMenu={setGetMenu} />
                )
              }
            })()}
            {/* {formShow == "invitado"
              ? <FormInvitado state={isMounted} set={setIsMounted} />
              : <FormCrearGrupo state={isMounted} set={setIsMounted} />} */}
          </ModalLeft>
        )}
        {event &&
          <section className="bg-base w-full h-full">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-screen-lg mx-auto inset-x-0 w-full px-5 md:px-0 gap-4">
              {/* <div className="w-[35%]">
              <Breadcumbs />
            </div> */}
              <BlockCabecera />
              <BlockListaInvitados state={isMounted} set={reciboClick} menu={getMenu} setGetMenu={setGetMenu} />
            </motion.div>
          </section>}
        <style jsx>
          {`
          section {
            min-height: calc(100vh - 9rem);
            padding-bottom: 8rem;
          }
        `}
        </style>
      </>
    )
  }
}

export default Invitados
