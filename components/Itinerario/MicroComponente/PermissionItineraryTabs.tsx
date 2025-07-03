import { Dispatch, FC, ReactNode, SetStateAction } from "react"
import { useAllowed, useAllowedRouter } from "../../../hooks/useAllowed"
import { AuthContextProvider, EventContextProvider } from "../../../context"
import { useTranslation } from "react-i18next"
import { Itinerary, SelectModeSortType } from "../../../utils/Interfaces"
import { ViewItinerary } from "../../../pages/invitados"
import { PermissionWrapper } from "./PermissionWrapper"
import { PermissionAddButton } from "./PermissionAddButton"
import { PermissionSelectModeView } from "./PermissionSelectModeView"

interface PermissionItineraryTabsProps {
  itinerario: Itinerary
  setItinerario: any
  editTitle: boolean
  setEditTitle: any
  view: ViewItinerary
  setView: any
  handleDeleteItinerario: any
  handleUpdateTitle: any
  title: string
  setTitle: any
  setModalDuplicate: any
  selectTask: string
  setSelectTask: any
  orderAndDirection: SelectModeSortType
  setOrderAndDirection: Dispatch<SetStateAction<SelectModeSortType>>
  onAddService?: () => void
  children?: ReactNode
}

export const PermissionItineraryTabs: FC<PermissionItineraryTabsProps> = ({ 
  itinerario,
  setItinerario,
  editTitle,
  setEditTitle,
  view,
  setView,
  handleDeleteItinerario,
  handleUpdateTitle,
  title,
  setTitle,
  setModalDuplicate,
  selectTask,
  setSelectTask,
  orderAndDirection,
  setOrderAndDirection,
  onAddService,
  children
}) => {
  const { user } = AuthContextProvider()
  const { event } = EventContextProvider()
  const { t } = useTranslation()
  const [isAllowed] = useAllowed()
  const [isAllowedRouter] = useAllowedRouter()

  // Si no tiene acceso a la ruta, mostrar mensaje
  if (!isAllowedRouter()) {
    return (
      <PermissionWrapper>
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="text-gray-500 text-lg mb-2">🔒</div>
            <p className="text-gray-600 font-medium">{t("No tienes permisos para acceder a esta sección")}</p>
          </div>
        </div>
      </PermissionWrapper>
    )
  }

  return (
    <PermissionWrapper>
      <div className="w-full">
        {/* Header con tabs y controles */}
        <div className="flex items-center justify-between mb-4 bg-white rounded-lg p-4 shadow-sm">
          
          {/* Tabs de servicios */}
          <div className="flex items-center space-x-2 flex-1">
            {/* Aquí irían los tabs existentes */}
            {children}
          </div>

          {/* Controles del lado derecho */}
          <div className="flex items-center space-x-2">
            
            {/* Selector de vista */}
            <PermissionSelectModeView 
              view={view} 
              setView={setView}
              className="mr-2"
            />

            {/* Botón para agregar servicio - solo si tiene permisos de edición */}
            {onAddService && (
              <PermissionAddButton
                onClick={onAddService}
                text="Agregar Servicio"
                showText={true}
                className="bg-primary text-white hover:bg-primary/90 transition-colors rounded-lg px-4 py-2 flex items-center space-x-2 text-sm"
                iconClassName="w-4 h-4"
              />
            )}
          </div>
        </div>

        {/* Mensaje informativo para usuarios con solo permisos de vista */}
        {isAllowedRouter() && !isAllowed() && event?.usuario_id !== user?.uid && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex items-center space-x-2">
              <div className="text-blue-600">👀</div>
              <p className="text-blue-700 text-sm">
                {t("Tienes permisos de solo lectura. No puedes editar ni agregar elementos.")}
              </p>
            </div>
          </div>
        )}

      </div>
    </PermissionWrapper>
  )
}