import { useCallback } from "react";
import { signInWithPopup, UserCredential, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, getAuth } from 'firebase/auth';
import { useRouter } from "next/router";
import Cookies from 'js-cookie';
import { LoadingContextProvider, AuthContextProvider } from "../context";
import { fetchApiBodas, queries } from "./Fetching";
import { useToast } from "../hooks/useToast";
import { PhoneNumberUtil } from 'google-libphonenumber';

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
  const { config, setUser, geoInfo } = AuthContextProvider();
  const toast = useToast();
  const router = useRouter();

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

  const signIn = useCallback(
    async (type: keyof typeof types, payload: any) => {
      //### Login por primera vez
      //1.- Verificar tipo de login y tomar del diccionario el metodo
      //2.- Obtener el tokenID del usuario
      //3.- Enviar tokenID a API para recibir la sessionCookie
      //4.- Almacenar en una cookie el token de la sessionCookie
      //5.- Mutar el contexto User de React con los datos de Firebase + MoreInfo (API BODAS)


      const types = {
        provider: async () => {
          try {
            const asdf = await signInWithPopup(getAuth(), payload)

            return asdf
          } catch (error: any) {
            setLoading(false);
            const er = error.toString().split(".")[0].split(": Error ")[1]
            if (er == "(auth/account-exists-with-different-credential)") {
              toast("error", "El correo asociado a su provedor ya se encuentra registrado en bodasdehoy.com");
            }
          }
        },
        credentials: async () => await signInWithEmailAndPassword(getAuth(), payload.identifier, payload.password)
      };

      // Autenticar con firebase
      try {
        const res: UserCredential | void = await types[type]();
        if (res) {

          // Solicitar datos adicionales del usuario
          const moreInfo = await fetchApiBodas({
            query: queries.getUser,
            variables: { uid: res.user.uid },
            development: config?.development
          });
          if (moreInfo?.status && res?.user?.email) {
            const token = (await res?.user?.getIdTokenResult())?.token;
            console.log(41001, token)
            const sessionCookie = await getSessionCookie(token)
            console.log(41001, sessionCookie)
            if (sessionCookie) { }
            // Actualizar estado con los dos datos
            setUser({ ...res.user, ...moreInfo });

            /////// REDIRECIONES ///////
            setLoading(true)
            router.push(`${router.query?.d}`)
            ///////////////////////////

          } else {
            toast("error", "aun no está registrado");
            //verificar que firebase me devuelva un correo del usuario
            if (res?.user?.email) {
              //seteo usuario temporal pasar nombre y apellido de firebase a formulario de registro
              //setUserTemp({ ...res.user });
              toast("success", "Seleccione quien eres y luego completa el formulario");
            } else {
              toast("error", "usted debe tener asociado un correo a su cuenta de proveedor");
            }
          }
        }
      } catch (error: any) {
        const errorCode: string = error?.code ? error.code : error?.message
        switch (errorCode) {
          case "auth/too-many-requests":
            toast("error", "usuario o contraseña inválida");
            break;
          case "user does not exist into events bd":
            toast("error", "debes estar invitado a un evento para poder ingresar");
            break;
          case "user does not exist into events bd":
            toast("error", "debes estar invitado a un evento para poder ingresar");
            break;
          default:
            break;
        }

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
    // router.push(config?.pathDirectory ? `${config?.pathDirectory}/signout?end=true` : "/")
  }, [router])



  return { signIn, _signOut, getSessionCookie, isPhoneValid };

};

