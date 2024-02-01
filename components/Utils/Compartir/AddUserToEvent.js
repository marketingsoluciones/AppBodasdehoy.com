import ClickAwayListener from "react-click-away-listener"
import { FormAddUserToEvent } from "../../Forms/FormAddUserToEvent"
import { CopiarLink, ListUserToEvent, PermissionList } from "../Compartir"
import { useEffect, useState } from "react"
import { fetchApiEventos, queries } from "../../../utils/Fetching"
import { useToast } from "../../../hooks/useToast"
import { EventContextProvider } from "../../../context"

export const AddUserToEvent = ({ openModal, setOpenModal, event }) => {
    const toast = useToast();
    const [selectLength, setSelectLength] = useState([])
    const [permissionArry, setPermissionArry] = useState([])
    const OldAndNewArrySharedUsers = []

    useEffect(() => {
        const rootSection = document.getElementById("rootsection")
        const child = document.getElementById("child")
        if (rootSection) {
            rootSection?.appendChild(child)
        }
    }, [])

    const handelSubmit = async () => {
        try {
            if (selectLength > 0) {
                const addUser = await fetchApiEventos({
                    query: queries.eventUpdate,
                    variables: {
                        idEvento: event._id,
                        variable: "compartido_array",
                        value: JSON.stringify(OldAndNewArrySharedUsers)
                    }
                });
            }
            if (permissionArry?.length > 0) {

                const addPermission = await fetchApiEventos({
                    query: queries?.eventUpdate,
                    variables: {
                        idEvento: event._id,
                        variable: "permisos_array",
                        value: JSON.stringify(permissionArry)
                    }
                })
            }
            toast("success", "Evento fue compartido con exito ");
            setOpenModal(!openModal)
        } catch (error) {
            toast("error", "Ha ocurrido un error al compartir el evento");
            console.log(error)
        }
    }

    return (
        <div id="child" className="let-0 top-0">
            {openModal &&
                <>
                    <div className="z-50 fixed top-0 left-0 w-screen h-screen" />
                    <div className="backdrop-blur backdrop-filter bg-black opacity-40 z-50 fixed top-0 left-0 w-screen h-screen" />
                    <div className={`md:w-[35%] md:h-[90%] bg-white shadow-lg fixed m-auto inset-0 z-50 rounded-xl`}>
                        <ClickAwayListener onClickAway={() => openModal && setOpenModal(false)} >
                            <div className="h-full py-5 flex flex-col">
                                <div className="flex justify-between border-b pb-3 text-[20px] mx-4">
                                    <div className="cursor-default font-semibold text-primary capitalize"> Compartir evento</div>
                                    <div className="cursor-pointer font-semibold text-gray-600 -translate-y-3" onClick={() => setOpenModal(!openModal)}>x</div>
                                </div>
                                <div className="flex flex-col relative space-y-4 flex-1 overflow-auto px-8">
                                    <div className="space-y-4 flex flex-col flex-1">
                                        <FormAddUserToEvent setSelectLength={setSelectLength} />
                                        {selectLength.length
                                            ? <PermissionList permissionArry={permissionArry} setPermissionArry={setPermissionArry} />
                                            : <ListUserToEvent evento={event} />
                                        }
                                    </div>
                                    <div>
                                        <CopiarLink />
                                        <div className="flex">
                                            <div className="flex-1" />
                                            {selectLength.length
                                                ? <button onClick={handelSubmit} className="bg-primary text-white rounded-lg px-5 py-2 h-10">{"Guardar"}</button>
                                                : <button onClick={() => setOpenModal(!openModal)} className="bg-primary text-white rounded-lg px-5 py-2 h-10">{"Hecho"}</button>

                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </ClickAwayListener>
                    </div>
                </>
            }
        </div>
    )
}