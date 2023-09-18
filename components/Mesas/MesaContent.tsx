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
  const { filterGuests } = EventContextProvider();
  const [invitados, setInvitados] = useState([]);

  useEffect(() => {
    setInvitados(filterGuests?.sentados?.filter(guest => {
      return guest.tableID === table._id
    }));
  }, [table?.title, filterGuests]);


  return (
    <>
      <MesaComponent
        disableDrag={disableDrag}
        posicion={DefinePosition(360 / table.numberChair, table)}
        table={table}
        invitados={invitados}
        setDisableWrapper={setDisableWrapper}
        setShowFormEditar={setShowFormEditar}
      />
    </>
  );
};