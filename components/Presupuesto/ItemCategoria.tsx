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
  const [showMenu, setShowMenu] = useState(false);
  const [showEditCategorie, setShowEditCategorie] = useState(false);
  const toast = useToast()
  const [isAllowed, ht] = useAllowed()
  const { t } = useTranslation()
  const [loading, setLoading] = useState<boolean>(false);
  const [showModalDelete, setShowModalDelete] = useState<ModalInterface>({ state: false, title: null, values: null })


 /*  const DefinirCoste = (item) => {
    if (item.coste_final >= item.coste_estimado) {
      return item.coste_final
    } else {
      return item.coste_estimado
    }
  } */

 /*  const Lista = [
    { title: "Editar", action: () => setShowEditCategorie(true) },
    { title: "Borrar", action: (item) => setShowModalDelete({ state: true, values: { object: "categoria", _id: item._id }, title: item.nombre }) }
  ]; */

  const handleOnBlur = ({ value, accessor }) => {
    try {
      fetchApiEventos({
        query: queries.editCategoria,
        variables: {
          evento_id: event?._id,
          categoria_id: item._id,
          nombre: value,
        }
      }).then(() => {
        setEvent(old => {
          const index = old?.presupuesto_objeto?.categorias_array?.findIndex(item => item._id == item._id)
          old.presupuesto_objeto.categorias_array[index].nombre = value
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
       {/*  {showEditCategorie && (
          <ModalLeft state={showEditCategorie} set={setShowEditCategorie}>
            <FormEditarCategoria categoria={item} state={showEditCategorie} set={setShowEditCategorie} />
          </ModalLeft>
        )} */}
        <div className="flex-1 flex flex-col space-y-1 md:space-y-0">
          <span className="flex justify-start items-center text-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <EditableLabelWithInput
              value={item?.nombre}
              type={null}
              handleChange={handleOnBlur}
              accessor={null}
              textAlign="left" />
          </span>
          <span className={`flex justify-end w-full ${event.presupuesto_objeto?.coste_estimado?.toString()?.length < 9 ? "text-[11px]" : "text-[10px]"}`} >
            <div className="flex w-[97%] space-x-3">
              <div className="w-1/2 flex justify-end space-x-1">
                {event?.presupuesto_objeto?.viewEstimates && <>
                  <span >
                    {getCurrency(item?.coste_estimado)}
                  </span>
                  <span className={`text-[10px] ${event.presupuesto_objeto?.coste_estimado?.toString().length < 9 ? "translate-y-[1.3px]" : ""}`}>
                    Estimado
                  </span>
                </>
                }
              </div>
              <div className="w-1/2 flex justify-end space-x-1">
                <span >
                  {getCurrency(item.coste_final)}
                </span>
                <span className={`text-[10px] ${event.presupuesto_objeto?.coste_estimado?.toString().length < 9 ? "translate-y-[1.3px]" : ""}`}>
                  Total
                </span>
              </div>
            </div>
          </span>
        </div>
        <span onClick={(e) => e.stopPropagation()} className="gap-4 flex items-center h-full md:py-0" >
          <div onClick={() => setShowModalDelete({ state: true, values: { object: "categoria", _id: item._id }, title: item.nombre })} className="relative w-8 h-8 flex justify-center items-center">
            <MdOutlineDeleteOutline className="w-4 h-4" />
            {/* <DotsOpcionesIcon
            onClick={() => !isAllowed() ? null : setShowMenu(!showMenu)}
            className={`w-3 h-3 cursor-pointer`}
            />
            
            {showMenu && (
              <ClickAwayListener onClickAway={() => showMenu && setShowMenu(false)}>
              <ul className="w-max z-20 bg-white shadow-md rounded absolute top-5 right-0 font-display text-sm divide-y overflow-hidden border-[1px] border-gray-200 select-none">
              {Lista.map((elem, idx) => (
                <li
                key={idx}
                onClick={() => {
                  setShowMenu(!showMenu)
                  elem.action(item)
                  }}
                  className="px-4 py-1 hover:bg-base transition"
                  >
                  {elem.title}
                  </li>
                  ))}
                  </ul>
                  </ClickAwayListener>
                  )} */}
          </div>
        </span>
      </li>
    </>
  );
};
