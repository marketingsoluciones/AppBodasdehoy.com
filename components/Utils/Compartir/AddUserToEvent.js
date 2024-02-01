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
    const OldAndNewArrySharedUsers = [...selectLength, ...event?.compartido_array]

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
            if (permissionArry.length > 0) {

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
                    <div className="z-50 fixed top-0 left-0 w-screen h-screen overflow-hidden" />
                    <div className="backdrop-blur backdrop-filter bg-black opacity-40 z-50 fixed top-0 left-0 w-screen h-screen overflow-hidden " />
                    <div className={`md:w-[35%] md:h-[90%] space-y-4 bg-white shadow-lg fixed m-auto inset-0 z-50 rounded-xl  overflow-auto `}>
                        <ClickAwayListener onClickAway={() => openModal && setOpenModal(false)} >
                            <div className="h-full px-10 py-5">
                                <div className="flex  justify-between border-b pb-3 text-[20px]">
                                    <div className="cursor-default font-semibold text-primary capitalize"> Compartir evento</div>
                                    <div className="cursor-pointer font-semibold" onClick={() => setOpenModal(!openModal)}>x</div>
                                </div>
                                <div className="py-5 space-y-2 md:space-y-5 flex flex-col relative  ">
                                    <FormAddUserToEvent setSelectLength={setSelectLength} />
                                    {
                                        selectLength.length >= 1 ?
                                            <PermissionList permissionArry={permissionArry} setPermissionArry={setPermissionArry} /> :
                                            <ListUserToEvent evento={event} />
                                    }
                                    <div className="flex md:flex-row flex-col space-y-1 justify-between items-center">
                                        <CopiarLink />
                                        {
                                            selectLength.length >= 1 ?
                                                (
                                                    <button onClick={handelSubmit} className="bg-primary text-white rounded-lg px-5 py-2 h-10">{"Guardar"}</button>
                                                ) :
                                                (
                                                    <button onClick={() => setOpenModal(!openModal)} className="bg-primary text-white rounded-lg px-5 py-2 h-10">{"Hecho"}</button>
                                                )
                                        }
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