import { useState } from "react";
import { AuthContextProvider, EventContextProvider } from "../../context";
import { useToast } from "../../hooks/useToast";
import { useAllowed } from "../../hooks/useAllowed";
import { useTranslation } from "react-i18next";
import { api } from "../../api";
import { getCurrency } from "../../utils/Funciones";
import { DotsOpcionesIcon } from "../icons";
import ClickAwayListener from "react-click-away-listener";
import FormEditarCategoria from "../Forms/FormEditarCategoria";
import ModalLeft from "../Utils/ModalLeft";
import { fetchApiBodas, fetchApiEventos, queries } from "../../utils/Fetching";
import { LoadingSpinner } from "../Utils/LoadingSpinner";
import { ModalInterface } from "../../utils/Interfaces";
import { SimpleDeleteConfirmation } from "../Utils/SimpleDeleteConfirmation";
import { handleDelete } from "../TablesComponents/tableBudgetV8.handles";

export const ItemCategoria = ({ item, setShowCategoria }) => {
  const { event, setEvent } = EventContextProvider()
  // const [showMenu, setShowMenu] = useState(false);
  // const [showEditCategorie, setShowEditCategorie] = useState(false);
  const toast = useToast()
  const costeEstimado = event?.presupuesto_objeto?.coste_estimado
  const [isAllowed, ht] = useAllowed()
  const { t } = useTranslation()
  const [loading, setLoading] = useState<boolean>(false);
  const [modal, setModal] = useState<ModalInterface>({ state: false, title: null, values: null })


  const DefinirCoste = (item) => {
    if (item.coste_final >= item.coste_estimado) {
      return item.coste_final
    } else {
      return item.coste_estimado
    }
  }

  // const Lista = [
  //   { title: "Editar", action: () => setShowEditCategorie(true) },
  //   { title: "Borrar", action: (item) => setModal({ state: true, values: item, title: item.nombre }) }
  // ];

  return (
    //aqui
    <li
      onClick={() => costeEstimado != 0 ? setShowCategoria({ state: true, _id: item._id }) : toast("error", t("Agrega un monto a tu Presupuesto Estimado"))}
      className={`bg-white text-xs w-full h-10 justify-center items-center flex flex-col px-5 md:px-2 transition ${costeEstimado == 0 ? "" : "hover:bg-base"} ${item?.id == item._id ? "bg-slate-200" : ""}`}
    >
      {/* {showEditCategorie && (
        <ModalLeft state={showEditCategorie} set={setShowEditCategorie}>
          <FormEditarCategoria categoria={item} state={showEditCategorie} set={setShowEditCategorie} />
        </ModalLeft>
      )} */}
      <span className="flex w-full justify-start items-center font-semibold text-[13px]" >
        {item?.nombre?.toLowerCase()}
      </span>
      <span className="flex justify-end w-full text-[10px]" >
        <div className="flex w-[70%] space-x-3">
          <div className=" w-1/2 flex justify-end items-end">
            <span className="text-xs"> 1000,00</span>
          </div>
          <div className="w-1/2 flex justify-end items-end">
            <span className="text-xs"> 1000,00</span>
          </div>

        </div>
      </span>
      {/* <span className="gap-4 flex items-center h-full md:py-0" >
        <div className="text-[13px]" >
          {getCurrency(DefinirCoste(item), event?.presupuesto_objeto?.currency)}
        </div>
        <div className="relative ">
          <DotsOpcionesIcon
            onClick={() => !isAllowed() ? null : costeEstimado != 0 ? setShowMenu(!showMenu) : null}
            className={`w-3 h-3 ${costeEstimado != 0 ? "cursor-pointer" : ""} `}
          />
          {showMenu && (
            <ClickAwayListener onClickAway={() => showMenu && setShowMenu(false)}>
              <ul className="w-max z-20 bg-white shadow-md rounded absolute top-5 right-0 font-display text-sm divide-y overflow-hidden border-[1px] border-gray-200 select-none">
                {Lista.map((elem, idx) => (
                  <li
                    key={idx}
                    onClick={() => {
                      setShowMenu(!showMenu)
                      console.log(100041, item)
                      elem.action(item)
                    }}
                    className="px-4 py-1 hover:bg-base transition"
                  >
                    {elem.title}
                  </li>
                ))}
              </ul>
            </ClickAwayListener>
          )}
        </div>
      </span> */}

      <style jsx>
        {`
          .itemList {
              width: full;
          }
          @media only screen and (max-width: 1250px) {
              .itemList {
              flex-direction: column;
              
              }
          }
        `}
      </style>
    </li>
  );
};
