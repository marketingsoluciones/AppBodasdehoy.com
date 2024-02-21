import { useField } from "formik"
import React, { FC, InputHTMLAttributes, useEffect, useState } from "react"
import { WarningIcon } from '../icons'
// import { PhoneInput, usePhoneInput } from 'react-international-phone';
// import 'react-international-phone/style.css';
import { AuthContextProvider } from "../../context";
import { useAllowed } from "../../hooks/useAllowed";

interface propsInputField extends InputHTMLAttributes<HTMLInputElement> {
  label: string
}

const InputField: FC<Partial<propsInputField>> = ({ label, className, ...props }) => {
  const { geoInfo } = AuthContextProvider()
  const [field, meta, helpers] = useField({ name: props.name })
  const [isAllowed, ht] = useAllowed()

  // useEffect(() => {
  //   if (props?.type == "tel") {
  //     (document.getElementsByClassName("react-international-phone-input")[0] as HTMLElement)
  //       ?.focus()
  //     const input = document.getElementsByClassName("react-international-phone-input")[0]
  //     input?.setAttribute("class", `ml-2 font-display text-sm text-gray-500 border border-gray-100 focus:border-primary w-full py-2 px-4 rounded-xl focus:outline-none transition ${className}`)
  //     // const select = document.getElementsByClassName("react-international-phone-country-selector-button")[0]
  //     // select.setAttribute("class", `ml-2 font-display text-sm text-gray-500 border border-gray-100 focus:border-primary w-full py-2 px-4 rounded-xl focus:outline-none transition ${className}`)
  //   }
  // }, [])

  return (
    <div className="w-full h-max relative">
      <label className="font-display text-primary text-sm w-full">{label}</label>
      <div className="w-full">
        {props?.type !== "tel"
          ? <input disabled={!isAllowed()} className={`font-display text-sm text-gray-500 border-[1px] border-gray-200 focus:border-gray-400 w-full py-2 px-4 rounded-xl focus:ring-0 focus:outline-none transition ${className}`} {...field} {...props}></input>
          : <div onBlur={() => helpers.setTouched(true)} >
            {/* <PhoneInput
              defaultCountry={geoInfo?.ipcountry.toLowerCase()}
              value={field?.value}
              onChange={(value) => { helpers.setValue(value) }}
            /> */}
          </div>
        }
      </div>
      {meta.touched && meta.error && <p className="font-display absolute rounded-xl text-xs left-0 bottom-0 transform translate-y-full text-red flex gap-1">{meta.error}</p>}
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
