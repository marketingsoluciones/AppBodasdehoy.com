import { IoIosArrowDown } from "react-icons/io";
import { ModalPermissionList } from "../Compartir";
import { useEffect, useState } from "react";
import { AuthContextProvider } from "../../../context";
import { fetchApiBodas, queries } from "../../../utils/Fetching";
import ClickAwayListener from "react-click-away-listener";



export const ListUserToEvent = ({ event }) => {
    const [sharedUser, setSharedUser] = useState([])
    const { config, user } = AuthContextProvider()
    const [isMounted, setIsMounted] = useState(false)
    useEffect(() => {
        if (!isMounted) {
            setIsMounted(true)
        }
        return () => {
            setIsMounted(false)
        }
    }, [])

    useEffect(() => {
        if (isMounted) {
            Promise.all(
                event?.detalles_compartidos_array?.map(elem => {
                    return fetchApiBodas({
                        query: queries?.getUser,
                        variables: { uid: elem?.uid },
                        development: config?.development
                    }).then((result) => {
                        if (result) {
                            return { ...elem, ...result }
                        } else {
                            return elem
                        }
                    })
                })
            ).then((values) => {
                setSharedUser(values)
            });
        }
    }, [event?._id, isMounted])

    return (
        <div className="flex flex-col space-y-1 mb-5 md:mb-0 flex-1">
            <p className="text-primary">Personas con acceso</p>
            <div className="border border-gray-300 rounded-xl section overflow-y-auto flex-1 py-1">
                {sharedUser.map((item, idx) => {
                    return (
                        <div key={idx}>
                            <User data={item} setSharedUser={setSharedUser} />
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

const User = ({ data, setSharedUser }) => {
    const [openModal, setOpenModal] = useState(false)
    return (
        <div className={`${openModal && "bg-gray-100"} w-full flex items-center py-1 px-2 space-x-2 text-xs`}>
            <div className="flex-none w-8 md:w-10 h-8 md:h-10">
                <img
                    src={data?.photoURL != null ? data?.photoURL : "/placeholder/user.png"}
                    className="object-cover w-8 md:w-10 h-8 md:h-10 rounded-full"
                    alt={""}
                />
            </div>
            <div className="h-10 flex-1 flex items-center">
                <div className="flex flex-col  cursor-default">
                    <div className="break-all line-clamp-1">{data?.email}</div>
                    <div className="break-all line-clamp-1">{data?.displayName}</div>
                </div>
            </div>
            <div onClick={() => setOpenModal(!openModal)} className="border text-[13px] p-1 flex-none cursor-pointer rounded-md">
                <div className="flex items-center space-x-1">
                    <span>Permisos</span>
                    <div>
                        <IoIosArrowDown />
                    </div>
                </div>
            </div>
            {openModal &&
                <ModalPermissionList data={data} setOpenModal={setOpenModal} setSharedUser={setSharedUser} />
            }
        </div>
    )
}
