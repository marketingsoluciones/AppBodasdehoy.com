import { useCallback, useEffect, useRef, useState } from "react"
import { EventContextProvider, LoadingContextProvider } from "../context";

export const useMounted = () => {
  const { setLoading } = LoadingContextProvider()
  const isMountedRef = useRef(true);
  const isMounted = useCallback(() => isMountedRef.current, []);
  //const [isMounted, setIsMounted] = useState(false)
  // useEffect(() => {
  //   if (!isMounted) {
  //     setIsMounted(true)
  //   }
  //   return () => {
  //     setIsMounted(false)
  //   }
  // }, [])

  useEffect(() => {
    if (isMounted) {
      //setTimeout(() => {
      setLoading(false)
      //}, 50);
    }
  }, [isMounted])
}
