import { Dispatch, FC, SetStateAction } from 'react';
import { guests } from "../../utils/Interfaces"
import { PlusIcon } from "../icons"
import ListInvitados from "./ListInvitados"

interface propsBlockInvitados {
    InvitadoNoSentado: guests[]
    set: Dispatch<SetStateAction<boolean>>
    setEditInv: any
    editInv: any
    setSelected: any
}

const BlockInvitados: FC<propsBlockInvitados> = ({ InvitadoNoSentado, set, setEditInv, editInv, setSelected }) => {
    return (
        <>
            <div className="w-full h-[100%] shadow-lg relative">
                <div className="bg-white pb-2 rounded-t-lg relative ">
                    <div className="flex justify-center">
                        <h2 className="font-display text-xl font-semibold text-gray-500">Invitados</h2>

                    </div>
                    <button onClick={() => set(true)} className="w-full focus:outline-none bg-primary px-3 text-white font-display text-medium flex items-center justify-center gap-2 rounded-lg text-sm absolute inset-x-0 mx-auto z-10">
                        <PlusIcon className="text-white w-3 " />
                        <p>Añadir invitado</p>
                    </button>
                </div>
                <div id={"listInvitados"} className='bg-white translate-y-3 h-[calc(100%-48px)] js-drop  overflow-auto'>
                    <ListInvitados InvitadoNoSentado={InvitadoNoSentado} setEditInv={setEditInv} editInv={editInv} setSelected={setSelected} />
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
