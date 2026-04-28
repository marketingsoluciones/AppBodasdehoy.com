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

    const [saving, setSaving] = useState(false)

    const handleChangePermision = async (values) => {
        // Guardar estado previo para rollback si falla
        const prevPermissions = [...permissions]
        const f1 = event.detalles_compartidos_array?.findIndex(elem => elem.uid === data?.uid)
        const prevEventPermissions = f1 >= 0 ? [...event.detalles_compartidos_array[f1].permissions] : null

        try {
            setSaving(true)

            // Optimistic update
            const f1p = permissions.findIndex(elem => elem.title === values.title)
            permissions.splice(f1p, 1, { title: values.title, value: values.value })
            setPermissions([...permissions])

            if (f1 >= 0) {
                event.detalles_compartidos_array[f1].permissions = permissions
                setEvent({ ...event })
            }

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
            // Rollback optimistic update
            setPermissions(prevPermissions)
            if (f1 >= 0 && prevEventPermissions) {
                event.detalles_compartidos_array[f1].permissions = prevEventPermissions
                setEvent({ ...event })
            }
            console.error("[ModalPermissionList] Error guardando permisos:", error)
            alert(t("Ha ocurrido un error al guardar los permisos. Inténtalo de nuevo."))
        } finally {
            setSaving(false)
        }
    }

    return (
        <>
            <div className="fixed inset-0 z-[60] bg-black/20" onClick={() => setOpenModal(false)} />
            <ClickAwayListener onClickAway={() => setOpenModal(false)}>
                <div className={`fixed z-[60] bg-white rounded-xl shadow-xl p-4 text-[15px] w-[280px] md:w-[320px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 space-y-4 border border-gray-200`}>
                    <p className="text-primary font-semibold text-sm">{data?.email}</p>
                    <PermissionList permissions={permissions} handleChange={handleChangePermision} setPermission={setPermissions} />
                    <div className="flex">
                        <div className="flex-1" />
                        <button onClick={() => setOpenModal(false)} disabled={saving} className={`${saving ? "opacity-50 cursor-wait" : ""} bg-primary text-white rounded-lg px-5 py-2 h-10 capitalize`}>{t("save")}</button>
                    </div>
                </div>
            </ClickAwayListener>
        </>
    )
}