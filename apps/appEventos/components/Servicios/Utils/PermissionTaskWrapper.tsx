import React, { FC, ReactNode, cloneElement, isValidElement, ReactElement } from "react"
import { useAllowed, useAllowedRouter, useAllowedViewer } from "../../../hooks/useAllowed"
import { AuthContextProvider, EventContextProvider } from "../../../context"
import { useTranslation } from "react-i18next"

interface PermissionTaskWrapperProps {
  children: ReactNode
  task?: any
  isTaskVisible?: boolean
  onEditAttempt?: () => void
  editableSelectors?: string[] // selectores CSS para identificar elementos editables
}

export const PermissionTaskWrapper: FC<PermissionTaskWrapperProps> = ({ 
  children,
  task,
  isTaskVisible = true,
  onEditAttempt,
  editableSelectors = ['button', '[onClick]', 'input', 'textarea', '[contentEditable]']
}) => {
  const { user } = AuthContextProvider()
  const { event } = EventContextProvider()
  const { t } = useTranslation()
  const [isAllowed, ht] = useAllowed()
  const [isAllowedRouter] = useAllowedRouter()

  // Si no tiene acceso a la ruta, no mostrar nada
  if (!isAllowedRouter()) {
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

  // Si solo tiene permisos de vista
  const hasViewAccess = isAllowedRouter() && !isAllowed()
  
  if (hasViewAccess) {
    // Para tareas específicas, verificar si puede verlas
    if (task && !isTaskVisible) {
      return null
    }

    // Buscar elementos editables y deshabilitarlos
const disableEditableElements = (element: any): any => {
  if (!isValidElement(element)) {
    return element
  }

  const props = element.props as Record<string, any> || {}

  // Verificar si es un elemento editable
  const isEditableElement =
    element.type === 'button' ||
    element.type === 'input' ||
    element.type === 'textarea' ||
    props.onClick ||
    props.contentEditable ||
    props.type === 'text' ||
    (typeof props.className === 'string' &&
      (props.className.includes('cursor-pointer') ||
        props.className.includes('hover:') ||
        props.className.includes('click')))

  if (isEditableElement) {
    return cloneElement(
      element as ReactElement<any>,
      {
        ...props,
        onClick: onEditAttempt || ht,
        className: `${props.className || ''} opacity-60 cursor-not-allowed`,
        title: t("No tienes permisos para editar"),
        disabled: true,
        contentEditable: false,
        readOnly: true
      } as Partial<typeof props>
    )
  }

  // Procesar hijos recursivamente
  if (props.children) {
    const newChildren = Array.isArray(props.children)
      ? props.children.map(disableEditableElements)
      : disableEditableElements(props.children)

    return cloneElement(
      element as ReactElement<any>,
      {
        ...props,
        children: newChildren
      } as Partial<typeof props>
    )
  }

  return element
}

    return <>{disableEditableElements(children)}</>
  }

  // Si no tiene permisos, no mostrar nada
  return null
} 