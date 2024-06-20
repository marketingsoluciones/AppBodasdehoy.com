import ClickAwayListener from "react-click-away-listener"
import { ListUserToEvent } from "../../Utils/Compartir"
import { EventContextProvider } from "../../../context"
import { useState } from "react"

export const ResponsableList = ({ openModal, setOpenModal, DataArry, setSelectIcon, value }) => {
    const { event } = EventContextProvider()
    const [listReturn, setListReturn] = useState("personas")
    const handleClick = (item) => {
        console.log(110, item)
        setSelectIcon((old) => {
            if (item.title) {
                const f1 = old.findIndex(elem => elem.title === item.title)
                if (f1 < 0) {
                    old.push(item)
                    return [...old]
                }
                if (f1 > -1) {
                    old.splice(f1, 1)
                    return [...old]
                }

            }
            if (item.displayName) {
                const f1 = old?.findIndex(elem => elem?.displayName === item?.displayName)
                if (f1 < 0) {
                    old.push(item)
                    return [...old]
                }
                if (f1 > -1) {
                    old.splice(f1, 1)
                    return [...old]
                }
            }
            if(item.displayName === null){
                const f1 = old?.findIndex(elem => elem?.email === item?.email)
                if (f1 < 0) {
                    old.push(item)
                    return [...old]
                }
                if (f1 > -1) {
                    old.splice(f1, 1)
                    return [...old]
                }
            }
        })
    }

    return (
        <ClickAwayListener onClickAway={() => openModal && setOpenModal(false)}>
            <div className="flex flex-col items-center space-y-4 py-5" >
                <div className="w-full flex flex-col items-center">
                    <span className="text-primary text-[20px]">Responsable </span>
                    <div className="space-x-3 w-full flex items-center justify-center text-[13px]">
                        <button className={` ${listReturn === "personas" ? "border-b-2" : "border-b-0"} border-primary rounded-xs`} onClick={() => setListReturn("personas")}>
                            Personas
                        </button>
                        <button className={` ${listReturn === "grupos" ? "border-b-2" : "border-b-0"} border-primary rounded-xs`} onClick={() => setListReturn("grupos")}>
                            Grupos
                        </button>
                    </div>
                </div>

                <div className=" overflow-y-auto   flex flex-col h-[380px] space-y-2 pr-2 ">
                    {
                        listReturn === "grupos" ?
                            DataArry.map((item, idx) => {
                                return (
                                    <div
                                        key={idx}
                                        className={`grid grid-cols-3 items-center cursor-pointer hover:bg-slate-200 p-1 rounded-lg  ${value?.includes(item.title) ? "bg-slate-300" : "bg-none"}`}
                                        onClick={() => { handleClick(item) }}
                                    >
                                        <div className="col-span-1">
                                            <img src={item.icon} className="h-10 " />
                                        </div>
                                        <span className="col-span-2  w-28">{item?.title}</span>
                                    </div>
                                )
                            }) :
                            event?.detalles_compartidos_array?.map((item, idx) => {
                                const title = item?.displayName!= null ? item?.displayName : item.email
                                return (
                                    <div key={idx} className={`grid grid-cols-3 items-center cursor-pointer hover:bg-slate-200 p-1 rounded-lg  ${value?.includes(title) ? "bg-slate-300" : "bg-none"}`}
                                        onClick={() => { handleClick(item) }}>
                                        <div className=" col-span-1">
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
                    }
                </div>

                <button className="bg-primary py-1 px-2 text-white rounded-lg text-" onClick={() => setOpenModal(!openModal)}>
                    Guardar
                </button>
            </div>
        </ClickAwayListener>
    )
}