import ClickAwayListener from "react-click-away-listener"
import { InputUpdateInBlur } from "./InputUpdateInBlur"
import { FC, useState } from "react"
import { useAllowed } from "../../../hooks/useAllowed"
import { t } from "i18next"
import { FaPencilAlt } from "react-icons/fa"

interface props {
    stateEdit: any, /* Estado base del componente */
    setStateEdit: any, /* Estado que se modifica */
    values: any, /* Valor que recibe el componente */
    handleChange: any, /* Funcion para cambiar el contenido del input */
    handleBlur: any, /* Funcion que realiza el fetch */
    keyDown: any, /* Funcion que hace que el input se cierre con una tecla */
    hover?: boolean /* Variable que define si quieres activar el hover o no del componente */
    name: string /* Nombre que recibe el input como identificador */
    type: string /* tipo de input */
}

export const LabelWithEdit: FC<props> = ({ stateEdit, setStateEdit, values, handleChange, handleBlur, keyDown, hover = false, name, type  }) => {
    const [hovered, setHovered] = useState(false)
    const [isAllowed, ht] = useAllowed()

    return (
        <div>
            {
                stateEdit ?
                    <ClickAwayListener onClickAway={() => setStateEdit(false)}>
                        < InputUpdateInBlur name={name} value={values} onChange={handleChange} onBlur={handleBlur} keyDown={keyDown} type={type} />
                    </ClickAwayListener >
                    : <p
                        onMouseEnter={() => setHovered(true)}
                        onMouseLeave={() => setHovered(null)}
                        onClick={() => isAllowed() ? setStateEdit(true):ht()}
                        className="font-display font-semibold text-xs text-gray-500 flex items-center justify-center gap-1 cursor-pointer capitalize relative"
                    >
                        {values}
                        {hover && hovered === true && <FaPencilAlt className="text-gray-400 ml-1 absolute right-16" />}
                    </p>
            }
        </div>
    )
}