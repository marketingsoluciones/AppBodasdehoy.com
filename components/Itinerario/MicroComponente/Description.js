import { useField } from "formik";
import { useEffect, useRef, useState } from "react";

export const Description = ({ ...props }) => {
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
        <div className='flex items-center w-full'>
            {/* <Box gap={"0.3rem"} alignItems={"center"} className='w-full'>
                <Textarea
                    resize={"none"}
                    rows={rows}
                    ref={refInput}
                    className="overflow-y-scroll"
                    onChange={(e) => { handleChange(e) }}
                    fontSize={{ md: "sm", lg: "md" }}
                    value={field.value}
                    placeholder={"Título de actividad"}
                    //                    variant={"filled"}
                    _focus={""}
                    bg={"none"}
                    {...props}
                />
            </Box> */}
        </div>
    )
}