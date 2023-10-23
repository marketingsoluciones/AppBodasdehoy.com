import { FC, TouchEvent, useEffect } from "react";
import useHover from "../../hooks/useHover";
import { guests } from "../../utils/Interfaces";
import TooltipOld from "../Utils/TooltipOld";

interface invitado extends guests {
  chair: number
}

interface propsSentadoItem {
  invitado: invitado,
  posicion?: number
  setDisableWrapper: any
}
export const SentadoItem: FC<propsSentadoItem> = ({ invitado, posicion, setDisableWrapper }) => {
  useEffect(() => {
    const element = document.getElementById(`dragS${invitado._id}`)
    element.parentElement.classList.remove("js-dropGuests")
  }, [invitado])

  const [hoverRef, isHovered] = useHover();


  return (
    <>
      {invitado ? (
        <div id={`dragS${invitado._id}`} className="ign w-full h-full ">
          <span
            id={`dragS${invitado._id}`}
            className="w-full h-full flex js-dragInvitadoS "
            onMouseDown={(e) => {
              //e.preventDefault()
              setDisableWrapper(true)
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
            onMouseUp={() => {
              setDisableWrapper(false)
              const rootElement = document.getElementById('areaDrag');
              const element = document.getElementById(`dragM${invitado._id}`)
              element && rootElement.removeChild(document.getElementById(`dragM${invitado._id}`))
            }}
            // onTouchStart={() => { alert() }}
            onTouchStart={(e: TouchEvent<HTMLButtonElement>) => {
              //e.preventDefault()
              setDisableWrapper(true)
              console.log(e.touches[0].clientX)
              const rootElement = document.getElementById('areaDrag');
              const element = document.createElement('div');
              //element.textContent = invitado?.nombre;
              element.className = 'bg-gray-300 opacity-25 absolute border-2 border-gray-600 z-50 w-[100px] h-[100px] rounded-full ';
              element.id = `dragM${invitado._id}`
              element.style.left = e.touches[0].clientX - 50 + 'px'
              element.style.top = e.touches[0].clientY - 50 + 'px'
              element.setAttribute('data-x', (e.touches[0].clientX - 50).toString())
              element.setAttribute('data-y', (e.touches[0].clientY - 50).toString())
              rootElement.appendChild(element)
            }}
            onTouchEnd={() => {
              setDisableWrapper(false)
              const rootElement = document.getElementById('areaDrag');
              const element = document.getElementById(`dragM${invitado._id}`)
              element && rootElement.removeChild(document.getElementById(`dragM${invitado._id}`))
            }}
          >
            <div
              id={`dragS${invitado._id}B`}
              className={`w-full h-full bg-primary rounded-full relative flex flex-col items-center justify-center correccion *-rotate-90`}
            >
              <span className="text-tertiary text-center text-[8px]">{invitado?.chair + 1}</span>
              <p className="h-[18px] w-[93%] text-[6px] font-display font-light text-white text-center twoline">
                {invitado.nombre}
              </p>
              <div className="absolute w-full h-full rounded-full" />
              {isHovered && <TooltipOld text={invitado?.nombre} />}
            </div>
          </span>
        </div>
      ) : null}
      <style jsx>
        {`
          .correccion {
            transform: rotate(-${posicion}deg);
          }
          .twoline {
            overflow: hidden;
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 2;
          }
        `}
      </style>
    </>
  );
};