import { Dispatch, FC, ReactNode, SetStateAction, useState } from "react"
import { size } from "../../utils/Interfaces"
import { AuthContextProvider, EventContextProvider } from "../../context"
import { fetchApiEventos, fetchApiBodas, queries } from "../../utils/Fetching"
import { useAllowed } from "../../hooks/useAllowed"
import { useTranslation } from "react-i18next"

interface propsInputMini {
  label: string
  lienzo: size
  setLienzo: Dispatch<SetStateAction<size>>
  centerView: any
  resetTransform: any
}

// Iconos por campo (rediseño modal ajustes: más intuitivo). stroke=currentColor.
const FIELD_ICON: Record<string, ReactNode> = {
  ancho: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M3 12h18M6 8l-4 4 4 4M18 8l4 4-4 4" /></svg>,
  alto: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v18M8 6l4-4 4 4M8 18l4 4 4-4" /></svg>,
  espacio: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="9" width="6" height="8" rx="1.2" /><rect x="15" y="9" width="6" height="8" rx="1.2" /><path d="M11 13h2" /></svg>,
}

export const InputMini: FC<propsInputMini> = ({ label, lienzo, setLienzo, centerView, resetTransform, }) => {
  const [isAllowed, ht] = useAllowed()
  const { user } = AuthContextProvider()
  const { event, setEvent, planSpaceActive, setPlanSpaceActive, planSpaceSelect } = EventContextProvider()
  const [idxPlanSpace, setIdxPlanSpace] = useState(event.planSpace.findIndex(elem => elem._id === planSpaceSelect))
  const [value, setValue] = useState(
    label === "alto" || label === "ancho"
      ? `${lienzo[`${label == "alto" ? "height" : "width"}`] / 100}`
      : `${planSpaceActive.spaceChairs / 100}`
  )
  const { t } = useTranslation();

  const handleOnChange = (e) => {
    try {
      setValue(e.target.value)
      if (e.target.value !== "") {
        const parsedValue = e?.target.value ? parseFloat(e.target.value) * 100 : 0
        const sizeKey = label === "alto" ? "height" : "width"
        // Pre-calcular planSpace nuevo según el tipo de cambio.
        let newPlanSpace = event.planSpace
        if (label === "alto" || label === "ancho") {
          newPlanSpace = event.planSpace.map((ps, i) =>
            i !== idxPlanSpace ? ps : { ...ps, size: { ...ps.size, [sizeKey]: parsedValue } }
          )
          setLienzo({ ...lienzo, [sizeKey]: parsedValue })
        }
        if (label === "espacio") {
          newPlanSpace = event.planSpace.map((ps, i) =>
            i !== idxPlanSpace ? ps : { ...ps, spaceChairs: parsedValue }
          )
          setPlanSpaceActive(newPlanSpace[idxPlanSpace])
        }
        fetchApiBodas({
          query: queries.eventUpdate,
          variables: { idEvento: event._id, input: { planSpace: newPlanSpace } }, token: null
        })
        setEvent((prev) => ({ ...prev, planSpace: newPlanSpace }))
      }
    } catch {
    }
  }

  const handleOnBlur = () => {
    if (label == "alto" || label === "ancho") {
      setValue(`${lienzo[`${label == "alto" ? "height" : "width"}`] / 100}`)
      centerView()
      resetTransform()
    }
    if (label === "espacio") {
      setValue(`${planSpaceActive.spaceChairs / 100}`)
    }
  }

  return (
    <div className="w-full flex items-center justify-between gap-2" style={{ fontFamily: "'Poppins',sans-serif" }}>
      <span className="flex items-center gap-2 text-[12px] font-medium text-[#6b6b72] capitalize">
        <span className="text-[#EF5B94] flex-none">{FIELD_ICON[label] || null}</span>
        {label && t(label)}
      </span>
      <div className="flex items-center gap-1.5 flex-none">
        <input
          disabled={!isAllowed()}
          type="number"
          step={0.01}
          name="scala"
          className="w-[54px] h-8 text-[13px] text-center rounded-[9px] border-[1.5px] border-[#E7E7EA] focus:border-[#EF5B94] outline-none font-semibold text-[#3A3A42] disabled:opacity-60 bg-white"
          value={`${value}`}
          onChange={(e) => { handleOnChange(e) }}
          onBlur={handleOnBlur}
        />
        <span className="text-[11px] text-[#a0a0a8] w-6">mts</span>
      </div>
    </div>
  )
}
