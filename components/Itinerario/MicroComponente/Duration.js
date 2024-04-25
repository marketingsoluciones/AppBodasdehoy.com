import { useField } from "formik";

export const Duration = ({ ...props }) => {
    const [field, meta, helpers] = useField({ name: props?.name });
    return (
        <>
            <div className="text-[13px] md:text-[11px] lg:text-[13px] md:w-[116px]">
                <span> Duración</span>
                <input className="focus:outline-none w-[28px] md:w-[28px] truncate text-center bg-transparent px-1" type="number" placeholder="12" {...field} {...props} />
                <span>min</span>
            </div>
        </>

    )
}