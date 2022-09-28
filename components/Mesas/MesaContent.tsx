import { Dispatch, FC, SetStateAction, useEffect, useState } from "react";
import { EventContextProvider } from "../../context";
import { table } from "../../utils/Interfaces";
import MesaComponent from "./MesaComponent";

interface propsTable {
  mesa: table
  index: number,
  AddInvitado: CallableFunction
  DefinePosition: CallableFunction
  ActualizarPosicion?: CallableFunction
  setDisableLayout: Dispatch<SetStateAction<boolean>>
  setDisableWrapper?: any
  setEvent?: any
  disableDrag: any
}

export const MesaContent: FC<propsTable> = ({
  mesa,
  index,
  AddInvitado,
  DefinePosition,
  ActualizarPosicion,
  setDisableLayout,
  setDisableWrapper,
  setEvent,
  disableDrag
}) => {

  const { event } = EventContextProvider();
  const [invitados, setInvitados] = useState([]);

  useEffect(() => {
    const el = document.getElementById(mesa._id)
    el.setAttribute('style', `left: ${mesa.posicion.x}px; top: ${mesa.posicion.y}px`)
    el.setAttribute('data-x', `${mesa.posicion.x}`)
    el.setAttribute('data-y', `${mesa.posicion.y}`)
  }, [mesa.posicion.x, mesa.posicion.y, mesa._id])

  useEffect(() => {
    setInvitados(
      event?.invitados_array?.filter(guest => guest.nombre_mesa === mesa.nombre_mesa)
    );
  }, [event?.invitados_array, mesa?.nombre_mesa]);

  return (
    <>
      <div
        id={mesa._id}
        onTouchStart={() => { !disableDrag && setDisableWrapper(true) }}
        onTouchEnd={() => { !disableDrag && setDisableWrapper(false) }}
        onMouseDown={() => { !disableDrag && setDisableWrapper(true) }}
        onMouseUp={() => { !disableDrag && setDisableWrapper(false) }}
        className={`${!disableDrag && "js-drag"} draggable-touch *bg-gray-100 absolute hover:bg-gray-100 hover:bg-opacity-50 hover:border hover:border-gray-200 hover:shadow-md p-4 rounded-2xl`}>
        <MesaComponent
          posicion={DefinePosition(360 / mesa.cantidad_sillas, mesa)}
          mesa={mesa}
          AddInvitado={AddInvitado}
          invitados={invitados}
          setDisableWrapper={setDisableWrapper}
        />
      </div>
    </>
  );
};