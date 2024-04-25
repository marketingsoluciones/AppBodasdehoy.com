import { FC } from "react"
import { LiaDownloadSolid } from "react-icons/lia";


interface HeaderIterProps {
    IterArryst: any
    setIterArryst: any
    setCreatePdf: any
    createPdf: any
}

export const HeaderIter: FC<HeaderIterProps> = ({ IterArryst, setIterArryst, setCreatePdf, createPdf }) => {
    return (
        <>
            <div className="flex items-center justify-between bg-white px-5 rounded-lg py-1.5">
                <div className=" text-gray-500 text-[13px]">
                    Crea intinerarios para tus clientes
                </div>
                {/* <div className="cursor-pointer">
                    <LiaDownloadSolid className="h-auto w-5" />
                </div> */}
            </div>
        </>
    )
}