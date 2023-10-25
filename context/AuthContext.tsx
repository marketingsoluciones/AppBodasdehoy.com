import { createContext, useContext, useState, useEffect } from "react";
import { getAuth, signInWithCustomToken } from 'firebase/auth'
import Cookies from 'js-cookie'
import { nanoid } from 'nanoid'

import { developments } from "../firebase";
import { fetchApiBodas, fetchApiEventos, queries } from "../utils/Fetching";
import { boolean } from "yup";
import { initializeApp } from "firebase/app";

const initialContext = {
  user: undefined,
  setUser: undefined,
  verificationDone: false,
  setVerificationDone: undefined,
  config: undefined,
  setConfig: undefined,
  isProduction: true,
  setIsProduction: undefined,
  theme: undefined,
  setTheme: undefined,
  isActiveStateSwiper: 0,
  setIsActiveStateSwiper: undefined,
  geoInfo: undefined,
  setGeoInfo: undefined,
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
  geoInfo: any,
  setGeoInfo: any,
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
  const [geoInfo, setGeoInfo] = useState<any>();

  useEffect(() => {
    if (!isMounted) {
      setIsMounted(true)
    }
    return () => {
      setIsMounted(false)
    }
  }, [])
  let resp: any = undefined
  let firebaseClient: any
  useEffect(() => {
    if (isMounted) {
      const path = window.location.hostname
      //  const path = "https://www.eventosplanificador.com"
      console.log("hostname:", path)
      const c = path?.split(".")
      const idx = c?.findIndex(el => el === "com")
      console.log(idx)
      /*--------------------------------------------------------------------*/
      const devDomain = ["bodasdehoy", "eventosplanificador", "eventosorganizador", "vivetuboda"]
      const domainDevelop = !!idx && idx !== -1 ? c[idx - 1] : devDomain[3] /*<<<<<<<<<*/
      /*--------------------------------------------------------------------*/
      resp = developments.filter(elem => elem.name === domainDevelop)[0]
      const directory = window.origin.includes("://test.") ? process.env.NEXT_PUBLIC_DIRECTORY.replace("//", "//test") : process.env.NEXT_PUBLIC_DIRECTORY
      console.log(window.origin, window.location.hostname, directory)
      if (idx === -1) {
        resp = {
          ...resp,
          domain: `${process.env.NEXT_PUBLIC_DOMINIO}`,
          pathDirectory: resp?.pathDirectory ? `${directory}` : undefined,
          pathLogin: resp?.pathLogin ? `${directory}/login` : undefined,
          pathSignout: resp?.pathSignout ? `${directory}/signout` : undefined,
          pathPerfil: resp?.pathPerfil ? `${directory}/configuracion` : undefined
        }
        setIsProduction(false)
      }
      try {
        firebaseClient = initializeApp(resp?.fileConfig);
        // firebaseClient
        console.log(8000041, getAuth())
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
              const dateExpire = new Date(new Date(new Date().getTime() + 365 * 24 * 60 * 60 * 1000))
              guestUid = nanoid(28)
              Cookies.set(config?.cookieGuest, guestUid, { domain: `.${resp?.domain}.com`, expires: dateExpire })
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
          const dateExpire = new Date(new Date(new Date().getTime() + 365 * 24 * 60 * 60 * 1000))
          Cookies.set("idToken", await user.getIdToken(), { domain: `.${resp?.domain}.com`, expires: dateExpire })
        }
      })
    }
  }, [])

  useEffect(() => {
    fetchApiEventos({
      query: queries.getGeoInfo,
      variables: {},
    }).then(geoInfo => setGeoInfo(geoInfo)).catch(err => console.log(err))
  }, [])



  return (
    <AuthContext.Provider value={{ user, setUser, verificationDone, setVerificationDone, config, setConfig, isProduction, setIsProduction, theme, setTheme, isActiveStateSwiper, setIsActiveStateSwiper, geoInfo, setGeoInfo }}>
      {children}
    </AuthContext.Provider>
  );
};

const AuthContextProvider = () => useContext(AuthContext)
export { AuthContextProvider, AuthProvider };
