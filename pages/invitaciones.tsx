import { useEffect, useState, } from "react";
import Breadcumbs from "../components/DefaultLayout/Breadcumb";
import { CompartirIcon, Correo, DiseñoIcon, EmailIcon, PlusIcon, SmsIcon, SubirImagenIcon2, WhatsappIcon, } from "../components/icons";
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

export type optionArryOptions = {
  title: string;
  icon: any;
  state: boolean;
}

const Invitaciones = () => {
  const { user, verificationDone, forCms } = AuthContextProvider()
  const { event } = EventContextProvider();
  const [hoverRef, isHovered] = useHover();
  const [dataInvitationSent, setDataInvitationSent] = useState([]);
  const [dataInvitationNotSent, setDataInvitationNotSent] = useState([]);
  const [showInvitation, setShowInvitation] = useState(true)
  const [optionSelect, setOptionSelect] = useState("email")
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
        date: item.fecha_invitacion
      }
      item.invitacion ? acc.sent.push(asd) : acc.notSent.push(asd);
      return acc;
    }, { sent: [], notSent: [] })
    reduce?.sent?.length != dataInvitationSent?.length && setDataInvitationSent(reduce?.sent);
    reduce?.notSent.length != dataInvitationNotSent?.length && setDataInvitationNotSent(reduce?.notSent);
  }, [event, dataInvitationSent, dataInvitationNotSent]);

  const handleClick = (e, a) => { }
  if (verificationDone) {
    if (!user) {
      return (
        <VistaSinCookie />
      )
    }
    if (!event) return <></>
    return (
      <DataTableGroupProvider>
        <section className={forCms ? "absolute z-[50] w-[calc(100vw-40px)] h-[100vh] top-0 left-4" : "bg-base w-full pb-6 pt-2 md:py-0"}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-screen-lg mx-auto inset-x-0 w-full px-2 md:px-0 gap-4"
          >
            <BlockTitle title="Invitaciones" />
            <CounterInvitations />
            <div className="bg-white min-h-full w-full shadow-lg rounded-xl h-full md:px-6 pt-2 md:pt-6 pb-28 mb-32 md:mb-0 md:p-12 relative">
              {/* <div className="flex gap-2 md:gap-4 items-center mt-1 mb-3 md:mb-5 mx-2">
                <button
                  onClick={(e) => setShowInvitation(true)}
                  className={`focus:outline-none ${showInvitation ? "bg-primary text-white" : "bg-white text-primary"} px-2 md:px-6 py-1 flex gap-1 md:gap-2 items-center justify-between text-primary font-display font-semibold text-[10px] md:text-sm rounded-lg hover:bg-primary hover:text-white transition border border-primary`}
                >
                  Invitación
                </button>
                <button
                  onClick={(e) => setShowInvitation(false)}
                  className={`focus:outline-none ${showInvitation ? "bg-white text-primary" : "bg-primary text-white"} px-2 md:px-6 py-1 flex gap-1 md:gap-2 items-center justify-between text-primary font-display font-semibold text-[10px] md:text-sm rounded-lg hover:bg-primary hover:text-white transition border border-primary`}
                >
                  Lista de invitados
                </button>
              </div> */}

              <div className="w-full flex flex-col md:flex-row">
                <div className="w-full md:w-1/3 flex px-14 md:px-10">
                  <div ref={hoverRef} className="*bg-yellow-200 relative w-full h-72 md:h-80">
                    <ModuloSubida event={event} use={"imgInvitacion"} />
                  </div>
                </div>
                <div className="w-full md:w-2/3  md:h-80 mt-3 md:mt-0">
                  <OptionsMenu
                    arryOptions={arryOptions}
                    optionSelect={optionSelect}
                    setOptionSelect={setOptionSelect}
                  />
                  <div className="col-span-3 pt-4 md:p-6 w-full">
                    {optionSelect !== "diseño" ? <Test TitelComponent={optionSelect} /> : <DiseñoComponent />}
                  </div>
                </div>
              </div>
              <div className="md:pt-14 pt-3">
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


