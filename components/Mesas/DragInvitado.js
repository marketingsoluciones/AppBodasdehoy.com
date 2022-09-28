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
            className="w-full h-full text-gray-500 text-left flex js-dragInvitadoN rounded-lg px-2 md:px-0"
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
              element.textContent = 'Hello word';
              element.className = 'bg-red absolute z-50';
              element.id = `dragM${invitado._id}`
              element.style.left = e.touches[0].clientX - 50 + 'px'
              element.style.top = e.touches[0].clientY - 50 + 'px'
              element.setAttribute('data-x', (e.touches[0].clientX - 50).toString())
              element.setAttribute('data-y', (e.touches[0].clientY - 50).toString())
              //rootElement.appendChild(element)
            }}
            onTouchEnd={() => {
              document.getElementById(`dragN${invitado._id}`).style.background = "none"
              document.getElementById(`dragN${invitado._id}`).classList.replace("text-white", "text-gray-500")
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
            <p className="font-display text-sm">{invitado?.nombre}</p>
          </span>
        </span>
      </div>
    </>
  );
};

export default DragInvitado;
