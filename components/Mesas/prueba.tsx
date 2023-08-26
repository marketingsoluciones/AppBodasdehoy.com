import { Dispatch, FC, SetStateAction, useEffect, useRef, useState } from "react"
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { Dragable } from "./PruebaDragable";
import { ActualizarPosicion, handleScale, useScreenSize } from "./FuntionsDragable";
import { SearchIcon, Lock } from "../icons";
import { ButtonConstrolsLienzo } from "./ControlsLienzo";
import { useToast } from "../../hooks/useToast";
import * as mdIcons from "react-icons/md";

type propsPrueba = {
  setShowTables: any
  showTables: boolean
  setShowFormEditar: any
  fullScreen: boolean
  setFullScreen: any
}

const Prueba: FC<propsPrueba> = ({ setShowTables, showTables, setShowFormEditar, fullScreen, setFullScreen }) => {
  let { width, height } = useScreenSize()
  const [scrX, setScrX] = useState(0)
  const [scrY, setScrY] = useState(0)
  const [reset, setReset] = useState(false)
  const [scaleIni, setScaleIni] = useState(0)
  const [scale, setScale] = useState(0)
  const [oculto, setOculto] = useState(true)
  const [disableWrapper, setDisableWrapper] = useState(false)
  const [disableDrag, setDisableDrag] = useState(true)
  const toast = useToast()
  const [lienzo, setLienzo] = useState({ ancho: 900, alto: 400 })

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

  useEffect(() => {
    console.log("resize", width)

  }, [width])


  return (
    <>
      <div className="flex bg-orange-500 divOrange w-[98%] h-[98%] justify-start relative pt-8" >
        <div className="bg-blue-100 flex w-[98%] h-[calc(98%-32px)] relative">
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
            }}>
            {({ zoomIn, zoomOut, resetTransform, ...rest }) => {
              { !reset ? handleReset(resetTransform) : () => { } }
              return (
                < >
                  <div className="bg-white flex w-full h-8 items-center justify-between absolute z-10 transform translate-y-[-32px]">
                    <div className="flex">
                      <ButtonConstrolsLienzo onClick={() => zoomIn()}>
                        <SearchIcon className="w-[13px] h-6" />
                        <span className="text-sm">+</span>
                      </ButtonConstrolsLienzo>
                      <ButtonConstrolsLienzo onClick={() => resetTransform()}>
                        <SearchIcon className="w-[13px] h-6" />
                        <span>100%</span>
                      </ButtonConstrolsLienzo>
                      <ButtonConstrolsLienzo onClick={() => zoomOut()}>
                        <SearchIcon className="w-[13px] h-6" />
                        <span className="text-sm pb-1">- </span>
                      </ButtonConstrolsLienzo>
                      <ButtonConstrolsLienzo onClick={handleSetDisableDrag} pulseButton={disableDrag}>
                        <span className="text-[10px] w-24 h-6 px-1 pt-[3px]">{disableDrag ? 'Desloquear plano' : 'Bloquear plano'}</span>
                      </ButtonConstrolsLienzo>
                      <button className={`${disableDrag ? "block" : "hidden"}  `} onClick={() => { toast("error", "Desbloquea el plano para poder mover las mesas ") }}>
                        <Lock className="text-primary md:block h-6 w-6" />
                      </button>
                    </div>
                    <div className="flex text-gray-700 items-center pr-3 gap-3 curso">
                      <mdIcons.MdSettings className="w-6 h-6 cursor-pointer" onClick={() => setFullScreen(!fullScreen)} />
                      {!fullScreen
                        ? <mdIcons.MdFullscreen className="w-7 h-7 cursor-pointer" onClick={() => setFullScreen(!fullScreen)} />
                        : <mdIcons.MdFullscreenExit className="w-7 h-7 cursor-pointer" onClick={() => setFullScreen(!fullScreen)} />
                      }

                    </div>

                  </div>
                  <TransformComponent wrapperClass="bg-red w-1/3 h-1/3 ">
                    <div className="bg-gray-300 paper border-4 lienzo border-indigo-600 *flex *justify-center *items-center ">
                      <Dragable scale={Math.round(scale * 100) / 100} lienzo={lienzo} setDisableWrapper={setDisableWrapper} disableDrag={disableDrag} setShowFormEditar={setShowFormEditar} />
                    </div>
                  </TransformComponent>
                </>
              )
            }
            }
          </TransformWrapper>
        </div>
      </div>
      <style >
        {`
          .lienzo {
            width: ${lienzo.ancho - 100}px;
            height: ${lienzo.alto - 100}px;
          }

          @media (max-width: 767px) and (orientation: portrait) {

          }
        `}
      </style>
    </>
  )
}

export default Prueba