
import { useField } from "formik";
import { useEffect, useState } from "react";

const optionsFormatTime = {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: true,
    //timeZone: "America/Los_Angeles",
};

export const InputTime = ({ ...props }) => {
    const [field, meta, helpers] = useField({ name: props?.name });
    const [value, setValue] = useState("")
    useEffect(() => {
        // const d = new Date()
        // const dLocalEpoch = new Date(`${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`).getTime()
        // const dtLocalEpoch = new Date(`${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()} ${field?.value?.split(":")[0]}:${field?.value?.split(":")[1]}`).getTime()
        // const tLocalEpoch = dtLocalEpoch - dLocalEpoch
        // const tUtcEpoch = tLocalEpoch + new Date().getTimezoneOffset() * 60 * 1000
        // //valor a guardar
        // console.log(105, tUtcEpoch)
        // const val = new Date(tUtcEpoch)
        // setValue(`${val.getHours() < 10 ? `0${val.getHours()}` : val.getHours()}:${val.getMinutes() < 10 ? `0${val.getMinutes()}` : val.getMinutes()}`)
    }, [field?.value])

    return (
        <>
            <input type="time" className="text-[14px] md:text-[20px] lg:text-[25px] block bg-transparent outline-none truncate -mb-[6px]" {...field} {...props} />
        </>
    )
}