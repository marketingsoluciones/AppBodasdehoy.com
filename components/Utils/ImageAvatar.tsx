import { FC } from "react"
import { detalle_compartidos_array } from "../../utils/Interfaces"

interface props {
  user: detalle_compartidos_array
}

export const ImageAvatar: FC<props> = ({ user }) => {
  const h = (str: string): string => {
    if (str) {
      str.slice(0, 2).charCodeAt(1).toString(16)
      const s = "#" + str.slice(0, 4).charCodeAt(2).toString(16) + str.slice(2, 7).charCodeAt(2).toString(16) + str.slice(5, 10).charCodeAt(2).toString(16)
      return s
    }
  }

  return (
    !!user?.photoURL
      ? <div className={`flex items-center justify-center text-white uppercase w-full h-full rounded-full overflow-hidden`}>
        <img src={user?.photoURL} className="rounded-full truncate overflow-hidden" />
      </div>
      : <div
        style={{ backgroundColor: h(user?.uid?.slice(-11)) }}
        className={`flex items-center justify-center text-white uppercase w-full h-full rounded-full text-[14px]`}
      >
        {user?.displayName
          ? (user?.displayName.split(" ").map(elem => elem.slice(0, 1).toUpperCase())).join("")
          : user?.email?.slice(0, 1)
        }
      </div>
  )
}