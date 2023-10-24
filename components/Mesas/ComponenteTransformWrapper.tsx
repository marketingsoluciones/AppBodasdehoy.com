import { FC, useEffect, useState } from "react";
import { ButtonConstrolsLienzo } from "./ControlsLienzo";
import { Lock, SearchIcon, WarningIcon } from "../icons";
import * as mdIcons from "react-icons/md";
import { TransformComponent } from "react-zoom-pan-pinch";
import { LiezoDragable } from "./LienzoDragable";
import { useToast } from "../../hooks/useToast";
import { InputMini } from "./InputMini";
import { BiDotsVerticalRounded } from "react-icons/bi"
import { MdOutlineRotate90DegreesCw } from "react-icons/md"
import { AuthContextProvider, EventContextProvider, EventsGroupContextProvider } from "../../context";
import ClickAwayListener from "react-click-away-listener";
import { planSpace } from "../../utils/Interfaces";
import { fetchApiEventos, queries } from "../../utils/Fetching";



export const ComponenteTransformWrapper: FC<any> = ({ zoomIn, zoomOut, setTransform, resetTransform, centerView, state, setFullScreen, disableWrapper,
  setDisableWrapper, fullScreen, lienzo, setLienzo, scale, setScale, setShowFormEditar, scaleIni, ...rest }) => {
  const [reset, setReset] = useState(false)
  const [disableDrag, setDisableDrag] = useState(true)
  const toast = useToast()
  const [showSetup, setShowSetup] = useState(false)
  const [showMiniMenu, setShowMiniMenu] = useState(false)
  const { user } = AuthContextProvider()
  const { event, planSpaceActive } = EventContextProvider()
  const { psTemplates, setPsTemplates } = EventsGroupContextProvider()
  const [value, setValue] = useState("")
  const [valir, setValir] = useState(true)
  const [ident, setident] = useState(false)

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

  useEffect(() => {
    if (!ident) {
      setValir(true)
    }
  }, [ident])


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
                <div className="bg-white flex flex-col absolute z-[50] top-8 right-18 rounded-b-md shadow-md *items-center text-[9px] px-3 pt-1 pb-3 text-gray-800 gap-y-2">
                  <div className="bg-white flex flex-col absolute z-[10] top-[0px] right-0 rounded-b-md shadow-md min-w-[140px] md:min-w-[120px] *items-center text-[10px] md:text-[12px] px-3 pt-1 pb-2 text-gray-800">
                    <span className="w-full text-left font-bold transform -ml-2">Guardar como plantilla:</span>
                    <span className="flex flex-col text-[9px] md:text-[11px]">
                      <span className="capitalize">nombre:</span>
                      <div className="relative">
                        <input type="text" className="w-64 h-4 text-[9px] md:text-[11px]"
                          value={`${value ? value : ""}`}
                          onChange={(e) => {
                            if (psTemplates?.findIndex(elem => elem.title === e.target.value) > -1) {
                              setident(true)
                            } else {
                              setident(false)
                            }
                            setValue(e.target.value)
                          }}
                        />
                        {!valir && <p className="w-[75%] font-display absolute rounded-xl text-xs left-0 bottom-0 transform translate-y-full text-red flex gap-1"><WarningIcon className="w-4 h-4" />Existe una plantilla con este nombre si guarda la sustituye</p>}
                      </div>
                      <div className="w-full flex justify-end mt-2 ">
                        <button onClick={async () => {
                          if (ident && valir) {
                            setValir(!valir)
                            return
                          }
                          if (value !== "") {
                            setShowMiniMenu(false)
                            setValir(true)
                            if (!valir) {
                              //aqui actualizo en vez de guarda
                              console.log("aqui actualizo en vez de guarda")
                            } else {
                              const resp = await fetchApiEventos({
                                query: queries.createPsTemplate,
                                variables: {
                                  eventID: event._id,
                                  planSpaceID: planSpaceActive._id,
                                  title: value,
                                  uid: user?.uid
                                }
                              })
                              setPsTemplates(old => {
                                old.push(resp)
                                return [...old]
                              })
                            }
                          }
                          setValue("")
                          toast("success", "Se guardó la plantilla")

                        }}
                          className="bg-primary w-16 h-5 rounded-lg text-white capitalize">guardar</button>
                      </div>
                    </span>
                  </div>
                </div>
              }
            </div>
          </ClickAwayListener>
          <ClickAwayListener onClickAway={() => {
            setShowSetup(false)
          }}>
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
          <LiezoDragable scale={state.scale} lienzo={lienzo} setDisableWrapper={setDisableWrapper} disableDrag={disableDrag} setShowFormEditar={setShowFormEditar} />
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