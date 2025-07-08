import { FC } from "react"
import { useAllowed, useAllowedRouter } from "../../../hooks/useAllowed"
import { AuthContextProvider, EventContextProvider } from "../../../context"
import { useTranslation } from "react-i18next"
import { useRouter } from "next/router"
import { MdOutlineEdit, MdSecurity } from "react-icons/md"
import { IoEyeOutline } from "react-icons/io5"
import { FaCrown } from "react-icons/fa"

export const PermissionIndicator: FC = () => {
  const { user } = AuthContextProvider()
  const { event } = EventContextProvider()
  const { t } = useTranslation()
  const router = useRouter()
  const [isAllowed] = useAllowed()
  const [isAllowedRouter] = useAllowedRouter()

  // Si es el dueño del evento
  if (event?.usuario_id === user?.uid) {
    return (
      <div className="flex items-center space-x-1 px-2 py-1 bg-yellow-50 border border-yellow-200 rounded-md">
        <FaCrown className="w-3 h-3 text-yellow-600" />
        <span className="text-xs text-yellow-700 font-medium">{t("Propietario")}</span>
      </div>
    )
  }

  // Obtener permisos para la ruta actual
  const getCurrentPath = () => {
    let path = router.asPath.split("/")[1].split("-")[0]
    if (path === "lista") path = "regalos"
    return path
  }

  const currentPath = getCurrentPath()
  const hasRouterAccess = isAllowedRouter()
  const hasEditAccess = isAllowed()

  // Si no tiene acceso, no mostrar indicador
  if (!hasRouterAccess) {
    return (
      <div className="flex items-center space-x-1 px-2 py-1 bg-red-50 border border-red-200 rounded-md">
        <MdSecurity className="w-3 h-3 text-red-600" />
        <span className="text-xs text-red-700 font-medium">{t("Sin acceso")}</span>
      </div>
    )
  }

  // Si tiene permisos de edición
  if (hasEditAccess) {
    return (
      <div className="flex items-center space-x-1 px-2 py-1 bg-green-50 border border-green-200 rounded-md">
        <MdOutlineEdit className="w-3 h-3 text-green-600" />
        <span className="text-xs text-green-700 font-medium">{t("Ver y editar")}</span>
      </div>
    )
  }

  // Solo permisos de vista
  return (
    <div className="flex items-center space-x-1 px-2 py-1 bg-blue-50 border border-blue-200 rounded-md">
      <IoEyeOutline className="w-3 h-3 text-blue-600" />
      <span className="text-xs text-blue-700 font-medium">{t("Solo ver")}</span>
    </div>
  )
}