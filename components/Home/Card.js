import { memo } from "react";
import {
  EventContextProvider,
  EventsGroupContextProvider,
} from "../../context/";
import { EliminarEvento } from "../../hooks/QueryEventos";
import useHover from "../../hooks/useHover";
import { BorrarIcon, EditarIcon, VistaPreviaIcon } from "../icons";
import { useRouter } from "next/router";
import { setCookie } from "../../utils/Cookies";
import { fetchApiEventos, queries } from "../../utils/Fetching";
import {useToast} from '../../hooks/useToast'

const Card = ({ evento }) => {
  const [hoverRef, isHovered] = useHover();
  const [refVista, isVista] = useHover();
  const [refEditar, isEditar] = useHover();
  const [refBorrar, isBorrar] = useHover();

  const { setEventsGroup } = EventsGroupContextProvider();
  const { setEvent } = EventContextProvider();

  const router = useRouter();

  const { tipo, nombre, _id } = evento;

  const handleClick = () => {
    try {
      setEvent(evento);
      setCookie("evento_id", _id, 1);
    } catch (error) {
      console.log(error);
    } finally {
      router.push("/resumen-evento");
    }
  };

  const imagen = {
    boda: "/cards/boda.webp",
    comunión: "/cards/comunion.webp",
    cumpleaños: "/cards/cumpleanos.webp",
    bautizo: "/cards/bautizo.webp",
    babyshower: "/cards/baby.webp",
    "desdepida de soltero": "/cards/despedida.webp",
    graduación: "/cards/graduacion.webp",
    otro:"/cards/pexels-pixabay-50675.jpg"
  };

  const toast = useToast()
  const handleRemoveEvent = () => {
    try {
      const result = fetchApiEventos({query: queries.eventDelete, variables: {eventoID: _id}})
      if(!result || result.errors){
        throw new Error("Ha ocurrido un error")
      }
      setEventsGroup({type: "DELETE_EVENT", payload: _id})
      toast("success", "Evento eliminado con exito")
    } catch (error) {
      toast("error", "Ha ocurrido un error al eliminar el evento")
      console.log(error)
    }
  }

  return (
    <div
      ref={hoverRef}
      className={`w-max h-full relative grid place-items-center bg-white transition ${
        isHovered ? "transform scale-105 duration-700" : ""
      }`}
    >
      <div
        className={`${
          isHovered ? "transform translate-x-1/2 duration-700" : ""
        } transition h-32 w-16 bg-secondary absolute right-0  rounded-xl flex flex-col items-end justify-center px-2 gap-5 `}
      >
        {/* <span 
        ref={refVista}>
          <VistaPreviaIcon className="cursor-pointer text-white hover:text-gray-500" />
          {isVista ? (
            <span className="bg-white absolute transition w-max h-max rounded-xl px-3 py-1 shadow font-display text-sm text-gray-500 top-2 right-0 transform translate-x-full">
              Ver
            </span>
          ) : null}
        </span> */}

        {/* <span className="w-max h-max" ref={refEditar}>
          <EditarIcon className="cursor-pointer text-white hover:text-gray-500" />
          {isEditar ? (
            <span className="bg-white absolute transition w-max h-max rounded-xl px-3 py-1 shadow font-display text-sm text-gray-500 top-12 right-0 transform translate-x-full">
              Editar
            </span>
          ) : null}
        </span> */}

        <span
          onClick={handleRemoveEvent}
          className="w-max h-max"
          ref={refBorrar}
        >
          <BorrarIcon className="cursor-pointer text-white hover:text-gray-500" />
          {isBorrar ? (
            <span className="bg-white absolute transition w-max h-max rounded-xl px-3  shadow font-display text-sm text-gray-500 top-14  right-0 transform translate-x-full">
              Borrar
            </span>
          ) : null}
        </span>
      </div>
      <div
        onClick={handleClick}
        className="w-72 h-36 rounded-xl cardEvento p-6 flex flex-col justify-between cursor-pointer shadow-lg relative overflow-hidden"
      >
        <img
          src={imagen[tipo]}
          className="object-cover w-full h-full absolute top-0 left-0 z-0 object-top "
        />
        <p className="text-xs font-display text-white capitalize z-10 relative">
          {tipo == "otro" ? "mi evento especial": tipo}
        </p>
        <h2 className="capitalize text-lg font-display text-white z-10 relative">
          {nombre}
        </h2>
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
  );
};

export default memo(Card);
