import { FC, ReactNode, useEffect, useState } from "react";
import { EventContextProvider } from "../../context";
import { table } from "../../utils/Interfaces";
import MesaComponent from "./MesaComponent";

interface propsTable {
  children?: ReactNode
  item: any
  setDisableWrapper?: any
  disableDrag: any
  prefijo: string
}

export const DragableDefault: FC<propsTable> = ({ children, item, setDisableWrapper, disableDrag, prefijo }) => {

  //Setear posicion
  useEffect(() => {
    const el = document.getElementById(`${prefijo}_${item._id}`)
    el.setAttribute('style', `left: ${item.position.x}px; top: ${item.position.y}px`)
    el.setAttribute('data-x', `${item.position.x}`)
    el.setAttribute('data-y', `${item.position.y}`)
  }, [item.position.x, item.position.y, item._id])
  return (
    <>
      <div
        id={`${prefijo}_${item._id}`}
        onTouchStart={() => { !disableDrag && setDisableWrapper(true) }}
        onTouchEnd={() => { !disableDrag && setDisableWrapper(false) }}
        onMouseDown={() => { !disableDrag && setDisableWrapper(true) }}
        onMouseUp={() => { !disableDrag && setDisableWrapper(false) }}
        className={`${!disableDrag && "js-drag"} draggable-touch *bg-gray-100 absolute hover:bg-gray-100 hover:bg-opacity-50 border border-transparent hover:border-gray-200 hover:shadow-md p-4 rounded-2xl`}>
        {children}
      </div>
    </>
  );
};