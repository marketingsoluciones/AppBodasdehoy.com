import { FC, useEffect, useRef, useState } from "react"
import { TransformWrapper } from "react-zoom-pan-pinch";
import { useToast } from "../../hooks/useToast";
import { ComponenteTransformWrapper } from "./ComponenteTransformWrapper";
import { EventContextProvider } from "../../context";
import { size } from "../../utils/Interfaces";
import { EditDefaul } from "./EditDefault";
import ClickAwayListener from "react-click-away-listener";

type propsPrueba = {
  setShowFormEditar: any
  fullScreen: boolean
  setFullScreen: any
}




const Prueba: FC<propsPrueba> = ({ setShowFormEditar, fullScreen, setFullScreen }) => {
  const refDiv = useRef(null)
  const [scaleIni, setScaleIni] = useState(0)
  const [disableWrapper, setDisableWrapper] = useState(false)
  const [disableDrag, setDisableDrag] = useState(true)
  const toast = useToast()
  const { event, setEvent, planSpaceActive, editDefault, setEditDefault } = EventContextProvider()
  const [lienzo, setLienzo] = useState<size>(event?.planSpace?.find(elem => elem?._id === event?.planSpaceSelect)?.size)

  useEffect(() => {
    setLienzo(event?.planSpace?.find(elem => elem?._id === event?.planSpaceSelect)?.size)
  }, [event.planSpaceSelect])


  const handleSetDisableDrag: any = () => {
    setDisableDrag(!disableDrag)
  }

  const calculoEscala = (lienzo: size, contenedor: any) => {
    const sX = contenedor.current.offsetWidth * 100 / lienzo?.width
    const sY = contenedor.current.offsetHeight * 100 / lienzo?.height
    const asd = Math.trunc(Math.min(sX, sY) / 10) / 10
    return asd
  }
  useEffect(() => {
    setScaleIni(calculoEscala(lienzo, refDiv))
  }, [lienzo, fullScreen, refDiv?.current?.offsetWidth, refDiv?.current?.offsetHeight])

  return (
    <>
      <div className="flex *bg-orange-400 divOrange w-[100%] h-[100%] justify-start relative pt-8" >
        <div ref={refDiv} className="bg-blue-200 flex w-[100%] h-[calc(100%-32px)] relative">
          {editDefault?.clicked &&
            <ClickAwayListener
              onClickAway={() => {
                if (editDefault.activeButtons) {
                  setEditDefault({ ...editDefault, active: true })
                }
              }}
              mouseEvent="mousedown"
              touchEvent="touchstart">
              <div
                onMouseDown={() => setEditDefault({ ...editDefault, active: false })}
                onTouchStart={() => setEditDefault({ ...editDefault, active: false })}
                className={`bg-gray-200 opacity-70 w-10 h-48 absolute z-[20] left-0 top-10 rounded-r-lg`}>
                <EditDefaul {...editDefault} />
              </div>
            </ClickAwayListener>
          }
          <TransformWrapper
            disabled={disableWrapper}
            limitToBounds={true}
            initialScale={scaleIni}
            minScale={scaleIni}
            maxScale={6}
            wheel={{ step: 0.25 }}
            pinch={{ step: 5 }}
            doubleClick={{ step: 0.5 }}
            //initialPositionX={500}
            //initialPositionY={500}
            //centerZoomedOut={true}
            centerOnInit={false}
          //minPositionX={0}
          //minPositionY={0}
          //maxPositionX={0}
          //maxPositionY={0}
          >
            {(params) => {
              return <ComponenteTransformWrapper {...params} fullScreen={fullScreen} setFullScreen={setFullScreen} disableWrapper={disableWrapper} setDisableWrapper={setDisableWrapper} lienzo={lienzo} setLienzo={setLienzo} setShowFormEditar={setShowFormEditar} scaleIni={scaleIni} />
            }}
          </TransformWrapper>
        </div>
      </div>
    </>
  )
}

export default Prueba