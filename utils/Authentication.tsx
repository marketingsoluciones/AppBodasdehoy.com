import { useCallback } from "react";
import { signInWithPopup, UserCredential, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, getAuth } from 'firebase/auth';
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
      const authResult: any = await fetchApiBodas({
        query: queries.auth,
        variables: { idToken: tokenID },
        development: config?.development
      });
      if (authResult?.sessionCookie) {
        const { sessionCookie } = authResult;
        // Setear en localStorage token JWT
        const dateExpire = new Date(new Date(new Date().getTime() + 365 * 24 * 60 * 60 * 1000))
        Cookies.set(config?.cookie, sessionCookie, { domain: config?.domain ?? "", expires: dateExpire });
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
      try {
        const asdf = await signInWithPopup(getAuth(), payload)
        if (asdf) {
          SetWihtProvider(true)
        }
        return asdf
      } catch (error: any) {
        setLoading(false);
        const er = error.toString().split(".")[0].split(": Error ")[1]
        if (er == "(auth/account-exists-with-different-credential)") {
          toast("error", `${"duplicateemail"} ${config?.domain}`);
        }
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
      setIsStartingRegisterOrLogin(true)
      //### Login por primera vez
      //1.- Verificar tipo de login y tomar del diccionario el metodo
      //2.- Obtener el tokenID del usuario
      //3.- Enviar tokenID a API para recibir la sessionCookie
      //4.- Almacenar en una cookie el token de la sessionCookie
      //5.- Mutar el contexto User de React con los datos de Firebase + MoreInfo (API BODAS)

      // Autenticar con firebase
      try {
        const res: UserCredential | void = await types[type](payload);
        if (res) {
          setLoading(true)
          const idToken = await res?.user?.getIdToken()
          const dateExpire = new Date(parseJwt(idToken).exp * 1000)
          Cookies.set("idTokenV0.1.0", idToken, { domain: process.env.NEXT_PUBLIC_PRODUCTION ? config?.domain : process.env.NEXT_PUBLIC_DOMINIO, expires: dateExpire })

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
            } else {
              console.log(100053)
              if (whoYouAre && whoYouAre !== "") {
                console.log(100054)
                // fetchApiBodas({
                //   query: queries.createUser,
                //   variables: {
                //     uid: res?.user?.uid,
                //     role: whoYouAre
                //   },
                //   development: config.development
                // }).then(async () => {
                //   await getSessionCookie(idToken)
                //   setUser({ ...res.user, role: [whoYouAre] });
                //   toast("success", t("Registro realizado con éxito"))
                //   updateActivity("registered")
                //   updateActivityLink("registered")

                // })
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

