import { FC, useEffect, useState } from "react"
import { EventContextProvider } from "../../context"
import { MesaIcon } from "../icons"
import { guests } from '../../utils/Interfaces';

interface propsBlockResumen {
    InvitadoSentados: guests[]
}
const BlockResumen: FC<propsBlockResumen> = ({ InvitadoSentados }) => {
    const { event } = EventContextProvider()
    const [totalMesas, setTotalMesas] = useState<number | null>(event?.mesas_array?.length)

    useEffect(() => {
        setTotalMesas(event?.mesas_array?.length)
    }, [event?.mesas_array])


    const Datos = [
        { title: totalMesas, subtitle: "Total de mesas" },
        { title: `${InvitadoSentados?.length} de ${event?.invitados_array?.length}`, subtitle: "Invitados sentados" },
    ]
    return (
        <div className="bg-primary w-full px-6 pb-4 rounded-lg">
            <h2 className="text-tertiary font-display text-medium text-lg py-1">Resumen</h2>
            <div className="flex md:flex-col md:gap-8">
                {Datos.map((item, idx) => (
                    <div key={idx} className="flex w-max gap-3 items-center justify-center">
                        <MesaIcon className="text-white h-5 w-auto" />
                        <p className="text-white font-display font-semibold text-lg leading-4">{item.title}  <span className="text-xs font-light text-right">{item.subtitle}</span></p>
                    </div>

                ))}
            </div>
        </div>
    )
}

export default BlockResumen
