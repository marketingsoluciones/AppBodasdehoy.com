import Link from "next/link";
import React, { FC, useContext } from "react";
import { EventContextProvider } from "../../context";
import { MesaIcon } from "../icons";
import { guests } from '../../utils/Interfaces';
import { useAllowed } from "../../hooks/useAllowed";
import { useRouter } from "next/navigation";
import { useTranslation } from 'react-i18next';

const BlockMesas: FC = () => {
  const { event } = EventContextProvider()
  const [isAllowed, ht] = useAllowed()
  const router = useRouter()
  const { t } = useTranslation();

  const InvitadoSentados: guests[] = event?.invitados_array?.filter(
    (invitado) => invitado?.nombre_mesa?.toLowerCase() !== "no asignado"
  );

  const ListaBlockMesas: { amount: number | string, subtitle: string }[] = [
    { amount: event?.mesas_array?.length, subtitle: "total de mesas" },
    { amount: `${InvitadoSentados?.length} de ${event?.invitados_array?.length}`, subtitle: "invitados sentados" },
  ]

  return (
    <div className="w-full md:w-3/5 box-border">
      <h2 className="font-display text-xl font-semibold text-gray-500 pb-2 text-left first-letter:capitalize">
        {t("mytables")}
      </h2>
      <div className="w-full shadow rounded-xl bg-white py-4 gap-4 md:gap-16 flex flex-col md:flex-row h-max items-center justify-center">

        <div className=" flex flex-col space-y-3 md:space-y-1 ">
          {
            event?.planSpace?.map((item, idx) => {
              return (
                <div key={idx} className="grid md:grid-cols-3 justify-items-center items-center space-y-2">
                  <div className="text-regular font-display text-xs text-gray-700 capitalize col-span-1 font-semibold ">
                    {t(item?.title || "")}
                  </div>
                  <div className="flex space-x-10 col-span-2">

                    <span className="flex flex-col justify-center items-center gap-2* w-max">
                      <MesaIcon className="text-gray-500 w-9 " />
                      <p className="font-display font-semibold text-xl text-gray-700">
                        {item?.tables.length}
                      </p>
                      <p className="font-display  text-xs text-gray-700 w-full capitalize">
                        {t("totaltables")}
                      </p>
                    </span>

                    <span className="flex flex-col justify-center items-center gap-2* w-max">
                      <MesaIcon className="text-gray-500 w-9" />
                      {(() => {
                        if (item?.tables?.length != 0) {
                          const invi = item?.tables?.map((item) => {
                            return item.guests
                          })
                          const inviReduce = invi?.flat()
                          return (
                            < p key={idx} className="font-display font-semibold text-xl text-gray-700" >
                              {inviReduce?.length} de {event?.invitados_array?.length}

                            </p>
                          )
                        } else {
                          return (
                            <p key={idx} className="font-display font-semibold text-xl text-gray-700">
                              0
                            </p>
                          )
                        }
                      })()}
                      <p className="font-display font-base text-xs text-gray-700 w-full capitalize">
                        {t("seatedguests")}
                      </p>
                    </span>

                  </div>
                </div>
              )
            })
          }
        </div>

        <div onClick={() => !isAllowed("mesas") ? ht() : router.push("/mesas")}>
          <button className="rounded-lg border border-primary px-2 font-display text-primary text-sm py-1 hover:text-white hover:bg-primary transition focus:outline-none">
            {t("viewtables")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BlockMesas;
