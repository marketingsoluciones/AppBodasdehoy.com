import ClickAwayListener from "react-click-away-listener";
import { PermissionList } from "./PermissionList";
import { useState } from "react";
import { EventContextProvider, EventsGroupContextProvider } from "../../../context";
import { fetchApiEventos, queries } from "../../../utils/Fetching";

export const ModalPermissionList = ({ data, setOpenModal, event }) => {
    const { setEvent } = EventContextProvider()
    const { eventsGroup, setEventsGroup } = EventsGroupContextProvider()
    const [permissions, setPermissions] = useState([...data?.permissions])

    const handleChangePermision = async (values) => {
        setPermissions(old => {
            const f1 = old.findIndex(elem => elem.title === values.title)
            old.splice(f1, 1, { title: values.title, value: values.value })
            return [...old]
        })

        const f1 = event.detalles_compartidos_array.findIndex(elem => elem.uid === data?.uid)
        event.detalles_compartidos_array[f1].permissions = permissions
        setEvent({ ...event })

        await fetchApiEventos({
            query: queries.updateCompartitions,
            variables: {
                args: {
                    eventID: event._id,
                    users: data?.uid,
                    permissions: values
                }
            }
        });
    }

    const handleDeleteCompartititon = async () => {
        const f1 = eventsGroup.findIndex(elem => elem._id === event._id)
        const f2 = eventsGroup[f1].detalles_compartidos_array.findIndex(elem => elem.uid === data?.uid)
        eventsGroup[f1].detalles_compartidos_array.splice(f2, 1)
        eventsGroup[f1].compartido_array.splice(f2, 1)
        setEventsGroup([...eventsGroup])
        //setEvent({ ...eventsGroup[f1] })
        await fetchApiEventos({
            query: queries.deleteCompartitions,
            variables: {
                args: {
                    eventID: event._id,
                    users: data?.uid,
                }
            }
        });
        setOpenModal(false)
    }

    return (
        <ClickAwayListener onClickAway={() => setOpenModal(false)}>
            <div style={{ left: ["50%"], }} className={`fixed z-50 bg-gray-100 rounded-lg p-4 text-[15px] w-64 ml-[50%] -translate-x-[calc(50%+14px)] md:translate-x-36 space-y-4`}>
                <PermissionList permissions={permissions} handleChange={handleChangePermision} />
                <div className="flex">
                    <div className="flex-1" />
                    <button onClick={() => handleDeleteCompartititon()} className="bg-primary text-white rounded-lg px-5 py-2 h-10">Quitar acceso</button>
                </div>
            </div>
        </ClickAwayListener>
    )
}