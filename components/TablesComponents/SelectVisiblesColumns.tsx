import { Table } from "@tanstack/react-table";
import { Dispatch, FC, SetStateAction, useState } from "react";
import { PiGearFill } from "react-icons/pi";
import { InitialColumn } from "./TableBudgetV8";
import { useAllowed } from "../../hooks/useAllowed";
import { VisibleColumn } from "../../utils/Interfaces";

interface props {
  columns: InitialColumn[]
  table: Table<any>
  handleChangeColumnVisible: ({ accessor, show }?: VisibleColumn) => void
  showDataState: boolean
  setShowDataState: Dispatch<SetStateAction<boolean>>
}

export const SelectVisiblesColumns: FC<props> = ({ columns, table, handleChangeColumnVisible, showDataState, setShowDataState }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const tableAllColumns = table.getAllLeafColumns()
  const [isAllowed, ht] = useAllowed()

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          if (isAllowed()) {
            e.stopPropagation();
            setDropdownOpen(!dropdownOpen);
          } else {
            e.stopPropagation();
            ht()
          }
        }}
        className="bg-primary w-8 h-8 rounded-full flex items-center justify-center"
      >

        <PiGearFill className="w-5 h-5 text-white hover:scale-110" />
      </button>
      {dropdownOpen && <div className="absolute w-52 bg-white border border-gray-300 rounded shadow-lg overflow-y-auto z-10  right-10 top-0 text-xs py-2">
        <div
          className="flex hover:bg-basePage items-center px-4 py-1 text-gray-700"
        >
          <input
            id={`checkbox-U`}
            type="checkbox"
            checked={showDataState}
            onChange={() => setShowDataState(!showDataState)}
            className="rounded-full text-primary focus:ring-0 border-gray-400 cursor-pointer"
          />
          <label htmlFor={`checkbox-U`} className="cursor-pointer px-2 w-full capitalize">
            {!showDataState ? 'Mostrar items no visibles' : 'Ocultar items no visibles'}
          </label>
        </div>
        <div
          className="flex hover:bg-basePage items-center px-4 py-1 text-gray-700 border-b-[1px] border-primary pb-2"
        >
          <input
            id={`checkbox-U`}
            type="checkbox"
            checked={table.getIsAllColumnsVisible()}
            onChangeCapture={!table.getIsAllColumnsVisible() ? () => handleChangeColumnVisible() : () => { }}
            onChange={!table.getIsAllColumnsVisible() ? table.getToggleAllColumnsVisibilityHandler() : () => { }}
            className="rounded-full text-primary focus:ring-0 border-gray-400 cursor-pointer"
          />
          <label htmlFor={`checkbox-U`} className="cursor-pointer px-2 w-full capitalize">
            {"Ver todas"}
          </label>
        </div>
        {columns.map((elem, idx) => {
          if (!elem?.isHidden) {
            return (
              <div
                key={idx}
                className="flex hover:bg-basePage items-center px-4 py-1 text-gray-700"
              >
                <input
                  id={`checkbox-${idx}`}
                  type="checkbox"
                  checked={tableAllColumns.find(el => el.id === elem.accessor)?.getIsVisible()}
                  onChangeCapture={(e) => handleChangeColumnVisible({ accessor: elem.accessor, show: e.currentTarget.checked })}
                  onChange={tableAllColumns.find(el => el.id === elem.accessor)?.getToggleVisibilityHandler()}
                  className="rounded-full text-primary focus:ring-0 border-gray-400 cursor-pointer"
                />
                <label htmlFor={`checkbox-${idx}`} className="cursor-pointer px-2 w-full capitalize">
                  {elem?.header}
                </label>
              </div>
            )
          }
        })}
      </div>
      }
    </div>
  )
}