import { TouchEvent, useEffect, useState } from "react";
import { ImageProfile, useDelayUnmount } from "../../utils/Funciones";
import { EditarIcon, MesaIcon, PendienteIcon } from "../icons";
import ModalBottom from "../Utils/ModalBottom";
import ModalBottomSinAway from "../Utils/ModalBottomSinAway";
import FormEditarInvitado from "../Forms/FormEditarInvitado";
import { useAllowed } from "../../hooks/useAllowed";


const DragInvitado = (props) => {
  const { tipo, invitado, index, setEditInv, editInv, setSelected } = props;
  /* const shouldRenderChild = useDelayUnmount(isMounted, 500); */
  const [isAllowed, ht] = useAllowed()


  return (
    <>
      <div className="w-full flex justify-between items-center px-5 py-1 hover:bg-base transition">
        <span className="w-[90%] flex gap-3 items-center">
          <span
            id={`dragN${invitado._id}`}
            className="w-full h-full text-gray-500 text-left flex items-center js-dragInvitadoN rounded-lg px-2 md:px-0"
            onMouseDown={(e) => {
              //e.preventDefault()
              const rootElement = document.getElementById('areaDrag');
              const element = document.createElement('div');
              element.textContent = invitado?.nombre;
              element.className = 'bg-primary border-solid border-1 border-gray-300 text-white text-sm absolute z-50 rounded-full px-2 py-1';
              element.id = `dragM${invitado._id}`
              element.style.left = e.clientX + 10 + 'px'
              element.style.top = e.clientY + 10 + 'px'
              element.setAttribute('data-x', (e.clientX + 10).toString())
              element.setAttribute('data-y', (e.clientY + 10).toString())
              rootElement.appendChild(element)
            }}
            onMouseUp={(e) => {
              //e.preventDefault()
              const rootElement = document.getElementById('areaDrag');
              const element = document.getElementById(`dragM${invitado._id}`)
              element && rootElement.removeChild(document.getElementById(`dragM${invitado._id}`))
            }}
            // onTouchStart={() => { alert() }}
            onTouchStart={(e) => {
              //e.preventDefault()
              document.getElementById(`dragN${invitado._id}`).style.background = "#f7628c"
              document.getElementById(`dragN${invitado._id}`).classList.replace("text-gray-500", "text-white")
              console.log(e.touches[0].clientX, e.touches[0].clientY)
              const rootElement = document.getElementById('areaDrag');
              const element = document.createElement('div');
              //element.textContent = 'Hello word';
              element.className = 'bg-red-300 opacity-25 absolute border-2 border-gray-600 z-50 w-[100px] h-[100px] rounded-full ';
              element.id = `dragM${invitado._id}`
              element.style.left = e.touches[0].clientX - 50 + 'px'
              element.style.top = e.touches[0].clientY - 50 + 'px'
              element.setAttribute('data-x', (e.touches[0].clientX - 50).toString())
              element.setAttribute('data-y', (e.touches[0].clientY - 50).toString())
              rootElement.appendChild(element)
            }}
            onTouchEnd={() => {
              document.getElementById(`dragN${invitado._id}`).style.background = "none"
              document.getElementById(`dragN${invitado._id}`).classList.replace("text-white", "text-gray-500")
              const rootElement = document.getElementById('areaDrag');
              const element = document.getElementById(`dragM${invitado._id}`)
              element && rootElement.removeChild(document.getElementById(`dragM${invitado._id}`))
            }}>
            <img
              className="w-7 h-7 rounded-full mr-2 text-gray-700 border-gray-300"
              src={ImageProfile[invitado.sexo]?.image}
              alt={ImageProfile[invitado.sexo]?.alt}
            />
            <p className="w-full font-display text-sm truncate">{invitado?.nombre}</p>
          </span>
        </span>
        <EditarIcon
          onClick={() => {
            !isAllowed()
            ? ht()
            : [setEditInv(!editInv), setSelected(invitado._id)]
          }}
          className="h-5 w-5 cursor-pointer" />
      </div>
    </>
  );
};

export default DragInvitado;
