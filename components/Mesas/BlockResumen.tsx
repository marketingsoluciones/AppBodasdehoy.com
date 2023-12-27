import { FC, useEffect, useState } from "react"
import { EventContextProvider } from "../../context"
import { InvitadosIcon, MesaIcon } from "../icons"
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
        <div className="bg-primary w-[calc(100%-16px)] h-[calc(100%-6px)] m-auto flex flex-col rounded-lg overflow-y-auto pt-2">
            {
                event.planSpace.map((item, idx) => {
                    return (
                        <div key={idx} className="md:mb-3 px-2">
                            <h2 className="text-tertiary font-display text-medium md:text-lg capitalize -mb-1">{item?.title}</h2>
                            <div className="flex flex-wrap items-center">
                                <div className="flex w-28 items-center ml-2">
                                    <MesaIcon className="text-white w-6 h-6" />
                                    <p className="text-white m-1 font-display *font-semibold *text-lg leading-4 text-[12px]">
                                        {item?.tables?.length} {/* <span className="text-xs md:text-sm m- font-light text-right"> */} mesas{/* </span> */}
                                    </p>
                                </div>
                                <div className="flex w-max items-center">
                                    <InvitadosIcon className="text-white w-6 h-6 ml-2 mr-1" />
                                    {(() => {
                                        if (item.tables.length != 0) {
                                            const invi = item.tables.map((item) => {
                                                return item.guests
                                            })
                                            const inviReduce = invi.flat()
                                            return (
                                                < p key={idx} className="bg-red text-white m-1 leading-4 text-[12px]" >
                                                    {inviReduce.length} de {event?.invitados_array?.length}
                                                    {/* <span className="text-xs md:text-sm m- font-light text-right"> */} Invitados sentados{/* </span> */}
                                                </p>
                                            )
                                        } else {
                                            return (
                                                <p className="text-white font-display leading-4 text-[12px] ">
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
