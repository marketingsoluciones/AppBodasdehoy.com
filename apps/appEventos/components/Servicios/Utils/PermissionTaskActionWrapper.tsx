import { FC, ReactNode, isValidElement, cloneElement } from "react"
import { useAllowed, useAllowedRouter } from "../../../hooks/useAllowed"
import { AuthContextProvider, EventContextProvider } from "../../../context"
import { useTranslation } from "react-i18next"
import { Task, OptionsSelect } from "../../../utils/Interfaces"

interface PermissionTaskActionWrapperProps {
  children: ReactNode
  task?: Task
  isTaskVisible?: boolean
  optionsItineraryButtonBox?: OptionsSelect[]
}

export const PermissionTaskActionWrapper: FC<PermissionTaskActionWrapperProps> = ({
  children,
  task,
  isTaskVisible,
  optionsItineraryButtonBox = [],
}) => {
  const { user } = AuthContextProvider()
  const { event } = EventContextProvider()
  const { t } = useTranslation()
  const [isAllowed, ht] = useAllowed()
  const [isAllowedRouter] = useAllowedRouter()

  // Si no hay task, no renderizar nada (evita el error)
  if (!task) {
    return null
  }

  // Si no tiene acceso a la ruta, mostrar mensaje
  if (!isAllowedRouter()) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-gray-500 text-lg mb-2">🔒</div>
          <p className="text-gray-600 font-medium">{t("No tienes permisos para acceder a esta sección")}</p>
        </div>
      </div>
    )
  }

  // Para tareas específicas, verificar si puede verlas cuando no es dueño ni tiene permisos de edición
  if (task && isTaskVisible !== undefined && !isTaskVisible && event?.usuario_id !== user?.uid && !isAllowed()) {
    return null
  }

  // Si es el dueño del evento, mostrar todo con permisos completos
  if (event?.usuario_id === user?.uid) {
    return <>{children}</>
  }

  // Si tiene permisos de edición, mostrar todo
  if (isAllowed()) {
    return <>{children}</>
  }

  // Si solo tiene permisos de vista, modificar las opciones disponibles
  const hasViewAccess = isAllowedRouter() && !isAllowed()

  if (hasViewAccess) {
    // Filtrar opciones para usuarios con solo permisos de vista
    const filteredOptions = optionsItineraryButtonBox.filter(option => {
      // Solo permitir opciones de vista, no de edición
      return option.value === 'view' || option.value === 'share' || option.title === 'ver'
    }).map(option => ({
      ...option,
      onClick: (values: Task, itinerario: any) => {
        // Interceptar clicks de edición para mostrar mensaje
        if (option.value === 'edit' || option.title === 'editar') {
          ht()
          return
        }
        // Permitir acciones de vista
        option.onClick?.(values, itinerario)
      }
    }))

    // Clonar children con opciones filtradas si corresponde
    if (isValidElement(children)) {
      return cloneElement(children as React.ReactElement<any>, {
        ...(children.props as any),
        optionsItineraryButtonBox: filteredOptions,
        // Deshabilitar setShowEditTask para usuarios de solo vista
        setShowEditTask: () => ht(),
        // Otros props que podrían necesitar modificación
        disabled: true,
        readOnly: true
      })
    }

    return <>{children}</>
  }

  // Si no tiene permisos, no mostrar nada
  return null
}