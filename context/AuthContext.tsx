import { createContext, useContext, useState, useEffect } from "react";
import { getAuth, onAuthStateChanged, onIdTokenChanged, signInWithCustomToken } from 'firebase/auth'
import Cookies from 'js-cookie'
import { nanoid } from 'nanoid'

import { developments } from "../firebase";
import { fetchApiBodas, fetchApiEventos, queries } from "../utils/Fetching";
import { boolean } from "yup";
import { initializeApp } from "firebase/app";
import { useRouter } from "next/router";
import { parseJwt } from "../utils/Authentication";

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
  setIsStartingRegisterOrLogin: undefined
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
}
export let varGlobalDomain = ""
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
  const router = useRouter()
  const [triggerAuthStateChanged, setTriggerAuthStateChanged] = useState<number | null>(null)
  const [isStartingRegisterOrLogin, setIsStartingRegisterOrLogin] = useState<boolean>()


  useEffect(() => {
    console.log("query", router?.query,)
    console.log("isIframe:", router?.query?.show === "iframe")
    if (!forCms) {
      setForCms(router?.query?.show === "iframe")
    }
  }, [router])

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
      console.log(window.location)
      const path = window.location.hostname
      //  const path = "https://www.eventosplanificador.com"
      console.log("hostname:", path)
      const c = path?.split(".")
      const idx = c?.findIndex(el => el === "com")
      console.log("isProduction:", idx)
      /*--------------------------------------------------------------------*/
      const devDomain = ["bodasdehoy", "eventosplanificador", "eventosorganizador", "vivetuboda"]
      const domainDevelop = !!idx && idx !== -1 ? c[idx - 1] : devDomain[1] /*<<<<<<<<<*/
      /*--------------------------------------------------------------------*/
      resp = developments.filter(elem => elem.name === domainDevelop)[0]
      if (idx === -1 || window.origin.includes("://test")) {
        const directory = window.origin.includes("://test") ? process.env.NEXT_PUBLIC_DIRECTORY.replace("//", "//test.") : process.env.NEXT_PUBLIC_DIRECTORY
        console.log(window.origin, window.location.hostname, directory)
        resp = {
          ...resp,
          domain: process.env.NEXT_PUBLIC_PRODUCTION ? resp?.domain : process.env.NEXT_PUBLIC_DOMINIO,
          pathDirectory: resp?.pathDirectory ? `${directory}` : undefined,
          pathLogin: resp?.pathLogin ? `${directory}/login` : undefined,
          pathSignout: resp?.pathSignout ? `${directory}/signout` : undefined,
          pathPerfil: resp?.pathPerfil ? `${directory}/configuracion` : undefined
        }
        console.log(222215, { domain: resp?.domain })
      }

      varGlobalDomain = resp?.domain
      varGlobalDevelopment = resp?.development
      setConfig(resp)
      try {
        initializeApp(resp?.fileConfig)
      } catch (error) {
        console.log(90001, error)
      }
    }
  }, [isMounted])

  useEffect(() => {
    if (isMounted && config) {
      onAuthStateChanged(getAuth(), async () => {
        setTriggerAuthStateChanged(new Date().getTime())
      });
    }
  }, [config]);

  useEffect(() => {
    if (triggerAuthStateChanged && !isStartingRegisterOrLogin) {
      console.log(800003000, "verificando")
      const user = getAuth().currentUser
      const sessionCookie = Cookies.get(config?.cookie);
      verificator({ user, sessionCookie })
    }
    if (!isStartingRegisterOrLogin) {
      setIsStartingRegisterOrLogin(false)
    }
  }, [triggerAuthStateChanged])

  const moreInfo = async (user) => {
    console.log("moreInfo")
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
    moreInfo && console.info("Tengo datos de la base de datos");
    console.log(100.004)
    setUser({ ...user, ...moreInfo });
    //aqui fetch de accesed
    setVerificationDone(true)
    console.info("Guardo datos en contexto react");
  }

  useEffect(() => {
    console.log(user)
  }, [user])


  const verificator = async ({ user, sessionCookie }) => {
    try {
      console.log(80000301, { "user?.uid": user?.uid })
      const sessionCookieParsed = parseJwt(sessionCookie)
      console.log(80000302, { "sessionCookieParsed?.user_id": sessionCookieParsed?.user_id })

      if (!sessionCookieParsed?.user_id && user?.uid) {
        console.log(0.00001)
        getAuth().signOut().then(() => {
          setVerificationDone(true)
        })
      }

      if (sessionCookieParsed?.user_id && user?.uid) {
        if (sessionCookieParsed?.user_id !== user?.uid) {
          console.log(0.00002)
          getAuth().signOut().then(() => {
            console.log(8000043, "signOut con éxito")
            setVerificationDone(true)
          })
            .catch((error) => {
              console.log(error);
            });
        }

        if (sessionCookieParsed?.user_id === user?.uid) {
          console.log(0.00003)
          console.log(100.001)
          setUser(user)
          moreInfo(user)
        }
      }

      if (sessionCookieParsed?.user_id && !user?.uid) {
        console.log(0.00004)
        const resp = await fetchApiBodas({
          query: queries.authStatus,
          variables: { sessionCookie },
          development: config?.development
        });
        console.info("Llamo con mi sessionCookie para traerme customToken");
        if (resp?.customToken) {
          console.info("customTokenParse", parseJwt(resp.customToken))
          await signInWithCustomToken(getAuth(), resp.customToken)
            .then(result => {
              console.log(100.002)
              setUser(result?.user)
              moreInfo(result?.user)
            }).catch(error => {
              console.log(error)
            })
        }
      }

      if (!["vivetuboda"].includes(config?.development) && !sessionCookie) {
        const cookieContent = JSON.parse(Cookies.get(config?.cookieGuest) ?? "{}")
        let guestUid = cookieContent?.guestUid
        if (!guestUid) {
          const dateExpire = new Date(new Date(new Date().getTime() + 365 * 24 * 60 * 60 * 1000))
          guestUid = nanoid(28)
          Cookies.set(config?.cookieGuest, JSON.stringify({ guestUid }), { domain: `${config?.domain}`, expires: dateExpire })
        }
        console.log(100.003)
        setUser({ uid: guestUid, displayName: "guest" })
        setVerificationDone(true)
      }

      if (!sessionCookieParsed?.user_id && !user?.uid) {
        console.log(0.00005)
        setVerificationDone(true)
      }

    } catch (error) {
      console.log(90002, error)
    }
  }

  useEffect(() => {
    fetchApiEventos({
      query: queries.getGeoInfo,
      variables: {},
    }).then(geoInfo => setGeoInfo(geoInfo)).catch(err => console.log(err))
  }, [])



  return (
    <AuthContext.Provider value={{ setActionModals, actionModals, user, setUser, verificationDone, setVerificationDone, config, setConfig, theme, setTheme, isActiveStateSwiper, setIsActiveStateSwiper, geoInfo, setGeoInfo, forCms, setForCms, setIsStartingRegisterOrLogin }}>
      {verificationDone && children}
    </AuthContext.Provider>
  );
};

const AuthContextProvider = () => useContext(AuthContext)
export { AuthContextProvider, AuthProvider };
