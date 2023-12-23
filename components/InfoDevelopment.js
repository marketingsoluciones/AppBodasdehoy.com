import { useEffect, useState } from "react"
import { AuthContextProvider, EventContextProvider, SocketContextProvider } from "../context"
import { getAuth, onAuthStateChanged } from "firebase/auth"

export const InfoDevelopment = () => {
  const { event } = EventContextProvider()
  const { socket } = SocketContextProvider()
  const { config, user } = AuthContextProvider()
  const [isMounted, setIsMounted] = useState(false)
  const [isDevelopment, setIsDevelopment] = useState(false)
  const [size, setSize] = useState({ x: 0, y: 0 })
  const [showCookie, setShowCookie] = useState()

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
            <li>userRoles: {`[${user?.role?.join(", ")}]`}</li>
            <li>size: {`${size.x}x${size.y}`}</li>
            {/* <li>sizeAvalible: {screen?.availHeight}</li> */}
          </ul>
          <button
            onClick={() => {
              console.log(8000, "getAuth", getAuth())
              onAuthStateChanged(getAuth(), async (user) => {
                console.log(user?.accessToken
                )
              })
            }}
            type="button" className="rounded-lg bg-yellow-300 px-5 opacity-30 hover:opacity-75">algo1</button>
          <button
            onClick={async () => {
              const resp = await getAuth().currentUser.getIdToken(true)
              console.log(8001, "getAuth", resp)
              onAuthStateChanged(getAuth(), async (user) => {
                console.log(user?.accessToken === resp)
              })
            }}
            type="button" className="rounded-lg bg-yellow-300 px-5 opacity-30 hover:opacity-75">algo2</button>
          <button
            onClick={async () => {
              socket?.emit(`cms:message`, {
                chatID: "data?._id",
                receiver: "data?.addedes",
                data: {
                  type: "text",
                  message: "value",
                },
              });
            }}
            type="button" className="rounded-lg bg-yellow-300 px-5 opacity-30 hover:opacity-75">socketIO</button>
        </div>
      }
    </>
  )
}