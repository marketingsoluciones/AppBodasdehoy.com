import Image from "next/image";
import React, { FC, useState } from "react";
import { PencilEdit } from "../icons";
import { capitalize } from '../../utils/Capitalize'
import { EventContextProvider } from "../../context";
import ModalLeft from "../Utils/ModalLeft";
import { useDelayUnmount } from "../../utils/Funciones";
import FormCrearEvento from "../Forms/FormCrearEvento";

interface propsBlockVista {
  children?: React.ReactNode;
}

const BlockVista: FC<propsBlockVista> = ({ children }) => {
  const { event } = EventContextProvider();
  const images: object = {
    boda: "/cards/boda.webp",
    comunión: "/cards/comunion.webp",
    cumpleaños: "/cards/cumpleanos.webp",
    bautizo: "/cards/bautizo.webp",
    babyshower: "/cards/baby.webp",
    "desdepida de soltero": "/cards/despedida.webp",
    graduación: "/cards/graduacion.webp"

  };

  const seatedGuests: number = event?.invitados_array?.filter(
    (item) => item?.nombre_mesa?.toLowerCase() !== "no asignado"
  )?.length;

  const newDate: Date = new Date(parseInt(event?.fecha));

  const options: object = { year: "numeric", month: "long", day: "numeric" };

  return (
    <>
      <span className="text-gray-500 text-xs gap-0">
        ID: {event?._id}
      </span>

      <div className="w-full bg-white shadow rounded-xl overflow-hidden relative flex flex-col-reverse md:flex-row md:h-72 gap-12  md:gap-0 pt-6 md:pt-0">
        {event?.tipo && (
          <img
            src={images[event?.tipo]}
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
              -<p className="text-primary">{event?.tipo && capitalize(event?.tipo)}</p>
            </span>
          </div>

          <div className="w-full">
            <span className="w-full justify-between flex">
              <p className="font-display text-xs text-gray-500">Estado</p>
              <p className="font-display text-xs text-gray-500">
                ¡A celebrar! ¿Empezamos?
              </p>
            </span>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <svg className="bg-primary h-full" width="46%" />
            </div>
          </div>

          <div className="w-full justify-between flex">
            <div className="w-1/3 grid place-items-center">
              <p className="font-display text-lg font-base text-gray-500">
                2 de 13
              </p>
              <p className="font-display text-xs font-base text-gray-500">
                servicios contratados
              </p>
            </div>

            <div className="w-1/3 grid place-items-center">
              <p className="font-display text-lg font-base text-gray-500">
                {event?.invitados_array?.length}
              </p>
              <p className="font-display text-xs font-base text-gray-500">
                invitado{event?.invitados_array?.length > 1 ? "s" : ""}
              </p>
            </div>

            <div className="w-1/3 grid place-items-center">
              <p className="font-display text-lg font-base text-gray-500">
                {seatedGuests} de {event?.invitados_array?.length}
              </p>
              <p className="font-display text-xs font-base text-gray-500">
                invitados sentados
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

  const handleEdit = (): void => {
    setIsMounted(!isMounted);
  };
  return (
    <>
      {shouldRenderChild && (
        <ModalLeft set={setIsMounted} state={isMounted}>
          <FormCrearEvento set={setIsMounted} state={isMounted} initialValues={event} />
        </ModalLeft>
      )}
      <BlockVista >
        <span
          className="absolute top-5 right-5 transition transform hover:scale-105 hover:rotate-12 cursor-pointer z-30"
          onClick={handleEdit}
        >
          <PencilEdit className="w-5 h-5 text-primary" />
        </span>
      </BlockVista>
    </>
  );
};
export default BlockPrincipal;

const BlockEditar = ({ set, state }) => {
  return (
    <div className="w-full bg-white shadow rounded-xl overflow-hidden relative flex flex-col-reverse md:flex-row md:h-72 gap-12 md:gap-0 p-8">
      <div className="col-span-2 border-l-2 border-gray-100 pl-3 h-20 w-full ">
        <h2 className="font-display text-3xl capitalize text-primary font-light flex-col flex">
          Editar{" "}
          <span className="font-display text-5xl capitalize text-gray-500 font-medium">
            Evento
          </span>
        </h2>
        <button className="button-primary" onClick={set(!state)}>Cancelar</button>
      </div>
    </div>
  );
};
