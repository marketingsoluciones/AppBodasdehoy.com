import { FC, cloneElement, useEffect, useState } from "react";
import { EventContextProvider } from "../../context";
import { ListElements } from "./BlockPanelElements";
import Question from '../../public/svgs/question.svg';
import { element } from "../../utils/Interfaces";

interface propsElement {
  item: element
}

export const ElementContent: FC<propsElement> = ({ item }) => {
  const [invitados, setInvitados] = useState<any>();
  const { event } = EventContextProvider()

  useEffect(() => {
    if (item?.tipo) {
      const element = event?.galerySvgs
        ? [...event?.galerySvgs, ...ListElements].find(elem => elem.title === item.tipo)
        : ListElements.find(elem => elem.title === item.tipo)
      if (element?.icon) {
        console.log(100024, item)
        setInvitados(cloneElement(element?.icon, { style: item?.size ? item?.size : element?.size }))
      } else {
        setInvitados(<Question width={100} height={100} fill="gray" />)
      }
    }
  }, [item]);

  return (
    <>
      {invitados}
    </>
  );
};