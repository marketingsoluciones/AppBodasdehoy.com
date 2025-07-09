import interact from "interactjs"
import { FC, useEffect, useState } from "react"
import { motion } from "framer-motion";
import { useTranslation } from 'react-i18next';


const PruebaN: FC = () => {
  const [prueba, setPrueba] = useState(0)
  const { t } = useTranslation();

  useEffect(() => {
    let position = { x: 0, y: 0 }
    interact('.invitadoPrueba').draggable({
      listeners: {
        start(event) {
        },
        move(event) {
          position.x += event.dx
          position.y += event.dy

          //event.target.style.transform =`translate(${position.x}px, ${position.y}px)`
        },
      }
    })
  }, [])


  return (
    <>
      <div onClick={() => { setPrueba(prueba + 22.5) }} className="bg-blue-300 w-40 h-10 absolute z-[70] translate-x-[600px] cursor-pointer" />
      <div className="bg-gray-300 w-full flex justify-center">
        {true &&
          // <motion.div
          //   initial={{ rotate: `${prueba}deg` }}
          //   animate={{ rotate: `${prueba}deg` }}
          // >
          //   <div style={{}} className="bg-violet-500 w-40 h-40 *absolute *z-[70] *translate-x-[800px] *translate-y-[300px]" />
          // </motion.div>
          <div style={{ transition: "rotate 0.5s", rotate: `${prueba}deg` }} className="bg-red w-40 h-40">
            {t('hello')}
          </div>
        }
      </div>

      {/* <div className="bg-red w-[200px] h-[300px]">
        <div id="invitadoPrueba" className="invitadoPrueba absolute"> Draggable Element </div>
      </div> */}
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