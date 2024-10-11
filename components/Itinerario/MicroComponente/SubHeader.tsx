import { useEffect, useState, FC } from "react"
import { AuthContextProvider } from "../../../context/AuthContext"
import { EventContextProvider } from "../../../context/EventContext"
import { fetchApiEventos, queries } from "../../../utils/Fetching"
import { useTranslation } from 'react-i18next';
import { PencilEdit } from "../../icons";
import { MdOutlineDeleteOutline } from "react-icons/md";
import { SelectModeView } from "../../Utils/SelectModeView";

interface props {
    title: any
    date: any
    setButton: any
    button: any
    disable: any
    ht: any
    setModalPlantilla: any
    modalPlantilla: any
    view: any
    setView: any
}

export const SubHeader: FC<props> = ({ title, date, setButton, button, disable, ht, setModalPlantilla, modalPlantilla, view, setView }) => {
    const { t } = useTranslation();
    const { event } = EventContextProvider()
    const { user } = AuthContextProvider()

    return (
        <div className="w-full px-4 md:px-10 py-4 space-y-2" >
            <div className="flex w-full justify-between items-start">
                <div className="w-1/2 flex flex-col md:block text-xs md:text-[14px] text-azulCorporativo">
                    <span className="text-primary cursor-pointer hover:text-pink-500" onClick={() => disable ? ht() : setButton(!button)}>
                        {t("resetitinerary")}
                    </span>
                    <span className="text-primary cursor-pointer hover:text-pink-500" onClick={() => disable ? ht() : setModalPlantilla(!modalPlantilla)} >
                        {t("loadtemplate")}
                    </span>
                    {/* <div>
                        <span className="text-[14px]">{t("weddingdate")}</span>
                        <span className="text-primary">{date}</span>
                    </div>
                    <div className={` ${event?.usuario_id === user?.uid && user?.displayName !== "guest" ? "hidden" : "block"} `}>
                        <span>{t("permissions")}</span>
                        <span className="text-primary">{disable ? t("reading") : t("edition")}</span>
                    </div> */}
                </div>
                <div className="flex flex-col w-1/2 text-xs md:text-[14px] justify-end items-end space-y-1">
                    <div className={"flex text-gray-700 space-x-2"}>
                        <PencilEdit className="w-5 h-5" />
                        <MdOutlineDeleteOutline className="w-5 h-5" />
                        <SelectModeView value={view} setValue={setView} />
                    </div>
                </div>
            </div>
            <div className="flex flex-col justify-center items-center">
                <span className="text-3xl md:text-[40px] font-title text-primary">{title}</span>
                <div className="w-[100px] bg-primary h-0.5 rounded-md mt-2" />
            </div>
        </div >
    )
}