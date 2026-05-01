import { createContext, useContext, useState, useEffect, useRef } from "react";
import { getAuth, onAuthStateChanged, signInWithCustomToken, getRedirectResult } from 'firebase/auth'
import Cookies from 'js-cookie'
import { nanoid, customAlphabet, } from 'nanoid'
import { developments } from "../firebase";

/** En localhost el navegador rechaza cookies con domain=.bodasdehoy.com */
function safeCookieDomain(domain?: string): string | undefined {
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return undefined;
  }
  return domain;
}
import { fetchApiBodas, fetchApiEventos, queries } from "../utils/Fetching";
import { initializeApp } from "firebase/app";
import { useRouter, useSearchParams } from "next/navigation";
import { useActivity } from "../hooks/useActivity";
import { isTestSubdomain, normalizeRedirectAfterLogin } from "../utils/urlHelpers";
import {
  authBridge,
  parseJwt,
  parseSessionJwt,
  getSessionUserIdFromToken,
} from '@bodasdehoy/shared/auth';
import { getDevelopmentNameFromHostname } from '@bodasdehoy/shared/types';
import { registerReferralIfPending, trackRegistrationComplete, sendAttributionToApi } from '@bodasdehoy/shared';

const initialContext = {
  user: undefined,
  setUser: undefined,
  verificationDone: false,
  setVerificationDone: undefined,
  config: undefined,
  setConfig: undefined,
  theme: undefined,
  setTheme: undefined,
  isActiveStateSwiper: 0,
  setIsActiveStateSwiper: undefined,
  geoInfo: undefined,
  setGeoInfo: undefined,
  forCms: undefined,
  setForCms: undefined,
  actionModals: undefined,
  setActionModals: undefined,
  setIsStartingRegisterOrLogin: undefined,
  link_id: undefined,
  SetLink_id: undefined,
  storage_id: undefined,
  SetStorage_id: undefined,
  linkMedia: undefined,
  SetLinkMedia: undefined,
  preregister: undefined,
  SetPreregister: undefined,
  WihtProvider: undefined,
  SetWihtProvider: undefined,
  EventTicket: undefined,
  setEventTicket: undefined,
  selectTicket: undefined,
  setSelectTicket: undefined,
  usuariosTickets: undefined,
  setUsuariosTickets: undefined,
}

type Context = {
  user: any
  setUser: any
  verificationDone: any
  setVerificationDone: any
  config: any
  setConfig: any
  theme: any
  setTheme: any
  isActiveStateSwiper: any
  setIsActiveStateSwiper: any
  geoInfo: any,
  setGeoInfo: any,
  forCms: any,
  setForCms: any,
  setActionModals: any,
  actionModals: any,
  setIsStartingRegisterOrLogin: any
  link_id: any
  SetLink_id: any
  storage_id: any
  SetStorage_id: any
  linkMedia: any
  SetLinkMedia: any
  preregister: any
  SetPreregister: any
  WihtProvider: any,
  SetWihtProvider: any,
  EventTicket: any,
  setEventTicket: any,
  selectTicket: any,
  setSelectTicket: any,
  usuariosTickets: any,
  setUsuariosTickets: any,
}
export let varGlobalDomain = ""
export let varGlobalSubdomain = ""
export let varGlobalDevelopment = ""

