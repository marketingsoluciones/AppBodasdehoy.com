import { useEffect, useRef, useState } from "react";
import { useField } from "formik";
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
        <div className='w-full md:mx-12 lg:mx-4 my-2 lg:my-0'>
            {/* <Box gap={"0.3rem"} alignItems={"center"}>
                <Textarea
                    resize={"none"}
                    rows={rows}
                    ref={refInput}
                    className=" overflow-y-scroll"
                    onChange={(e) => { handleChange(e) }}
                    fontSize={{ md: "sm", lg: "md" }}
                    value={field.value}
                    placeholder={"Tips para esta actividad"}
                    _focus={""}
                    bg={"none"}
                    border={"1px"}
                    {...props}
                />
            </Box> */}
        </div>
    )
}