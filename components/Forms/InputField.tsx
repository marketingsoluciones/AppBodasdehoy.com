import { useField } from "formik"
import React, { ChangeEvent, FC, InputHTMLAttributes, useEffect, useState } from "react"
import { useAllowed } from "../../hooks/useAllowed";
import { flags } from "../../utils/flags.js"
import { AuthContextProvider } from "../../context";
import { IoIosArrowDown } from "react-icons/io";
import ClickAwayListener from "react-click-away-listener"
import { useTranslation } from 'react-i18next';
import { MdClose } from "react-icons/md";


interface propsInputField extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  className?: string
  disabled?: boolean
  labelClass?: boolean
  deleted?: boolean
  aceptEmogis?: boolean
}

interface Flag {
  pre: string
  name: string
  cod: number
}

const InputField: FC<Partial<propsInputField>> = ({ label, className, disabled = false, labelClass = true, deleted = false, aceptEmogis, ...props }) => {
  const { t } = useTranslation();
  const { geoInfo } = AuthContextProvider()
  const [field, meta, helpers] = useField({ name: props.name })
  const [isAllowed, ht] = useAllowed()
  const [showFlags, setShowFlags] = useState(false)
  const [options, setOptions] = useState<Flag[]>(flags)
  const [optionSelect, setOptionSelect] = useState<Flag>(flags.find(elem => elem.pre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === geoInfo?.ipcountry.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')))
  const [filterFlags, setFilterFlags] = useState<string>()
  const [number, setNumber] = useState<string>("")
  const [valir, setValir] = useState(0)

  if (props.name === "passesQuantity") {
    if (field["onBlur"]) {
      field.onBlur = (e: ChangeEvent<HTMLSelectElement>) => {
        if (!e.target.value) {
          helpers.setValue(0)
        }
      }
    }
  }

  useEffect(() => {
    if (filterFlags) {
      const options = flags.filter(elem => elem.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(filterFlags))
      setOptions(options)
    }
  }, [filterFlags])

  useEffect(() => {
    if (props?.type === "telefono" && optionSelect && valir) {
      helpers.setValue(`+${optionSelect?.cod}${number}`)
    }
    setValir(1)
  }, [optionSelect])

  useEffect(() => {
    if (!aceptEmogis) {
      if (typeof field?.value === "string") {
        helpers.setValue(field?.value?.replace(emojiRegex, ''))
      }
    }
    if (props?.type === "telefono") {
      let result: Flag | null = null
      let number = field.value ?? ""
      if (field?.value?.slice(0, 1) !== "+") {
        helpers.setValue(`+${field.value}`)
      }
      result = flags?.find(elem => elem.cod === parseInt(field?.value?.slice(1, 2)))
      if (result) {
        number = field?.value?.slice(2)
      } else {
        result = flags?.find(elem => elem.cod === parseInt(field?.value?.slice(1, 3)))
        if (result) {
          number = field?.value?.slice(3)
        } else {
          result = flags?.find(elem => elem.cod === parseInt(field?.value?.slice(1, 4)))
          if (result) {
            number = field?.value?.slice(4)
          }
        }
      }
      setNumber(number)
      setOptionSelect(result)
    }
  }, [field.value])

  const maxLengthClass = className?.includes("text-xs")
    ? "text-xs -top-0.5"
    : className?.includes("text-sm")
      ? "text-sm top-0"
      : className?.includes("text-base")
        ? "text-base top-0.5"
        : className?.includes("text-lg")
          ? "text-lg top-1"
          : "text-xl top-2"

  const emojiRegex = !aceptEmogis
    ? /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udf00-\udfff]|\ud83d[\udc00-\ude4f]|\ud83e[\udd10-\uddff])/g
    : "";


  return (
    <div className="w-full h-max relative">
      <label className={`font-display ${labelClass ? "text-primary" : "text-gray-500"} text-sm w-full`}>{label}</label>
      <div className="w-full relative flex items-center">
        {props?.maxLength && <div className={`h-10 absolute -top-0.5 right-2 flex items-center justify-center ${maxLengthClass}`} >
          <span id='masStr' className={`text-gray-500`}>
            {field.value?.length}/{props?.maxLength}
          </span>
        </div>}
        {deleted && <div className="absolute right-0">
          <MdClose onClick={() => { helpers.setValue("") }} className="hover:text-gray-700 cursor-pointer mr-0.5" />
        </div>}
        {props?.type === "telefono" &&
          <>
            {showFlags && <ClickAwayListener onClickAway={() => { setShowFlags(false) }}>
              <div className={`bg-white w-full h-44 absolute translate-y-10 z-10 border-[1px] rounded-b-xl flex flex-col ${meta.error ? "border-rose-300" : "border-gray-200"}`}>
                <input type="text" autoFocus autoComplete="nope" onChange={(e) => setFilterFlags(e.target.value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''))} className="bg-gray-100 h-6 border-0 focus:border-0 w-full py-2 px-4 focus:ring-0 focus:outline-none transition text-xs text-gray-600" />
                <ul className="w-full flex-1 cursor-pointer text-gray-900 text-xs *space-y-2 *px-2 py-1 overflow-y-scroll">
                  {options.map((elem, idx) =>
                    <li key={idx} onClick={() => {
                      setNumber("")
                      setOptionSelect(elem)
                      setShowFlags(false)
                      const elemInput = document.getElementById("telefono")
                      elemInput.focus();
                    }} className="flex space-x-1 items-center justify-center hover:bg-gray-200 px-2 py-1">
                      <div className="border-[1px] border-gray-800">
                        <img src={`/flags-svg/${elem.pre}.svg`.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')} className="object-cover w-6 h-4" />
                      </div>
                      <div className="flex flex-1 truncate">
                        <span className="flex-1 text-gray-700">{elem.name}</span>
                      </div>
                    </li>
                  )}
                </ul>
              </div>
            </ClickAwayListener>}
            <div onClick={() => {
              setShowFlags(!showFlags)
              setOptions(flags)
            }} className="absolute w-12 h-9 flex justify-start items-center cursor-pointer ml-[1.5px] pl-2 bg-slate-100 rounded-l-xl mt-[1px]">
              {optionSelect?.pre && <img src={`/flags-svg/${optionSelect?.pre}.svg`.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')} width={22} className="border-[1px] border-gray-500" />}
              <IoIosArrowDown className="text-gray-500" />
            </div>
          </>
        }
        {props?.type != "tel"
          ? <input id={props?.type} /* autoFocus={props?.type === "telefono"} */ disabled={!isAllowed() || disabled} className={`${props?.type === "telefono" && "pl-14"} font-display text-sm text-gray-500 border-[1px] ${(props?.type !== "tel" ? true : meta.touched) && meta.error ? "border-rose-300" : "border-gray-200"} focus:border-gray-400 w-full py-2 px-4 rounded-xl focus:ring-0 focus:outline-none transition ${className}`} {...field} {...props} type={props?.type === "telefono" ? "tel" : props?.type} maxLength={props?.maxLength} />
          : <div onBlur={() => helpers.setTouched(true)} >
          </div>
        }
      </div>
      {(props?.type != "tel" ? true : meta.touched) && meta.error && <p className="font-display absolute rounded-xl text-xs text-red flex gap-1 ">{meta.error}</p>}
      <style jsx>
        {`
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button { 
          -webkit-appearance: none; 
          margin: 0; 
        }
        `}
      </style>
    </div>
  )
}

export default React.memo(InputField)

