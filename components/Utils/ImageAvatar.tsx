import { FC } from "react"

interface props {
  user: any
}

export const ImageAvatar: FC<props> = ({ user }) => {
  const h = (str: string): string => {
    str.slice(0, 2).charCodeAt(1).toString(16)
    const s = "#" + str.slice(0, 4).charCodeAt(2).toString(16) + str.slice(2, 7).charCodeAt(2).toString(16) + str.slice(5, 10).charCodeAt(2).toString(16)
    return s
  }

  return (
    user?.photoURL !== null
      ? <div className={`flex items-center justify-center text-white uppercase w-full h-full rounded-full`}>
        <img src={user?.photoURL} className="rounded-full" />
      </div>
      : <div
        style={{ backgroundColor: h(user.uid.slice(-11)) }}
        className={`flex items-center justify-center text-white uppercase w-full h-full rounded-full text-[10px]`}
      >
        {user?.displayName
          ? (user?.displayName.split(" ").map(elem => elem.slice(0, 1).toUpperCase())).join("")
          : user?.email?.slice(0, 1)
        }
      </div>
  )
}