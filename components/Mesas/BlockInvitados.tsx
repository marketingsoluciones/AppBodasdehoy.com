import { Dispatch, FC, SetStateAction } from 'react';
import { guests } from "../../utils/Interfaces"
import { PlusIcon } from "../icons"
import ListInvitados from "./ListInvitados"

interface propsBlockInvitados {
    InvitadoNoSentado: guests[]
    set: Dispatch<SetStateAction<boolean>>
}

const BlockInvitados: FC<propsBlockInvitados> = ({ InvitadoNoSentado, set }) => {
    return (
        <>
            <div className="w-full shadow-lg relative">
                <div className="bg-white shadow-lg p-2 md:p-6 border-b-4 border-primary rounded-t-lg relative box-border">
                    <div className="flex justify-center">
                        <h2 className="font-display text-xl font-semibold text-gray-500">Invitados</h2>

                    </div>
                    <button onClick={() => set(true)} className="w-full focus:outline-none bg-primary px-3 text-white font-display text-medium flex items-center justify-center gap-2 rounded-lg text-sm absolute inset-x-0 mx-auto md:transform md:translate-y-3/4 z-10">
                        <PlusIcon className="text-white w-3 h-3" />
                        <p>Añadir invitado</p>
                    </button>
                </div>
                <div id={"listInvitados"} className='js-drop pg-3 md:h-max h-[200px] overflow-auto'>
                    <ListInvitados InvitadoNoSentado={InvitadoNoSentado} />
                </div>
            </div>
            <style>{`
            .listInvitados {
                touch-action: none;
                user-select: none;
            }
            `}</style>
        </>
    )
}

export default BlockInvitados
