import { FC, KeyboardEvent, useEffect, useState } from "react";
import ClickAwayListener from "react-click-away-listener";
import { InputUpdateInBlur } from "./inputs/InputUpdateInBlur";
import { useAllowed } from "../../hooks/useAllowed";
import { FaPencilAlt } from "react-icons/fa";
import { useTranslation } from "react-i18next";

interface props {
  accessor: string
  value: string | number
  type: "number" | "text"
  handleOnBlur: any
}

export const EditableLabelWithInput: FC<props> = ({ value, type, handleOnBlur, accessor }) => {
  const [edit, setEdit] = useState(false)
  const [newValue, setNewValue] = useState<string | number>(value)
  const [hovered, setHovered] = useState(false)
  const [isAllowed, ht] = useAllowed()
  const { t } = useTranslation();

  const keyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    let tecla = e.key.toLowerCase();
    if (tecla === "+") {
      e.preventDefault()
    }
    if (tecla === "-") {
      e.preventDefault()
    }
    if (tecla == "enter") {
      newValue !== value && handleOnBlur({ value: type === "number" && typeof newValue === "string" ? newValue !== "" ? parseFloat(newValue) : 0 : newValue, accessor })
      setEdit(false);
    }
  };

  return (
    <>
      {edit ?
        <ClickAwayListener onClickAway={() => setEdit(false)}>
          <input
            type={type}
            min={0}
            max={1000}
            onBlur={() => { (type === "number" && typeof newValue === "string" ? newValue !== "" ? parseFloat(newValue) : 0 : newValue) !== value && handleOnBlur({ value: type === "number" && typeof newValue === "string" ? newValue !== "" ? parseFloat(newValue) : 0 : newValue, accessor }) }}
            onChange={(e) => {
              setNewValue(e.target.value.replace(/^0+$/, "0").replace(/^0+(?=\d)/, ""))
            }}
            onKeyDown={(e) => keyDown(e)}
            value={`${newValue}`.replace(/\+/g, "").replace(/\-/g, "")}
            autoFocus
            className="outline-none ring-0 border-none focus:outline-none focus:ring-0 focus:border-none text-center w-full px-2 h-6 text-xs"
          />

        </ClickAwayListener>
        : <p
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onClick={() => isAllowed() ? setEdit(true) : ht()}
          className="font-display font-semibold text-xs text-gray-500 flex items-center justify-center gap-1 cursor-pointer capitalize relative py-[4px]"
        >
          {type === "number" && typeof newValue === "string" ? newValue !== "" ? parseFloat(newValue) : 0 : newValue}
          <span className="text-xs font-light">{t(accessor)}</span>
          {hovered && <FaPencilAlt className="text-gray-400 absolute right-0" />}
        </p>}
      <style jsx>
        {
          `input {
                        background: #eaeeee; # transparent;
                        input[type="number"]::-webkit-inner-spin-button,
                        input[type="number"]::-webkit-outer-spin-button {
                            -webkit-appearance: none;
                            margin: 0;
                            }
                    }`
        }
      </style>
    </>
  )
}