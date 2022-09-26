import { TouchEvent } from "react";
import { ImageProfile } from "../../utils/Funciones";
import { MesaIcon, PendienteIcon } from "../icons";

const DragInvitado = (props) => {
  const { tipo, invitado, index } = props;
  return (
    <>
      <div
        className="flex justify-between px-5 py-2 hover:bg-base transition"
      >
        <span className="flex gap-3 items-center">
          <span
            id={`dragN${invitado._id}`}
            className="w-full text-left flex js-dragInvitadoN"
            onMouseDown={(e) => {
              //e.preventDefault()
              const rootElement = document.getElementById('areaDrag');
              const element = document.createElement('div');
              element.textContent = 'Hello word';
              element.className = 'bg-red absolute z-50';
              element.id = `dragM${invitado._id}`
              element.style.left = e.clientX + 10 + 'px'
              element.style.top = e.clientY + 10 + 'px'
              element.setAttribute('data-x', e.clientX + 10)
              element.setAttribute('data-y', e.clientY + 10)
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
              console.log(e.touches[0].clientX, e.touches[0].clientY)
              const rootElement = document.getElementById('areaDrag');
              const element = document.createElement('div');
              element.textContent = 'Hello word';
              element.className = 'bg-red absolute z-50';
              element.id = `dragM${invitado._id}`
              element.style.left = e.touches[0].clientX + 10 + 'px'
              element.style.top = e.touches[0].clientY + 10 + 'px'
              element.setAttribute('data-x', (e.touches[0].clientX + 10).toString())
              element.setAttribute('data-y', (e.touches[0].clientY + 10).toString())
              rootElement.appendChild(element)
            }}
            onTouchEnd={() => {
              const rootElement = document.getElementById('areaDrag');
              const element = document.getElementById(`dragM${invitado._id}`)
              element && rootElement.removeChild(document.getElementById(`dragM${invitado._id}`))
            }}
          >
            <img
              className="w-7 h-7 rounded-full mr-2 text-gray-700 border-gray-300"
              src={ImageProfile[invitado.sexo].image}
              alt={ImageProfile[invitado.sexo].alt}
            />
            <p className="font-display text-gray-500 text-sm">{invitado?.nombre}</p>
          </span>
        </span>
      </div>
    </>
  );
};

export default DragInvitado;
