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
          <ul className='bg-blue-400 opacity-70 p-1 text-sm font-display font-semibold ml-4 text-black'>
            <li>url: {window?.location?.hostname}</li>
            <li>domain: {config?.domain}</li>
            <li>event?.nombre: {event?.nombre}</li>
            <li>user: {user?.displayName}</li>
            <li>userUid: {user?.uid}</li>
            <li>userRoles: {`[${user?.role?.join(", ")}]`}</li>
            <li>size: {`${size.x}x${size.y}`}</li>
            {/* <li>sizeAvalible: {screen?.availHeight}</li> */}
          </ul>
          <div className="flex gap-2">
            <button
              onClick={() => {
                console.log(8000, "getAuth", getAuth())
                onAuthStateChanged(getAuth(), async (user) => {
                  console.log(user?.accessToken
                  )
                })
              }}
              type="button" className="rounded-lg bg-yellow-300 px-5 opacity-80 hover:opacity-100 hover:font-bold">algo1</button>
            <button
              onClick={async () => {
                const resp = await getAuth().currentUser.getIdToken(true)
                console.log(8001, "getAuth", resp)
                onAuthStateChanged(getAuth(), async (user) => {
                  console.log(user?.accessToken === resp)
                })
              }}
              type="button" className="rounded-lg bg-yellow-300 px-5 opacity-80 hover:opacity-100 hover:font-bold">algo2</button>
            <button
              onClick={async () => {
                socket?.emit(`app:message`, {
                  emit: user?.uid,
                  receiver: null,
                  type: "joinRoom",
                  payload: {
                    action: "add",
                    value: event._id
                  }
                });
              }}
              type="button" className="rounded-lg bg-yellow-300 px-5 opacity-80 hover:opacity-100 hover:font-bold">socketIO</button>
            <button
              onClick={async () => {
                socket?.emit(`app:message`, {
                  emit: user?.uid,
                  receiver: null,
                  type: "joinRoom",
                  payload: {
                    action: "del",
                    value: event._id
                  }
                })
              }}
              type="button" className="rounded-lg bg-yellow-300 px-5 opacity-80 hover:opacity-100 hover:font-bold">socketIO</button>
          </div>
        </div>
      }
    </>
  )
}