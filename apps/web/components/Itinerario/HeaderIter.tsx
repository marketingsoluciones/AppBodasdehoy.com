import { FC } from "react"
import { LiaDownloadSolid } from "react-icons/lia";
import { useTranslation } from 'react-i18next';




export const HeaderIter = () => {
    const { t } = useTranslation();
    return (
        <div className="border-2 border-rose-400 flex items-center justify-between bg-white px-5 rounded-lg py-1.5">
            <div className=" text-gray-500 text-[13px]">
                {t("createitineraries")}
            </div>

        </div>
    )
}