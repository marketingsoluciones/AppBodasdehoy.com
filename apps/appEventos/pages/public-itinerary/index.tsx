import { useEffect } from "react";
import { LoadingContextProvider } from "../../context";

const Event = () => {
  const { setLoading } = LoadingContextProvider();

  useEffect(() => {
    setLoading(true);
    window.location.replace("/");
  }, [setLoading]);

  return null;
};

export default Event;
