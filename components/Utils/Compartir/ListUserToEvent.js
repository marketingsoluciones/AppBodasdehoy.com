import { IoIosArrowDown } from "react-icons/io";
import { ModalPermissionList } from "../Compartir";
import { useState } from "react";
import { MdClose } from "react-icons/md";
import { EventContextProvider, EventsGroupContextProvider } from "../../../context";
import { fetchApiEventos, queries } from "../../../utils/Fetching";

export const ListUserToEvent = ({ event }) => {

    return (
        <div className="flex flex-col space-y-1 mb-5 md:mb-0 flex-1">
            <p className="text-primary">Personas con acceso</p>
            <div className="border border-gray-300 rounded-xl section overflow-y-auto flex-1 py-1">
                {event?.detalles_compartidos_array?.map((item, idx) => {
                    return (
                        <div key={idx}>
                            <User data={item} event={event} />
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

const User = ({ data, event }) => {
    const { setEvent } = EventContextProvider()
    const { eventsGroup, setEventsGroup } = EventsGroupContextProvider()

    const handleDeleteCompartititon = async () => {
        try {
            const f1 = eventsGroup.findIndex(elem => elem._id === event._id)
            const f2 = eventsGroup[f1].detalles_compartidos_array?.findIndex(elem => elem.uid === data?.uid)
            eventsGroup[f1].detalles_compartidos_array?.splice(f2, 1)
            eventsGroup[f1].compartido_array.splice(f2, 1)
            setEventsGroup([...eventsGroup])
            setEvent({ ...eventsGroup[f1] })
            await fetchApiEventos({
                query: queries.deleteCompartitions,
                variables: {
                    args: {
                        eventID: event._id,
                        users: data?.uid,
                    }
                }
            });
        } catch (error) {
            console.log(error)
        }
    }

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
            <div onClick={() => handleDeleteCompartititon()} className="w-4 h-4 cursor-pointer">
                <MdClose className="w-4 h-4 text-gray-700" />
            </div>
            {openModal &&
                <ModalPermissionList data={data} setOpenModal={setOpenModal} event={event} />
            }
        </div>
    )
}
