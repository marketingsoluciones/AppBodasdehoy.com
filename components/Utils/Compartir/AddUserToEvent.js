import ClickAwayListener from "react-click-away-listener"
import { FormAddUserToEvent } from "../../Forms/FormAddUserToEvent"
import { CopiarLink, ListUserToEvent, PermissionList } from "../Compartir"
import { useEffect, useState } from "react"
import { fetchApiEventos, queries } from "../../../utils/Fetching"
import { useToast } from "../../../hooks/useToast"
import { EventContextProvider } from "../../../context"

export const AddUserToEvent = ({ openModal, setOpenModal, idEvent }) => {
    const toast = useToast();
    const { event, setEvent } = EventContextProvider()
    const [selectLength, setSelectLength] = useState([])
    const [dataInput, setDataInput] = useState()
    const [dataUsers, setDataUsers] = useState([])
    const [permissionArry, setPermissionArry] = useState([])
    const newArrySharedUsers = selectLength.map((item) => { return item.value })
    const OldAndNewArrySharedUsers = [...newArrySharedUsers, ...idEvent.compartido_array]
    const [newUser, setNewUser] = useState([])
    const findUser = (dataUsers?.find(elem => elem?.email === dataInput))

    /* if (dataInput?.includes("@gmail.com")) {
        console.log("entro al includes")
        if (findUser === undefined) {
            console.log("entro al undifinde")
        }
    } */

    const handelSubmit = async () => {
        try {
            const addUser = await fetchApiEventos({
                query: queries.eventUpdate,
                variables: {
                    idEvento: idEvent._id,
                    variable: "compartido_array",
                    value: JSON.stringify(OldAndNewArrySharedUsers)
                }
            });

            const addPermission = await fetchApiEventos({
                query: queries?.eventUpdate,
                variables: {
                    idEvento: idEvent._id,
                    variable: "permisos_array",
                    value: JSON.stringify(permissionArry)
                }
            })
            
            setEvent((old) => {
                old.compartido_array.push(addUser)
                return [...old]
            })
            toast("success", "Evento fue compartido con exito ");
            setOpenModal(!openModal)
        } catch (error) {
            toast("error", "Ha ocurrido un error al compartir el evento");
            console.log(error)
        }
    }

    return (
        <ClickAwayListener onClickAway={() => openModal && setOpenModal(false)} >
            <div className="h-full px-10 py-5">
                <div className="flex  justify-between border-b pb-3 text-[20px]">
                    <div className="cursor-default font-semibold"> Compartir evento</div>
                    <div className="cursor-pointer font-semibold" onClick={() => setOpenModal(!openModal)}>x</div>
                </div>
                <div className="py-5 space-y-2 md:space-y-5 flex flex-col relative  ">
                    <FormAddUserToEvent evento={idEvent} setSelectLength={setSelectLength} setDataInput={setDataInput} setDataUsers={setDataUsers} dataUsers={dataUsers} />
                    {
                        selectLength.length >= 1 ?
                            <PermissionList permissionArry={permissionArry} setPermissionArry={setPermissionArry} /> :
                            <ListUserToEvent evento={idEvent} />
                    }
                    <div className="flex md:flex-row flex-col space-y-1 justify-between items-center">
                        <CopiarLink />
                        <button onClick={handelSubmit} className="bg-primary text-white rounded-lg px-5 py-2 h-10">{selectLength.length >= 1 ? "Guardar" : "Hecho"}</button>
                    </div>
                </div>
            </div>
        </ClickAwayListener>
    )
}