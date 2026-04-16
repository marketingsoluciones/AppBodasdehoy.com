/**
 * GuestDemoWrapper — Envuelve cualquier sección con datos demo para visitantes sin cuenta.
 *
 * Renderiza el children con el EventContext cargado con DEMO_EVENT (datos ficticios).
 * Encima muestra:
 *  - Banner "DEMO" fijo en la parte superior
 *  - Overlay con blur gradiente en la mitad inferior
 *  - Tarjeta CTA centrada para que el visitante se registre
 *
 * El visitante VE la app real con datos de ejemplo pero sabe claramente que es un demo.
 */
import { FC, ReactNode, useEffect } from 'react'
import Link from 'next/link'
import { EventContextProvider, AuthContextProvider } from '../../context'
import { DEMO_EVENT } from '../../utils/demoEvent'
import { SkeletonTable } from './SkeletonPage'

interface Props {
  children: ReactNode
  section: string
  icon?: string
  description?: string
}

const GuestDemoWrapper: FC<Props> = ({ children, section, icon = '✨', description }) => {
  const { setEvent } = EventContextProvider()
  const { config, user } = AuthContextProvider()

  // Safety-timeout guest: auth aún no completó — mostrar skeleton en vez de demo
  // Evita mostrar modo demo cuando el usuario real tiene auth lenta (SSO, conexión lenta)
  if ((user as any)?._isSafetyGuest) {
    return <SkeletonTable rows={8} />
  }

  const loginUrl = config?.pathLogin ? `${config.pathLogin}?q=register` : '/login?q=register'

  // Inyectar el evento demo en el contexto para que los componentes hijos lo usen
  useEffect(() => {
    setEvent(DEMO_EVENT as any)
    return () => {
      // Al desmontar limpiar el evento demo del contexto
      setEvent(null)
    }
  }, [])

  return (
    <div className="relative w-full">
      {/* Banner DEMO fijo arriba */}
      <div className="sticky top-[64px] z-[55] w-full bg-amber-400 text-amber-900 text-center text-xs font-semibold py-1.5 px-4 flex items-center justify-center gap-2 shadow-sm">
        <span>🎭</span>
        <span>Estás viendo un ejemplo con datos ficticios — esto es una demostración</span>
        <Link href={loginUrl} className="ml-2 underline font-bold hover:text-amber-950 transition">
          Crear cuenta gratis →
        </Link>
      </div>

      {/* Contenido real con datos demo — sin interacción */}
      <div className="pointer-events-none select-none">
        {children}
      </div>

      {/* Overlay blur + CTA en la mitad inferior */}
      <div
        className="absolute bottom-0 left-0 right-0 z-[50] flex flex-col items-center justify-end pb-10"
        style={{
          height: '65%',
          background: 'linear-gradient(to bottom, transparent 0%, rgba(246,246,246,0.55) 30%, rgba(246,246,246,0.92) 60%, rgba(246,246,246,1) 100%)',
        }}
      >
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 max-w-sm w-full mx-4 text-center">
          <div className="text-4xl mb-3">{icon}</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{section}</h3>
          {description && (
            <p className="text-sm text-gray-500 mb-4 leading-relaxed">{description}</p>
          )}
          <Link
            href={loginUrl}
            className="block w-full py-3 rounded-full bg-primary text-white font-semibold text-sm hover:opacity-80 transition text-center"
          >
            Crear cuenta gratis
          </Link>
          <Link
            href={loginUrl.replace('?q=register', '')}
            className="block mt-3 text-sm text-gray-400 hover:text-gray-600 transition"
          >
            Ya tengo cuenta — Iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  )
}

export default GuestDemoWrapper
