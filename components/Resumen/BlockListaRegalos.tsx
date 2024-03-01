import React, { FC } from "react";
import router from "next/router";
import { useAllowed } from "../../hooks/useAllowed";

const BlockListaRegalos: FC = () => {
  const ListaBlockRegalos: { amount: number, subtitle: string }[] = [
    { amount: 1000, subtitle: "Recaudados" },
    { amount: 10, subtitle: "Participantes" },
  ]
  const [isAllowed, ht] = useAllowed()

  return (
    <div className="w-full md:w-2/5 box-border">
      <h2 className="font-display text-xl font-semibold text-gray-500 pb-2 text-left">
        Lista de Regalos
      </h2>
      <div className="w-full shadow rounded-xl bg-white py-4 flex flex-col items-center gap-2 justify-center">
        <div className="flex-col gap-3 flex">
          {ListaBlockRegalos.map((item, idx) => (
            <span key={idx} className="grid grid-cols-2 items-center gap-2 w-max">
              <p className="font-display font-semibold justify-end text-xl text-gray-700 flex ">
                {item?.amount} {item?.subtitle?.toLowerCase() == "recaudados" ? <span>€</span> : null}
              </p>
              <p className="font-display font-base text-xs mx-auto left-0 text-gray-500 w-full">
                {item?.subtitle}
              </p>
            </span>
          ))}
        </div>

        <button onClick={() => !isAllowed("lista") ? ht() : router.push("/lista-regalos")} className="bg-tertiary w-2/3 rounded-lg font-display text-gray-700 text-sm py-1 hover:bg-gray-300 hover:text-white transition focus:outline-none">
          Activar lista
        </button>
      </div>
    </div>
  );
};

export default BlockListaRegalos;
