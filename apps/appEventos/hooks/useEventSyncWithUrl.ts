/**
 * BUG-12 (informe QA post-commit 21-jun): páginas que dependen de `event` activo
 * (Mesas, Presupuesto, Itinerario, Servicios, Invitados, Invitaciones, Momentos,
 * Resumen-Evento, etc.) NO sincronizaban con la URL ?event=X. Si el usuario
 * navegaba a /mesas?event=ABC pero el contexto tenía evento XYZ, la página seguía
 * pintando XYZ.
 *
 * Originalmente el patrón estaba en servicios.tsx + itinerario.tsx + invitados.tsx
 * + mesas.tsx (4 sitios duplicados). Este hook unifica.
 *
 * Uso (en cada página que dependa del evento activo):
 *   const Page = () => {
 *     useEventSyncWithUrl()
 *     // ... resto del componente
 *   }
 */

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { EventContextProvider, EventsGroupContextProvider } from '../context'

export function useEventSyncWithUrl() {
  const { event, setEvent } = EventContextProvider()
  const { eventsGroup } = EventsGroupContextProvider()
  const searchParams = useSearchParams()
  const queryEvent = searchParams?.get?.('event')

  useEffect(() => {
    if (!queryEvent || queryEvent === event?._id || !eventsGroup?.length) return
    const eventFound = eventsGroup.find((elem: any) => elem._id === queryEvent)
    if (eventFound) {
      setEvent({ ...eventFound })
    }
  }, [queryEvent, eventsGroup, event?._id])
}
