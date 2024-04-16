import { useField } from "formik"
import React, { FC, InputHTMLAttributes } from "react"
import { useAllowed } from "../../hooks/useAllowed";

interface propsInputField extends InputHTMLAttributes<HTMLInputElement> {
  label: string
}

const InputField: FC<Partial<propsInputField>> = ({ label, className, disabled = false, ...props }) => {
  const [field, meta, helpers] = useField({ name: props.name })
  const [isAllowed, ht] = useAllowed()

  return (
    <div className="w-full h-max relative">
      <label className="font-display text-primary text-sm w-full">{label}</label>
      <div className="w-full">
        {props?.type !== "tel"
          ? <input disabled={!isAllowed() || disabled} className={`font-display text-sm text-gray-500 border-[1px] border-gray-200 focus:border-gray-400 w-full py-2 px-4 rounded-xl focus:ring-0 focus:outline-none transition ${className}`} {...field} {...props}></input>
          : <div onBlur={() => helpers.setTouched(true)} >
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
