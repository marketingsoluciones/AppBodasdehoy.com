import { useRouter } from "next/router";
import { Login, Register, ResetPass } from "../components/Forms/Login/Forms";
import { useEffect, useMemo, useState } from "react";
import { AuthContextProvider, LoadingContextProvider } from "../context";
import { ArrowLeft } from "../components/icons";
import { SplitLoginPage } from "@bodasdehoy/auth-ui";
import LoginStudio from "../components/Forms/Login/LoginStudio";
import { resolveChatOrigin } from "@bodasdehoy/shared/utils";
import { cloneElement, isValidElement } from "react";
import type { ImgHTMLAttributes, ReactElement } from "react";

const safeThemeValue = (v: unknown) =>
  (typeof v === 'string' && !/[\r\n`\\]/.test(v) ? v : '')

/** Defaults alineados con firebase.tsx / developments[bodasdehoy] para SSR=cliente. */
const APP_EVENTOS_LEFT_PANEL = {
  brandName: 'Bodas de hoy - Organizador de Bodas',
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
  gradient: 'linear-gradient(150deg, #F7628C 0%, #87F3B5 60%, #FBFF4E 100%)',
};

const PageLogin = () => {
  const { config, user, verificationDone, linkMedia, preregister } = AuthContextProvider() as any;
  const { setLoading } = LoadingContextProvider() as any;
  const router = useRouter()

  const queryQ = typeof router.query.q === 'string' ? router.query.q : null
  const queryD = typeof router.query.d === 'string' ? router.query.d : null
  const sessionExpired = router.query.session_expired === '1'
  // Rediseño studio por defecto; rollback con ?studio=legacy. router.query='{}' en SSR
  // → studio=true en servidor y 1er paint cliente (sin hydration mismatch).
  const studio = router.query.studio !== 'legacy'

  // BUG-CW-N04 (informe QA 7ª ronda): React #418 "hydration mismatch HTML root"
  // en /login. Causa: useState inicial leía `linkMedia` (AuthContext, hidratado
  // tarde) y `queryQ` (router.query, vacío en SSR de Pages Router). El primer
  // render cliente difería del HTML servidor → mismatch. Stage SIEMPRE "login"
  // en el primer render; tras montar, useEffect ajusta a lo que toque.
  const [stage, setStage] = useState<string>("login");
  const [stageRegister, setStageRegister] = useState(0)
  const [whoYouAre, setWhoYouAre] = useState("");
  const [isMounted, setIsMounted] = useState(false)
  const [logoError, setLogoError] = useState(false)

  // Hasta montar: mismos defaults en SSR y 1er paint cliente (evita hydration mismatch
  // si AuthContext aún no tiene el tenant definitivo).
  const themePrimary = safeThemeValue(config?.theme?.primaryColor) || '#F7628C'
  const themeSecondary = safeThemeValue(config?.theme?.secondaryColor) || '#87F3B5'
  const themeTertiary = safeThemeValue(config?.theme?.tertiaryColor) || '#FBFF4E'
  const splitLeftPanel = useMemo(() => {
    if (!isMounted) {
      return { ...APP_EVENTOS_LEFT_PANEL }
    }
    const brandName = (typeof config?.headTitle === 'string' && config.headTitle.trim()) ? config.headTitle : APP_EVENTOS_LEFT_PANEL.brandName
    return {
      ...APP_EVENTOS_LEFT_PANEL,
      brandName,
      gradient: `linear-gradient(150deg, ${themePrimary} 0%, ${themeSecondary} 60%, ${themeTertiary} 100%)`,
    }
  }, [isMounted, config?.headTitle, themePrimary, themeSecondary, themeTertiary])

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

  // BUG-CW-N04: tras hidratar, ajustar el stage al valor real (linkMedia o ?q=)
  // que NO podíamos leer en el render inicial sin romper hydration.
  useEffect(() => {
    const target = (linkMedia != null ? "register" : null) ?? queryQ ?? "login"
    if (target !== stage) setStage(target)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkMedia, queryQ])

  useEffect(() => {
    if (preregister) {
      setStage("register")
      setStageRegister(1)
    }
  }, [preregister])

  // SSO bodasdehoy: redirige al login de chat-ia SOLO cuando:
  //   1. La verificación terminó y el usuario es definitivamente un guest (no estado de carga)
  //   2. Y hay intención explícita de login: viene de ruta protegida (?d=) o sesión expirada
  // Sin estas condiciones, visitantes fríos ven el formulario sin ser redirigidos (evita el bucle)
  useEffect(() => {
    if (!config?.development) return
    if (config.development !== 'bodasdehoy') return
    if (user && verificationDone && user?.displayName !== "guest") return // ya autenticado
    if (linkMedia || preregister) return // flujos especiales
    const localLogin = router.query['local-login'] === '1'
    if (localLogin) return

    const hostname = typeof window !== 'undefined' ? window.location.hostname : ''
    if (hostname === 'localhost' || hostname === '127.0.0.1') return // dev local

    // Condición clave: solo redirigir cuando la verificación ha terminado
    // (evita redirects en el estado de carga inicial donde user/verificationDone aún no tienen valor)
    if (!verificationDone) return

    // Si ya hay idTokenV0.1.0 el SSO desde chat-ia ya ocurrió — AuthContext lo procesará
    const hasSsoToken = typeof document !== 'undefined' && document.cookie.includes('idTokenV0.1.0')
    if (hasSsoToken) return

    // Anti-loop: si ya redirigimos en esta sesión de tab, no redirigir de nuevo
    const ssoRedirectPending = typeof window !== 'undefined' && sessionStorage.getItem('sso_redirect_pending') === '1'
    // Si el SSO falló (session_expired=1), limpiar el flag para permitir reintento
    if (ssoRedirectPending && sessionExpired) {
      if (typeof window !== 'undefined') sessionStorage.removeItem('sso_redirect_pending')
      return
    }
    if (ssoRedirectPending) return

    // INTENCIÓN DE LOGIN: solo redirigir si el usuario viene de ruta protegida o sesión expirada.
    // Visitantes que navegan directamente a /login ven el formulario sin redirect automático.
    const hasLoginIntent = !!queryD || sessionExpired
    if (!hasLoginIntent) return

    const chatDomain = resolveChatOrigin(hostname)
    const rawPath = queryD?.trim()
    const returnPath = (rawPath?.startsWith('/') && !rawPath.includes('://')) ? rawPath : '/'
    const returnUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}${returnPath}`
    const chatLoginUrl = `${chatDomain}/login?redirect=${encodeURIComponent(returnUrl)}`

    sessionStorage.setItem('sso_redirect_pending', '1')
    window.location.href = chatLoginUrl
  }, [config?.development, user, verificationDone, linkMedia, preregister, queryD, sessionExpired])

  // Auto-redirect tras login exitoso (700ms para dejar que el estado se estabilice)
  // _isSafetyGuest: true → creado por timeout de seguridad, NO es un usuario real verificado
  useEffect(() => {
    if (user && verificationDone && user?.displayName !== "guest" && !user?._isSafetyGuest) {
      // SSO completado: limpiar el flag anti-loop para que futuros logins en esta tab funcionen
      if (typeof window !== 'undefined') sessionStorage.removeItem('sso_redirect_pending')
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

  // BUG-015: no mostrar el formulario mientras el redirect-timer está activo
  const isRedirectingAway = user && verificationDone && user?.displayName !== "guest" && !user?._isSafetyGuest
  const safeLogoNode = useMemo(() => {
    if (logoError) return null
    const node = config?.logoDirectory
    if (!node) return null
    if (isValidElement(node) && typeof node.type === 'string' && node.type === 'img') {
      const imgNode = node as ReactElement<ImgHTMLAttributes<HTMLImageElement>>
      const prevOnError = imgNode.props?.onError
      return cloneElement(imgNode, {
        onError: (e: any) => {
          setLogoError(true)
          if (typeof prevOnError === 'function') prevOnError(e)
        },
      })
    }
    return node
  }, [config?.logoDirectory, logoError])

  if (isRedirectingAway) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-base">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Rediseño studio (gate ?studio, default ON): login + recuperar + registro.
  // Reusa el MISMO backend de auth. `?q=register` llega como stage "register" y
  // abre la vista de registro studio. Flujos especiales (linkMedia/preregistro)
  // siguen en el registro legacy.
  if (studio && (stage === "login" || stage === "register") && linkMedia == null && !preregister) {
    return (
      <LoginStudio
        logo={safeLogoNode}
        config={config}
        whoYouAre={whoYouAre}
        setStage={setStage}
        onClose={handleClose}
        initialView={stage === "register" ? "register" : "login"}
      />
    )
  }

  return (
    <SplitLoginPage leftPanel={splitLeftPanel}>
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', minHeight: '100vh', width: '100%' }}>
        {/* OBS-3 (informe QA 21-jun): flecha sin label era ambigua. Añadimos
            aria-label + title para tooltip y lectores de pantalla. */}
        <button
          type="button"
          className={`${(!["bodasdehoy"].includes(config?.development) && (stage === "login" || (stage === "register" && stageRegister === 0) || preregister)) && "hidden"} absolute flex items-center gap-1 text-gray-500 hover:text-gray-700 cursor-pointer bg-transparent border-0 p-1`}
          style={{ top: 20, left: 20 }}
          aria-label="Volver"
          title="Volver"
          onClick={() => {
            if (stage === "resetPassword") { setStage("login"); return }
            if (stageRegister > 0) { setStageRegister(stageRegister - 1); return }
            handleClose()
          }}
        >
          <ArrowLeft className="w-6 h-6" />
          <span className="hidden sm:inline text-sm">Volver</span>
        </button>
        {/* OBS-2 (informe QA 21-jun): la ✕ en la esquina superior derecha era
            ambigua (¿cierra qué?) y solo aparecía en bodasdehoy. Reemplazo
            multi-tenant: botón "Ir a {brand}" que usa pathDirectory de cada
            whitelabel — si está definido se muestra, si no, no aparece.
            Esto es consistente entre los 11 tenants y autoexplicativo. */}
        {/* Solo tras montar: en SSR buildProdDirectory devolvía '' (sin window) y
            el cliente sí pintaba el <a> → hydration mismatch. */}
        {isMounted && (() => {
          // OBS-02: el botón debe ir a la web de marketing del tenant, no al
          // pathDirectory sobrescrito a window.origin en -dev/-test.
          const buildProdDirectory = (): string => {
            const host = typeof window !== 'undefined' ? window.location.hostname : ''
            const cfgPath = typeof config?.pathDirectory === 'string' ? config.pathDirectory.trim() : ''
            // Preferir path de marketing del tenant (firebase developments), no el override local.
            const marketingPath =
              typeof config?.pathDomain === 'string' && config.pathDomain.trim()
                ? config.pathDomain.trim()
                : ''
            if (host && !host.includes('-dev.') && !host.includes('-test.') && host !== 'localhost' && host !== '127.0.0.1' && !/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
              return marketingPath || cfgPath
            }
            if (host) {
              const baseHost = host
                .replace(/^app-dev\./, '')
                .replace(/^app-test\./, '')
                .replace(/^app\./, '')
              if (baseHost && baseHost.includes('.')) {
                return `https://${baseHost}`
              }
            }
            return marketingPath || cfgPath
          }

          const path = buildProdDirectory()
          if (!path) return null
          const href = /^https?:\/\//.test(path) ? path : `https://${path}`
          let label = path.replace(/^https?:\/\//, '').replace(/\/$/, '')
          if (label.length > 28) label = label.slice(0, 25) + '…'
          return (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-xs sm:text-sm bg-transparent border border-gray-200 hover:border-gray-300 rounded-full px-3 py-1.5 transition-colors"
              style={{ top: 16, right: 16, textDecoration: 'none' }}
              title={`Ir a ${label}`}
              aria-label={`Ir a ${label}`}
            >
              <span className="hidden sm:inline">Ir a</span>
              <span style={{ fontWeight: 600 }}>{label}</span>
              <span aria-hidden style={{ fontSize: 11 }}>↗</span>
            </a>
          )
        })()}
        <div className="flex w-full md:w-2/3 max-w-sm flex-col items-center font-display">
          <div className="flex flex-col items-center justify-center transform w-full max-h-[124px] px-4 mb-4">
            {safeLogoNode ?? (
              <div className="w-full flex items-center justify-center">
                <div className="px-4 py-2 rounded-lg bg-primary text-white font-title text-base text-center max-w-full truncate">
                  {(typeof config?.headTitle === 'string' && config.headTitle.trim())
                    ? config.headTitle
                    : (typeof config?.development === 'string' && config.development.trim())
                      ? config.development
                      : (typeof config?.name === 'string' && config.name.trim())
                        ? config.name
                        : 'App'}
                </div>
              </div>
            )}
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
