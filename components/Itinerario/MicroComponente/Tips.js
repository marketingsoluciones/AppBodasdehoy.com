import { useEffect, useRef, useState } from "react";
import { useField } from "formik";
import { InputFieldGlobal } from "../../Forms/InputFieldGlobal";
/* import { Box, Textarea } from "@chakra-ui/react"; */

export const Tips = ({ ...props }) => {

    const refInput = useRef(null)
    const [field, meta, helpers] = useField({ name: props.name });
    const [rows, setRows] = useState(1)

    const handleChange = (e) => {
        e.preventDefault()
        e.target.rows = 1
        const rowT = refInput?.current ? (refInput?.current.scrollHeight / 16) - 1 : 1
        if (rowT < 5) {
            e.target.rows = rowT
        }
        else {
            e.target.rows = 4
        }
        helpers.setValue(e.target.value)
    }
    useEffect(() => {
        const rowT = refInput?.current ? (refInput?.current.scrollHeight / 16) - 1 : 1
        if (rowT < 5) {
            setRows(rowT)
        }
        else {
            setRows(4)
        }
    }, [refInput])
    return (
        <div className='w-full md:my-2 lg:my-0'>
             <InputFieldGlobal
                onChange={(e) => { handleChange(e) }}
                name={props.name}
                className="rounded-xl w-full border-gray-400 md:text-sm lg:text-md outline-none focus:outline-none md:ml-2"
                placeholder="Tips para esta actividad"
                value={field.value}
                {...field} 
                {...props}
            />
        </div>
    )
}