import { FC } from "react"
import { AuthContextProvider, EventContextProvider } from "../context"
import VistaSinCookie from "./vista-sin-cookie"
import { useMounted } from "../hooks/useMounted"
import CopilotIframe from "../components/Copilot/CopilotIframe"

const STYLES = [
  { key: "romantico", label: "Romántico", emoji: "🌹", desc: "Flores blancas, velas, drapeados, tonos rosa y marfil" },
  { key: "rustico-boho", label: "Rústico Boho", emoji: "🌿", desc: "Madera, macramé, eucalipto, tonos tierra" },
  { key: "minimalista", label: "Minimalista", emoji: "⬜", desc: "Líneas limpias, neutros, luz natural" },
  { key: "glamour", label: "Glamour", emoji: "✨", desc: "Dorado, cristal, lámparas de araña, lujo" },
  { key: "jardin-floral", label: "Jardín Floral", emoji: "🌸", desc: "Flores coloridas, arcos vegetales, verde exuberante" },
  { key: "industrial", label: "Industrial", emoji: "🏭", desc: "Ladrillo visto, metal, bombillas Edison" },
  { key: "mediterraneo", label: "Mediterráneo", emoji: "🌊", desc: "Azul y blanco, cerámica, olivos, mar" },
  { key: "tropical", label: "Tropical", emoji: "🌴", desc: "Palmeras, colores vibrantes, rattan, playa" },
]

const DisenioEspacios: FC = () => {
  useMounted()
  const { user, verificationDone, config } = AuthContextProvider()
  const { event } = EventContextProvider()

  if (config?.copilotEnabled === false) {
    if (typeof window !== 'undefined') window.location.replace('/')
    return null
  }

  if (verificationDone) {
    if (!user || user?.displayName === "guest") {
      return <VistaSinCookie />
    }

    return (
      <div className="flex h-screen w-full overflow-hidden bg-base">
        {/* Panel lateral de referencia de estilos */}
        <aside className="hidden lg:flex flex-col w-72 xl:w-80 shrink-0 border-r border-gray-200 bg-white overflow-y-auto">
          <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50">
            <h2 className="text-base font-semibold text-gray-800">🏛️ Diseño de Espacios</h2>
            <p className="text-xs text-gray-500 mt-1">
              Visualiza tu salón con IA. Habla con el asistente para generar ideas.
            </p>
          </div>

          <div className="p-3 flex-1">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Estilos disponibles
            </p>
            <div className="space-y-1.5">
              {STYLES.map((s) => (
                <div
                  key={s.key}
                  className="flex items-start gap-2.5 p-2.5 rounded-lg bg-gray-50 hover:bg-purple-50 transition-colors cursor-default"
                >
                  <span className="text-lg shrink-0">{s.emoji}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-700 leading-tight">{s.label}</p>
                    <p className="text-xs text-gray-400 leading-tight mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-100">
              <p className="text-xs text-amber-700 font-medium mb-1">💡 Cómo usarlo</p>
              <ol className="text-xs text-amber-600 space-y-1 list-decimal list-inside">
                <li>Sube una foto de tu espacio</li>
                <li>Elige el estilo que más te gusta</li>
                <li>El asistente genera la visualización</li>
              </ol>
            </div>
          </div>
        </aside>

        {/* Chat con el copilot */}
        <div className="flex-1 h-full min-w-0">
          <CopilotIframe
            userId={user?.uid}
            development={user?.development || "bodasdehoy"}
            eventId={event?._id}
            eventName={event?.nombre}
            event={event}
            userData={{
              displayName: user?.displayName,
              email: user?.email,
              photoURL: user?.photoURL,
            }}
            enablePlugins={["lobe-venue-visualizer"]}
            className="h-full w-full"
          />
        </div>
      </div>
    )
  }

  return null
}

export default DisenioEspacios
