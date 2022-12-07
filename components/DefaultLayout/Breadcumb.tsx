import Link from 'next/link'
import React from 'react'

import { EventContextProvider, EventsGroupContextProvider } from "../../context";


const Breadcumbs = () => {
    const { event, setEvent } = EventContextProvider()
    const { eventsGroup } = EventsGroupContextProvider()

    /* arry para mostrar la lista de eventos */
    const EventArry: string[] = eventsGroup.reduce((acc, el) => acc.concat(el.nombre), [])


    /* funcion que setea el contexto eventGroups que recibe del select  */
    const handleChange = (e:any) => {
        try {
            setEvent(eventsGroup.find((el: any) => el.nombre === e));
        } catch (error) {
            console.log(error);
        }
    };

    return (
        <>
            <div className="flex gap-2 items-center w-max py-2 font-display text-sm text-gray-500 *cursor-pointer *hover:text-gray-400  transform transition">
                {/* <FlechaIcon />
                <Link href="/resumen-evento" passHref>
                    <p >Volver a resumen del evento: {event?.nombre}</p>
                </Link> */}

                <span>Selecciona tu evento</span>

                <select value={event.nombre} onChange={ (e) => handleChange(e.target.value) } className="w-28 rounded py-1 truncate ">
                    {EventArry.map((item, idx)=>(
                        <option key={idx} value={item} className="text-ellipsis ">{item}</option>
                    ))}
                </select>

            </div>
        </>
    )
}

export default React.memo(Breadcumbs)
