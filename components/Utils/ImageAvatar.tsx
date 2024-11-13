import { FC, useState } from "react"
import { detalle_compartidos_array } from "../../utils/Interfaces"
import { useRouter } from "next/router"
import { GruposResponsablesArry } from "../Itinerario/MicroComponente"

interface props {
  user: detalle_compartidos_array
}

export const ImageAvatar: FC<props> = ({ user }) => {
  const [showName, setShowName] = useState<boolean>()
  const router = useRouter()
  const h = (str: string): string => {
    if (str) {
      str.slice(0, 2).charCodeAt(1).toString(16)
      const s = "#" + str.slice(0, 4).charCodeAt(2).toString(16) + str.slice(2, 7).charCodeAt(2).toString(16) + str.slice(5, 10).charCodeAt(2).toString(16)
      return s
    }
  }

  return (
    <div onMouseOver={() => {
      setShowName(true)
    }} onMouseOut={() => setShowName(false)} className="w-full h-full relative">
      {

        !!(user?.photoURL || user?.icon)
          ?
          <div className={`flex items-center justify-center text-white uppercase w-full h-full rounded-full overflow-hidden`}>
            <img src={
              user?.photoURL ? user?.photoURL : user?.icon
            }
              className="rounded-full truncate overflow-hidden"
            />
          </div>
          :
          <div
            style={{ backgroundColor: h(user?.uid?.slice(-11)) }}
            className={`flex items-center justify-center text-white uppercase w-full h-full rounded-full text-[14px]*`}
          >
            {
              user?.displayName
                ? (user?.displayName.split(" ").map(elem => elem.slice(0, 1).toUpperCase())).join("")
                : user?.email?.slice(0, 1)
            }
          </div>
      }

      {router.pathname != "/itinerario" && showName && <div style={{ right: 10, top: 30 }} className="absolute z-20 bg-black rounded-md flex items-center justify-center leading-[1.2] opacity-75">
        <span className="text-white text-[10px] py-1 px-2">
          {user?.displayName ? user?.displayName : user?.email}
        </span>
      </div>}
    </div>
  )
}