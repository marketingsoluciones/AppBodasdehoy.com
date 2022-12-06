import { useField } from "formik"
import { FC, HtmlHTMLAttributes } from "react"
import { capitalize } from "../../utils/Capitalize"
import { WarningIcon } from "../icons"

interface propsSelectField extends HtmlHTMLAttributes<HTMLSelectElement> {
    label: string
    name: string
    options: string[]
}
const SelectField : FC <propsSelectField> = ({label, children, options, ...props}) => {
    const [field, meta] = useField({name: props.name})
    
    return (
        <>
        <div className="relative w-full h-full flex-col content-between	">
            <label className="font-display text-sm text-primary w-full">{label}</label>
            <div>
            <select className="font-display text-sm text-gray-500 border border-gray-100 focus:border-primary transition w-full py-2 pr-7 rounded-xl focus:outline-none transition cursor-pointer" {...field} {...props} >
                <option disabled value="" >
                    Seleccionar
                </option>
            {options?.map((option: string, idx: number) => (
                <option key={idx} value={option}>{option && capitalize(option)}</option>
            ))}
            </select>
            </div>
            {meta.touched && meta.error && <p className="font-display absolute rounded-xl text-white text-xs left-0 bottom-0 transform translate-y-full text-red flex gap-1"><WarningIcon className="w-4 h-4"/>{meta.error}</p>}
        </div>
        <style jsx>
            {`
            select {
                -webkit-appearance: none;
                -moz-appearance: none;
                text-indent: 1px;
                text-overflow: '';
            }
            `}
        </style>
        </>
        
    )
}

export default SelectField
