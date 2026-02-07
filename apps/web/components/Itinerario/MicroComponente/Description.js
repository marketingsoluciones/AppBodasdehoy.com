import { useField } from "formik";
import { useEffect, useRef, useState } from "react";
import { InputFieldGlobal } from "../../Forms/InputFieldGlobal"

export const Description = ({ disable, ...props }) => {
    const refInput = useRef(null)
    const [field, meta, helpers] = useField({ name: props.name });
    const [rows, setRows] = useState(1)

    const handleChange = (e) => {
        e.preventDefault()
        helpers.setValue(e.target.value)
    }

    return (
        <div className='flex items-center w-full'>
            <input
                disabled={disable}
                onChange={(e) => { handleChange(e) }}
                name={props.name}
                className="focus:ring-0 focus:border-gray-600 rounded-xl w-full border-gray-400 md:text-sm lg:text-md "
                placeholder="Título de actividad "
                value={field.value}
                {...field}
                {...props}

            />

        </div>
    )
}