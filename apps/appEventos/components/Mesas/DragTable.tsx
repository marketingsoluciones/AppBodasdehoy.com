import { FC, TouchEvent, MouseEvent } from "react";
import { PlusIcon } from "../icons";
import SvgWrapper from "../SvgWrapper";
import { GalerySvg } from "../../utils/Interfaces";

const onMouseDown = (e: MouseEvent<HTMLDivElement>, item: GalerySvg) => {
  const child = document.getElementById(`icon${item.title}_${item.tipo}`)
  const rootElement = document.getElementById('areaDrag');
  const element = document.createElement('div');
  element.id = `dragM${item.title}_${item.tipo}`
  const prime: any = child.cloneNode(true)
  prime.className = "flex"
  element.appendChild(prime)
  element.className = 'absolute z-50 translate-x-[-50%] translate-y-[-100%]';
  element.style.left = e.clientX + 'px'
  element.style.top = e.clientY + 'px'
  element.onmouseup = () => { onUp(item) }
  element.ontouchend = () => { onUp(item) }
  element.setAttribute('data-x', (e.clientX).toString())
  element.setAttribute('data-y', (e.clientY).toString())
  rootElement.appendChild(element)
}

const onTouchStart = (e: TouchEvent<HTMLDivElement>, item: GalerySvg) => {
  const child = document.getElementById(`icon${item.title}_${item.tipo}`)
  const rootElement = document.getElementById('areaDrag');
  const element = document.createElement('div');
  element.id = `dragM${item.title}_${item.tipo}`
  const prime: any = child.cloneNode(true)
  prime.className = "flex"
  element.appendChild(prime)
  element.className = 'absolute z-50';
  element.style.left = e.touches[0].clientX + 'px'
  element.style.top = e.touches[0].clientY + 'px'
  element.style.transform = 'translate(-50%, -80%) scale(0.1)'
  element.setAttribute('data-x', (e.touches[0].clientX).toString())
  element.setAttribute('data-y', (e.touches[0].clientY).toString())
  rootElement.appendChild(element)
}

const onUp = (item: GalerySvg) => {
  const rootElement = document.getElementById('areaDrag');
  const element = document.getElementById(`dragM${item.title}_${item.tipo}`)
  element && rootElement.removeChild(document.getElementById(`dragM${item.title}_${item.tipo}`))
}

interface propsDragTable {
  item: GalerySvg
  /** Si se pasa, se renderiza como TARJETA con icono + nombre debajo (menú Mobiliario fiel
   * al HTML). Los hooks de drag (#dragN/#icon/js-dragDefault/handlers) NO cambian. */
  label?: string
}
const DragTable: FC<propsDragTable> = ({ item, label }) => {
  // Handlers de drag (crean el espejo dragM y lo limpian). Comunes a ambos modos.
  const dragHandlers = {
    onMouseDown: (e: MouseEvent<HTMLDivElement>) => { onMouseDown(e, item) },
    onMouseUp: () => { onUp(item) },
    onTouchStart: (e: TouchEvent<HTMLDivElement>) => { onTouchStart(e, item) },
    onTouchEnd: () => { onUp(item) },
  }
  // Espejo oculto que se clona al arrastrar (común a ambos modos).
  const mirror = (
    <div id={`icon${item.title}_${item.tipo}`} className="hidden">
      <div className="bg-gray-100 opacity-80 rounded-lg w-16 h-16 flex justify-center items-center">
        <SvgWrapper width={"75%"} height={"75%"} autoScale={true}>{item.icon}</SvgWrapper>
        <PlusIcon className={`absolute inset-0 m-auto text-primary w-3 h-3`} />
      </div>
    </div>
  )

  // Modo TARJETA (menú Mobiliario, fiel al HTML): TODA la tarjeta es el área arrastrable
  // (js-dragDefault + #dragN + handlers en el CONTENEDOR). Antes el área era solo el icono
  // de 28px → agarrando la tarjeta/nombre no arrastraba (Texto/Árbol/etc.).
  if (label) {
    return (
      <div
        id={`dragN${item.title}_${item.tipo}`}
        {...dragHandlers}
        className="js-dragDefault w-full flex flex-col items-center gap-1.5 py-3 px-1 bg-[#faf9fb] border-[1.5px] border-[#f0f0f2] hover:border-[#e2e2e6] rounded-[12px] transition-colors cursor-grab"
      >
        {mirror}
        <div className="w-7 h-7 flex justify-center items-center text-[#EF5B94]">
          <SvgWrapper width={"100%"} height={"100%"} autoScale={true}>{item.icon}</SvgWrapper>
        </div>
        <span className="text-[10px] font-semibold text-[#3A3A42] text-center leading-tight">{label}</span>
      </div>
    )
  }

  // Modo icono (original — sin cambios).
  return (
    <div className="w-14 h-14 static bg-[#faf9fb] border-[1.5px] border-[#f0f0f2] hover:border-[#e2e2e6] rounded-[12px] transition-colors">
      {mirror}
      <div className="w-full h-full flex-col justify-center items-center cursor-pointer relative">
        <div className="w-full h-full flex transform hover:scale-105 transition justify-center items-center relative">
          <div id={`dragN${item.title}_${item.tipo}`} {...dragHandlers} className="js-dragDefault w-full h-12 flex justify-center items-center">
            <SvgWrapper width={"85%"} height={"85%"} autoScale={true}>{item.icon}</SvgWrapper>
            {item.tipo === "table" && <PlusIcon className={`absolute inset-0 m-auto text-primary w-3 h-3 `} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DragTable;
