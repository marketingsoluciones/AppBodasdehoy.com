import { Dispatch, FC, SetStateAction, useEffect, useRef, useState } from "react"
import { TransformWrapper, TransformComponent, useTransformContext } from "react-zoom-pan-pinch";
import { Dragable } from "./PruebaDragable";
import { ActualizarPosicion, handleScale, useScreenSize } from "./FuntionsDragable";
import { SearchIcon, Lock, Cuadricula } from "../icons";
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

interface propsLienzo {
  alto: number
  ancho: number
}

const Prueba: FC<propsPrueba> = ({ setShowTables, showTables, setShowFormEditar, fullScreen, setFullScreen }) => {
  const refDiv = useRef(null)
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
  const [lienzo, setLienzo] = useState<propsLienzo>({ ancho: 1200, alto: 1200 })
  const [showSetup, setShowSetup] = useState(false)

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
    //setScaleIni(scaleResult / 100)
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

  const calculoEscala = (lienzo, contenedor) => {
    const sX = contenedor.current.offsetWidth * 100 / lienzo.ancho
    const sY = contenedor.current.offsetHeight * 100 / lienzo.alto
    return Math.min(sX, sY) / 100
  }
  useEffect(() => {
    console.log("aqui lienzo", lienzo)
    setScaleIni(calculoEscala(lienzo, refDiv))
  }, [refDiv, lienzo])


  useEffect(() => {
    console.log("resize1", width)
    console.log(1005, refDiv.current.offsetWidth, refDiv.current.offsetHeight)
  }, [width])

  useEffect(() => {
    console.log("scaleIni", scaleIni)
  }, [scaleIni])




  return (
    <>
      <div className="flex bg-orange-400 divOrange w-[98%] h-[98%] justify-start relative pt-8" >
        <div ref={refDiv} className="bg-blue-200 flex w-[98%] h-[calc(98%-32px)] relative">
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
            {(va) => {
              const { zoomIn, zoomOut, resetTransform, centerView } = va
              { !reset ? handleReset(resetTransform) : () => { } }
              return (
                < >
                  <div className="bg-white flex w-full h-8 items-center justify-between absolute z-10 transform translate-y-[-32px]">
                    <div className="flex">
                      <ButtonConstrolsLienzo onClick={() => zoomIn(0.1)}>
                        <SearchIcon className="w-[13px] h-6" />
                        <span className="text-sm">+</span>
                      </ButtonConstrolsLienzo>
                      <ButtonConstrolsLienzo onClick={() => resetTransform()}>
                        <SearchIcon className="w-[13px] h-6" />
                        <span>100%</span>
                      </ButtonConstrolsLienzo>
                      <ButtonConstrolsLienzo onClick={() => zoomOut(0.1)}>
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
                    <div className="flex text-gray-700 items-center pr-2 md:pr-3  gap-2 curso">
                      <mdIcons.MdSettings className="w-6 h-6 cursor-pointer" onClick={() => setShowSetup(!showSetup)} />
                      {!fullScreen
                        ? <mdIcons.MdFullscreen className="w-7 h-7 cursor-pointer" onClick={() => setFullScreen(!fullScreen)} />
                        : <mdIcons.MdFullscreenExit className="w-7 h-7 cursor-pointer" onClick={() => setFullScreen(!fullScreen)} />
                      }
                    </div>
                  </div>
                  <div className="bg-gray-200 w-52 *h-5 grid grid-cols-2 absolute z-[1020] top-0 left-8 rounded-b-md opacity-70 *items-center text-[9px] px-2 text-gray-800">
                    <span>{`Tamaño: ${lienzo.ancho / 100}x${lienzo.alto / 100}mts`}</span>
                    <span>{`Zoom: 100`}</span>
                  </div>
                  {showSetup && <div className="bg-white w-20 h-20 flex flex-col absolute z-[1020] top-0 right-10 rounded-b-md shadow-md *items-center text-[9px] px-2 text-gray-800">
                    <span className="w-full text-center">Tamaño:</span>
                    <span className="flex flex-col">
                      Ancho:
                      <div>
                        <input type="number" name="scala" className="w-10 h-4 text-[8px]" value={`${lienzo.ancho / 100}`}
                          onChange={(e) => {
                            setLienzo({ ...lienzo, ancho: e?.target.value ? parseFloat(e.target.value) * 100 : 0 })
                          }}
                          onBlur={() => {
                            centerView()
                            resetTransform()
                          }} />
                        {` mts`}
                      </div>
                    </span>
                    <span className="flex flex-col">
                      Alto:
                      <div>
                        <input type="number" name="scala" className="w-10 h-4 text-[8px]" value={`${lienzo.alto / 100}`} onChange={(e) => {
                          setLienzo({ ...lienzo, alto: e?.target.value ? parseFloat(e.target.value) * 100 : 0 })
                        }}
                          onBlur={() => {
                            centerView()
                            resetTransform()
                          }} />
                        {` mts`}
                      </div>
                    </span>

                  </div>}
                  <style>{`
                  input[name=scala] {
                    padding: 0px 0px 0px 4px;
                    margin: 0px 0;
                    box-sizing: border-box;
                  }
                  `}</style>
                  {/* <Cuadricula className="w-100 h-100 text-black" /> */}
                  <TransformComponent
                    wrapperStyle={{ width: "98%", height: "98%", background: "red" }}
                    contentStyle={{ width: `${lienzo.ancho}px`, height: `${lienzo.alto}px`, background: "blue" }}
                  >
                    <div className="bg-gray-300 paper *border-4 lienzo border-indigo-600 flex justify-center items-center ">
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
            width: ${lienzo.ancho}px;
            height: ${lienzo.alto}px;
          }
        `}
      </style>
    </>
  )
}

export default Prueba