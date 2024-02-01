import { useEffect, useState } from "react";
import { AuthContextProvider } from "../../../context";
import { fetchApiBodas, queries } from "../../../utils/Fetching";

export const UsuariosCompartidos = ({ event }) => {
    const [sharedUser, setSharedUser] = useState([])
    const { config, user } = AuthContextProvider()
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        if (!isMounted) {
            setIsMounted(true)
        }
        return () => {
            if (isMounted) {
                setIsMounted(false)
            }
        }
    }, [isMounted])


    useEffect(() => {
        if (isMounted) {
            setSharedUser([])
            let data = []
            data = event?.compartido_array
            data.push(event?.usuario_id)
            const f1 = data?.findIndex((elm) => elm === user?.uid)
            data?.splice(f1, 1)
            if (data.length) {
                fetchApiBodas({
                    query: queries?.getUsers,
                    variables: { uids: data },
                    development: config?.development
                }).then((results) => {
                    const resultsSort = results.sort((a, b) => { return a.onLine.dateConection - b.onLine.dateConection })
                    setSharedUser(resultsSort)
                })
            }
        }
    }, [isMounted])




    //const SliceUsers = sharedUser?.slice(0, 4)

    return (
        <>
            <div style={{ left: 11 }} className={`flex relative ${event.usuario_id === user?.uid && "cursor-pointer"} ${sharedUser.length > 5 ? "-translate-x-8" : "-translate-x-2"}`}>
                {sharedUser.length > 5 && <div style={{ right: 7 }} className="absolute z-20">
                    <div className="bg-white rounded-full w-7 h-7 flex items-center justify-center *text-center border border-gray-300 absolute z-30 text-[13px] truncate font-semibold">
                        <div className="absolute rounded-full w-7 h-7" />
                        +{sharedUser?.length - 4}
                    </div>
                </div>}
                {sharedUser?.slice(sharedUser.length > 5 ? -4 : -sharedUser.length)?.map((item, idx) => {
                    return (
                        <div key={idx} style={{ right: 15 * idx }} className="absolute z-20">
                            <div className=" bg-white rounded-full w-7 h-7 flex items-center justify-center  border relative">
                                <img src={item?.photoURL != null ? item?.photoURL : "/placeholder/user.png"} className="rounded-full" />
                                <div className={`h-2.5 w-2.5 ${item?.onLine?.status != false ? "bg-green" : "bg-none"} absolute rounded-full right-1 -bottom-1`} />
                            </div>
                        </div>
                    )
                })}
                {/* {
                sharedUser?.length > 4 && <div style={{ right: 70 }} className=" bg-white rounded-full w-8 h-8 flex items-center justify-center *text-center  border absolute z-30 text-[13px] truncate font-semibold ">
                    +{sharedUser?.length}
                </div>
            } */}

            </div>
        </>
    )
}