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
import { ModalPDF } from "../components/Utils/ModalPDF"

const Invitados: FC = () => {
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [formShow, setFormShow] = useState<string | null>(null)
  const [createPDF, setCreatePDF] = useState(false)
  const shouldRenderChild = useDelayUnmount(isMounted, 500);
  const { event } = EventContextProvider();
  useMounted()

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
          <section className="bg-base w-full h-full pt-2 md:py-0">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-screen-lg mx-auto inset-x-0 w-full px-5 md:px-0 gap-4">
              <BlockCabecera />
              <BlockListaInvitados state={isMounted} set={reciboClick} createPDF={createPDF} setCreatePDF={setCreatePDF} />
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
