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
import Test from "../components/Invitaciones/Test";
import { PlantillaTextos } from "../components/Invitaciones/PlantillaTextos";
import { GoChevronDown } from "react-icons/go";
import { useTranslation } from 'react-i18next';
import { OpenModal } from "../components/Home/OpenModal";
import { Modal } from "../components/Utils/Modal";
import { EmailReactEditorCom } from "../components/Invitaciones/EmailReactEditorCom";

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
  const [optionSelect, setOptionSelect] = useState("email")
  const [stateConfi, setStateConfi] = useState(true)
  const [EmailEditorModal, setEmailEditorModal] = useState(false)

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
  }, [event]);

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
            className="max-w-screen-lg mx-auto inset-x-0 w-full px-2 md:px-0 gap-4 h-full "
          >
            {
              EmailEditorModal && <Modal  classe={" md:w-[90%] h-[90%] "}>
                <EmailReactEditorCom  setEmailEditorModal={setEmailEditorModal} EmailEditorModal={EmailEditorModal} />
              </Modal>
            }
            <BlockTitle title="Invitaciones" />
            <CounterInvitations />
            <div className="bg-white min-h-full w-full shadow-lg rounded-xl h-full md:px-6 pt-2 md:pt-6 pb-28 mb-32 md:mb-0 md:p-12 relative">
              <button className="text-primary flex items-center text-[20px] first-letter:capitalize ml-3 " onClick={() => setStateConfi(!stateConfi)}>
                {t("invitationsettings")}
                <span> <GoChevronDown className={` h-6 w-6 text-azulCorporativo cursor-pointer transition-all ml-2 ${stateConfi && "rotate-180"}`} /></span>
              </button>
              <div className={`${stateConfi ? "" : "hidden"}`}>
                <div className="w-full flex flex-col md:flex-row mt-3">
                  <div className={`w-full md:w-1/3 flex px-14 md:px-10`}>
                    <div ref={hoverRef} className="relative w-full h-72 md:h-80">
                      <ModuloSubida event={event} use={"imgInvitacion"} />
                    </div>
                  </div>
                  <div className={`w-full md:w-2/3  md:h-80 mt-3 md:mt-0 transition-all delay-150  `}>
                    <OptionsMenu
                      arryOptions={arryOptions}
                      optionSelect={optionSelect}
                      setOptionSelect={setOptionSelect}
                    />
                    <div className="col-span-3 pt-4 md:p-6 w-full">
                      {optionSelect !== "diseño" ? <Test TitelComponent={optionSelect} /> : <DiseñoComponent  setEmailEditorModal={setEmailEditorModal} EmailEditorModal={EmailEditorModal} />}
                    </div>
                  </div>
                </div>
                <div className={`${["whatsapp", "sms"].includes(optionSelect) ? null : "hidden"}`}>
                  <PlantillaTextos optionSelect={optionSelect} />
                </div>
              </div>
              <div className={`${["email", "diseño"].includes(optionSelect) ? !stateConfi ? "" : "md:pt-14" : null} pt-3`}>
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


