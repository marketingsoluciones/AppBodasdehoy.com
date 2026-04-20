import { FC, useEffect, useState } from "react";
import FormInvitado from "../components/Forms/FormInvitado";
import FormCrearGrupo from "../components/Forms/FormCrearGrupo";
import BlockCabecera from "../components/Invitados/BlockCabecera"
import BlockListaInvitados from "../components/Invitados/BlockListaInvitados";
import { useDelayUnmount } from "../utils/Funciones";
import { motion } from "framer-motion";
import ModalLeft from "../components/Utils/ModalLeft";
import { AuthContextProvider, EventContextProvider, EventsGroupContextProvider } from "../context";
import { useSearchParams } from "next/navigation";
import VistaSinCookie from "./vista-sin-cookie";
import GuestUpsellPage from "../components/Utils/GuestUpsellPage";
import { SkeletonTable } from "../components/Utils/SkeletonPage";
import EventLoadingOrError from "../components/Utils/EventLoadingOrError";
import { ModuleErrorBoundary } from "../components/ErrorBoundary";
import FormCrearMenu from "../components/Forms/FormCrearMenu";
import { useMounted } from "../hooks/useMounted";
import { BlockTableroInvitados } from "../components/Invitados/BlockTableroInvitados";
import { SelectModeView } from "../components/Utils/SelectModeView";
import FormAcompañante from "../components/Forms/FormAcompañante";

export type ViewItinerary = "table" | "schema" | "cards" | "extraTable" | "boardView" | "newTable" | "kanban"; // Agregar "extraTable"

const Invitados: FC = () => {
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [formShow, setFormShow] = useState<string | null>(null)
  const [formShowAcompañante, setFormShowAcompañante] = useState<string | null>(null)
  const shouldRenderChild = useDelayUnmount(isMounted, 500);
  const { event, setEvent } = EventContextProvider();
  const { eventsGroup } = EventsGroupContextProvider();
  const searchParams = useSearchParams();
  const queryEvent = searchParams.get("event");
  const { actionModals, setActionModals } = AuthContextProvider()
  const [viewPreferUser, setViewPreferUser] = useState<ViewItinerary>(typeof window !== 'undefined' && window.innerWidth < 700 ? "cards" : "table")
  const [view, setView] = useState<ViewItinerary>()
  const [triggerResize, setTriggerResize] = useState<number>(new Date().getTime())
  const { user, setUser, verificationDone, forCms } = AuthContextProvider()

  useMounted()

  useEffect(() => {
    if (!queryEvent || queryEvent === event?._id || !eventsGroup?.length) return;
    const eventFound = eventsGroup.find((elem) => elem._id === queryEvent);
    if (eventFound) {
      setEvent({ ...eventFound });
      user.eventSelected = queryEvent;
      setUser({ ...user });
    }
  }, [queryEvent, eventsGroup, event?._id]);

  const handleResize = () => {
    setTriggerResize(new Date().getTime())
  }

  useEffect(() => {
    setView(viewPreferUser)

  }, [viewPreferUser]);

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const reciboClick = (accion) => {
    setIsMounted(accion.state)
    setFormShow(accion.click)
    if (accion.click == "acompañante") {
      setFormShowAcompañante(accion.id)
    }
  }
  const handleClick = (e, click, id?: string | number) => {
    e.preventDefault();
    reciboClick({ state: !isMounted, click: click, id: id });
};

  const ConditionalAction = ({ e }) => {
    if ((event?.invitados_array?.length ?? 0) >= 200) {
      setActionModals(!actionModals)
    } else {
      handleClick(e, "invitado")
    }
  }

  if (verificationDone) {
    if (user?.displayName === 'guest') {
      return (
        <GuestUpsellPage
          section="Lista de invitados"
          icon="👥"
          description="Crea una cuenta gratuita para gestionar invitados reales, confirmaciones de asistencia y organización por mesas en tus eventos."
          benefits={[
            "Lista centralizada con estados de confirmación",
            "Enlaces públicos de RSVP y control de acompañantes",
            "Exportación e importación para coordinar con proveedores",
          ]}
        />
      );
    }
    if (!user) {
      return (
        <VistaSinCookie />
      )
    }
    if (!event) return <EventLoadingOrError skeletonRows={8} />
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
              }else if (formShow == "acompañante") {
                return (
                  <FormAcompañante state={isMounted} set={setIsMounted} guestFather={formShowAcompañante} />
                )
              }
            })()}
          </ModalLeft>
        )}
        {event &&
          <section className={forCms ? "absolute z-[50] w-[calc(100vw-40px)] h-[100vh] top-0 left-4" : "bg-base w-full pb-6 pt-2 md:py-0"}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-screen-lg mx-auto inset-x-0 w-full px-2 md:px-0 gap-4 relative"
            >
              <BlockCabecera />
              {/* <div className="absolute z-10  right-5 md:right-[155px] translate-y-3 md:top-[170px] md:hidden">
                <SelectModeView value={viewPreferUser} setValue={setViewPreferUser} />
              </div> */}
             {/*  {view === "cards"
                ? <BlockTableroInvitados ConditionalAction={ConditionalAction} handleClick={handleClick} />
                : */}
              <ModuleErrorBoundary label="Lista de invitados">
                <BlockListaInvitados ConditionalAction={ConditionalAction} handleClick={handleClick} />
              </ModuleErrorBoundary>
            {/*  /*  } */}
            </motion.div>
          </section >}
      </>
    )
  }
}

export default Invitados
