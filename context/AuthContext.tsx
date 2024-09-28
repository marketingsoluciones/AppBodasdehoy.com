import { createContext, useContext, useState, useEffect } from "react";
import { getAuth, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth'
import Cookies from 'js-cookie'
import { nanoid, customAlphabet, } from 'nanoid'
import { developments } from "../firebase";
import { fetchApiBodas, fetchApiEventos, queries } from "../utils/Fetching";
import { initializeApp } from "firebase/app";
import { useRouter } from "next/router";
import { parseJwt } from "../utils/Authentication";
import { useActivity } from "../hooks/useActivity";

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
      setForCms(router?.query?.show === "iframe")
    }

    if (!link_id && router?.query?.link) {
      if (router?.query?._id) {
        fetchApiEventos({
          query: queries.getPreregister,
          variables: { _id: router?.query?._id }
        }).then((result: any) => {
          SetPreregister(JSON.parse(result ?? {}))
        })
      }
      SetLinkMedia(router?.query?.m)
      SetLink_id(router?.query?.link)
      if (![].includes(router?.query?.m?.toString()) || router?.query?._id) {
        router.push("/login?q=register")
      }
    }

    if (router?.query?.eventTicket) {

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
  }, [router])

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
      /* console.log(window.location) */
      const path = window.location.hostname
      //  const path = "https://www.eventosplanificador.com"
      /*  console.log("hostname:", path) */
      const c = path?.split(".")
      const idx = c?.findIndex(el => el === "com")
      /* console.log("isProduction:", idx) */
      /*--------------------------------------------------------------------*/
      const devDomain = ["bodasdehoy", "eventosplanificador", "eventosorganizador", "vivetuboda", "champagne-events"]
      const devSubdomain = [undefined, "invitado", "ticket"]
      const domainDevelop = !!idx && idx !== -1 ? c[idx - 1] : devDomain[4] /*<<<<<<<<<*/
      const subdomainDevelop = idx === -1 && devSubdomain[0] /*<<<<<<<<<*/
      /*--------------------------------------------------------------------*/
      resp = developments.filter(elem => elem.name === domainDevelop)[0]
      resp.subdomain = ["ticket", "testticket", "invitado", "testinvitado", "dev"].includes(c[0]) ? c[0] : subdomainDevelop

      //redireccion a: /RelacionesPublicas
      if (["ticket", "testticket"].includes(resp.subdomain) && window.location.pathname.split("/")[1] === "") {
        router.push("/RelacionesPublicas")
      }

      if (idx === -1 || window.origin.includes("://test")) {
        const directory = window.origin.includes("://test") ? process.env.NEXT_PUBLIC_DIRECTORY.replace("//", "//test.") : process.env.NEXT_PUBLIC_DIRECTORY
        /* console.log(window.origin, window.location.hostname, directory) */
        resp = {
          ...resp,
          domain: process.env.NEXT_PUBLIC_PRODUCTION ? resp?.domain : process.env.NEXT_PUBLIC_DOMINIO,
          pathDirectory: resp?.pathDirectory ? `${directory}` : undefined,
          pathLogin: resp?.pathLogin ? `${directory}/login` : undefined,
          pathSignout: resp?.pathSignout ? `${directory}/signout` : undefined,
          pathPerfil: resp?.pathPerfil ? `${directory}/configuracion` : undefined
        }
        /* console.log(222215, { domain: resp?.domain }) */
      }

      varGlobalDomain = resp?.domain
      varGlobalSubdomain = resp?.subdomain
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
      const user = getAuth().currentUser
      const sessionCookie = Cookies.get(config?.cookie);
      verificator({ user, sessionCookie })
    }
    if (isStartingRegisterOrLogin) {
      setIsStartingRegisterOrLogin(false)
    }
  }, [triggerAuthStateChanged])

  const moreInfo = async (user) => {
    /* console.log("moreInfo") */
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
    /* moreInfo && console.info("Tengo datos de la base de datos"); */
    /* console.log(100.004) */
    setUser({ ...user, ...moreInfo });
    updateActivity("accessed")
    //aqui fetch de accesed
    setVerificationDone(true)
    /* console.info("Guardo datos en contexto react"); */
  }

  const verificator = async ({ user, sessionCookie }) => {
    try {
      /* console.log(80000301, { "user?.uid": user?.uid }) */
      const sessionCookieParsed = parseJwt(sessionCookie)
      /* console.log(80000302, { "sessionCookieParsed?.user_id": sessionCookieParsed?.user_id }) */

      if (!sessionCookieParsed?.user_id && user?.uid) {
        /* console.log(0.00001) */
        getAuth().signOut().then(() => {
          setVerificationDone(true)
        })
      }

      if (sessionCookieParsed?.user_id && user?.uid) {
        if (sessionCookieParsed?.user_id !== user?.uid) {
          /*  console.log(0.00002) */
          getAuth().signOut().then(() => {
            /*  console.log(8000043, "signOut con éxito") */
            setVerificationDone(true)
          })
            .catch((error) => {
              console.log(error);
            });
        }

        if (sessionCookieParsed?.user_id === user?.uid) {
          /*  console.log(0.00003) */
          setUser(user)
          moreInfo(user)
        }
      }

      if (sessionCookieParsed?.user_id && !user?.uid) {
        /*  console.log(0.00004) */
        const resp = await fetchApiBodas({
          query: queries.authStatus,
          variables: { sessionCookie },
          development: config?.development
        });
        /* console.info("Llamo con mi sessionCookie para traerme customToken"); */
        if (resp?.customToken) {
          /* console.info("customTokenParse", parseJwt(resp.customToken)) */
          setIsStartingRegisterOrLogin(true)
          await signInWithCustomToken(getAuth(), resp.customToken)
            .then(result => {
              /* console.log(100.002) */
              setUser(result?.user)
              moreInfo(result?.user)
            }).catch(error => {
              console.log(error)
            })
        } else {
          /* console.log(0.00006) */
          //cambiar el tiempo duracion de sessioncookie y una semana, hacerlo coincidir expiracion de la cookie para que se borre y evaluarlo como se hace con los idtoken que si no exite se renueve
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
        /* console.log(100.003) */
        setUser({ uid: guestUid, displayName: "guest" })
        setVerificationDone(true)
      }

      if (!sessionCookieParsed?.user_id && !user?.uid) {
        /*   console.log(0.00005) */
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
    <AuthContext.Provider value={{
      usuariosTickets, setUsuariosTickets, selectTicket, setSelectTicket, EventTicket, setEventTicket, setActionModals, actionModals, user, setUser, verificationDone, setVerificationDone, config, setConfig, theme, setTheme, isActiveStateSwiper, setIsActiveStateSwiper, geoInfo, setGeoInfo, forCms, setForCms, setIsStartingRegisterOrLogin, link_id, SetLink_id, storage_id, SetStorage_id, linkMedia, SetLinkMedia, preregister, SetPreregister, SetWihtProvider, WihtProvider,
    }}>
      {verificationDone && children}
    </AuthContext.Provider>
  );
};

const AuthContextProvider = () => useContext(AuthContext)
export { AuthContextProvider, AuthProvider };
