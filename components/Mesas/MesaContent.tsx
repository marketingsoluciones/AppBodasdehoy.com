import { FC, useEffect, useState } from "react";
import { EventContextProvider } from "../../context";
import { table } from "../../utils/Interfaces";
import MesaComponent from "./MesaComponent";

interface propsTable {
  table: table
  DefinePosition: CallableFunction
  setDisableWrapper?: any
  disableDrag: any
  setShowFormEditar: any
}

export const MesaContent: FC<propsTable> = ({ table, DefinePosition, setDisableWrapper, disableDrag, setShowFormEditar }) => {
  const { event, filterGuests } = EventContextProvider();
  const [invitados, setInvitados] = useState([]);

  //Setear posicion
  useEffect(() => {
    const el = document.getElementById(table._id)
    el.setAttribute('style', `left: ${table.position.x}px; top: ${table.position.y}px`)
    el.setAttribute('data-x', `${table.position.x}`)
    el.setAttribute('data-y', `${table.position.y}`)
  }, [table.position.x, table.position.y, table._id])

  useEffect(() => {
    setInvitados(filterGuests?.sentados?.filter(guest => {
      return guest.tableID === table._id
    }));
  }, [table?.title, filterGuests]);


  return (
    <>
      <div
        id={table._id}
        onTouchStart={() => { !disableDrag && setDisableWrapper(true) }}
        onTouchEnd={() => { !disableDrag && setDisableWrapper(false) }}
        onMouseDown={() => { !disableDrag && setDisableWrapper(true) }}
        onMouseUp={() => { !disableDrag && setDisableWrapper(false) }}
        className={`${!disableDrag && "js-drag"} draggable-touch *bg-gray-100 absolute hover:bg-gray-100 hover:bg-opacity-50 border border-transparent hover:border-gray-200 hover:shadow-md p-4 rounded-2xl`}>
        <MesaComponent
          disableDrag={disableDrag}
          posicion={DefinePosition(360 / table.numberChair, table)}
          table={table}
          invitados={invitados}
          setDisableWrapper={setDisableWrapper}
          setShowFormEditar={setShowFormEditar}
        />
      </div>
    </>
  );
};