import { useEffect, useState, } from "react";
import { DiseñoIcon, EmailIcon, SmsIcon, WhatsappIcon, } from "../components/icons";
import BlockTitle from "../components/Utils/BlockTitle";
import useHover from "../hooks/useHover";
import ModuloSubida from "../components/Invitaciones/ModuloSubida";
import { motion } from "framer-motion";
import { AuthContextProvider, EventContextProvider } from "../context";
import { CounterInvitations } from "../components/Invitaciones/CounterInvitations";
import { DataTableGroupProvider } from "../context/DataTableGroupContext";
import VistaSinCookie from "./vista-sin-cookie";
import { useMounted } from "../hooks/useMounted"
import { OptionsMenu } from "../components/Invitaciones/OptionsMenu";
import { EnviadosComponent } from "../components/Invitaciones/EnviadosComponent";
import { DiseñoComponent } from "../components/Invitaciones/DiseñoComponent";
import { Test, TitleComponent } from "../components/Invitaciones/Test";
import { PlantillaTextos } from "../components/Invitaciones/PlantillaTextos";
import { GoChevronDown } from "react-icons/go";
import { useTranslation } from 'react-i18next';
import { OpenModal } from "../components/Home/OpenModal";
import { Modal } from "../components/Utils/Modal";
import { EmailReactEditorComponent } from "../components/Invitaciones/EmailReactEditorComponent";
import { fetchApiEventos, queries } from "../utils/Fetching";

export type optionArryOptions = {
  title: string;
  icon: any;
  state: boolean;
}

