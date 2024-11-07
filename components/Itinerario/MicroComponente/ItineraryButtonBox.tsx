import { FC } from "react"
import { Itinerary, OptionsSelect, Task } from "../../../utils/Interfaces"
import { useAllowed } from "../../../hooks/useAllowed"



interface props {
  optionsItineraryButtonBox: OptionsSelect[]
  values: Task
  itinerario: Itinerary
}

export const ItineraryButtonBox: FC<props> = ({ optionsItineraryButtonBox, values, itinerario }) => {
  const [isAllowed, ht] = useAllowed()

  return (
    <div className="*bg-emerald-500 flex justify-end flex-1">
      <div className="*bg-blue-300 inline-flex gap-1 items-end text-gray-500">
        {optionsItineraryButtonBox.map((elem, idx) =>
          <div key={idx} onClick={() => {
            elem.onClick(values, itinerario)
          }} className={`bg-gray-200 w-10 h-10 rounded-full flex justify-center items-center cursor-pointer ${!isAllowed() ? "text-gray-400 hidden" : "hover:bg-gray-300 text-gray-600 hover:text-gray-700"} `}>
            {elem.getIcon ? elem.getIcon(!values.spectatorView) : elem.icon}
          </div>
        )}
      </div>
    </div>
  )
}