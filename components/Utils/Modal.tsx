import { FC } from "react"
import { LoadingSpinner } from "./LoadingSpinner"

interface propsModal {
    children: any
    set?: any
    state?: any
    classe?: any
    loading?: boolean
}

export const Modal: FC<propsModal> = ({ children, state, set, classe, loading }) => {

    return (
        <div className="relative">
            <div className="bg-black* opacity-50 z-50 fixed top-0 left-0 w-screen h-screen overflow-hidden" />
            <div className="backdrop-blur backdrop-filter bg-gray-919EAB opacity-10 z-50 fixed top-0 left-0 w-screen h-screen overflow-hidden " />
            <div className={` ${classe} bg-white shadow-lg fixed m-auto inset-0 z-50 rounded-xl overflow-auto border-[1px] border-gray-200 flex. items-center. justify-center.`}>
                <LoadingSpinner loading={loading} />
                {children}
            </div>
        </div>
    )
}