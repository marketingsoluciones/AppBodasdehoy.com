import { FC, cloneElement, useEffect, useState } from "react";
import { EventContextProvider } from "../../context";
import { ListElements } from "./BlockPanelElements";

interface propsElement {
  item: any
}

export const ElementContent: FC<propsElement> = ({ item }) => {
  const [invitados, setInvitados] = useState<any>();

  useEffect(() => {
    setInvitados(cloneElement(ListElements.find(elem => elem.title === item.tipo)?.icon, { style: { width: item.size.width, height: item.size.height } }))
  }, [item]);

  return (
    <>
      {invitados}
    </>

  );
};