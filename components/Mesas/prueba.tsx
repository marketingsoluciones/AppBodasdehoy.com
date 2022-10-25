import { Dispatch, FC, SetStateAction, useEffect, useRef, useState } from "react"
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { Dragable } from "./PruebaDragable";
import { ActualizarPosicion, handleScale, useScreenSize } from "./FuntionsDragable";
import { SearchIcon } from "../icons";
import { ButtonConstrolsLienzo } from "./ControlsLienzo";

type propsPrueba = {
  setShowTables: any
  showTables: boolean
  setShowFormEditar: any
}

const Prueba: FC<propsPrueba> = ({ setShowTables, showTables, setShowFormEditar }) => {
  let { width, height } = useScreenSize()
  const [scrX, setScrX] = useState(0)
  const [scrY, setScrY] = useState(0)
  const [reset, setReset] = useState(false)
  const [scaleIni, setScaleIni] = useState(0)
  const [scale, setScale] = useState(0)
  const [oculto, setOculto] = useState(true)
  const [disableWrapper, setDisableWrapper] = useState(false)
  const [disableDrag, setDisableDrag] = useState(true)
  const lienzo = {
    ancho: 2048,
    alto: 800
  }
  const handleSetDisableDrag: any = () => {
    setDisableDrag(!disableDrag)
  }
  const handleSetShowTables: any = () => {
    setShowTables(!showTables)
  }

  useEffect(() => {
    console.log("disableDrag(deshabilita mover mesa)", disableDrag)
  }, [disableDrag])
  useEffect(() => {
    console.log("disableWrapper(deshabilita zoom lienzo)", disableWrapper)
  }, [disableWrapper])

  useEffect(() => {
    setScrX(window.innerWidth)
    setScrY(window.innerHeight)
    const scaleResult = handleScale(window.innerWidth, window.innerHeight, lienzo)
    const calScale = scaleResult / 100
    setScaleIni(scaleResult / 100)
    setScale(calScale)
  }, [oculto])

  useEffect(() => {
    if (oculto) {
      const b = document.getElementsByTagName('body')[0]
      setOculto(false)
    }
  }, [oculto])

  const handleReset = (funcion: any) => {
    funcion()
    setTimeout(() => {

      setReset(true)
    }, 100);
  }

  return (
    <>
      <div>
        <div className="bg-white h-8 widthCalc">
          {/* <button className="bg-red" onClick={() => { controlsZoom.in }}>reset</button> */}
        </div>
        <div className="*bg-orange-500 flex divOrange justify-start relative" >
          <TransformWrapper
            disabled={disableWrapper}
            limitToBounds={true}
            initialScale={scaleIni}
            minScale={scaleIni}
            maxScale={6}
            wheel={{ step: 0.7 }}
            pinch={{ step: 2 }}
            doubleClick={{ step: 1.01 }}
            //initialPositionX={500}
            //initialPositionY={500}
            //centerZoomedOut={true}
            centerOnInit={false}
            //minPositionX={0}
            //minPositionY={0}
            //maxPositionX={0}
            //maxPositionY={0}
            ref={(ref) => {
              ref && setScale(ref.state.scale)
            }}
          >
            {({ zoomIn, zoomOut, resetTransform, ...rest }) => (
              <>
                {!reset ? handleReset(resetTransform) : () => { }}
                <div className="flex items-start absolute z-10 transform translate-y-[-29px]">
                  <div className="flex widthCalc">
                    <ButtonConstrolsLienzo onClick={() => zoomIn()}>
                      <SearchIcon className="w-[13px]" />
                      <span className="text-sm">+</span>
                    </ButtonConstrolsLienzo>
                    <ButtonConstrolsLienzo onClick={() => resetTransform()}>
                      <SearchIcon className="w-[13px]" />
                      <span>100%</span>
                    </ButtonConstrolsLienzo>
                    <ButtonConstrolsLienzo onClick={() => zoomOut()}>
                      <SearchIcon className="w-[13px]" />
                      <span className="text-sm pb-1">- </span>
                    </ButtonConstrolsLienzo>
                    <ButtonConstrolsLienzo onClick={handleSetDisableDrag} pulseButton={disableDrag}>
                      <span className="text-[10px] w-[90px]">{disableDrag ? 'Desloquear Mesas' : 'Bloquear Mesas'}</span>
                    </ButtonConstrolsLienzo>
                    <ButtonConstrolsLienzo onClick={handleSetShowTables} className="md:hidden">
                      <span className="text-[10px] w-[60px]">{showTables ? 'Ver Invitados' : 'Crear Mesas'}</span>
                    </ButtonConstrolsLienzo>
                  </div>
                </div>
                <TransformComponent wrapperClass="contenedor">
                  <div className="bg-gray-300 paper border-4 lienzo border-indigo-600 *flex *justify-center *items-center ">
                    <Dragable scale={Math.round(scale * 100) / 100} lienzo={lienzo} setDisableWrapper={setDisableWrapper} disableDrag={disableDrag} setShowFormEditar={setShowFormEditar} />
                  </div>
                </TransformComponent>

              </>
            )
            }
          </TransformWrapper>
        </div>
      </div >

      <style >
        {`
          .widthCalc {
            width: calc(${width == 0 ? scrX / 12 * 9 : width / 12 * 9}px);
          }
          .divOrange {
            width: calc(${width == 0 ? scrX / 12 * 9 : width / 12 * 9}px);
            height: calc(100vh - 144px - 32px);
          }
          .contenedor {
            *background-color: cyan;
            calc(${width == 0 ? scrX / 12 * 9 : width / 12 * 9}px);
            height: calc(100vh - 144px - 32px);
          }
          .div3 {
            background-color: white;
          }
          .lienzo {
            width: ${lienzo.ancho}px;
            height: ${lienzo.alto}px;
          }

          @media (max-width: 767px) and (orientation: portrait) {
            .widthCalc {
              width: calc(${scrX}px - 30px);
            }
            .divOrange {
              width: calc(${scrX}px - 30px);
              height: calc(100vh - 64px - 250px - 32px - 90px);
            }
            .contenedor {
              *background-color: cyan;
              width: calc(${scrX}px - 30px);
              height: calc(100vh - 64px - 250px - 32px - 90px);
            }
            .div3 {
              background-color: yellow;
            }
          }
        `}
      </style>
    </>
  )
}

export default Prueba