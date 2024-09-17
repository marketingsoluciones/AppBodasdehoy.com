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
import { ModalAddUserToEvent, UsuariosCompartidos } from "../Utils/Compartir"
import { useTranslation } from "react-i18next";

export const defaultImagenes = {
  boda: "/cards/boda.webp",
  comunión: "/cards/comunion.webp",
  cumpleaños: "/cards/cumpleanos.webp",
  bautizo: "/cards/bautizo.webp",
  babyshower: "/cards/baby.webp",
  "despedida de soltero": "/cards/despedida.webp",
  graduación: "/cards/graduacion.webp",
  otro: "/cards/pexels-pixabay-50675.jpg"
};

export const handleClickCard = ({ final = true, data, user, setUser, config, setEvent, router }) => {
  try {
    fetchApiBodas({
      query: queries.updateUser,
      variables: {
        uid: user?.uid,
        variable: "eventSelected",
        valor: data?._id
      },
      development: config?.development
    })
    user.eventSelected = data?._id
    setUser(user)
  } catch (error) {
    console.log(error);
  } finally {
    if (final) {
      if (data?.permissions) {
        const permissions = data?.permissions?.filter(elem => ["view", "edit"].includes(elem.value))
        if (permissions.length) {
          const f1 = permissions.findIndex(elem => elem.value === "resumen")
          if (f1 > -1) {
            setEvent(data);
            router.push("/resumen-evento");
          } else {
            setEvent(data);
            let p = permissions[0].title
            if (p === "regalos") p = "lista-regalos"
            if (p === "resumen") p = "resumen-evento"
            router.push("/" + p);
          }
        } else {
          return "No tienes permiso, contacta al organizador del evento"
        }
      } else {
        setEvent(data);
        router.push("/resumen-evento");
      }
    }
  }
};

const Card = ({ data, grupoStatus, idx }) => {
  const { t } = useTranslation()
  const [hoverRef, isHovered] = useHover();
  const [refArchivar, isArchivar] = useHover();
  const [refBorrar, isBorrar] = useHover();
  const { user, setUser, config, actionModals, setActionModals } = AuthContextProvider()
  const { eventsGroup, setEventsGroup } = EventsGroupContextProvider();
  const { event, setEvent, idxGroupEvent, setIdxGroupEvent } = EventContextProvider();
  const router = useRouter();
  const [openModal, setOpenModal] = useState(false)
  const [received, setReceived] = useState({ channel: "", msg: null, d: null })

  const toast = useToast()

  const handleArchivarEvent = () => {

    if (false) {
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
    } else {
      setActionModals(!actionModals)
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

  useEffect(() => {
    if (eventsGroup?.length === 1) {
      const resp = handleClickCard({ final: false, config, data: data[idx], setEvent, user, setUser, router })
      if (resp) toast("warning", resp)
    }
  }, [])


  return (
    <>
      <ModalAddUserToEvent openModal={openModal} setOpenModal={setOpenModal} event={data[idx]} />
      <div ref={hoverRef} className={`w-max h-full relative grid place-items-center bg-white transition ${isHovered ? "transform scale-105 duration-700" : ""}`}>
        <div className={` h-32 w-10  absolute z-[10] right-0  flex flex-col items-center justify-between px-2 `}>
          <div onClick={() => { data[idx]?.usuario_id === user?.uid && setOpenModal(!openModal) }} className="w-max h-max relative" >
            <UsuariosCompartidos event={data[idx]} />
          </div>
          {data[idx]?.usuario_id === user?.uid && <div className="space-y-2">
            <div onClick={() => {
              if (user?.displayName !== "guest") {
                setTimeout(() => {
                  const resp = handleClickCard({ final: false, config, data: data[idx], setEvent, user, setUser, router, toast })
                  if (resp) toast("warning", resp)
                }, 100);
                setOpenModal(!openModal)
              }
            }} className="w-max h-max relative" >
              <IoShareSocial className={`w-6 h-6 cursor-pointer text-white ${user?.displayName !== "guest" && "hover:text-gray-300"} -translate-x-1`} />
            </div>
            <div onClick={handleArchivarEvent} className="w-max h-max relative" >
              <IconFolderOpen className="w-5 h-6 cursor-pointer text-white hover:text-gray-300" />
            </div>
            <div onClick={handleRemoveEvent} className="w-max h-max relative"   >
              <BorrarIcon className="w-4 h-5 cursor-pointer text-white hover:text-gray-300" />
            </div>
          </div>}
        </div>

        {data[idx]?._id == user?.eventSelected ? <div className="w-[304px] h-40 border-dashed border-2 border-yellow-300 absolute rounded-xl" /> : <></>}
        <div onClick={() => {
          const resp = handleClickCard({ final: true, config, data: data[idx], setEvent, user, setUser, router })
          if (resp) toast("warning", resp)
        }} className={`w-72 h-36 rounded-xl cardEvento z-[8] cursor-pointer shadow-lg relative overflow-hidden `}>
          <img
            src={defaultImagenes[data[idx]?.tipo]}
            className="object-cover w-full h-full absolute top-0 left-0 object-top "
          />
          <div className="relative w-full h-full z-10 p-4 pb-2 flex flex-col justify-between">
            <span className="text-xs font-display text-white capitalize">
              {data[idx]?.tipo == "otro" ? "mi evento especial" : t(data[idx]?.tipo)}
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
    </>
  );
};

export default memo(Card);
