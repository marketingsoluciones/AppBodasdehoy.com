import { Dispatch, FC, SetStateAction, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { EventContextProvider } from "../../context";
import { useAllowed } from "../../hooks/useAllowed";
import FormCrearCategoria from "../Forms/FormCrearCategoria";
import ModalLeft from "../Utils/ModalLeft";
import { PlusIcon } from "../icons";
import { ItemCategoria } from "./ItemCategoria";
import { estimateCategory } from "../../utils/Interfaces";

interface props {
  categorias_array: estimateCategory[]
  setShowCategoria: Dispatch<SetStateAction<{ state: boolean, _id?: string }>>
  showCategoria: { state: boolean, _id: string }
}

export const BlockListaCategorias: FC<props> = ({ categorias_array, setShowCategoria, showCategoria }) => {
  const { event } = EventContextProvider()
  const { t } = useTranslation();
  const [showCreateCategorie, setShowCreateCategorie] = useState(false);
  const [isAllowed, ht] = useAllowed()

  return (
    <>
      {showCreateCategorie && (
        <ModalLeft state={showCreateCategorie} set={setShowCreateCategorie}>
          <FormCrearCategoria state={showCreateCategorie} set={setShowCreateCategorie} />
        </ModalLeft>
      )}
      <div className="bg-gray-50 w-full shadow-md rounded-xl">
        <button
          onClick={() => !isAllowed() ? ht() : setShowCreateCategorie(true)}
          className="focus:outline-none bg-primary rounded-xl font-display font-light text-md flex gap-2 w-full py-1 items-center justify-center text-white hover:scale-105 transition transform"
        >
          <PlusIcon className="text-white w-4 h-4" />
          {t("newcategory")}
        </button>
        <div className="grid grid-cols-6 text-xs">
          <div className="col-span-1 md:col-span-2 text-center font-semibold text-gray-500 py-2">{t("category")}</div>
          {
          event?.presupuesto_objeto?.viewEstimates &&
            <div className=" transition-all duration-150 col-span-1 md:col-span-2 text-center font-semibold text-gray-500 py-2">Estimado</div>
          }
          <div className={` ${!event?.presupuesto_objeto?.viewEstimates ? "col-span-4 transition-all duration-150 translate-x-0  " : "col-span-2 "} text-center  font-semibold text-gray-500 py-2`}>Total</div>

        </div>
        <ul className={`w-full flex flex-col text-sm h-44 overflow-y-auto md:h-[400px] divide-y text-gray-600 cursor-pointer`}>
          {categorias_array?.map((item, idx) => (
            <ItemCategoria key={idx} item={item} setShowCategoria={setShowCategoria} showCategoria={showCategoria} />
          ))}
        </ul>
      </div>
      <style jsx>
        {`
        div {
          height: max-content
        }
        `}
      </style>
    </>
  );
};