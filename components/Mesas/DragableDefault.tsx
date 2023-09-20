import { FC, ReactNode, useEffect, useState } from "react";
import ClickAwayListener from "react-click-away-listener";
import { EditDefaul } from "./EditDefault";

interface propsTable {
  children?: ReactNode
  item: any
  setDisableWrapper?: any
  disableDrag: any
  prefijo: string
  setShowFormEditar: any
}

export const DragableDefault: FC<propsTable> = ({ children, item, setDisableWrapper, disableDrag, prefijo, setShowFormEditar }) => {
  const [clicked, setClicked] = useState(false)
  const [disableClickAwayListener, setDisableClickAwayListener] = useState(false)

  //Setear posicion
  useEffect(() => {
    const el = document.getElementById(`${prefijo}_${item._id}`)
    el.setAttribute('style', `left: ${item.position.x}px; top: ${item.position.y}px`)
    el.setAttribute('data-x', `${item.position.x}`)
    el.setAttribute('data-y', `${item.position.y}`)
  }, [item.position.x, item.position.y, item._id])
  return (
    <ClickAwayListener onClickAway={() => { !disableClickAwayListener && setClicked(false) }} mouseEvent="mousedown" touchEvent="touchstart" >
      <div
        id={`${prefijo}_${item._id}`}
        onTouchStart={() => {
          setClicked(true)
          !disableDrag && setDisableWrapper(true)
        }}
        onTouchEnd={() => { !disableDrag && setDisableWrapper(false) }}
        onMouseDown={() => {
          setClicked(true)
          !disableDrag && setDisableWrapper(true)
        }}
        onMouseUp={() => { !disableDrag && setDisableWrapper(false) }}
        // onClick={() => { setClicked(true) }}
        className={`${!disableDrag && "js-drag"} ${clicked && "bg-gray-100 bg-opacity-50 border-gray-200 shadow-md"} draggable-touch absolute hover:bg-gray-100 hover:bg-opacity-50 border border-transparent hover:border-gray-200 hover:shadow-md p-5 rounded-2xl`}>
        <div className="relative">
          {clicked && <EditDefaul item={item} itemTipo={prefijo} setShowFormEditar={setShowFormEditar} setDisableClickAwayListener={setDisableClickAwayListener} />}
          {children}
        </div>
      </div>
    </ClickAwayListener >
  );
};