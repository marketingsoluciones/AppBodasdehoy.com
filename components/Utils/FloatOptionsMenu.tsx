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
          className={`bg-white absolute z-50 rounded-lg border border-gray-200 shadow-lg overflow-hidden min-w-[180px]
            ${!position
              ? `${justify === "end" ? "translate-x-8" : "-translate-x-[calc(100%)]"} ${aling === "botton" ? "-translate-y-[calc(100%+4px)]" : "translate-y-5"}`
              : `${justify === "end" ? "-translate-x-full" : "translate-x-6"} ${aling === "botton" ? "-translate-y-1/2" : "translate-y-1/2"}`}`}
        >
          {/* Header del menú */}
          <div className="px-3 py-2 border-b border-gray-100 bg-gray-50">
            <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Opciones</span>
          </div>

          {/* Opciones del menú */}
          <div className="py-1">
            {options.filter((elem) => {
              if (elem?.object) {
                return elem.object.includes(info?.row?.original?.object);
              }
              return elem?.object === info?.row?.original?.object
            }).map((elem, idx, filteredArray) => {
              // Verificar si este elemento es un separador (como "Agregar:")
              const isSeparator = !elem?.onClick && elem?.title && elem?.icon;
              
              return (
                <div key={idx}>
                  {/* Separador visual */}
                  {isSeparator && idx > 0 && (
                    <div className="border-t border-gray-100 my-1"></div>
                  )}
                  
                  <div 
                    onClick={() => {
                      if (!!elem?.onClick) {
                        elem?.onClick(info)
                        setShowOptionsMenu({ ...showOptionsMenu, state:false,  isLoading: true, select: elem?.title })
                      }
                    }} 
                    className={`flex items-center gap-3 px-3 py-2 text-xs transition-colors duration-150
                      ${!!elem?.onClick 
                        ? "cursor-pointer hover:bg-blue-50 hover:text-blue-700 text-gray-700" 
                        : "cursor-default text-gray-500 bg-gray-25"
                      }
                      ${showOptionsMenu?.select === elem?.title ? "bg-blue-100 text-blue-800" : ""}
                      ${isSeparator ? "bg-gray-25 font-medium" : ""}
                    `}
                  >
                    {/* Icono */}
                    <div className={`flex items-center justify-center flex-shrink-0 ${isSeparator ? "w-4 h-4" : "w-3 h-3"}`}>
                      {elem?.icon}
                    </div>
                    
                    {/* Texto */}
                    <span className={`text-nowrap ${isSeparator ? "font-medium text-gray-600" : ""}`}>
                      {elem?.title}
                    </span>
                    
                    {/* Indicador de carga */}
                    {showOptionsMenu?.isLoading && showOptionsMenu?.select === elem?.title && (
                      <div className="ml-auto">
                        <div className="animate-spin rounded-full h-3 w-3 border border-blue-300 border-t-blue-600"></div>
                      </div>
                    )}
                  </div>
                  
                  {/* Separador después de elementos especiales */}
                  {elem?.title === "Item" && idx < filteredArray.length - 1 && (
                    <div className="border-t border-gray-100 my-1"></div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </ClickAwayListener>
  )
}