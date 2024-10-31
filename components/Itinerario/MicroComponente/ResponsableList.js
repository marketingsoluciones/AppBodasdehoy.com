import ClickAwayListener from "react-click-away-listener"
import { AuthContextProvider, EventContextProvider } from "../../../context"
import { useState } from "react"
import { useTranslation } from 'react-i18next';

export const ResponsableList = ({ openModal, setOpenModal, DataArry, setSelectIcon, value }) => {
    const { t } = useTranslation();
    const { user } = AuthContextProvider()
    const { event } = EventContextProvider()
    const [listReturn, setListReturn] = useState("personas")

    const handleClick = (item) => {
        const name = item?.title ?? item?.displayName
        setSelectIcon((old) => {
            const f1 = old?.findIndex(elem => elem === name)
            if (f1 > -1) {
                old.splice(f1, 1)
            } else {
                old.push(name)
            }
            return [...old]
        })
    }

    return (
        <ClickAwayListener onClickAway={() => openModal && setOpenModal(false)}>
            <div className="flex flex-col w-full h-[95%] items-center space-y-4 py-2 px-4 text-sm" >
                <div className="w-full flex flex-col items-center">
                    <span className="text-primary text-[16px]">{t("Responsable")}</span>
                </div>
                <div className="flex flex-col w-full h-[83%]">
                    <div className="w-full flex items-center justify-between text-[16px]">
                        <button className={`py-1 ${listReturn === "personas" ? "bg-gray-100 rounded-t-lg" : null} px-3* w-full pt-1`} onClick={() => setListReturn("personas")}>
                            {t("people")}
                        </button>
                        <button className={`py-1 ${listReturn === "grupos" ? "bg-gray-100 rounded-t-lg" : null} px-3* w-full pt-1`} onClick={() => setListReturn("grupos")}>
                            {t("groups")}
                        </button>
                    </div>

                    <div className={`w-full overflow-y-scroll bg-gray-100 rounded-b-lg ${listReturn != "grupos" ? "rounded-r-lg" : "rounded-l-lg"} flex flex-col flex-1`}>
                        {listReturn === "grupos"
                            ? DataArry.map((item, idx) => {
                                return (
                                    <div
                                        key={idx}
                                        className={`w-full flex items-center cursor-pointer md:hover:bg-slate-200 p-1 space-x-1 ${value?.includes(item.title) ? "bg-slate-300" : "bg-none"}`}
                                        onClick={() => { handleClick(item) }}
                                    >
                                        <div className="w-10 h-10 border-[1px] border-gray-300 rounded-full flex justify-center items-center">
                                            <img src={item.icon} className="object-cover w-full h-full rounded-full" />
                                        </div>
                                        <span className="flex-1">{t(item?.title)}</span>
                                        {value?.includes(item.title) && <span className="w-4">x</span>}

                                    </div>
                                )
                            })
                            // : event?.detalles_compartidos_array?.length > 0                                ?
                            : [user, ...event?.detalles_compartidos_array]?.map((item, idx) => {
                                const title = item?.displayName != null ? item?.displayName : item.email
                                return (
                                    <div key={idx} className={`w-full flex items-center cursor-pointer md:hover:bg-slate-200 p-1 space-x-1 ${value?.includes(title) ? "bg-slate-300" : "bg-none"}`}
                                        onClick={() => { handleClick(item) }}>
                                        <div className="w-10 h-10 border-[1px] border-gray-300 rounded-full flex justify-center items-center">
                                            <img
                                                className="object-cover w-full h-full rounded-full"
                                                src={item?.photoURL != null ? item?.photoURL : "/placeholder/user.png"}
                                                alt={"userPhoto"}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <div className="break-all line-clamp-1">{item?.displayName ? item?.displayName : item?.email}</div>
                                        </div>
                                        {value?.includes(title) && <span className="w-4">x</span>}
                                    </div>
                                )
                            })
                            // : <div className=" flex items-center justify-center h-full text-[13.6px] text-center">
                            //     {t("collaboratingguests")}
                            // </div>
                        }
                    </div>
                </div>
                <button className="bg-primary w-[230px] py-1 px-2 text-white rounded-lg text-" onClick={() => setOpenModal(!openModal)}>
                    {t("save")}
                </button>
            </div>
        </ClickAwayListener>
    )
}