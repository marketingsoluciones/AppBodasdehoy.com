import Link from 'next/link'
import React from 'react'
import { FlechaIcon } from '../icons'

const Breadcumbs = () => {
    return (
        <div className="flex gap-2 items-center w-full py-4 font-display text-sm text-gray-500 cursor-pointer hover:text-gray-400  transform transition">
            <FlechaIcon />
            <Link href="/resumen-evento" passHref>
            <p >Volver a resumen del evento</p>
            </Link>
        </div>
    )
}

export default React.memo(Breadcumbs)
