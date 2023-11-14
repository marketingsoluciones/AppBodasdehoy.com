import Link from "next/link";
import React, { FC, useContext } from "react";
import { EventContextProvider } from "../../context";
import { MesaIcon } from "../icons";
import { guests } from '../../utils/Interfaces';

const BlockMesas: FC = () => {
  const { event } = EventContextProvider()
  console.log(event)

  const InvitadoSentados: guests[] = event?.invitados_array?.filter(
    (invitado) => invitado.nombre_mesa.toLowerCase() !== "no asignado"
  );

  const ListaBlockMesas: { amount: number | string, subtitle: string }[] = [
    { amount: event?.mesas_array?.length, subtitle: "total de mesas" },
    { amount: `${InvitadoSentados?.length} de ${event?.invitados_array?.length}`, subtitle: "invitados sentados" },
  ]

  return (
    <div className="w-full md:w-3/5 box-border">
      <h2 className="font-display text-xl font-semibold text-gray-500 pb-2 text-left">
        Mis Mesas
      </h2>
      <div className="w-full shadow rounded-xl bg-white py-4 gap-4 md:gap-16 flex flex-col md:flex-row h-max items-center justify-center">

        <div className="md:w-[50%] flex flex-col space-y-3 md:space-y-1 ">
          {
            event?.planSpace.map((item, idx) => {
              return (
                <div key={idx} className="md:space-x-20">
                  <h1 className="text-regular font-display text-xs text-gray-700 capitalize ">
                    {item.title}
                  </h1>
                  <div className="flex space-x-10">
                    <span className="flex flex-col justify-center items-center gap-2 w-max">
                      <MesaIcon className="text-gray-500 w-8" />
                      <p className="font-display font-semibold text-xl text-gray-700">
                        {item?.tables.length}
                      </p>
                      <p className="font-display  text-xs text-gray-700 w-full">
                        total de mesas
                      </p>
                    </span>
                    <span className="flex flex-col justify-center items-center gap-2 w-max">
                      <MesaIcon className="text-gray-500 h-5* w-8"  />
                      {(() => {
                        if (item.tables.length != 0) {
                          return (
                            <>
                              {
                                item.tables.map((item, idx) => {
                                  return (
                                    <p key={idx} className="font-display font-semibold text-xl text-gray-700">
                                       {item?.guests?.length} 
                                    </p>
                                  )
                                })
                              }
                            </>
                          )
                        } else {
                          return (
                            <p key={idx} className="font-display font-semibold text-xl text-gray-700">
                              0
                            </p>
                          )
                        }
                      })()}
                      <p className="font-display font-base text-xs text-gray-700 w-full">
                        invitados sentados
                      </p>
                    </span>

                  </div>
                </div>
              )
            })
          }
        </div>

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
