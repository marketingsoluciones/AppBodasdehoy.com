import { Dispatch, FC, SetStateAction, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { EventContextProvider } from "../../context";
import { useAllowed } from "../../hooks/useAllowed";
import FormCrearCategoria from "../Forms/FormCrearCategoria";
import ModalLeft from "../Utils/ModalLeft";
import { PlusIcon } from "../icons";
import { ItemCategoria } from "./ItemCategoria";
import { estimate, estimateCategory } from "../../utils/Interfaces";
import { BsThreeDotsVertical } from "react-icons/bs";
import { fetchApiEventos, queries } from "../../utils/Fetching";
import ClickAwayListener from "react-click-away-listener";

interface props {
  categorias_array: estimateCategory[]
  setShowCategoria: Dispatch<SetStateAction<{ state: boolean, _id?: string }>>
  showCategoria: { state: boolean, _id: string }
  showDataState: boolean
}

export const BlockListaCategorias: FC<props> = ({ categorias_array, setShowCategoria, showCategoria, showDataState }) => {
  const { event } = EventContextProvider()
  const { t } = useTranslation();
  const [showCreateCategorie, setShowCreateCategorie] = useState(false);
  const [isAllowed, ht] = useAllowed()
  const [showOptionsModal, setShowOptionsModal] = useState(false)

  useEffect(() => {
    calcularCosteFinal(categorias_array);
  }, [categorias_array, showDataState])

  function calcularCosteFinal(categorias_array) {
    categorias_array?.forEach(categoria => {
      categoria.gastos_array.forEach(gasto => {
        if (Array.isArray(gasto.items_array) && gasto.items_array.length > 0) {
          const totalInvitados = event?.presupuesto_objeto?.totalStimatedGuests?.adults + event?.presupuesto_objeto?.totalStimatedGuests?.children;
          gasto.coste_final = gasto.items_array
            .filter(item => showDataState ? true : item.estatus === false)
            .reduce(
              (total, item) =>

                total + (item.valor_unitario * item.cantidad),

              0
            );
        }
      });
      categoria.coste_final = categoria.gastos_array
        .filter(gasto => showDataState ? true : gasto.estatus === true)
        .reduce(
          (total, gasto) => total + (gasto.coste_final || 0),
          0
        );
    });
  }

 



  console.log("categorias_array", categorias_array)

  return (
    <>
      {showCreateCategorie && (
        <ModalLeft state={showCreateCategorie} set={setShowCreateCategorie}>
          <FormCrearCategoria state={showCreateCategorie} set={setShowCreateCategorie} />
        </ModalLeft>
      )}
      <div className="bg-gray-50 w-full shadow-md rounded-xl relative">
        {showOptionsModal && (
          <ModalOptionsCategoria showOptionsModal={showOptionsModal} setShowOptionsModal={setShowOptionsModal} />
        )}
        <div
          className="focus:outline-none bg-primary rounded-xl font-display font-light text-md 
          flex w-full py-1 items-center justify-between text-white hover:scale-105 transition transform px-2"
        >
          <button onClick={() => !isAllowed() ? ht() : setShowCreateCategorie(true)} className="flex items-center gap-1">

            <PlusIcon className="text-white w-4 h-4" />
            {t("newcategory")}
          </button>
          <button onClick={() => setShowOptionsModal(!showOptionsModal)} className="flex items-center gap-1">
            <BsThreeDotsVertical />
          </button>
        </div>
        <div className="grid grid-cols-6 text-xs">
          <div className="col-span-2 text-center font-semibold text-gray-500 py-2">{t("category")}</div>
          {
            event?.presupuesto_objeto?.viewEstimates &&
            <div className=" transition-all duration-150 col-span-2 text-center font-semibold text-gray-500 py-2">Estimado</div>
          }
          <div className={` ${!event?.presupuesto_objeto?.viewEstimates ? "md:col-span-4 transition-all duration-150 translate-x-0  " : "col-span-2  "} text-center  font-semibold text-gray-500 py-2`}>Total</div>

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

export const ModalOptionsCategoria = ({ showOptionsModal, setShowOptionsModal }) => {
  const { event, setEvent } = EventContextProvider()

  const handleChangeViewEstimates = async (value: boolean) => {
    try {
      const result = await fetchApiEventos({
        query: queries.editPresupuesto,
        variables: {
          evento_id: event?._id,
          viewEstimates: value
        }
      })
      event.presupuesto_objeto = result as estimate
      setEvent({ ...event })
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <ClickAwayListener onClickAway={() => showOptionsModal && setShowOptionsModal(false)}>
      <div className="absolute top-10 right-5 bg-white shadow-lg rounded-lg  z-50">
        <div className="text-xs flex justify-center border-b py-2 ">
          Opciones
        </div>
        <div className="flex items-center gap-2 px-4 py-2">
          <input
            type="checkbox"
            checked={!!event?.presupuesto_objeto?.viewEstimates}
            onChange={e => handleChangeViewEstimates(e.target.checked)}
            id="viewEstimatesCheckbox"
            className="focus:outline-none"
          />
          <label htmlFor="viewEstimatesCheckbox" className="text-xs text-gray-700 cursor-pointer">
            Ver Estimado
          </label>
        </div>
      </div>
    </ClickAwayListener>
  )
}