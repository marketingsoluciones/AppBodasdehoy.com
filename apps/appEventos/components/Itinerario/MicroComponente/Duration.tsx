import { useField } from "formik";
import { useTranslation } from 'react-i18next';
import { useRef } from "react";

export const Duration = ({ disable, ...props }) => {
    const { t } = useTranslation();
    const [field, meta, helpers] = useField({ name: props?.name });
    const inputRef = useRef(null);

    const handleClick = () => {
        inputRef.current.select();
    };

    return (
        <>
            <div className=" flex items-center text-[9px] md:text-[15px] lg:text-[17px] space-x-4 h-full">
                <span> {t("duration")}</span>
                <span className="relative" >
                    <input ref={inputRef} disabled={disable} className="-translate-x-[14px] -translate-y-[20px] absolute focus:ring-0 w-[20px] md:w-[25px] lg:w-[28px] text-[11px] md:text-[13px] lg:text-[15px] text-center bg-transparent px-1 border-none" type="number" {...field} {...props} onClick={handleClick} />
                </span>
                <span>min</span>
            </div>
            <style jsx>
                {`
                    input[type=number]::-webkit-inner-spin-button, 
                    input[type=number]::-webkit-outer-spin-button { 
                    -webkit-appearance: none; 
                    margin: 0; 
                    }
                `}
            </style>
        </>

    )
}