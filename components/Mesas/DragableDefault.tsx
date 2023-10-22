import { FC, ReactNode, forwardRef, useEffect, useState } from "react";
import ClickAwayListener from "react-click-away-listener";
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
  const [rot, setRot] = useState(15)

  useEffect(() => {
    setRot(item?.rotation)
  }, [item?.rotation])


  //Setear posicion
  useEffect(() => {
    const el = document.getElementById(`${prefijo}_${item._id}`)
    el.setAttribute('style', `left: ${item.position.x}px; top: ${item.position.y}px; rotate: ${rot}deg`)
    el.setAttribute('data-x', `${item.position.x}`)
    el.setAttribute('data-y', `${item.position.y}`)
  }, [item.position.x, item.position.y, item._id])
  return (

    <div
      ref={ref}
      id={`${prefijo}_${item._id}`}

      onTouchStart={() => {
        !disableDrag && setDisableWrapper(true)
      }}
      onTouchEnd={() => {
        setEditDefault({
          active: true,
          activeButtons: true,
          clicked: item?._id,
          item,
          itemTipo: prefijo,
          setDisableClickAwayListener,
          setShowFormEditar
        })
        !disableDrag && setDisableWrapper(false)
      }}
      onMouseDown={() => {
        !disableDrag && setDisableWrapper(true)
      }}
      onMouseUp={() => {
        setEditDefault({
          active: true,
          activeButtons: true,
          clicked: item?._id,
          item,
          itemTipo: prefijo,
          setDisableClickAwayListener,
          setShowFormEditar
        })
        !disableDrag && setDisableWrapper(false)
      }}
      // onClick={() => { setClicked(true) }}
      className={`${!disableDrag && "js-drag"} ${editDefault?.clicked === item?._id && "bg-gray-200 bg-opacity-50 border-gray-300 shadow-md"} draggable-touch absolute hover:bg-gray-300 hover:bg-opacity-50 border border-transparent hover:border-gray-200 hover:shadow-md p-10 rounded-2xl`}
      style={{ rotate: `${rot}deg` }}>
      <div className="relative">
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
      <style>{`
      .rotateT {
        --tw-rotate: ${rot}deg;
        transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
      }
      `}</style>
    </div>
  );
})