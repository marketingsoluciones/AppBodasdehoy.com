import { useEffect, useState } from "react";
import { AuthContextProvider } from "../../../context";
import { fetchApiBodas, queries } from "../../../utils/Fetching";

export const UsuariosCompartidos = ({ evento }) => {
    const [sharedUser, setSharedUser] = useState([])
    const { config, user } = AuthContextProvider()
    const [data, setData] = useState([])
    console.log(evento)

    useEffect(() => {
        let asd = []
        asd = evento?.compartido_array
        asd.push(evento?.usuario_id)
        const f1 = asd?.findIndex((elm) => elm === user?.uid)
        asd?.splice(f1, 1)
        setData([...asd])
    }, [evento])

    

    useEffect(() => {
        data.map((item) => {
            try {
                fetchApiBodas({
                    query: queries?.getUser,
                    variables: { uid: item },
                    development: config?.development
                }).then((result) => {
                    setSharedUser((old) => {
                        old?.push(result)
                        return [...old]
                    })
                })

            } catch (error) {
                console.log(error)
            }
        })
    }, [data])

    const SliceUsers = sharedUser?.slice(0, 4)

    return (
        <>
            <div style={{ left: 11 }} className="flex relative ">
                {SliceUsers?.map((item, idx) => {
                    return (
                        <div key={idx} style={{ right: 20 * idx }} className="absolute z-20">
                            <div className=" bg-white rounded-full w-8 h-8 flex items-center justify-center  border relative">
                                <img src={item?.photoURL != null ? item?.photoURL : "/placeholder/user.png"} className="rounded-full" />
                                <div className={`h-2.5 w-2.5 ${item?.onLine?.status != false ? "bg-green" : "bg-red"} absolute rounded-full right-1 -bottom-1`} />
                            </div>
                        </div>
                    )
                })}

            </div>
            {
                sharedUser?.length > 4 && <div style={{ right: 70 }} className=" bg-white rounded-full w-8 h-8 flex items-center justify-center *text-center  border absolute z-30 text-[13px] truncate font-semibold ">
                    +{sharedUser?.length}
                </div>
            }
        </>
    )
}