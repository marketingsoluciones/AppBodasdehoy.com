import { Dispatch, FC, SetStateAction } from 'react';
import { guests } from "../../utils/Interfaces"
import { PlusIcon } from "../icons"
import ListInvitados from "./ListInvitados"
import { useAllowed } from '../../hooks/useAllowed';
import { AuthContextProvider, EventContextProvider } from '../../context';
import { useTranslation } from 'react-i18next';

interface propsBlockInvitados {
    set: Dispatch<SetStateAction<boolean>>
    setEditInv: any
    editInv: any
    setSelected: any
}

const BlockInvitados: FC<propsBlockInvitados> = ({ set, setEditInv, editInv, setSelected }) => {
    const { t } = useTranslation();
    const [isAllowed, ht] = useAllowed()
    const { event } = EventContextProvider()
    const { actionModals, setActionModals } = AuthContextProvider()

    const ConditionalAction = () => {
        if (event.invitados_array.length >= 5) {
            setActionModals(!actionModals)
        } else {
            set(true)
        }
    }

    return (
        <>
            <div className="w-full h-[100%] shadow-lg relative">
                <div className="hidden md:block bg-white pb-2 rounded-t-lg relative ">
                    <div className="flex justify-center">
                        <h2 className="font-display text-xl font-semibold text-gray-500">{t("guest")}</h2>
                    </div>
                    <button onClick={() => !isAllowed() ? ht() : ConditionalAction()} className="w-full focus:outline-none bg-primary px-3 text-white font-display text-medium flex items-center justify-center gap-2 rounded-lg text-sm absolute inset-x-0 mx-auto z-10">
                        <PlusIcon className="text-white w-3 " />
                        <p>{t("addguests")}</p>
                    </button>
                </div>
                <div id={"listInvitados"} className='bg-white md:translate-y-3 w-full h-full md:h-[calc(100%-48px)] js-dropGuests  overflow-auto'>
                    <ListInvitados setEditInv={setEditInv} editInv={editInv} setSelected={setSelected} />
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
