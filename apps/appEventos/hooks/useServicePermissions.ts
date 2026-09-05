import { useMemo } from 'react'
import { AuthContextProvider, EventContextProvider } from '../context'
import { useAllowed } from './useAllowed'

export function useServicePermissions(itinerarioViewers?: string[]) {
  const { user } = AuthContextProvider()
  const { event } = EventContextProvider()
  const [isAllowed] = useAllowed()

  return useMemo(() => {
    const uid = user?.uid
    const isOwner = !!(uid && event?.usuario_id && uid === event.usuario_id)
    const hasEdit = !!(isAllowed())
    const hasView = !!(itinerarioViewers?.includes(uid))
    const canAccessList = isOwner || hasEdit || hasView

    const canViewTask = (task: any) => {
      if (!canAccessList) return false
      if (isOwner || hasEdit) return true
      return task?.spectatorView === true
    }

    const canEditTask = () => isOwner || hasEdit

    return { isOwner, hasEdit, hasView, canAccessList, canViewTask, canEditTask }
  }, [user, event, isAllowed, itinerarioViewers])
}
