import { useEffect, useState } from "react"
import { AuthContextProvider, EventContextProvider } from "../context"

export const InfoDevelopment = () => {
  const { event } = EventContextProvider()
  const { config, user } = AuthContextProvider()
  const [isMounted, setIsMounted] = useState(false)
  const [isDevelopment, setIsDevelopment] = useState(false)
  const [size, setSize] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (!isMounted) {
      setIsMounted(true)
    }
    return () => {
      setIsMounted(false)
    }
  }, [])

  useEffect(() => {
    const path = window?.location?.hostname
    const c = path?.split(".")
    const idx = c?.findIndex(el => el === "com")
    setSize({ x: window?.innerWidth, y: window.innerHeight })
    setIsDevelopment(idx === -1)
  }, [isMounted])


  return (
    <>
      {isDevelopment &&
        <div className="absolute z-[1000]">
          <ul className='text-sm font-display font-semibold ml-4 text-gray-800'>
            <li>url: {window?.location?.hostname}</li>
            <li>domain: {config?.domain}</li>
            <li>event?.nombre: {event?.nombre}</li>
            <li>user: {user?.displayName}</li>
            <li>userUid: {user?.uid}</li>
            <li>size: {`${size.x}x${size.y}`}</li>
          </ul>
        </div>
      }
    </>
  )
}