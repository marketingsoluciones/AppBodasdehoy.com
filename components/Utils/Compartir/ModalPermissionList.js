import { MdOutlineEdit } from "react-icons/md";
import { IoEyeOutline } from "react-icons/io5";
import { MdOutlineCancel } from "react-icons/md";
import ClickAwayListener from "react-click-away-listener";
import { PermissionList } from "./PermissionList";
import { useEffect, useState } from "react";
import { EventContextProvider } from "../../../context";
import { fetchApiEventos, queries } from "../../../utils/Fetching";

export const ModalPermissionList = ({ data, setOpenModal, setSharedUser }) => {
    const { event, setEvent } = EventContextProvider()
    const [permissions, setPermissions] = useState([...data?.permissions])

    const handleChangePermision = async (values) => {
        setPermissions(old => {
            const f1 = old.findIndex(elem => elem.title === values.title)
            old.splice(f1, 1, { title: values.title, value: values.value })
            return [...old]
        })

        setSharedUser(old => {
            const f1 = old.findIndex(elem => elem?.uid === data?.uid)
            const f2 = old[f1]?.permissions.findIndex(elem => elem?.title === values?.title)
            old[f1].permissions.splice(f2, 1, values)
            return ([...old])
        })

        //setear evento hacer fetichin para actualizar en bd
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

    return (
        <ClickAwayListener onClickAway={() => setOpenModal(false)}>
            <div style={{ left: ["50%"], }} className={`fixed z-50 bg-gray-100 rounded-lg p-4 text-[15px] w-64 ml-[50%] -translate-x-[calc(50%+14px)] md:translate-x-36 *translate-y-28`}>
                <PermissionList permissions={permissions} handleChange={handleChangePermision} />
            </div>
        </ClickAwayListener>
    )
}