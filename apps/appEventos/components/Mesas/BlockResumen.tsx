import { FC, useEffect, useState } from "react"
import { EventContextProvider } from "../../context"
import { InvitadosIcon, MesaIcon } from "../icons"
import { guests } from '../../utils/Interfaces';
import { useTranslation } from 'react-i18next';

interface propsBlockResumen {
    InvitadoSentados: guests[]
}
const BlockResumen: FC<propsBlockResumen> = ({ InvitadoSentados }) => {
    const { t } = useTranslation();
    const { event } = EventContextProvider()
    const [totalMesas, setTotalMesas] = useState<number | null>(event?.mesas_array?.length)

    useEffect(() => {
        setTotalMesas(event?.mesas_array?.length)
    }, [event?.mesas_array])

    const Datos = [
        { title: totalMesas, subtitle: t("totaltables") },
        { title: `${InvitadoSentados?.length} de ${event?.invitados_array?.length}`, subtitle: t("seatedguests") },
    ]
    return (
        <div className="w-[calc(100%-16px)] h-[calc(100%-6px)] m-auto flex flex-col gap-2 rounded-lg overflow-y-auto p-1">
            {
                event.planSpace.map((item, idx) => {
                    const totalInvitados = event?.invitados_array?.length || 0
                    const sentados = item?.tables?.length
                        ? item.tables.map((tb) => tb.guests).flat().filter(Boolean).length
                        : 0
                    const pct = totalInvitados ? Math.round((sentados / totalInvitados) * 100) : 0
                    return (
                        <div key={idx} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3">
                            <h2 className="text-gray-700 font-display font-semibold capitalize text-sm mb-2">{t(item?.title)}</h2>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-2 text-[12px] text-gray-500">
                                <span className="flex items-center gap-1">
                                    <MesaIcon className="text-primary w-4 h-4" />
                                    <span className="font-semibold text-gray-700">{item?.tables?.length}</span> {t("table")}
                                </span>
                                <span className="flex items-center gap-1">
                                    <InvitadosIcon className="text-primary w-4 h-4" />
                                    <span className="font-semibold text-gray-700">{sentados}</span> de {totalInvitados} {t("seatedguests")}
                                </span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                            </div>
                        </div>
                    )
                })
            }
        </div >
    )
}

export default BlockResumen
