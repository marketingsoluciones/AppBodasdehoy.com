import { FC } from "react"
import { useAllowed, useAllowedRouter } from "../../../hooks/useAllowed"
import { AuthContextProvider, EventContextProvider } from "../../../context"
import { SelectModeView } from "../../Utils/SelectModeView"
import { ViewItinerary } from "../../../pages/invitados"

interface PermissionSelectModeViewProps {
  view: ViewItinerary
  setView: (view: ViewItinerary) => void
  className?: string
}

export const PermissionSelectModeView: FC<PermissionSelectModeViewProps> = ({ 
  view, 
  setView,
  className = ""
}) => {
  const { user } = AuthContextProvider()
  const { event } = EventContextProvider()
  const [isAllowedRouter] = useAllowedRouter()

  // Si no tiene acceso a la ruta, no mostrar SelectModeView
  if (!isAllowedRouter()) {
    return null
  }

  // Si es el dueño del evento, mostrar SelectModeView completo
  if (event?.usuario_id === user?.uid) {
    return (
      <div className={className}>
        <SelectModeView value={view} setValue={setView} />
      </div>
    )
  }

  // Para usuarios con permisos, mostrar SelectModeView
  return (
    <div className={className}>
      <SelectModeView value={view} setValue={setView} />
    </div>
  )
}