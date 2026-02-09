import { createContext, useContext, useState, useEffect } from "react";
import { getAuth, onAuthStateChanged, signInWithCustomToken, getRedirectResult } from 'firebase/auth'
import Cookies from 'js-cookie'
import { nanoid, customAlphabet, } from 'nanoid'
import { developments } from "../firebase";
import { fetchApiBodas, fetchApiEventos, queries } from "../utils/Fetching";
import { initializeApp } from "firebase/app";
import { useRouter, useSearchParams } from "next/navigation";
import { parseJwt } from "../utils/Authentication";
import { useActivity } from "../hooks/useActivity";
import { getStorage } from "firebase/storage";
import { isTestSubdomain } from "../utils/urlHelpers";

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
      /*--------------------------------------------------------------------*/
      const devDomain = ["bodasdehoy", "eventosplanificador", "eventosorganizador", "vivetuboda", "champagne-events", "annloevents", "miamorcitocorazon", "eventosintegrados", "ohmaratilano", "corporativozr", "theweddingplanner"]
      const devSubdomain = [undefined, "invitado", "ticket"]

      // En desarrollo local (localhost), usar bodasdehoy (index 0) para mejor compatibilidad
      const domainDevelop = !!idx && idx !== -1 ? c[idx - 1] : devDomain[0]
      console.log("[Auth Config] Using development domain:", domainDevelop, "idx:", idx, "hostname:", path)

      const subdomainDevelop = idx === -1 && devSubdomain[0]
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

      // Configurar debug token para App Check en desarrollo (localhost, chat-test o app-test)
      const debugHosts = ['localhost', 'chat-test.bodasdehoy.com', 'app-test.bodasdehoy.com']
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
      const isTestEnv = window.location.hostname.includes('chat-test') || window.location.hostname.includes('app-test') || window.location.hostname.includes('test.')
      const devBypass = sessionStorage.getItem('dev_bypass') === 'true'

      if (isTestEnv && devBypass) {
        console.log("[Auth] 🔓 Bypass de desarrollo activo para subdominio de test (NO localhost)")
        // Crear usuario de desarrollo simulado CON UID REAL
        const devUser = {
          uid: 'upSETrmXc7ZnsIhrjDjbHd7u2up1', // UID REAL de bodasdehoy.com@gmail.com
          email: 'bodasdehoy.com@gmail.com',
          displayName: 'Usuario Dev',
          role: ['creator'],
          status: true
        }
        setUser(devUser)
        setVerificationDone(true)
        return // Saltar todo el flujo de autenticación
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
              
              // Determinar el dominio correcto para la cookie idToken
              const idTokenDomain = process.env.NEXT_PUBLIC_PRODUCTION ? config?.domain : process.env.NEXT_PUBLIC_DOMINIO || ".bodasdehoy.com"
              
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
              const moreInfo = await fetchApiBodas({
                query: queries.getUser,
                variables: { uid: result.user.uid },
                development: config?.development
              })

              if (moreInfo?.status && result.user.email) {
                // Obtener sessionCookie
                const token = (await result.user.getIdTokenResult())?.token
                const authResult: any = await fetchApiBodas({
                  query: queries.auth,
                  variables: { idToken: token },
                  development: config?.development
                })

                if (authResult?.sessionCookie) {
                  const { sessionCookie } = authResult
                  // Establecer expiración de 365 días
                  const dateExpire = new Date(new Date(new Date().getTime() + 365 * 24 * 60 * 60 * 1000))
                  
                  // Determinar el dominio correcto para la cookie
                  // Para que funcione en todos los subdominios, usar .bodasdehoy.com
                  let cookieDomain = config?.domain || ""
                  if (!cookieDomain) {
                    cookieDomain = process.env.NEXT_PUBLIC_PRODUCTION ? config?.domain : process.env.NEXT_PUBLIC_DOMINIO || ".bodasdehoy.com"
                  }
                  // Asegurar que el dominio empiece con punto para subdominios
                  if (cookieDomain && !cookieDomain.startsWith('.')) {
                    cookieDomain = `.${cookieDomain.replace(/^https?:\/\//, '').split('/')[0]}`
                  }
                  
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
                // Esperar un momento para asegurar que las cookies se establezcan correctamente
                const queryD = new URLSearchParams(window.location.search).get('d')
                const redirectPath = queryD || '/'
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
                  window.location.href = config?.pathLogin || '/login'
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
    }
  }, [config]);

  useEffect(() => {
    if (triggerAuthStateChanged && !isStartingRegisterOrLogin) {
      const user = getAuth().currentUser
      const sessionCookie = Cookies.get(config?.cookie);
      verificator({ user, sessionCookie })
    }
    if (isStartingRegisterOrLogin) {
      setIsStartingRegisterOrLogin(false)
    }
  }, [triggerAuthStateChanged])

  // ✅ Timeout de seguridad: si la verificación no termina en 2s, mostrar la app (evita pantalla en blanco)
  useEffect(() => {
    const safetyTimeout = setTimeout(() => {
      if (!verificationDone) {
        console.warn('[Auth] Timeout de seguridad: estableciendo verificationDone=true a los 2s');
        setVerificationDone(true);
      }
    }, 2000);

    return () => clearTimeout(safetyTimeout);
  }, [verificationDone])

  const moreInfo = async (user) => {
    let idToken = Cookies.get("idTokenV0.1.0")
    if (!idToken) {
      idToken = await getAuth().currentUser?.getIdToken(true)
      const dateExpire = new Date(parseJwt(idToken ?? "").exp * 1000)
      Cookies.set("idTokenV0.1.0", idToken ?? "", { domain: process.env.NEXT_PUBLIC_PRODUCTION ? varGlobalDomain : process.env.NEXT_PUBLIC_DOMINIO, expires: dateExpire })
    }
    const moreInfo = await fetchApiBodas({
      query: queries.getUser,
      variables: { uid: user?.uid },
      development: config?.development
    });
    setUser({ ...user, ...moreInfo });
    updateActivity("accessed")
    setVerificationDone(true)
  }

  const verificator = async ({ user, sessionCookie }) => {
    try {
      const sessionCookieParsed = parseJwt(sessionCookie)
      if (!sessionCookieParsed?.user_id && user?.uid) {
        getAuth().signOut().then(() => {
          setVerificationDone(true)
        })
      }
      if (sessionCookieParsed?.user_id && user?.uid) {
        if (sessionCookieParsed?.user_id !== user?.uid) {
          getAuth().signOut().then(() => {
            setVerificationDone(true)
          })
            .catch((error) => {
              console.log(error);
              // ✅ CORRECCIÓN: Establecer verificationDone incluso si hay error
              setVerificationDone(true)
            });
        }
        if (sessionCookieParsed?.user_id === user?.uid) {
          setUser(user)
          moreInfo(user)
        }
      }
      if (sessionCookieParsed?.user_id && !user?.uid) {
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
            }).catch(error => {
              console.log(error)
              // ✅ CORRECCIÓN: Establecer verificationDone incluso si hay error
              setVerificationDone(true)
            })
        } else {
          setVerificationDone(true)
        }
      }
      if (["bodasdehoy"].includes(config?.development) && !sessionCookie) {
        const cookieContent = JSON.parse(Cookies.get(config?.cookieGuest) ?? "{}")
        let guestUid = cookieContent?.guestUid
        if (!guestUid) {
          const dateExpire = new Date(new Date(new Date().getTime() + 365 * 24 * 60 * 60 * 1000))
          guestUid = nanoid(28)
          Cookies.set(config?.cookieGuest, JSON.stringify({ guestUid }), { domain: `${config?.domain}`, expires: dateExpire })
        }
        setUser({ uid: guestUid, displayName: "guest" })
        setVerificationDone(true)
      }
      if (!sessionCookieParsed?.user_id && !user?.uid) {
        setVerificationDone(true)
      }
    } catch (error) {
      console.log(90002, error)
      // ✅ CORRECCIÓN CRÍTICA: Establecer verificationDone incluso si hay error
      // Esto evita que la aplicación se quede en "Cargando..." indefinidamente
      setVerificationDone(true)
    }
  }

  useEffect(() => {
    // getGeoInfo está en api.bodasdehoy.com, no en api2.eventosorganizador.com
    fetchApiBodas({
      query: queries.getGeoInfo,
      variables: {},
      development: config?.development || "bodasdehoy"
    }).then(geoInfo => setGeoInfo(geoInfo)).catch(err => console.log("[GeoInfo]", err))
  }, [config?.development])

  // Pantalla mínima mientras no hay verificationDone (evita pantalla en blanco)
  const loadingScreen = (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white"
      role="status"
      aria-label="Cargando"
      style={{ pointerEvents: 'none' }}
    >
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-pink-500" />
      <p className="mt-4 text-gray-700 font-medium">Cargando...</p>
      <p className="mt-1 text-sm text-gray-400">Si ves esto, la app está respondiendo (máx. 2 s)</p>
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
