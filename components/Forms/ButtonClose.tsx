import { FC, MouseEventHandler } from "react"

interface propsButtonClose {
    onClick?: MouseEventHandler
}
export const ButtonClose: FC<propsButtonClose> = ({ onClick }) => {
    return (
        <button
            className="text-gray-400 font-display text-xl font-light absolute top-5 right-5 transform scale-x-125 transition hover:rotate-180 duration-1000 hover:text-gray-300"
            onClick={onClick}
        >
            X
        </button>
    )
}

