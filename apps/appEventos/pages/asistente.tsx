import { FC, useMemo } from "react"
import { useRouter } from "next/router"
import { AuthContextProvider, EventContextProvider } from "../context"
import { useMounted } from "../hooks/useMounted"
import CopilotIframe from "../components/Copilot/CopilotIframe"

/** ID de sesión anónima por navegador (mismo que ChatSidebar) para restricciones anónimo. */
function getGuestSessionId(): string {
  if (typeof window === 'undefined') return `guest_${Date.now()}`
  const stored = sessionStorage.getItem('copilot_guest_session')
  if (stored) return stored
  const id = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  sessionStorage.setItem('copilot_guest_session', id)
  return id
}

/**
 * /asistente — Página de acceso directo al asistente IA.
 * - Usuario logueado: auth normal.
 * - Usuario no logueado: actúa como anónimo (restricciones por navegador, sin consumo).
 * - Si copilotEnabled es false para el tenant, redirige a inicio.
 */
const AsistentePage: FC = () => {
  useMounted()
  const router = useRouter()
  const { user, config } = AuthContextProvider()
  const { event } = EventContextProvider()

  if (config?.copilotEnabled === false) {
    if (typeof window !== 'undefined') router.replace('/')
    return null
  }
  const guestId = useMemo(() => (typeof window !== 'undefined' ? getGuestSessionId() : null), [])
  const userId = user?.email || user?.uid || guestId || undefined
  const isAnonymous = !user || user?.displayName === 'guest' || !user?.email

  return (
    <div className="fixed inset-0 w-full h-full">
      <CopilotIframe
        userId={userId}
        development={user?.development || "bodasdehoy"}
        eventId={event?._id}
        eventName={event?.nombre}
        event={event}
        isAnonymous={isAnonymous}
        userData={user ? {
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
        } : undefined}
        className="w-full h-full"
      />
    </div>
  )
}

export default AsistentePage
