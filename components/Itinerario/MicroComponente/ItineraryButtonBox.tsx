import { FC } from "react"
import { OptionsSelect, Task } from "../../../utils/Interfaces"



interface props {
  optionsItineraryButtonBox: OptionsSelect[]
  values: Task
}

export const ItineraryButtonBox: FC<props> = ({ optionsItineraryButtonBox, values }) => {

  return (
    <div className="*bg-emerald-500 flex justify-end flex-1">
      <div className="*bg-blue-300 inline-flex gap-1 items-end text-gray-500">
        {optionsItineraryButtonBox.map((elem, idx) =>
          <div key={idx} onClick={() => {
            console.log(100038, values)
            elem.onClick(values)
          }} className="bg-gray-200 w-10 h-10 rounded-full flex justify-center items-center hover:bg-gray-300 text-gray-500 hover:text-gray-700 cursor-pointer">
            {elem.icon}
          </div>
        )}
      </div>
    </div>
  )
}