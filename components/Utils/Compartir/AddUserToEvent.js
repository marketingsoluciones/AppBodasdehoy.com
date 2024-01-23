import ClickAwayListener from "react-click-away-listener"
import { FormAddUserToEvent } from "../../Forms/FormAddUserToEvent"
import { CopiarLink } from "./CopiarLink"
import { ListUserToEvent } from "./ListUserToEvent"

export const AddUserToEvent = ({ openModal, setOpenModal }) => {
    return (
        <ClickAwayListener onClickAway={() => openModal && setOpenModal(false)} >

            <div className="h-full px-10 py-5">
                <div className="flex  justify-between border-b pb-3 text-[20px]">
                    <div className="cursor-default font-semibold"> Compartir evento</div>
                    <div className="cursor-pointer font-semibold" onClick={() => setOpenModal(!openModal)}>x</div>
                </div>
                <div className="py-5 space-y-2 md:space-y-5 flex flex-col  ">
                    <FormAddUserToEvent />
                    <ListUserToEvent />
                    <div className="flex md:flex-row flex-col space-y-1 justify-between items-center">
                        <CopiarLink />
                        <button onClick={() => setOpenModal(!openModal)} className="bg-primary text-white rounded-lg px-5 py-2 h-10">Guardar</button>
                    </div>
                </div>
            </div>
        </ClickAwayListener>
    )
}