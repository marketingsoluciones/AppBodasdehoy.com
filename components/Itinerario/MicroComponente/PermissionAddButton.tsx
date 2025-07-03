import { FC, ReactNode } from "react"
import { useAllowed } from "../../../hooks/useAllowed"
import { AuthContextProvider, EventContextProvider } from "../../../context"
import { useTranslation } from "react-i18next"
import { PlusIcon } from "../../icons"

interface PermissionAddButtonProps {
  onClick: () => void
  children?: ReactNode
  className?: string
  iconClassName?: string
  text?: string
  showText?: boolean
}

export const PermissionAddButton: FC<PermissionAddButtonProps> = ({ 
  onClick,
  children,
  className = "bg-primary text-white hover:bg-primary/90 transition-colors rounded-lg p-2 flex items-center space-x-2",
  iconClassName = "w-5 h-5",
  text = "Agregar",
  showText = false
}) => {
  const { user } = AuthContextProvider()
  const { event } = EventContextProvider()
  const { t } = useTranslation()
  const [isAllowed, ht] = useAllowed()

  // Si es el dueño del evento, siempre puede agregar
  if (event?.usuario_id === user?.uid) {
    return (
      <button className={className} onClick={onClick}>
        {children || (
          <>
            <PlusIcon className={iconClassName} />
            {showText && <span>{t(text)}</span>}
          </>
        )}
      </button>
    )
  }

  // Si tiene permisos de edición, puede agregar
  if (isAllowed()) {
    return (
      <button className={className} onClick={onClick}>
        {children || (
          <>
            <PlusIcon className={iconClassName} />
            {showText && <span>{t(text)}</span>}
          </>
        )}
      </button>
    )
  }

  // Si no tiene permisos, no mostrar el botón
  return null
}