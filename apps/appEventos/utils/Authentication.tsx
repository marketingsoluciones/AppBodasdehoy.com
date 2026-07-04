import { useCallback } from "react";
import { signInWithPopup, signInWithRedirect, UserCredential, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, getAuth } from 'firebase/auth';
import { useRouter } from "next/navigation";
import Cookies from 'js-cookie';
import { LoadingContextProvider, AuthContextProvider } from "../context";
import { fetchApiBodas, queries, getApiErrorMessage, lastFetchApiBodasError } from "./Fetching";
import { normalizeRedirectAfterLogin } from "./urlHelpers";
import { useToast } from "../hooks/useToast";
import { PhoneNumberUtil } from 'google-libphonenumber';
import { useActivity } from "../hooks/useActivity";
import { useTranslation } from "react-i18next";
import { authBridge, parseJwt } from '@bodasdehoy/shared/auth';

export { parseJwt }; // re-exportar para compatibilidad con imports existentes

/**
 * BUG-1 sesión fantasma (informe QA 21-jun): parseJwt() devuelve null si el
 * token está EXPIRADO, mal formado o vacío. Los call-sites legacy hacían
 * `parseJwt(token).exp * 1000` sin guard → TypeError "Cannot read properties
 * of null (reading 'exp')" → ErrorBoundary y usuario atrapado en UI fantasma.
 *
 * Helper safeJwtExpiry:
 *   · Si parseJwt OK + tiene exp → Date válido
 *   · Si parseJwt null o falta exp → undefined (consumer decide fallback)
 *
 * Si se pasa `onExpired` y el token resultó inválido/expirado, se llama —
 * útil para auto-cleanup desde sitios que pueden disparar logout (Cookies.set
 * sin expiry, por ejemplo, deja al cliente sin TTL aplicable).
 */
export function safeJwtExpiry(token: string | null | undefined, onExpired?: () => void): Date | undefined {
  if (!token) return undefined;
  const payload = parseJwt(token);
  if (!payload || typeof payload.exp !== 'number') {
    onExpired?.();
    return undefined;
  }
  return new Date(payload.exp * 1000);
}

export const phoneUtil = PhoneNumberUtil.getInstance();

/** En localhost el navegador rechaza cookies con domain=.bodasdehoy.com; omitir domain para que use el hostname actual */
function getCookieDomain(configDomain?: string): string | undefined {
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return undefined;
  }
  return configDomain || (process.env.NEXT_PUBLIC_PRODUCTION ? configDomain : process.env.NEXT_PUBLIC_DOMINIO) || '.bodasdehoy.com';
}

/**
 * BUG R4-002 (QA 30-jun): si AuthContext.config aún no está hidratado
 * cuando login completa, Cookies.set(resolveCookieName(config?.cookie), …) escribe una cookie
 * literal llamada "undefined" → basura en navegador + tracking imposible.
 * Helper centralizado con fallback al cookie estándar de bodasdehoy.
 */
function resolveCookieName(configCookie?: string): string {
  if (typeof configCookie === 'string' && configCookie.length > 0) return configCookie;
  console.warn('[Auth] config.cookie undefined — usando fallback "sessionBodas". Hidratación tardía de AuthContext.');
  return 'sessionBodas';
}

