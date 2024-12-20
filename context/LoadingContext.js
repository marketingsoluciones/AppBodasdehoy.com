import { createContext, useState, useContext, useEffect } from "react";
import Loading from "../components/DefaultLayout/Loading";

const initialContext = {
  loading: false,
  setLoading: undefined,
}

const LoadingContext = createContext(initialContext);

const LoadingProvider = ({ children }) => {
  const [loading, setLoading] = useState(true);
  return (
    <LoadingContext.Provider value={{ loading, setLoading }}>
      {loading && <Loading />}
      {children}
    </LoadingContext.Provider>
  );
};

const LoadingContextProvider = () => useContext(LoadingContext);

export { LoadingContextProvider, LoadingProvider };

