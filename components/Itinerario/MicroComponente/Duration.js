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
            <div className="bg-violet-400 flex text-[9px] md:text-[11px] lg:text-[13px] space-x-3">
                <span> {t("duration")}</span>
                <span className="relative bg-red" >
                    <input ref={inputRef} disabled={disable} className="-translate-x-3 -translate-y-3 absolute focus:ring-0 w-[20px] md:w-[25px] lg:w-[28px] text-[11px] md:text-[13px] lg:text-[15px] text-center bg-transparent px-1 border-none" type="number" {...field} {...props} onClick={handleClick} />
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