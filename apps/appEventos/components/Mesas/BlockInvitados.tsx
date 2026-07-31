import { Dispatch, FC, SetStateAction, useState } from 'react';
import { PlusIcon } from "../icons"
import ListInvitados from "./ListInvitados"
import { useAllowed } from '../../hooks/useAllowed';
import { AuthContextProvider, EventContextProvider } from '../../context';
import { useTranslation } from 'react-i18next';
import { HiChevronDown } from 'react-icons/hi';

interface propsBlockInvitados {
    set: Dispatch<SetStateAction<boolean>>
    setEditInv: any
    editInv: any
    setSelected: any
}

export type GuestFilter = 'todos' | 'porsentar' | 'sentados'

// Rediseño fiel al prototipo (MESAS.dc.html): cabecera colapsable + filtro segmentado
// (Todos/Por sentar/Sentados) + botón "Añadir invitados" en pastilla punteada.
// IMPORTANTE: el contenedor de la lista mantiene `js-dropGuests` (dropzone para devolver
// invitados) e id `listInvitados`. Las filas arrastrables NO se desmontan al filtrar
// (ListInvitados las oculta por CSS) para no romper interact.js.
const BlockInvitados: FC<propsBlockInvitados> = ({ set, setEditInv, editInv, setSelected }) => {
    const { t } = useTranslation();
    const [isAllowed, ht] = useAllowed()
    const { event, filterGuests } = EventContextProvider()
    const { actionModals, setActionModals } = AuthContextProvider()
    const [open, setOpen] = useState(true)
    const [filter, setFilter] = useState<GuestFilter>('todos')

    const sentadosCount = filterGuests?.sentados?.length ?? 0

    const ConditionalAction = () => {
        if (event.invitados_array.length >= 5) {
            setActionModals(!actionModals)
        } else {
            set(true)
        }
    }

    const tabs: { key: GuestFilter, label: string }[] = [
        { key: 'todos', label: t('all') },
        { key: 'porsentar', label: t('tobeseated') },
        { key: 'sentados', label: t('seated') },
    ]

    return (
        <div className={`w-full h-full flex flex-col bg-white relative ${open ? '' : 'justify-end'}`}>
            <div onClick={() => setOpen(!open)} className="flex items-center justify-between px-3 pt-2 pb-1 cursor-pointer select-none flex-none">
                <div className="flex items-center gap-1.5">
                    <HiChevronDown className={`w-4 h-4 text-[#6b6b72] transition-transform ${open ? '' : '-rotate-90'}`} />
                    <span className="text-[12px] font-bold text-[#3A3A42]">{t('Invitados')}</span>
                </div>
                <span className="text-[10px] font-semibold text-[#a0a0a8]">{t('seated')} <span className="text-[#EF5B94]">{sentadosCount}</span></span>
            </div>

            {open && (
                <div className="mx-3 mb-2 flex bg-[#f2f2f4] rounded-[9px] p-[3px] gap-0.5 flex-none">
                    {tabs.map(tb => {
                        const active = filter === tb.key
                        return (
                            <button
                                key={tb.key}
                                type="button"
                                onClick={() => setFilter(tb.key)}
                                className={`flex-1 text-center py-1.5 rounded-[7px] text-[10.5px] font-semibold capitalize transition ${active ? 'bg-white text-[#3A3A42] shadow-sm' : 'text-[#8a8a90]'}`}
                            >
                                {tb.label}
                            </button>
                        )
                    })}
                </div>
            )}

            <div id={"listInvitados"} className={`js-dropGuests flex-1 overflow-auto px-1 ${open ? '' : 'hidden'}`}>
                <ListInvitados filter={filter} setEditInv={setEditInv} editInv={editInv} setSelected={setSelected} />
            </div>

            {open && (
                <div className="p-2 flex-none">
                    <button
                        onClick={() => !isAllowed() ? ht() : ConditionalAction()}
                        className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-[11px] bg-white border-[1.5px] border-dashed border-[#f0aecb] text-[#EF5B94] text-[12.5px] font-semibold focus:outline-none"
                    >
                        <PlusIcon className="text-[#EF5B94] w-3" />
                        {t("addguests")}
                    </button>
                </div>
            )}

            <style>{`
            .listInvitados {
                touch-action: none;
                user-select: none;
            }
            `}</style>
        </div>
    )
}

export default BlockInvitados
