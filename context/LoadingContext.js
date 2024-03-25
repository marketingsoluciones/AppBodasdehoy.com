import { createContext, useState, useContext, useEffect } from "react";
import Loading from "../components/DefaultLayout/Loading";
import { useRouter } from "next/router";
import { useAllowedRouter } from "../hooks/useAllowed";

const initialContext = {
  loading: false,
  setLoading: undefined,
}

const LoadingContext = createContext(initialContext);

const LoadingProvider = ({ children }) => {
  const [isAllowedRouter] = useAllowedRouter()
  const [loading, setLoading] = useState(true);
  return (
    <LoadingContext.Provider value={{ loading, setLoading }}>
      {loading && <Loading />}
      {!isAllowedRouter() ? <Redirection /> : children}
    </LoadingContext.Provider>
  );
};

const LoadingContextProvider = () => useContext(LoadingContext);

export { LoadingContextProvider, LoadingProvider };

const Redirection = () => {
  const router = useRouter()
  useEffect(() => {
    router.push("/")
  }, [])
  return null
}
