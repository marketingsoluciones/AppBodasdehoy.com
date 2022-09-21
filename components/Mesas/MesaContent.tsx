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
}

export const MesaContent: FC<propsTable> = ({
  mesa,
  index,
  AddInvitado,
  DefinePosition,
  ActualizarPosicion,
  setDisableLayout,
  setDisableWrapper,
  setEvent
}) => {
  // mesa.posicion.x = 100
  // mesa.posicion.y = 200
  const { event } = EventContextProvider();
  const [invitados, setInvitados] = useState([]);
  const [showOptions, setShowOptions] = useState<{ x: number, y: number } | null>(null)
  useEffect(() => {
    const el = document.getElementById(mesa._id)
    el.setAttribute('style', `left: ${mesa.posicion.x}px; top: ${mesa.posicion.y}px`)
    el.setAttribute('data-x', `${mesa.posicion.x}`)
    el.setAttribute('data-y', `${mesa.posicion.y}`)
  }, [mesa.posicion.x, mesa.posicion.y, mesa._id])

  /*  console.log("position", showOptions) */
  useEffect(() => {
    setInvitados(
      event?.invitados_array?.filter(guest => guest.nombre_mesa === mesa.nombre_mesa)
    );
  }, [event?.invitados_array, mesa?.nombre_mesa]);

  return (
    <>
      {/* <Draggable
        key={mesa._id}
        defaultPosition={mesa.posicion}
        defaultClassName="w-max"
        // bounds={".wrapperLayout"}
        cancel=".silla"
        onMouseDown={() => setDisableLayout(true)}
        onStop={(e, data) => {
          setDisableLayout(false);
          ActualizarPosicion({
            x: data.x,
            y: data.y,
            index: index,
            mesaID: mesa._id,
            event: event,
            setEvent: setEvent
          });
        }}
      >
        <div onAuxClick={(e) => {
          console.log(e.target)
          setShowOptions({
            x: e.pageX,
            y: e.pageY
          })
        }} className="relative w-max">
          {showOptions && (
            <div className={`absolute bg-red-500 w-max top-[${400}px] left-[${showOptions.x}px]`}>
            </div>
          )} */}
      <div
        id={mesa._id}
        onTouchStart={() => { setDisableWrapper(true) }}
        onTouchEnd={() => { setDisableWrapper(false) }}
        onMouseDown={() => { setDisableWrapper(true) }}
        onMouseUp={() => { setDisableWrapper(false) }}
        className="js-drag draggable-touch bg-blue-500 absolute hover:bg-gray-100 hover:bg-opacity-50 hover:border hover:border-gray-200 hover:shadow-md p-4 rounded-2xl">
        <MesaComponent
          posicion={DefinePosition(360 / mesa.cantidad_sillas, mesa)}
          mesa={mesa}
          AddInvitado={AddInvitado}
          invitados={invitados}
        />
      </div>
      {/* </div>
      </Draggable> */}
    </>
  );
};