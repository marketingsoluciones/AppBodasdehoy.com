import Image from "next/image";
import React, { FC, useState } from "react";
import { PencilEdit } from "../icons";
import { capitalize } from '../../utils/Capitalize'
import { AuthContextProvider, EventContextProvider } from "../../context";
import ModalLeft from "../Utils/ModalLeft";
import { useDelayUnmount } from "../../utils/Funciones";
import FormCrearEvento from "../Forms/FormCrearEvento";
import { defaultImagenes } from "../Home/Card";
import { ModalAddUserToEvent, UsuariosCompartidos } from "../Utils/Compartir";
import { IoShareSocial } from "react-icons/io5";
import { useAllowed } from "../../hooks/useAllowed"
import { useToast } from "../../hooks/useToast";
import { useTranslation } from 'react-i18next';

interface propsBlockVista {
  children?: React.ReactNode;
}


const BlockVista: FC<propsBlockVista> = ({ children }) => {
  const [state, setState] = useState(0)
  const { event } = EventContextProvider();
  const { t } = useTranslation();

  const seatedGuests: number = event?.invitados_array?.filter(
    (item) => item?.nombre_mesa?.toLowerCase() !== "no asignado"
  )?.length;

  const newDate: Date = new Date(parseInt(event?.fecha));

  const options: object = { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" };
  let count: any

  if (event?.presupuesto_objeto?.coste_estimado) {
    if (event.invitados_array.length) {
      if (seatedGuests !== 0) {
        count = state + 3
      } else {
        count = state + 2
      }
    } else {
      count = state + 1
    }
  } else {
    count = state + 0
  }

  return (
    <>
      <div className="w-full bg-white shadow rounded-xl overflow-hidden relative flex flex-col-reverse md:flex-row md:h-72 gap-12  md:gap-0 pt-10 md:pt-0">
        {event?.tipo && (
          <img
            src={defaultImagenes[event?.tipo]}
            className="md:w-1/2 md:h-full h-60 object-cover object-top rounded-xl"
            alt={event?.nombre}
          />
        )}

        {children}
        <div className="md:w-1/2 h-full flex flex-col items-center justify-center px-8 gap-6 relative">
          <div className="w-max mx-auto inset-x-0 text-center">

            <h1 className="font-display font-semibold text-3xl text-gray-500">
              {event?.nombre}
            </h1>
            <span className="font-display font-base text-sm flex gap-2 mx-auto w-max inset-x-0">
              <p className="text-gray-500">
                {/* @ts-ignore */}
                {newDate.toLocaleDateString("es-VE", options)}
              </p>
              -<p className="text-primary">{event?.tipo == "otro" ? "Mi Evento Especial" : event?.tipo && capitalize(event?.tipo)}</p>
            </span>
          </div>

          <div className="w-full">
            <span className="w-full justify-between flex">
              <p className="font-display text-xs text-gray-500">{t("state")}</p>
              <p className="font-display text-xs text-gray-500">
                {t("letscelebratestarted")}
              </p>
            </span>
            {/* <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              
              <svg className="bg-primary h-full" width={ count <= 1 ? "20%": "50%" || count > 2? "100%": "60%" }  />
            </div> */}
            <StateBar />
          </div>

          <div className="w-full justify-between flex">
            <div className="w-1/3 grid place-items-center">
              <p className="font-display text-lg font-base text-gray-500">
                {count} {t("de 3")}
              </p>
              <p className="font-display text-center text-xs font-base text-gray-500 first-letter:capitalize">
                {t("stepstocompleteyourevent")}
              </p>
            </div>

            <div className="w-1/3 grid place-items-center">
              <p className="font-display text-lg font-base text-gray-500">
                {event?.invitados_array?.length}
              </p>
              <p className="font-display text-xs font-base text-gray-500 pb-4  first-letter:capitalize">
                {`${t("invitado")}${event?.invitados_array?.length > 1 ? "s" : ""}`}
              </p>
            </div>

            <div className="w-1/3 grid place-items-center">
              <p className="font-display text-lg font-base text-gray-500">
                {seatedGuests} de {event?.invitados_array?.length}
              </p>
              <p className="font-display text-xs text-center font-base text-gray-500 first-letter:capitalize">
                {t("guestsseatedatyourevent")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const BlockPrincipal: FC = () => {
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const shouldRenderChild = useDelayUnmount(isMounted, 500);
  const { event } = EventContextProvider()
  const { user } = AuthContextProvider()
  const [openModal, setOpenModal] = useState(false)
  const [isAllowed, ht] = useAllowed()
  const { t } = useTranslation();



  const handleEdit = (): void => {
    setIsMounted(!isMounted);
  };

  return (
    <>
      <ModalAddUserToEvent openModal={openModal} setOpenModal={setOpenModal} event={event} />
      {shouldRenderChild && (
        <ModalLeft set={setIsMounted} state={isMounted}>
          <FormCrearEvento set={setIsMounted} state={isMounted} EditEvent={true} />
        </ModalLeft>
      )}
      <BlockVista >
        <div className="absolute top-3 right-5 flex gap-2 z-30">
          <div onClick={() => { event?.usuario_id === user?.uid && setOpenModal(!openModal) }} className="w-1 h-1 -translate-y-0.5">
            <UsuariosCompartidos event={event} />
          </div>
          <span
            className={`transition transform z-30 ${event?.usuario_id === user?.uid && user?.displayName !== "guest" ? "hover:scale-110 cursor-pointer text-primary" : "text-gray-300"}`}
            onClick={() => { event?.usuario_id === user?.uid && user?.displayName !== "guest" && setOpenModal(!openModal) }}>
            <IoShareSocial className="w-6 h-6" />
          </span>
          <span
            className={`transition transform hover:scale-110 *hover:rotate-12 ${isAllowed() && "cursor-pointer"} z-30`}
            onClick={() => isAllowed() && handleEdit()}
          >
            <PencilEdit className={`w-6 h-6 ${isAllowed() ? "text-primary" : "text-gray-300"}`} />
          </span >
        </div >
      </BlockVista >
    </>
  );
};
export default BlockPrincipal;

const BlockEditar = ({ set, state }) => {
  const { event } = EventContextProvider()
  const { t } = useTranslation();

  return (
    <div className="w-full bg-white shadow rounded-xl overflow-hidden relative flex flex-col-reverse md:flex-row md:h-72 gap-12 md:gap-0 p-8">
      <div className="col-span-2 border-l-2 border-gray-100 pl-3 h-20 w-full ">
        <h2 className="font-display text-3xl capitalize text-primary font-light flex-col flex">
          {t("edit")}{" "}
          <span className="font-display text-5xl capitalize text-gray-500 font-medium">
            {t("event")}
          </span>
        </h2>
        <button className="button-primary" onClick={set(!state)}>{t("cancel")}</button>
      </div>
    </div >
  );
};

export const StateBar = () => {
  const [state, setState] = useState(0)
  const { event } = EventContextProvider();
  const { t } = useTranslation();
  const seatedGuests: number = event?.invitados_array?.filter(
    (item) => item?.nombre_mesa?.toLowerCase() !== "no asignado"
  )?.length;
  let count: any

  if (event?.presupuesto_objeto?.coste_estimado) {
    if (event.invitados_array.length) {
      if (seatedGuests !== 0) {
        count = state + 3
      } else {
        count = state + 2
      }
    } else {
      count = state + 1
    }
  }

  return (
    <>
      {(() => {
        if (count >= 1) {
          if (count >= 2) {
            if (count >= 3) {
              return (
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden ">
                  <svg className="bg-primary h-full" width="100%" />
                </div>
              )
            } else {
              return (
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <svg className="bg-primary h-full" width="70%" />
                </div>
              )
            }
          } else {
            return (
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <svg className="bg-primary h-full" width="50%" />
              </div>
            )
          }
        } else {
          return (
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <svg className="bg-primary h-full" width="20%" />
            </div>
          )
        }
      })()}
    </>
  )
}