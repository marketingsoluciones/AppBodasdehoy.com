import { useRouter } from "next/router";
import { ButtonClose } from "../components/Forms/ButtonClose";
import { Login, Register, ResetPass } from "../components/Forms/Login/Forms";
import { useEffect, useState } from "react";
import { AuthContextProvider, LoadingContextProvider } from "../context";
import { ArrowLeft } from "../components/icons";
import { SplitLoginPage } from "@bodasdehoy/auth-ui";
import { resolveChatOrigin } from "@bodasdehoy/shared/utils";

const APP_EVENTOS_LEFT_PANEL = {
  brandName: 'Bodas de Hoy',
  /** Un solo mensaje de marca: sin rotación (el default de auth-ui rota boda/comunión/bautizo…). */
  eventTypesForRotation: [],
  headline: 'La plataforma todo-en-uno para organizar tu boda',
  description: 'Invitados, mesas, presupuesto e itinerario — todo en un solo lugar.',
  features: [
    { icon: '👥', text: 'Gestión de invitados y confirmaciones' },
    { icon: '🪑', text: 'Plano de mesas interactivo' },
    { icon: '💰', text: 'Control de presupuesto en tiempo real' },
    { icon: '📋', text: 'Itinerario y coordinación del día' },
    { icon: '✨', text: 'Asistente IA incluido' },
  ],
  /** Oculta el bloque de cifras del default (evita otra “capa” de marketing). */
  stats: [],
};

const PageLogin = () => {
  const { config, user, verificationDone, linkMedia, preregister } = AuthContextProvider()
  const { setLoading } = LoadingContextProvider()
  const router = useRouter()

  const queryQ = typeof router.query.q === 'string' ? router.query.q : null
  const queryD = typeof router.query.d === 'string' ? router.query.d : null
  const sessionExpired = router.query.session_expired === '1'

  const [stage, setStage] = useState((linkMedia != null ? "register" : null) ?? queryQ ?? "login");
  const [stageRegister, setStageRegister] = useState(0)
  const [whoYouAre, setWhoYouAre] = useState("");
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    if (!isMounted) {
      setIsMounted(true)
      if (typeof setLoading === "function") {
        setTimeout(() => setLoading(false), 500)
      }
    }
    return () => {
      if (isMounted) setIsMounted(false)
    }
  }, [isMounted, setLoading])

  useEffect(() => {
    if (preregister) {
      setStage("register")
      setStageRegister(1)
    }
  }, [preregister])

  // Login unificado bodasdehoy: redirige al login de la app de chat (chat-dev / chat-test / chat)
  // SSO: la app de chat setea idTokenV0.1.0 (Domain=.bodasdehoy.com); AuthContext en appEventos lo consume al volver
  useEffect(() => {
    if (!config?.development) return
    if (config.development !== 'bodasdehoy') return
    if (user && verificationDone && user?.displayName !== "guest") return // ya autenticado (no guest)
    if (linkMedia || preregister) return // flujos especiales que necesitan appEventos login
    const localLogin = router.query['local-login'] === '1'
    if (localLogin) return

    const hostname = typeof window !== 'undefined' ? window.location.hostname : ''
    if (hostname === 'localhost' || hostname === '127.0.0.1') return // dev local: login propio

    // Si ya hay idTokenV0.1.0 el SSO desde la app de chat ya ocurrió — esperar a que AuthContext lo procese,
    // no redirigir de nuevo o causará bucle infinito
    const hasSsoToken = typeof document !== 'undefined' && document.cookie.includes('idTokenV0.1.0')
    if (hasSsoToken) return

    const chatDomain = resolveChatOrigin(hostname)
    const rawPath = queryD?.trim()
    // Sólo aceptar rutas relativas puras (sin ://). Evita URL duplicada si queryD llega contaminado.
    const returnPath = (rawPath?.startsWith('/') && !rawPath.includes('://')) ? rawPath : '/'
    const returnUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}${returnPath}`
    const chatLoginUrl = `${chatDomain}/login?redirect=${encodeURIComponent(returnUrl)}`

    window.location.href = chatLoginUrl
  }, [config?.development, user, verificationDone, linkMedia, preregister, queryD])

  // Auto-redirect tras login exitoso (700ms para dejar que el estado se estabilice)
  useEffect(() => {
    if (user && verificationDone && user?.displayName !== "guest") {
      const redirectPath = queryD?.trim()?.startsWith("/") ? queryD.trim() : "/"
      const timer = setTimeout(() => router.replace(redirectPath), 700)
      return () => clearTimeout(timer)
    }
  }, [user, verificationDone, queryD, router])

  const Stages = {
    login: <Login setStage={setStage} whoYouAre={whoYouAre} setWhoYouAre={setWhoYouAre} />,
    register: <Register setStage={setStage} stageRegister={stageRegister} setStageRegister={setStageRegister} whoYouAre={whoYouAre} setWhoYouAre={setWhoYouAre} />,
    resetPassword: <ResetPass setStage={setStage} whoYouAre={whoYouAre} />,
  };

  const handleClose = () => {
    setTimeout(() => router.push(queryD || "/"), 100)
  }

  return (
    <SplitLoginPage leftPanel={APP_EVENTOS_LEFT_PANEL}>
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', minHeight: '100vh', width: '100%' }}>
        <ArrowLeft
          className={`${(!["bodasdehoy"].includes(config?.development) && (stage === "login" || (stage === "register" && stageRegister === 0) || preregister)) && "hidden"} absolute w-6 h-6 text-gray-500 cursor-pointer`}
          style={{ top: 20, left: 20 }}
          onClick={() => {
            if (stage === "resetPassword") { setStage("login"); return }
            if (stageRegister > 0) { setStageRegister(stageRegister - 1); return }
            handleClose()
          }}
        />
        {["bodasdehoy"].includes(config?.development) && (
          <div style={{ position: 'absolute', top: 16, right: 16 }}>
            <ButtonClose onClick={handleClose} />
          </div>
        )}
        <div className="flex w-full md:w-2/3 max-w-sm flex-col items-center font-display">
          <div className="flex flex-col items-center justify-center transform w-full max-h-[124px] px-4 mb-4">
            {config?.logoDirectory}
          </div>
          {sessionExpired && (
            <p className="mb-4 px-4 py-2 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-sm text-center max-w-sm">
              Sesión no autorizada o expirada. Inicia sesión de nuevo.
            </p>
          )}
          <div className="flex flex-col items-center justify-center w-full">
            {Stages[stage]}
          </div>
        </div>
      </div>
    </SplitLoginPage>
  )
}

export default PageLogin
