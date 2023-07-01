import { createContext, useContext, useState, useEffect } from "react";
import { getAuth, signInWithCustomToken } from 'firebase/auth'
import Cookies from 'js-cookie'
import { nanoid } from 'nanoid'

import { developments } from "../firebase";
import { fetchApi, queries } from "../utils/Fetching";
import { boolean } from "yup";
import { initializeApp } from "firebase/app";

const initialContext = {
  user: null,
  setUser: () => null,
  verificationDone: boolean,
  setVerificationDone: () => false
}

const AuthContext = createContext(initialContext);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(initialContext.user);
  const [verificationDone, setVerificationDone] = useState(false);
  const [development, setDevelopment] = useState();
  const [domain, setDomain] = useState();
  const [config, setConfig] = useState();
  const [isProduction, setIsProduction] = useState(true)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    if (!isMounted) {
      setIsMounted(true)
    }
    return () => {
      setIsMounted(false)
    }
  }, [])


  useEffect(() => {
    if (isMounted) {
      const path = window.location.hostname //"https://www.bodasdehoy.com/"
      const c = path?.split(".")
      const idx = c?.findIndex(el => el === "com")
      /*--------------------------------------------------------------------*/
      const devDomain = ["bodasdehoy", "eventosplanificador"]
      const domainDevelop = !!idx && idx !== -1 ? c[idx - 1] : devDomain[1] /*<<<<<<<<<*/
      /*--------------------------------------------------------------------*/
      console.log({ path, c, idx, domainDevelop })
      const resp = developments.filter(elem => elem.name === domainDevelop)[0]
      if (!idx) {
        resp = {
          ...resp,
          domain: `${process.env.NEXT_PUBLIC_PATH_DEVELOPMENT}:3001`,
          pathDirectory: resp?.pathDirectory ? `${process.env.NEXT_PUBLIC_PATH_DEVELOPMENT}:3000` : undefined
        }
        setIsProduction(false)
      }
      setDevelopment(resp?.name)
      setDomain(resp?.name)
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
              const moreInfo = await fetchApi({
                query: queries.getUser,
                variables: { uid: user?.uid },
              });
              moreInfo && console.info("Tengo datos de la base de datos");
              setUser({ ...user, ...moreInfo });
              console.info("Guardo datos en contexto react");
            } else {
              console.info("NO tengo user de contexto de firebase");
              const { customToken } = await fetchApi({
                query: queries.authStatus,
                variables: { sessionCookie },
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
          Cookies.set("idToken", await user.getIdToken(), { domain: `.${domain}.com` })
        }
      })
    }
  }, [])


  return (
    <AuthContext.Provider value={{ user, setUser, verificationDone, setVerificationDone, development, setDevelopment, domain, setDomain, config, setConfig, isProduction }}>
      {children}
    </AuthContext.Provider>
  );
};

const AuthContextProvider = () => useContext(AuthContext)
export { AuthContextProvider, AuthProvider };
