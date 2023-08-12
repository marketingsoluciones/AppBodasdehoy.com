import { createContext, useContext, useState, useEffect } from "react";
import { getAuth, signInWithCustomToken } from 'firebase/auth'
import Cookies from 'js-cookie'
import { nanoid } from 'nanoid'

import { developments } from "../firebase";
import { fetchApiBodas, queries } from "../utils/Fetching";
import { boolean } from "yup";
import { initializeApp } from "firebase/app";

const initialContext = {
  user: {},
  setUser: undefined,
  verificationDone: false,
  setVerificationDone: undefined,
  config: {},
  setConfig: undefined,
  isProduction: true,
  setIsProduction: undefined,
  theme: {},
  setTheme: undefined,
  isActiveStateSwiper: 0,
  setIsActiveStateSwiper: undefined
}

type Context = {
  user: any
  setUser: any
  verificationDone: any
  setVerificationDone: any
  config: any
  setConfig: any
  isProduction: any
  setIsProduction: any
  theme: any
  setTheme: any
  isActiveStateSwiper: any
  setIsActiveStateSwiper: any
}

const AuthContext = createContext<Context>(initialContext);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState<any>(initialContext.user);
  const [verificationDone, setVerificationDone] = useState<any>(false);
  const [config, setConfig] = useState<any>();
  const [isProduction, setIsProduction] = useState<any>(true)
  const [isMounted, setIsMounted] = useState<any>(false)
  const [isActiveStateSwiper, setIsActiveStateSwiper] = useState<any>(0);
  const [theme, setTheme] = useState<any>({
    primaryColor: undefined,
    secondaryColor: undefined,
    tertiaryColor: undefined,
    baseColor: undefined,
    colorScroll: undefined
  })

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
      //  const path = "https://www.eventosplanificador.com"
      console.log("hostname:", path)
      const c = path?.split(".")
      const idx = c?.findIndex(el => el === "com")
      console.log(idx)
      /*--------------------------------------------------------------------*/
      const devDomain = ["bodasdehoy", "eventosplanificador", "eventosorganizador"]
      const domainDevelop = !!idx && idx !== -1 ? c[idx - 1] : devDomain[1] /*<<<<<<<<<*/
      /*--------------------------------------------------------------------*/
      resp = developments.filter(elem => elem.name === domainDevelop)[0]
      if (idx === -1) {
        resp = {
          ...resp,
          domain: `${process.env.NEXT_PUBLIC_DOMINIO}`,
          pathDirectory: resp?.pathDirectory ? `${process.env.NEXT_PUBLIC_DIRECTORY}` : undefined,
          pathLogin: resp?.pathLogin ? `${process.env.NEXT_PUBLIC_DIRECTORY}/login` : undefined,
          pathSignout: resp?.pathSignout ? `${process.env.NEXT_PUBLIC_DIRECTORY}/signout` : undefined,
          pathPerfil: resp?.pathPerfil ? `${process.env.NEXT_PUBLIC_DIRECTORY}/configuracion` : undefined
        }
        setIsProduction(false)
      }
      try {
        const firebaseClient = initializeApp(resp?.fileConfig);
        firebaseClient
      } catch (error) {
        console.log(90001, error)
      }
      setConfig(resp)
    }
  }, [isMounted])

  useEffect(() => {
    try {
      if (isMounted) {
        getAuth().onAuthStateChanged(async (user) => {
          const sessionCookie = Cookies.get(config?.cookie);
          console.info("Verificando cookie", sessionCookie);
          //setUser(user)
          if (!sessionCookie) {
            let guestUid = Cookies.get(config?.cookieGuest)
            if (!guestUid) {
              guestUid = nanoid(28)
              Cookies.set(config?.cookieGuest, guestUid)
            }
            setUser({ uid: guestUid, displayName: "guest" })
          }
          if (sessionCookie) {
            console.info("Tengo cookie de sesion");
            if (user) {
              console.info("Tengo user de contexto firebase");
              const moreInfo = await fetchApiBodas({
                query: queries.getUser,
                variables: { uid: user?.uid },
                development: config?.development
              });
              moreInfo && console.info("Tengo datos de la base de datos");
              setUser({ ...user, ...moreInfo });
              console.info("Guardo datos en contexto react");
            } else {
              console.info("NO tengo user de contexto de firebase");
              const { customToken } = await fetchApiBodas({
                query: queries.authStatus,
                variables: { sessionCookie },
                development: config?.development
              });
              console.info("Llamo con mi sessionCookie para traerme customToken");
              console.info("Custom token", customToken)
              customToken && signInWithCustomToken(getAuth(), customToken);
              console.info("Hago sesion con el custom token");
            }
          }
          setTimeout(() => {
            setVerificationDone(true)
          }, 800);
        });
      }
    } catch (error) {
      console.log(90002, error)
    }
  }, [config]);

  useEffect(() => {
    if (user && user?.displayName !== "guest") {
      console.info("getAuth().onIdTokenChanged");
      getAuth().onIdTokenChanged(async user => {
        const sessionCookie = Cookies.get(config?.cookie);
        if (user && sessionCookie) {
          console.log(1111111, "Cookies.set: idToken en ", process.env.NEXT_PUBLIC_DOMINIO ?? "")
          Cookies.set("idToken", await user.getIdToken(), { domain: `.${resp?.domain}.com` })
        }
      })
    }
  }, [])


  return (
    <AuthContext.Provider value={{ user, setUser, verificationDone, setVerificationDone, config, setConfig, isProduction, setIsProduction, theme, setTheme, isActiveStateSwiper, setIsActiveStateSwiper }}>
      {children}
    </AuthContext.Provider>
  );
};

const AuthContextProvider = () => useContext(AuthContext)
export { AuthContextProvider, AuthProvider };