const Invitaciones = () => {
  const { t } = useTranslation();
  const { user, verificationDone, forCms } = AuthContextProvider()
  const { event } = EventContextProvider();
  const [hoverRef, isHovered] = useHover();
  const [dataInvitationSent, setDataInvitationSent] = useState([]);
  const [dataInvitationNotSent, setDataInvitationNotSent] = useState([]);
  const [optionSelect, setOptionSelect] = useState<TitleComponent>("email")
  const [stateConfi, setStateConfi] = useState(true)
  const [ShowEmailEditorModal, setShowEmailEditorModal] = useState(false)
  const [previewEmailReactEditor, setPreviewEmailReactEditor] = useState(false)
  const [previewEmail, setPreviewEmail] = useState<string>()

  const arryOptions: optionArryOptions[] = [
    {
      title: "email",
      icon: <EmailIcon />,
      state: false
    },
    {
      title: "whatsapp",
      icon: <WhatsappIcon />,
      state: false
    },
    {
      title: "sms",
      icon: <SmsIcon />,
      state: false
    },
    {
      title: "diseño",
      icon: <DiseñoIcon />,
      state: false
    }
  ]

  useMounted()
  useEffect(() => {
    const reduce = event?.invitados_array?.reduce((acc: any, item: any) => {
      const asd = {
        _id: item._id,
        nombre: item.nombre,
        correo: item.correo,
        sexo: item.sexo,
        invitacion: item.invitacion,
        telefono: item.telefono,
        date: item.fecha_invitacion,
        father: item.father
      }
      item.invitacion ? acc.sent.push(asd) : acc.notSent.push(asd);
      return acc;
    }, { sent: [], notSent: [] })

    const InvitationSent = reduce?.sent?.filter((invitado: any) => !invitado?.father)
    const InvitationNotSent = reduce?.notSent?.filter((invitado: any) => !invitado?.father)

    reduce?.sent?.length != dataInvitationSent?.length && setDataInvitationSent(InvitationSent);
    reduce?.notSent.length != dataInvitationNotSent?.length && setDataInvitationNotSent(InvitationNotSent);
    if (event?.templateInvitacionSelect) {
      fetchApiEventos({
        query: queries.getVariableEmailTemplate,
        variables: {
          template_id: event?.templateInvitacionSelect,
          selectVariable: "preview"
        },
      }).then((res: any) => {
        setPreviewEmail(res?.preview)
      })
    }
  }, [event?.templateInvitacionSelect, event?.fecha_actualizacion, event?.updatedAt, event?.invitados_array]);

  if (verificationDone) {
    if (!user) {
      return (
        <VistaSinCookie />
      )
    }
    if (!event) return <></>
    return (
      <DataTableGroupProvider>
        <section className={forCms ? "absolute z-[50] w-[calc(100vw-40px)] h-full top-0 left-4" : "bg-base w-full pb-6 pt-2 md:py-0"}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-screen-lg mx-auto inset-x-0 w-full px-2 md:px-0 gap-4 h-full"
          >
            {
              ShowEmailEditorModal && <Modal classe={" md:w-[90%] h-[90%] "} >
                <EmailReactEditorComponent setShowEmailEditorModal={setShowEmailEditorModal} showEmailEditorModal={ShowEmailEditorModal} previewEmailReactEditor={previewEmailReactEditor} />
              </Modal>
            }
            <BlockTitle title="Invitaciones" />
            <CounterInvitations />
            <div className="bg-white min-h-full w-full shadow-lg rounded-xl h-full py-2 relative">
              <button className="text-primary flex items-center text-[20px] first-letter:capitalize ml-3" onClick={() => setStateConfi(!stateConfi)}>
                {t("invitationsettings")}
                <span> <GoChevronDown className={`h-6 w-6 text-azulCorporativo cursor-pointer transition-all ml-2 ${stateConfi && "rotate-180"}`} /></span>
              </button>
              <div className={`${stateConfi ? "" : "hidden"} md:h-96`}>
                <div className="w-full h-full flex flex-col md:flex-row mt-3 md:space-x-6 md:px-4">
                  <div className={`w-full h-96 md:w-auto flex justify-center`}>
                    <div ref={hoverRef} className={`relative w-60 h-80 ${optionSelect === "email" ? "bg-[#808080] rounded-lg border-[1px] border-gray-300" : "bg-white"}`}>
                      {optionSelect === "email"
                        ? previewEmail
                          ? <img
                            src={previewEmail}
                            alt="imgInvitacion"
                            className="w-full h-full object-contain rounded-lg"
                            style={{ maxWidth: "100%", maxHeight: "100%", display: "block" }} />
                          : <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
                            <p className="text-gray-500 text-xs">No hay template seleccionado</p>
                          </div>
                        : <ModuloSubida event={event} use={"imgInvitacion"} />
                      }
                    </div>
                  </div>
                  <div className={`flex-1 h-[352px] flex flex-col shadow-md rounded-2xl overflow-hidden`}>
                    <OptionsMenu
                      arryOptions={arryOptions}
                      optionSelect={optionSelect}
                      setOptionSelect={setOptionSelect}
                    />
                    <div className="col-span-3 w-full h-[280px] md:h-full">
                      {optionSelect === "diseño" && <DiseñoComponent setEmailEditorModal={setShowEmailEditorModal} EmailEditorModal={ShowEmailEditorModal} />}
                      {optionSelect === "email" && <Test TitleComponent={optionSelect} setEmailEditorModal={setShowEmailEditorModal} emailEditorModal={ShowEmailEditorModal} setPreviewEmailReactEditor={setPreviewEmailReactEditor} />}
                    </div>
                  </div>
                </div>
                <div className={`${["whatsapp", "sms"].includes(optionSelect) ? null : "hidden"}`}>
                  <PlantillaTextos optionSelect={optionSelect} />
                </div>
              </div>
              <div className={`${["email", "diseño"].includes(optionSelect) ? !stateConfi ? "" : "md:pt-3" : null} pt-3`}>
                <EnviadosComponent dataInvitationSent={dataInvitationSent} dataInvitationNotSent={dataInvitationNotSent} event={event} />
              </div>
            </div>
          </motion.div>
        </section>
      </DataTableGroupProvider>
    );
  }
};
export default Invitaciones;


