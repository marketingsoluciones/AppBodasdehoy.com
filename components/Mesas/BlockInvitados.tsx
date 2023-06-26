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
                <div className="bg-white  p-2 md:p-0 md:pb-2 rounded-t-lg relative ">
                    <div className="flex justify-center">
                        <h2 className="font-display text-xl font-semibold text-gray-500">Invitados</h2>

                    </div>
                    <button onClick={() => set(true)} className="w-full focus:outline-none bg-primary px-3 text-white font-display text-medium flex items-center justify-center gap-2 rounded-lg text-sm absolute inset-x-0 mx-auto z-10">
                        <PlusIcon className="text-white w-3 " />
                        <p>Añadir invitado</p>
                    </button>
                </div>
                <div id={"listInvitados"} className='md:h-[calc(95vh-144px-260px-36px)] js-drop pg-3 h-[190px] overflow-auto'>
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
