import { FC, ReactNode } from "react"
import { useAllowed, useAllowedRouter } from "../../../hooks/useAllowed"
import { AuthContextProvider, EventContextProvider } from "../../../context"
import { useTranslation } from "react-i18next"
import { usePathname } from "next/navigation"
import { MdOutlineEdit, MdSecurity } from "react-icons/md"
import { IoEyeOutline } from "react-icons/io5"
import { FaCrown } from "react-icons/fa"

/**
 * Badge de rol del usuario en el evento — estilo píldora del diseño
 * "Barra holder nueva" (Propietario dorado). Los 4 estados (Propietario /
 * Ver y editar / Solo ver / Sin acceso) comparten la misma geometría.
 */
const Pill: FC<{ bg: string; color: string; icon: ReactNode; label: string }> = ({ bg, color, icon, label }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: bg, color, font: "600 12px Poppins", padding: "6px 13px", borderRadius: 20, whiteSpace: "nowrap" }}>
    {icon}{label}
  </span>
)

export const PermissionIndicator: FC = () => {
  const { user } = AuthContextProvider()
  const { event } = EventContextProvider()
  const { t } = useTranslation()
  const pathname = usePathname()
  const [isAllowed] = useAllowed()
  const [isAllowedRouter] = useAllowedRouter()

  // Dueño del evento
  if (event?.usuario_id === user?.uid) {
    return <Pill bg="#FEF6D8" color="#B8860B" icon={<FaCrown style={{ width: 13, height: 13 }} />} label={t("Propietario")} />
  }

  // Permisos para la ruta actual
  const getCurrentPath = () => {
    let path = pathname.split("/")[1].split("-")[0]
    if (path === "lista") path = "regalos"
    return path
  }
  getCurrentPath()
  const hasRouterAccess = isAllowedRouter()
  const hasEditAccess = isAllowed()

  if (!hasRouterAccess) {
    return <Pill bg="#FBE9E9" color="#D9534F" icon={<MdSecurity style={{ width: 13, height: 13 }} />} label={t("Sin acceso")} />
  }
  if (hasEditAccess) {
    return <Pill bg="#E4F5EE" color="#2FB37E" icon={<MdOutlineEdit style={{ width: 13, height: 13 }} />} label={t("Ver y editar")} />
  }
  return <Pill bg="#EAF1F8" color="#5B7DA6" icon={<IoEyeOutline style={{ width: 13, height: 13 }} />} label={t("Solo ver")} />
}
