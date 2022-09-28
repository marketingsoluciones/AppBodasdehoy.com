import interact from "interactjs"
import { FC, useEffect } from "react"

const PruebaN: FC = () => {
  useEffect(() => {
    let position = { x: 0, y: 0 }
    interact('.invitadoPrueba').draggable({
      listeners: {
        start(event) {
          console.log(event.type, event.target)
        },
        move(event) {
          console.log(position)
          position.x += event.dx
          position.y += event.dy

          //event.target.style.transform =`translate(${position.x}px, ${position.y}px)`
        },
      }
    })
  }, [])


  return (
    <>
      <div className="bg-red w-[200px] h-[300px]">
        <div id="invitadoPrueba" className="invitadoPrueba absolute"> Draggable Element </div>
      </div>
      <style>{`
      .invitadoPrueba {
        width: 125px;
        min-height: 6.5em;
        background-color: #29e;
        color: white;
        border-radius: 0.75em;
        padding: 4%;
        touch-action: none;
        user-select: none;
      }
      `}</style>
    </>
  )
}
export default PruebaN