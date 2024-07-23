
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

export const InputTime = ({ disable,ht, ...props }) => {
    const [field, meta, helpers] = useField({ name: props?.name });
    const [value, setValue] = useState("")


    return (
        <>
            <input disabled={disable} type="time" className="focus:ring-0  text-[15px] md:text-[20px] lg:text-[25px] block bg-transparent outline-none truncate md:-mb-[20px] border-none  " {...field} {...props} />
        </>
    )
}