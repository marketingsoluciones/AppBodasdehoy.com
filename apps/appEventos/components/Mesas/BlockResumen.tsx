import { FC } from "react"
import { EventContextProvider } from "../../context"
import { guests } from '../../utils/Interfaces';
import { useTranslation } from 'react-i18next';

// Rediseño fiel al prototipo (MESAS.dc.html): tarjeta de resumen (% ocupado + 3 stats)
// + lista "Por espacio" con barra de progreso. Conserva la derivación de datos real
// (sentados por planSpace a partir de tables[].guests).
interface propsBlockResumen {
    InvitadoSentados: guests[]
}
const BlockResumen: FC<propsBlockResumen> = ({ InvitadoSentados }) => {
    const { t } = useTranslation();
    const { event, planSpaceSelect } = EventContextProvider()

    const totalInvitados = event?.invitados_array?.length || 0
    const perSpace = (event?.planSpace || []).map((ps) => {
        const sentados = ps?.tables?.length
            ? ps.tables.map((tb) => tb.guests).flat().filter(Boolean).length
            : 0
        return { _id: ps?._id, title: ps?.title, sentados, pct: totalInvitados ? Math.round((sentados / totalInvitados) * 100) : 0 }
    })
    const totalSentados = perSpace.reduce((a, p) => a + p.sentados, 0)
    const totalMesas = event?.mesas_array?.length || 0
    const overallPct = totalInvitados ? Math.round((totalSentados / totalInvitados) * 100) : 0

    const stats = [
        { n: totalMesas, l: t("tables") || "Mesas" },
        { n: totalInvitados, l: t("guests") || "Invitados" },
        { n: totalSentados, l: t("seated") || "Sentados" },
    ]

    return (
        <div className="w-full h-full overflow-auto flex flex-col gap-[11px] p-1">
            <div className="rounded-[13px] p-3.5 bg-white border border-[#f0f0f2] shadow-[0_3px_10px_rgba(0,0,0,.04)]">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-bold leading-none text-[#EF5B94]">{overallPct}%</span>
                        <span className="text-[10.5px] font-semibold text-[#8a8a90]">{t("occupied") || "ocupado"}</span>
                    </div>
                    <span className="text-[9px] font-bold tracking-wider uppercase text-[#b3b3ba]">{t("eventsummary") || "Resumen del evento"}</span>
                </div>
                <div className="flex gap-2">
                    {stats.map((s, i) => (
                        <div key={i} className="flex-1 bg-[#faf9fb] border border-[#f0f0f2] rounded-[9px] px-2.5 py-[7px]">
                            <div className="text-[15px] font-bold text-[#3A3A42]">{s.n}</div>
                            <div className="text-[9.5px] font-medium text-[#a0a0a8]">{s.l}</div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="text-[10px] font-bold tracking-wider uppercase text-[#b3b3ba]">{t("perspace") || "Por espacio"}</div>
            {perSpace.map((r, idx) => {
                const active = planSpaceSelect === r._id
                return (
                    <div key={idx} className={`rounded-[11px] px-3 py-[11px] border ${active ? "bg-[#FCF2F6] border-[#f7c2da]" : "bg-white border-[#f0f0f2]"}`}>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[#EF5B94]" />
                                <span className="text-[12.5px] font-semibold text-[#3A3A42] capitalize">{t(r.title)}</span>
                            </div>
                            <div className="text-[11px] font-semibold text-[#EF5B94]">{r.sentados} · {r.pct}%</div>
                        </div>
                        <div className="h-[7px] rounded-[7px] bg-[#ececed] overflow-hidden">
                            <div className="h-full rounded-[7px] bg-[#EF5B94] transition-all duration-300" style={{ width: `${r.pct}%` }} />
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

export default BlockResumen
