import { FC, useEffect, useState } from "react";
import { WarningIcon } from "../icons";
import * as mdIcons from "react-icons/md";
import { TransformComponent } from "react-zoom-pan-pinch";
import { LiezoDragable } from "./LienzoDragable";
import { useToast } from "../../hooks/useToast";
import { InputMini } from "./InputMini";
import { MdSaveAlt } from "react-icons/md"
import { AuthContextProvider, EventContextProvider, EventsGroupContextProvider } from "../../context";
import ClickAwayListener from "react-click-away-listener";
import { fetchApiEventos, queries } from "../../utils/Fetching";
import { useAllowed } from "../../hooks/useAllowed";
import { useTranslation } from 'react-i18next';
import { exportPlanoPdf } from "../../utils/exportPlanoPdf";

interface propsComponenteTransformWrapper {
  zoomIn: any
  zoomOut: any
  resetTransform: any
  centerView: any
  state: any
  setFullScreen: any
  disableWrapper: any
  setDisableWrapper: any
  fullScreen: any
  lienzo: any
  setLienzo: any
  setShowFormEditar: any
  scaleIni: any
}

export const ComponenteTransformWrapper: FC<propsComponenteTransformWrapper> = ({ zoomIn, zoomOut, resetTransform, centerView, setFullScreen, disableWrapper, setDisableWrapper, fullScreen, lienzo, setLienzo, setShowFormEditar, scaleIni, state, ...params }) => {
  const { t } = useTranslation();
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
  const [isAllowed, ht] = useAllowed()

  useEffect(() => {
    centerView(scaleIni)
  }, [scaleIni])

  const handleReset = (funcion: any) => {
    funcion(scaleIni)
    setTimeout(() => {
      setReset(true)
    }, 100);
  }

  useEffect(() => {
    centerView(scaleIni)
  }, [fullScreen])

  useEffect(() => {
    handleReset(centerView)
  }, [lienzo])

  const handleSetDisableDrag: any = () => {
    setDisableDrag(!disableDrag)
  }

  useEffect(() => {
    if (!ident) {
      setValir(true)
    }
  }, [ident])

  !reset ? handleReset(centerView) : () => { }
  return (
    < >
      {/* Controles FLOTANTES sobre el plano (fiel a MESAS.dc.html): sin franja/barra, cada
          grupo es una pastilla que flota sobre el beige. pointer-events-none en el contenedor
          + auto en los hijos → los huecos transparentes no bloquean el lienzo. */}
      <div className="flex w-full items-center justify-between absolute z-[20] top-2 left-0 px-2 md:px-3 gap-2 pointer-events-none [&>*]:pointer-events-auto">
        <div className="flex items-center gap-2">
          {/* Rediseño Fase C: zoom agrupado en pastilla blanca (fiel a MESAS.dc.html).
              Mismos handlers: zoomOut/centerView(reset a ajuste)/zoomIn. */}
          <div className="flex items-center bg-white rounded-lg border border-[#f0f0f2] shadow-sm overflow-hidden h-7">
            <button type="button" onClick={() => zoomOut(0.1)} className="w-7 h-7 flex items-center justify-center text-[#EF5B94] text-base leading-none md:hover:bg-[#FCF2F6] transition">−</button>
            <button type="button" onClick={() => centerView(scaleIni)} title={t('adjust') || 'Ajustar'} className="px-2 h-7 min-w-[46px] text-[11px] font-bold text-[#3A3A42] md:hover:bg-[#FCF2F6] transition">{Math.round((state?.previousScale || 1) * 100)}%</button>
            <button type="button" onClick={() => zoomIn(0.1)} className="w-7 h-7 flex items-center justify-center text-[#EF5B94] text-base leading-none md:hover:bg-[#FCF2F6] transition">＋</button>
          </div>
          {/* Bloquear/Desbloquear plano — pastilla flotante fiel al HTML (🔒 + texto),
              sustituye al ButtonConstrolsLienzo con pulso + al icono Lock separado. */}
          <button
            type="button"
            onClick={() => {
              window.getSelection()?.removeAllRanges()
              !isAllowed() ? ht() : handleSetDisableDrag()
            }}
            className="flex items-center gap-1.5 bg-white rounded-lg shadow-sm border border-[#f0f0f2] px-3 py-1.5 text-[12px] font-semibold text-[#3A3A42] md:hover:bg-[#FCF2F6] transition whitespace-nowrap"
          >
            <span className="text-[13px] leading-none">🔒</span>
            {disableDrag ? t('unlockfloorplan') : t('lockflat')}
          </button>
          {/* Plano actual — pastilla flotante rosa marca, integrada en el grupo izq (fiel al HTML) */}
          <div className="hidden sm:block bg-white rounded-lg shadow-sm border border-[#f0f0f2] px-3 py-1.5 text-[10px] font-semibold text-[#EF5B94] truncate max-w-[220px]">
            {`${t("plan")}: ${t(planSpaceActive?.title)} · ${lienzo?.width / 100}×${lienzo?.height / 100} m`}
          </div>
        </div>
        <div className="flex text-red items-center pr-2 md:pr-3 gap-1 md:gap-2">
          {/* PDF suelto eliminado para un plano más limpio: ahora "Exportar PDF" vive
              DENTRO del menú del icono de descargas (abajo). */}
          <ClickAwayListener onClickAway={() => setShowMiniMenu(false)}>
            <div>
              <MdSaveAlt className="h-6 w-6 cursor-pointer text-primary" onClick={() => { !isAllowed() ? ht() : setShowMiniMenu(!showMiniMenu) }} />
              {showMiniMenu &&
                <div className="bg-white flex flex-col absolute z-[50] top-8 right-18 rounded-b-md shadow-md items-center text-[9px] px-3 pt-1 pb-3 text-gray-800 gap-y-2">
                  <div className="bg-white flex flex-col absolute z-[10] top-[0px] right-0 rounded-b-md shadow-md min-w-[140px] md:min-w-[120px] items-center text-[10px] md:text-[12px] px-3 pt-1 pb-2 text-gray-800">
                    {/* Exportar PDF — movido aquí desde el icono suelto (plano más limpio) */}
                    <button
                      onClick={() => {
                        setShowMiniMenu(false)
                        const ok = exportPlanoPdf({ planSpaceActive, event, planoTitle: t(planSpaceActive?.title) })
                        if (!ok) toast('error', t('popupblocked') || 'Permite las ventanas emergentes para exportar el PDF')
                      }}
                      className="w-full flex items-center gap-2 text-left font-semibold py-1.5 mb-1 border-b border-gray-100 hover:text-primary"
                    >
                      <mdIcons.MdPictureAsPdf className="w-4 h-4 text-primary" />{t('exportpdf') || 'Exportar PDF'}
                    </button>
                    <span className="w-full text-left font-bold transform -ml-2">{t("savetemplate")}</span>
                    <span className="flex flex-col text-[9px] md:text-[11px]">
                      <span className="capitalize">{t("names")}</span>
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => {
                          setValue(e.target.value)
                          const exists = psTemplates?.some(t => t.title === e.target.value)
                          setident(!!exists)
                        }}
                        placeholder={t("templatename") || "Nombre del plano"}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-xs mt-1 focus:border-primary focus:outline-none"
                      />
                      <div className="relative">
                        {!valir && <p className="w-[75%] font-display absolute rounded-xl text-xs left-0 bottom-0 transform translate-y-full text-red flex gap-1"><WarningIcon className="w-4 h-4" />{t("saveitreplaces")}</p>}
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
                            } else {
                              const resp = await fetchApiEventos({
                                query: queries.createPsTemplate,
                                variables: {
                                  evento_id: event._id,
                                  template: {
                                    planSpaceID: planSpaceActive._id,
                                    title: value,
                                    uid: user?.uid
                                  }
                                }
                              })
                              setPsTemplates(old => {
                                old.push(resp)
                                return [...old]
                              })
                            }
                          }
                          setValue("")
                          toast("success", t("savedtemplate"))
                        }}
                          className="bg-primary w-16 h-5 rounded-lg text-white capitalize">{t("save")}</button>
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
                <div className="bg-white flex flex-col absolute z-[10] top-8 right-12 rounded-b-md shadow-md min-w-[95px] md:min-w-[120px] items-center text-[10px] md:text-[12px] px-3 pt-1 pb-3 text-gray-800">
                  <span className="w-full text-left font-bold transform -ml-2">{t("canvassize")}</span>
                  <InputMini label={"ancho"} lienzo={lienzo} setLienzo={setLienzo} centerView={centerView} resetTransform={resetTransform} />
                  <InputMini label={"alto"} lienzo={lienzo} setLienzo={setLienzo} centerView={centerView} resetTransform={resetTransform} />
                  <span className="w-full text-left font-bold transform -ml-2 mt-2">{t("seatingspace")}</span>
                  <InputMini label={"espacio"} lienzo={lienzo} setLienzo={setLienzo} centerView={centerView} resetTransform={resetTransform} />
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
      {/* <Cuadricula className="w-100 h-100 text-black" /> */}
      <TransformComponent
        wrapperStyle={{
          width: "100%",
          height: "100%",
          // Fiel al prototipo MESAS.dc.html: la RETÍCULA es un fondo ESTÁTICO que llena TODO
          // el viewport (no solo la caja del plano). Beige #F3F1EC + líneas #E4E1D8, 44px.
          background: "#F3F1EC",
          backgroundImage:
            "linear-gradient(#E4E1D8 1px, transparent 1px), linear-gradient(90deg, #E4E1D8 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
        contentStyle={{
          width: `${lienzo?.width}px`,
          height: `${lienzo?.height}px`,
          // Transparente: deja ver la retícula estática del wrapper por todo el plano
          // (antes tenía su propia retícula acotada a la caja + borde morado).
          background: "transparent",
        }}
      >
        <div
          id={"lienzo-drop"}
          className="js-dropTables bg-transparent lienzo flex justify-center items-center">
          <LiezoDragable scale={state.scale} lienzo={lienzo} setDisableWrapper={setDisableWrapper} disableDrag={disableDrag} setShowFormEditar={setShowFormEditar} />
        </div>
      </TransformComponent>
      {/* Estado vacío (rediseño Fase C, fiel a MESAS.dc.html): cuando el plano no tiene
          mesas. El CTA abre el panel "Diseñar mesa" disparando el evento global que
          escucha TableConfiguratorFloating. pointer-events-none salvo el botón, para no
          bloquear el dropzone js-dropTables. */}
      {(planSpaceActive?.tables?.length ?? 0) === 0 && (
        <div className="absolute inset-0 z-[15] flex flex-col items-center justify-center gap-3.5 pointer-events-none px-4">
          <div className="w-16 h-16 rounded-full bg-white border-2 border-dashed border-[#f0aecb] flex items-center justify-center text-[#EF5B94] shadow-[0_6px_18px_rgba(0,0,0,.06)]">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><ellipse cx="12" cy="9" rx="8" ry="3"></ellipse><path d="M6 10v8M18 10v8"></path></svg>
          </div>
          <div className="text-center">
            <div className="text-[16px] font-bold text-[#3A3A42]">{t("notablesyet") || "Aún no hay mesas"}</div>
            <div className="text-[12.5px] font-medium text-[#8a8a90] mt-0.5">{t("startcreatingtable") || "Empieza creando tu primera mesa para este espacio."}</div>
          </div>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('open-table-designer'))}
            className="pointer-events-auto px-[22px] py-[13px] rounded-[10px] bg-[#EF5B94] text-white text-[13.5px] font-semibold shadow-[0_8px_20px_rgba(239,91,148,.35)]"
          >
            ＋ {t("createfirsttable") || "Crea tu primera mesa"}
          </button>
        </div>
      )}
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