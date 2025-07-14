import { FC, useEffect, useState } from "react"
import ClickAwayListener from "react-click-away-listener"
import { FaPencilAlt } from "react-icons/fa"
import { useAllowed } from "../../hooks/useAllowed"

interface props {
  accessor: string
  value: string
  optionsSelect: {
    value: string,
    title: string
  }[]
  size: number
  handleChange: any
}

export const EditableSelect: FC<props> = ({ value, optionsSelect, size, handleChange, accessor }) => {
  const [edit, setEdit] = useState<boolean>()
  const [newValue, setNewValue] = useState<string>(value)
  const [hovered, setHovered] = useState(false)
  const [isAllowed, ht] = useAllowed()
  let timeoutId = null

  return (
    <div className={`relative w-full ${edit && "bg-[#d1dae3] select-none"}`}>
      <div></div>
      <span
        onMouseEnter={() => {
          clearTimeout(timeoutId)
          setHovered(true)
        }}
        onMouseLeave={() => {
          timeoutId = setTimeout(() => {
            setHovered(false)
          }, 100);
        }}
        onClick={() => isAllowed() ? setEdit(true) : ht()}
        className={` cursor-context-menu relative hover:cursor-pointer`}
      >
        {optionsSelect.find((elem) => elem.value === newValue)?.title}
        {(hovered && !edit) && isAllowed() && <div className="absolute top-0 right-0 w-4 h-full flex translate-x-full justify-end">
          <FaPencilAlt className="hover:scale-105" />
        </div>
        }
      </span >
      {edit && (
        <ClickAwayListener onClickAway={() => edit && setEdit(false)}>
          <ul
            style={{ width: size }}
            className={`bg-white z-10 shadow-md absolute top-5 overflow-hidden border-[1px] border-gray-400 select-none -translate-x-1 cursor-pointer w-full `}>
            {optionsSelect./*filter(elem => elem.value !== newValue).*/map((elem, idx) => (
              <li
                key={idx}
                onClick={() => {
                  if (elem.value !== value) {
                    handleChange({ value: elem.value, accessor })
                  }
                  setEdit(false)
                }}
                className={`hover:bg-base transition p-2 ${elem.value === newValue && "bg-gray-200"}`}
              >
                {elem.title}
              </li>
            ))}
          </ul>
        </ClickAwayListener>
      )}
    </div>
  )
}