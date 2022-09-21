import { Dispatch, FC, SetStateAction, useEffect, useRef, useState } from "react"
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { Dragable } from "./PruebaDragable";
import { ActualizarPosicion, AddInvitado, handleScale, useScreenSize } from "./FuntionsDragable";

const Prueba: FC = () => {
  let { width, height } = useScreenSize()
  const [scrX, setScrX] = useState(0)
  const [scrY, setScrY] = useState(0)
  const [reset, setReset] = useState(false)
  const [scaleIni, setScaleIni] = useState(0)
  const [scale, setScale] = useState(0)
  const [oculto, setOculto] = useState(true)
  const [disableWrapper, setDisableWrapper] = useState(false)
  const lienzo = {
    ancho: 2048,
    alto: 800
  }

  useEffect(() => {
    setScrX(window.innerWidth)
    setScrY(window.innerHeight)
    const scaleResult = handleScale(window.innerWidth, window.innerHeight, lienzo)
    const calScale = scaleResult / 100
    setScaleIni(calScale)
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
      <div className="bg-orange-500 divOrange flex justify-center " >
        <TransformWrapper
          disabled={disableWrapper}
          limitToBounds={true}
          initialScale={scaleIni}
          minScale={scaleIni}
          maxScale={6}
          //initialPositionX={500}
          //initialPositionY={500}
          //centerZoomedOut={true}
          centerOnInit={true}
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
              <div className="flex items-start gap-3 absolute top-5 left-5">
                <div className="flex flex-col rounded-md w-max h-max bg-white z-40 shadow border border-gray-200  text-xl ">
                  <button
                    className="px-2 py-1 text-gray-500 hover:text-gray-800"
                    onClick={() => zoomIn()}
                  >
                    +
                  </button>
                  <button
                    className="px-2 py-1 text-gray-500 hover:text-gray-800"
                    onClick={() => zoomOut()}
                  >
                    -
                  </button>
                </div>
                <div className="flex flex-col rounded-full w-8 h-8 bg-white z-40 shadow border border-gray-200 top-5 left-5 text-lg items-center justify-center ">
                  <button
                    id="zon"
                    className="px-2 py-1 text-gray-500 hover:text-gray-800"
                    onClick={() => resetTransform()}
                  >
                    x
                  </button>
                </div>
              </div>
              <TransformComponent wrapperClass="contenedor">
                <div className="bg-red border-4 lienzo border-indigo-600 flex justify-center items-center ">
                  <Dragable scale={Math.round(scale * 100) / 100} lienzo={lienzo} setDisableWrapper={setDisableWrapper} AddInvitado={AddInvitado} />
                </div>
              </TransformComponent> </>)}
        </TransformWrapper>
      </div>

      <style >
        {`
          .divOrange {
            width: calc(${width == 0 ? scrX / 12 * 9 : width / 12 * 9}px);
            height: calc(100vh - 144px);
          }
          .contenedor {
            background-color: cyan;
            calc(${width == 0 ? scrX / 12 * 9 : width / 12 * 9}px);
            height: calc(100vh - 144px);
          }
          .div3 {
            background-color: white;
          }
          .lienzo {
            width: ${lienzo.ancho}px;
            height: ${lienzo.alto}px;
          }

          @media (max-width: 767px) and (orientation: portrait) {
            .divOrange {
              width: calc(${scrX}px - 30px);
              height: calc(100vh - 144px);
            }
            .contenedor {
              background-color: cyan;
              width: calc(${scrX}px - 30px);
              height: calc(100vh / 2);
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