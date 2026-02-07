import { createContext, useState, useContext, useEffect } from "react";
import Loading from "../components/DefaultLayout/Loading";

const initialContext = {
  loading: false,
  setLoading: undefined,
}

const LoadingContext = createContext(initialContext);

const LoadingProvider = ({ children }) => {
  // Iniciar en false: el contenido se muestra; quien necesite loading lo pone a true.
  // Antes era true y dependía de Container para poner false; si Container no montaba a tiempo quedaba "Procesando" fijo.
  const [loading, setLoading] = useState(false);

  // Timeout de seguridad: si loading está activo por más de 3 segundos, desactivarlo automáticamente
  useEffect(() => {
    if (loading) {
      console.log('[Loading] Overlay de loading activado');
      const timeout = setTimeout(() => {
        console.warn('[Loading] ⚠️ Timeout de seguridad: desactivando loading después de 3s');
        setLoading(false);
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [loading]);

  return (
    <LoadingContext.Provider value={{ loading, setLoading }}>
      {loading && <Loading />}
      {children}
    </LoadingContext.Provider>
  );
};

const LoadingContextProvider = () => useContext(LoadingContext);

export { LoadingContextProvider, LoadingProvider };

