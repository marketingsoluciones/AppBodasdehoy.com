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
      <div className="bg-gray-50 w-full shadow-md rounded-xl h-max*">
        <button
          onClick={() => !isAllowed() ? ht() : setShowCreateCategorie(true)}
          className="focus:outline-none bg-primary rounded-xl font-display font-light text-md flex gap-2 w-full py-1 items-center justify-center text-white hover:scale-105 transition transform"
        >
          <PlusIcon className="text-white w-4 h-4" />
          {t("newcategory")}
        </button>
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