const AuthContext = createContext<Context>(initialContext);
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState<any>(initialContext.user);
  const [verificationDone, setVerificationDone] = useState<any>(false);
  const [config, setConfig] = useState<any>();
  const [isMounted, setIsMounted] = useState<boolean>(false)
  const [isActiveStateSwiper, setIsActiveStateSwiper] = useState<any>(0);
  const [actionModals, setActionModals] = useState(false);
  const [theme, setTheme] = useState<any>({
    primaryColor: undefined,
    secondaryColor: undefined,
    tertiaryColor: undefined,
    baseColor: undefined,
    colorScroll: undefined
  })
  const [geoInfo, setGeoInfo] = useState<any>();
  const [forCms, setForCms] = useState<boolean>(false)
  const [link_id, SetLink_id] = useState<string | string[] | null>(null)
  const [preregister, SetPreregister] = useState<any>(null)
  const [linkMedia, SetLinkMedia] = useState<string | string[] | null>(null)
  const [storage_id, SetStorage_id] = useState<string | null>(null)
  const [triggerAuthStateChanged, setTriggerAuthStateChanged] = useState<number | null>(null)
  const [isStartingRegisterOrLogin, setIsStartingRegisterOrLogin] = useState<boolean>(null)
  const [showSkipLoadingButton, setShowSkipLoadingButton] = useState(false)
  /** Segundos en pantalla de arranque (auth) — feedback cuando la red o SSO van lentos. */
  const authBootStartRef = useRef<number | null>(null)
  const [authBootSeconds, setAuthBootSeconds] = useState(0)
  /** Tras restaurar sessionBodas desde API2, si el JWT sigue sin UID reconocible, no reintentar en bucle. */
  const skipApi2SessionRestoreKeyRef = useRef<string | null>(null)
  const verificatorDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [WihtProvider, SetWihtProvider] = useState<boolean>(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const [updateActivity] = useActivity()
  const [EventTicket, setEventTicket] = useState({})

  const [selectTicket, setSelectTicket] = useState(null)
  const [usuariosTickets, setUsuariosTickets] = useState([])

  useEffect(() => {
    const storage_id = localStorage.getItem("_id")
    if (!storage_id) {
      const _id = customAlphabet('1234567890abcdef', 24)()
      localStorage.setItem("_id", _id)
      SetStorage_id(_id)
    } else {
      SetStorage_id(storage_id)
    }

    if (!forCms) {
      setForCms(searchParams?.get("show") === "iframe")
    }

    if (!link_id && searchParams?.get("link")) {
      if (searchParams?.get("_id")) {
        fetchApiEventos({
          query: queries.getPreregister,
          variables: { _id: searchParams?.get("_id") }
        }).then((result: any) => {
          SetPreregister(JSON.parse(result ?? {}))
        })
      }
      SetLinkMedia(searchParams?.get("m"))
      SetLink_id(searchParams?.get("link"))
      if (![].includes(searchParams?.get("m")?.toString()) || searchParams?.get("_id")) {
        router.push("/login?q=register")
      }
    }

    if (searchParams?.get("eventTicket")) {

      const fetchData = async () => {
        const data = await fetchApiBodas({
          query: queries.getEventTicket,
          variables: {},
          development: "bodasdehoy"
        });
        setEventTicket({ data })
      }
      fetchData()
    }
  }, [searchParams])

  useEffect(() => {
    if (storage_id && link_id) {
      fetchApiEventos({
        query: queries.updateActivityLink,
        variables: {
          args: {
            link_id,
            storage_id,
            activity: "accessed",
            usuario_id: user?.uid,
            name: user?.displayName,
            role: user?.role,
            email: user?.email,
            phoneNumber: user?.phoneNumber,
            navigator: navigator?.userAgentData?.platform,
            mobile: (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
          }
        }
      }).catch(error => console.log(90000, error))
    }
  }, [storage_id, link_id, user])

  useEffect(() => {
    if (!isMounted) {
      setIsMounted(true)
    }
    return () => {
      setIsMounted(false)
    }
  }, [])

  let resp: any = undefined

  useEffect(() => {
    if (isMounted) {
      const path = window.location.hostname
      const c = path?.split(".")
      const idx = c?.findIndex(el => el === "com" || el === "mx")

      // Detectar whitelabel desde shared (incluye override __dev_domain y fallback a bodasdehoy)
      const domainDevelop = getDevelopmentNameFromHostname(path)
      console.log("[Auth Config] Using development domain:", domainDevelop, "hostname:", path)

      const subdomainDevelop = undefined // solo c[0] si es ticket/invitado/dev, si no queda sin subdomain
      /*--------------------------------------------------------------------*/
      resp = developments.filter(elem => elem.name === domainDevelop)[0]

      // Validación: si no se encuentra el development, usar el primero como fallback
      if (!resp) {
        console.warn("[Auth Config] Development not found for domain:", domainDevelop, "using fallback")
        resp = developments[0]
      }

      // Validación: verificar que c existe y tiene elementos antes de acceder a c[0]
      const firstSubdomain = c && c.length > 0 ? c[0] : undefined
      resp.subdomain = ["ticket", "testticket", "invitado", "testinvitado", "dev"].includes(firstSubdomain) ? firstSubdomain : subdomainDevelop
      //redireccion a: /RelacionesPublicas
      if (["ticket", "testticket"].includes(resp.subdomain) && window.location.pathname.split("/")[1] === "") {
        router.push("/RelacionesPublicas")
      }
      // Detectar si estamos en un subdominio de test (test., chat-test., etc.)
      const isOnTestSubdomain = isTestSubdomain()
      const isLocalhost = idx === -1

      if (isLocalhost || isOnTestSubdomain) {
        // Para subdominios de test, usar el origin actual para mantener el usuario en el mismo subdominio
        let directory: string
        if (isOnTestSubdomain) {
          // Mantener el subdominio actual (ej: chat-test.bodasdehoy.com -> chat-test.bodasdehoy.com)
          directory = window.origin
        } else {
          // Localhost - usar la variable de entorno
          directory = process.env.NEXT_PUBLIC_DIRECTORY
        }

        console.log("[Auth Config] Using directory for redirects:", directory, "isTestSubdomain:", isOnTestSubdomain)

        resp = {
          ...resp,
          domain: process.env.NEXT_PUBLIC_PRODUCTION ? resp?.domain : process.env.NEXT_PUBLIC_DOMINIO,
          pathDirectory: resp?.pathDirectory ? `${directory}` : undefined,
          pathLogin: resp?.pathLogin ? `${directory}/login` : undefined,
          pathSignout: resp?.pathSignout ? `${directory}/signout` : undefined,
          pathPerfil: resp?.pathPerfil ? `${directory}/configuracion` : undefined
        }
      }
      varGlobalDomain = resp?.domain
      varGlobalSubdomain = resp?.subdomain
      varGlobalDevelopment = resp?.development
      setConfig(resp)

      // Configurar debug token para App Check en desarrollo (localhost, -test o -dev)
      const debugHosts = ['localhost', 'chat-test.bodasdehoy.com', 'app-test.bodasdehoy.com', 'chat-dev.bodasdehoy.com', 'app-dev.bodasdehoy.com']
      if (typeof window !== 'undefined' && debugHosts.includes(window.location.hostname)) {
        (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = 'CD2BCA5A-E34F-4F7E-B24B-81BC9DEB52C8'
        console.log('[Firebase] App Check debug token configurado para:', window.location.hostname)
      }

      try {
        initializeApp(resp?.fileConfig)
      } catch (error) {
        console.log(90001, error)
      }
    }
  }, [isMounted])

  useEffect(() => {
    if (isMounted && config) {
      // BYPASS: Para subdominios de test SOLAMENTE (no localhost)
      // localhost ahora usa autenticación real de Firebase
      const isTestEnv = window.location.hostname.includes('chat-test') || window.location.hostname.includes('app-test') || window.location.hostname.includes('test.') || window.location.hostname.includes('app-dev')
      const devBypass = localStorage.getItem('dev_bypass') === 'true' || sessionStorage.getItem('dev_bypass') === 'true'

      if (isTestEnv && devBypass) {
        const bypassEmail = localStorage.getItem('dev_bypass_email') || sessionStorage.getItem('dev_bypass_email') || 'jcc@bodasdehoy.com'
        const bypassUid = localStorage.getItem('dev_bypass_uid') || sessionStorage.getItem('dev_bypass_uid') || 'upSETrmXc7ZnsIhrjDjbHd7u2up1'
        console.log("[Auth] 🔓 Bypass activo:", bypassEmail, bypassUid)
        const devUser = {
          uid: bypassUid,
          email: bypassEmail,
          displayName: bypassEmail.split('@')[0],
          role: ['creator'],
          status: true
        }
        setUser(devUser)
        setVerificationDone(true)
        return
      }

      // Manejar resultado del redirect de login (Google/Facebook)
      // Esto se ejecuta cuando el usuario regresa de Google/Facebook después de autenticarse
      const wasRedirectPending = sessionStorage.getItem('auth_redirect_pending') === 'true'
      console.log("[Auth] Verificando resultado de redirect... wasRedirectPending:", wasRedirectPending)

      getRedirectResult(getAuth())
        .then(async (result) => {
          // Limpiar flag de redirect pendiente
          sessionStorage.removeItem('auth_redirect_pending')

          console.log("[Auth] getRedirectResult completado:", {
            hasResult: !!result,
            hasUser: !!result?.user,
            email: result?.user?.email
          })

          // Si no hay resultado de redirect, verificar que se complete la autenticación normal
          if (!result?.user) {
            console.log("[Auth] No hay resultado de redirect, continuando con flujo normal...")
            // El flujo de onAuthStateChanged manejará la autenticación
            return
          }

          if (result?.user) {
            console.log("[Auth] ✅ Redirect login exitoso, procesando usuario:", result.user.email)
            SetWihtProvider(true)
            
            // Procesar el login completo como en el flujo normal
            try {
              const idToken = await result.user.getIdToken()
              const dateExpire = new Date(parseJwt(idToken).exp * 1000)
              
              const idTokenDomain = safeCookieDomain(process.env.NEXT_PUBLIC_PRODUCTION ? config?.domain : process.env.NEXT_PUBLIC_DOMINIO || ".bodasdehoy.com")
              
              console.log("[Auth] Estableciendo cookie idTokenV0.1.0:", {
                domain: idTokenDomain,
                expires: dateExpire.toISOString()
              })
              
              Cookies.set("idTokenV0.1.0", idToken, { 
                domain: idTokenDomain, 
                expires: dateExpire,
                path: "/",
                secure: window.location.protocol === "https:",
                sameSite: "lax"
              })
              
              // Verificar que la cookie se estableció
              const idTokenVerificado = Cookies.get("idTokenV0.1.0")
              if (idTokenVerificado) {
                console.log("[Auth] ✅ Cookie idTokenV0.1.0 establecida correctamente")
              } else {
                console.error("[Auth] ❌ Error: Cookie idTokenV0.1.0 NO se estableció")
              }

              // Obtener información adicional del usuario
              const moreInfo = { status: true }

              if (moreInfo?.status && result.user.email) {
                // Obtener sessionCookie
                const token = (await result.user.getIdTokenResult())?.token
                let authResult: any = null
                try {
                  authResult = await fetchApiBodas({
                    query: queries.auth,
                    variables: { idToken: token },
                    development: config?.development
                  })
                } catch (authErr: any) {
                  console.warn("[Auth] ⚠️ auth mutation falló:", authErr?.message)
                }

                if (authResult?.sessionCookie) {
                  const { sessionCookie } = authResult
                  // Establecer expiración de 365 días
                  const dateExpire = new Date(new Date(new Date().getTime() + 365 * 24 * 60 * 60 * 1000))
                  
                  // Determinar el dominio correcto para la cookie
                  // Para que funcione en todos los subdominios, usar .bodasdehoy.com
                  let cookieDomain: string | undefined = config?.domain || ""
                  if (!cookieDomain) {
                    cookieDomain = process.env.NEXT_PUBLIC_PRODUCTION ? config?.domain : process.env.NEXT_PUBLIC_DOMINIO || ".bodasdehoy.com"
                  }
                  // Asegurar que el dominio empiece con punto para subdominios
                  if (cookieDomain && !cookieDomain.startsWith('.')) {
                    cookieDomain = `.${cookieDomain.replace(/^https?:\/\//, '').split('/')[0]}`
                  }
                  // En localhost omitir domain para que el navegador no rechace la cookie
                  cookieDomain = safeCookieDomain(cookieDomain)
                  
                  console.log("[Auth] Estableciendo cookie sessionBodas:", {
                    cookie: config?.cookie,
                    domain: cookieDomain,
                    expires: dateExpire.toISOString(),
                    hostname: window.location.hostname
                  })
                  
                  // Establecer la cookie con el dominio correcto y expiración de 365 días
                  // Usar maxAge en días (365 días = 365 * 24 * 60 * 60 segundos)
                  const maxAgeDays = 365
                  const maxAgeSeconds = maxAgeDays * 24 * 60 * 60
                  
                  console.log("[Auth] Configuración de cookie sessionBodas:", {
                    cookie: config?.cookie,
                    domain: cookieDomain,
                    expires: dateExpire.toISOString(),
                    maxAge: maxAgeSeconds,
                    hostname: window.location.hostname,
                    protocol: window.location.protocol
                  })
                  
                  // Establecer la cookie con el dominio correcto
                  Cookies.set(config?.cookie, sessionCookie, { 
                    domain: cookieDomain || ".bodasdehoy.com", 
                    expires: dateExpire,
                    path: "/",
                    secure: window.location.protocol === "https:",
                    sameSite: "lax"
                  })
                  
                  // Verificar inmediatamente que la cookie se estableció
                  const cookieInmediata = Cookies.get(config?.cookie)
                  console.log("[Auth] Verificación inmediata de cookie:", {
                    cookie: config?.cookie,
                    presente: !!cookieInmediata,
                    valor: cookieInmediata ? cookieInmediata.substring(0, 50) + "..." : null
                  })
                  
                  // Verificar que la cookie se estableció correctamente
                  const cookieVerificada = Cookies.get(config?.cookie)
                  if (cookieVerificada) {
                    console.log("[Auth] ✅ Cookie sessionBodas establecida correctamente")
                  } else {
                    console.error("[Auth] ❌ Error: Cookie sessionBodas NO se estableció")
                  }
                }

                // Tracking: referral + analytics
                registerReferralIfPending(idToken, config?.development || 'bodasdehoy').catch(() => undefined);
                sendAttributionToApi(idToken, config?.development || 'bodasdehoy').catch(() => undefined);
                trackRegistrationComplete(
                  result.user.providerData?.[0]?.providerId?.includes('google') ? 'google'
                    : result.user.providerData?.[0]?.providerId?.includes('facebook') ? 'facebook'
                    : 'email',
                  config?.development || 'bodasdehoy',
                );

                // Actualizar estado con los datos completos
                setUser({ ...result.user, ...moreInfo })
                setVerificationDone(true)

                // Redirigir a la URL correcta si estamos en una URL diferente
                const currentOrigin = window.location.origin
                const currentHostname = window.location.hostname
                
                // Determinar la URL esperada basada en la configuración
                let expectedUrl = currentOrigin
                if (config?.pathDirectory) {
                  try {
                    const expectedUrlObj = new URL(config.pathDirectory)
                    expectedUrl = expectedUrlObj.origin
                  } catch (e) {
                    expectedUrl = config.pathDirectory
                  }
                } else if (config?.pathDomain) {
                  try {
                    const expectedUrlObj = new URL(config.pathDomain)
                    expectedUrl = expectedUrlObj.origin
                  } catch (e) {
                    expectedUrl = config.pathDomain
                  }
                }
                
                // Si estamos en una URL diferente (ej: bodasdehoy.com cuando deberíamos estar en chat-test.bodasdehoy.com)
                // y no es localhost, redirigir a la URL correcta
                if (currentOrigin !== expectedUrl && !currentOrigin.includes('localhost') && expectedUrl !== currentOrigin) {
                  console.log("[Auth] Redirigiendo de", currentOrigin, "a", expectedUrl)
                  // Usar pathDirectory completo si está disponible, sino solo el origin
                  const redirectUrl = config?.pathDirectory || expectedUrl
                  window.location.href = redirectUrl
                } else {
                // 🔧 DEBUG: Deshabilitar redirects si hay flag de debugging
                const debugNoRedirect = new URLSearchParams(window.location.search).get('debug-no-redirect') === '1'

                if (debugNoRedirect) {
                  console.log("[Auth] 🛑 DEBUG MODE: Redirect deshabilitado por flag debug-no-redirect=1")
                  // No hacer nada, permitir que el usuario permanezca en la página
                  return
                }

                // Si estamos en la URL correcta, redirigir a la página principal o la URL de destino
                // En subdominios de test no redirigir a otro subdominio (ej. chat-test) para evitar fallos
                const queryD = new URLSearchParams(window.location.search).get('d')
                const redirectPath = normalizeRedirectAfterLogin(queryD || '/')
                console.log("[Auth] ✅ Login exitoso, esperando para establecer cookies antes de redirigir a:", redirectPath)

                // Esperar 1 segundo para asegurar que las cookies se establezcan
                setTimeout(() => {
                  // Verificar cookies antes de redirigir
                  const sessionCookie = Cookies.get(config?.cookie)
                  const idToken = Cookies.get("idTokenV0.1.0")

                  if (sessionCookie && idToken) {
                    console.log("[Auth] ✅ Cookies verificadas, redirigiendo...")
                    window.location.href = redirectPath
                  } else {
                    console.warn("[Auth] ⚠️ Algunas cookies no están presentes, redirigiendo de todas formas...")
                    window.location.href = redirectPath
                  }
                }, 1000)
                }
              } else {
                // Usuario no existe, redirigir a registro
                setUser(result.user)
                setVerificationDone(true)

                // 🔧 DEBUG: Deshabilitar redirects si hay flag de debugging
                const debugNoRedirect = new URLSearchParams(window.location.search).get('debug-no-redirect') === '1'

                if (!debugNoRedirect && window.location.pathname !== '/login') {
                  console.log("[Auth] Redirigiendo a login porque usuario no existe en BD")
                  const loginUrl = config?.pathLogin
                    ? `${config.pathLogin}?redirect=${encodeURIComponent(window.location.origin + window.location.pathname)}`
                    : '/login'
                  window.location.href = loginUrl
                } else if (debugNoRedirect) {
                  console.log("[Auth] 🛑 DEBUG MODE: Redirect a login deshabilitado por flag debug-no-redirect=1")
                }
              }
            } catch (error) {
              console.error("[Auth] Error procesando redirect login:", error)
              setUser(result.user)
              setVerificationDone(true)
            }
          }
        })
        .catch((error) => {
          console.error("[Auth] Error en redirect login:", error)
          // Si hay un error con el redirect, mostrar mensaje claro
          if (error?.code === 'auth/unauthorized-domain') {
            console.error("[Auth] Dominio no autorizado para redirect")
          } else {
            console.error("[Auth] Error procesando redirect:", error?.message || error)
          }
          // Asegurar que verificationDone se establezca para evitar pantalla negra
          setVerificationDone(true)
        })

      onAuthStateChanged(getAuth(), async () => {
        setTriggerAuthStateChanged(new Date().getTime())
      });

      // Al volver a la pestaña: forzar refresco del token Firebase.
      // Esto dispara onAuthStateChanged → verificator vuelve a validar sessionBodas.
      // Evita el estado intermedio donde Firebase sigue válido pero sessionBodas expiró.
      const onVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          const currentUser = getAuth().currentUser;
          if (currentUser) {
            currentUser.getIdToken(true).catch(() => {
              // Token revocado o sin red → onAuthStateChanged disparará con user=null
            });
          }
        }
      };
      document.addEventListener('visibilitychange', onVisibilityChange);
      return () => document.removeEventListener('visibilitychange', onVisibilityChange);
    }
  }, [config]);

  useEffect(() => {
    if (isStartingRegisterOrLogin) {
      setIsStartingRegisterOrLogin(false)
      return
    }
    if (!triggerAuthStateChanged) return
    if (verificatorDebounceRef.current) clearTimeout(verificatorDebounceRef.current)
    verificatorDebounceRef.current = setTimeout(() => {
      verificatorDebounceRef.current = null
      const u = getAuth().currentUser
      const sessionCookie = Cookies.get(config?.cookie)
      void verificator({ user: u, sessionCookie })
    }, 400)
    return () => {
      if (verificatorDebounceRef.current) clearTimeout(verificatorDebounceRef.current)
    }
  }, [triggerAuthStateChanged, config?.cookie])

  // ✅ Timeout de seguridad: si la verificación no termina en 4s, mostrar la app como guest
  // 4s da tiempo suficiente para el flujo SSO cross-domain (authStatus + signInWithCustomToken)
  // NOTA: El bucle de login está prevenido por login.js y vista-sin-cookie.js (hasSsoToken check),
  // no por este timeout. Este timeout debe siempre completar la verificación.
  useEffect(() => {
    const safetyTimeout = setTimeout(() => {
      setVerificationDone((prev) => {
        if (!prev) {
          console.warn('[Auth] Timeout de seguridad: verificación lenta, mostrando app sin forzar guest');
          return true;
        }
        return prev;
      });
    }, 10000);

    return () => clearTimeout(safetyTimeout);
  }, [])

  const moreInfo = async (user) => {
    try {
      let idToken = Cookies.get("idTokenV0.1.0")
      if (!idToken) {
        idToken = await getAuth().currentUser?.getIdToken(true)
        const dateExpire = new Date(parseJwt(idToken ?? "").exp * 1000)
        Cookies.set("idTokenV0.1.0", idToken ?? "", { domain: safeCookieDomain(process.env.NEXT_PUBLIC_PRODUCTION ? varGlobalDomain : process.env.NEXT_PUBLIC_DOMINIO), expires: dateExpire })
      }
      const userInfo = await fetchApiBodas({
        query: queries.getUser,
        variables: { uid: user?.uid },
        development: config?.development
      });
      // Guard: if user logged out while this async call was in flight, do not overwrite null
      if (!getAuth().currentUser) return;
      const firebaseUid = getAuth().currentUser?.uid || user?.uid
      // getUser no pide `uid` en GraphQL; si la API devolviera campos extra, no deben pisar el UID de Firebase (query eventos usa usuario_id === uid).
      setUser({ ...user, ...userInfo, uid: firebaseUid });
      updateActivity("accessed")
      // Sincronizar sesión con apps/copilot via AuthBridge (escribe dev-user-config en localStorage)
      if (config) {
        authBridge.syncFromFirebaseUser(getAuth().currentUser, config).catch(err =>
          console.warn('[AuthBridge] Sync no crítico:', err)
        );
      }
    } catch (error) {
      console.error("[moreInfo] ❌ Error obteniendo info del usuario:", error?.message || error)
      // Fallback: usar datos básicos de Firebase para no bloquear la app
      if (getAuth().currentUser) setUser(user)
    } finally {
      setVerificationDone(true)
    }
  }

  const verificator = async ({
    user,
    sessionCookie,
    skipSessionRestore = false,
  }: {
    user: any
    sessionCookie?: string | null
    skipSessionRestore?: boolean
  }) => {
    try {
      console.log("[Verificator] Iniciando verificación", {
        hasUser: !!user,
        userUid: user?.uid,
        hasSessionCookie: !!sessionCookie,
        sessionCookieLength: sessionCookie?.length,
        isStartingLogin: isStartingRegisterOrLogin,
        skipSessionRestore,
      })

      // Si estamos en proceso de login, no verificar aún (dar tiempo a que se obtenga la sessionCookie)
      if (isStartingRegisterOrLogin) {
        console.log("[Verificator] ⏸️ Login en proceso, saltando verificación")
        return
      }

      // SessionBodas: JWT API2 (parseSessionJwt). idToken: parseJwt (iss Firebase).
      const sessionCookieParsed =
        sessionCookie && typeof sessionCookie === 'string' ? parseSessionJwt(sessionCookie) : null
      const sessionUidFromCookie = getSessionUserIdFromToken(
        sessionCookie && typeof sessionCookie === 'string' ? sessionCookie : null
      )
      if (sessionUidFromCookie) skipApi2SessionRestoreKeyRef.current = null

      console.log("[Verificator] SessionCookie parseada:", {
        hasUserId: !!sessionUidFromCookie,
        userId: sessionUidFromCookie,
        matches: sessionUidFromCookie === user?.uid
      })

      if (!sessionUidFromCookie && user?.uid && !user?.isAnonymous && !skipSessionRestore) {
        const restoreLoopKey = `${user.uid}|${sessionCookie ?? ''}`
        if (skipApi2SessionRestoreKeyRef.current === restoreLoopKey) {
          console.warn('[Verificator] Evitando bucle: sessionBodas ya restaurada y sigue sin UID en JWT')
          setUser(user)
          moreInfo(user)
          return
        }
        console.warn("[Verificator] ⚠️ Usuario autenticado en Firebase pero sin sessionCookie válida")
        // FIX falsa sesión: intentar establecer sessionBodas desde el token Firebase antes de continuar
        // Solo para usuarios reales — los anónimos deben pasar por el SSO cross-domain más abajo
        try {
          const firebaseUser = getAuth().currentUser
          if (firebaseUser && !firebaseUser.isAnonymous) {
            const freshIdToken = await firebaseUser.getIdToken()
            const _isDevOrTest = typeof window !== 'undefined' && (
              window.location.hostname === 'localhost' ||
              window.location.hostname === '127.0.0.1' ||
              window.location.hostname.includes('-test.') ||
              window.location.hostname.includes('-dev.')
            )
            const sessionApiUrl = _isDevOrTest ? '/api/proxy-bodas/graphql' : (process.env.NEXT_PUBLIC_API_BODAS_URL || 'https://api2.eventosorganizador.com/graphql')
            const sessionResp = await fetch(sessionApiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Development': config?.development || 'bodasdehoy' },
              body: JSON.stringify({ query: queries.auth, variables: { idToken: freshIdToken } }),
            })
            if (sessionResp.ok) {
              const sessionJson = await sessionResp.json()
              const sessionResult: any = sessionJson?.data?.auth
              if (sessionResult?.sessionCookie) {
                const isDevLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
                const cookieDomain = isDevLocal ? undefined : (process.env.NEXT_PUBLIC_PRODUCTION ? config?.domain : (process.env.NEXT_PUBLIC_DOMINIO || '.bodasdehoy.com'))
                Cookies.set(config?.cookie, sessionResult.sessionCookie, {
                  domain: safeCookieDomain(cookieDomain),
                  expires: 365,
                  path: '/',
                  secure: window.location.protocol === 'https:',
                  sameSite: 'lax',
                })
                console.log('[Verificator] ✅ sessionBodas restablecida desde Firebase token')
                const restoredUid = getSessionUserIdFromToken(sessionResult.sessionCookie)
                const postRestoreKey = `${user.uid}|${sessionResult.sessionCookie}`
                if (restoredUid) {
                  await verificator({
                    user,
                    sessionCookie: sessionResult.sessionCookie,
                    skipSessionRestore: true,
                  })
                } else {
                  console.warn('[Verificator] Cookie auth sin UID reconocible en payload; se continúa con Firebase.')
                  skipApi2SessionRestoreKeyRef.current = postRestoreKey
                  setUser(user)
                  moreInfo(user)
                }
                return
              }
            }
          }
        } catch (sessionRestoreErr: any) {
          console.warn('[Verificator] ⚠️ No se pudo restablecer sessionBodas:', sessionRestoreErr?.message)
        }
        // No reintentar auth API2 en bucle por cada onAuthStateChanged si ya falló con esta cookie/uid
        skipApi2SessionRestoreKeyRef.current = restoreLoopKey
        // Fallback: continuar sin sessionBodas (acceso limitado)
        setUser(user)
        moreInfo(user) // ← setVerificationDone(true) se llama dentro de moreInfo
        return
      }
      if (sessionUidFromCookie && user?.uid) {
        if (sessionUidFromCookie !== user?.uid) {
          console.error("[Verificator] ❌ Usuario no coincide con sessionCookie!")
          console.error("[Verificator] Firebase UID:", user?.uid)
          console.error("[Verificator] SessionCookie UID:", sessionUidFromCookie)

          // La sessionCookie pertenece a otro usuario (p.ej. cookie caducada o SSO de otro tenant).
          // Usamos el usuario Firebase autenticado como fuente de verdad para no bloquear la UI
          // con un falso "modo gratuito" cuando el usuario sí está logueado en Firebase.
          setUser(user)
          moreInfo(user)
          return
        }
        if (sessionUidFromCookie === user?.uid) {
          console.log("[Verificator] ✅ Usuario verificado correctamente")
          setUser(user)
          moreInfo(user)
        }
      }
      if (sessionUidFromCookie && !user?.uid) {
        const resp = await fetchApiBodas({
          query: queries.authStatus,
          variables: { sessionCookie },
          development: config?.development
        });
        if (resp?.customToken) {
          setIsStartingRegisterOrLogin(true)
          await signInWithCustomToken(getAuth(), resp.customToken)
            .then(result => {
              setUser(result?.user)
              moreInfo(result?.user)
            }).catch(async (error) => {
              console.error('[Auth] signInWithCustomToken falló:', error?.code, error?.message)
              // Fallback: si tenemos userId de la sessionCookie, cargar datos del usuario directamente
              // Esto ocurre cuando el dominio no está autorizado en Firebase (ej. app-test.bodasdehoy.com)
              if (sessionUidFromCookie) {
                console.warn('[Auth] Fallback SSO: cargando usuario desde sessionCookie userId:', sessionUidFromCookie)
                try {
                  const userInfo = await fetchApiBodas({
                    query: queries.getUser,
                    variables: { uid: sessionUidFromCookie },
                    development: config?.development
                  })
                  if (userInfo) {
                    console.log('[Auth] ✅ Fallback SSO exitoso, usuario cargado:', userInfo?.email)
                    setUser({ uid: sessionUidFromCookie, ...userInfo })
                    setVerificationDone(true)
                    return
                  }
                } catch (fallbackErr) {
                  console.error('[Auth] Fallback SSO también falló:', fallbackErr)
                }
              }
              setVerificationDone(true)
            })
        } else {
          setVerificationDone(true)
        }
      }
      // SSO cross-domain: si no hay sessionCookie y no hay usuario real (o es anónimo),
      // pero hay idTokenV0.1.0 (p. ej. login en chat-dev/chat-test/chat), crear sesión automáticamente.
      // NOTA: Firebase crea sesión anónima automáticamente → !user?.uid no es suficiente.
      // Incluir user?.isAnonymous para que el SSO se intente también cuando Firebase resolvió como anónimo.
      if (!sessionCookie && (!user?.uid || user?.isAnonymous)) {
        // Race condition fix: tras redirect cross-domain (chat-test → app-test), el cookie
        // idTokenV0.1.0 puede llegar ligeramente después de que React hidrate. Esperar 800ms.
        let crossDomainIdToken = Cookies.get("idTokenV0.1.0")
        if (!crossDomainIdToken && typeof window !== 'undefined') {
          await new Promise(resolve => setTimeout(resolve, 800))
          crossDomainIdToken = Cookies.get("idTokenV0.1.0")
        }
        if (crossDomainIdToken) {
          console.log("[Verificator] 🔗 SSO cross-domain: idTokenV0.1.0 encontrado, creando sesión...")
          try {
            // IMPORTANTE: Usar fetch directo desde el NAVEGADOR (no proxy servidor) para que
            // Cloudflare no bloquee la petición.
            // En localhost/dev/test: usar proxy (evita CORS).
            // En prod: llamada directa — CF permite tráfico de navegadores reales.
            const _isDevOrTestSSO = typeof window !== 'undefined' && (
              window.location.hostname === 'localhost' ||
              window.location.hostname === '127.0.0.1' ||
              window.location.hostname.includes('-test.') ||
              window.location.hostname.includes('-dev.')
            );
            const ssoApiUrl = _isDevOrTestSSO ? '/api/proxy-bodas/graphql' : (process.env.NEXT_PUBLIC_API_BODAS_URL || 'https://api2.eventosorganizador.com/graphql');

            const ssoResp = await fetch(ssoApiUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Development': config?.development || 'bodasdehoy',
              },
              body: JSON.stringify({
                query: queries.auth,
                variables: { idToken: crossDomainIdToken },
              }),
            });

            if (!ssoResp.ok) {
              const errText = await ssoResp.text().catch(() => '')
              throw new Error(`SSO auth API returned ${ssoResp.status}: ${errText.substring(0, 300)}`)
            }
            const ssoJson = await ssoResp.json();
            const ssoAuthResult: any = ssoJson?.data?.auth;

            if (ssoAuthResult?.sessionCookie) {
              const isDevLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
              const cookieDomain = isDevLocal ? undefined : (process.env.NEXT_PUBLIC_PRODUCTION ? config?.domain : (process.env.NEXT_PUBLIC_DOMINIO || ".bodasdehoy.com"));
              Cookies.set(config?.cookie, ssoAuthResult.sessionCookie, {
                domain: cookieDomain,
                expires: 365,
              })
              console.log("[Verificator] ✅ SSO cross-domain: sessionBodas creada desde idTokenV0.1.0")
              // Re-verificar con la nueva cookie de sesión
              await verificator({ user: null, sessionCookie: ssoAuthResult.sessionCookie })
              return
            }
            // auth mutation returned OK but no sessionCookie — log and fall to Firebase fallback below
            console.warn("[Verificator] ⚠️ SSO cross-domain: auth mutation no devolvió sessionCookie. ssoJson:", JSON.stringify(ssoJson).substring(0, 300))
          } catch (ssoErr: any) {
            console.warn("[Verificator] ⚠️ SSO cross-domain: error creando sesión:", ssoErr?.message)
            // Limpiar el flag anti-loop para que login.js pueda redirigir a chat-test de nuevo
            if (typeof window !== 'undefined') sessionStorage.removeItem('sso_redirect_pending')
          }

          // Fallback: auth mutation falló o no devolvió sessionCookie.
          // Decodificar el idTokenV0.1.0 directamente (es un JWT Firebase válido).
          // Permite acceder a la app sin sessionBodas usando Bearer token para las APIs.
          // Evita que el usuario quede como "guest" cuando el SSO cross-domain falla.
          const fbPayload = parseJwt(crossDomainIdToken)
          if (fbPayload?.sub) {
            console.log("[Verificator] 🔄 SSO fallback: auth mutation sin resultado, autenticando con Firebase token directo (uid:", fbPayload.sub, ")")
            setUser({ uid: fbPayload.sub, email: fbPayload.email || '', displayName: fbPayload.name || '' })
            setVerificationDone(true)
            return
          }
        }
      }

      // IMPORTANTE: Solo crear guest si NO hay usuario autenticado en Firebase
      if (["bodasdehoy"].includes(config?.development) && !sessionCookie && !user?.uid) {
        console.log("[Verificator] Creando usuario guest (no hay sessionCookie ni usuario Firebase)")
        const cookieContent = JSON.parse(Cookies.get(config?.cookieGuest) ?? "{}")
        let guestUid = cookieContent?.guestUid
        if (!guestUid) {
          const dateExpire = new Date(new Date(new Date().getTime() + 365 * 24 * 60 * 60 * 1000))
          guestUid = nanoid(28)
          Cookies.set(config?.cookieGuest, JSON.stringify({ guestUid }), { domain: safeCookieDomain(config?.domain), expires: dateExpire })
        }
        setUser({ uid: guestUid, displayName: "guest" })
        setVerificationDone(true)
      } else if (user?.uid && !sessionUidFromCookie) {
        // Usuario autenticado en Firebase pero sin sessionCookie
        // Usar los datos de Firebase temporalmente
        console.log("[Verificator] ⚠️ Usuario autenticado en Firebase sin sessionCookie")
        console.log("[Verificator] Usando datos de Firebase mientras se resuelve el problema de la API")
        setUser(user)
        moreInfo(user)
      }
      if (!sessionUidFromCookie && !user?.uid) {
        setVerificationDone(true)
      }
    } catch (error) {
      console.error("[Verificator] ❌ Error en verificación:", error)
      console.error("[Verificator] Error detalles:", {
        message: error?.message,
        stack: error?.stack,
        name: error?.name
      })
      // ✅ CORRECCIÓN CRÍTICA: Establecer verificationDone incluso si hay error
      // Esto evita que la aplicación se quede en "Cargando..." indefinidamente
      setVerificationDone(true)
    }
  }

  // Geo después de verificar sesión: no compite con auth + primer fetch de eventos en el arranque.
  useEffect(() => {
    if (!verificationDone) return
    fetch('/api/geo').then(r => r.json()).then(setGeoInfo).catch(err => console.log("[GeoInfo]", err))
  }, [verificationDone, config?.development])

  // Mostrar botón "Continuar como invitado" tras 2s por si la verificación se cuelga
  useEffect(() => {
    const t = setTimeout(() => setShowSkipLoadingButton(true), 2000);
    return () => clearTimeout(t);
  }, []);

  // Cronómetro en overlay de auth (solo mientras verificationDone === false)
  useEffect(() => {
    if (verificationDone) {
      authBootStartRef.current = null;
      setAuthBootSeconds(0);
      return;
    }
    if (authBootStartRef.current === null) authBootStartRef.current = Date.now();
    const id = window.setInterval(() => {
      const s = Math.floor((Date.now() - (authBootStartRef.current ?? Date.now())) / 1000);
      setAuthBootSeconds(s);
    }, 300);
    return () => clearInterval(id);
  }, [verificationDone]);

  // Timeout de seguridad: desbloquear UI si la verificación se cuelga (antes 5s; algo más corto mejora sensación de carga).
  useEffect(() => {
    const t = setTimeout(() => {
      setVerificationDone((done) => {
        if (!done) {
          console.warn('[AuthContext] Timeout de carga (~3,5s), mostrando app');
          return true;
        }
        return done;
      });
    }, 3500);
    return () => clearTimeout(t);
  }, []);

  const handleSkipLoading = () => {
    const currentUser = getAuth().currentUser;
    const sessionCookie = Cookies.get(config?.cookie);
    setShowSkipLoadingButton(false);
    void verificator({ user: currentUser, sessionCookie });
  };

  // Pantalla mínima mientras no hay verificationDone (evita pantalla en blanco)
  const loadingScreen = (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white"
      role="status"
      aria-label="Cargando"
      style={{
        minHeight: '100vh',
        minWidth: '100vw',
        visibility: 'visible',
        opacity: 1,
      }}
    >
      <div style={{ pointerEvents: 'none' }}>
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-pink-500 mx-auto" />
        <p className="mt-4 text-gray-700 font-medium">Comprobando sesión y conexión…</p>
        <p className="mt-1 text-lg font-semibold tabular-nums text-primary">{authBootSeconds}s</p>
        <p className="mt-1 max-w-xs text-center text-sm text-gray-400">
          El contenido principal (banner, tarjetas) carga después de este paso. Si el contador sube mucho, suele ser red lenta o el servidor de datos.
        </p>
      </div>
      {showSkipLoadingButton && (
        <button
          type="button"
          onClick={handleSkipLoading}
          className="mt-6 px-4 py-2 rounded-lg bg-pink-500 text-white font-medium hover:bg-pink-600 transition"
          style={{ pointerEvents: 'auto' }}
        >
          Reintentar sesión
        </button>
      )}
    </div>
  );

  return (
    <AuthContext.Provider value={{
      usuariosTickets, setUsuariosTickets, selectTicket, setSelectTicket, EventTicket, setEventTicket, setActionModals, actionModals, user, setUser, verificationDone, setVerificationDone, config, setConfig, theme, setTheme, isActiveStateSwiper, setIsActiveStateSwiper, geoInfo, setGeoInfo, forCms, setForCms, setIsStartingRegisterOrLogin, link_id, SetLink_id, storage_id, SetStorage_id, linkMedia, SetLinkMedia, preregister, SetPreregister, SetWihtProvider, WihtProvider,
    }}>
      {verificationDone ? children : loadingScreen}
    </AuthContext.Provider>
  );
};

const AuthContextProvider = () => useContext(AuthContext)
export { AuthContextProvider, AuthProvider };
