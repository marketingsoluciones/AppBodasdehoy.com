import { FC } from "react"
import { LiaDownloadSolid } from "react-icons/lia";
import { useTranslation } from 'react-i18next';


interface HeaderIterProps {
    IterArryst: any
    setIterArryst: any
    setCreatePdf: any
    createPdf: any
}

export const HeaderIter: FC<HeaderIterProps> = ({ IterArryst, setIterArryst, setCreatePdf, createPdf }) => {
    const { t } = useTranslation();
    return (
        <>
            <div className="border-2 border-rose-400 flex items-center justify-between bg-white px-5 rounded-lg py-1.5">
                <div className=" text-gray-500 text-[13px]">
                    {t("createitineraries")}
                </div>
                {/* <div className="cursor-pointer">
                    <LiaDownloadSolid className="h-auto w-5" />
                </div> */}
            </div>
        </>
    )
}