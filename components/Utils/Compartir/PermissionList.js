import { useEffect, useState } from "react";
import { SelectPermissions } from "./SelectPermissions";
import { useTranslation } from 'react-i18next';

export const DataModulos = ["resumen", "invitados", "mesas", "regalos", "presupuesto", "invitaciones", "itinerario", "servicios"]
const permissionsObject = DataModulos.map(elem => { return { title: elem, value: elem !== "resumen" ? "none" : "view" } })

export const PermissionList = ({ permissions, handleChange }) => {
    const { t } = useTranslation();
    const [data, setData] = useState([])

    useEffect(() => {
        if (permissions.length) {
            setData([...permissions])
        } else {
            setData([...permissionsObject])
        }
    }, [])

    return (
        <div className="flex flex-col space-y-1 mb-5 md:mb-0 flex-1">
            <p className="text-primary">{t("permissionslist")}</p>
            <div className={`bg-gray-100 rounded-xl text-[15px] w-full border`}>
                {data.map((item, idx) => {
                    return (
                        <div key={idx}>
                            <SelectPermissions item={item} handleChange={handleChange} />
                        </div>
                    )
                })}
            </div>
        </div>
    )
}