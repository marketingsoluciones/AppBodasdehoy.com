import { useEffect, useState } from "react";
import { AuthContextProvider } from "../../../context";

export const UsuariosCompartidos = ({ event }) => {
    const [sharedUser, setSharedUser] = useState([])
    const { user } = AuthContextProvider()


    useEffect(() => {
        let shU = []
        if (event != undefined) {
            shU = [...event?.detalles_compartidos_array?.sort((a, b) => { return a?.onLine?.dateConection - b?.onLine?.dateConection })]
            setSharedUser(shU)
        }
        if (event?.detalles_usuario_id) {
            shU.push(event?.detalles_usuario_id)
        }
    }, [event])

    const h = (str) => {
        str.slice(0, 2).charCodeAt(1).toString(16)
        const s = "#" + str.slice(0, 4).charCodeAt(2).toString(16) + str.slice(2, 7).charCodeAt(2).toString(16) + str.slice(5, 10).charCodeAt(2).toString(16)
        return s
    }

    return (
        <>
            <div style={{ left: 11 }} className={`flex relative ${event?.usuario_id === user?.uid && "cursor-pointer"} ${sharedUser?.length > 5 ? "-translate-x-8" : "-translate-x-2"}`}>
                {sharedUser?.length > 5 && <div style={{ right: 7 }} className="absolute z-20">
                    <div className="bg-white rounded-full w-7 h-7 flex items-center justify-center *text-center border border-gray-300 absolute z-30 text-[13px] truncate font-semibold">
                        <div className="absolute rounded-full w-7 h-7" />
                        +{sharedUser?.length - 4}
                    </div>
                </div>}
                {sharedUser?.slice(sharedUser?.length > 5 ? -4 : -sharedUser?.length)?.map((item, idx) => {
                    return (
                        <div key={idx} style={{ right: 18 * idx }} className="absolute z-20">
                            <div className="bg-gray-300 rounded-full w-7 h-7 flex items-center justify-center  border relative">
                                {item?.photoURL !== null
                                    ? <img src={item?.photoURL} className="rounded-full" />
                                    : <div
                                        style={{ backgroundColor: h(item.uid.slice(-11)) }}
                                        className={`${""} flex items-center justify-center text-white uppercase w-full h-full rounded-full text-sm`}>
                                        {item?.displayName
                                            ? (item?.displayName.split(" ").map(elem => elem.slice(0, 1).toUpperCase())).join("")
                                            : item?.email?.slice(0, 1)}
                                    </div>
                                }
                                {/* <img src={item?.photoURL != null ? item?.photoURL : "/placeholder/user.png"} className="rounded-full" /> */}
                                <div className={`h-2.5 w-2.5 ${item?.onLine?.status != false ? "bg-green" : "bg-none"} absolute rounded-full right-1 -bottom-1`} />
                            </div>
                        </div>
                    )
                })}
            </div >
        </>
    )
}