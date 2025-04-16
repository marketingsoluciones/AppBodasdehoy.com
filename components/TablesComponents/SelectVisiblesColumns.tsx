import { Table } from "@tanstack/react-table";
import { FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { PiGearFill } from "react-icons/pi";
import { InitialColumn } from "./TableBudgetV8";

interface props {
  columns: InitialColumn[]
  table: Table<any>
}

export const SelectVisiblesColumns: FC<props> = ({ columns, table }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);
  const tableAllColumns = table.getAllLeafColumns()

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setDropdownOpen(!dropdownOpen);
        }}
        className="bg-primary w-8 h-8 rounded-full flex items-center justify-center"
      >

        <PiGearFill className="w-5 h-5 text-white hover:scale-110" />
      </button>
      {dropdownOpen && <div className="absolute w-48 bg-white border border-gray-300 rounded shadow-lg overflow-y-auto z-10 -translate-x-full* right-10 top-0">
        <div
          className="flex hover:bg-basePage items-center px-4 py-1 text-gray-700 border-b-[1px] border-primary"
        >
          <input
            id={`checkbox-U`}
            type="checkbox"
            checked={table.getIsAllColumnsVisible()}
            onChange={!table.getIsAllColumnsVisible() ? table.getToggleAllColumnsVisibilityHandler() : () => { }}
            className="rounded-full text-primary focus:ring-0 border-gray-400 cursor-pointer"
          />
          <label htmlFor={`checkbox-U`} className="cursor-pointer px-2 w-full capitalize">
            {"Ver todas"}
          </label>
        </div>
        {columns.map((elem, idx) => {
          console.log(100041, elem)
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