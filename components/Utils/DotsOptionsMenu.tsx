import { FC, useEffect, useState } from "react"
import { DotsMenu } from "../../utils/Interfaces"
import ClickAwayListener from "react-click-away-listener"

interface props {
  showDotsOptionsMenu: { state: boolean, values?: DotsMenu, isLoading?: boolean, select?: string }
  setShowDotsOptionsMenu: any
}

export const DotsOptionsMenu: FC<props> = ({ showDotsOptionsMenu, setShowDotsOptionsMenu }) => {
  let { info, aling, justify, options } = showDotsOptionsMenu.values

  return (
    <ClickAwayListener onClickAway={() => setShowDotsOptionsMenu({ state: false })}>
      <div className="select-none">
        <div className={`bg-gray-50 rounded-lg border-[1px] border-gray-200 shadow-md overflow-hidden absolute z-10 ${justify === "start" ? "translate-x-8" : "-translate-x-[calc(100%)]"} ${aling === "botton" ? "-translate-y-[calc(100%+4px)]" : "translate-y-5"}`}>
          {options.map((elem, idx) =>
            <div key={idx} onClick={() => {
              if (!!elem?.onClick) {
                elem?.onClick(info)
                console.log(100050, elem?.title)
                setShowDotsOptionsMenu({ ...showDotsOptionsMenu, isLoading: true, select: elem?.title })
              }
            }} className={`flex ${!!elem?.onClick ? "cursor-pointer" : ""} py-1 pl-1 pr-3 space-x-2 items-center ${!!elem?.onClick && "hover:bg-gray-200"} ${showDotsOptionsMenu?.select === elem?.title ? "bg-gray-200" : ""}`}>
              <div className="w-6 h-6 flex items-center justify-center"> {elem?.icon}</div>
              <span className="text-nowrap">{elem?.title}</span>
            </div>
          )}
        </div>
      </div>
    </ClickAwayListener>
  )
}