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
  const { event, planSpaceActive, setEditDefault } = EventContextProvider()
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
                      onClick={async () => {
                        setShowMiniMenu(false)
                        // Capturar el plano TAL CUAL en la web = una FOTO con la cuadrícula.
                        // La cuadrícula vive en el wrapper del zoom (.react-transform-wrapper),
                        // no en #lienzo-drop; por eso capturamos el wrapper (cuadrícula + mesas
                        // + muebles + textos, exactamente como se ve). Si falla → croquis vectorial.
                        let planoImage: string | undefined
                        try {
                          // html2canvas-pro (fork): soporta colores oklch/lab/color() de Tailwind v4.
                          // El html2canvas clásico (1.4.1) lanzaba con oklch → abortaba la captura → croquis.
                          const html2canvas = (await import('html2canvas-pro')).default
                          // Capturar el CONTENIDO del plano (#lienzo-drop) a tamaño natural = el
                          // plano ENTERO con mesas, sillas, ICONOS de mobiliario y TEXTOS. NO se
                          // captura el wrapper del zoom (.react-transform-wrapper): su transform
                          // rompe html2canvas (por eso salía el croquis de fallback). Se añade la
                          // cuadrícula temporal por CSS para que la foto salga como en la web.
                          const el = document.getElementById('lienzo-drop')
                          if (el) {
                            const prev = { background: el.style.background, backgroundImage: el.style.backgroundImage, backgroundSize: el.style.backgroundSize }
                            el.style.background = '#F3F1EC'
                            el.style.backgroundImage = 'linear-gradient(#E4E1D8 1px, transparent 1px), linear-gradient(90deg, #E4E1D8 1px, transparent 1px)'
                            el.style.backgroundSize = '44px 44px'
                            const w = el.scrollWidth || (lienzo?.width ?? 0)
                            const h = el.scrollHeight || (lienzo?.height ?? 0)
                            try {
                              const canvas = await html2canvas(el, { backgroundColor: '#F3F1EC', height: h, logging: false, scale: 2, useCORS: true, width: w, windowHeight: h, windowWidth: w } as any)
                              planoImage = canvas.toDataURL('image/png')
                            } finally {
                              el.style.background = prev.background
                              el.style.backgroundImage = prev.backgroundImage
                              el.style.backgroundSize = prev.backgroundSize
                            }
                          }
                        } catch (e) {
                          console.warn('[exportPDF] captura del plano falló; uso croquis vectorial:', e)
                        }
                        const ok = exportPlanoPdf({ planSpaceActive, event, planoTitle: t(planSpaceActive?.title), planoImage })
                        if (!ok) toast('error', t('pdferror') || 'No se pudo generar el PDF')
                      }}
                      className="w-full flex items-center gap-2 text-left font-semibold py-1.5 mb-1 border-b border-gray-100 hover:text-primary"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0" aria-hidden="true">
                        <path d="M6.5 2.75h7L18 7.25V19a2.25 2.25 0 0 1-2.25 2.25H6.5A2.25 2.25 0 0 1 4.25 19V5A2.25 2.25 0 0 1 6.5 2.75Z" fill="#fff" stroke="#EF5B94" strokeWidth="1.5" />
                        <path d="M13.25 2.75V7.5H18" stroke="#EF5B94" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <rect x="4.25" y="12.4" width="13.75" height="5.9" rx="1.4" fill="#EF5B94" />
                        <text x="11.1" y="16.75" textAnchor="middle" fontFamily="'Poppins',Arial,sans-serif" fontSize="4.3" fontWeight="700" fill="#fff">PDF</text>
                      </svg>{t('exportpdf') || 'Exportar PDF'}
                    </button>
                    {/* "Guardar como plantilla" eliminado del menú (petición): solo Exportar PDF. */}
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
                <div className="bg-white absolute z-[50] top-9 right-8 rounded-2xl border border-[#f0f0f2] w-[252px] p-4 text-gray-800" style={{ fontFamily: "'Poppins',sans-serif", boxShadow: "0 16px 44px rgba(0,0,0,.18)" }}>
                  <div className="flex items-center gap-2.5 mb-3.5">
                    <div className="w-8 h-8 rounded-[10px] bg-[#FCE7F0] text-[#EF5B94] flex items-center justify-center flex-none">
                      <mdIcons.MdSettings className="w-[17px] h-[17px]" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13px] font-bold text-[#3A3A42] leading-tight">{t("planosettings") || "Configuración del plano"}</div>
                      <div className="text-[10.5px] text-[#a0a0a8]">{t("planosettingssub") || "Medidas reales del espacio"}</div>
                    </div>
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wide text-[#b3b3ba] mb-2">{t("canvassize")}</div>
                  <div className="flex flex-col gap-2 mb-3.5">
                    <InputMini label={"ancho"} lienzo={lienzo} setLienzo={setLienzo} centerView={centerView} resetTransform={resetTransform} />
                    <InputMini label={"alto"} lienzo={lienzo} setLienzo={setLienzo} centerView={centerView} resetTransform={resetTransform} />
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wide text-[#b3b3ba] mb-2">{t("seatingspace")}</div>
                  <div className="flex flex-col gap-2">
                    <InputMini label={"espacio"} lienzo={lienzo} setLienzo={setLienzo} centerView={centerView} resetTransform={resetTransform} />
                  </div>
                  <div className="mt-3.5 pt-3 border-t border-[#f4f4f6] text-[10px] text-[#a0a0a8] leading-relaxed">
                    {t("planosettingshint") || "«Ancho» y «Alto» definen el tamaño del lienzo. «Espacio entre asientos» ajusta la separación entre sillas."}
                  </div>
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
          onClick={(e) => {
            // Click en el PLANO vacío (no sobre una mesa/elemento) → deseleccionar (fiel al HTML clearSel).
            const el = e.target as HTMLElement
            if (!el.closest('[id^="element_"]') && !el.closest('[id^="table_"]')) setEditDefault({})
          }}
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