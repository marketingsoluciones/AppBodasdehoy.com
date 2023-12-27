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
        { title: totalMesas, subtitle: " Total de mesas" },
        { title: `${InvitadoSentados?.length} de ${event?.invitados_array?.length}`, subtitle: " Invitados sentados" },
    ]
    return (
        <div className="bg-primary w-full pb-2 flex flex-col items-center justify-center rounded-lg h-full overflow-y-auto ">
            {
                event.planSpace.map((item, idx) => {
                    return (
                        <div key={idx}>
                            <h2 className="text-tertiary font-display text-medium md:py-1">{item?.title}</h2>
                            <div className="flex space-x-2 items-center justify-center">
                                <div className="flex w-max gap-3  items-center justify-center">
                                    <MesaIcon className="text-white h-3 w-auto" />
                                    <p className="text-white m-1 font-display *font-semibold *text-lg leading-4 text-[12px]">
                                        {item?.tables?.length} {/* <span className="text-xs md:text-sm m- font-light text-right"> */} mesas{/* </span> */}
                                    </p>
                                </div>
                                <div className="flex w-max gap-3  items-center justify-center">
                                    <MesaIcon className="text-white h-3 w-auto" />
                                    {(() => {
                                        if (item.tables.length != 0) {
                                            const invi = item.tables.map((item) => {
                                                return item.guests
                                            })
                                            const inviReduce = invi.flat()
                                            return (
                                                < p key={idx} className="text-white m-1 leading-4 text-[12px]" >
                                                    {inviReduce.length} de {event?.invitados_array?.length}
                                                    {/* <span className="text-xs md:text-sm m- font-light text-right"> */} Invitados sentados{/* </span> */}
                                                </p>
                                            )
                                        } else {
                                            return (
                                                <p className="text-white m-1* font-display leading-4 text-[12px] *w-full ">
                                                    0 de {event?.invitados_array?.length} {/* <span className=" md:text-[10px] text-right"> */} Invitados sentados{/* </span> */}
                                                </p>
                                            )
                                        }
                                    })()}
                                </div>
                            </div>
                        </div>
                    )
                })
            }
        </div >
    )
}

export default BlockResumen
