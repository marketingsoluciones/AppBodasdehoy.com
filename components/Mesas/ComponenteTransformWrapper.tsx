import { FC, useEffect, useState } from "react";
import { ButtonConstrolsLienzo } from "./ControlsLienzo";
import { Lock, SearchIcon } from "../icons";
import * as mdIcons from "react-icons/md";
import { TransformComponent } from "react-zoom-pan-pinch";
import { Dragable } from "./PruebaDragable";
import { useToast } from "../../hooks/useToast";



export const Comp: FC<any> = ({ zoomIn, zoomOut, setTransform, resetTransform, centerView, state, setFullScreen, disableWrapper,
  setDisableWrapper, fullScreen, lienzo, setLienzo, scale, setScale, setShowFormEditar, scaleIni, ...rest }) => {
  const [reset, setReset] = useState(false)
  const [disableDrag, setDisableDrag] = useState(true)
  const toast = useToast()
  const [showSetup, setShowSetup] = useState(false)

  useEffect(() => {
    resetTransform()
  }, [scaleIni])

  const handleReset = (funcion: any) => {
    funcion()
    setTimeout(() => {
      setReset(true)
    }, 100);
  }
  const handleSetDisableDrag: any = () => {
    setDisableDrag(!disableDrag)
  }
  useEffect(() => {
    console.log("disableDrag(deshabilita mover mesa)", disableDrag)
  }, [disableDrag])

  !reset ? handleReset(resetTransform) : () => { }
  return (
    < >
      <div className="bg-white flex w-full h-8 items-center justify-between absolute z-10 transform translate-y-[-32px] shadow-md">
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
            <Lock className="text-primary md:block h-6 w-6" />
          </span>
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
        <span>{`Zoom: ${state.scale.toFixed(2)}X`}</span>
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
        wrapperStyle={{ width: "100%", height: "100%", background: "gray" }}
        contentStyle={{ width: `${lienzo.ancho}px`, height: `${lienzo.alto}px`, background: "blue" }}
      >
        <div className="bg-gray-300 paper border-4 lienzo border-indigo-600 flex justify-center items-center ">
          <Dragable scale={state.scale} lienzo={lienzo} setDisableWrapper={setDisableWrapper} disableDrag={disableDrag} setShowFormEditar={setShowFormEditar} />
        </div>
      </TransformComponent>
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