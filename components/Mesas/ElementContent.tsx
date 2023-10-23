import { FC, cloneElement, useEffect, useState } from "react";
import { EventContextProvider } from "../../context";
import { ListElements } from "./BlockPanelElements";

interface propsElement {
  item: any
}

export const ElementContent: FC<propsElement> = ({ item }) => {
  const [invitados, setInvitados] = useState<any>();

  useEffect(() => {
    if (item?.tipo) {
      console.log(875221, item)
      const element = ListElements.find(elem => elem.tipo === item.tipo)
      setInvitados(cloneElement(element?.icon, { style: element?.size }))
    }
  }, [item]);

  return (
    <>
      {invitados}
    </>
  );
};