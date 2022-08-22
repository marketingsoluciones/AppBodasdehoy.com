import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { signInWithCustomToken } from 'firebase/auth'
import Cookies from 'js-cookie'

import { auth } from "../firebase";
import { fetchApi, queries } from "../utils/Fetching";
import { boolean } from "yup";

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

  useEffect(() => {
    auth.onAuthStateChanged(async (user) => {
      const sessionCookie = Cookies.get("sessionBodas");
      console.info("Verificando cookie", sessionCookie);
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
          customToken && signInWithCustomToken(auth, customToken);
          console.info("Hago sesion con el custom token");
        }
      }
      setTimeout(() => {
        setVerificationDone(true)
      }, 800);
    });
  }, []);

  useEffect(() => {
    auth.onIdTokenChanged(async user => {
      const sessionCookie = Cookies.get("sessionBodas");
      if (user && sessionCookie) {
        console.log(1111111, "Cookies.set: idToken en ", process.env.NEXT_PUBLIC_DOMINIO ?? "")
        Cookies.set("idToken", await user.getIdToken())
      }
    })
  }, [])


  return (
    <AuthContext.Provider value={{ user, setUser, verificationDone, setVerificationDone }}>
      {children}
    </AuthContext.Provider>
  );
};

const AuthContextProvider = () => useContext(AuthContext)
export { AuthContextProvider, AuthProvider };
