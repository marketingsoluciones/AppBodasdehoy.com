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
}
export let varGlobalDomain = ""
const AuthContext = createContext<Context>(initialContext);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState<any>(initialContext.user);
  const [verificationDone, setVerificationDone] = useState<any>(false);
  const [config, setConfig] = useState<any>();
  const [isMounted, setIsMounted] = useState<boolean>(false)
  const [valirAutoLogout, setValirAutoLogout] = useState<boolean>(false)
  const [isActiveStateSwiper, setIsActiveStateSwiper] = useState<any>(0);
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
  useEffect(() => {
    console.log(74551100, user)
  }, [user])
  useEffect(() => {
    console.log(router?.query, router?.query?.show === "iframe")
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
      console.log(idx)
      /*--------------------------------------------------------------------*/
      const devDomain = ["bodasdehoy", "eventosplanificador", "eventosorganizador", "vivetuboda"]
      const domainDevelop = !!idx && idx !== -1 ? c[idx - 1] : devDomain[3] /*<<<<<<<<<*/
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
        console.log(222215, resp?.domain)
      }

      varGlobalDomain = resp?.domain

      try {
        initializeApp(resp?.fileConfig)
      } catch (error) {
        console.log(90001, error)
      }
      setConfig(resp)
    }
  }, [isMounted])


  useEffect(() => {
    try {
      if (isMounted) {
        console.log(800003000)

        onAuthStateChanged(getAuth(), async (user) => {
          const sessionCookie = Cookies.get(config?.cookie);
          console.log(8000030, resp?.cookie, sessionCookie, user)
          if (user?.uid) { setValirAutoLogout(true) }
          const asd = parseJwt(sessionCookie)
          console.log(800003002, asd)

          if (sessionCookie && getAuth()?.currentUser?.uid !== asd.user_id) {
            getAuth().signOut().then(() => {
              console.log(800003004, "borra cookie idtoken y session")
              Cookies.remove(resp?.cookie, { domain: resp?.domain ?? "" });
              Cookies.remove("idTokenV0.1.0", { domain: resp?.domain ?? "" });
              console.log(8000043, "signOut con éxito")
            })
              .catch((error) => {
                console.log(error);
              });
          }

          console.info(8000042, "Verificando cookie", user?.uid, asd?.user_id);
          if (user?.uid !== asd?.user_id) {
            console.log("entro para loguear de nuevo")
            const resp = await fetchApiBodas({
              query: queries.authStatus,
              variables: { sessionCookie },
              development: config?.development
            });
            const customToken = resp?.customToken
            console.info("Llamo con mi sessionCookie para traerme customToken");
            console.info("Custom token", customToken)
            customToken && signInWithCustomToken(getAuth(), customToken);
            console.info("Hago sesion con el custom token****");
          }
          //setUser(user)
          if (!["vivetuboda"].includes(config?.development) && !sessionCookie) {
            const cookieContent = JSON.parse(Cookies.get(config?.cookieGuest) ?? "{}")
            let guestUid = cookieContent?.guestUid
            if (!guestUid) {
              const dateExpire = new Date(new Date(new Date().getTime() + 365 * 24 * 60 * 60 * 1000))
              guestUid = nanoid(28)
              Cookies.set(config?.cookieGuest, JSON.stringify({ guestUid }), { domain: `${config?.domain}`, expires: dateExpire })
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
              setVerificationDone(true)
              console.info("Guardo datos en contexto react");
            } else {
              console.info("NO tengo user de contexto de firebase");
              const resp = await fetchApiBodas({
                query: queries.authStatus,
                variables: { sessionCookie },
                development: config?.development
              });
              const customToken = resp?.customToken
              console.info("Llamo con mi sessionCookie para traerme customToken");
              console.info("Custom token", customToken)
              customToken && signInWithCustomToken(getAuth(), customToken)
                .then(() => {
                  setVerificationDone(true)
                })
              console.info("Hago sesion con el custom token");
            }
          } else {
            setVerificationDone(true)
          }
        });
      }
    } catch (error) {
      console.log(90002, error)
    }
  }, [config]);

  useEffect(() => {
    if (user && user?.displayName !== "guest") {
      console.info("getAuth().onIdTokenChanged");
      onIdTokenChanged(getAuth(), async user => {
        const sessionCookie = Cookies.get(config?.cookie);
        if (user && sessionCookie) {
          console.log("///////////----->", user.getIdToken())
          const dateExpire = new Date(new Date(new Date().getTime() + 365 * 24 * 60 * 60 * 1000))
          Cookies.set("idTokenV0.1.0", await user.getIdToken(), { domain: `.${resp?.domain}.com`, expires: dateExpire })
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
    <AuthContext.Provider value={{ user, setUser, verificationDone, setVerificationDone, config, setConfig, theme, setTheme, isActiveStateSwiper, setIsActiveStateSwiper, geoInfo, setGeoInfo, forCms, setForCms }}>
      {verificationDone && children}
    </AuthContext.Provider>
  );
};

const AuthContextProvider = () => useContext(AuthContext)
export { AuthContextProvider, AuthProvider };
