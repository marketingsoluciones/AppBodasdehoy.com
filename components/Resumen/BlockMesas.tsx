import Link from "next/link";
import React, { FC, useContext } from "react";
import {EventContextProvider} from "../../context";
import { MesaIcon } from "../icons";
import { guests } from '../../utils/Interfaces';

const BlockMesas : FC = () => {
  const { event } = EventContextProvider()
  
  const InvitadoSentados : guests[] = event?.invitados_array?.filter(
    (invitado) => invitado.nombre_mesa.toLowerCase() !== "no asignado"
  );

  const ListaBlockMesas : {amount: number | string, subtitle: string}[] = [
    {amount: event?.mesas_array?.length, subtitle: "total de mesas"},
    {amount: `${InvitadoSentados?.length} de ${event?.invitados_array?.length}`, subtitle: "invitados sentados"},

  ]
  
  return (
    <div className="w-full md:w-3/5 box-border">
      <h2 className="font-display text-xl font-semibold text-gray-500 pb-2 text-left">
        Mis Mesas
      </h2>
      <div className="w-full shadow rounded-xl bg-white py-4 gap-4 md:gap-16 flex h-40 items-center justify-center">
        {ListaBlockMesas.map((item, idx) => (
          <span key={idx} className="flex flex-col justify-center items-center gap-2 w-max">
            <MesaIcon className="text-gray-500"/>
            <p className="font-display font-semibold text-xl text-gray-700">
              {item?.amount}
            </p>
            <p className="font-display font-base text-xs text-gray-700 w-full">
              {item?.subtitle}
            </p>
          </span>
        ))}

        <Link href="/mesas">
        <button className="rounded-lg border border-primary px-2 font-display text-primary text-sm py-1 hover:text-white hover:bg-primary transition focus:outline-none">
          Ver mesas
        </button>
        </Link>
      </div>
    </div>
  );
};

export default BlockMesas;
