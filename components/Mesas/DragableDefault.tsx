import { FC, forwardRef, useEffect, useState } from "react";
import { EventContextProvider } from "../../context";
import { MesaContent } from "./MesaContent";
import { ElementContent } from "./ElementContent";
import { element, table } from "../../utils/Interfaces";

interface propsTable extends Partial<HTMLDivElement> {
  ref: any
  item: table | element
  setDisableWrapper?: any
  disableDrag: any
  prefijo: string
  setShowFormEditar: any
  DefinePosition?: any
  idx?: number
  scale: number
}

// eslint-disable-next-line react/display-name
export const DragableDefault: FC<propsTable> = forwardRef(({ item, setDisableWrapper, disableDrag, prefijo, setShowFormEditar, DefinePosition, idx, scale }, ref: any) => {
  const { editDefault, setEditDefault } = EventContextProvider()
  const [rot, setRot] = useState(15)

  useEffect(() => {
    setRot(item?.rotation)
    if (prefijo !== "table") {
      const divElement = document.getElementById(`${prefijo}_${item._id}`)
      const relativeElement = divElement.firstElementChild as HTMLElement | null;
      const svgElement = (relativeElement?.firstElementChild || undefined) as HTMLElement | undefined;
      const { width, height, rotation } = svgElement?.dataset
      svgElement.setAttribute('style', `width: ${width}px; height: ${height}px; rotate: ${item?.rotation}deg`)
    }
  }, [item?.rotation])

  //Setear posicion
  useEffect(() => {
    const divElement = document.getElementById(`${prefijo}_${item._id}`)
    divElement.setAttribute('style', `left: ${item.position.x}px; top: ${item.position.y}px; ${prefijo === "table" ? `rotate: ${rot}deg` : ""}`)
    divElement.setAttribute('data-x', `${item.position.x}`)
    divElement.setAttribute('data-y', `${item.position.y}`)
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
          setShowFormEditar
        })
        !disableDrag && setDisableWrapper(false)
      }}
      className={`${!disableDrag ? prefijo === "table" || item?.tipo === "text" ? "js-drag" : "js-dragElement" : ""} ${editDefault?.clicked === item?._id ? "bg-gray-200 bg-opacity-50 border-gray-300 shadow-md" : ""} draggable-touch absolute hover:bg-gray-300 hover:bg-opacity-50 border border-transparent hover:border-gray-200 hover:shadow-md ${prefijo === "table" ? "p-10" : "p-3"} rounded-2xl`} style={prefijo === "table" ? { rotate: `${rot}deg` } : {}} >
      <div className="relative">
        {prefijo === "table"
          ? <MesaContent
            table={item as table}
            DefinePosition={DefinePosition}
            setDisableWrapper={setDisableWrapper}
            disableDrag={disableDrag}
            setShowFormEditar={setShowFormEditar}
          />
          : <ElementContent item={item} scale={scale} disableDrag={disableDrag} />
        }
      </div>
    </div>
  );
})