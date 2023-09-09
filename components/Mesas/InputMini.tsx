import { Dispatch, FC, SetStateAction, useState } from "react"
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
  const { event, setEvent } = EventContextProvider()
  const [idxPlanSpace, setIdxPlanSpace] = useState(event.planSpace.findIndex(elem => elem._id === event.planSpaceSelect))

  const handleOnChange = (e) => {
    try {
      const asd = { ...event }
      asd.planSpace[idxPlanSpace].size[`${label == "alto" ? "height" : "width"}`] = e?.target.value ? parseFloat(e.target.value) * 100 : 0
      fetchApiEventos({
        query: queries.eventUpdate,
        variables: { idEvento: event._id, variable: "planSpace", value: JSON.stringify(asd.planSpace) }, token: null
      })
      setLienzo({ ...lienzo, [`${label == "alto" ? "height" : "width"}`]: e?.target.value ? parseFloat(e.target.value) * 100 : 0 })
      setEvent({ ...asd })
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <>
      <span className="flex flex-col">
        <span className="capitalize">  {label}:</span>
        <div>
          <input type="number" name="scala" className="w-10 h-4 text-[8px]" value={`${lienzo[`${label == "alto" ? "height" : "width"}`] / 100}`} onChange={(e) => { handleOnChange(e) }}
            onBlur={() => {
              centerView()
              resetTransform()
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