import Link from 'next/link'
import React from 'react'
import { FlechaIcon } from '../icons'
import {EventContextProvider} from "../../context";

const Breadcumbs = () => {
    const {event} = EventContextProvider()
    return (
        <div className="flex gap-2 items-center w-full py-2 font-display text-sm text-gray-500 cursor-pointer hover:text-gray-400  transform transition">
            <FlechaIcon />
            <Link href="/resumen-evento" passHref>
            <p >Volver a resumen del evento: {event.nombre}</p>
            </Link>
        </div>
    )
}

export default React.memo(Breadcumbs)
