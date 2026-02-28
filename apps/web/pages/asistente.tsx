import { FC } from "react"
import { AuthContextProvider, EventContextProvider } from "../context"
import { useMounted } from "../hooks/useMounted"
import CopilotIframe from "../components/Copilot/CopilotIframe"

/**
 * /asistente — Página de acceso directo al asistente IA para usuarios finales.
 * Solo carga el CopilotIframe a pantalla completa, sin navegación ni chrome de la app.
 * Funciona tanto para usuarios registrados (pasa auth) como para visitantes (CopilotIframe gestiona la UX de guest).
 */
const AsistentePage: FC = () => {
  useMounted()
  const { user } = AuthContextProvider()
  const { event } = EventContextProvider()

  return (
    <div className="fixed inset-0 w-full h-full">
      <CopilotIframe
        userId={user?.email || user?.uid || undefined}
        development={user?.development || "bodasdehoy"}
        eventId={event?._id}
        eventName={event?.nombre}
        event={event}
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
