import { FC, ReactNode, forwardRef, useEffect, useState } from "react";
import ClickAwayListener from "react-click-away-listener";
import { EditDefaul } from "./EditDefault";
import { EventContextProvider } from "../../context";
import { MesaContent } from "./MesaContent";
import { ElementContent } from "./ElementContent";

interface propsTable extends Partial<HTMLDivElement> {
  ref: any
  item: any
  setDisableWrapper?: any
  disableDrag: any
  prefijo: string
  setShowFormEditar: any
  DefinePosition?: any
  idx?: number
}
// eslint-disable-next-line react/display-name
export const DragableDefault: FC<propsTable> = forwardRef(({ item, setDisableWrapper, disableDrag, prefijo, setShowFormEditar, DefinePosition, idx }, ref: any) => {
  const [clicked, setClicked] = useState(false)
  const [disableClickAwayListener, setDisableClickAwayListener] = useState(false)
  const { editDefault, setEditDefault } = EventContextProvider()

  //Setear posicion
  useEffect(() => {
    const el = document.getElementById(`${prefijo}_${item._id}`)
    el.setAttribute('style', `left: ${item.position.x}px; top: ${item.position.y}px`)
    el.setAttribute('data-x', `${item.position.x}`)
    el.setAttribute('data-y', `${item.position.y}`)
  }, [item.position.x, item.position.y, item._id])
  return (

    <div
      ref={ref}
      id={`${prefijo}_${item._id}`}

      onTouchStart={() => {
        console.log("onTouchStart", item?.title)
        // // setClicked(true)
        setEditDefault({
          active: true,
          clicked: item?._id,
          item,
          itemTipo: prefijo,
          setDisableClickAwayListener,
          setShowFormEditar
        })
        !disableDrag && setDisableWrapper(true)
      }}
      onTouchEnd={() => {
        console.log("onTouchEnd", item?.title)
        !disableDrag && setDisableWrapper(false)
      }}
      onMouseDown={() => {
        console.log("onMouseDown", item?.title)
        // // setClicked(true)
        setEditDefault({
          active: true,
          clicked: item?._id,
          item,
          itemTipo: prefijo,
          setDisableClickAwayListener,
          setShowFormEditar
        })
        !disableDrag && setDisableWrapper(true)
      }}
      onMouseUp={() => {
        console.log("onMouseUp", item?.title)
        !disableDrag && setDisableWrapper(false)
      }}
      // onClick={() => { setClicked(true) }}
      className={`${!disableDrag && "js-drag"} ${clicked && "bg-gray-100 bg-opacity-50 border-gray-200 shadow-md"} draggable-touch absolute hover:bg-gray-100 hover:bg-opacity-50 border border-transparent hover:border-gray-200 hover:shadow-md p-5 rounded-2xl`}>
      <div className="relative">
        {/* {clicked && <EditDefaul item={item} itemTipo={prefijo} setShowFormEditar={setShowFormEditar} setDisableClickAwayListener={setDisableClickAwayListener} />} */}
        <div className='rotate-[0deg]'>
          {prefijo === "table"
            ? <MesaContent
              table={item}
              DefinePosition={DefinePosition}
              setDisableWrapper={setDisableWrapper}
              disableDrag={disableDrag}
              setShowFormEditar={setShowFormEditar}
            />
            : <ElementContent item={item} />
          }
        </div>
      </div>
    </div>
  );
})