import { FC } from "react";

export const InvitadoPrueba: FC = () => {
  const invitado = { _id: "62e96665422b3a5fa3605422", nombre: "Jafet", sexo: "masculino" }

  return (
    <>
      <div
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
          console.log("onTouchStart", `dragN${invitado._id}`)
          //console.log(e.touches[0].clientX, e.touches[0].clientY)
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
          console.log("onTouchEnd", `dragN${invitado._id}`)
          const rootElement = document.getElementById('areaDrag');
          const element = document.getElementById(`dragM${invitado._id}`)
          element && rootElement.removeChild(document.getElementById(`dragM${invitado._id}`))
        }}
      >

        <p className="font-display text-gray-500 text-sm">{invitado?.nombre}</p>
      </div>
    </>
  )
}