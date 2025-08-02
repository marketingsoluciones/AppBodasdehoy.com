import { FC, ReactNode } from "react"
import { useAllowed, useAllowedRouter } from "../../../hooks/useAllowed"
import { AuthContextProvider, EventContextProvider } from "../../../context"
import { useTranslation } from "react-i18next"

interface PermissionWrapperProps {
  children: ReactNode
  fallback?: ReactNode
  requireEdit?: boolean
  showNoPermissionMessage?: boolean
  customMessage?: string
}

export const PermissionWrapper: FC<PermissionWrapperProps> = ({
  children,
  fallback = null,
  requireEdit = false,
  showNoPermissionMessage = true,
  customMessage = ""
}) => {
  const { user } = AuthContextProvider()
  const { event } = EventContextProvider()
  const { t } = useTranslation()
  const [isAllowed] = useAllowed()
  const [isAllowedRouter] = useAllowedRouter()

  // Si es el dueño del evento, siempre tiene permisos
  if (event?.usuario_id === user?.uid) {
    return <>{children}</>
  }

  // Verificar permisos según la ruta actual
  const hasRouterAccess = isAllowedRouter()
  const hasEditAccess = isAllowed()

  // Si no tiene acceso a la ruta, no mostrar nada
  if (!hasRouterAccess) {
    if (showNoPermissionMessage) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="text-gray-500 text-lg mb-2">🔒</div>
            <p className="text-gray-600 font-medium">{customMessage || t("No tienes permisos para acceder a esta sección")}</p>
          </div>
        </div>
      )
    }
    return <>{fallback}</>
  }

  // Si requiere edición pero solo tiene permisos de vista
  if (requireEdit && !hasEditAccess) {
    if (showNoPermissionMessage) {
      return (
        <div className="flex items-center justify-center p-4">
          <div className="text-center">
            <div className="text-gray-500 text-lg mb-2">👀</div>
            <p className="text-gray-600 font-medium">{customMessage || t("No tienes permisos para editar")}</p>
          </div>
        </div>
      )
    }
    return <>{fallback}</>
  }
  return <>{children}</>
}