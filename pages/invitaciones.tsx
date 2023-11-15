import { useEffect, useState, } from "react";
import Breadcumbs from "../components/DefaultLayout/Breadcumb";
import { CompartirIcon, Correo, DiseñoIcon, EmailIcon, SmsIcon, SubirImagenIcon2, WhatsappIcon, } from "../components/icons";
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
  const [optionSelect, setOptionSelect] = useState(0)
  const arryOptions: optionArryOptions[] = [
    {
      title: "SMS",
      icon: <SmsIcon />,
      component: <SmsComponent dataInvitationSent={dataInvitationSent} dataInvitationNotSent={dataInvitationNotSent} event={event} />,
      state: false
    },
    {
      title: "Email",
      icon: <EmailIcon />,
      component: <EmailComponent dataInvitationSent={dataInvitationSent} dataInvitationNotSent={dataInvitationNotSent} event={event} />,
      state: false
    },
    {
      title: "Whatsapp",
      icon: <WhatsappIcon />,
      component: <WhatsappComponent dataInvitationSent={dataInvitationSent} dataInvitationNotSent={dataInvitationNotSent} event={event} />,
      state: false
    },
    {
      title: "Enviados",
      icon: <Correo />,
      component: <EnviadosComponent dataInvitationSent={dataInvitationSent} dataInvitationNotSent={dataInvitationNotSent} event={event} />,
      state: false
    },
    {
      title: "Diseño",
      icon: <DiseñoIcon />,
      component: <DiseñoComponent />,
      state: false
    }
  ]

  const handleClickOption = (idx: number) => {
    setOptionSelect(idx);
  };
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
            className="max-w-screen-lg mx-auto inset-x-0 w-full px-5 md:px-0 gap-4"
          >
            <BlockTitle title="Invitaciones" />
            <div className="w-full flex flex-col md:flex-row my-6 gap-6 relative">
              <div ref={hoverRef} className="relative w-full h-96 md:w-1/3 ">
                <ModuloSubida event={event} use={"imgInvitacion"} />
              </div>
              <div className="w-full md:w-2/3 h-full* flex flex-col gap-6 relative justify-center">
                <CounterInvitations />
              </div>
            </div>
            <OptionsMenu
              arryOptions={arryOptions}
              optionSelect={optionSelect}
              onClick={handleClickOption}
            />
            <div className="col-span-3 p-5 *md:p-0">
              {arryOptions[optionSelect].component}
            </div>
            {/* <FooterComponent /> */}
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


