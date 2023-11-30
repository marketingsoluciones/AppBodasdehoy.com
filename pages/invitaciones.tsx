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
import { EmailComponent } from "../components/Invitaciones/EmailComponent";
import { FooterComponent } from "../components/Invitaciones/FooterComponent";
import { SmsComponent } from "../components/Invitaciones/SmsComponent";
import { WhatsappComponent } from "../components/Invitaciones/WhatsappComponent";
import { EnviadosComponent } from "../components/Invitaciones/EnviadosComponent";
import { DiseñoComponent } from "../components/Invitaciones/DiseñoComponent";
import Test from "../components/Invitaciones/Test";

export type optionArryOptions = {
  title: string;
  icon: any;
  component: any;
  state: boolean;
}

const Invitaciones = () => {
  const { user, verificationDone } = AuthContextProvider()
  const { event } = EventContextProvider();
  const [hoverRef, isHovered] = useHover();
  const [dataInvitationSent, setDataInvitationSent] = useState([]);
  const [dataInvitationNotSent, setDataInvitationNotSent] = useState([]);
  const [showInvitation, setShowInvitation] = useState(true)
  const [optionSelect, setOptionSelect] = useState("whatsapp")
  const arryOptions: optionArryOptions[] = [
    {
      title: "whatsapp",
      icon: <WhatsappIcon />,
      component: <WhatsappComponent dataInvitationSent={dataInvitationSent} dataInvitationNotSent={dataInvitationNotSent} event={event} />,
      state: false
    },
    {
      title: "email",
      icon: <EmailIcon />,
      component: <EmailComponent dataInvitationSent={dataInvitationSent} dataInvitationNotSent={dataInvitationNotSent} event={event} />,
      state: false
    },
    {
      title: "sms",
      icon: <SmsIcon />,
      component: <SmsComponent dataInvitationSent={dataInvitationSent} dataInvitationNotSent={dataInvitationNotSent} event={event} />,
      state: false
    },
    // {
    //   title: "enviados",
    //   icon: <Correo />,
    //   component: <EnviadosComponent dataInvitationSent={dataInvitationSent} dataInvitationNotSent={dataInvitationNotSent} event={event} />,
    //   state: false
    // },
    {
      title: "diseño",
      icon: <DiseñoIcon />,
      component: <DiseñoComponent />,
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
        telefono: item.telefono
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
        <section className="bg-base w-full pb-6 pt-2 md:py-0">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-screen-lg mx-auto inset-x-0 w-full px-2 md:px-0 gap-4"
          >
            <BlockTitle title="Invitaciones" />
            <CounterInvitations />
            <div className="bg-white min-h-full w-full shadow-lg rounded-xl h-full md:px-6 pt-2 md:pt-6 pb-28 mb-32 md:mb-0 md:p-12 relative">
              <div className="flex gap-2 md:gap-4 items-center mt-1 mb-3 md:mb-5 mx-2">
                <button
                  onClick={(e) => setShowInvitation(true)}
                  className={`focus:outline-none ${showInvitation ? "bg-primary text-white" : "bg-white text-primary"} px-2 md:px-6 py-1 flex gap-1 md:gap-2 items-center justify-between text-primary font-display font-semibold text-[10px] md:text-sm rounded-lg hover:bg-primary hover:text-white transition border border-primary`}
                >
                  {/* <PlusIcon /> */}
                  Invitación
                </button>
                <button
                  onClick={(e) => setShowInvitation(false)}
                  className={`focus:outline-none ${showInvitation ? "bg-white text-primary" : "bg-primary text-white"} px-2 md:px-6 py-1 flex gap-1 md:gap-2 items-center justify-between text-primary font-display font-semibold text-[10px] md:text-sm rounded-lg hover:bg-primary hover:text-white transition border border-primary`}
                >
                  {/* <PlusIcon /> */}
                  Lista de invitados
                </button>
                {/* <button
                  onClick={(e) => handleClick(e, "menu")}
                  className="focus:outline-none bg-white px-2 md:px-6 py-1 flex gap-1 md:gap-2 items-center justify-between text-primary font-display font-semibold text-[10px] md:text-sm rounded-lg hover:bg-primary hover:text-white transition border border-primary"
                >
                  <PlusIcon />
                  Diseño
                </button> */}
              </div>
              {showInvitation && <div className="*bg-blue-200 flex flex-col md:flex-row">
                <div className="*bg-blue-400 w-full md:w-1/3 flex px-14 md:px-10">
                  <div ref={hoverRef} className="*bg-yellow-200 relative w-full h-72 md:h-80">
                    <ModuloSubida event={event} use={"imgInvitacion"} />
                  </div>
                </div>
                <div className="*bg-blue-300 w-full md:w-2/3 h-96 md:h-80">
                  <OptionsMenu
                    arryOptions={arryOptions}
                    optionSelect={optionSelect}
                    setOptionSelect={setOptionSelect}
                  />
                  <div className="col-span-3 p-5 *md:p-0">
                    {optionSelect !== "diseño" ? <Test TitelComponent={optionSelect} /> : <DiseñoComponent />}
                  </div>
                </div>
              </div>}
            </div>
          </motion.div>
          <style jsx>
            {`
              section {
                min-height : calc(100vh - 10rem);
              }
            `}
          </style>
        </section>
      </DataTableGroupProvider>
    );
  }
};
export default Invitaciones;


