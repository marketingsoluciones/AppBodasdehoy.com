import { useEffect, useState } from "react"
import { EventContextProvider, LoadingContextProvider } from "../context";

export const useMounted = () => {
  const { setLoading } = LoadingContextProvider()
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
      setTimeout(() => {
        setLoading()
      }, 50);
    }
  }, [isMounted])
}
