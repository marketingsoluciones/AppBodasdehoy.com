import { FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { PiGearFill } from "react-icons/pi";

interface props {
  columns: any
}

export const SelectVisiblesColumns: FC<props> = ({ columns }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);


  return (
    <div className="right-0 top-0">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setDropdownOpen(!dropdownOpen);
        }}
        className="w-6 h-6 hover:scale-110 rounded-full flex items-center justify-center"
      >

        <PiGearFill className="w-5 h-5 text-white" />
      </button>
      {dropdownOpen && ( // Dropdown solo para el último header
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto z-10">
          algo
          {columns.map((elem, idx) => {
            console.log(10041, elem)
            return (
              <div
                key={idx}
                className="flex hover:bg-basePage items-center px-4 py-2 text-gray-700"
              >
                <input
                  type="checkbox"
                  // checked={visibleColumns.includes(column.id)}
                  // onChange={() => handleColumnToggle(column.id)}
                  className="mr-2"
                />
                {elem?.header}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}