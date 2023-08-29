import { FC, useEffect, useRef, useState } from "react"
import { TransformWrapper } from "react-zoom-pan-pinch";
import { useToast } from "../../hooks/useToast";
import { Comp } from "./ComponenteTransformWrapper";

type propsPrueba = {
  setShowTables: any
  showTables: boolean
  setShowFormEditar: any
  fullScreen: boolean
  setFullScreen: any
}

interface propsLienzo {
  alto: number
  ancho: number
}

const Prueba: FC<propsPrueba> = ({ setShowTables, showTables, setShowFormEditar, fullScreen, setFullScreen }) => {
  const refDiv = useRef(null)
  const [scaleIni, setScaleIni] = useState(0)
  const [disableWrapper, setDisableWrapper] = useState(false)
  const [disableDrag, setDisableDrag] = useState(true)
  const toast = useToast()
  const [lienzo, setLienzo] = useState<propsLienzo>({ ancho: 1200, alto: 1200 })


  const handleSetDisableDrag: any = () => {
    setDisableDrag(!disableDrag)
  }

  const calculoEscala = (lienzo: any, contenedor: any) => {
    const sX = contenedor.current.offsetWidth * 100 / lienzo.ancho
    const sY = contenedor.current.offsetHeight * 100 / lienzo.alto
    return Math.min(sX, sY) / 100
  }
  useEffect(() => {
    setScaleIni(calculoEscala(lienzo, refDiv))
  }, [lienzo, fullScreen, refDiv?.current?.offsetWidth, refDiv?.current?.offsetHeight])


  return (
    <>
      <div className="flex *bg-orange-400 divOrange w-[100%] h-[100%] justify-start relative pt-8" >
        <div ref={refDiv} className="bg-blue-200 flex w-[100%] h-[calc(100%-32px)] relative">
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
            {(params) => <Comp {...params} fullScreen={fullScreen} setFullScreen={setFullScreen} disableWrapper={disableWrapper} setDisableWrapper={setDisableWrapper} lienzo={lienzo} setLienzo={setLienzo} setShowFormEditar={setShowFormEditar} scaleIni={scaleIni} />}
          </TransformWrapper>
        </div>
      </div>
    </>
  )
}

export default Prueba