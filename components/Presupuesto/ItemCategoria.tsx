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

export const ItemCategoria = ({ item, setVisible }) => {
  const { config } = AuthContextProvider()
  const { event, setEvent } = EventContextProvider()
  const [showMenu, setShowMenu] = useState(false);
  const [showEditCategorie, setShowEditCategorie] = useState(false);
  const toast = useToast()
  const costeEstimado = event?.presupuesto_objeto?.coste_estimado
  const [isAllowed, ht] = useAllowed()
  const { t } = useTranslation()
  const [loading, setLoading] = useState<boolean>(false);
  const [modal, setModal] = useState<ModalInterface>({ state: false, title: null, values: null })

  const borrarCategoria = async (item) => {
    console.log(item)
    try {
      setShowMenu(!showMenu)
      fetchApiEventos({
        query: queries.borraCategoria,
        variables: {
          evento_id: event?._id,
          categoria_id: item._id,
        },
      }).then(result => {
        console.log(result)
        const f1 = event.presupuesto_objeto.categorias_array.findIndex(elem => elem._id === item._id)
        event.presupuesto_objeto.categorias_array.splice(f1, 1)
        setEvent({ ...event })
        setLoading(false)
      })
    } catch (error) {
      console.log(error)

    }
  }


  const DefinirCoste = (item) => {
    if (item.coste_final >= item.coste_estimado) {
      return item.coste_final
    } else {
      return item.coste_estimado
    }
  }

  const Lista = [
    { title: "Editar", action: () => setShowEditCategorie(true) },
    { title: "Borrar", action: (item) => setModal({ state: true, values: item, title: item.nombre }) }
  ];

  return (
    <li
      onClick={() => costeEstimado != 0 ? setVisible({ isVisible: true, id: item._id }) : toast("error", t("Agrega un monto a tu Presupuesto Estimado"))}
      className={`bg-white text-xs w-full justify-between items-center flex px-5 md:pl-2 md:pr-3 transition ${costeEstimado == 0 ? "" : "hover:bg-base"} ${item?.id == item._id ? "bg-slate-200" : ""}`}
    >
      {showEditCategorie && (
        <ModalLeft state={showEditCategorie} set={setShowEditCategorie}>
          <FormEditarCategoria categoria={item} state={showEditCategorie} set={setShowEditCategorie} />
        </ModalLeft>
      )}
      <span className="gap-2 py-3 flex items-center capitalize" >
        {item?.icon}
        {item?.nombre?.toLowerCase()}
      </span>
      <span className="gap-4 flex items-center py-3 md:py-0" >
        {/* <div className="text-[13px]" >
          {getCurrency(DefinirCoste(item), event?.presupuesto_objeto?.currency)}
        </div> */}
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
      </span>
      {modal.state && <SimpleDeleteConfirmation
        loading={loading}
        setModal={setModal}
        handleDelete={() => borrarCategoria(modal.values)}
        message={<p className="text-azulCorporativo mx-8 text-center" >Estas seguro de borrar categoria <span className='font-semibold capitalize'>{modal.title}</span></p>}
      />}
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
