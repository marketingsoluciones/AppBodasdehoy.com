import { Dispatch, FC, SetStateAction, TouchEvent, useEffect, useState } from "react";
import { ImageProfile, useDelayUnmount } from "../../utils/Funciones";
import { EditarIcon, MesaIcon, PendienteIcon, PlusIcon } from "../icons";
import ModalBottom from "../Utils/ModalBottom";
import ModalBottomSinAway from "../Utils/ModalBottomSinAway";
import FormEditarInvitado from "../Forms/FormEditarInvitado";
import ReactDOMServer from "react-dom/server";
import { table } from "../../utils/Interfaces";

const onMouseDown = (e, item) => {
  console.log("DOWN")
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
  element.onmouseup = (e) => { onUp(e, item) }
  element.ontouchend = (e) => { onUp(e, item) }
  element.setAttribute('data-x', (e.clientX).toString())
  element.setAttribute('data-y', (e.clientY).toString())
  rootElement.appendChild(element)
}

const onTouchStart = (e, item) => {
  console.log("DOWN")
  const child = document.getElementById(`icon${item.title}_${item.tipo}`)
  const rootElement = document.getElementById('areaDrag');
  const element = document.createElement('div');
  element.id = `dragM${item.title}_${item.tipo}`
  const prime: any = child.cloneNode(true)
  prime.className = "flex"
  element.appendChild(prime)
  element.className = 'absolute z-50 translate-x-[-50%] translate-y-[-80%]';
  element.style.left = e.touches[0].clientX + 'px'
  element.style.top = e.touches[0].clientY + 'px'
  element.setAttribute('data-x', (e.touches[0].clientX).toString())
  element.setAttribute('data-y', (e.touches[0].clientY).toString())
  rootElement.appendChild(element)
}

const onUp = (e, item: table) => {
  console.log("UP")
  const rootElement = document.getElementById('areaDrag');
  const element = document.getElementById(`dragM${item.title}_${item.tipo}`)
  element && rootElement.removeChild(document.getElementById(`dragM${item.title}_${item.tipo}`))
}

interface propsDragTable {
  item: any
}

const DragTable: FC<propsDragTable> = ({ item }) => {

  return (
    <div className="w-full h-full static">
      <div id={`icon${item.title}_${item.tipo}`} className="hidden">
        <div className="bg-gray-100 opacity-80 p-2 rounded-lg flex justify-center items-center">
          {item.icon}
          <PlusIcon className={`absolute inset-0 m-auto text-primary w-3 h-3`} />
        </div>
      </div>

      <span className="w-full h-full flex items-center ">
        <div className="w-full h-full p-2 flex-col justify-center items-center *cursor-pointer relative">
          <div className="w-full h-full flex transform hover:scale-105 transition justify-center items-center relative">
            <div id={`dragN${item.title}_${item.tipo}`} className="js-dragDefault w-full h-10 flex justify-center items-center"
              onMouseDown={(e) => { onMouseDown(e, item) }}
              onMouseUp={(e) => { onUp(e, item) }}
              onTouchStart={(e) => { onTouchStart(e, item) }}
              onTouchEnd={(e) => { onUp(e, item) }} >
              {item.icon}
              <PlusIcon className={`absolute inset-0 m-auto text-primary w-3 h-3 `} />
            </div>
          </div>
        </div>
      </span>

      <style>{`
        .listTables {
          touch - action: none;
          user-select: none;
        }
      `}</style>
    </div>
  );
};

export default DragTable;