export const useAuthentication = () => {
  const { setLoading } = LoadingContextProvider();
  const { config, setUser, geoInfo, SetWihtProvider } = AuthContextProvider();
  const toast = useToast();
  const [updateActivity, updateActivityLink] = useActivity();
  const router = useRouter();
  const { t } = useTranslation()

  const isPhoneValid = (phone: string) => {
    try {
      if (phone[0] === "0") {
        phone = `+${phoneUtil.getCountryCodeForRegion(geoInfo.ipcountry)}${phone.slice(1, phone.length)}`
      }
      return phoneUtil.isValidNumber(phoneUtil.parseAndKeepRawInput(phone));
    } catch (error) {
      return false;
    }
  };

  const getSessionCookie = useCallback(async (tokenID: any): Promise<string | undefined> => {
    if (tokenID) {
      // BUG-LOGIN QA 30-jun: AuthContext hidrata `config.development` en
      // useEffect (async), pero el login puede dispararse antes de la 1ª
      // hidratación → development=undefined → api-mcp rechaza la auth.
      // Fallback derivado del hostname (app-dev/chat-dev → bodasdehoy).
      const fallbackDevelopment = (() => {
        if (typeof window === 'undefined') return 'bodasdehoy';
        const host = window.location.hostname || '';
        if (host === 'localhost' || host === '127.0.0.1') return 'bodasdehoy';
        const parts = host.split('.');
        const tenant = parts.length >= 3 ? parts[parts.length - 3] : null;
        if (tenant && tenant !== 'app-dev' && tenant !== 'chat-dev' && tenant !== 'app-test' && tenant !== 'chat-test' && tenant !== 'app' && tenant !== 'chat') {
          return tenant;
        }
        return 'bodasdehoy';
      })();
      const effectiveDevelopment = config?.development || fallbackDevelopment;
      // 4-jul: retirado diagnóstico tokenID temporal (R5, 30-jun). Backend
      // cerró save-user timeout el 1-jul (fix audit skipAudit) → tokens
      // Firebase se aceptan sin problema y el log era ruido de consola.
      // Si vuelve el "no tiene 3 partes", inspeccionar via DebugFooter.
      console.log("[Auth] Llamando auth mutation con development:", effectiveDevelopment);
      const authResult: any = await fetchApiBodas({
        query: queries.auth,
        variables: { idToken: tokenID },
        development: effectiveDevelopment
      });
      console.log("[Auth] Resultado COMPLETO de auth mutation:", authResult)
      console.log("[Auth] Análisis del resultado:", {
        hasResult: !!authResult,
        hasSessionCookie: !!authResult?.sessionCookie,
        resultType: typeof authResult,
        resultKeys: authResult ? Object.keys(authResult) : [],
        isError: authResult instanceof Error,
        errorMessage: authResult instanceof Error ? authResult.message : null,
        errorStack: authResult instanceof Error ? authResult.stack : null
      })
      if (authResult?.sessionCookie) {
        const { sessionCookie } = authResult;
        // Setear en localStorage token JWT
        const dateExpire = new Date(new Date(new Date().getTime() + 365 * 24 * 60 * 60 * 1000))

        const cookieDomain = getCookieDomain(config?.domain)

        // BUG-11 (informe QA 21-jun): diagnóstico ampliado y fallback.
        // Causas comunes de que Cookies.set no persista:
        //   · Valor >4096 bytes (límite browser por cookie)
        //   · Cross-site con SameSite=lax bloqueado en algunos browsers
        //   · 3rd-party cookies disabled (Safari ITP, modo incógnito strict)
        //   · Cuota total de cookies por dominio (>180 en Chrome)
        const sessionCookieSize = (typeof sessionCookie === 'string' ? sessionCookie.length : 0)
        console.log("[Auth] Estableciendo cookie sessionBodas (popup):", {
          cookie: config?.cookie,
          domain: cookieDomain,
          expires: dateExpire.toISOString(),
          valueSize: sessionCookieSize,
          tooLarge: sessionCookieSize > 4000
        })

        Cookies.set(resolveCookieName(config?.cookie), sessionCookie, {
          domain: cookieDomain,
          expires: dateExpire,
          path: "/",
          secure: window.location.protocol === "https:",
          sameSite: "lax"
        });

        // Verificar que la cookie se estableció. Si falla, reintentar tras un
        // breve delay (race con popup callback) antes de declarar fallo.
        let cookieVerificada = Cookies.get(resolveCookieName(config?.cookie))
        if (!cookieVerificada) {
          // BUG-CW-N05 (informe QA 23-jun): el popup de Firebase puede tener
          // race condition con Cookies.set en el callback. Reintentar 1 vez.
          await new Promise(resolve => setTimeout(resolve, 100))
          Cookies.set(resolveCookieName(config?.cookie), sessionCookie, {
            domain: cookieDomain,
            expires: dateExpire,
            path: "/",
            secure: window.location.protocol === "https:",
            sameSite: "lax"
          });
          cookieVerificada = Cookies.get(resolveCookieName(config?.cookie))
        }
        if (cookieVerificada) {
          console.log("[Auth] ✅ Cookie sessionBodas establecida correctamente (popup)")
        } else {
          // BUG-11 fallback: si la cookie falla (Safari ITP, tamaño, etc.) persistir
          // en localStorage para que api.ApiBodas tenga el token como Bearer.
          // No es óptimo (no cross-domain), pero evita que el usuario quede sin sesión.
          // BUG-CW-N05: bajamos de error a warn — el fallback funciona, no es bloqueante.
          console.warn("[Auth] ⚠️ Cookie sessionBodas NO se estableció (popup) tras reintento. Aplicando fallback localStorage.", {
            valueSize: sessionCookieSize,
            domain: cookieDomain,
            protocol: window.location.protocol,
            hint: sessionCookieSize > 4000
              ? "sessionCookie excede 4KB — backend debe acortar el JWT"
              : "browser rechazó (third-party cookies / ITP / SameSite). Fallback localStorage activo — la sesión funciona normalmente."
          })
          try {
            if (typeof window !== 'undefined') {
              localStorage.setItem('sessionBodas_fallback', sessionCookie)
            }
          } catch { /* quota / private mode */ }
        }

        return sessionCookie
      } else {
        // QA 30-jun: capturamos los errores GraphQL del backend para distinguir
        // "Timeout (3000ms) en Mongo save user" de otros fallos. Antes el toast
        // era genérico y el usuario aterrizaba en home como si no hubiera
        // pasado nada → bloqueo silencioso de E2E.
        const backendErrors = lastFetchApiBodasError?.errors || []
        const backendMessages = backendErrors
          .map((e: any) => e?.message)
          .filter(Boolean)
        const traceId = lastFetchApiBodasError?.traceId
        console.error("[Auth] ❌ No se recibió sessionCookie de la API")
        console.error("[Auth] authResult completo:", JSON.stringify(authResult, null, 2))
        console.error("[Auth] Config development:", effectiveDevelopment)
        console.error("[Auth] Backend errors[]:", backendMessages)
        if (traceId) console.error("[Auth] traceId:", traceId)
        const isMongoTimeout = backendMessages.some((m: string) =>
          /timeout.*mongo|mongo.*timeout|mongo save user/i.test(m),
        )
        if (isMongoTimeout) {
          try { toast("error", `🛑 El servidor de auth (api-mcp) no respondió a tiempo. Reintenta en unos segundos.${traceId ? ` [${traceId}]` : ''}`) } catch {}
        } else if (backendMessages.length > 0) {
          try { toast("error", `❌ Auth falló: ${backendMessages[0]}${traceId ? ` [${traceId}]` : ''}`) } catch {}
        }
        const reason = isMongoTimeout
          ? `Backend auth timeout (Mongo save user)`
          : backendMessages[0] || 'unknown'
        const err: any = new Error(`Login falló: ${reason}`)
        err.backendErrors = backendErrors
        err.traceId = traceId
        throw err
      }
    } else {
      console.warn("[Auth] No hay tokenID para pedir la cookie de sesion")
      throw new Error("No hay tokenID para pedir la cookie de sesion")
    }

  }, [])

  const types = {
    provider: async (payload: any) => {
      // Estrategia: Intentar popup primero (más rápido), si falla usar redirect
      const hostname = window.location.hostname
      console.log("[Auth] Iniciando login con provider, hostname:", hostname)
      SetWihtProvider(true)
      setLoading(true)

      // Primero intentar con popup (más rápido y mejor UX cuando funciona)
      try {
        console.log("[Auth] Intentando login con popup...")
        const result = await signInWithPopup(getAuth(), payload)
        console.log("[Auth] ✅ Popup exitoso")
        return result
      } catch (popupError: any) {
        console.log("[Auth] Popup falló:", popupError?.code, popupError?.message)

        // Si popup fue bloqueado o cerrado, intentar con redirect
        const shouldTryRedirect = [
          'auth/popup-blocked',
          'auth/popup-closed-by-user',
          'auth/cancelled-popup-request',
          'auth/internal-error'
        ].includes(popupError?.code)

        if (shouldTryRedirect) {
          console.log("[Auth] Popup no disponible, usando redirect...")
          try {
            // Guardar estado para saber que estamos esperando redirect
            sessionStorage.setItem('auth_redirect_pending', 'true')
            await signInWithRedirect(getAuth(), payload)
            // signInWithRedirect redirige, no retorna aquí
            return null
          } catch (redirectError: any) {
            console.error("[Auth] Error con redirect:", redirectError)
            setLoading(false)
            sessionStorage.removeItem('auth_redirect_pending')

            if (redirectError?.code === 'auth/unauthorized-domain') {
              toast("error", `⚠️ El dominio ${hostname} no está autorizado en Firebase. Contacta al administrador.`)
            } else {
              toast("error", `❌ Error al iniciar sesión. Intenta con email y contraseña.`)
            }
            return null
          }
        }

        // Otros errores de popup - no reintentar con redirect
        setLoading(false)
        if (popupError?.code === 'auth/unauthorized-domain') {
          toast("error", `⚠️ El dominio ${hostname} no está autorizado en Firebase. Contacta al administrador.`)
        } else if (popupError?.code === 'auth/account-exists-with-different-credential') {
          toast("error", `Este email ya está registrado con otro método de autenticación.`)
        } else if (popupError?.code === 'auth/operation-not-allowed') {
          toast("error", `⚠️ Este método de autenticación no está habilitado.`)
        } else {
          const errorMsg = popupError?.message || popupError?.code || 'Error desconocido'
          toast("error", `❌ Error al iniciar sesión: ${errorMsg}`)
        }
        throw popupError
      }
    },
    credentials: async (payload: any) => await signInWithEmailAndPassword(getAuth(), payload.identifier, payload.password),
  };


  interface propsSinnIn {
    type: keyof typeof types
    payload: any
    verificationId?: any
    setStage: any
    whoYouAre?: any
    setIsStartingRegisterOrLogin: any
  }

  const signIn = useCallback(
    async ({ type, payload, verificationId, setStage, whoYouAre, setIsStartingRegisterOrLogin }: propsSinnIn) => {
      console.log("[signIn] Iniciando proceso de autenticación, tipo:", type)
      setIsStartingRegisterOrLogin(true)
      //### Login por primera vez
      //1.- Verificar tipo de login y tomar del diccionario el metodo
      //2.- Obtener el tokenID del usuario
      //3.- Enviar tokenID a API para recibir la sessionCookie
      //4.- Almacenar en una cookie el token de la sessionCookie
      //5.- Mutar el contexto User de React con los datos de Firebase + MoreInfo (API BODAS)

      // Autenticar con firebase
      try {
        const res: UserCredential | void | null = await types[type](payload);
        // Si es null, significa que se usó redirect (popup bloqueado) o hubo un error manejado
        if (res === null) {
          setLoading(false);
          setIsStartingRegisterOrLogin(false);
          // Si se usó redirect, el usuario será redirigido y el resultado se manejará en getRedirectResult
          // Si hubo un error, el mensaje ya se mostró al usuario
          return;
        }
        if (res) {
          setLoading(true)
          const idToken = await res?.user?.getIdToken()
          // BUG-1 (informe QA 21-jun): safeJwtExpiry undefined → session cookie.
          const dateExpire = safeJwtExpiry(idToken)
          
          const idTokenDomain = getCookieDomain(config?.domain)
          
          console.log("[Auth] Estableciendo cookie idTokenV0.1.0 (popup):", {
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
            console.log("[Auth] ✅ Cookie idTokenV0.1.0 establecida correctamente (popup)")
          } else {
            console.error("[Auth] ❌ Error: Cookie idTokenV0.1.0 NO se estableció (popup)")
          }

          // Solicitar datos adicionales del usuario
          Promise.resolve({ status: true }).then(async (moreInfo) => {
            if (moreInfo?.status && res?.user?.email) {
              console.log(100052)
              const token = (await res?.user?.getIdTokenResult())?.token;
              const sessionCookie = await getSessionCookie(token)
              console.log(41001, parseJwt(sessionCookie))
              if (sessionCookie) { }
              // Actualizar estado con los dos datos
              setUser({ ...res.user, ...moreInfo })
              toast("success", t("Inició sesión con éxito"))
              updateActivity("logged")
              updateActivityLink("logged")

              // Redirigir después del login exitoso si estamos en la página de login
              // Esperar un momento para asegurar que las cookies se establezcan correctamente
              setTimeout(() => {
                // Verificar que las cookies estén establecidas
                const sessionCookie = Cookies.get(resolveCookieName(config?.cookie))
                const idToken = Cookies.get("idTokenV0.1.0")

                if (sessionCookie && idToken) {
                  console.log("[Auth] ✅ Cookies verificadas (popup), redirigiendo...")
                } else {
                  // QA 30-jun: si no hay cookies tras 1.5s, el SSO NO se
                  // consolidó (típicamente backend devolvió auth:null por
                  // timeout Mongo). NO redirigir a home — el usuario aterriza
                  // en landing pública sin saber qué pasó.
                  console.error("[Auth] ⚠️ Cookies de sesión faltantes tras login (popup):", {
                    sessionCookie: !!sessionCookie,
                    idToken: !!idToken
                  })
                  try { toast("error", "El login no se consolidó (cookies ausentes). Reintenta o contacta soporte.") } catch {}
                  return
                }

                if (window.location.pathname === '/login' || window.location.pathname.includes('/login')) {
                  const queryD = new URLSearchParams(window.location.search).get('d')
                  const redirectPath = normalizeRedirectAfterLogin(queryD || '/')
                  console.log("[Auth] Redirigiendo después de login exitoso (popup) a:", redirectPath)
                  router.push(redirectPath)
                }
              }, 1500)
            } else {
              console.log("[Auth] Usuario autenticado en Firebase pero sin datos en API, verificando...")

              // Si el usuario existe en Firebase pero no tiene datos en la API,
              // crear automáticamente el registro en la API en lugar de pedir registro
              if (res?.user?.uid && res?.user?.email) {
                console.log("[Auth] Creando usuario automáticamente en la API...")
                try {
                  // BUG-LOGIN QA 30-jun: mismo fix que getSessionCookie —
                  // config?.development puede estar undefined si createUser
                  // dispara antes de hidratar AuthContext.
                  const fallbackDev = (() => {
                    if (typeof window === 'undefined') return 'bodasdehoy';
                    const host = window.location.hostname || '';
                    if (host === 'localhost' || host === '127.0.0.1') return 'bodasdehoy';
                    const parts = host.split('.');
                    const tenant = parts.length >= 3 ? parts[parts.length - 3] : null;
                    if (tenant && tenant !== 'app-dev' && tenant !== 'chat-dev' && tenant !== 'app-test' && tenant !== 'chat-test' && tenant !== 'app' && tenant !== 'chat') {
                      return tenant;
                    }
                    return 'bodasdehoy';
                  })();
                  // Crear usuario en la API con rol por defecto
                  const createResult = await fetchApiBodas({
                    query: queries.createUser,
                    variables: {
                      uid: res.user.uid,
                      role: whoYouAre && whoYouAre !== "" ? [whoYouAre] : ["creator"]
                    },
                    development: config?.development || fallbackDev
                  })

                  if (createResult) {
                    console.log("[Auth] ✅ Usuario creado en API exitosamente")
                    const token = (await res?.user?.getIdTokenResult())?.token;
                    const sessionCookie = await getSessionCookie(token)

                    // Actualizar estado con los datos
                    setUser({ ...res.user, ...createResult, status: true })
                    toast("success", t("Inició sesión con éxito"))
                    updateActivity("logged")
                    updateActivityLink("logged")

                    // Redirigir después del login exitoso (sin enviar a otro subdominio)
                    setTimeout(() => {
                      if (window.location.pathname === '/login' || window.location.pathname.includes('/login')) {
                        const queryD = new URLSearchParams(window.location.search).get('d')
                        const redirectPath = normalizeRedirectAfterLogin(queryD || '/')
                        console.log("[Auth] Redirigiendo después de crear usuario a:", redirectPath)
                        router.push(redirectPath)
                      }
                    }, 1500)
                  } else {
                    console.log("[Auth] No se pudo crear usuario, mostrando registro")
                    setStage("register")
                  }
                } catch (createError) {
                  console.error("[Auth] Error creando usuario:", createError)
                  // Fallback: mostrar formulario de registro
                  setStage("register")
                }
              } else {
                console.log(100055)
                setStage("register")
              }
            }
          }).catch((err: any) => {
            setLoading(false);
            setIsStartingRegisterOrLogin(false);
            console.error('[Auth] Error al cargar usuario tras login:', err);
            const friendly = getApiErrorMessage(err);
            if (friendly) {
              toast('error', friendly);
            } else {
              toast('error', 'Sesión iniciada pero no se pudieron cargar tus datos. Comprueba tu conexión e inténtalo de nuevo.');
            }
          })
        }
      } catch (error: any) {
        setLoading(false);
        setIsStartingRegisterOrLogin(false);
        const errorCode: string = error?.code ?? error?.message ?? '';
        // BUG #5 QA 30-jun: el toast NO aparecía cuando Firebase devolvía
        // `auth/invalid-login-credentials` (Firebase v10+ con email enumeration
        // protection enabled). Lista ampliada para cubrir TODOS los códigos
        // de credencial-inválida que las versiones modernas pueden emitir.
        const isAuthCredentialError =
          errorCode === 'auth/invalid-credential' ||
          errorCode === 'auth/invalid-login-credentials' ||
          errorCode === 'auth/wrong-password' ||
          errorCode === 'auth/user-not-found' ||
          errorCode === 'auth/invalid-email' ||
          errorCode === 'auth/too-many-requests' ||
          errorCode === 'auth/user-disabled' ||
          errorCode === 'auth/account-exists-with-different-credential';
        console.error('[Auth] Login error code:', errorCode, '| message:', error?.message);
        if (isAuthCredentialError) {
          toast('error', t('usuario o contraseña inválida'));
        } else if (errorCode === 'user does not exist into events bd') {
          toast('error', t('debes estar invitado a un evento para poder ingresar'));
        } else if (error?.message?.includes('cookie de sesión') || error?.message?.includes('sessionCookie')) {
          toast('error', 'Sesión iniciada pero no se pudo guardar. Comprueba tu conexión e inténtalo de nuevo.');
        } else {
          const friendly = getApiErrorMessage(error);
          if (friendly) {
            toast('error', friendly);
          } else {
            const msg = error?.message || errorCode || 'Error al iniciar sesión';
            toast('error', msg.length > 80 ? 'Error al iniciar sesión. Reintenta o comprueba tu conexión.' : msg);
          }
        }
        // Re-throw para que el llamador (FormLogin) tenga safety-net si quiere
        // mostrar mensaje adicional o limpiar estado. Antes el error se
        // consumía y nadie más arriba sabía que el login falló.
        throw error;
      }
    },
    [getSessionCookie, router, setLoading, setUser, toast]
  );

  const _signOut = useCallback(async () => {
    Cookies.remove(config?.cookie, { domain: config?.domain ?? "" });
    Cookies.remove("idTokenV0.1.0", { domain: config?.domain ?? "" });
    authBridge.clearAuth();
    if (typeof window !== 'undefined') {
      ['dev_bypass', 'dev_bypass_email', 'dev_bypass_uid', 'dev_bypass_role', 'dev_bypass_eventos'].forEach(k => {
        localStorage.removeItem(k); sessionStorage.removeItem(k)
      })
      localStorage.removeItem('appEventos_activeEventId')
      // BUG-11 (informe QA 21-jun): limpiar fallback sessionBodas si se usó.
      localStorage.removeItem('sessionBodas_fallback')
    }
    signOut(getAuth());
    router.push(config?.pathDirectory ? `${config?.pathDirectory}/signout?end=true` : "/")
  }, [router])

  const resetPassword = async (values: any, setStage: any) => {// funcion para conectar con con firebase para enviar el correo 
    if (values?.identifier !== "") {
      try {
        await sendPasswordResetEmail(getAuth(), values?.identifier);
        setStage("login")
        toast("success", t("resetpassword"))
      } catch (error) {
        toast("error", t("Error, email no encontrado"))
        console.log(error);
      }
    } else {
      toast("error", t("introduce un correo"))
    }
  };

  return { signIn, _signOut, getSessionCookie, isPhoneValid, resetPassword };

};

