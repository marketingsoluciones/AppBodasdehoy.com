import { memo, useEffect, useState } from "react";
import { AuthContextProvider, EventContextProvider, EventsGroupContextProvider } from "../../context/";
import useHover from "../../hooks/useHover";
import { BorrarIcon, IconFolderOpen } from "../icons";
import { useRouter } from "next/router";
import { setCookie } from "../../utils/Cookies";
import { fetchApiBodas, fetchApiEventos, queries } from "../../utils/Fetching";
import { useToast } from '../../hooks/useToast'
import { Lista } from "../../pages";
import { IoShareSocial } from "react-icons/io5";
import { AddUserToEvent, UsuariosCompartidos } from "../Utils/Compartir"
import { Modal } from "../Utils/Modal";

export const defaultImagenes = {
  boda: "/cards/boda.webp",
  comunión: "/cards/comunion.webp",
  cumpleaños: "/cards/cumpleanos.webp",
  bautizo: "/cards/bautizo.webp",
  babyshower: "/cards/baby.webp",
  "desdepida de soltero": "/cards/despedida.webp",
  graduación: "/cards/graduacion.webp",
  otro: "/cards/pexels-pixabay-50675.jpg"
};

const Card = ({ data, grupoStatus, idx, setOpenModal, openModal, setIdEvent }) => {
  const [hoverRef, isHovered] = useHover();
  const [refArchivar, isArchivar] = useHover();
  const [refBorrar, isBorrar] = useHover();
  const { user, setUser, config } = AuthContextProvider()
  const { eventsGroup, setEventsGroup } = EventsGroupContextProvider();
  const { event, setEvent, idxGroupEvent, setIdxGroupEvent } = EventContextProvider();
  const router = useRouter();




  const handleClick = () => {
    try {
      console.log(10004, user?.uid)
      fetchApiBodas({
        query: queries.updateUser,
        variables: {
          uid: user?.uid,
          variable: "eventSelected",
          valor: data[idx]?._id
        },
        development: config?.development
      })
      user.eventSelected = data[idx]?._id
      setUser(user)
      setEvent(data[idx]);
    } catch (error) {
      console.log(error);
    } finally {
      router.push("/resumen-evento");
    }
  };

  const toast = useToast()

  const handleArchivarEvent = () => {
    try {
      const value = grupoStatus === "pendiente" ? "archivado" : "pendiente"
      const result = fetchApiEventos({
        query: queries.eventUpdate,
        variables: { idEvento: data[idx]?._id, variable: "estatus", value },
        token: null
      })
      if (!result || result.errors) {
        throw new Error("Ha ocurrido un error")
      }
      setEventsGroup({
        type: "EDIT_EVENT",
        payload: {
          _id: data[idx]?._id,
          estatus: value
        }
      })

      if (grupoStatus === "archivado") {
        setEvent(data[idx])
        setTimeout(() => {
          setIdxGroupEvent({ idx: 0, isActiveStateSwiper: 0, event_id: data[idx]?._id })
        }, 50);
        router.push("/resumen-evento");
      }

      if (idxGroupEvent?.idx == idx && value == "archivado") {
        const valir = (data?.length - idx) > 1
        setTimeout(() => {
          setEvent(data[valir ? idx + 1 : idx - 1]);
          setIdxGroupEvent({ ...idxGroupEvent, idx: valir ? idx : idx - 1, event_id: data[idx]?._id })
        }, 50);
      }



      toast("success", `${value == "archivado" ? `El evento ${data[idx].tipo} de "${data[idx].nombre.toUpperCase()}" se ha archivado` : `El evento ${data[idx].tipo} de "${data[idx].nombre.toUpperCase()}" se ha desarchivado`}`)
    } catch (error) {
      toast("error", "Ha ocurrido un error al archivar el evento")
      console.log(error)
    }
  }

  const handleRemoveEvent = (grupoStatus) => {
    try {
      const result = fetchApiEventos({
        query: queries.eventDelete,
        variables: { eventoID: data[idx]?._id }
      })
      if (!result || result.errors) {
        throw new Error("Ha ocurrido un error")
      }
      setEventsGroup({ type: "DELETE_EVENT", payload: data[idx]?._id })

      const valir = (data?.length - idx) > 1
      setTimeout(() => {
        setEvent(data[valir ? idx + 1 : idx - 1]);
        setIdxGroupEvent({ ...idxGroupEvent, idx: valir ? idx : idx - 1, event_id: data[idx]?._id })
      }, 50);
      toast("success", "Evento eliminado ")
    } catch (error) {
      toast("error", "Ha ocurrido un error al eliminar el evento")
      console.log(error)
    }
  }



  return (
    <>
      <div ref={hoverRef} className={`w-max h-full relative grid place-items-center bg-white transition ${isHovered ? "transform scale-105 duration-700" : ""}`}>
        <div className={` h-32 w-10  absolute z-[10] right-0  flex flex-col items-center justify-between px-2 `}>
          <div onClick={() => setOpenModal(!openModal)} className="w-max h-max relative" >
            <UsuariosCompartidos evento={data[idx]} className="w-5 h-6 cursor-pointer text-white hover:text-gray-300" />
          </div>
          <div className="space-y-2">
            <div onClick={() => { setOpenModal(!openModal), setIdEvent(data[idx]) }} className="w-max h-max relative" >
              <IoShareSocial className="w-5 h-6 cursor-pointer text-white hover:text-gray-300 -mb-1.5" />
            </div>
            <div onClick={handleArchivarEvent} className="w-max h-max relative" >
              <IconFolderOpen className="w-5 h-6 cursor-pointer text-white hover:text-gray-300" />
            </div>
            <div onClick={handleRemoveEvent} className="w-max h-max relative"   >
              <BorrarIcon className="w-5 h-6 cursor-pointer text-white hover:text-gray-300" />
            </div>
          </div>
        </div>

        {data[idx]?._id == user?.eventSelected ? <div className="w-[304px] h-40 bg-green absolute rounded-xl" /> : <></>}
        <div onClick={handleClick} className={`w-72 h-36 rounded-xl cardEvento z-[8] cursor-pointer shadow-lg relative overflow-hidden `}>
          <img
            src={defaultImagenes[data[idx]?.tipo]}
            className="object-cover w-full h-full absolute top-0 left-0 object-top "
          />
          <div className="relative w-full h-full z-10 p-4 pb-2 flex flex-col justify-between">
            <span className="text-xs font-display text-white capitalize">
              {data[idx]?.tipo == "otro" ? "mi evento especial" : data[idx]?.tipo}
            </span>
            <div className="flex flex-col ">
              <span className="capitalize text-lg font-display text-white">
                {data[idx]?.nombre}
              </span>
              <span className="mt-[-4px] uppercase text-xs font-display text-white">
                {`${new Date(parseInt(data[idx]?.fecha)).toLocaleDateString("es-VE", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" })}`}
              </span>
              <span className="mt-[-4px] uppercase text-xs font-display text-white">
                {data[idx]?.estatus}
              </span>
            </div>
          </div>
        </div>
        <style jsx>
          {`
          .cardEvento::before {
            content: "";
            width: 100%;
            height: 100%;
            background: rgb(255, 255, 255);
            background: radial-gradient(
              circle,
              rgba(41, 41, 41, 0.3) 0%,
              rgba(41, 41, 41, 0.8) 100%
            );
            position: absolute;
            top: 0;
            left: 0;
            z-index: 1;
          }
        `}
        </style>
      </div>
      {/* {
        openModal && (
          <Modal state={openModal} set={setOpenModal} classe={"w-[28%] h-[86%]"} >
              <AddUserToEvent/>
          </Modal>
        )
      } */}
    </>
  );
};

export default memo(Card);
