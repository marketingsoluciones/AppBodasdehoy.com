import { MdOutlineEdit } from "react-icons/md";
import { IoEyeOutline } from "react-icons/io5";
import { MdOutlineCancel } from "react-icons/md";
import { useEffect, useState } from "react";

export const PermissionList = ({ setPermissionArry, permissionArry }) => {
    const [permission, setPermission] = useState(null)
    //const [focusPermission, setFocusPermission] = useState("nada")

    useEffect(() => {
        if (permission !== null) {
            setPermissionArry((old) => {
                const f1 = old?.findIndex(elem => elem.modulo == permission.modulo)
                const f2 = old?.findIndex(elem => elem.estado == permission.estado)

                if (f1 < 0) {
                    old?.push(permission)
                    return [...old]


                }
                if (f1 > -1) {
                    old?.splice(f1, 1)
                    return [...old]
                }
            })
        }
    }, [permission])

    const focusPermission = permissionArry.map((item) => {
        return { estado: item.estado }
    })


    const DataModulos = [
        {
            modulo: "Resumen",
        },
        {
            modulo: "Invitados",
        },
        {
            modulo: "Mesas",
        },
        {
            modulo: "Regalos",
        },
        {
            modulo: "Presupuesto",
        },
        {
            modulo: "Invitaciones",
        },
    ]

    return (
        <div className={`  bg-gray-100  rounded-lg p-4 text-[15px] w-full border space-y-[5.3px]`}>
            <p className="text-gray-500 ">Lista de Permisos</p>
            {DataModulos.map((item, idx) => {
                return (
                    <div key={idx} className="flex  items-center space-x-2 justify-between">
                        <div className="cursor-default">
                            {item.modulo}
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="cursor-pointer" onClick={() => setPermission({ modulo: item.modulo, estado: "nada" })}>
                                <MdOutlineCancel className={` ${permission?.estado == "nada" ? "text-primary" : ""}  hover:text-primary`} />
                            </div>
                            <div className="cursor-pointer " onClick={() => setPermission({ modulo: item.modulo, estado: "ver" })}>
                                <IoEyeOutline className={` ${permission?.estado == "ver" ? "text-primary" : ""}  hover:text-primary`} />
                            </div>
                            <div className="cursor-pointer" onClick={() => setPermission({ modulo: item.modulo, estado: "editar" })}>
                                <MdOutlineEdit className={` ${permission?.estado == "editar" ? "text-primary" : ""}  hover:text-primary`} />

                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}