import { FC, cloneElement, useEffect, useState } from "react";
import { EventContextProvider } from "../../context";
import { ListElements } from "../../pages/mesas";
import { element } from "../../utils/Interfaces";
import { RxQuestionMark } from "react-icons/rx";

interface propsElement {
  item: element
}

export const ElementContent: FC<propsElement> = ({ item }) => {
  const [reactElement, setReactElement] = useState<React.ReactElement>();
  const { event } = EventContextProvider()

  useEffect(() => {
    if (item?.tipo) {
      const element = event?.galerySvgs
        ? [...event?.galerySvgs, ...ListElements].find(elem => elem.title === item.tipo)
        : ListElements.find(elem => elem.title === item.tipo)
      if (element?.icon) {
        console.log(100024, item)
        const size = item?.size ? item?.size : element?.size
        setReactElement(cloneElement(element?.icon, { style: size, "data-width": size?.width, "data-height": size?.height }))
      }
    }
  }, [item]);

  return (
    <>
      {reactElement ? reactElement : <div className="flex items-center justify-center bg-gray-100 rounded-full w-full h-full p-3">
        <RxQuestionMark className="w-12 h-12 text-gray-500" />
      </div>}
    </>
  );
};