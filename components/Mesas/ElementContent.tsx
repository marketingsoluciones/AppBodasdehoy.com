import { FC, cloneElement, useEffect, useState } from "react";
import { EventContextProvider } from "../../context";
import { table } from "../../utils/Interfaces";
import MesaComponent from "./MesaComponent";
import { ListElements } from "./BlockPanelElements";

interface propsElement {
  item: any
  DefinePosition: CallableFunction
  setDisableWrapper?: any
  disableDrag: any
  setShowFormEditar: any
}

export const ElementContent: FC<propsElement> = ({ item, DefinePosition, setDisableWrapper, disableDrag, setShowFormEditar }) => {
  const { filterGuests } = EventContextProvider();
  const [invitados, setInvitados] = useState<any>();

  useEffect(() => {
    console.log(444, item)
    console.log(4445, ListElements.find(elem => elem.title === item.tipo)?.icon)
    setInvitados(cloneElement(ListElements.find(elem => elem.title === item.tipo)?.icon, { style: { width: item.size.width, height: item.size.height } }))
  }, [item]);

  return (
    <>
      {invitados}
    </>

  );
};