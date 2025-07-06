import { FC, KeyboardEvent, useEffect, useState } from "react";
import ClickAwayListener from "react-click-away-listener";
import { useAllowed } from "../../hooks/useAllowed";
import { FaPencilAlt } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { getCurrency } from "../../utils/Funciones";

interface props {
  accessor: string
  value: string | number
  type: "int" | "float" | "string"
  handleChange: any
  isLabelDisabled?: boolean
  textAlign?: "left" | "center" | "right" | "start" | "end"
}

export const EditableLabelWithInput: FC<props> = ({ value, type, handleChange, accessor, isLabelDisabled, textAlign }) => {
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
      (["int", "float"].includes(type) && typeof newValue === "string" ? newValue !== "" ? parseFloat(newValue) : 0 : newValue) !== value && handleChange({ value: ["int", "float"].includes(type) && typeof newValue === "string" ? newValue !== "" ? type === "float" ? parseFloat(newValue) : parseInt(newValue) : 0 : newValue, accessor })
      setEdit(false);
    }
  };

  return (
    <>
      {edit ?
        <ClickAwayListener onClickAway={() => setEdit(false)}>
          <input
            id={"ElementEditable"}
            type={["int", "float"].includes(type) ? "number" : "text"}
            min={0}
            max={1000}
            onBlur={() => {
              (["int", "float"].includes(type) && typeof newValue === "string" ? newValue !== "" ? parseFloat(newValue) : 0 : newValue) !== value && handleChange({ value: ["int", "float"].includes(type) && typeof newValue === "string" ? newValue !== "" ? type === "float" ? parseFloat(newValue) : parseInt(newValue) : 0 : newValue, accessor })
              setHovered(false)
            }}
            onChange={(e) => {
              setNewValue(e.target.value.replace(/^0+$/, "0").replace(/^0+(?=\d)/, ""))
            }}
            onKeyDown={(e) => keyDown(e)}
            value={typeof newValue === "number" ? newValue.toFixed(2) : `${newValue}`.replace(/\+/g, "").replace(/\-/g, "")}
            autoFocus
            className={`text-sm outline-none ring-0 border-none focus:outline-none focus:ring-0 focus:border-none w-full ${["start", "left"].includes(textAlign) ? "text-left" : ["center"].includes(textAlign) ? "text-center" : ["right", "end"].includes(textAlign) ? "text-right" : ``}`}
          />

        </ClickAwayListener>
        : <span
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
          className="flex items-center justify-center gap-1 cursor-context-menu w-full"
        >
          <div className="relative w-full ">
            {["int", "float"].includes(type) && typeof newValue === "string"
              ? newValue !== ""
                ? type === "float"
                  ? getCurrency(parseFloat(newValue))
                  : new Intl.NumberFormat().format(parseInt(newValue))
                : 0
              : typeof newValue === "number"
                ? type === "float"
                  ? getCurrency(newValue)
                  : new Intl.NumberFormat().format(newValue)
                : newValue}
            {!isLabelDisabled && <span className="ml-1">{t(accessor)}</span>}
            {
              hovered && isAllowed() &&
              <div className="absolute right-0 w-6 h-full flex translate-x-[calc(100%+6px)] -translate-y-[calc(100%+4px)]">
                <FaPencilAlt className="hover:scale-105" />
              </div>
            }
          </div>
        </span >}
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