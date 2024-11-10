import { useEffect, useState } from "react";
import { AuthContextProvider } from "../../../context";
import { ImageAvatar } from "../ImageAvatar"

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

    return (
        <div style={{ left: 11 }} className={`flex relative ${event?.usuario_id === user?.uid && "cursor-pointer"} ${sharedUser?.length > 5 ? "-translate-x-8" : "-translate-x-2"}`}>
            {event?.usuario_id === user?.uid
                ? <>
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
                                    <ImageAvatar user={item} />
                                    <div className={`h-2.5 w-2.5 ${item?.onLine?.status != false ? "bg-green" : "bg-none"} absolute rounded-full right-1 -bottom-1`} />
                                </div>
                            </div>
                        )
                    })}
                </>
                : <div style={{ right: 0 }} className="absolute z-20">
                    <div className="bg-gray-300 rounded-full w-7 h-7 flex items-center justify-center border relative">
                        <ImageAvatar user={event?.detalles_usuario_id} />
                        <div className={`h-2.5 w-2.5 ${event?.detalles_usuario_id?.onLine?.status != false ? "bg-green" : "bg-none"} absolute rounded-full right-1 -bottom-1`} />
                    </div>
                </div>
            }
        </div >
    )
}