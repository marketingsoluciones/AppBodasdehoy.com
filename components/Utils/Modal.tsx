import { FC } from "react"
import { AuthContextProvider } from "../../context"

interface propsModal {
    children: any
    set?: any
    state?: any
    classe?: any
    loading?: boolean
}

export const Modal: FC<propsModal> = ({ children, state, set, classe, loading }) => {
    const { config } = AuthContextProvider()

    return (
        <div className="relative">
            <div className="bg-black* opacity-50 z-50 fixed top-0 left-0 w-screen h-screen overflow-hidden" />
            <div className="backdrop-blur backdrop-filter bg-gray-919EAB opacity-10 z-50 fixed top-0 left-0 w-screen h-screen overflow-hidden " />
            <div className={` ${classe} bg-white shadow-lg fixed m-auto inset-0 z-50 rounded-xl overflow-auto border-[1px] border-gray-200 flex items-center justify-center`}>
                {loading && <>
                    <div className="bg-white absolute w-full h-full opacity-20" />
                    <div className="absolute loader ease-linear rounded-full border-[7px] border-black border-opacity-35 w-10 h-10" />
                </>
                }
                {/*  <span
                    onClick={() => set(!state)}
                    className="font-display text-gray-500 hover:text-gray-300 transition cursor-pointer text-2xl absolute top-5 right-5">X</span> */}
                {children}
            </div>
            <style jsx>
                {`
                .loader {
                    border-top-color:  ${config?.theme?.primaryColor};
                    -webkit-animation: spinner 1.5s linear infinite;
                    animation: spinner 1.5s linear infinite;
                }
                @-webkit-keyframes spinner {
                    0% {
                    -webkit-transform: rotate(0deg);
                    }
                    100% {
                    -webkit-transform: rotate(360deg);
                    }
                }
                @keyframes spinner {
                    0% {
                    transform: rotate(0deg);
                    }
                    100% {
                    transform: rotate(360deg);
                    }
                }
                `}
            </style>
        </div>
    )
}