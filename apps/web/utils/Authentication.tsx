import { useCallback } from "react";
import { signInWithPopup, signInWithRedirect, UserCredential, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, getAuth } from 'firebase/auth';
import { useRouter } from "next/navigation";
import Cookies from 'js-cookie';
import { LoadingContextProvider, AuthContextProvider } from "../context";
import { fetchApiBodas, queries } from "./Fetching";
import { useToast } from "../hooks/useToast";
import { PhoneNumberUtil } from 'google-libphonenumber';
import { useActivity } from "../hooks/useActivity";
import { useTranslation } from "react-i18next";

export const phoneUtil = PhoneNumberUtil.getInstance();

export const parseJwt = (token) => {
  if (token) {
    let base64Url = token.split('.')[1];
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    let jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
  }
  return {}
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
      console.log("[Auth] Llamando auth mutation con development:", config?.development)
      const authResult: any = await fetchApiBodas({
        query: queries.auth,
        variables: { idToken: tokenID },
        development: config?.development
      });
      console.log("[Auth] Resultado de auth mutation:", {
        hasResult: !!authResult,
        hasSessionCookie: !!authResult?.sessionCookie,
        resultType: typeof authResult,
        resultKeys: authResult ? Object.keys(authResult) : [],
        error: authResult instanceof Error ? authResult.message : null
      })
      if (authResult?.sessionCookie) {
        const { sessionCookie } = authResult;
        // Setear en localStorage token JWT
        const dateExpire = new Date(new Date(new Date().getTime() + 365 * 24 * 60 * 60 * 1000))
        
        // Determinar el dominio correcto para la cookie
        const cookieDomain = config?.domain || (process.env.NEXT_PUBLIC_PRODUCTION ? config?.domain : process.env.NEXT_PUBLIC_DOMINIO) || ".bodasdehoy.com"
        
        console.log("[Auth] Estableciendo cookie sessionBodas (popup):", {
          cookie: config?.cookie,
          domain: cookieDomain,
          expires: dateExpire.toISOString()
        })
        
        Cookies.set(config?.cookie, sessionCookie, { 
          domain: cookieDomain, 
          expires: dateExpire,
          path: "/",
          secure: window.location.protocol === "https:",
          sameSite: "lax"
        });
        
        // Verificar que la cookie se estableció
        const cookieVerificada = Cookies.get(config?.cookie)
        if (cookieVerificada) {
          console.log("[Auth] ✅ Cookie sessionBodas establecida correctamente (popup)")
        } else {
          console.error("[Auth] ❌ Error: Cookie sessionBodas NO se estableció (popup)")
        }
        
        return sessionCookie
      } else {
        console.warn("No se pudo cargar la cookie de sesión por que hubo un problema")
        throw new Error("No se pudo cargar la cookie de sesión por que hubo un problema")
      }
    } else {
      console.warn("No hay tokenID para pedir la cookie de sesion")
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
          const dateExpire = new Date(parseJwt(idToken).exp * 1000)
          
          // Determinar el dominio correcto para la cookie idToken
          const idTokenDomain = process.env.NEXT_PUBLIC_PRODUCTION ? config?.domain : process.env.NEXT_PUBLIC_DOMINIO || ".bodasdehoy.com"
          
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
          fetchApiBodas({
            query: queries.getUser,
            variables: { uid: res.user.uid },
            development: config?.development
          }).then(async (moreInfo) => {
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
                const sessionCookie = Cookies.get(config?.cookie)
                const idToken = Cookies.get("idTokenV0.1.0")

                if (sessionCookie && idToken) {
                  console.log("[Auth] ✅ Cookies verificadas (popup), redirigiendo...")
                } else {
                  console.warn("[Auth] ⚠️ Algunas cookies no están presentes (popup):", {
                    sessionCookie: !!sessionCookie,
                    idToken: !!idToken
                  })
                }

                if (window.location.pathname === '/login' || window.location.pathname.includes('/login')) {
                  const queryD = new URLSearchParams(window.location.search).get('d')
                  const redirectPath = queryD || '/'
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
                  // Crear usuario en la API con rol por defecto
                  const createResult = await fetchApiBodas({
                    query: queries.createUser,
                    variables: {
                      uid: res.user.uid,
                      role: whoYouAre && whoYouAre !== "" ? [whoYouAre] : ["creator"]
                    },
                    development: config?.development
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

                    // Redirigir después del login exitoso
                    setTimeout(() => {
                      if (window.location.pathname === '/login' || window.location.pathname.includes('/login')) {
                        const queryD = new URLSearchParams(window.location.search).get('d')
                        const redirectPath = queryD || '/'
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
          })
        }
      } catch (error: any) {
        const errorCode: string = error?.code ? error.code : error?.message
        switch (errorCode) {
          case "auth/too-many-requests":
            toast("error", t("usuario o contraseña inválida"));
            break;
          case "user does not exist into events bd":
            toast("error", t("debes estar invitado a un evento para poder ingresar"));
            break;
          default:
            break;
        }


        toast("error", t("usuario o contraseña inválida"));
        console.log("error", error)
        console.log("errorCode", error?.code ? error.code : error?.message)
      }
      setLoading(false);
    },
    [getSessionCookie, router, setLoading, setUser, toast]
  );

  const _signOut = useCallback(async () => {
    Cookies.remove(config?.cookie, { domain: config?.domain ?? "" });
    Cookies.remove("idTokenV0.1.0", { domain: config?.domain ?? "" });
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

