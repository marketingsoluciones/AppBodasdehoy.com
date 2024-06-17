import { useField } from "formik";

export const Duration = ({disable, ...props }) => {
    const [field, meta, helpers] = useField({ name: props?.name });
    return (
        <>
            <div className="text-[13px] md:text-[11px] lg:text-[13px] md:w-[116px]">
                <span> Duración</span>
                <input disabled={disable} className=" focus:ring-0  w-[28px] md:w-[28px] truncate text-center bg-transparent px-1  border-none " type="number" placeholder="12" {...field} {...props} />
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