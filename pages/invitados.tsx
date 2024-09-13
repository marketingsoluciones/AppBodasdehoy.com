import { FC, useState } from "react";
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
import { useMounted } from "../hooks/useMounted";
import { BlockTableroInvitados } from "../components/Invitados/BlockTableroInvitados";

const Invitados: FC = () => {
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [formShow, setFormShow] = useState<string | null>(null)
  const [createPDF, setCreatePDF] = useState(false)
  const shouldRenderChild = useDelayUnmount(isMounted, 500);
  const { event } = EventContextProvider();
  useMounted()
  const { actionModals, setActionModals } = AuthContextProvider()


  const reciboClick = (accion) => {
    setIsMounted(accion.state)
    setFormShow(accion.click)
  }
  const handleClick = (e, click) => {
    e.preventDefault();
    reciboClick({ state: !isMounted, click: click });
  };

  const ConditionalAction = ({ e }) => {
    if (event.invitados_array.length >= 200) {
      setActionModals(!actionModals)
    } else {
      handleClick(e, "invitado")
    }

  }

  const { user, verificationDone, forCms } = AuthContextProvider()
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
                  <FormCrearMenu state={isMounted} set={setIsMounted} />
                )
              }
            })()}
            {/* {formShow == "invitado"
              ? <FormInvitado state={isMounted} set={setIsMounted} />
              : <FormCrearGrupo state={isMounted} set={setIsMounted} />} */}
          </ModalLeft>
        )}
        {event &&
          <section className={forCms ? "absolute z-[50] w-[calc(100vw-40px)] h-[100vh] top-0 left-4" : "bg-base w-full pb-6 pt-2 md:py-0 "}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-screen-lg mx-auto inset-x-0 w-full px-2 md:px-0 gap-4 ">
              <BlockCabecera />
              <div className="hidden md:block ">
                <BlockListaInvitados createPDF={createPDF} setCreatePDF={setCreatePDF} ConditionalAction={ConditionalAction} handleClick={handleClick} />
              </div>
              <div className=" md:hidden ">
                <BlockTableroInvitados createPDF={createPDF} setCreatePDF={setCreatePDF} ConditionalAction={ConditionalAction} handleClick={handleClick} />
              </div>
            </motion.div>
          </section >}
      </>
    )
  }
}

export default Invitados
