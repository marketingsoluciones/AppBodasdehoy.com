import { Dispatch, FC, SetStateAction, useEffect, useState } from "react"
import { size } from "../../utils/Interfaces"
import { EventContextProvider } from "../../context"
import { fetchApiEventos, queries } from "../../utils/Fetching"

interface propsInputMini {
  label: string
  lienzo: size
  setLienzo: Dispatch<SetStateAction<size>>
  centerView: any
  resetTransform: any
}

export const InputMini: FC<propsInputMini> = ({ label, lienzo, setLienzo, centerView, resetTransform, }) => {
  const { event, setEvent, planSpaceActive } = EventContextProvider()
  const [idxPlanSpace, setIdxPlanSpace] = useState(event.planSpace.findIndex(elem => elem._id === event.planSpaceSelect))
  const [value, setValue] = useState(
    label === "alto" || label === "ancho"
      ? `${lienzo[`${label == "alto" ? "height" : "width"}`] / 100}`
      : `${planSpaceActive.spaceChairs / 100}`
  )

  const handleOnChange = (e) => {
    console.log("aqui", e.target.value)
    try {
      setValue(e.target.value)
      if (e.target.value !== "") {
        const asd = { ...event }
        if (label === "alto" || label === "ancho") {
          asd.planSpace[idxPlanSpace].size[`${label == "alto" ? "height" : "width"}`] = e?.target.value ? parseFloat(e.target.value) * 100 : 0
          setLienzo({ ...lienzo, [`${label == "alto" ? "height" : "width"}`]: e?.target.value ? parseFloat(e.target.value) * 100 : 0 })
        }
        if (label === "espacio") {
          asd.planSpace[idxPlanSpace].spaceChairs = e?.target.value ? parseFloat(e.target.value) * 100 : 0
        }
        fetchApiEventos({
          query: queries.eventUpdate,
          variables: { idEvento: event._id, variable: "planSpace", value: JSON.stringify(asd.planSpace) }, token: null
        })
        setEvent({ ...asd })
      }
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <>
      <span className="flex flex-col text-[9px] md:text-[11px]">
        {label && <span className="capitalize">{label}:</span>}
        <div>
          <input type="number" step={0.01} name="scala" className="w-10 h-4 text-[9px] md:text-[11px]"
            value={`${value}`}
            onChange={(e) => { handleOnChange(e) }}
            onBlur={(e) => {
              if (label == "alto" || label === "ancho") {
                setValue(`${lienzo[`${label == "alto" ? "height" : "width"}`] / 100}`)
                centerView()
                resetTransform()
              }
              if (label === "espacio") {
                setValue(`${planSpaceActive.spaceChairs / 100}`)
              }
            }} />
          {` mts`}
        </div>
      </span>
      <style>{`
      input[name=scala] {
        padding: 0px 0px 0px 4px;
        margin: 0px 0;
        box-sizing: border-box;
      }
      `}</style>
    </>
  )
}