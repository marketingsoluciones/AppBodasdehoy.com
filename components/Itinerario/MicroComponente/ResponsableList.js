import ClickAwayListener from "react-click-away-listener"
import { EventContextProvider } from "../../../context"
import { useState } from "react"

export const ResponsableList = ({ openModal, setOpenModal, DataArry, setSelectIcon, value }) => {
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
            <div className="flex flex-col items-center space-y-4 py-2" >
                <div className="w-full flex flex-col items-center">
                    <span className="text-primary text-[24px] ">Responsable </span>
                </div>
                <div>
                    <div className="w-full flex items-center justify-between text-[17px] ">
                        <button className={` ${listReturn === "personas" ? "bg-gray-100 rounded-t-lg" : null} px-3* w-full pt-1`} onClick={() => setListReturn("personas")}>
                            Personas
                        </button>
                        <button className={` ${listReturn === "grupos" ? "bg-gray-100 rounded-t-lg" : null} px-3* w-full pt-1`} onClick={() => setListReturn("grupos")}>
                            Grupos
                        </button>
                    </div>
                    <div className={`" overflow-y-scroll bg-gray-100  rounded-b-lg ${listReturn != "grupos" ? "rounded-r-lg" : " rounded-l-lg"}  flex flex-col h-[380px] space-y-2 pr-2 py-1.5 pl-1.5 `}>
                        {listReturn === "grupos"
                            ? DataArry.map((item, idx) => {
                                return (
                                    <div
                                        key={idx}
                                        className={`grid grid-cols-4 items-center cursor-pointer hover:bg-slate-200 p-1 rounded-lg  ${value?.includes(item.title) ? "bg-slate-300" : "bg-none"}`}
                                        onClick={() => { handleClick(item) }}
                                    >
                                        <div className="w-10 h-10 col-span-1">
                                            <img src={item.icon} className="h-10 " />
                                        </div>
                                        <span className="col-span-2  w-28">{item?.title}</span>
                                    </div>
                                )
                            })
                            : event?.detalles_compartidos_array?.length > 0
                                ? event?.detalles_compartidos_array?.map((item, idx) => {
                                    const title = item?.displayName != null ? item?.displayName : item.email
                                    return (
                                        <div key={idx} className={`grid grid-cols-4 items-center cursor-pointer hover:bg-slate-200 p-1 rounded-lg  ${value?.includes(title) ? "bg-slate-300" : "bg-none"}`}
                                            onClick={() => { handleClick(item) }}>
                                            <div className="w-10 h-10 col-span-1">
                                                <img
                                                    src={item?.photoURL != null ? item?.photoURL : "/placeholder/user.png"}
                                                    className="h-10 rounded-full"
                                                    alt={"userPhoto"}
                                                />
                                            </div>
                                            <div className="col-span-2  w-28">
                                                <div className="break-all line-clamp-1">{item?.displayName ? item?.displayName : item?.email}</div>
                                            </div>
                                        </div>
                                    )
                                })
                                : <div className=" flex items-center justify-center h-full text-[13.6px] text-center">
                                        no tienes invitados colaboradores
                                </div>
                        }
                    </div>
                </div>
                <button className="bg-primary w-[230px] py-1 px-2 text-white rounded-lg text-" onClick={() => setOpenModal(!openModal)}>
                    Guardar
                </button>
            </div>
        </ClickAwayListener>
    )
}