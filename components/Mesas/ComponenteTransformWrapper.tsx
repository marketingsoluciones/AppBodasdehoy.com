import { FC, useEffect, useState } from "react";
import { ButtonConstrolsLienzo } from "./ControlsLienzo";
import { Lock, SearchIcon } from "../icons";
import * as mdIcons from "react-icons/md";
import { TransformComponent } from "react-zoom-pan-pinch";
import { LiezoDragable } from "./LienzoDragable";
import { useToast } from "../../hooks/useToast";
import { InputMini } from "./InputMini";
import { BiDotsVerticalRounded } from "react-icons/bi"
import { EventContextProvider } from "../../context";
import ClickAwayListener from "react-click-away-listener";
import Select from 'react-select'
import { planSpace } from "../../utils/Interfaces";



export const ComponenteTransformWrapper: FC<any> = ({ zoomIn, zoomOut, setTransform, resetTransform, centerView, state, setFullScreen, disableWrapper,
  setDisableWrapper, fullScreen, lienzo, setLienzo, scale, setScale, setShowFormEditar, scaleIni, ...rest }) => {
  const [reset, setReset] = useState(false)
  const [disableDrag, setDisableDrag] = useState(true)
  const toast = useToast()
  const [showSetup, setShowSetup] = useState(false)
  const [showMiniMenu, setShowMiniMenu] = useState(false)
  const { event, planSpaceActive } = EventContextProvider()

  useEffect(() => {
    resetTransform()
  }, [scaleIni])

  const handleReset = (funcion: any) => {
    funcion()
    setTimeout(() => {
      setReset(true)
    }, 100);
  }

  useEffect(() => {
    handleReset(resetTransform)
  }, [lienzo])


  const handleSetDisableDrag: any = () => {
    setDisableDrag(!disableDrag)
  }

  !reset ? handleReset(resetTransform) : () => { }
  return (
    < >
      <div className="bg-white flex w-full h-8 items-center justify-between absolute z-[20] transform translate-y-[-32px] shadow-md pl-1 md:pl-2">
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
          <span className={`${disableDrag ? "block" : "hidden"}  `} onClick={() => { toast("error", "Desbloquea el plano para poder mover las mesas ") }}>
            <Lock className="text-primary md:block h-6 w-5" />
          </span>
        </div>
        <div className="flex text-red-700 items-center pr-2 md:pr-3 gap-1 md:gap-2 curso">
          <ClickAwayListener onClickAway={() => setShowMiniMenu(false)}>
            <div>
              <BiDotsVerticalRounded className="h-6 w-6 cursor-pointer text-primary" onClick={() => setShowMiniMenu(!showMiniMenu)} />
              {showMiniMenu &&
                <div className="bg-white flex flex-col absolute z-[50] top-8 right-20 rounded-b-md shadow-md *items-center text-[9px] px-3 pt-1 pb-3 text-gray-800 gap-y-2">
                  <div className="flex flex-col bg-red">
                    <span className="w-full text-left">Seleccionar plano:</span>
                    <select className="capitalize w-40 cursor-pointer text-xs text-gray-500 border border-gray-600 focus:border-primary transition py-0 pr-7 rounded-sm focus:outline-none  " >
                      {event.planSpace.map((elem: planSpace, idx: number) => {
                        console.log(idx, elem)
                        return (
                          <option key={idx} value={elem.title}>{elem.title}</option>
                        )
                      })}
                    </select>
                  </div>
                  <div className="flex flex-col bg-red">
                    <span className="w-full text-left">Guardar plantilla:</span>
                    <select className="capitalize w-40 cursor-pointer text-xs text-gray-500 border border-gray-600 focus:border-primary transition py-0 pr-7 rounded-sm focus:outline-none  " >
                      {event.planSpace.map((elem: planSpace, idx: number) => {
                        console.log(idx, elem)
                        return (
                          <option key={idx} value={elem.title}>{elem.title}</option>
                        )
                      })}
                    </select>
                  </div>
                </div>
              }
            </div>
          </ClickAwayListener>
          <ClickAwayListener onClickAway={() => setShowSetup(false)}>
            <div>
              <mdIcons.MdSettings className="w-6 h-6 cursor-pointer text-primary" onClick={() => setShowSetup(!showSetup)} />
              {showSetup &&
                <div className="bg-white flex flex-col absolute z-[10] top-8 right-12 rounded-b-md shadow-md min-w-[95px] md:min-w-[120px] *items-center text-[10px] md:text-[12px] px-3 pt-1 pb-3 text-gray-800">
                  <span className="w-full text-left font-bold transform -ml-2">Tamaño lienzo:</span>
                  <InputMini label="ancho" lienzo={lienzo} setLienzo={setLienzo} centerView={centerView} resetTransform={resetTransform} />
                  <InputMini label="alto" lienzo={lienzo} setLienzo={setLienzo} centerView={centerView} resetTransform={resetTransform} />
                  <span className="w-full text-left font-bold transform -ml-2 mt-2">Espacio asiento:</span>
                  <InputMini label="espacio" lienzo={lienzo} setLienzo={setLienzo} centerView={centerView} resetTransform={resetTransform} />
                </div>
              }
            </div>
          </ClickAwayListener>
          {!fullScreen
            ? <mdIcons.MdFullscreen className="w-7 h-7 cursor-pointer text-primary" onClick={() => setFullScreen(!fullScreen)} />
            : <mdIcons.MdFullscreenExit className="w-7 h-7 cursor-pointer text-primary" onClick={() => setFullScreen(!fullScreen)} />
          }
        </div>
      </div>


      <div className="bg-gray-200 w-80 *h-5 grid grid-cols-3 absolute z-[10] top-0 left-2 md:left-8 rounded-b-md opacity-70 *items-center text-[9px] md:text-[10px] px-2 text-gray-800">
        <span className="font-bold capitalize truncate">{`Plano: ${planSpaceActive?.title}`}</span>
        <span>{`Tamaño: ${lienzo?.width / 100}x${lienzo?.height / 100}mts`}</span>
        <span>{`Zoom: ${state.previousScale.toFixed(2)}X`}</span>
      </div>

      {/* <Cuadricula className="w-100 h-100 text-black" /> */}
      <TransformComponent
        wrapperStyle={{ width: "100%", height: "100%", background: "gray" }}
        contentStyle={{ width: `${lienzo?.width}px`, height: `${lienzo?.height}px`, background: "blue" }}
      >
        <div id={"lienzo-drop"} className="js-dropTables bg-gray-300 paper lienzo flex justify-center items-center">
          <div className="lienzo border-4 border-indigo-600"></div>
          <LiezoDragable scalePrevious={state.previousScale} scale={state.scale} lienzo={lienzo} setDisableWrapper={setDisableWrapper} disableDrag={disableDrag} setShowFormEditar={setShowFormEditar} />
        </div>
      </TransformComponent>
      <style >
        {`
          .lienzo {
            width: ${lienzo?.width}px;
            height: ${lienzo?.height}px;
          }
        `}
      </style>
    </>
  )
}