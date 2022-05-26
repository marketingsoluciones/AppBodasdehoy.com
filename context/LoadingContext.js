import { createContext, useState, useContext } from "react";
import Loading from "../components/DefaultLayout/Loading";

const LoadingContext = createContext({
  loading: null,
  setLoading: () => null,
});

const LoadingProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  return (
    <LoadingContext.Provider value={{ loading, setLoading }}>
      {loading && <Loading />}
      {children}
    </LoadingContext.Provider>
  );
};

const LoadingContextProvider = () => useContext(LoadingContext);

export { LoadingContextProvider, LoadingProvider };
