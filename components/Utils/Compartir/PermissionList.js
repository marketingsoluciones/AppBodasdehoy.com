import { MdOutlineEdit } from "react-icons/md";
import { IoEyeOutline } from "react-icons/io5";
import { MdOutlineCancel } from "react-icons/md";
import ClickAwayListener from "react-click-away-listener";

export const PermissionList = ({ state, set }) => {
    const DataModulos = [
        {
            modulo: "Resumen",
            editar: false,
            ver:true,
            nada:false


        },
        {
            modulo: "Invitados",
            editar: true,
            ver:false,
            nada:false

        },
        {
            modulo: "Mesas",
            editar: true,
            ver:true,
            nada:false

        },
        {
            modulo: "Regalos",
            editar: false,
            ver:true,
            nada:false

        },
        {
            modulo: "Presupuesto",
            editar: false,
            ver:false,
            nada:true

        },
        {
            modulo: "Invitaciones",
            editar: false,
            ver:true,
            nada:false

        },
    ]
    return (
        <ClickAwayListener onClickAway={() => state && set(false)}>
            <div className={`${state ? " absolute -bottom-36 right-10 z-50 " : "hidden"}  bg-gray-100  rounded-lg p-4 text-[15px] w-52 space-y-1`}>
                {DataModulos.map((item, idx) => {
                    return (
                        <div key={idx} className="flex  items-center space-x-2 justify-between">
                            <div className="cursor-default">
                                {item.modulo}
                            </div>
                            <div className="flex items-center space-x-2">
                            <div className="cursor-pointer">
                                     <MdOutlineCancel  className={`${item.nada?"text-primary":""}`} />
                                </div>
                                <div className="cursor-pointer">
                                     <IoEyeOutline className={`${item.ver?"text-primary":""}`} />
                                </div>
                                <div className={`${item.estado?"text-primary":""}cursor-pointer`}>
                                    <MdOutlineEdit className={`${item.editar?"text-primary":""}`} /> 

                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </ClickAwayListener>
    )
}