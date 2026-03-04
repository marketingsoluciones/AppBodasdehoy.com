import { useEffect } from "react"
import { AddUserToEvent } from "./AddUserToEvent"

export const ModalAddUserToEvent = ({ openModal, setOpenModal, event }) => {

    useEffect(() => {
        const rootSection = document.getElementById("rootsection")
        const child = document.getElementById("child")
        if (rootSection) {
            rootSection?.appendChild(child)
        }
    }, [])

    return (
        <div id="child" className="let-0 top-0">
            {openModal &&
                <AddUserToEvent openModal={openModal} setOpenModal={setOpenModal} event={event} />
            }
        </div>
    )
}