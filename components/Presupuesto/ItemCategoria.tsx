import { Dispatch, FC, SetStateAction, useEffect, useState } from "react";
import { EventContextProvider } from "../../context";
import { useToast } from "../../hooks/useToast";
import { useAllowed } from "../../hooks/useAllowed";
import { useTranslation } from "react-i18next";
import { getCurrency } from "../../utils/Funciones";
import { DotsOpcionesIcon } from "../icons";
import ClickAwayListener from "react-click-away-listener";
import FormEditarCategoria from "../Forms/FormEditarCategoria";
import ModalLeft from "../Utils/ModalLeft";
import { estimateCategory, ModalInterface } from "../../utils/Interfaces";
import { SimpleDeleteConfirmation } from "../Utils/SimpleDeleteConfirmation";
import { handleDelete } from "../TablesComponents/tableBudgetV8.handles";
import { EditableLabelWithInput } from "../Forms/EditableLabelWithInput";
import { fetchApiEventos, queries } from "../../utils/Fetching";
import { MdOutlineDeleteOutline } from "react-icons/md";

interface props {
  item: estimateCategory
  setShowCategoria: Dispatch<SetStateAction<{ state: boolean, _id?: string }>>
  showCategoria: { state: boolean, _id: string }
}

export const ItemCategoria: FC<props> = ({ item, setShowCategoria, showCategoria }) => {
  const { event, setEvent } = EventContextProvider()
  const toast = useToast()
  const [isAllowed, ht] = useAllowed()
  const { t } = useTranslation()
  const [loading, setLoading] = useState<boolean>(false);
  const [showModalDelete, setShowModalDelete] = useState<ModalInterface>({ state: false, title: null, values: null })

  const handleOnBlur = ({ value, accessor }) => {
    try {
      fetchApiEventos({
        query: queries.editCategoria,
        variables: {
          evento_id: event?._id,
          categoria_id: item._id,
          nombre: value !== "" ? value : "nueva categoria"
        }
      }).then(() => {
        setEvent(old => {
          console.log("value", value)
          const index = old?.presupuesto_objeto?.categorias_array?.findIndex(item => item._id == item._id)
          old.presupuesto_objeto.categorias_array[index].nombre = value !== "" ? value : "nueva categoria"
          return { ...old }
        });
        toast("success", t("suscess"))
      })
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <>
      {showModalDelete.state &&
        <SimpleDeleteConfirmation
          loading={loading}
          setModal={setShowModalDelete}
          handleDelete={() => handleDelete({ showModalDelete, event, setEvent, setLoading, setShowModalDelete })}
          message={
            <p className="text-azulCorporativo mx-8 text-center" >
              {`Estas seguro de borrar Categoria: `}
              <span className='font-semibold capitalize'>
                {showModalDelete.title}
              </span>
            </p>}
        />}
      <li
        onClick={() => {
          setShowCategoria(item._id === showCategoria._id ? { state: false } : { state: true, _id: item._id })
        }}
        className={`text-xs w-full py-0.5 md:py-0 md:h-11 justify-center items-center flex pl-5 md:pl-2 transition hover:bg-base ${showCategoria?._id == item._id ? "bg-slate-200" : "bg-white"}`}
      >
        <div className="grid grid-cols-10 text-xs w-full">
          <div className="col-span-4 flex capitalize"
            onClick={(e) => e.stopPropagation()}
          >
            <EditableLabelWithInput
              value={item?.nombre}
              type={null}
              handleChange={handleOnBlur}
              accessor={null}
              textAlign="left"/>
          </div>
          <div className="col-span-3 flex justify-end items-center">
            {event?.presupuesto_objeto?.viewEstimates &&
              <span >
                {getCurrency(item?.coste_estimado)}
              </span>

            }
          </div>
          <div className="col-span-3 flex justify-end items-center overflow-hidden truncate">
            <span >
              {getCurrency(item.coste_final)}
            </span>
          </div>
        </div>
        <span onClick={(e) => e.stopPropagation()} className="gap-4 flex items-center h-full md:py-0" >
          <div onClick={() => isAllowed() ? setShowModalDelete({ state: true, values: { object: "categoria", _id: item._id }, title: item.nombre }) : ht()} className="relative w-8 h-8 flex justify-center items-center">
            <MdOutlineDeleteOutline className="w-4 h-4" />
          </div>
        </span>
      </li>
    </>
  );
};



{/* <span className={`flex justify-end w-full ${event?.presupuesto_objeto?.coste_estimado?.toString()?.length < 9 ? "text-[11px]" : "text-[10px]"}`} >
            <div className="flex w-[97%] space-x-3">
              <div className="w-[160px]. flex justify-end space-x-1">
                {event?.presupuesto_objeto?.viewEstimates && <>
                  <span >
                    {getCurrency(item?.coste_estimado)}
                  </span>
                  {/* <span className={`text-[10px] ${event?.presupuesto_objeto?.coste_estimado?.toString().length < 9 ? "translate-y-[1.3px]" : ""}`}>
                    Estimado
                  </span> 
                </>
                }
              </div>
              <div className="w-[80px]. flex justify-end space-x-1">
                <span >
                  {getCurrency(item.coste_final)}
                </span>
                {/* <span className={`text-[10px] ${event?.presupuesto_objeto?.coste_estimado?.toString().length < 9 ? "translate-y-[1.3px]" : ""}`}>
                  Total
                </span> *
              </div>
            </div>
          </span> */}