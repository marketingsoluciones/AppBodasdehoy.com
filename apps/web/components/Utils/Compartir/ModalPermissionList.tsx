import ClickAwayListener from "react-click-away-listener";
import { PermissionList } from "./PermissionList";
import { FC, useState } from "react";
import { EventContextProvider, EventsGroupContextProvider } from "../../../context";
import { fetchApiEventos, queries } from "../../../utils/Fetching";
import { useTranslation } from "react-i18next";
import { useNotification } from "../../../hooks/useNotification";
import { Event } from "../../../utils/Interfaces";

interface props {
    data: any
    setOpenModal: any
    event: Event
}

export const ModalPermissionList: FC<props> = ({ data, setOpenModal, event }) => {
    const notification = useNotification()
    const { t } = useTranslation()
    const { setEvent } = EventContextProvider()
    const [permissions, setPermissions] = useState([...data?.permissions])

    const handleChangePermision = async (values) => {
        try {
            const f1p = permissions.findIndex(elem => elem.title === values.title)
            permissions.splice(f1p, 1, { title: values.title, value: values.value })
            setPermissions([...permissions])

            const f1 = event.detalles_compartidos_array?.findIndex(elem => elem.uid === data?.uid)
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
            notification({
                type: "user",
                message: `ha cambiado tu privilegios en el evento ${event?.tipo}: <strong>${event?.nombre.toUpperCase()}</strong>`,
                uids: [data?.uid]
            })
        } catch (error) {
            console.log(error)
        }
    }

    return (
        <ClickAwayListener onClickAway={() => setOpenModal(false)}>
            <div style={{ left: "50%", }} className={`fixed z-50 bg-gray-100 rounded-lg p-4 text-[15px] w-64 ml-[50%] -translate-x-[calc(50%+14px)] md:translate-x-36 space-y-4`}>
                <PermissionList permissions={permissions} handleChange={handleChangePermision} setPermission={setPermissions} />
                <div className="flex">
                    <div className="flex-1" />
                    <button onClick={() => setOpenModal(false)} className="bg-primary text-white rounded-lg px-5 py-2 h-10 capitalize">{t("save")}</button>
                </div>
            </div>
        </ClickAwayListener>
    )
}