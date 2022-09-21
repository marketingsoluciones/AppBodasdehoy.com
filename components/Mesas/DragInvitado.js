import { ImageProfile } from "../../utils/Funciones";
import { MesaIcon, PendienteIcon } from "../icons";

const DragInvitado = (props) => {
  const { tipo, invitado, index } = props;
  return (
    <>
      <li
        role="Handle"
        className="flex justify-between px-5 py-2 hover:bg-base transition"
      >
        <span className="flex gap-3 items-center">
          <button
            id={`drag${index}`}
            className="w-full text-left flex js-drag"
            onMouseDown={(e) => {
              e.preventDefault()
              const rootElement = document.getElementById('areaDrag');
              const element = document.createElement('div');
              element.textContent = 'Hello word';
              element.className = 'bg-red absolute z-50';
              element.id = `dragM${index}`
              element.style = `left:${e.clientX + 10}px; top: ${e.clientY + 10}px`
              element.setAttribute('data-x', e.clientX + 10)
              element.setAttribute('data-y', e.clientY + 10)
              rootElement.appendChild(element)
            }}
            onMouseUp={() => {
              const rootElement = document.getElementById('areaDrag');
              const element = document.getElementById(`dragM${index}`)
              element && rootElement.removeChild(document.getElementById(`dragM${index}`))
            }}
          // onTouchStart={() => { alert() }}
          >
            <img
              className="w-7 h-7 rounded-full mr-2 text-gray-700 border-gray-300"
              src={ImageProfile[invitado.sexo].image}
              alt={ImageProfile[invitado.sexo].alt}
            />
            <p className="font-display text-gray-500 text-sm">{invitado?.nombre}</p>
          </button>
        </span>
      </li>
    </>
  );
};

export default DragInvitado;
