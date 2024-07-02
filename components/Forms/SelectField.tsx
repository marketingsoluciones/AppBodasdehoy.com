import { useField } from "formik"
import { FC, HtmlHTMLAttributes, useEffect } from "react"
import { WarningIcon } from "../icons"
import { EventContextProvider } from "../../context"
import { number } from "yup"

interface propsSelectField extends HtmlHTMLAttributes<HTMLSelectElement> {
    label?: string
    name?: string
    options?: string[]
    colSpan?: number
    labelClass?: boolean

}
const SelectField: FC<propsSelectField> = ({ label, children, options, colSpan, labelClass = true, ...props }) => {
    const { invitadoCero, event } = EventContextProvider();
    const [field, meta] = useField({ name: props.name })
    if (field.value == null) field.value = "sin menú"
    useEffect(()=>{
        if(props.name==="edad"){
          console.log("selectField",props.name)
          console.log("selectField",field)
        }
      },[field.value])
    return (
        <>
            <div className={`relative* w-full h-full col-span${colSpan && `-${colSpan}`} content-between`}>
                <label className={`font-display text-sm ${labelClass ? "text-primary" : "text-textGrisClaro"} w-full`}>{label}</label>
                <div>
                    <select className="font-display capitalize cursor-pointer text-sm text-gray-500 border border-gray-200 focus:border-gray-400 focus:ring-0 transition w-full py-2 pr-7 rounded-xl focus:outline-none  " {...field} {...props} >
                        <option disabled value="" >
                            Seleccionar
                        </option>
                        {options?.map((option: string, idx: number) => (
                            <option key={idx} value={option}>{option && `${!option.match("(nombre)") ? option : option.replace("(nombre)", (invitadoCero ? invitadoCero : event?.grupos_array[0]))}`}</option>
                        ))}
                    </select>
                </div>
                {meta.touched && meta.error && <p className=" font-display absolute* rounded-xl text-xs *left-0 *bottom-0 transform *translate-y-full text-red flex gap-1">{meta.error}</p>}
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
