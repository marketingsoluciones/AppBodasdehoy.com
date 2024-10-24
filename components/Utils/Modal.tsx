import { FC } from "react"

interface propsModal {
    children: any
    set?: any
    state?: any
    classe?: any

}

export const Modal: FC<propsModal> = ({ children, state, set, classe }) => {
    return (
        <>
            <div className="bg-black opacity-50 z-50 fixed top-0 left-0 w-screen h-screen overflow-hidden" />
            <div className="backdrop-blur backdrop-filter bg-gray-919EAB opacity-10 z-50 fixed top-0 left-0 w-screen h-screen overflow-hidden " />
            <div className={` ${classe}  space-y-4* bg-white shadow-lg fixed m-auto inset-0 z-50 rounded-xl  overflow-auto border-[1px] border-gray-200`}>
                <span
                    onClick={() => set(!state)}
                    className="font-display text-gray-500 hover:text-gray-300 transition cursor-pointer text-2xl absolute top-5 right-5">X</span>
                {children}
            </div>

        </>
    )
}