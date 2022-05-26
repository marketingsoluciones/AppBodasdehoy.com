import { Dispatch, FC, SetStateAction } from 'react';
import { guests } from "../../utils/Interfaces"
import { PlusIcon } from "../icons"
import ListInvitados from "./ListInvitados"

interface propsBlockInvitados {
    InvitadoNoSentado : guests[]
    set: Dispatch<SetStateAction<boolean>>
    AddInvitado: CallableFunction
}

const BlockInvitados : FC <propsBlockInvitados> = ({ InvitadoNoSentado, set, AddInvitado }) => {
    return (
        <div>
        <div className="w-full bg-white shadow-lg p-6 border-b-4 border-primary rounded-t-lg relative box-border">
            <div className="flex justify-center">
            <h2 className="font-display text-xl font-semibold text-gray-500">Invitados</h2>

            </div>
            <button onClick={() => set(true)} className="focus:outline-none bg-primary px-3 text-white font-display text-medium flex items-center justify-center gap-2 rounded-lg text-sm absolute inset-x-0 mx-auto transform translate-y-3/4 z-10">
                <PlusIcon className="text-white w-3 h-3" />
                <p>Añadir invitado</p>
            </button>
        </div>
        <ListInvitados AddInvitado={AddInvitado} InvitadoNoSentado={InvitadoNoSentado}/>        
        </div>
    )
}

export default BlockInvitados
