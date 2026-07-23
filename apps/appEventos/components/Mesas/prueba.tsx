import { FC, useEffect, useRef, useState } from "react"
import { TransformWrapper } from "react-zoom-pan-pinch";
import { ComponenteTransformWrapper } from "./ComponenteTransformWrapper";
import { EventContextProvider } from "../../context";
import { size } from "../../utils/Interfaces";
import { EditDefault } from "./EditDefault";
import ClickAwayListener from "react-click-away-listener";
import { useTranslation } from "react-i18next";
import { HiTemplate } from "react-icons/hi";

type propsPrueba = {
  setShowFormEditar: any
  fullScreen: boolean
  setFullScreen: any
}

const Prueba: FC<propsPrueba> = ({ setShowFormEditar, fullScreen, setFullScreen }) => {
  const { t } = useTranslation()
  const { planSpaceSelect } = EventContextProvider()
  const refDiv = useRef(null)
  const [scaleIni, setScaleIni] = useState(0)
  const [disableWrapper, setDisableWrapper] = useState(false)
  const [disableDrag, setDisableDrag] = useState(true)
  const { event, editDefault, setEditDefault } = EventContextProvider()
  const [lienzo, setLienzo] = useState<size>(event?.planSpace?.find(elem => elem?._id === planSpaceSelect)?.size)

  useEffect(() => {
    setLienzo(event?.planSpace?.find(elem => elem?._id === planSpaceSelect)?.size)
  }, [planSpaceSelect])

  const handleSetDisableDrag: any = () => {
    setDisableDrag(!disableDrag)
  }

  const calculoEscala = (lienzo: size, contenedor: any) => {
    // BUG-4 (informe QA 21-jun): sin guard, lienzo?.width undefined → NaN
    // en initialScale → canvas no renderiza.
    const w = lienzo?.width
    const h = lienzo?.height
    if (!contenedor?.current || !w || !h) return 0
    const sX = contenedor.current.offsetWidth * 100 / w
    const sY = contenedor.current.offsetHeight * 100 / h
    const asd = Math.min(sX, sY) / 100
    return Number.isFinite(asd) && asd > 0 ? asd : 0
  }

  useEffect(() => {
    setScaleIni(calculoEscala(lienzo, refDiv))
  }, [lienzo, fullScreen, refDiv?.current?.offsetWidth, refDiv?.current?.offsetHeight])

  return (
    <>
      <div className="flex divOrange w-[100%] h-[100%] justify-start relative pt-8" >
        {/* BUG-6 (informe QA 21-jun): bg-blue-200 era debug hardcoded. Cambiamos a
            bg-base (token de tema) para que respete el diseño del whitelabel. */}
        <div id="rootElementTables" ref={refDiv} className="bg-base flex w-[100%] h-[calc(100%-32px)] relative">
          {/* Barra lateral izquierda: solo para mesas y texto. El mobiliario usa los
              controles SOBRE el elemento (papelera + −/＋), fieles al HTML (DragableDefault). */}
          {editDefault?.clicked && !(editDefault?.itemTipo === "element" && editDefault?.item?.tipo !== "text") &&
            <ClickAwayListener
              onClickAway={() => {
                if (editDefault.activeButtons) {
                  // setEditDefault({ ...editDefault, active: true })
                }
              }}
              mouseEvent="mousedown"
              touchEvent="touchstart">
              <div
                onMouseDown={() => setEditDefault({ ...editDefault, active: false })}
                onTouchStart={() => setEditDefault({ ...editDefault, active: false })}
                className={`bg-gray-200 opacity-70 w-10 h-44 absolute z-[20] left-0 top-12 rounded-r-lg`}>
                <EditDefault {...editDefault} />
              </div>
            </ClickAwayListener>
          }
          {/* OJO: usar ternario, NO `scaleIni && ...`. Con scaleIni===0 (número), React
              renderizaba literalmente «0» en el lienzo (bug clásico). Además, si no hay
              plano cargado (sin lienzo), mostramos un mensaje en vez de un lienzo en blanco. */}
          {scaleIni ? (
            <TransformWrapper
              disabled={disableWrapper}
              limitToBounds={true}
              initialScale={scaleIni}
              minScale={scaleIni}
              maxScale={6}
              wheel={{ step: 0.25 }}
              pinch={{ step: 5 }}
              doubleClick={{ step: 0.5 }}
              centerOnInit={false}
            >
              {(params) => {
                return <ComponenteTransformWrapper {...params} fullScreen={fullScreen} setFullScreen={setFullScreen} disableWrapper={disableWrapper} setDisableWrapper={setDisableWrapper} lienzo={lienzo} setLienzo={setLienzo} setShowFormEditar={setShowFormEditar} scaleIni={scaleIni} />
              }}
            </TransformWrapper>
          ) : (
            !lienzo ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2.5 text-center px-6">
                <div className="w-14 h-14 rounded-full bg-white border-2 border-dashed border-[#f0aecb] flex items-center justify-center text-[#EF5B94]">
                  <HiTemplate className="w-6 h-6" />
                </div>
                <div className="text-[15px] font-semibold text-[#3A3A42]">{t('noplanloaded') || 'No hay un plano cargado'}</div>
                <div className="text-[12px] text-[#8a8a90] max-w-[280px]">{t('selectplanhint') || 'Selecciona un espacio en la pestaña «Planos» para ver y editar sus mesas.'}</div>
              </div>
            ) : null
          )}
        </div>
      </div>
    </>
  )
}

export default Prueba
