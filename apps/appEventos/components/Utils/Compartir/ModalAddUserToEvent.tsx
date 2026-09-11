import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { AddUserToEvent } from "./AddUserToEvent"

export const ModalAddUserToEvent = ({ openModal, setOpenModal, event }) => {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!openModal) return null

    const content = <AddUserToEvent openModal={openModal} setOpenModal={setOpenModal} event={event} />

    // Portal al body para evitar que quede atrapado en stacking contexts (z-[45])
    if (mounted && typeof document !== 'undefined') {
        return createPortal(content, document.body)
    }

    return content
}