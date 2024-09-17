import ClickAwayListener from "react-click-away-listener"
import { FormAddUserToEvent } from "../../Forms/FormAddUserToEvent"
import { CopiarLink, ListUserToEvent, PermissionList } from "."
import { useEffect, useState } from "react"
import { fetchApiBodas, fetchApiEventos, queries } from "../../../utils/Fetching"
import { useToast } from "../../../hooks/useToast"
import { AuthContextProvider, EventContextProvider, EventsGroupContextProvider } from "../../../context"
import { useTranslation } from "react-i18next"

export const AddUserToEvent = ({ openModal, setOpenModal, event }) => {
    const { t } = useTranslation()
    const toast = useToast();
    const { config } = AuthContextProvider()
    const { setEvent } = EventContextProvider()
    const { eventsGroup, setEventsGroup } = EventsGroupContextProvider()
    const [users, setUsers] = useState([])
    const [permissions, setPermissions] = useState([])
    const [isMounted, setIsMounted] = useState(false)
    const [valir, setValir] = useState(true)

    useEffect(() => {
        if (!isMounted) {
            setIsMounted(true)
        }
        return () => {
            console.log("desmontado")
            setIsMounted(false)
        }
    }, [])

    const handleSubmit = async () => {
        try {
            const results = await fetchApiEventos({
                query: queries.addCompartitions,
                variables: {
                    args: {
                        eventID: event._id,
                        users,
                        permissions
                    }
                }
            });
            const resultsUser = await fetchApiBodas({
                query: queries?.getUsers,
                variables: { uids: results?.compartido_array },
                development: config?.development
            });
            resultsUser.map((result) => {
                const f1 = results.detalles_compartidos_array?.findIndex(elem => elem.uid === result.uid);
                if (f1 > -1) {
                    results.detalles_compartidos_array?.splice(f1, 1, { ...results.detalles_compartidos_array[f1], ...result });
                }
            })
            setUsers([])
            const f1 = eventsGroup.findIndex(elem => elem._id === event._id)
            eventsGroup[f1].detalles_compartidos_array?.push(...results.detalles_compartidos_array)
            eventsGroup[f1].compartido_array.push(...results.compartido_array)
            setEventsGroup([...eventsGroup])
            setEvent({ ...eventsGroup[f1] })
            // falta setear evento
            toast("success", "Evento fue compartido con exito ");
        } catch (error) {
            toast("error", "Ha ocurrido un error al compartir el evento");
            console.log(error)
        }
    }

    const handleChangePermision = (values) => {
        try {
            setPermissions(old => {
                const f1 = old.findIndex(elem => elem.title === values.title)
                old.splice(f1, 1, { title: values.title, value: values.value })
                return [...old]
            })
        } catch (error) {
            console.log(error)
        }
    }

    return (
        <>
            <div className="z-50 fixed top-0 left-0 w-screen h-screen" />
            <div className="backdrop-blur backdrop-filter bg-black opacity-40 z-50 fixed top-0 left-0 w-screen h-screen" />
            <div className={`w-[320px] md:w-[382px] h-[80%] md:h-[90%] bg-white shadow-lg fixed m-auto inset-0 z-50 rounded-xl`}>
                <ClickAwayListener onClickAway={() => openModal && setOpenModal(false)} >
                    <div className="h-full py-5 flex flex-col">
                        <div className="flex justify-between border-b pb-1 text-[20px] mx-4">
                            <div className="cursor-default font-semibold text-primary capitalize"> {t("shareevent")}</div>
                            <div className="cursor-pointer font-semibold text-gray-600 -translate-y-3" onClick={() => setOpenModal(!openModal)}>x</div>
                        </div>
                        <div className="flex flex-col relative space-y-4 pt-3 flex-1 overflow-auto px-2 md:px-8">
                            <div className=" flex flex-col flex-1">
                                <FormAddUserToEvent setUsers={setUsers} users={users} setValir={setValir} optionsExist={event?.detalles_compartidos_array?.map(elem => elem.email)} />
                                {users.length
                                    ? <PermissionList permissions={permissions} setPermissions={setPermissions} handleChange={handleChangePermision} />
                                    : <ListUserToEvent event={event} />
                                }
                            </div>
                            <div>
                                <CopiarLink link={`${window.location.host}/?pAccShas=${event?._id.slice(3, 9)}${event?._id}`} />
                                <div className="flex">
                                    <div className="flex-1" />
                                    {users.length
                                        ? <button onClick={() => users?.length && handleSubmit()} className={`bg-primary text-white rounded-lg px-5 py-2 h-10 capitalize`}>{t("save")}</button>
                                        : <button onClick={() => valir && setOpenModal(!openModal)} className={`${valir ? "bg-primary" : "bg-gray-300"} text-white rounded-lg px-5 py-2 h-10 capitalize`}>{t("done")}</button>

                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                </ClickAwayListener>
            </div>
        </>
    )
}