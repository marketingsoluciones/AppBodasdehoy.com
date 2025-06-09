import { FC, useEffect, useState } from "react"
import { FloatMenu } from "../../utils/Interfaces"
import ClickAwayListener from "react-click-away-listener"



interface props {
  showOptionsMenu: { state: boolean, values?: FloatMenu, isLoading?: boolean, select?: string }
  setShowOptionsMenu: any
}

export const FloatOptionsMenu: FC<props> = ({ showOptionsMenu, setShowOptionsMenu }) => {
  let { info, aling, justify, options, position } = showOptionsMenu.values

  return (
    <ClickAwayListener onClickAway={() => { setShowOptionsMenu({ state: false }) }}>
      <div className="select-none">
        <div
          style={position ? { left: position.x, top: position.y } : {}}
          className={`bg-gray-50 absolute z-30 rounded-lg border-[1px] border-gray-200 position shadow-md overflow-hidden 
            ${!position
              ? `${justify === "end" ? "translate-x-8" : "-translate-x-[calc(100%)]. "} ${aling === "botton" ? "-translate-y-[calc(100%+4px)]" : "translate-y-5"}`
              : `${justify === "end" ? "-translate-x-full" : "translate-x-6"} ${aling === "botton" ? "-translate-y-1/2" : "translate-y-1/2"}`} `}
        >
          {options.filter((elem) => {
            if (elem?.object) {
              return elem.object.includes(info?.row?.original?.object);
            }
            return elem?.object === info?.row?.original?.object
          }).map((elem, idx) =>
            <div key={idx} onClick={() => {
              if (!!elem?.onClick) {
                elem?.onClick(info)
                setShowOptionsMenu({ ...showOptionsMenu, isLoading: true, select: elem?.title })
              }
            }} className={`flex ${!!elem?.onClick ? "cursor-pointer" : ""} py-1 pl-1 pr-3 space-x-2 items-center ${!!elem?.onClick && "hover:bg-gray-200"} ${showOptionsMenu?.select === elem?.title ? "bg-gray-200" : ""}`}>
              <div className="w-6 h-6 flex items-center justify-center"> {elem?.icon}</div>
              <span className="text-nowrap">{elem?.title}</span>
            </div>
          )}
        </div>
        <style jsx>
          {`
          .position {
            right: 100px;
          }

          @media only screen and (min-width: 1536px) {
            .position {
              right: 220px;
            }
          }
          @media only screen and (min-width: 1280px) {
            .position {
              right: 60px;
            }
          }
        `}
        </style>

      </div>
    </ClickAwayListener>
  )
}