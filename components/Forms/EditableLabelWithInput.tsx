import { FC, KeyboardEvent, useEffect, useState } from "react";
import ClickAwayListener from "react-click-away-listener";
import { InputUpdateInBlur } from "./inputs/InputUpdateInBlur";
import { useAllowed } from "../../hooks/useAllowed";
import { FaPencilAlt } from "react-icons/fa";
import { useTranslation } from "react-i18next";

interface props {
  accessor: string
  value: string | number
  type: "int" | "float" | "string"
  handleOnBlur: any
  isLabelDisabled?: boolean
  textAlign?: "left" | "center" | "right" | "start" | "end"
}

export const EditableLabelWithInput: FC<props> = ({ value, type, handleOnBlur, accessor, isLabelDisabled, textAlign }) => {
  const [edit, setEdit] = useState(false)
  const [newValue, setNewValue] = useState<string | number>(value)
  const [hovered, setHovered] = useState(false)
  const [isAllowed, ht] = useAllowed()
  const { t } = useTranslation();
  let timeoutId = null

  const keyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    let tecla = e.key.toLowerCase();

    if (tecla === "escape") {
      setEdit(false)
      setNewValue(value)
    }
    if (tecla === "+") {
      e.preventDefault()
    }
    if (tecla === "-") {
      e.preventDefault()
    }
    if (tecla == "enter") {
      (["int", "float"].includes(type) && typeof newValue === "string" ? newValue !== "" ? parseFloat(newValue) : 0 : newValue) !== value && handleOnBlur({ value: ["int", "float"].includes(type) && typeof newValue === "string" ? newValue !== "" ? type === "float" ? parseFloat(newValue) : parseInt(newValue) : 0 : newValue, accessor })
      setNewValue(value)
      setEdit(false);
    }
  };

  return (
    <>
      {edit ?
        <ClickAwayListener onClickAway={() => setEdit(false)}>
          <input

            type={["int", "float"].includes(type) ? "number" : "text"}
            min={0}
            max={1000}
            onBlur={() => {
              (["int", "float"].includes(type) && typeof newValue === "string" ? newValue !== "" ? parseFloat(newValue) : 0 : newValue) !== value && handleOnBlur({ value: ["int", "float"].includes(type) && typeof newValue === "string" ? newValue !== "" ? type === "float" ? parseFloat(newValue) : parseInt(newValue) : 0 : newValue, accessor })
              setNewValue(value)
              setHovered(false)
            }}
            onChange={(e) => {
              setNewValue(e.target.value.replace(/^0+$/, "0").replace(/^0+(?=\d)/, ""))
            }}
            onKeyDown={(e) => keyDown(e)}
            value={`${newValue}`.replace(/\+/g, "").replace(/\-/g, "")}
            autoFocus
            className={`outline-none ring-0 border-none focus:outline-none focus:ring-0 focus:border-none w-full text-xs ${["start", "left"].includes(textAlign) ? "text-left" : ["center"].includes(textAlign) ? "text-center" : ["right", "end"].includes(textAlign) ? "text-right" : ``}`}
          />

        </ClickAwayListener>
        : <p
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
          className="font-display font-semibold text-xs text-gray-500 flex items-center justify-center gap-1 cursor-pointer relative"
        >
          {["int", "float"].includes(type) && typeof newValue === "string" ? newValue !== "" ? type === "float" ? parseFloat(newValue) : parseInt(newValue) : 0 : newValue}
          {!isLabelDisabled && <span className="text-xs font-light">{t(accessor)}</span>}
          {hovered && <div className="absolute right-0 w-6 h-full flex translate-x-full justify-end">
            <FaPencilAlt className="text-gray-400 hover:scale-105" />
          </div>
          }
        </p >}
      <style jsx>
        {
          `input {
                        padding: 0;
                        background: #d1dae3; # transparent;
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