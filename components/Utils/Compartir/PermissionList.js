import { useEffect, useState } from "react";
import { SelectPermissions } from "./SelectPermissions";
import { useTranslation } from 'react-i18next';

const DataModulos = ["resumen", "invitados", "mesas", "regalos", "presupuesto", "invitaciones", "itinerario"]

export const PermissionList = ({ setPermissions, permissions, handleChange }) => {
    const { t } = useTranslation();
    const [values, setValues] = useState(null)

    useEffect(() => {
        if (!permissions.length && setPermissions) {
            setPermissions(DataModulos.map(elem => { return { title: elem, value: "view" } }))
        }
    }, [permissions])

    useEffect(() => {
        if (values) {
            handleChange(values)
        }
    }, [values])

    return (
        <div className="flex flex-col space-y-1 mb-5 md:mb-0 flex-1">
            <p className="text-primary">{t("permissionslist")}</p>
            <div className={`bg-gray-100 rounded-xl text-[15px] w-full border`}>
                {permissions?.map((item, idx) => {
                    return (
                        <div key={idx}>
                            <SelectPermissions item={item} setValues={setValues} />
                        </div>
                    )
                })}
            </div>
        </div>
    )
}