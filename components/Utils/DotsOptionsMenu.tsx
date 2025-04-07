import { FC } from "react"
import { DotsMenu } from "../../utils/Interfaces"

interface props {
  showDotsOptionsMenu: { state: boolean, values: DotsMenu }
  setShowDotsOptionsMenu: any
}

export const DotsOptionsMenu: FC<props> = ({ showDotsOptionsMenu, setShowDotsOptionsMenu }) => {
  let { info, aling, justify, options } = showDotsOptionsMenu.values

  return (
    <div className="select-none">
      <div className={`bg-gray-50 rounded-lg border-[1px] border-gray-200 shadow-md overflow-hidden absolute z-10 ${justify === "start" ? "translate-x-8" : "-translate-x-[calc(100%)]"} ${aling === "botton" ? "-translate-y-[calc(100%+4px)]" : "translate-y-5"}`}>
        {options.map((elem, idx) =>
          <div key={idx} onClick={elem.onClick} className={`flex cursor-pointer py-1 pl-1 pr-3 space-x-2 items-center ${!!elem?.onClick && "hover:bg-gray-200"}`}>
            <div className="w-6 h-6 flex items-center justify-center"> {elem.icon}</div>
            <span className="text-nowrap">{elem.title}</span>
          </div>
        )}
      </div>
    </div>
  )
}