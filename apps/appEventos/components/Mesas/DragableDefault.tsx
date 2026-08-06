import { FC, forwardRef, useEffect, useState } from "react";
import { EventContextProvider } from "../../context";
import { MesaContent } from "./MesaContent";
import { ElementContent } from "./ElementContent";
import { element, table } from "../../utils/Interfaces";
import { fetchApiBodas, queries } from "../../utils/Fetching";

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
  const { editDefault, setEditDefault, planSpaceActive, setPlanSpaceActive, event, setEvent } = EventContextProvider()

  // Mobiliario (no mesa, no texto): controles SOBRE el elemento fieles al HTML
  // (papelera arriba-izq + pastilla −/＋ debajo). Misma lógica que EditDefault, persistida.
  const isFurniture = prefijo !== "table" && item?.tipo !== "text"
  const isText = item?.tipo === "text"
  const selected = editDefault?.clicked === item?._id

  const handleDeleteEl = async () => {
    setEditDefault({})
    const nps = { ...planSpaceActive, elements: (planSpaceActive?.elements || []).filter((el: any) => el._id !== item._id) }
    setPlanSpaceActive(nps)
    setEvent((prev: any) => ({
      ...prev,
      galerySvgs: (prev?.galerySvgs ?? []).filter((el: any) => el._id !== item._id),
      planSpace: prev.planSpace.map((ps: any) => ps._id !== planSpaceActive._id ? ps : nps),
    }))
    await fetchApiBodas({ query: queries.deleteElement, variables: { evento_id: event._id, element_id: item._id } })
  }

  const handleScaleEl = async (factor: number) => {
    const cur = (item as any)?.size && typeof (item as any).size?.width === 'number' ? (item as any).size : { width: 80, height: 80 }
    const clamp = (v: number) => Math.max(24, Math.min(600, Math.round(v)))
    const newSize = { width: clamp(cur.width * factor), height: clamp(cur.height * factor) }
    const nps = { ...planSpaceActive, elements: (planSpaceActive?.elements || []).map((el: any) => el._id !== item._id ? el : { ...el, size: newSize }) }
    setPlanSpaceActive(nps)
    setEvent((prev: any) => ({
      ...prev,
      planSpace: prev.planSpace.map((ps: any) => ps._id !== planSpaceActive._id ? ps : nps),
    }))
    await fetchApiBodas({ query: queries.editElement, variables: { evento_id: event._id, element_id: item._id, datos: { size: newSize } } })
  }

  // Tamaño de LETRA del texto (px). Mismo patrón que la escala del mobiliario, pero
  // sobre item.fontSize. planSpace es JSON → persiste el campo.
  const handleFontSize = async (delta: number) => {
    const cur = typeof (item as any)?.fontSize === 'number' ? (item as any).fontSize : 14
    const newFontSize = Math.max(10, Math.min(72, Math.round(cur + delta)))
    const nps = { ...planSpaceActive, elements: (planSpaceActive?.elements || []).map((el: any) => el._id !== item._id ? el : { ...el, fontSize: newFontSize }) }
    setPlanSpaceActive(nps)
    setEvent((prev: any) => ({
      ...prev,
      planSpace: prev.planSpace.map((ps: any) => ps._id !== planSpaceActive._id ? ps : nps),
    }))
    await fetchApiBodas({ query: queries.editElement, variables: { evento_id: event._id, element_id: item._id, datos: { fontSize: newFontSize } } })
  }

  useEffect(() => {
    if (prefijo !== "table") {
      if (item?.tipo !== "text") {
        if (!item?._id) return
        const divElement = document.getElementById(`${prefijo}_${item._id}`)
        const relativeElement = divElement?.firstElementChild as HTMLElement | null;
        const svgElement = (relativeElement?.firstElementChild || undefined) as HTMLElement | undefined;
        if (!svgElement?.dataset) return
        const { width, height } = svgElement.dataset
        svgElement.setAttribute('style', `width: ${width}px; height: ${height}px; rotate: ${item?.rotation ?? 0}deg`)
      }
    }
  }, [item?.rotation])

  //Setear posicion
  useEffect(() => {
    if (!item?._id) return
    const divElement = document.getElementById(`${prefijo}_${item._id}`)
    if (!divElement) return
    const x = item?.position?.x ?? 0
    const y = item?.position?.y ?? 0
    divElement.setAttribute('style', `left: ${x}px; top: ${y}px; ${prefijo === "table" || item?.tipo === "text" ? `rotate: ${item?.rotation ?? 0}deg` : ""}`)
    divElement.setAttribute('data-x', `${x}`)
    divElement.setAttribute('data-y', `${y}`)
  }, [item?.position?.x, item?.position?.y, item?._id])

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
      className={`${!disableDrag ? prefijo === "table" || item?.tipo === "text" ? "js-drag" : "js-dragElement" : ""} ${editDefault?.clicked === item?._id ? "ring-2 ring-primary shadow-md" : ""} draggable-touch absolute border border-transparent hover:ring-2 hover:ring-gray-300 hover:shadow-md ${prefijo === "table" ? "p-10" : "p-3"} rounded-2xl ${editDefault?.clicked === item?._id ? "z-10" : ""}`} style={prefijo === "table" || item?.tipo === "text" ? { rotate: `${item?.rotation ?? 0}deg` } : {}} >
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
      {/* Controles SOBRE el elemento (fiel al HTML): papelera arriba-izq + pastilla −/＋ debajo.
          stopPropagation para no disparar la selección/arrastre del elemento. */}
      {isFurniture && selected && (
        <>
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); handleDeleteEl() }}
            title="Borrar"
            className="absolute -top-3 -left-3 w-[26px] h-[26px] rounded-full bg-white border border-[#f2c9d9] shadow-[0_3px_8px_rgba(0,0,0,.18)] flex items-center justify-center z-20"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#EF5B94" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></svg>
          </button>
          <div
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex gap-0.5 bg-white border border-[#eee] rounded-[10px] shadow-[0_3px_8px_rgba(0,0,0,.15)] p-0.5 z-20"
          >
            <button onClick={(e) => { e.stopPropagation(); handleScaleEl(1 / 1.2) }} title="Achicar" className="w-[22px] h-[22px] rounded-[7px] text-[#6b6b72] text-[15px] leading-none flex items-center justify-center">−</button>
            <button onClick={(e) => { e.stopPropagation(); handleScaleEl(1.2) }} title="Agrandar" className="w-[22px] h-[22px] rounded-[7px] text-[#EF5B94] text-[15px] leading-none flex items-center justify-center">＋</button>
          </div>
        </>
      )}
      {/* Controles del TEXTO (fiel al prototipo): papelera izq + lápiz der (circulares)
          + pastilla −/＋ de tamaño de letra. stopPropagation para no arrastrar/deseleccionar. */}
      {isText && selected && (
        <>
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); handleDeleteEl() }}
            title="Borrar"
            className="absolute -top-3 -left-3 w-[26px] h-[26px] rounded-full bg-white border border-[#f2c9d9] shadow-[0_3px_8px_rgba(0,0,0,.18)] flex items-center justify-center z-20"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#EF5B94" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></svg>
          </button>
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent('mesas-text-edit', { detail: { id: item._id } })) }}
            title="Editar texto"
            className="absolute -top-3 -right-3 w-[26px] h-[26px] rounded-full bg-white border border-[#f2c9d9] shadow-[0_3px_8px_rgba(0,0,0,.18)] flex items-center justify-center z-20"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#EF5B94" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
          </button>
          <div
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex gap-0.5 bg-white border border-[#eee] rounded-[10px] shadow-[0_3px_8px_rgba(0,0,0,.15)] p-0.5 z-20"
          >
            <button onClick={(e) => { e.stopPropagation(); handleFontSize(-2) }} title="Letra más pequeña" className="w-[22px] h-[22px] rounded-[7px] text-[#6b6b72] text-[15px] leading-none flex items-center justify-center">−</button>
            <button onClick={(e) => { e.stopPropagation(); handleFontSize(+2) }} title="Letra más grande" className="w-[22px] h-[22px] rounded-[7px] text-[#EF5B94] text-[15px] leading-none flex items-center justify-center">＋</button>
          </div>
        </>
      )}
    </div>
  );
})