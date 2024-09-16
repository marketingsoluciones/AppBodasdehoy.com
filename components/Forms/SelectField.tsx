import { useField } from "formik"
import { ChangeEvent, FC, HtmlHTMLAttributes, useEffect } from "react"
import { EventContextProvider } from "../../context"
import { useTranslation } from 'react-i18next';

interface propsSelectField extends HtmlHTMLAttributes<HTMLSelectElement> {
    label?: string
    name?: string
    options?: string[] | { _id: string, title: string }[]
    colSpan?: number
    labelClass?: boolean
    nullable?: boolean

}
const SelectField: FC<propsSelectField> = ({ label, children, options, colSpan, labelClass = true, nullable, ...props }) => {
    const { t } = useTranslation();
    const { invitadoCero, event } = EventContextProvider();
    const [field, meta, { setValue }] = useField({ name: props.name })

    if (props.name === "nombre_menu") {
        if (field.value === null) {
            field.value = "sin menú"
        }
    }

    if (typeof options[0] != "string") {
        field.onChange = (e: ChangeEvent<HTMLSelectElement>) => {
            setValue((options as Array<{ _id: string, title: string }>).find(elem => elem['_id'] === e.target.value))
        }
    }

    return (
        <>
            <div className={`relative* w-full h-full col-span${colSpan && `-${colSpan}`} content-between`}>
                <label className={`font-display text-sm ${labelClass ? "text-primary" : "text-textGrisClaro"} w-full`}>{label}</label>
                <div className="relative">
                    <select className="font-display capitalize cursor-pointer text-sm text-gray-500 border border-gray-300 focus:border-gray-400 focus:ring-0 transition w-full py-2 pr-7 rounded-xl focus:outline-none" value={typeof options[0] === "string" ? field?.value : field?.value?._id} name={field?.name} onChange={field?.onChange} >
                        {nullable &&
                            <option >
                                {t("select")}
                            </option>}
                        {options?.map((option: string | { _id: string, title: string }, idx: number) => {
                            const label = typeof option === "string" ? option : option?.title
                            const value = typeof option === "string" ? option : option?._id
                            return (
                                <option key={idx} label={label} value={value?.toLowerCase()} >{value && `${!value?.match("(nombre)") ? value : value?.replace("(nombre)", (invitadoCero ? invitadoCero : event?.grupos_array[0]))}`}</option>
                            )
                        })}
                    </select>
                </div>
                {(meta.touched || meta.error) && <p className="font-display absolute rounded-xl text-xs text-red flex gap-1">{meta.error}</p>}
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
